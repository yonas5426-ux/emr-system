import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const TEST_CATEGORIES = [
  "Hematology",
  "Clinical Chemistry",
  "Urinalysis",
  "Stool",
  "Serology",
  "Microbiology",
  "Pathology",
  "Hormone",
  "Other",
];

const STATUSES = [
  "Ordered",
  "Collected",
  "Processing",
  "Completed",
  "Verified",
  "Doctor Review",
  "Reviewed",
];

const emptyOrder = {
  test_name: "",
  category: "Hematology",
  priority: "Routine",
  clinical_note: "",
};

const emptyResult = {
  result_value: "",
  result_unit: "",
  reference_range: "",
  result_note: "",
};

const emptyReview = {
  doctor_review_note: "",
};

export default function Laboratory({ appointment = null, user = null, goBack }) {
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [resultForm, setResultForm] = useState(emptyResult);
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOrders();
    loadPatients();
  }, [appointment?.patient_number]);

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("patient_number, first_name, middle_name, last_name, sex")
      .order("patient_number", { ascending: true });
    if (!error) setPatients(data || []);
  }

  async function loadOrders() {
    setLoading(true);
    let query = supabase
      .from("laboratory_orders")
      .select("*")
      .order("id", { ascending: false });

    if (appointment?.patient_number) {
      query = query.eq("patient_number", appointment.patient_number);
    }

    const { data, error } = await query;
    if (error) setMessage(error.message);
    setOrders(data || []);
    setLoading(false);
  }

  const patientMap = useMemo(() => {
    const map = {};
    patients.forEach((p) => {
      map[p.patient_number] = p;
    });
    return map;
  }, [patients]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const status = o.status || "Ordered";
      const statusOk = statusFilter === "All" || status === statusFilter;
      const categoryOk =
        categoryFilter === "All" || (o.category || "Other") === categoryFilter;
      const p = patientMap[o.patient_number];
      const patientText = `${p?.first_name || ""} ${p?.middle_name || ""} ${p?.last_name || ""}`.toLowerCase();
      const searchOk =
        !q ||
        String(o.patient_number || "").toLowerCase().includes(q) ||
        String(o.test_name || "").toLowerCase().includes(q) ||
        String(status).toLowerCase().includes(q) ||
        patientText.includes(q);
      return statusOk && categoryOk && searchOk;
    });
  }, [orders, search, statusFilter, categoryFilter, patientMap]);

  const counts = useMemo(() => {
    const c = {
      Ordered: 0,
      Collected: 0,
      Processing: 0,
      Completed: 0,
      Verified: 0,
      "Doctor Review": 0,
      Reviewed: 0,
    };
    orders.forEach((o) => {
      const status = o.status || "Ordered";
      if (c[status] !== undefined) c[status] += 1;
    });
    return c;
  }, [orders]);

  function patientName(patientNumber) {
    const p = patientMap[patientNumber];
    if (!p) return patientNumber || "-";
    return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
  }

  async function saveOrder(e) {
    e.preventDefault();
    if (!appointment?.patient_number) {
      setMessage("Select a patient from OPD/appointment before creating a laboratory order.");
      return;
    }
    if (!orderForm.test_name.trim()) {
      setMessage("Test name is required.");
      return;
    }

    const payload = {
      patient_number: appointment.patient_number,
      appointment_id: appointment.appointment_id
        ? Number(appointment.appointment_id)
        : appointment.id
        ? Number(appointment.id)
        : null,
      consultation_id: appointment.consultation_id
        ? Number(appointment.consultation_id)
        : null,
      order_date: new Date().toISOString().slice(0, 10),
      test_name: orderForm.test_name.trim(),
      category: orderForm.category,
      priority: orderForm.priority,
      clinical_note: orderForm.clinical_note || null,
      status: "Ordered",
      created_by: user?.id || null,
    };

    setLoading(true);
    const { error } = await supabase.from("laboratory_orders").insert([payload]);
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setOrderForm(emptyOrder);
    setShowOrderForm(false);
    setMessage("Laboratory order created successfully.");
    await loadOrders();
  }

  async function changeStatus(order, nextStatus) {
    const updates = { status: nextStatus };
    const now = new Date().toISOString();
    if (nextStatus === "Collected") updates.sample_collected_at = now;
    if (nextStatus === "Processing") updates.processing_started_at = now;

    const { error } = await supabase
      .from("laboratory_orders")
      .update(updates)
      .eq("id", order.id);

    if (error) setMessage(error.message);
    else {
      setMessage(`Order moved to ${nextStatus}.`);
      await loadOrders();
    }
  }

  function openResult(order) {
    setSelectedOrder(order);
    setResultForm({
      result_value: order.result_value || "",
      result_unit: order.result_unit || "",
      reference_range: order.reference_range || "",
      result_note: order.result_note || "",
    });
    setShowResultForm(true);
  }

  async function saveResult(e) {
    e.preventDefault();
    if (!selectedOrder) return;

    const { error } = await supabase
      .from("laboratory_orders")
      .update({
        ...resultForm,
        result_entered_at: new Date().toISOString(),
        status: "Completed",
      })
      .eq("id", selectedOrder.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setShowResultForm(false);
    setSelectedOrder(null);
    setMessage("Result saved. It is ready for laboratory verification.");
    await loadOrders();
  }

  async function verify(order) {
    const { error } = await supabase
      .from("laboratory_orders")
      .update({
        status: "Verified",
        verified_by: user?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (error) setMessage(error.message);
    else {
      setMessage("Laboratory result verified and sent for doctor review.");
      await loadOrders();
    }
  }

  function openDoctorReview(order) {
    setSelectedOrder(order);
    setReviewForm({ doctor_review_note: order.doctor_review_note || "" });
    setShowReviewForm(true);
  }

  async function saveDoctorReview(e) {
    e.preventDefault();
    if (!selectedOrder) return;

    const { error } = await supabase
      .from("laboratory_orders")
      .update({
        status: "Reviewed",
        doctor_review_note: reviewForm.doctor_review_note || null,
        doctor_reviewed_by: user?.id || null,
        doctor_reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedOrder.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setShowReviewForm(false);
    setSelectedOrder(null);
    setMessage("Laboratory result reviewed by doctor.");
    await loadOrders();
  }

  function viewResult(order) {
    setSelectedOrder(order);
    setResultForm({
      result_value: order.result_value || "",
      result_unit: order.result_unit || "",
      reference_range: order.reference_range || "",
      result_note: order.result_note || "",
    });
    setShowResultForm(true);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🧪 Laboratory</h1>
          <p style={styles.subtitle}>
            OPD → Laboratory Order → Sample Collection → Processing → Result Entry → Verification → Doctor Review
          </p>
        </div>
        <div style={styles.headerActions}>
          {goBack && <button style={styles.secondaryButton} onClick={goBack}>← Back</button>}
          <button style={styles.primaryButton} onClick={() => setShowOrderForm(true)}>+ New Lab Order</button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {appointment?.patient_number && (
        <div style={styles.patientBanner}>
          <strong>Patient: {patientName(appointment.patient_number)}</strong>
          <span>Card: {appointment.patient_number}</span>
        </div>
      )}

      <div style={styles.cards}>
        <Stat label="Orders" value={counts.Ordered} />
        <Stat label="Sample Collection" value={counts.Collected} />
        <Stat label="Processing" value={counts.Processing} />
        <Stat label="Result Entry" value={counts.Completed} />
        <Stat label="Verification" value={counts.Verified} />
        <Stat label="Doctor Review" value={counts["Doctor Review"]} />
        <Stat label="Reviewed" value={counts.Reviewed} />
      </div>

      <div style={styles.toolbar}>
        <input style={styles.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search patient, card number, test or status..." />
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select style={styles.select} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {TEST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {showOrderForm && (
        <Modal title="New Laboratory Order" onClose={() => setShowOrderForm(false)}>
          <form onSubmit={saveOrder}>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Patient Card Number" value={appointment?.patient_number || ""} readOnly />
              <input style={styles.input} placeholder="Patient Name" value={appointment?.patient_number ? patientName(appointment.patient_number) : "No patient selected"} readOnly />
              <input style={styles.input} placeholder="Test Name *" value={orderForm.test_name} onChange={(e) => setOrderForm({ ...orderForm, test_name: e.target.value })} />
              <select style={styles.input} value={orderForm.category} onChange={(e) => setOrderForm({ ...orderForm, category: e.target.value })}>
                {TEST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select style={styles.input} value={orderForm.priority} onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}>
                <option>Routine</option><option>Urgent</option><option>STAT</option>
              </select>
              <textarea style={{ ...styles.input, minHeight: 100, gridColumn: "1 / -1" }} placeholder="Clinical Note" value={orderForm.clinical_note} onChange={(e) => setOrderForm({ ...orderForm, clinical_note: e.target.value })} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.primaryButton} type="submit" disabled={loading}>💾 Save Order</button>
              <button style={styles.secondaryButton} type="button" onClick={() => setShowOrderForm(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {showResultForm && selectedOrder && (
        <Modal title={`Laboratory Result — ${selectedOrder.test_name}`} onClose={() => setShowResultForm(false)}>
          <div style={styles.resultSummary}>
            <p><strong>Patient:</strong> {patientName(selectedOrder.patient_number)}</p>
            <p><strong>Category:</strong> {selectedOrder.category || "Other"}</p>
            <p><strong>Status:</strong> {selectedOrder.status || "Ordered"}</p>
          </div>
          <form onSubmit={saveResult}>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Result Value" value={resultForm.result_value} onChange={(e) => setResultForm({ ...resultForm, result_value: e.target.value })} />
              <input style={styles.input} placeholder="Unit" value={resultForm.result_unit} onChange={(e) => setResultForm({ ...resultForm, result_unit: e.target.value })} />
              <input style={styles.input} placeholder="Reference Range" value={resultForm.reference_range} onChange={(e) => setResultForm({ ...resultForm, reference_range: e.target.value })} />
              <textarea style={{ ...styles.input, minHeight: 120, gridColumn: "1 / -1" }} placeholder="Result Note / Interpretation" value={resultForm.result_note} onChange={(e) => setResultForm({ ...resultForm, result_note: e.target.value })} />
            </div>
            <div style={styles.modalActions}>
              {selectedOrder.status !== "Verified" && selectedOrder.status !== "Reviewed" && <button style={styles.primaryButton} type="submit">💾 Save Result</button>}
              <button style={styles.secondaryButton} type="button" onClick={() => setShowResultForm(false)}>Close</button>
            </div>
          </form>
        </Modal>
      )}

      {showReviewForm && selectedOrder && (
        <Modal title={`Doctor Review — ${selectedOrder.test_name}`} onClose={() => setShowReviewForm(false)}>
          <div style={styles.resultSummary}>
            <p><strong>Patient:</strong> {patientName(selectedOrder.patient_number)}</p>
            <p><strong>Result:</strong> {selectedOrder.result_value || "-"} {selectedOrder.result_unit || ""}</p>
            <p><strong>Reference Range:</strong> {selectedOrder.reference_range || "-"}</p>
            <p><strong>Laboratory Note:</strong> {selectedOrder.result_note || "-"}</p>
          </div>
          <form onSubmit={saveDoctorReview}>
            <textarea style={{ ...styles.input, minHeight: 150 }} placeholder="Doctor Review / Interpretation / Plan" value={reviewForm.doctor_review_note} onChange={(e) => setReviewForm({ doctor_review_note: e.target.value })} />
            <div style={styles.modalActions}>
              <button style={styles.primaryButton} type="submit">🩺 Complete Doctor Review</button>
              <button style={styles.secondaryButton} type="button" onClick={() => setShowReviewForm(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Laboratory Queue</h2>
        {loading && <p>Loading...</p>}
        {!loading && filteredOrders.length === 0 && <p>No laboratory orders found.</p>}
        {!loading && filteredOrders.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>Patient</th><th style={styles.th}>Test</th><th style={styles.th}>Category</th><th style={styles.th}>Priority</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th>
              </tr></thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const status = order.status || "Ordered";
                  return (
                    <tr key={order.id}>
                      <td style={styles.td}><strong>{patientName(order.patient_number)}</strong><br /><small>{order.patient_number}</small></td>
                      <td style={styles.td}>{order.test_name}</td>
                      <td style={styles.td}>{order.category || "Other"}</td>
                      <td style={styles.td}>{order.priority || "Routine"}</td>
                      <td style={styles.td}><span style={statusStyle(status)}>{status}</span></td>
                      <td style={styles.td}>
                        {status === "Ordered" && <button style={styles.smallButton} onClick={() => changeStatus(order, "Collected")}>🩸 Collect</button>}
                        {status === "Collected" && <button style={styles.smallButton} onClick={() => changeStatus(order, "Processing")}>🔬 Process</button>}
                        {status === "Processing" && <button style={styles.smallButton} onClick={() => openResult(order)}>📝 Result Entry</button>}
                        {status === "Completed" && <button style={styles.smallButton} onClick={() => verify(order)}>✅ Verify</button>}
                        {status === "Verified" && <button style={styles.smallButton} onClick={() => openDoctorReview(order)}>🩺 Doctor Review</button>}
                        {status === "Doctor Review" && <button style={styles.smallButton} onClick={() => openDoctorReview(order)}>🩺 Doctor Review</button>}
                        {status === "Reviewed" && <button style={styles.smallButton} onClick={() => viewResult(order)}>👁 View Result</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div style={styles.card}><div>{label}</div><strong style={styles.number}>{value}</strong></div>;
}

function Modal({ title, children, onClose }) {
  return <div style={styles.overlay}><div style={styles.modal}><div style={styles.modalHeader}><h2>{title}</h2><button style={styles.close} onClick={onClose}>×</button></div>{children}</div></div>;
}

function statusStyle(status) {
  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #aaa",
    fontWeight: 700,
    background: status === "Reviewed" ? "#e8f7e8" : "#f5f5f5",
  };
}

const styles = {
  page: { fontFamily: '"Times New Roman", Times, serif', fontSize: 18, padding: 28, background: "#f7f7f7", minHeight: "100vh", color: "#111" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 20 },
  title: { margin: 0, fontSize: 34 },
  subtitle: { margin: "7px 0 0", fontSize: 19 },
  headerActions: { display: "flex", gap: 10 },
  primaryButton: { border: "1px solid #333", borderRadius: 7, padding: "12px 18px", fontFamily: "inherit", fontSize: 18, fontWeight: 700, cursor: "pointer", background: "#fff" },
  secondaryButton: { border: "1px solid #777", borderRadius: 7, padding: "12px 18px", fontFamily: "inherit", fontSize: 18, fontWeight: 700, cursor: "pointer", background: "#fff" },
  message: { padding: 12, marginBottom: 16, border: "1px solid #aaa", borderRadius: 7, background: "#fff" },
  patientBanner: { display: "flex", gap: 30, flexWrap: "wrap", padding: 15, border: "1px solid #999", borderRadius: 8, background: "#fff", marginBottom: 18 },
  cards: { display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 12, marginBottom: 22 },
  card: { border: "1px solid #aaa", borderRadius: 9, padding: 16, background: "#fff", textAlign: "center" },
  number: { display: "block", fontSize: 30, marginTop: 8 },
  toolbar: { display: "grid", gridTemplateColumns: "1fr 190px 210px", gap: 10, marginBottom: 22 },
  search: { width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #999", borderRadius: 7, fontFamily: "inherit", fontSize: 18 },
  select: { padding: 13, border: "1px solid #999", borderRadius: 7, fontFamily: "inherit", fontSize: 18, background: "#fff" },
  section: { border: "1px solid #aaa", borderRadius: 9, background: "#fff", padding: 20 },
  sectionTitle: { marginTop: 0 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { borderBottom: "2px solid #777", padding: 12, textAlign: "left", whiteSpace: "nowrap" },
  td: { borderBottom: "1px solid #ddd", padding: 12, verticalAlign: "top" },
  smallButton: { margin: "2px 5px 2px 0", padding: "8px 11px", border: "1px solid #777", borderRadius: 6, background: "#fff", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 },
  modal: { width: "min(850px, 96vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 10, border: "2px solid #333", padding: 22 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  close: { border: 0, background: "transparent", fontSize: 32, cursor: "pointer" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  input: { width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #999", borderRadius: 7, fontFamily: "inherit", fontSize: 18 },
  modalActions: { display: "flex", gap: 10, marginTop: 18 },
  resultSummary: { border: "1px solid #ccc", borderRadius: 8, padding: 14, marginBottom: 18, background: "#fafafa" },
};
