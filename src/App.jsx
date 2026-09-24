import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import TriageRegistration from "./TriageRegistration";
import OPD from "./OPD";
import HospitalModule from "./HospitalModule";
import Emergency from "./Emergency";
import EmergencyDropdown from "./EmergencyDropdown";
import InpatientDropdown from "./InpatientDropdown";
import OR from "./OR";
import ORDropdown from "./ORDropdown";

const NAV_GROUPS = [
  {
    key: "reception",
    label: "Reception",
    icon: "🧑‍💼",
    items: [
      { key: "patient-entry", label: "Patient Entry", icon: "📝", mode: "Reception" },
      { key: "reception-patients", label: "Reception Patient List", icon: "👥", mode: "Reception" },
      { key: "attach-document", label: "Attach Document", icon: "📎", mode: "Attach Document" },
    ],
  },
  {
    key: "report",
    label: "Report",
    icon: "📊",
    items: [
      { key: "quality-report", label: "Quality Report", icon: "📈", mode: "Report" },
    ],
  },
  {
    key: "register",
    label: "Register",
    icon: "📝",
    items: [
      { key: "registration-list", label: "Registration Patient List", icon: "👥", mode: "Register" },
      { key: "appointment-list", label: "Appointment List", icon: "📅", mode: "Register" },
      { key: "imr-tracer", label: "IMR Tracer", icon: "📂", mode: "Register" },
      { key: "appointment-tracer", label: "Appointment Tracer", icon: "🔎", mode: "Register" },
    ],
  },
];

