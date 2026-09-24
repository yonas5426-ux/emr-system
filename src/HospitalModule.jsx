import React, { useMemo, useState } from "react";

const MODULE_CONFIG = {
  Diagnostics: {
    icon: "🔬",
    description: "Diagnostic services and diagnostic request workflow.",
    steps: ["Request", "Scheduling", "Procedure/Test", "Result", "Review", "Completed"],
    queues: ["Pending Requests", "In Progress", "Results Ready", "Completed"],
  },
  Emergency: {
    icon: "🚑",
    description: "Emergency patient flow from arrival to stabilization and disposition.",
    steps: ["Arrival", "Emergency Triage", "Resuscitation", "Examination", "Investigation", "Treatment", "Disposition"],
    queues: ["Waiting", "Critical", "Under Treatment", "Ready for Disposition"],
  },
  Inpatient: {
    icon: "🛏️",
    description: "Admission, ward care, transfer and discharge workflow.",
    steps: ["Admission", "Bed Assignment", "Daily Care", "Investigation", "Treatment", "Transfer", "Discharge"],
    queues: ["Admissions", "Current Inpatients", "Transfer Requests", "Discharge Planning"],
  },
  OR: {
    icon: "🏥",
    description: "Operating room scheduling and perioperative workflow.",
    steps: ["Request", "Assessment", "Scheduling", "Pre-op", "Operation", "Recovery", "Post-op"],
    queues: ["OR Requests", "Scheduled", "In Theatre", "Recovery"],
  },
  Liaison: {
    icon: "🤝",
    description: "Coordination and referral communication between services.",
    steps: ["Request", "Review", "Communication", "Action", "Feedback", "Closed"],
    queues: ["New Requests", "Pending Response", "Action Required", "Closed"],
  },
  "QI & Report": {
    icon: "📊",
    description: "Quality improvement, indicators, monitoring and hospital reports.",
    steps: ["Data Collection", "Validation", "Indicator", "Analysis", "Action Plan", "Follow-up", "Report"],
    queues: ["Data Review", "QI Actions", "Reports", "Follow-up"],
  },
};

export default function HospitalModule({ module, user }) {
  const config = MODULE_CONFIG[module] || MODULE_CONFIG.Diagnostics;
  const [queue, setQueue] = useState(config.queues[0]);
  const [search, setSearch] = useState("");

  const filteredQueues = useMemo(
    () => config.queues.filter(q => q.toLowerCase().includes(search.toLowerCase())),
    [config.queues, search]
  );

  return (
    <div style={styles.page}>
      <div style={styles.panel}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>{config.icon} {module}</h2>
            <p style={styles.description}>{config.description}</p>
            <p style={styles.user}>👤 {user?.email || "User"}</p>
          </div>
          <div style={styles.badge}>Module</div>
        </div>

        <div style={styles.stepper}>
          {config.steps.map((step, i) => (
            <div key={step} style={styles.step}>
              <span style={styles.number}>{i + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>📋 Workflow Queue</h3>
            <input
              style={styles.input}
              placeholder="Search queue..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={styles.queueList}>
              {filteredQueues.map(q => (
                <button
                  key={q}
                  onClick={() => setQueue(q)}
                  style={q === queue ? styles.activeQueue : styles.queue}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h3>📌 Current Queue</h3>
            <div style={styles.empty}>
              <strong>{queue}</strong>
              <p>No records have been connected to this module yet.</p>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3>🔗 Next Integration</h3>
          <p>
            This module is now part of the hospital navigation. The next step is
            to connect its queue to real Supabase tables and implement each
            workflow step with patient records, status tracking, permissions,
            timestamps and reports.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Times New Roman, serif",
    fontSize: 18,
    padding: 24,
  },
  panel: {
    background: "#fff",
    border: "1px solid #d7dde5",
    borderRadius: 14,
    padding: 24,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
  },
  title: { margin: 0, fontSize: 30 },
  description: { margin: "8px 0", color: "#56616f" },
  user: { margin: 0, fontWeight: 700 },
  badge: {
    border: "1px solid #bdc7d3",
    borderRadius: 20,
    padding: "8px 14px",
    fontWeight: 700,
  },
  stepper: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    margin: "24px 0",
  },
  step: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    border: "1px solid #d7dde5",
    borderRadius: 10,
    padding: "10px 13px",
    background: "#f8fafc",
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e5e7eb",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  card: {
    border: "1px solid #d7dde5",
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    border: "1px solid #bdc7d3",
    borderRadius: 9,
    fontFamily: "inherit",
    fontSize: 17,
  },
  queueList: { display: "grid", gap: 8, marginTop: 12 },
  queue: {
    padding: 12,
    textAlign: "left",
    background: "#fff",
    border: "1px solid #bdc7d3",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 17,
    cursor: "pointer",
  },
  activeQueue: {
    padding: 12,
    textAlign: "left",
    background: "#eef2f7",
    border: "2px solid #7b8794",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 17,
    cursor: "pointer",
    fontWeight: 700,
  },
  empty: {
    border: "1px dashed #bdc7d3",
    borderRadius: 10,
    padding: 20,
    minHeight: 120,
  },
};
