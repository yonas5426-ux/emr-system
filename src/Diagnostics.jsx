import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const MODULES = [
  ["Sample Collection", "🧪"],
  ["Laboratory", "🔬"],
  ["Microbiology", "🦠"],
  ["Imaging", "🩻"],
  ["Endoscopy", "🔎"],
  ["Pathology", "🧫"],
  ["Ophtha Investigation", "👁️"],
  ["Blood Bank", "🩸"],
  ["PITC", "🧑‍⚕️"],
  ["Diagnostic Setting", "⚙️"],
];

const money = (value) => Number(value || 0).toFixed(2);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function paymentForInvestigation(investigation, transactions) {
  const patientNumber =
    investigation.opd_encounters?.patient_number || "";

  const testName = normalize(investigation.test_name);

  const matching = transactions.filter((tx) => {
    if (String(tx.patient_number || "") !== String(patientNumber)) {
      return false;
    }

    const description = normalize(tx.description);

    // A billing item for an investigation normally contains the test name.
    // If there is no description match, do not accidentally treat another
    // service for the same patient as payment for this investigation.
    return (
      testName &&
      description &&
      (description.includes(testName) || testName.includes(description))
    );
  });

  // Most recent matching transaction wins.
  matching.sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
  );

  const tx = matching[0];

  return {
    transaction: tx || null,
    status: tx?.payment_status || "Unpaid",
    paid: normalize(tx?.payment_status) === "paid",
    amount: tx?.total_amount || 0,
  };
}