function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("Dashboard");

  const [appointmentContext, setAppointmentContext] = useState(null);
  const [medicalRecordPatient, setMedicalRecordPatient] = useState(null);
  const [triageContext, setTriageContext] = useState(null);
  const [doctorContext, setDoctorContext] = useState(null);
  const [triageRegistrationMode, setTriageRegistrationMode] = useState("Reception");
  const [triageRegistrationTriageType, setTriageRegistrationTriageType] = useState("");
  const [triageRegMenuOpen, setTriageRegMenuOpen] = useState(false);
  const [triageRegSubmenu, setTriageRegSubmenu] = useState(null);
  const [triageSection, setTriageSection] = useState("Adult Emergency Triage");
  const [triageMenuOpen, setTriageMenuOpen] = useState(false);
  const [opdMenuOpen, setOpdMenuOpen] = useState(false);
  const [opdSection, setOpdSection] = useState("General OPD");
  const [pharmacyMenuOpen, setPharmacyMenuOpen] = useState(false);
  const [pharmacySection, setPharmacySection] = useState("Pharmacy store");
  const [emergencySection, setEmergencySection] = useState("Adult Emergency");
  const [emergencyMenuOpen, setEmergencyMenuOpen] = useState(false);
  const [inpatientSection, setInpatientSection] = useState("Ward");
  const [inpatientMenuOpen, setInpatientMenuOpen] = useState(false);
  const [orSection, setOrSection] = useState("Major OR");
  const [orSubsection, setOrSubsection] = useState("OR");
  const [orMenuOpen, setOrMenuOpen] = useState(false);
  const [liaisonSection, setLiaisonSection] = useState("Ed management");
  const [liaisonMenuOpen, setLiaisonMenuOpen] = useState(false);
  const [billingSection, setBillingSection] = useState("Registration Fee");
  const [billingMenuOpen, setBillingMenuOpen] = useState(false);
  const [diagnosticsSection, setDiagnosticsSection] = useState("Sample Collection");
  const [diagnosticsMenuOpen, setDiagnosticsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    function closeNavigationMenus(event) {
      const insideTriage = event.target.closest?.("[data-triage-registration-dropdown]");
      const insideTriageModule = event.target.closest?.("[data-triage-dropdown]");
      const insideOpd = event.target.closest?.("[data-opd-dropdown]");
      const insideEmergency = event.target.closest?.("[data-emergency-dropdown]");
      const insideInpatient = event.target.closest?.("[data-inpatient-dropdown]");
      const insideOR = event.target.closest?.("[data-or-dropdown]");
      const insideLiaison = event.target.closest?.("[data-liaison-dropdown]");
      const insideBilling = event.target.closest?.("[data-billing-dropdown]");
      const insideDiagnostics = event.target.closest?.("[data-diagnostics-dropdown]");
      const insidePharmacy = event.target.closest?.("[data-pharmacy-dropdown]");

      if (!insideTriage) {
        setTriageRegMenuOpen(false);
        setTriageRegSubmenu(null);
      }
      if (!insideTriageModule) {
        setTriageMenuOpen(false);
      }
      if (!insideOpd) {
        setOpdMenuOpen(false);
      }
      if (!insideEmergency) {
        setEmergencyMenuOpen(false);
      }
      if (!insideInpatient) {
        setInpatientMenuOpen(false);
      }
      if (!insideOR) {
        setOrMenuOpen(false);
      }
      if (!insideLiaison) {
        setLiaisonMenuOpen(false);
      }
      if (!insideBilling) {
        setBillingMenuOpen(false);
      }
      if (!insideDiagnostics) {
        setDiagnosticsMenuOpen(false);
      }
      if (!insidePharmacy) {
        setPharmacyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", closeNavigationMenus);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", closeNavigationMenus);
    };
  }, []);

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  function openMedicalRecord(data) {
    setAppointmentContext(data);
    setMedicalRecordPatient(data);
    setPage("Medical Record");
  }

  function openBilling(data) {
    setAppointmentContext(data);
    setPage("Billing");
  }

  function openTriage(data) {
    setAppointmentContext(data);
    setTriageContext(data);
    setTriageRegistrationMode("Triage");
    setTriageRegistrationTriageType(data?.triage_type || "");
    setPage("Registration");
  }

  function openDoctor(data) {
    setAppointmentContext(data);
    setDoctorContext(data);
    setPage("Doctor Consultation");
  }

  return (
    <div style={styles.app}>
      <style>{globalSystemStyles}</style>
      <aside style={styles.sidebar}>
        <div style={styles.topUtilityBar}>
          <button
            style={styles.logoutTopButton}
            onClick={() => supabase.auth.signOut()}
          >
            🚪 Logout
          </button>
          <div style={styles.logoWrap}>
            <h2 style={styles.logo}>🏥 EMR System</h2>
            <span style={styles.topSystemLabel}>Paperless Hospital Management System</span>
          </div>
          <div style={styles.topUserBox}>
            👤 <strong>Admin</strong>
            <span>{session.user.email}</span>
          </div>
        </div>

        <nav style={styles.topNav}>
          <TopNavButton page={page} setPage={setPage} name="Dashboard" icon="🏠" />

          <div style={styles.navDropdown} data-triage-registration-dropdown>
            <button
              type="button"
              style={
                page === "Registration" || triageRegMenuOpen
                  ? styles.activeTopNavSummary
                  : styles.topNavSummary
              }
              onClick={() => {
                setTriageRegMenuOpen((open) => !open);
                setTriageRegSubmenu(null);
              }}
            >
              🧾 Registration <span style={{ fontSize: 18 }}>{triageRegMenuOpen ? "▴" : "▾"}</span>
            </button>

            {triageRegMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />

                <div style={styles.overlayDropdown} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>🧾 Registration</strong>
                    <button
                      type="button"
                      style={styles.overlayCloseButton}
                      onClick={() => {
                        setTriageRegMenuOpen(false);
                        setTriageRegSubmenu(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={styles.overlayPrimaryList}>
                    {NAV_GROUPS.map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        role="menuitem"
                        style={
                          triageRegSubmenu === group.key
                            ? styles.overlayPrimaryActive
                            : styles.overlayPrimaryButton
                        }
                        onClick={() =>
                          setTriageRegSubmenu(
                            triageRegSubmenu === group.key ? null : group.key
                          )
                        }
                      >
                        <span>{group.icon} {group.label}</span>
                        <span style={{ fontSize: 20 }}>▸</span>
                      </button>
                    ))}
                  </div>

                  {triageRegSubmenu && (
                    <div style={styles.overlayFlyout} role="menu">
                      {NAV_GROUPS.find((group) => group.key === triageRegSubmenu)?.items.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          role="menuitem"
                          style={styles.overlayFlyoutItem}
                          onClick={() => {
                            setTriageRegistrationMode(item.mode);
                            setTriageRegistrationTriageType(item.triageType || "");
                            setPage("Registration");
                            setTriageRegMenuOpen(false);
                            setTriageRegSubmenu(null);
                          }}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={styles.navDropdown} data-opd-dropdown>
            <button
              type="button"
              style={
                page === "OPD" || opdMenuOpen
                  ? styles.activeTopNavSummary
                  : styles.topNavSummary
              }
              onClick={() => {
                setOpdMenuOpen((open) => !open);
                setEmergencyMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
              }}
            >
              🏥 OPD <span style={{ fontSize: 18 }}>{opdMenuOpen ? "▴" : "▾"}</span>
            </button>

            {opdMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />
                <div style={styles.overlayDropdown} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>🏥 OPD Modules</strong>
                    <button type="button" style={styles.overlayCloseButton} onClick={() => setOpdMenuOpen(false)}>✕</button>
                  </div>
                  <div style={styles.overlayPrimaryList}>
                    {[
                      ["General OPD", "🏥"], ["MNCH", "👩‍🍼"],
                      ["TB & HIV Clinic", "🧬"], ["Specialty Clinic", "🩺"],
                      ["Procedure OPD", "📝"], ["Procedure Room", "🛏️"],
                      ["Ophthalmology Clinic", "👁️"], ["Refill Clinic", "💊"],
                      ["Risk Assessment", "⚠️"], ["Board Clinic", "📋"],
                      ["Private Clinic", "🏢"], ["Report", "📈"],
                    ].map(([label, icon]) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        style={opdSection === label && page === "OPD" ? styles.overlayPrimaryActive : styles.overlayPrimaryButton}
                        onClick={() => {
                          setOpdSection(label);
                          setPage("OPD");
                          setOpdMenuOpen(false);
                        }}
                      >
                        <span>{icon} {label}</span>
                        <span style={{ fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={styles.navDropdown} data-triage-dropdown>
            <button
              type="button"
              style={page === "Triage" || triageMenuOpen ? styles.activeTopNavSummary : styles.topNavSummary}
              onClick={() => {
                setTriageMenuOpen((open) => !open);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
                setOpdMenuOpen(false);
                setBillingMenuOpen(false);
                setDiagnosticsMenuOpen(false);
                setLiaisonMenuOpen(false);
                setEmergencyMenuOpen(false);
                setInpatientMenuOpen(false);
                setOrMenuOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={triageMenuOpen}
            >
              🩺 Triage <span style={{ marginLeft: 6 }}>{triageMenuOpen ? "▴" : "▾"}</span>
            </button>

            {triageMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />
                <div style={{ ...styles.overlayDropdown, width: 380 }} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>🩺 Triage Modules</strong>
                    <button type="button" style={styles.overlayCloseButton} onClick={() => setTriageMenuOpen(false)}>✕</button>
                  </div>
                  <div style={styles.overlayPrimaryList}>
                    {[
                      ["Adult Emergency Triage", "🚑"],
                      ["Central Triage", "🩺"],
                      ["Pedi Triage", "👶"],
                      ["Gyn Triage", "👩"],
                      ["Obs Triage", "🤰"],
                      ["Neonatal Triage", "🍼"],
                    ].map(([label, icon]) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        style={triageSection === label && page === "Triage" ? styles.overlayPrimaryActive : styles.overlayPrimaryButton}
                        onClick={() => {
                          setTriageSection(label);
                          setTriageRegistrationTriageType(label);
                          setTriageRegistrationMode("Triage");
                          setPage("Triage");
                          setTriageMenuOpen(false);
                        }}
                      >
                        <span>{icon} {label}</span>
                        <span style={{ fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div data-pharmacy-dropdown style={styles.navDropdown}>
            <button
              type="button"
              style={
                page === "Pharmacy" || pharmacyMenuOpen
                  ? styles.activeTopNavSummary
                  : styles.topNavSummary
              }
              onClick={() => {
                setPharmacyMenuOpen((open) => !open);
                setOpdMenuOpen(false);
                setTriageMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
                setBillingMenuOpen(false);
                setDiagnosticsMenuOpen(false);
                setLiaisonMenuOpen(false);
                setEmergencyMenuOpen(false);
                setInpatientMenuOpen(false);
                setOrMenuOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={pharmacyMenuOpen}
            >
              💊 Pharmacy <span style={{ marginLeft: 6 }}>{pharmacyMenuOpen ? "▴" : "▾"}</span>
            </button>

            {pharmacyMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />
                <div style={{ ...styles.overlayDropdown, width: 390 }} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>💊 Pharmacy Modules</strong>
                    <button
                      type="button"
                      style={styles.overlayCloseButton}
                      onClick={() => setPharmacyMenuOpen(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={styles.overlayPrimaryList}>
                    {[
                      ["Pharmacy store", "🏪"],
                      ["Pharmacy Head", "👨‍⚕️"],
                      ["OPD Pharmacy", "🏥"],
                      ["Adult Emergency Pharmacy", "🚑"],
                      ["Inpatient Pharmacy", "🛏️"],
                      ["Oncology Pharmacy", "🎗️"],
                      ["ART Pharmacy", "💊"],
                      ["MCH Pharmacy", "👩‍🍼"],
                      ["OR Pharmacy", "🩺"],
                      ["OPhtha Pharmacy", "👁️"],
                      ["Department Request", "📋"],
                      ["Register", "📝"],
                      ["Pharmacy Accounting", "💰"],
                      ["General Setting", "⚙️"],
                      ["Supplier", "🚚"],
                      ["Report", "📊"],
                    ].map(([label, icon]) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        style={
                          pharmacySection === label && page === "Pharmacy"
                            ? styles.overlayPrimaryActive
                            : styles.overlayPrimaryButton
                        }
                        onClick={() => {
                          setPharmacySection(label);
                          setPage("Pharmacy");
                          setPharmacyMenuOpen(false);
                        }}
                      >
                        <span>{icon} {label}</span>
                        <span style={{ fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div data-billing-dropdown style={styles.navDropdown}>
            <button
              type="button"
              style={page === "Billing" || billingMenuOpen ? styles.activeTopNavSummary : styles.topNavSummary}
              onClick={() => {
                setBillingMenuOpen((open) => !open);
                setDiagnosticsMenuOpen(false);
                setLiaisonMenuOpen(false);
                setEmergencyMenuOpen(false);
                setInpatientMenuOpen(false);
                setOrMenuOpen(false);
                setOpdMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
              }}
              aria-haspopup="menu"
              aria-expanded={billingMenuOpen}
            >
              💰 Billing <span style={{ marginLeft: 6 }}>{billingMenuOpen ? "▴" : "▾"}</span>
            </button>

            {billingMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />
                <div style={{ ...styles.overlayDropdown, width: 390 }} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>💰 Billing Modules</strong>
                    <button type="button" style={styles.overlayCloseButton} onClick={() => setBillingMenuOpen(false)}>✕</button>
                  </div>
                  <div style={styles.overlayPrimaryList}>
                    {[
                      ["Registration Fee", "🧾"],
                      ["Appointment Fee", "📅"],
                      ["Emergency Service Bill", "🚑"],
                      ["Outpatient Service Bill", "🏥"],
                      ["Inpatient Service Bill", "🛏️"],
                      ["OBS Service Bill", "🤰"],
                      ["Pharmacy Bill", "💊"],
                      ["Billing Register", "📒"],
                      ["Social Service Bill", "🤝"],
                      ["General Price Setting", "⚙️"],
                      ["Report", "📊"],
                    ].map(([label, icon]) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        style={billingSection === label && page === "Billing" ? styles.overlayPrimaryActive : styles.overlayPrimaryButton}
                        onClick={() => {
                          setBillingSection(label);
                          setPage("Billing");
                          setBillingMenuOpen(false);
                        }}
                      >
                        <span>{icon} {label}</span>
                        <span style={{ fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div data-diagnostics-dropdown style={styles.navDropdown}>
            <button
              type="button"
              style={page === "Diagnostics" || diagnosticsMenuOpen ? styles.activeTopNavSummary : styles.topNavSummary}
              onClick={() => {
                setDiagnosticsMenuOpen((open) => !open);
                setLiaisonMenuOpen(false);
                setEmergencyMenuOpen(false);
                setInpatientMenuOpen(false);
                setOrMenuOpen(false);
                setOpdMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
              }}
              aria-haspopup="menu"
              aria-expanded={diagnosticsMenuOpen}
            >
              🔬 Diagnostics <span style={{ marginLeft: 6 }}>{diagnosticsMenuOpen ? "▴" : "▾"}</span>
            </button>
            {diagnosticsMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />
                <div style={{ ...styles.overlayDropdown, width: 380, overflow: "visible" }} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>🔬 Diagnostics Modules</strong>
                    <button type="button" style={styles.overlayCloseButton} onClick={() => setDiagnosticsMenuOpen(false)}>✕</button>
                  </div>
                  <div style={styles.overlayPrimaryList}>
                    {[
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
                    ].map(([label, icon]) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        style={diagnosticsSection === label && page === "Diagnostics" ? styles.overlayPrimaryActive : styles.overlayPrimaryButton}
                        onClick={() => {
                          setDiagnosticsSection(label);
                          setPage("Diagnostics");
                          setDiagnosticsMenuOpen(false);
                        }}
                      >
                        <span>{icon} {label}</span>
                        <span style={{ fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div data-emergency-dropdown style={styles.navDropdown}>
            <EmergencyDropdown
            open={emergencyMenuOpen}
            onToggle={() => {
              setEmergencyMenuOpen((open) => !open);
              setOpdMenuOpen(false);
              setTriageRegMenuOpen(false);
              setTriageRegSubmenu(null);
            }}
            activeModule={emergencySection}
            onSelect={(label) => {
              setEmergencySection(label);
              setPage("Emergency");
              setEmergencyMenuOpen(false);
            }}
          />
          </div>
          <div data-inpatient-dropdown style={styles.navDropdown}>
            <InpatientDropdown
              open={inpatientMenuOpen}
              activeModule={inpatientSection}
              onToggle={() => {
                setInpatientMenuOpen((open) => !open);
                setEmergencyMenuOpen(false);
                setOpdMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
              }}
              onSelect={(label) => {
                setInpatientSection(label);
                setPage("Inpatient");
                setInpatientMenuOpen(false);
              }}
            />
          </div>
          <div data-or-dropdown style={styles.navDropdown}>
            <ORDropdown
              open={orMenuOpen}
              activeModule={orSection}
              activeSubmodule={orSubsection}
              onToggle={() => {
                setOrMenuOpen((open) => !open);
                setEmergencyMenuOpen(false);
                setInpatientMenuOpen(false);
                setOpdMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
              }}
              onSelect={(label) => {
                setOrSection(label);
                setPage("OR");
              }}
              onSelectSubmodule={(label) => {
                setOrSection("Major OR");
                setOrSubsection(label);
                setPage("OR");
                setOrMenuOpen(false);
              }}
            />
          </div>
          <div data-liaison-dropdown style={styles.navDropdown}>
            <button
              type="button"
              style={page === "Liaison" || liaisonMenuOpen ? styles.activeTopNavSummary : styles.topNavSummary}
              onClick={() => {
                setLiaisonMenuOpen((open) => !open);
                setEmergencyMenuOpen(false);
                setInpatientMenuOpen(false);
                setOrMenuOpen(false);
                setOpdMenuOpen(false);
                setTriageRegMenuOpen(false);
                setTriageRegSubmenu(null);
              }}
              aria-haspopup="menu"
              aria-expanded={liaisonMenuOpen}
            >
              🤝 Liaison <span style={{ marginLeft: 6 }}>{liaisonMenuOpen ? "▴" : "▾"}</span>
            </button>
            {liaisonMenuOpen && (
              <>
                <div style={styles.overlayBackdrop} aria-hidden="true" />
                <div style={{ ...styles.overlayDropdown, width: 380, overflow: "visible" }} role="menu">
                  <div style={styles.overlayDropdownTitle}>
                    <strong>🤝 Liaison Modules</strong>
                    <button type="button" style={styles.overlayCloseButton} onClick={() => setLiaisonMenuOpen(false)}>✕</button>
                  </div>
                  <div style={styles.overlayPrimaryList}>
                    {[
                      ["Ed management", "🏥"],
                      ["Admission", "🛏️"],
                      ["Patient transfer", "🔄"],
                      ["New elective surgery", "🩺"],
                      ["Ophtha Elective Waiting List", "👁️"],
                      ["Day case Waiting list", "📋"],
                      ["Discharge", "🚪"],
                      ["Referral", "📨"],
                      ["Visitor", "👥"],
                      ["Death", "🕊️"],
                      ["General Setting", "⚙️"],
                      ["Report", "📊"],
                    ].map(([label, icon]) => (
                      <button key={label} type="button" role="menuitem"
                        style={liaisonSection === label && page === "Liaison" ? styles.overlayPrimaryActive : styles.overlayPrimaryButton}
                        onClick={() => { setLiaisonSection(label); setPage("Liaison"); setLiaisonMenuOpen(false); }}>
                        <span>{icon} {label}</span>
                        <span style={{ fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <TopNavButton page={page} setPage={setPage} name="All admin & Report" icon="📊" />
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{page}</h1>
            <p style={styles.subtitle}>
              Paperless Hospital Management System
            </p>
          </div>

          <div style={styles.userBox}>
            👤 Admin
            <br />
            <small>{session.user.email}</small>
          </div>
        </header>

        {page === "Dashboard" && (
          <Dashboard
            goPatients={() => setPage("Patients")}
            goAppointments={() => setPage("Appointments")}
            goTriage={() => { setTriageRegistrationMode("Triage"); setPage("Registration"); }}
            goDoctor={() => setPage("Doctor Consultation")}
          />
        )}

        {page === "Registration" && (
          <TriageRegistration
            user={session.user}
            initialMode={triageRegistrationMode}
            initialTriageType={triageRegistrationTriageType}
          />
        )}

        {page === "Patients" && <Patients />}

        {page === "OPD" && <OPD initialSection={opdSection} onMessage={(message) => alert(message)} />}

        {page === "Appointments" && (
          <Appointments
            goPatientRecord={openMedicalRecord}
            goBilling={openBilling}
            goTriage={openTriage}
          />
        )}

        {page === "Triage" && (
          <Triage
            appointment={triageContext}
            user={session.user}
            goBack={() => setPage("Appointments")}
            goMedicalRecord={openMedicalRecord}
            goDoctor={openDoctor}
          />
        )}

        {page === "Doctor Consultation" && (
          <DoctorConsultation
            appointment={doctorContext}
            user={session.user}
            goBack={() => setPage("Triage")}
            goMedicalRecord={openMedicalRecord}
            goBilling={openBilling}
          />
        )}

        {page === "Medical Record" && (
          <MedicalRecord
            appointment={medicalRecordPatient}
            user={session.user}
            goBack={() => setPage("Appointments")}
            goBilling={openBilling}
          />
        )}

        {page === "Pharmacy" && (
          <Pharmacy
            appointment={doctorContext || appointmentContext}
            user={session.user}
            goBack={() => setPage("Doctor Consultation")}
          />
        )}

        {page === "Emergency" && (
          <Emergency
            initialUnit={emergencySection}
            user={session.user}
          />
        )}

        {page === "OR" && (
          <OR section={orSection} subsection={orSubsection} user={session.user} />
        )}

        {["Diagnostics", "Inpatient", "Liaison", "QI & Report"].includes(page) && (
          <HospitalModule
            module={page}
            user={session.user}
            submodule={page === "Inpatient" ? inpatientSection : page === "Liaison" ? liaisonSection : page === "Diagnostics" ? diagnosticsSection : undefined}
          />
        )}

        {page === "Billing" && (
          <Billing
            appointment={appointmentContext}
            user={session.user}
            goBack={() => setPage("Appointments")}
          />
        )}
      </main>
    </div>
  );
}

function MenuButton({ page, setPage, name, icon }) {
  return (
    <button
      style={page === name ? styles.activeMenu : styles.menu}
      onClick={() => setPage(name)}
    >
      {icon} {name}
    </button>
  );
}

function TopNavButton({ page, setPage, name, icon }) {
  return (
    <button
      style={page === name ? styles.activeTopNav : styles.topNavButton}
      onClick={() => setPage(name)}
    >
      {icon} {name}
    </button>
  );
}

function Dashboard({ goPatients, goAppointments, goTriage, goDoctor }) {
  const [patientCount, setPatientCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [triageCount, setTriageCount] = useState(0);
  const [consultationCount, setConsultationCount] = useState(0);
  const [allPatientCount, setAllPatientCount] = useState(0);
  const [totalOpdVisitCount, setTotalOpdVisitCount] = useState(0);

  useEffect(() => {
    loadCounts();
  }, []);

  async function loadCounts() {
    const { count: patients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: appointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });

    const { count: triage } = await supabase
      .from("triage_records")
      .select("*", { count: "exact", head: true });

    const { count: consultations } = await supabase
      .from("doctor_consultations")
      .select("*", { count: "exact", head: true });

    const { count: allPatients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: totalOpdVisits } = await supabase
      .from("opd_encounters")
      .select("*", { count: "exact", head: true });

    setPatientCount(patients || 0);
    setAppointmentCount(appointments || 0);
    setTriageCount(triage || 0);
    setConsultationCount(consultations || 0);
    setAllPatientCount(allPatients || 0);
    setTotalOpdVisitCount(totalOpdVisits || 0);
  }

  return (
    <>
      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Patients</h3>
          <strong style={styles.bigNumber}>{patientCount}</strong>
        </div>

        <div style={styles.card}>
          <h3>Appointments</h3>
          <strong style={styles.bigNumber}>{appointmentCount}</strong>
        </div>

        <div style={styles.card}>
          <h3>Triage Records</h3>
          <strong style={styles.bigNumber}>{triageCount}</strong>
        </div>

        <div style={styles.card}>
          <h3>Doctor Consultations</h3>
          <strong style={styles.bigNumber}>{consultationCount}</strong>
        </div>

        <div style={styles.card}>
          <h3>All Patient</h3>
          <strong style={styles.bigNumber}>{allPatientCount}</strong>
          <p style={{ margin: "8px 0 0", fontSize: 15 }}>
            All registered patients
          </p>
        </div>

        <div style={styles.card}>
          <h3>Total OPD Visit</h3>
          <strong style={styles.bigNumber}>{totalOpdVisitCount}</strong>
          <p style={{ margin: "8px 0 0", fontSize: 15 }}>
            Includes repeat visits
          </p>
        </div>
      </div>

      <div style={styles.panel}>
        <h2>Welcome to the Hospital EMR</h2>

        <p>
          Manage patients, appointments, triage, doctors, laboratory,
          pharmacy and billing from one system.
        </p>

        <button style={styles.primaryButton} onClick={goPatients}>
          👤 Patients
        </button>

        <button style={styles.secondaryButton} onClick={goAppointments}>
          📅 Appointments
        </button>

        <button style={styles.triageButton} onClick={goTriage}>
          🩺 Triage
        </button>

        <button style={styles.doctorButton} onClick={goDoctor}>
          👨‍⚕️ Doctor
        </button>
      </div>
    </>
  );
}

/* PATIENTS */

function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);

    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("id", { ascending: false });

    setPatients(data || []);
    setLoading(false);
  }

  const filtered = patients.filter((patient) => {
    const text = search.toLowerCase().trim();

    return (
      !text ||
      (patient.patient_number || "").toLowerCase().includes(text) ||
      (patient.first_name || "").toLowerCase().includes(text) ||
      (patient.father_name || "").toLowerCase().includes(text) ||
      (patient.phone || "").toLowerCase().includes(text)
    );
  });

  return (
    <div style={styles.panel}>
      <h2>Patients</h2>

      <div style={styles.searchBox}>
        🔍
        <input
          style={styles.searchInput}
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p>Loading patients...</p>}

      {!loading && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Patient Number</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Sex</th>
              <th style={styles.th}>Phone</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((patient) => (
              <tr key={patient.id}>
                <td style={styles.td}>{patient.patient_number}</td>
                <td style={styles.td}>
                  {patient.first_name} {patient.father_name}
                </td>
                <td style={styles.td}>{patient.sex || "-"}</td>
                <td style={styles.td}>{patient.phone || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* APPOINTMENTS */

function Appointments({ goPatientRecord, goBilling, goTriage }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    patient_number: "",
    appointment_date: "",
    appointment_time: "",
    department: "",
    location: "",
    doctor_name: "",
    reason: "",
    status: "Scheduled",
    payment_status: "Unpaid",
    payment_amount: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    const { data: patientsData } = await supabase
      .from("patients")
      .select("patient_number, first_name, father_name")
      .order("patient_number", { ascending: true });

    setAppointments(appointmentsData || []);
    setPatients(patientsData || []);
    setLoading(false);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function newAppointment() {
    setEditing(null);
    setSelected(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function editAppointment(item) {
    setEditing(item);

    setForm({
      patient_number: item.patient_number || "",
      appointment_date: item.appointment_date || "",
      appointment_time: item.appointment_time || "",
      department: item.department || "",
      location: item.location || "",
      doctor_name: item.doctor_name || "",
      reason: item.reason || "",
      status: item.status || "Scheduled",
      payment_status: item.payment_status || "Unpaid",
      payment_amount:
        item.payment_amount === null ||
        item.payment_amount === undefined
          ? ""
          : String(item.payment_amount),
    });

    setShowForm(true);
  }

  async function saveAppointment(e) {
    e.preventDefault();

    if (
      !form.patient_number ||
      !form.appointment_date ||
      !form.appointment_time
    ) {
      alert("Patient, date and time are required.");
      return;
    }

    const data = {
      patient_number: form.patient_number,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      department: form.department || null,
      location: form.location || null,
      doctor_name: form.doctor_name || null,
      reason: form.reason || null,
      status: form.status || "Scheduled",
      payment_status: form.payment_status || "Unpaid",
      payment_amount: form.payment_amount
        ? Number(form.payment_amount)
        : 0,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("appointments")
        .update(data)
        .eq("id", editing.id);
    } else {
      result = await supabase
        .from("appointments")
        .insert([data]);
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function deleteAppointment(item) {
    if (!window.confirm("Delete this appointment?")) return;

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelected(null);
    await load();
  }

  const filtered = appointments.filter((item) => {
    const text = search.toLowerCase().trim();

    return (
      !text ||
      (item.patient_number || "").toLowerCase().includes(text) ||
      (item.doctor_name || "").toLowerCase().includes(text) ||
      (item.department || "").toLowerCase().includes(text) ||
      (item.status || "").toLowerCase().includes(text)
    );
  });

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>Appointments</h2>
          <p>Schedule and manage patient appointments.</p>
        </div>

        <div>
          <button style={styles.refreshButton} onClick={load}>
            🔄 Refresh
          </button>

          <button
            style={styles.primaryButton}
            onClick={newAppointment}
          >
            + New Appointment
          </button>
        </div>
      </div>

      <div style={styles.searchBox}>
        🔍
        <input
          style={styles.searchInput}
          placeholder="Search patient, doctor, department or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <h3>{editing ? "Edit Appointment" : "New Appointment"}</h3>

          <form onSubmit={saveAppointment}>
            <div style={styles.formGrid}>
              <select
                name="patient_number"
                value={form.patient_number}
                onChange={handleChange}
              >
                <option value="">Select Patient *</option>

                {patients.map((patient) => (
                  <option
                    key={patient.patient_number}
                    value={patient.patient_number}
                  >
                    {patient.patient_number} - {patient.first_name}{" "}
                    {patient.father_name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="appointment_date"
                value={form.appointment_date}
                onChange={handleChange}
              />

              <input
                type="time"
                name="appointment_time"
                value={form.appointment_time}
                onChange={handleChange}
              />

              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="OPD">OPD</option>
                <option value="Emergency">Emergency</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Internal Medicine">
                  Internal Medicine
                </option>
                <option value="Surgery">Surgery</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Dentistry">Dentistry</option>
              </select>

              <input
                name="location"
                placeholder="Room / Location"
                value={form.location}
                onChange={handleChange}
              />

              <input
                name="doctor_name"
                placeholder="Doctor Name"
                value={form.doctor_name}
                onChange={handleChange}
              />

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>

              <input
                name="reason"
                placeholder="Reason"
                value={form.reason}
                onChange={handleChange}
              />

              <select
                name="payment_status"
                value={form.payment_status}
                onChange={handleChange}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                name="payment_amount"
                placeholder="Payment Amount"
                value={form.payment_amount}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              style={styles.primaryButton}
            >
              {editing ? "Save Changes" : "Create Appointment"}
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {selected && (
        <div style={styles.detailsBox}>
          <div style={styles.row}>
            <h3>Appointment Details</h3>

            <button
              style={styles.cancelButton}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div style={styles.detailsGrid}>
            <Detail label="Patient" value={selected.patient_number} />
            <Detail label="Date" value={selected.appointment_date} />
            <Detail label="Time" value={selected.appointment_time} />
            <Detail label="Department" value={selected.department} />
            <Detail label="Location" value={selected.location} />
            <Detail label="Doctor" value={selected.doctor_name} />
            <Detail label="Status" value={selected.status} />
            <Detail
              label="Payment"
              value={selected.payment_status}
            />
          </div>

          <div style={styles.actionRow}>
            <button
              style={styles.triageButton}
              onClick={() => goTriage(selected)}
            >
              🩺 Triage
            </button>

            <button
              style={styles.mrButton}
              onClick={() => goPatientRecord(selected)}
            >
              📋 MR
            </button>

            <button
              style={styles.paymentButton}
              onClick={() => goBilling(selected)}
            >
              💳 Payment
            </button>

            <button
              style={styles.editButton}
              onClick={() => editAppointment(selected)}
            >
              ✏️ Edit
            </button>

            <button
              style={styles.deleteButton}
              onClick={() => deleteAppointment(selected)}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <div style={styles.row}>
          <h3>Appointments List</h3>
          <span>
            {filtered.length} appointment
            {filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading && <p>Loading appointments...</p>}

        {!loading && filtered.length === 0 && (
          <p>No appointments found.</p>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.patient_number}</td>
                    <td style={styles.td}>{item.appointment_date}</td>
                    <td style={styles.td}>{item.appointment_time}</td>
                    <td style={styles.td}>{item.department || "-"}</td>
                    <td style={styles.td}>{item.doctor_name || "-"}</td>
                    <td style={styles.td}>{item.status}</td>

                    <td style={styles.td}>
                      <button
                        style={styles.viewButton}
                        onClick={() => setSelected(item)}
                      >
                        👁️ View
                      </button>

                      <button
                        style={styles.triageButtonSmall}
                        onClick={() => goTriage(item)}
                      >
                        🩺 Triage
                      </button>

                      <button
                        style={styles.mrButtonSmall}
                        onClick={() => goPatientRecord(item)}
                      >
                        📋 MR
                      </button>

                      <button
                        style={styles.paymentButtonSmall}
                        onClick={() => goBilling(item)}
                      >
                        💳 Payment
                      </button>

                      <button
                        style={styles.editButton}
                        onClick={() => editAppointment(item)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => deleteAppointment(item)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* TRIAGE */

function Triage({
  appointment,
  user,
  goBack,
  goMedicalRecord,
  goDoctor,
}) {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    patient_number: appointment?.patient_number || "",
    appointment_id: appointment?.id || "",
    triage_date: new Date().toISOString().slice(0, 10),
    arrival_time: "",
    chief_complaint: "",
    blood_pressure: "",
    pulse: "",
    temperature: "",
    respiratory_rate: "",
    oxygen_saturation: "",
    pain_score: "",
    consciousness: "",
    acuity: "",
    scope: "",
    disposition: "",
    notes: "",
  });

  useEffect(() => {
    loadRecords();

    if (appointment) {
      setForm((current) => ({
        ...current,
        patient_number: appointment.patient_number || "",
        appointment_id: appointment.id || "",
      }));

      setShowForm(true);
    }
  }, [appointment]);

  async function loadRecords() {
    const { data } = await supabase
      .from("triage_records")
      .select("*")
      .order("id", { ascending: false });

    setRecords(data || []);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveTriage(e) {
    e.preventDefault();

    if (!form.patient_number) {
      alert("Patient number is required.");
      return;
    }

    const data = {
      ...form,
      appointment_id: form.appointment_id
        ? Number(form.appointment_id)
        : null,
      pulse: form.pulse ? Number(form.pulse) : null,
      temperature: form.temperature
        ? Number(form.temperature)
        : null,
      respiratory_rate: form.respiratory_rate
        ? Number(form.respiratory_rate)
        : null,
      oxygen_saturation: form.oxygen_saturation
        ? Number(form.oxygen_saturation)
        : null,
      pain_score:
        form.pain_score === ""
          ? null
          : Number(form.pain_score),
      created_by: user.id,
    };

    const { error } = await supabase
      .from("triage_records")
      .insert([data]);

    if (error) {
      alert(error.message);
      return;
    }

    setShowForm(false);
    await loadRecords();
  }

  const filtered = records.filter((record) => {
    const text = search.toLowerCase().trim();

    return (
      !text ||
      (record.patient_number || "").toLowerCase().includes(text) ||
      (record.acuity || "").toLowerCase().includes(text) ||
      (record.scope || "").toLowerCase().includes(text) ||
      (record.disposition || "").toLowerCase().includes(text) ||
      (record.chief_complaint || "").toLowerCase().includes(text)
    );
  });

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>🩺 Triage</h2>
          <p>
            Search, assess, record vital signs and manage triage disposition.
          </p>
        </div>

        <button
          style={styles.triageButton}
          onClick={() => setShowForm(true)}
        >
          + New Triage
        </button>
      </div>

      {appointment && (
        <div style={styles.linkedAppointment}>
          <strong>Linked Appointment</strong>

          <div style={styles.detailsGrid}>
            <Detail
              label="Patient"
              value={appointment.patient_number}
            />
            <Detail
              label="Department"
              value={appointment.department}
            />
            <Detail
              label="Doctor"
              value={appointment.doctor_name}
            />
          </div>
        </div>
      )}

      <div style={styles.searchBox}>
        🔍
        <input
          style={styles.searchInput}
          placeholder="Search patient, scope, acuity or disposition..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <h3>New Triage Record</h3>

          <form onSubmit={saveTriage}>
            <div style={styles.formGrid}>
              <input
                name="patient_number"
                placeholder="Patient Number *"
                value={form.patient_number}
                onChange={handleChange}
              />

              <input
                type="date"
                name="triage_date"
                value={form.triage_date}
                onChange={handleChange}
              />

              <input
                type="time"
                name="arrival_time"
                value={form.arrival_time}
                onChange={handleChange}
              />

              <input
                name="blood_pressure"
                placeholder="Blood Pressure"
                value={form.blood_pressure}
                onChange={handleChange}
              />

              <input
                type="number"
                name="pulse"
                placeholder="Pulse"
                value={form.pulse}
                onChange={handleChange}
              />

              <input
                type="number"
                step="0.1"
                name="temperature"
                placeholder="Temperature °C"
                value={form.temperature}
                onChange={handleChange}
              />

              <input
                type="number"
                name="respiratory_rate"
                placeholder="Respiratory Rate"
                value={form.respiratory_rate}
                onChange={handleChange}
              />

              <input
                type="number"
                step="0.01"
                name="oxygen_saturation"
                placeholder="Oxygen Saturation %"
                value={form.oxygen_saturation}
                onChange={handleChange}
              />

              <input
                type="number"
                min="0"
                max="10"
                name="pain_score"
                placeholder="Pain Score 0-10"
                value={form.pain_score}
                onChange={handleChange}
              />

              <select
                name="consciousness"
                value={form.consciousness}
                onChange={handleChange}
              >
                <option value="">Consciousness</option>
                <option value="Alert">Alert</option>
                <option value="Verbal Response">
                  Verbal Response
                </option>
                <option value="Pain Response">
                  Pain Response
                </option>
                <option value="Unresponsive">
                  Unresponsive
                </option>
              </select>

              <select
                name="acuity"
                value={form.acuity}
                onChange={handleChange}
              >
                <option value="">Acuity</option>
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
                <option value="Semi-Urgent">Semi-Urgent</option>
                <option value="Non-Urgent">Non-Urgent</option>
              </select>

              <select
                name="scope"
                value={form.scope}
                onChange={handleChange}
              >
                <option value="">Scope / Care Area</option>
                <option value="Emergency">Emergency</option>
                <option value="OPD">OPD</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Internal Medicine">
                  Internal Medicine
                </option>
                <option value="Surgery">Surgery</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Dentistry">Dentistry</option>
              </select>

              <select
                name="disposition"
                value={form.disposition}
                onChange={handleChange}
              >
                <option value="">Disposition</option>
                <option value="Immediate Treatment">
                  Immediate Treatment
                </option>
                <option value="Observation">Observation</option>
                <option value="Doctor Review">Doctor Review</option>
                <option value="Admission">Admission</option>
                <option value="Referral">Referral</option>
                <option value="Discharge">Discharge</option>
              </select>

              <textarea
                name="chief_complaint"
                placeholder="Chief Complaint"
                value={form.chief_complaint}
                onChange={handleChange}
                style={{
                  gridColumn: "1 / -1",
                  minHeight: "80px",
                }}
              />

              <textarea
                name="notes"
                placeholder="Triage Notes"
                value={form.notes}
                onChange={handleChange}
                style={{
                  gridColumn: "1 / -1",
                  minHeight: "80px",
                }}
              />
            </div>

            <button
              type="submit"
              style={styles.triageButton}
            >
              Save Triage
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {selected && (
        <div style={styles.detailsBox}>
          <div style={styles.row}>
            <h3>Triage Details</h3>

            <button
              style={styles.cancelButton}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div style={styles.detailsGrid}>
            <Detail label="Patient" value={selected.patient_number} />
            <Detail label="Date" value={selected.triage_date} />
            <Detail label="Acuity" value={selected.acuity} />
            <Detail label="Scope" value={selected.scope} />
            <Detail
              label="Disposition"
              value={selected.disposition}
            />
            <Detail
              label="Blood Pressure"
              value={selected.blood_pressure}
            />
            <Detail label="Pulse" value={selected.pulse} />
            <Detail
              label="Temperature"
              value={selected.temperature}
            />
          </div>

          <div style={styles.actionRow}>
            <button
              style={styles.doctorButton}
              onClick={() =>
                goDoctor({
                  patient_number: selected.patient_number,
                  appointment_id: selected.appointment_id,
                  triage_id: selected.id,
                  department: selected.scope,
                })
              }
            >
              👨‍⚕️ Doctor Review
            </button>

            <button
              style={styles.mrButton}
              onClick={() =>
                goMedicalRecord({
                  patient_number: selected.patient_number,
                  appointment_date: selected.triage_date,
                  department: selected.scope,
                })
              }
            >
              📋 MR Retrieve
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <div style={styles.row}>
          <h3>Triage Records</h3>

          <span>
            {filtered.length} record
            {filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {filtered.length === 0 && (
          <p>No triage records found.</p>
        )}

        {filtered.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Acuity</th>
                <th style={styles.th}>Scope</th>
                <th style={styles.th}>Disposition</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td style={styles.td}>{record.patient_number}</td>
                  <td style={styles.td}>{record.triage_date}</td>
                  <td style={styles.td}>{record.acuity || "-"}</td>
                  <td style={styles.td}>{record.scope || "-"}</td>
                  <td style={styles.td}>
                    {record.disposition || "-"}
                  </td>

                  <td style={styles.td}>
                    <button
                      style={styles.viewButton}
                      onClick={() => setSelected(record)}
                    >
                      👁️ View
                    </button>

                    <button
                      style={styles.doctorButtonSmall}
                      onClick={() =>
                        goDoctor({
                          patient_number: record.patient_number,
                          appointment_id: record.appointment_id,
                          triage_id: record.id,
                          department: record.scope,
                        })
                      }
                    >
                      👨‍⚕️ Doctor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* DOCTOR CONSULTATION */

function DoctorConsultation({
  appointment,
  user,
  goBack,
  goMedicalRecord,
  goBilling,
}) {
  const [message, setMessage] = useState("");
  const [records, setRecords] = useState([]);

  const [form, setForm] = useState({
    consultation_date: new Date().toISOString().slice(0, 10),
    consultation_time: "",
    doctor_name: "",
    department: appointment?.department || "",
    history: "",
    examination: "",
    assessment: "",
    diagnosis: "",
    treatment_plan: "",
    laboratory_order: "",
    imaging_order: "",
    prescription_notes: "",
    disposition: "",
    follow_up_date: "",
    notes: "",
  });

  useEffect(() => {
    loadRecords();

    if (appointment) {
      setForm((current) => ({
        ...current,
        department: appointment.department || "",
      }));
    }
  }, [appointment]);

  async function loadRecords() {
    if (!appointment?.patient_number) {
      setRecords([]);
      return;
    }

    const { data } = await supabase
      .from("doctor_consultations")
      .select("*")
      .eq("patient_number", appointment.patient_number)
      .order("consultation_date", { ascending: false })
      .order("id", { ascending: false });

    setRecords(data || []);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveConsultation(e) {
    e.preventDefault();

    if (!appointment?.patient_number) {
      alert("No patient selected.");
      return;
    }

    const data = {
      appointment_id: appointment.appointment_id
        ? Number(appointment.appointment_id)
        : appointment.id
        ? Number(appointment.id)
        : null,

      triage_id: appointment.triage_id
        ? Number(appointment.triage_id)
        : null,

      patient_number: appointment.patient_number,

      consultation_date: form.consultation_date,
      consultation_time: form.consultation_time || null,
      doctor_name: form.doctor_name || null,
      department: form.department || null,

      history: form.history || null,
      examination: form.examination || null,
      assessment: form.assessment || null,
      diagnosis: form.diagnosis || null,
      treatment_plan: form.treatment_plan || null,

      laboratory_order: form.laboratory_order || null,
      imaging_order: form.imaging_order || null,
      prescription_notes: form.prescription_notes || null,

      disposition: form.disposition || null,
      follow_up_date: form.follow_up_date || null,

      notes: form.notes || null,
      created_by: user.id,
    };

    const { error } = await supabase
      .from("doctor_consultations")
      .insert([data]);

    if (error) {
      alert(error.message);
      return;
    }

    setMessage("✅ Doctor consultation saved successfully!");

    setForm((current) => ({
      ...current,
      history: "",
      examination: "",
      assessment: "",
      diagnosis: "",
      treatment_plan: "",
      laboratory_order: "",
      imaging_order: "",
      prescription_notes: "",
      disposition: "",
      follow_up_date: "",
      notes: "",
    }));

    await loadRecords();
  }

  if (!appointment) {
    return (
      <div style={styles.panel}>
        <h2>👨‍⚕️ Doctor Consultation</h2>
        <p>No patient or triage record selected.</p>

        <button style={styles.primaryButton} onClick={goBack}>
          ← Back to Triage
        </button>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>👨‍⚕️ Doctor Consultation</h2>
          <p>Clinical assessment and consultation record.</p>
        </div>

        <button
          style={styles.cancelButton}
          onClick={goBack}
        >
          ← Back
        </button>
      </div>

      <div style={styles.patientHeader}>
        <Detail label="Patient" value={appointment.patient_number} />
        <Detail label="Department" value={appointment.department} />
        <Detail
          label="Appointment ID"
          value={appointment.appointment_id}
        />
        <Detail label="Triage ID" value={appointment.triage_id} />
      </div>

      {message && (
        <div style={styles.messageBox}>{message}</div>
      )}

      <div style={styles.formBox}>
        <h3>Consultation Record</h3>

        <form onSubmit={saveConsultation}>
          <div style={styles.formGrid}>
            <input
              type="date"
              name="consultation_date"
              value={form.consultation_date}
              onChange={handleChange}
            />

            <input
              type="time"
              name="consultation_time"
              value={form.consultation_time}
              onChange={handleChange}
            />

            <input
              name="doctor_name"
              placeholder="Doctor Name"
              value={form.doctor_name}
              onChange={handleChange}
            />

            <input
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
            />

            <textarea
              name="history"
              placeholder="History"
              value={form.history}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "90px",
              }}
            />

            <textarea
              name="examination"
              placeholder="Physical Examination"
              value={form.examination}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "90px",
              }}
            />

            <textarea
              name="assessment"
              placeholder="Clinical Assessment"
              value={form.assessment}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "90px",
              }}
            />

            <input
              name="diagnosis"
              placeholder="Diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
              }}
            />

            <textarea
              name="treatment_plan"
              placeholder="Treatment Plan"
              value={form.treatment_plan}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "90px",
              }}
            />

            <textarea
              name="laboratory_order"
              placeholder="Laboratory Order"
              value={form.laboratory_order}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />

            <textarea
              name="imaging_order"
              placeholder="Imaging Order"
              value={form.imaging_order}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />

            <textarea
              name="prescription_notes"
              placeholder="Prescription Notes"
              value={form.prescription_notes}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />

            <select
              name="disposition"
              value={form.disposition}
              onChange={handleChange}
            >
              <option value="">Select Disposition</option>
              <option value="Outpatient Follow-up">
                Outpatient Follow-up
              </option>
              <option value="Observation">Observation</option>
              <option value="Admission">Admission</option>
              <option value="Referral">Referral</option>
              <option value="Discharge">Discharge</option>
            </select>

            <input
              type="date"
              name="follow_up_date"
              value={form.follow_up_date}
              onChange={handleChange}
            />

            <textarea
              name="notes"
              placeholder="Consultation Notes"
              value={form.notes}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />
          </div>

          <button
            type="submit"
            style={styles.doctorButton}
          >
            💾 Save Consultation
          </button>

          <button
            type="button"
            style={styles.labButton}
            onClick={() =>
              setAppointmentContextForLocal(
                appointment
              )
            }
          >
            🧪 Laboratory
          </button>

          <button
            type="button"
            style={styles.pharmacyButton}
          >
            💊 Pharmacy
          </button>

          <button
            type="button"
            style={styles.paymentButton}
            onClick={() =>
              goBilling(appointment)
            }
          >
            💳 Billing
          </button>

          <button
            type="button"
            style={styles.mrButton}
            onClick={() =>
              goMedicalRecord(appointment)
            }
          >
            📋 MR
          </button>
        </form>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Previous Consultations</h3>

        {records.length === 0 && (
          <p>No previous consultations found.</p>
        )}

        {records.map((record) => (
          <div
            key={record.id}
            style={styles.historyCard}
          >
            <div style={styles.row}>
              <strong>
                {record.consultation_date}
              </strong>

              <span>
                {record.disposition || "-"}
              </span>
            </div>

            <p>
              <strong>Diagnosis:</strong>{" "}
              {record.diagnosis || "-"}
            </p>

            <p>
              <strong>Assessment:</strong>{" "}
              {record.assessment || "-"}
            </p>

            <p>
              <strong>Treatment:</strong>{" "}
              {record.treatment_plan || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* LABORATORY */

function Laboratory({ appointment, user, goBack }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    test_name: "",
    priority: "Routine",
    clinical_note: "",
  });

  useEffect(() => {
    loadOrders();
  }, [appointment]);

  async function loadOrders() {
    let query = supabase
      .from("laboratory_orders")
      .select("*")
      .order("id", { ascending: false });

    if (appointment?.patient_number) {
      query = query.eq(
        "patient_number",
        appointment.patient_number
      );
    }

    const { data } = await query;
    setOrders(data || []);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveOrder(e) {
    e.preventDefault();

    if (!appointment?.patient_number) {
      alert("No patient selected.");
      return;
    }

    if (!form.test_name) {
      alert("Test name is required.");
      return;
    }

    const data = {
      patient_number: appointment.patient_number,

      appointment_id: appointment.appointment_id
        ? Number(appointment.appointment_id)
        : appointment.id
        ? Number(appointment.id)
        : null,

      consultation_id: appointment.consultation_id
        ? Number(appointment.consultation_id)
        : null,

      order_date: new Date()
        .toISOString()
        .slice(0, 10),

      test_name: form.test_name,
      priority: form.priority,
      clinical_note: form.clinical_note || null,
      created_by: user.id,
    };

    const { error } = await supabase
      .from("laboratory_orders")
      .insert([data]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      test_name: "",
      priority: "Routine",
      clinical_note: "",
    });

    setShowForm(false);
    await loadOrders();
  }

  async function updateStatus(order, status) {
    const { error } = await supabase
      .from("laboratory_orders")
      .update({ status })
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadOrders();
  }

  const filtered = orders.filter((order) => {
    const text = search.toLowerCase().trim();

    return (
      !text ||
      (order.test_name || "").toLowerCase().includes(text) ||
      (order.patient_number || "")
        .toLowerCase()
        .includes(text) ||
      (order.status || "").toLowerCase().includes(text)
    );
  });

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>🧪 Laboratory</h2>
          <p>Laboratory orders and result workflow.</p>
        </div>

        <div>
          <button
            style={styles.cancelButton}
            onClick={goBack}
          >
            ← Back
          </button>

          <button
            style={styles.labButton}
            onClick={() => setShowForm(true)}
          >
            + New Lab Order
          </button>
        </div>
      </div>

      {appointment && (
        <div style={styles.linkedAppointment}>
          <Detail
            label="Patient Number"
            value={appointment.patient_number}
          />
        </div>
      )}

      <div style={styles.searchBox}>
        🔍
        <input
          style={styles.searchInput}
          placeholder="Search test, patient or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <h3>New Laboratory Order</h3>

          <form onSubmit={saveOrder}>
            <div style={styles.formGrid}>
              <input
                name="test_name"
                placeholder="Test Name *"
                value={form.test_name}
                onChange={handleChange}
              />

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>

              <textarea
                name="clinical_note"
                placeholder="Clinical Note"
                value={form.clinical_note}
                onChange={handleChange}
                style={{
                  gridColumn: "1 / -1",
                  minHeight: "90px",
                }}
              />
            </div>

            <button
              type="submit"
              style={styles.labButton}
            >
              💾 Save Lab Order
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <h3>Laboratory Orders</h3>

        {filtered.length === 0 && (
          <p>No laboratory orders found.</p>
        )}

        {filtered.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Test</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td style={styles.td}>
                    {order.patient_number}
                  </td>

                  <td style={styles.td}>
                    {order.test_name}
                  </td>

                  <td style={styles.td}>
                    {order.priority}
                  </td>

                  <td style={styles.td}>
                    {order.status}
                  </td>

                  <td style={styles.td}>
                    <button
                      style={styles.labButtonSmall}
                      onClick={() =>
                        updateStatus(
                          order,
                          "Collected"
                        )
                      }
                    >
                      Collected
                    </button>

                    <button
                      style={styles.labButtonSmall}
                      onClick={() =>
                        updateStatus(
                          order,
                          "Processing"
                        )
                      }
                    >
                      Processing
                    </button>

                    <button
                      style={styles.labButtonSmall}
                      onClick={() =>
                        updateStatus(
                          order,
                          "Completed"
                        )
                      }
                    >
                      Completed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* PHARMACY */

function Pharmacy({ appointment, user, goBack }) {
  const [prescriptions, setPrescriptions] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] = useState({
    medication_name: "",
    strength: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "",
    instructions: "",
  });

  useEffect(() => {
    loadPrescriptions();
  }, [appointment]);

  async function loadPrescriptions() {
    let query = supabase
      .from("prescriptions")
      .select("*")
      .order("id", { ascending: false });

    if (appointment?.patient_number) {
      query = query.eq(
        "patient_number",
        appointment.patient_number
      );
    }

    const { data } = await query;

    setPrescriptions(data || []);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function savePrescription(e) {
    e.preventDefault();

    if (!appointment?.patient_number) {
      alert("No patient selected.");
      return;
    }

    if (!form.medication_name) {
      alert("Medication name is required.");
      return;
    }

    const data = {
      patient_number:
        appointment.patient_number,

      appointment_id: appointment.appointment_id
        ? Number(appointment.appointment_id)
        : appointment.id
        ? Number(appointment.id)
        : null,

      consultation_id:
        appointment.consultation_id
          ? Number(
              appointment.consultation_id
            )
          : null,

      prescription_date: new Date()
        .toISOString()
        .slice(0, 10),

      medication_name:
        form.medication_name,

      strength:
        form.strength || null,

      dosage:
        form.dosage || null,

      frequency:
        form.frequency || null,

      duration:
        form.duration || null,

      route:
        form.route || null,

      instructions:
        form.instructions || null,

      created_by: user.id,
    };

    const { error } =
      await supabase
        .from("prescriptions")
        .insert([data]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      medication_name: "",
      strength: "",
      dosage: "",
      frequency: "",
      duration: "",
      route: "",
      instructions: "",
    });

    setShowForm(false);
    await loadPrescriptions();
  }

  async function dispense(item) {
    const { error } =
      await supabase
        .from("prescriptions")
        .update({
          status: "Dispensed",
        })
        .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPrescriptions();
  }

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>💊 Pharmacy</h2>
          <p>Prescription and dispensing workflow.</p>
        </div>

        <div>
          <button
            style={styles.cancelButton}
            onClick={goBack}
          >
            ← Back
          </button>

          <button
            style={styles.pharmacyButton}
            onClick={() =>
              setShowForm(true)
            }
          >
            + New Prescription
          </button>
        </div>
      </div>

      {appointment && (
        <div style={styles.linkedAppointment}>
          <Detail
            label="Patient Number"
            value={appointment.patient_number}
          />
        </div>
      )}

      {showForm && (
        <div style={styles.formBox}>
          <h3>New Prescription</h3>

          <form onSubmit={savePrescription}>
            <div style={styles.formGrid}>
              <input
                name="medication_name"
                placeholder="Medication Name *"
                value={
                  form.medication_name
                }
                onChange={handleChange}
              />

              <input
                name="strength"
                placeholder="Strength"
                value={form.strength}
                onChange={handleChange}
              />

              <input
                name="dosage"
                placeholder="Dosage"
                value={form.dosage}
                onChange={handleChange}
              />

              <input
                name="frequency"
                placeholder="Frequency"
                value={form.frequency}
                onChange={handleChange}
              />

              <input
                name="duration"
                placeholder="Duration"
                value={form.duration}
                onChange={handleChange}
              />

              <input
                name="route"
                placeholder="Route"
                value={form.route}
                onChange={handleChange}
              />

              <textarea
                name="instructions"
                placeholder="Instructions"
                value={form.instructions}
                onChange={handleChange}
                style={{
                  gridColumn: "1 / -1",
                  minHeight: "90px",
                }}
              />
            </div>

            <button
              type="submit"
              style={styles.pharmacyButton}
            >
              💾 Save Prescription
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <h3>Prescriptions</h3>

        {prescriptions.length === 0 && (
          <p>No prescriptions found.</p>
        )}

        {prescriptions.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  Medication
                </th>
                <th style={styles.th}>
                  Dosage
                </th>
                <th style={styles.th}>
                  Frequency
                </th>
                <th style={styles.th}>
                  Duration
                </th>
                <th style={styles.th}>
                  Status
                </th>
                <th style={styles.th}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {prescriptions.map(
                (item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      {item.medication_name}
                    </td>

                    <td style={styles.td}>
                      {item.dosage || "-"}
                    </td>

                    <td style={styles.td}>
                      {item.frequency || "-"}
                    </td>

                    <td style={styles.td}>
                      {item.duration || "-"}
                    </td>

                    <td style={styles.td}>
                      {item.status}
                    </td>

                    <td style={styles.td}>
                      {item.status ===
                        "Pending" && (
                        <button
                          style={
                            styles.pharmacyButtonSmall
                          }
                          onClick={() =>
                            dispense(item)
                          }
                        >
                          ✅ Dispense
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* MEDICAL RECORD */

function MedicalRecord({
  appointment,
  user,
  goBack,
  goBilling,
}) {
  const [history, setHistory] =
    useState([]);

  const [record, setRecord] =
    useState({
      visit_date: new Date()
        .toISOString()
        .slice(0, 10),
      chief_complaint: "",
      history_of_present_illness: "",
      blood_pressure: "",
      pulse: "",
      temperature: "",
      respiratory_rate: "",
      oxygen_saturation: "",
      diagnosis: "",
      treatment_plan: "",
      clinical_notes: "",
    });

  useEffect(() => {
    if (appointment?.patient_number) {
      loadHistory();
    }
  }, [appointment]);

  async function loadHistory() {
    const { data } =
      await supabase
        .from("medical_records")
        .select("*")
        .eq(
          "patient_number",
          appointment.patient_number
        )
        .order("visit_date", {
          ascending: false,
        })
        .order("id", {
          ascending: false,
        });

    setHistory(data || []);
  }

  function handleChange(e) {
    setRecord({
      ...record,
      [e.target.name]: e.target.value,
    });
  }

  async function saveRecord(e) {
    e.preventDefault();

    const data = {
      patient_number:
        appointment.patient_number,

      visit_date:
        record.visit_date,

      chief_complaint:
        record.chief_complaint ||
        null,

      history_of_present_illness:
        record.history_of_present_illness ||
        null,

      blood_pressure:
        record.blood_pressure ||
        null,

      pulse: record.pulse
        ? Number(record.pulse)
        : null,

      temperature:
        record.temperature
          ? Number(record.temperature)
          : null,

      respiratory_rate:
        record.respiratory_rate
          ? Number(record.respiratory_rate)
          : null,

      oxygen_saturation:
        record.oxygen_saturation
          ? Number(
              record.oxygen_saturation
            )
          : null,

      diagnosis:
        record.diagnosis ||
        null,

      treatment_plan:
        record.treatment_plan ||
        null,

      clinical_notes:
        record.clinical_notes ||
        null,

      created_by: user.id,
    };

    const { error } =
      await supabase
        .from("medical_records")
        .insert([data]);

    if (error) {
      alert(error.message);
      return;
    }

    await loadHistory();

    setRecord((current) => ({
      ...current,
      chief_complaint: "",
      history_of_present_illness: "",
      diagnosis: "",
      treatment_plan: "",
      clinical_notes: "",
    }));
  }

  if (!appointment) {
    return (
      <div style={styles.panel}>
        <h2>📋 Medical Record</h2>
        <p>No patient selected.</p>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>📋 Medical Record</h2>
          <p>Patient medical history and clinical visit record.</p>
        </div>

        <button
          style={styles.cancelButton}
          onClick={goBack}
        >
          ← Back
        </button>
      </div>

      <div style={styles.patientHeader}>
        <Detail
          label="Patient Number"
          value={appointment.patient_number}
        />

        <Detail
          label="Appointment Date"
          value={appointment.appointment_date}
        />

        <Detail
          label="Department"
          value={appointment.department}
        />

        <Detail
          label="Doctor"
          value={appointment.doctor_name}
        />
      </div>

      <div style={styles.formBox}>
        <h3>New Clinical Record</h3>

        <form onSubmit={saveRecord}>
          <div style={styles.formGrid}>
            <input
              type="date"
              name="visit_date"
              value={record.visit_date}
              onChange={handleChange}
            />

            <input
              name="blood_pressure"
              placeholder="Blood Pressure"
              value={record.blood_pressure}
              onChange={handleChange}
            />

            <input
              type="number"
              name="pulse"
              placeholder="Pulse"
              value={record.pulse}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.1"
              name="temperature"
              placeholder="Temperature °C"
              value={record.temperature}
              onChange={handleChange}
            />

            <input
              type="number"
              name="respiratory_rate"
              placeholder="Respiratory Rate"
              value={
                record.respiratory_rate
              }
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="oxygen_saturation"
              placeholder="Oxygen Saturation %"
              value={
                record.oxygen_saturation
              }
              onChange={handleChange}
            />

            <textarea
              name="chief_complaint"
              placeholder="Chief Complaint"
              value={
                record.chief_complaint
              }
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />

            <textarea
              name="history_of_present_illness"
              placeholder="History of Present Illness"
              value={
                record.history_of_present_illness
              }
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />

            <input
              name="diagnosis"
              placeholder="Diagnosis"
              value={record.diagnosis}
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
              }}
            />

            <textarea
              name="treatment_plan"
              placeholder="Treatment Plan"
              value={
                record.treatment_plan
              }
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />

            <textarea
              name="clinical_notes"
              placeholder="Clinical Notes"
              value={
                record.clinical_notes
              }
              onChange={handleChange}
              style={{
                gridColumn: "1 / -1",
                minHeight: "80px",
              }}
            />
          </div>

          <button
            type="submit"
            style={styles.primaryButton}
          >
            💾 Save Medical Record
          </button>

          <button
            type="button"
            style={styles.paymentButton}
            onClick={() =>
              goBilling(appointment)
            }
          >
            💳 Go to Payment
          </button>
        </form>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Medical History</h3>

        {history.length === 0 && (
          <p>No medical records found.</p>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            style={styles.historyCard}
          >
            <strong>
              Visit Date: {item.visit_date}
            </strong>

            <p>
              <strong>Diagnosis:</strong>{" "}
              {item.diagnosis || "-"}
            </p>

            <p>
              <strong>Chief Complaint:</strong>{" "}
              {item.chief_complaint || "-"}
            </p>

            <p>
              <strong>Treatment Plan:</strong>{" "}
              {item.treatment_plan || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* BILLING */

function Billing({
  appointment,
  user,
  goBack,
}) {
  const [transactions, setTransactions] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] = useState({
    description: "",
    quantity: 1,
    unit_price: "",
    payment_method: "",
    payment_status: "Unpaid",
    notes: "",
  });

  useEffect(() => {
    loadTransactions();
  }, [appointment]);

  async function loadTransactions() {
    let query = supabase
      .from("billing_transactions")
      .select("*")
      .order("id", { ascending: false });

    if (appointment?.patient_number) {
      query = query.eq(
        "patient_number",
        appointment.patient_number
      );
    }

    const { data } = await query;
    setTransactions(data || []);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveTransaction(e) {
    e.preventDefault();

    if (!appointment?.patient_number) {
      alert("No patient selected.");
      return;
    }

    if (!form.description) {
      alert("Description is required.");
      return;
    }

    const quantity = Number(form.quantity) || 1;
    const unitPrice = Number(form.unit_price) || 0;

    const data = {
      patient_number:
        appointment.patient_number,

      appointment_id:
        appointment.id
          ? Number(appointment.id)
          : null,

      consultation_id:
        appointment.consultation_id
          ? Number(
              appointment.consultation_id
            )
          : null,

      transaction_date:
        new Date()
          .toISOString()
          .slice(0, 10),

      description:
        form.description,

      quantity,
      unit_price: unitPrice,
      total_amount:
        quantity * unitPrice,

      payment_method:
        form.payment_method ||
        null,

      payment_status:
        form.payment_status ||
        "Unpaid",

      notes:
        form.notes || null,

      created_by: user.id,
    };

    const { error } =
      await supabase
        .from("billing_transactions")
        .insert([data]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      description: "",
      quantity: 1,
      unit_price: "",
      payment_method: "",
      payment_status: "Unpaid",
      notes: "",
    });

    setShowForm(false);
    await loadTransactions();
  }

  async function updatePayment(item, status) {
    const { error } =
      await supabase
        .from("billing_transactions")
        .update({
          payment_status: status,
        })
        .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTransactions();
  }

  const total = transactions.reduce(
    (sum, item) =>
      sum + Number(item.total_amount || 0),
    0
  );

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h2>💳 Billing</h2>
          <p>Billing transactions and payment status.</p>
        </div>

        <div>
          <button
            style={styles.cancelButton}
            onClick={goBack}
          >
            ← Back
          </button>

          <button
            style={styles.paymentButton}
            onClick={() =>
              setShowForm(true)
            }
          >
            + New Charge
          </button>
        </div>
      </div>

      {appointment && (
        <div style={styles.linkedAppointment}>
          <Detail
            label="Patient Number"
            value={appointment.patient_number}
          />

          <Detail
            label="Appointment Date"
            value={appointment.appointment_date}
          />
        </div>
      )}

      {showForm && (
        <div style={styles.formBox}>
          <h3>New Billing Charge</h3>

          <form onSubmit={saveTransaction}>
            <div style={styles.formGrid}>
              <input
                name="description"
                placeholder="Description *"
                value={form.description}
                onChange={handleChange}
              />

              <input
                type="number"
                min="1"
                name="quantity"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                name="unit_price"
                placeholder="Unit Price"
                value={form.unit_price}
                onChange={handleChange}
              />

              <select
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="">
                  Payment Method
                </option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">
                  Bank Transfer
                </option>
                <option value="Mobile Money">
                  Mobile Money
                </option>
              </select>

              <select
                name="payment_status"
                value={form.payment_status}
                onChange={handleChange}
              >
                <option value="Unpaid">
                  Unpaid
                </option>
                <option value="Partial">
                  Partial
                </option>
                <option value="Paid">
                  Paid
                </option>
              </select>

              <textarea
                name="notes"
                placeholder="Notes"
                value={form.notes}
                onChange={handleChange}
                style={{
                  gridColumn: "1 / -1",
                  minHeight: "80px",
                }}
              />
            </div>

            <button
              type="submit"
              style={styles.paymentButton}
            >
              💾 Save Charge
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div style={styles.paymentSummary}>
        <h3>Total Charges</h3>
        <strong style={styles.bigNumber}>
          {total.toFixed(2)}
        </strong>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Billing Transactions</h3>

        {transactions.length === 0 && (
          <p>No billing transactions found.</p>
        )}

        {transactions.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  Description
                </th>
                <th style={styles.th}>
                  Qty
                </th>
                <th style={styles.th}>
                  Unit Price
                </th>
                <th style={styles.th}>
                  Total
                </th>
                <th style={styles.th}>
                  Payment
                </th>
                <th style={styles.th}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      {item.description}
                    </td>

                    <td style={styles.td}>
                      {item.quantity}
                    </td>

                    <td style={styles.td}>
                      {Number(
                        item.unit_price
                      ).toFixed(2)}
                    </td>

                    <td style={styles.td}>
                      {Number(
                        item.total_amount
                      ).toFixed(2)}
                    </td>

                    <td style={styles.td}>
                      {item.payment_status}
                    </td>

                    <td style={styles.td}>
                      {item.payment_status !==
                        "Paid" && (
                        <button
                          style={
                            styles.paymentButtonSmall
                          }
                          onClick={() =>
                            updatePayment(
                              item,
                              "Paid"
                            )
                          }
                        >
                          ✅ Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <strong>{label}</strong>
      <p>{value || "-"}</p>
    </div>
  );
}

function setAppointmentContextForLocal() {
  // Navigation is intentionally handled from the parent App.
  // Laboratory can also be opened directly from the sidebar.
}

const globalSystemStyles = `
  html, body, #root {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
    font-family: "Times New Roman", Times, serif !important;
  }

  *, *::before, *::after {
    box-sizing: border-box !important;
    font-family: "Times New Roman", Times, serif !important;
  }

  body {
    font-size: 18px !important;
    line-height: 1.45 !important;
  }

  h1 { font-size: 34px !important; line-height: 1.2 !important; }
  h2 { font-size: 28px !important; line-height: 1.25 !important; }
  h3 { font-size: 22px !important; line-height: 1.3 !important; }
  h4 { font-size: 20px !important; line-height: 1.3 !important; }

  p, span, label, div, button, input, select, textarea, th, td, small {
    font-family: "Times New Roman", Times, serif !important;
  }

  button, input, select, textarea {
    font-size: 18px !important;
  }

  button {
    font-weight: 700 !important;
  }
`;

const styles = {
  app: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    background: "#f4f7fb",
    fontFamily: "Times New Roman, Times, serif",
  },

  sidebar: {
    width: "100%",
    background: "#163a5f",
    color: "white",
    padding: "14px 18px 10px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
  },

  topUtilityBar: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: "18px",
  },

  logoutTopButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: "9px",
    background: "#b91c1c",
    color: "white",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  logoWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },

  logo: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.1,
  },

  topSystemLabel: {
    marginTop: "4px",
    fontSize: "17px",
    fontWeight: 700,
    opacity: 0.95,
  },

  topUserBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
    fontSize: "17px",
    whiteSpace: "nowrap",
  },

  topNav: {
    display: "flex",
    alignItems: "stretch",
    gap: "8px",
    overflow: "visible",
    flexWrap: "wrap",
    paddingBottom: "2px",
    position: "relative",
  },

  topNavButton: {
    flex: "0 0 auto",
    padding: "13px 16px",
    border: "none",
    borderRadius: "9px",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  activeTopNav: {
    flex: "0 0 auto",
    padding: "13px 16px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  navDropdown: {
    position: "relative",
    flex: "0 0 auto",
  },

  overlayBackdrop: {
    position: "fixed",
    inset: 0,
    background: "transparent",
    zIndex: 4999,
  },

  overlayDropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: 0,
    width: "360px",
    maxWidth: "calc(100vw - 24px)",
    background: "white",
    border: "2px solid #cbd5e1",
    borderRadius: "16px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
    padding: "16px",
    zIndex: 5000,
  },
  overlayDropdownTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
    marginBottom: "10px",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "20px",
  },
  overlayCloseButton: {
    border: "0",
    background: "#f1f5f9",
    borderRadius: "10px",
    padding: "7px 11px",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  overlayPrimaryList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  overlayPrimaryButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "2px solid #e2e8f0",
    background: "#f8fafc",
    color: "#111827",
    borderRadius: "12px",
    padding: "14px 14px",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  overlayPrimaryActive: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "2px solid #2563eb",
    background: "#eff6ff",
    color: "#1e3a8a",
    borderRadius: "12px",
    padding: "14px 14px",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  overlayFlyout: {
    position: "absolute",
    top: "58px",
    left: "calc(100% + 10px)",
    width: "330px",
    maxWidth: "calc(100vw - 24px)",
    background: "white",
    border: "2px solid #cbd5e1",
    borderRadius: "16px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
    padding: "12px",
    zIndex: 5001,
  },
  overlayFlyoutItem: {
    width: "100%",
    border: "2px solid transparent",
    background: "transparent",
    color: "#111827",
    borderRadius: "10px",
    padding: "13px 12px",
    marginBottom: "4px",
    fontSize: "17px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },

  topNavSummary: {
    listStyle: "none",
    padding: "13px 16px",
    borderRadius: "9px",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  activeTopNavSummary: {
    listStyle: "none",
    padding: "13px 16px",
    borderRadius: "9px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    minWidth: "255px",
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
    padding: "8px",
    border: "1px solid #dbe3ef",
  },

  dropdownItem: {
    width: "100%",
    padding: "12px 14px",
    border: "none",
    borderRadius: "8px",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "18px",
    fontWeight: 700,
    display: "block",
  },

  menu: {
    width: "100%",
    padding: "12px",
    marginBottom: "8px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
  },

  activeMenu: {
    width: "100%",
    padding: "12px",
    marginBottom: "8px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
  },

  logoutMenu: {
    width: "100%",
    marginTop: "auto",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#b91c1c",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
  },

  main: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    padding: "30px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontWeight: 800,
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "6px",
  },

  userBox: {
    background: "white",
    padding: "12px 18px",
    borderRadius: "10px",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "25px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
  },

  bigNumber: {
    fontSize: "32px",
  },

  panel: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
  },

  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "20px",
  },

  primaryButton: {
    marginTop: "15px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },

  secondaryButton: {
    marginTop: "15px",
    marginLeft: "10px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "white",
    cursor: "pointer",
  },

  triageButton: {
    marginTop: "15px",
    marginLeft: "10px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#7c3aed",
    color: "white",
    cursor: "pointer",
  },

  doctorButton: {
    marginTop: "15px",
    marginLeft: "10px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "white",
    cursor: "pointer",
  },

  labButton: {
    marginTop: "15px",
    marginLeft: "8px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#0891b2",
    color: "white",
    cursor: "pointer",
  },

  pharmacyButton: {
    marginTop: "15px",
    marginLeft: "8px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
  },

  paymentButton: {
    marginTop: "15px",
    marginLeft: "8px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#d97706",
    color: "white",
    cursor: "pointer",
  },

  refreshButton: {
    marginTop: "15px",
    marginRight: "10px",
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "25px",
    padding: "12px 15px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
  },

  formBox: {
    marginTop: "25px",
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  detailsBox: {
    marginTop: "25px",
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  patientHeader: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "15px",
    marginTop: "25px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
  },

  linkedAppointment: {
    marginTop: "25px",
    padding: "20px",
    background: "#f5f3ff",
    borderRadius: "12px",
    border: "1px solid #ddd6fe",
  },

  historyCard: {
    marginTop: "15px",
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  paymentSummary: {
    marginTop: "25px",
    padding: "20px",
    background: "white",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  viewButton: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#e0f2fe",
    cursor: "pointer",
  },

  triageButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#ede9fe",
    color: "#5b21b6",
    cursor: "pointer",
  },

  doctorButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#ccfbf1",
    color: "#115e59",
    cursor: "pointer",
  },

  mrButton: {
    marginTop: "15px",
    marginLeft: "8px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#7c3aed",
    color: "white",
    cursor: "pointer",
  },

  mrButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#ede9fe",
    color: "#5b21b6",
    cursor: "pointer",
  },

  labButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#cffafe",
    color: "#155e75",
    cursor: "pointer",
  },

  pharmacyButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    cursor: "pointer",
  },

  paymentButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#fef3c7",
    color: "#92400e",
    cursor: "pointer",
  },

  editButton: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#fef3c7",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "7px 10px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    fontSize: "15px",
    marginLeft: "10px",
  },

  messageBox: {
    marginTop: "20px",
    padding: "12px 15px",
    background: "#f1f5f9",
    borderRadius: "8px",
    fontWeight: "bold",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
};

export default App;