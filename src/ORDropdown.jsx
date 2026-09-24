import React, { useState } from "react";

const MODULES = [
  ["Major OR", "🏥"],
  ["Report", "📊"],
];

const MAJOR_OR_MODULES = [
  ["OR", "🏥"],
  ["Schedule", "📅"],
  ["General Major OR", "🏥"],
  ["Plastic Major OR", "🩹"],
  ["Maternity OR", "🤰"],
  ["Day Case OR", "🛏️"],
  ["Ophtha Major OR", "👁️"],
  ["PACU", "🛌"],
  ["Report", "📊"],
];

const buttonStyle = (active=false) => ({
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: active ? "2px solid #2563eb" : "2px solid #e2e8f0",
  background: active ? "#eef5ff" : "#f8fafc",
  borderRadius: 12,
  padding: "13px 14px",
  fontFamily: "inherit",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
});

export default function ORDropdown({
  open,
  activeModule,
  activeSubmodule,
  onToggle,
  onSelect,
  onSelectSubmodule,
}) {
  const [majorOpen, setMajorOpen] = useState(false);

  function chooseTop(label) {
    if (label === "Major OR") {
      onSelect(label);
      setMajorOpen((value) => !value);
      return;
    }
    setMajorOpen(false);
    onSelect(label);
  }

  return (
    <div style={{ position: "relative", fontFamily: "Times New Roman, serif" }}>
      <button
        type="button"
        onClick={() => {
          onToggle();
          if (open) setMajorOpen(false);
        }}
        style={{
          border: "none",
          borderRadius: 9,
          padding: "13px 16px",
          background: open || activeModule === "Major OR" || activeModule === "Report" ? "#2563eb" : "#294f73",
          color: "white",
          cursor: "pointer",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        🏥 OR <span>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 4999 }} />

          <div
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: 0,
              width: 330,
              background: "white",
              border: "2px solid #cbd5e1",
              borderRadius: 16,
              boxShadow: "0 24px 60px rgba(15,23,42,.25)",
              padding: 14,
              zIndex: 5000,
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #e2e8f0",
              padding: "4px 4px 12px",
              marginBottom: 10,
              fontSize: 20,
            }}>
              <strong>🏥 OR Modules</strong>
              <button type="button" onClick={onToggle} style={{
                border: 0, background: "#f1f5f9", borderRadius: 9,
                padding: "7px 11px", fontSize: 18, fontWeight: 700, cursor: "pointer",
              }}>✕</button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {MODULES.map(([label, icon]) => (
                <div key={label} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => chooseTop(label)}
                    style={buttonStyle(activeModule === label)}
                  >
                    <span>{icon} {label}</span>
                    <span>{label === "Major OR" ? (majorOpen ? "‹" : "›") : "›"}</span>
                  </button>

                  {label === "Major OR" && majorOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "calc(100% + 10px)",
                        width: 330,
                        background: "white",
                        border: "2px solid #cbd5e1",
                        borderRadius: 16,
                        boxShadow: "0 24px 60px rgba(15,23,42,.25)",
                        padding: 14,
                        zIndex: 5100,
                      }}
                    >
                      <div style={{
                        fontSize: 20, fontWeight: 700,
                        borderBottom: "2px solid #e2e8f0",
                        padding: "4px 4px 12px", marginBottom: 10,
                      }}>
                        🏥 Major OR Modules
                      </div>

                      <div style={{ display: "grid", gap: 7 }}>
                        {MAJOR_OR_MODULES.map(([subLabel, subIcon]) => (
                          <button
                            key={subLabel}
                            type="button"
                            onClick={() => onSelectSubmodule(subLabel)}
                            style={buttonStyle(activeSubmodule === subLabel)}
                          >
                            <span>{subIcon} {subLabel}</span>
                            <span>›</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
