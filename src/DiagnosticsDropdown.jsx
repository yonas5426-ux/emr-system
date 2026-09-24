import React from "react";

const DIAGNOSTICS_MODULES = [
  ["Sample Collection", "🧪"],
  ["Laboratory", "🔬"],
  ["Microbiology", "🦠"],
  ["Imaging", "🩻"],
  ["Endoscopy", "🔎"],
  ["Pathology", "🧬"],
  ["Ophtha Investigation", "👁️"],
  ["Blood Bank", "🩸"],
  ["PITC", "🧑‍⚕️"],
  ["Diagnostic Setting", "⚙️"],
];

export default function DiagnosticsDropdown({ open, activeModule, onToggle, onSelect }) {
  return (
    <div style={{ position: "relative", fontFamily: "Times New Roman, serif" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          border: open ? "2px solid #8ea9c1" : "1px solid #476582",
          borderRadius: 9,
          padding: "12px 18px",
          background: open || activeModule ? "#2563eb" : "#294f73",
          color: "white",
          fontFamily: "inherit",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          minWidth: 175,
        }}
      >
        🔬 Diagnostics {open ? "▲" : "▼"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: 335,
            maxHeight: "70vh",
            overflowY: "auto",
            background: "white",
            border: "1px solid #c7d1dc",
            borderRadius: 14,
            boxShadow: "0 14px 38px rgba(0,0,0,.22)",
            padding: 12,
            zIndex: 10000,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #d9e0e7",
              marginBottom: 8,
              fontSize: 20,
              fontWeight: 700,
              color: "#294f73",
            }}
          >
            🔬 Diagnostics Modules
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            {DIAGNOSTICS_MODULES.map(([label, icon]) => {
              const active = activeModule === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelect?.(label)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 14px",
                    borderRadius: 9,
                    border: active ? "2px solid #2563eb" : "1px solid #d6dee7",
                    background: active ? "#eef5ff" : "white",
                    color: "#294f73",
                    fontFamily: "inherit",
                    fontSize: 18,
                    fontWeight: active ? 700 : 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>{icon} {label}</span>
                  <span style={{ fontSize: 18 }}>›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
