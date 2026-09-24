import { useEffect, useState } from "react";
import OPDWorkflow from "./OPDWorkflow.jsx";

const OPD_MODULES = [
  { key: "General OPD", icon: "🏥" },
  { key: "MNCH", icon: "🤰" },
  { key: "TB & HIV Clinic", icon: "🫁" },
  { key: "Specialty Clinic", icon: "🩺" },
  { key: "Procedure OPD", icon: "💉" },
  { key: "Procedure Room", icon: "🛏️" },
  { key: "Ophthalmology Clinic", icon: "👁️" },
  { key: "Refill Clinic", icon: "💊" },
  { key: "Risk Assessment", icon: "⚠️" },
  { key: "Board Clinic", icon: "👥" },
  { key: "Private Clinic", icon: "🏨" },
  { key: "Report", icon: "📊" },
];

const GENERAL_OPD_MODULES = [
  { key: "General Medical", icon: "🩺" },
  { key: "Surgical", icon: "🔪" },
  { key: "Pediatrics", icon: "👶" },
  { key: "Gynecology", icon: "🤰" },
  { key: "MRC", icon: "🩹" },
  { key: "SRC", icon: "🏥" },
  { key: "PRC", icon: "💊" },
  { key: "GRC", icon: "🧬" },
  { key: "Staff Clinic", icon: "👨‍⚕️" },
  { key: "HPN & DM Clinic", icon: "❤️" },
  { key: "Report", icon: "📊" },
];

const MNCH_MODULES = [
  { key: "Family Planning", icon: "👨‍👩‍👧‍👦" },
  { key: "ANC Clinic", icon: "🤰" },
  { key: "PNC Clinic", icon: "👩‍🍼" },
  { key: "Cervical Ca Screening", icon: "🔬" },
  { key: "PMTCT Clinic", icon: "🧑‍⚕️" },
  { key: "Neonatal Clinic", icon: "👶" },
  { key: "CAC Clinic", icon: "🏥" },
  { key: "Nutrition Clinic", icon: "🥗" },
  { key: "Immunization Clinic", icon: "💉" },
  { key: "Report", icon: "📊" },
];

const PROFESSIONAL_SCOPES = [
  "Senior",
  "R4",
  "R3",
  "R2",
  "R1",
  "HO",
  "GP",
  "INTERN",
  "Midwife/Nurse",
];