export default function Diagnostics({
  section = "Sample Collection",
  user,
}) {
  const [rows, setRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [resultNote, setResultNote] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const [invRes, patientRes, billingRes] = await Promise.all([
      supabase
        .from("opd_investigations")
        .select(
          "id, encounter_id, test_name, priority, clinical_note, status, created_at, opd_encounters(patient_number, clinic, created_at)"
        )
        .order("id", { ascending: false }),

      supabase
        .from("patients")
        .select(
          "patient_number, first_name, middle_name, last_name"
        ),

      supabase
        .from("billing_transactions")
        .select(
          "id, patient_number, description, total_amount, payment_status, created_at"
        )
        .order("id", { ascending: false }),
    ]);

    if (invRes.error) {
      setRows([]);
      setMessage(`Investigation error: ${invRes.error.message}`);
    } else {
      setRows(invRes.data || []);
    }

    if (patientRes.error) {
      setPatients([]);
    } else {
      setPatients(patientRes.data || []);
    }

    if (billingRes.error) {
      setTransactions([]);
    } else {
      setTransactions(billingRes.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const invChannel = supabase
      .channel("diagnostics-investigations-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opd_investigations",
        },
        () => loadData()
      )
      .subscribe();

    const billingChannel = supabase
      .channel("diagnostics-billing-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_transactions",
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invChannel);
      supabase.removeChannel(billingChannel);
    };
  }, []);

  const patientMap = useMemo(() => {
    const map = new Map();

    for (const patient of patients) {
      map.set(
        patient.patient_number,
        [
          patient.first_name,
          patient.middle_name,
          patient.last_name,
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    return map;
  }, [patients]);

  const queue = useMemo(() => {
    return rows
      .map((item) => {
        const patientNumber =
          item.opd_encounters?.patient_number || "";

        const payment = paymentForInvestigation(
          item,
          transactions
        );

        return {
          ...item,
          patientNumber,
          patientName:
            patientMap.get(patientNumber) || "Patient not found",
          clinic:
            item.opd_encounters?.clinic || "General OPD",
          payment,
        };
      })
      .filter((item) => {
        const text = [
          item.patientNumber,
          item.patientName,
          item.test_name,
          item.priority,
          item.status,
          item.clinic,
          item.payment.status,
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(search.toLowerCase());
      });
  }, [rows, transactions, patientMap, search]);

  function openManage(item) {
    if (!item.payment.paid) {
      setMessage(
        `Payment is ${item.payment.status}. Manage is disabled until this investigation is Paid.`
      );
      return;
    }

    setSelected(item);
    setResultNote(item.clinical_note || "");
    setManageOpen(true);
    setMessage("");
  }

  async function saveResultAndStatus(status) {
    if (!selected) return;

    if (!selected.payment.paid) {
      setMessage("Payment is not completed. Manage is disabled.");
      return;
    }

    const { error } = await supabase
      .from("opd_investigations")
      .update({
        clinical_note: resultNote.trim() || null,
        status,
      })
      .eq("id", selected.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Saved successfully: ${status}`);
    setManageOpen(false);
    setSelected(null);
    await loadData();
  }

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "Times New Roman, serif",
        color: "#20364d",
      }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid #ccd6e0",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 5px 18px rgba(0,0,0,.08)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 30 }}>
          🔬 Diagnostics
        </h1>

        <p style={{ fontSize: 18 }}>
          {section} — OPD investigation receiving and management
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            margin: "18px 0",
          }}
        >
          {MODULES.map(([name, icon]) => (
            <span
              key={name}
              style={{
                padding: "8px 12px",
                borderRadius: 18,
                background:
                  name === section ? "#2563eb" : "#edf3f8",
                color:
                  name === section ? "white" : "#294f73",
                fontWeight: 700,
              }}
            >
              {icon} {name}
            </span>
          ))}
        </div>

        {message && (
          <div
            style={{
              marginBottom: 15,
              padding: 13,
              borderRadius: 9,
              background: "#fff7d6",
              border: "1px solid #e2c75b",
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient, investigation, priority, payment..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            border: "1px solid #aebdcc",
            borderRadius: 9,
            fontSize: 18,
            marginBottom: 16,
          }}
        />

        {loading ? (
          <div style={{ padding: 30 }}>
            Loading OPD investigations...
          </div>
        ) : queue.length === 0 ? (
          <div
            style={{
              padding: 35,
              textAlign: "center",
              border: "1px dashed #aebdcc",
              borderRadius: 12,
            }}
          >
            <strong>
              No OPD investigation has reached Diagnostics yet.
            </strong>
            <p>
              When a clinician orders an investigation from OPD,
              it will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 1050,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Patient",
                    "Patient No.",
                    "Investigation",
                    "Priority",
                    "OPD",
                    "Status",
                    "Payment",
                    "Manage",
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        padding: 12,
                        border: "1px solid #cbd5df",
                        background: "#eaf1f7",
                        textAlign: "left",
                        fontSize: 17,
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {queue.map((item) => {
                  const unpaid = !item.payment.paid;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: unpaid ? "#ffe0e0" : "white",
                      }}
                    >
                      <td style={td}>{item.patientName}</td>
                      <td style={td}>{item.patientNumber || "—"}</td>
                      <td style={td}>{item.test_name || "—"}</td>
                      <td style={td}>{item.priority || "Routine"}</td>
                      <td style={td}>{item.clinic}</td>
                      <td style={td}>{item.status || "Ordered"}</td>

                      <td
                        style={{
                          ...td,
                          color: unpaid ? "#b91c1c" : "#16803c",
                          fontWeight: 700,
                        }}
                      >
                        {unpaid
                          ? `🔴 ${item.payment.status}`
                          : `🟢 Paid (${money(
                              item.payment.amount
                            )})`}
                      </td>

                      <td style={td}>
                        <button
                          type="button"
                          disabled={unpaid}
                          onClick={() => openManage(item)}
                          style={{
                            padding: "9px 15px",
                            borderRadius: 8,
                            border: "none",
                            background: unpaid
                              ? "#9ca3af"
                              : "#2563eb",
                            color: "white",
                            fontWeight: 700,
                            cursor: unpaid
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          {unpaid ? "🔒 Manage Disabled" : "Manage"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {manageOpen && selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 30000,
          }}
        >
          <div
            style={{
              width: "min(720px, 95vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "white",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,.3)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              🔬 Manage Investigation
            </h2>

            <p>
              <strong>Patient:</strong>{" "}
              {selected.patientName}
            </p>
            <p>
              <strong>Patient No.:</strong>{" "}
              {selected.patientNumber}
            </p>
            <p>
              <strong>Investigation:</strong>{" "}
              {selected.test_name}
            </p>
            <p>
              <strong>Payment:</strong>{" "}
              <span
                style={{
                  color: "#16803c",
                  fontWeight: 700,
                }}
              >
                Paid
              </span>
            </p>

            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginTop: 18,
              }}
            >
              Result / Clinical Note
            </label>

            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              placeholder="Enter result or clinical note..."
              style={{
                width: "100%",
                minHeight: 150,
                boxSizing: "border-box",
                marginTop: 8,
                padding: 12,
                border: "1px solid #aebdcc",
                borderRadius: 8,
                fontSize: 17,
                fontFamily: "Times New Roman, serif",
              }}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 18,
              }}
            >
              {[
                ["Collected", "🧪 Sample Collected"],
                ["Processing", "⚙️ Processing"],
                ["Result Ready", "📄 Result Ready"],
                ["Verified", "✅ Verified"],
                ["Doctor Review", "👨‍⚕️ Doctor Review"],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => saveResultAndStatus(status)}
                  style={actionButton}
                >
                  {label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setManageOpen(false);
                  setSelected(null);
                }}
                style={{
                  ...actionButton,
                  background: "#64748b",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td = {
  padding: 12,
  border: "1px solid #d5dde5",
  fontSize: 16,
};

const actionButton = {
  padding: "10px 14px",
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
