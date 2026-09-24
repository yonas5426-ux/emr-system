import React, { useState } from "react";

const EMERGENCY_MODULES = [
  ["Adult Emergency", "🚑"],
  ["Gyn Emergency", "👩‍⚕️"],
  ["Obs Emergency", "🤰"],
  ["Ophtha Emergency", "👁️"],
  ["GBV Emergency", "🛡️"],
  ["Neonatal Emergency", "🍼"],
  ["Dialysis Clinic", "💧"],
  ["Report", "📊"],
];

export default function EmergencyDropdown({ onSelect, activeModule, open: controlledOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((v) => !v);
  };

  return (
    <div style={{ position: "relative", fontFamily: "Times New Roman, serif" }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          border: "1px solid #476582",
          borderRadius: 9,
          padding: "12px 18px",
          background: open ? "#2563eb" : "#294f73",
          color: "white",
          fontFamily: "inherit",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        🚑 Emergency {open ? "▲" : "▼"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: 330,
            background: "white",
            border: "1px solid #c7d1dc",
            borderRadius: 14,
            boxShadow: "0 12px 35px rgba(0,0,0,.20)",
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
            }}
          >
            🚑 Emergency Modules
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            {EMERGENCY_MODULES.map(([label, icon]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onSelect?.(label);
                  if (!onToggle) setInternalOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 14px",
                  borderRadius: 9,
                  border: activeModule === label ? "2px solid #2563eb" : "1px solid #d6dee7",
                  background: activeModule === label ? "#eef5ff" : "white",
                  fontFamily: "inherit",
                  fontSize: 18,
                  fontWeight: activeModule === label ? 700 : 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{icon} {label}</span>
                <span>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