export default function OPD({ initialSection = "General OPD" }) {
  const [opdOpen, setOpdOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [mnchOpen, setMnchOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(null);
  const [selectedScope, setSelectedScope] = useState(null);

  const [selectedSection, setSelectedSection] = useState(
    initialSection || "General OPD"
  );

  const [selectedGeneralModule, setSelectedGeneralModule] = useState(
    "General Medical"
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest?.("[data-opd-dropdown]")) {
        setOpdOpen(false);
        setGeneralOpen(false);
        setMnchOpen(false);
        setScopeOpen(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function chooseTopModule(module) {
    if (module.key === "General OPD") {
      setSelectedSection("General OPD");
      setGeneralOpen((value) => !value);
      setMnchOpen(false);
      setScopeOpen(null);
      return;
    }

    if (module.key === "MNCH") {
      setSelectedSection("MNCH");
      setMnchOpen((value) => !value);
      setGeneralOpen(false);
      setScopeOpen(null);
      return;
    }

    setSelectedSection(module.key);
    setGeneralOpen(false);
    setMnchOpen(false);
    setOpdOpen(false);
  }

  function chooseGeneralModule(module) {
    setSelectedSection("General OPD");
    setSelectedGeneralModule(module.key);
    setGeneralOpen(false);
    setMnchOpen(false);
    setOpdOpen(false);
    setScopeOpen(null);
  }

  const [selectedMnchModule, setSelectedMnchModule] = useState(
    "Family Planning"
  );

  function chooseMnchModule(module) {
    setSelectedSection("MNCH");
    setSelectedMnchModule(module.key);
    setMnchOpen(false);
    setGeneralOpen(false);
    setOpdOpen(false);
  }

  const isGeneralReport =
    selectedSection === "General OPD" &&
    selectedGeneralModule === "Report";

  const isMnchReport =
    selectedSection === "MNCH" &&
    selectedMnchModule === "Report";

  const isTopReport = selectedSection === "Report";

  return (
    <div style={styles.page}>
      <style>{`
        .opd-navigation {
          position: relative;
          display: inline-block;
          z-index: 6000;
        }

        .opd-navigation-button {
          border: 0;
          border-radius: 9px;
          background: #f8fafc;
          color: #111827;
          padding: 13px 18px;
          font-family: "Times New Roman", Times, serif;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          border: 2px solid #cbd5e1;
        }

        .opd-navigation-button:hover,
        .opd-navigation-button.active {
          background: #eff6ff;
          border-color: #2563eb;
          color: #1e3a8a;
        }

        .opd-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5998;
          background: transparent;
        }

        /*
          MAIN OPD DROPDOWN.
          This is the full dropdown that was accidentally removed.
        */
        .opd-main-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          width: 350px;
          background: white;
          border: 2px solid #333;
          border-radius: 10px;
          box-shadow: 0 14px 35px rgba(0,0,0,.25);
          padding: 8px;
          z-index: 5999;
        }

        .opd-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 13px;
          margin-bottom: 5px;
          border-bottom: 2px solid #e5e7eb;
          font-size: 21px;
          font-weight: 700;
          color: #111827;
        }

        .opd-close {
          border: 0;
          background: #f1f5f9;
          border-radius: 7px;
          padding: 5px 9px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .opd-main-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          border-radius: 7px;
          background: white;
          color: #111827;
          padding: 13px 14px;
          margin: 2px 0;
          font-family: "Times New Roman", Times, serif;
          font-size: 19px;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }

        .opd-main-item:hover,
        .opd-main-item.active {
          background: #eeeeee;
        }

        /*
          GENERAL OPD FLYOUT.
          It is a child of the MAIN dropdown and opens to the RIGHT.
          It does NOT participate in the vertical list.
        */
        .general-opd-flyout,
        .mnch-flyout {
          position: absolute;
          top: 0;
          left: calc(100% + 10px);
          width: 330px;
          max-height: 620px;
          overflow-y: auto;
          background: white;
          border: 2px solid #333;
          border-radius: 10px;
          box-shadow: 0 14px 35px rgba(0,0,0,.25);
          padding: 8px;
          z-index: 6001;
        }

        .general-opd-flyout-header,
        .mnch-flyout-header {
          padding: 11px 13px;
          margin-bottom: 5px;
          border-bottom: 2px solid #e5e7eb;
          color: #111827;
          font-size: 20px;
          font-weight: 700;
        }

        .general-opd-item, .mnch-item {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          border-radius: 7px;
          background: white;
          color: #111827;
          padding: 12px 13px;
          margin: 2px 0;
          font-family: "Times New Roman", Times, serif;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }

        .general-opd-item:hover, .general-opd-item.active,
        .mnch-item:hover, .mnch-item.active {
          background: #eef6ff;
        }

        .scope-flyout {
          position: absolute;
          top: 0;
          left: calc(100% + 10px);
          width: 290px;
          background: white;
          border: 2px solid #333;
          border-radius: 10px;
          box-shadow: 0 14px 35px rgba(0,0,0,.25);
          padding: 8px;
          z-index: 6003;
        }

        .scope-header {
          padding: 11px 13px;
          margin-bottom: 5px;
          border-bottom: 2px solid #e5e7eb;
          font-size: 20px;
          font-weight: 700;
        }

        .scope-item {
          width: 100%;
          border: 0;
          border-radius: 7px;
          background: white;
          color: #111827;
          padding: 12px 13px;
          margin: 2px 0;
          font-family: "Times New Roman", Times, serif;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }

        .scope-item:hover, .scope-item.active {
          background: #eef6ff;
        }

        .opd-current {
          margin-top: 18px;
          padding: 13px 16px;
          background: white;
          border: 1px solid #777;
          border-radius: 8px;
          font-size: 21px;
          font-weight: 700;
        }

        .opd-report {
          margin-top: 20px;
          padding: 24px;
          background: white;
          border: 1px solid #777;
          border-radius: 10px;
        }

        .opd-report h2 {
          margin-top: 0;
          font-size: 30px;
        }

        .opd-report-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .opd-report-card {
          padding: 20px;
          border: 1px solid #888;
          border-radius: 8px;
          font-weight: 700;
        }

        @media (max-width: 750px) {
          .opd-main-dropdown {
            width: 300px;
          }

          .general-opd-flyout,
          .mnch-flyout {
            left: calc(100% + 7px);
            width: 280px;
          }

          .opd-report-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        className="opd-navigation"
        data-opd-dropdown
      >
        <button
          type="button"
          className={
            "opd-navigation-button " + (opdOpen ? "active" : "")
          }
          onClick={() => {
            setOpdOpen((value) => !value);
            setGeneralOpen(false);
            setMnchOpen(false);
            setScopeOpen(null);
          }}
        >
          🏥 OPD <span>{opdOpen ? "▴" : "▾"}</span>
        </button>

        {opdOpen && (
          <>
            <div className="opd-backdrop" aria-hidden="true" />

            <div className="opd-main-dropdown" role="menu">
              <div className="opd-dropdown-header">
                <span>🏥 OPD Modules</span>

                <button
                  type="button"
                  className="opd-close"
                  onClick={() => {
                    setOpdOpen(false);
                    setGeneralOpen(false);
                  }}
                >
                  ✕
                </button>
              </div>

              {OPD_MODULES.map((module) => {
                const isGeneral = module.key === "General OPD";
                const isMnch = module.key === "MNCH";
                return (
                  <div key={module.key} style={{ position: "relative", width: "100%" }}>
                    <button
                      type="button"
                      className={
                        "opd-main-item " + ((isGeneral && generalOpen) || (isMnch && mnchOpen) ? "active" : "")
                      }
                      onClick={() => chooseTopModule(module)}
                    >
                      <span>{module.icon} {module.key}</span>
                      {(isGeneral || isMnch) && <span style={{ fontSize: 21 }}>▸</span>}
                    </button>

                    {isGeneral && generalOpen && (
                      <div className="general-opd-flyout" role="menu">
                        <div className="general-opd-flyout-header">🏥 General OPD Modules</div>
                        {GENERAL_OPD_MODULES.map((item) => {
                          const hasScope = item.key !== "Report";
                          return (
                            <div key={item.key} style={{ position: "relative" }}>
                              <button
                                type="button"
                                className={"general-opd-item " + (scopeOpen === "general:" + item.key ? "active" : "")}
                                onClick={() => {
                                  if (hasScope) {
                                    setScopeOpen((v) => v === "general:" + item.key ? null : "general:" + item.key);
                                    setSelectedGeneralModule(item.key);
                                  } else {
                                    chooseGeneralModule(item);
                                  }
                                }}
                              >
                                <span>{item.icon} {item.key}</span>
                                {hasScope && <span>▸</span>}
                              </button>

                              {hasScope && scopeOpen === "general:" + item.key && (
                                <div className="scope-flyout" role="menu">
                                  <div className="scope-header">👨‍⚕️ Professional Scope</div>
                                  {PROFESSIONAL_SCOPES.map((scope) => (
                                    <button
                                      key={scope}
                                      type="button"
                                      className={"scope-item " + (selectedScope === scope ? "active" : "")}
                                      onClick={() => {
                                        setSelectedScope(scope);
                                        setSelectedSection("General OPD");
                                        setSelectedGeneralModule(item.key);
                                        setOpdOpen(false);
                                        setGeneralOpen(false);
                                        setScopeOpen(null);
                                      }}
                                    >
                                      {scope}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isMnch && mnchOpen && (
                      <div className="mnch-flyout" role="menu">
                        <div className="mnch-flyout-header">🤰 MNCH Modules</div>
                        {MNCH_MODULES.map((item) => {
                          const hasScope = item.key !== "Report";
                          return (
                            <div key={item.key} style={{ position: "relative" }}>
                              <button
                                type="button"
                                className={"mnch-item " + (scopeOpen === "mnch:" + item.key ? "active" : "")}
                                onClick={() => {
                                  if (hasScope) {
                                    setScopeOpen((v) => v === "mnch:" + item.key ? null : "mnch:" + item.key);
                                  } else {
                                    chooseMnchModule(item);
                                  }
                                }}
                              >
                                <span>{item.icon} {item.key}</span>
                                {hasScope && <span>▸</span>}
                              </button>

                              {hasScope && scopeOpen === "mnch:" + item.key && (
                                <div className="scope-flyout" role="menu">
                                  <div className="scope-header">👩‍⚕️ Professional Scope</div>
                                  {PROFESSIONAL_SCOPES.map((scope) => (
                                    <button
                                      key={scope}
                                      type="button"
                                      className={"scope-item " + (selectedScope === scope ? "active" : "")}
                                      onClick={() => {
                                        setSelectedScope(scope);
                                        setSelectedSection("MNCH");
                                        setSelectedMnchModule(item.key);
                                        setOpdOpen(false);
                                        setMnchOpen(false);
                                        setScopeOpen(null);
                                      }}
                                    >
                                      {scope}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="opd-current">
        Current Module:{" "}
        {selectedSection === "General OPD"
          ? `General OPD → ${selectedGeneralModule}${selectedScope ? ` → Scope: ${selectedScope}` : ""}`
          : selectedSection === "MNCH"
          ? `MNCH → ${selectedMnchModule}${selectedScope ? ` → Scope: ${selectedScope}` : ""}`
          : selectedSection}
      </div>

      {(isGeneralReport || isMnchReport || isTopReport) ? (
        <div className="opd-report">
          <h2>📊 OPD Report</h2>
          <p>OPD reports will be displayed here.</p>

          <div className="opd-report-grid">
            {GENERAL_OPD_MODULES.filter(
              (module) => module.key !== "Report"
            ).map((module) => (
              <div className="opd-report-card" key={module.key}>
                {module.icon} {module.key}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <OPDWorkflow
          clinic={
            selectedSection === "General OPD"
              ? selectedGeneralModule
              : selectedSection === "MNCH"
              ? selectedMnchModule
              : selectedSection
          }
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: "20px",
  },
};
