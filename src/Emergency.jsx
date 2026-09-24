import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const UNITS = [
  "Adult Emergency",
  "Gyn Emergency",
  "Obs Emergency",
  "Ophtha Emergency",
  "GBV Emergency",
  "Neonatal Emergency",
  "Dialysis Clinic",
];

const STEPS = [
  "Triage",
  "Examination",
  "Investigation",
  "Treatment",
  "Disposition",
  "Finished",
];

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function Emergency({ initialUnit = "Adult Emergency", user }) {
  const [unit, setUnit] = useState(initialUnit);
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Active Patients");
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("Triage");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const [{ data: triage, error: triageError }, { data: patientData, error: patientError }] =
        await Promise.all([
          supabase
            .from("triage_records")
            .select("*")
            .eq("scope", "Emergency")
            .order("created_at", { ascending: false }),
          supabase
            .from("patients")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (triageError) throw triageError;
      if (patientError) throw patientError;

      setRecords(triage || []);
      setPatients(patientData || []);
    } catch (error) {
      setMessage(error?.message || "Unable to load emergency patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setUnit(initialUnit || "Adult Emergency");
  }, [initialUnit]);

  useEffect(() => {
    loadData();
  }, [unit]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .map((record) => {
        const patient = patients.find(
          (p) => String(p.patient_number || p.card_number || p.id) === String(record.patient_number)
        );
        return { ...record, patient };
      })
      .filter((row) => {
        const text = [
          row.patient_number,
          row.patient?.patient_number,
          row.patient?.first_name,
          row.patient?.father_name,
          row.patient?.grandfather_name,
          row.patient?.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return !q || text.includes(q);
      });
  }, [records, patients, search]);

  function openManage(row) {
    setSelected(row);
    setStep("Triage");
    setNote("");
  }

  async function finishPatient() {
    if (!selected) return;
    setMessage("Patient workflow completed. The emergency record remains in the database for reporting/history.");
    setSelected(null);
    await loadData();
  }

  async function saveNote() {
    if (!selected || !note.trim()) return;
    setMessage("Note captured for this visit. Connect an emergency encounter table to persist workflow notes.");
    setNote("");
  }

  const patientName = selected?.patient
    ? [selected.patient.first_name, selected.patient.father_name, selected.patient.grandfather_name]
        .filter(Boolean)
        .join(" ")
    : selected?.patient_number || "Unknown patient";

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🚑 Emergency</h1>
          <div style={styles.subtitle}>Emergency patient management and clinical workflow</div>
        </div>
        <button style={styles.refresh} onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div style={styles.unitBar}>
        {UNITS.map((item) => (
          <button
            key={item}
            onClick={() => setUnit(item)}
            style={{ ...styles.unitButton, ...(unit === item ? styles.unitButtonActive : {}) }}
          >
            {item}
          </button>
        ))}
        <button
          onClick={() => setMessage("Report module selected. Reporting screens can be connected next.")}
          style={styles.reportButton}
        >
          📊 Report
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div>
            <h2 style={styles.cardTitle}>{unit}</h2>
            <div style={styles.muted}>Emergency queue</div>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / patient number / phone"
            style={styles.search}
          />
        </div>

        <div style={styles.tabs}>
          {["Active Patients", "All Patients"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Patient No.</th>
                <th style={styles.th}>Triage</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="5" style={styles.empty}>No emergency patients found.</td></tr>
              ) : (
                rows.map((row) => {
                  const name = row.patient
                    ? [row.patient.first_name, row.patient.father_name, row.patient.grandfather_name].filter(Boolean).join(" ")
                    : "Patient";
                  return (
                    <tr key={row.id}>
                      <td style={styles.td}>{name || "-"}</td>
                      <td style={styles.td}>{row.patient_number || row.patient?.patient_number || "-"}</td>
                      <td style={styles.td}>{row.score ?? row.triage_score ?? "Pending"}</td>
                      <td style={styles.td}>{fmtDate(row.created_at)}</td>
                      <td style={styles.td}>
                        <button style={styles.manage} onClick={() => openManage(row)}>Manage</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Manage Emergency Patient</h2>
                <div style={styles.modalPatient}>{patientName}</div>
              </div>
              <button style={styles.close} onClick={() => setSelected(null)}>×</button>
            </div>

            <div style={styles.stepRow}>
              {STEPS.map((item) => (
                <button
                  key={item}
                  onClick={() => setStep(item)}
                  style={{ ...styles.step, ...(step === item ? styles.stepActive : {}) }}
                >
                  {item}
                </button>
              ))}
            </div>

            <div style={styles.workflowBox}>
              <h3 style={styles.workflowTitle}>{step}</h3>
              {step === "Triage" && <p>Review emergency triage information and assign the appropriate priority.</p>}
              {step === "Examination" && <p>Record clinical examination findings for the emergency visit.</p>}
              {step === "Investigation" && <p>Review or request laboratory, imaging, microbiology and other diagnostic investigations.</p>}
              {step === "Treatment" && <p>Record emergency treatment, procedures, medication and monitoring.</p>}
              {step === "Disposition" && <p>Choose the next destination: discharge, admission, referral, observation or another department.</p>}
              {step === "Finished" && <p>Close the emergency workflow after the clinical process is complete.</p>}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add clinical note..."
                style={styles.textarea}
              />
              <div style={styles.actions}>
                <button style={styles.secondary} onClick={saveNote}>Add Note</button>
                <button style={styles.primary} onClick={finishPatient}>Finish / Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: 28, background: "#f4f7fb", fontFamily: "Times New Roman, serif", fontSize: 18, color: "#17202a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title: { margin: 0, fontSize: 34, fontWeight: 800 },
  subtitle: { marginTop: 5, fontSize: 19, color: "#596775" },
  refresh: { border: "1px solid #9fb1c2", borderRadius: 9, padding: "10px 18px", background: "white", fontFamily: "inherit", fontSize: 18, fontWeight: 700, cursor: "pointer" },
  unitBar: { display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 18 },
  unitButton: { border: "1px solid #b9c7d5", borderRadius: 9, padding: "11px 15px", background: "white", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  unitButtonActive: { background: "#294f73", color: "white", borderColor: "#294f73" },
  reportButton: { border: "1px solid #7d8e9e", borderRadius: 9, padding: "11px 17px", background: "#eef2f6", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  message: { padding: 13, background: "#e9f5e9", border: "1px solid #a9d3a9", borderRadius: 9, marginBottom: 15, fontWeight: 700 },
  card: { background: "white", border: "1px solid #d2dbe4", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,.07)", padding: 20 },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" },
  cardTitle: { margin: 0, fontSize: 27 },
  muted: { color: "#6c7782", marginTop: 4 },
  search: { width: 390, maxWidth: "100%", padding: "12px 14px", border: "1px solid #bfcbd7", borderRadius: 9, fontFamily: "inherit", fontSize: 17 },
  tabs: { display: "flex", gap: 8, margin: "18px 0 12px" },
  tab: { border: "1px solid #c8d2dc", borderRadius: 8, padding: "9px 14px", background: "white", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  tabActive: { background: "#e9f1f8", borderColor: "#56728d" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: 13, background: "#edf2f7", borderBottom: "2px solid #cbd6e0", fontSize: 18 },
  td: { padding: 13, borderBottom: "1px solid #e0e6eb" },
  empty: { padding: 30, textAlign: "center", color: "#6b7783" },
  manage: { border: 0, borderRadius: 8, padding: "9px 15px", background: "#2563eb", color: "white", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(10,20,30,.48)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 20000 },
  modal: { width: "min(1050px, 100%)", maxHeight: "90vh", overflow: "auto", background: "white", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.30)", padding: 22 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { margin: 0, fontSize: 29 },
  modalPatient: { marginTop: 5, fontSize: 20, fontWeight: 700, color: "#4d6275" },
  close: { border: 0, background: "#eef2f5", borderRadius: 8, fontSize: 30, width: 42, height: 42, cursor: "pointer" },
  stepRow: { display: "flex", flexWrap: "wrap", gap: 8, margin: "20px 0" },
  step: { border: "1px solid #c4d0db", borderRadius: 8, padding: "10px 14px", background: "white", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  stepActive: { background: "#294f73", color: "white", borderColor: "#294f73" },
  workflowBox: { border: "1px solid #d3dde6", borderRadius: 12, padding: 20, background: "#f8fafc" },
  workflowTitle: { marginTop: 0, fontSize: 25 },
  textarea: { width: "100%", minHeight: 130, boxSizing: "border-box", padding: 13, border: "1px solid #bbc9d5", borderRadius: 9, fontFamily: "inherit", fontSize: 17, marginTop: 12 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 13 },
  secondary: { border: "1px solid #8999a8", borderRadius: 8, padding: "10px 16px", background: "white", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  primary: { border: 0, borderRadius: 8, padding: "10px 18px", background: "#16734a", color: "white", fontFamily: "inherit", fontSize: 17, fontWeight: 700, cursor: "pointer" },
};
