import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const EMPTY_FORM = {
  chief_complaint: "",
  history: "",
  examination: "",
  diagnosis: "",
  investigation_notes: "",
  prescription_notes: "",
  disposition: "",
  disposition_department: "",
};

export default function OPDWorkflow({ clinic, title, professionalScope = "" }) {
  const [tab, setTab] = useState("Active Patients");
  const [triageRows, setTriageRows] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageStep, setManageStep] = useState("View");
  const [form, setForm] = useState(EMPTY_FORM);
  const [investigations, setInvestigations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const loadData = async () => {
    setLoading(true);

    const [
      { data: triageData, error: triageError },
      { data: encounterData, error: encounterError },
      { data: patientData, error: patientError },
    ] = await Promise.all([
      supabase
        .from("triage_records")
        .select("*")
        .eq("scope", "OPD")
        .order("created_at", { ascending: false }),
      supabase
        .from("opd_encounters")
        .select("*")
        .eq("clinic", clinic)
        .order("created_at", { ascending: false }),
      supabase.from("patients").select("*"),
    ]);

    if (triageError) console.error(triageError);
    if (encounterError) console.error(encounterError);
    if (patientError) console.error(patientError);

    if (triageError || encounterError || patientError) {
      setMessage(
        triageError?.message ||
          encounterError?.message ||
          patientError?.message ||
          "Unable to load OPD data."
      );
    }

    setTriageRows(triageData || []);
    setEncounters(encounterData || []);
    setPatients(patientData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [clinic]);

  const patientMap = useMemo(() => {
    const map = {};
    patients.forEach((p) => {
      const key = p.patient_number ?? p.card_number ?? p.id;
      if (key !== undefined && key !== null) map[String(key)] = p;
    });
    return map;
  }, [patients]);

  const getPatient = (number) => patientMap[String(number)] || {};

  const getName = (number) => {
    const p = getPatient(number);
    return (
      p.full_name ||
      [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") ||
      p.name ||
      "Unknown patient"
    );
  };

  const today = new Date().toISOString().slice(0, 10);

  const activePatients = useMemo(() => {
    const active = encounters.filter(
      (e) => e.status !== "Completed" && e.status !== "Closed"
    );

    const existingTriageIds = new Set(
      active
        .map((e) => String(e.triage_record_id))
        .filter(Boolean)
    );

    const waiting = triageRows
      .filter((t) => {
        const triageDate = String(
          t.triage_date || t.created_at || ""
        ).slice(0, 10);

        return (
          triageDate === today &&
          !existingTriageIds.has(String(t.id))
        );
      })
      .map((t) => ({
        ...t,
        __waitingFromTriage: true,
      }));

    return [...active, ...waiting];
  }, [encounters, triageRows, today]);

  const allPatients = encounters;

  const rows = (tab === "Active Patients" ? activePatients : allPatients).filter(
    (row) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;

      return (
        String(row.patient_number || "").toLowerCase().includes(q) ||
        getName(row.patient_number).toLowerCase().includes(q)
      );
    }
  );

  const createEncounter = async (row) => {
    if (!row.__waitingFromTriage) return row;

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("opd_encounters")
      .insert({
        patient_number: row.patient_number,
        triage_record_id: row.id,
        clinic,
        professional_scope: professionalScope || null,
        status: "Waiting Examination",
        chief_complaint: row.chief_complaint || "",
        created_by: userData?.user?.id || null,
      })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      return null;
    }

    return data;
  };

  const openManage = async (row) => {
    const encounter = await createEncounter(row);
    if (!encounter) return;

    const patient = getPatient(encounter.patient_number);

    setSelected({ ...encounter, __patient: patient });

    setForm({
      chief_complaint: encounter.chief_complaint || "",
      history: encounter.history || "",
      examination: encounter.examination || "",
      diagnosis: encounter.diagnosis || "",
      investigation_notes: encounter.investigation_notes || "",
      prescription_notes: encounter.prescription_notes || "",
      disposition: encounter.disposition || "",
      disposition_department: encounter.disposition_department || "",
    });

    setManageStep("View");
    setManageOpen(true);
    await loadOrders(encounter.id);
    await loadData();
  };

  const loadOrders = async (id) => {
    const [{ data: inv }, { data: rx }] = await Promise.all([
      supabase
        .from("opd_investigations")
        .select("*")
        .eq("encounter_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("opd_prescriptions")
        .select("*")
        .eq("encounter_id", id)
        .order("created_at", { ascending: false }),
    ]);

    setInvestigations(inv || []);
    setPrescriptions(rx || []);
  };

  const save = async (extra = {}) => {
    if (!selected?.id) return;

    const { error } = await supabase
      .from("opd_encounters")
      .update({ ...form, ...extra })
      .eq("id", selected.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Saved successfully.");
    await loadData();
  };

  const finish = async (status) => {
    if (!selected?.id) return;

    const { error } = await supabase
      .from("opd_encounters")
      .update({
        ...form,
        status,
      })
      .eq("id", selected.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setManageOpen(false);
    setSelected(null);
    setMessage(status === "Completed" ? "Patient visit completed." : "Patient visit closed.");
    await loadData();
  };

  const addInvestigation = async () => {
    const test = window.prompt("Investigation / test name:");
    if (!test?.trim() || !selected?.id) return;

    const { error } = await supabase
      .from("opd_investigations")
      .insert({
        encounter_id: selected.id,
        test_name: test.trim(),
        priority: "Routine",
        clinical_note: "",
        status: "Ordered",
      });

    if (error) setMessage(error.message);
    else {
      setMessage("Investigation ordered.");
      await loadOrders(selected.id);
    }
  };

  const addPrescription = async () => {
    const medicine = window.prompt("Medicine name:");
    if (!medicine?.trim() || !selected?.id) return;

    const { error } = await supabase
      .from("opd_prescriptions")
      .insert({
        encounter_id: selected.id,
        medicine_name: medicine.trim(),
        dose: "",
        route: "",
        frequency: "",
        duration: "",
        quantity: "",
        instruction: "",
        status: "Active",
      });

    if (error) setMessage(error.message);
    else {
      setMessage("Prescription added.");
      await loadOrders(selected.id);
    }
  };

  const addNote = async () => {
    if (!selected?.id) return;

    const note = window.prompt("Enter note:");
    if (!note?.trim()) return;

    const oldNotes = form.investigation_notes || "";
    const next =
      oldNotes +
      (oldNotes ? "\n\n" : "") +
      `[Note ${new Date().toLocaleString()}] ${note.trim()}`;

    setForm((v) => ({ ...v, investigation_notes: next }));

    const { error } = await supabase
      .from("opd_encounters")
      .update({ investigation_notes: next })
      .eq("id", selected.id);

    if (error) setMessage(error.message);
    else setMessage("Note added.");
  };

  const renderStep = () => {
    if (!selected) return null;

    if (manageStep === "View") {
      return (
        <div>
          <h2>Patient View</h2>
          <div className="workflow-info">
            <div><b>Patient Number:</b> {selected.patient_number}</div>
            <div><b>Name:</b> {getName(selected.patient_number)}</div>
            <div><b>Clinic:</b> {clinic}</div>
            <div><b>Status:</b> {selected.status}</div>
            <div><b>Sex:</b> {selected.__patient?.sex || "—"}</div>
            <div><b>Phone:</b> {selected.__patient?.phone || "—"}</div>
            <div><b>Chief Complaint:</b> {selected.chief_complaint || "—"}</div>
          </div>
        </div>
      );
    }

    if (manageStep === "Visit") {
      return (
        <div>
          <h2>Visit</h2>
          <label>Chief Complaint</label>
          <textarea
            value={form.chief_complaint}
            onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
          />
          <label>History</label>
          <textarea
            value={form.history}
            onChange={(e) => setForm({ ...form, history: e.target.value })}
          />
          <label>Examination</label>
          <textarea
            value={form.examination}
            onChange={(e) => setForm({ ...form, examination: e.target.value })}
          />
          <button onClick={() => save({ status: "Under Examination" })}>
            Save Visit
          </button>
        </div>
      );
    }

    if (manageStep === "Diagnosis") {
      return (
        <div>
          <h2>Diagnosis</h2>
          <label>Diagnosis</label>
          <textarea
            value={form.diagnosis}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          />
          <label>Prescription Notes</label>
          <textarea
            value={form.prescription_notes}
            onChange={(e) =>
              setForm({ ...form, prescription_notes: e.target.value })
            }
          />
          <button onClick={() => save({ status: "Diagnosis Completed" })}>
            Save Diagnosis
          </button>

          <hr />
          <h3>Prescription</h3>
          <button onClick={addPrescription}>➕ Add Prescription</button>

          {prescriptions.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dose</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.medicine_name}</td>
                    <td>{p.dose || "—"}</td>
                    <td>{p.frequency || "—"}</td>
                    <td>{p.duration || "—"}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (manageStep === "Investigation") {
      return (
        <div>
          <h2>Investigation</h2>
          <label>Investigation Notes</label>
          <textarea
            value={form.investigation_notes}
            onChange={(e) =>
              setForm({ ...form, investigation_notes: e.target.value })
            }
          />
          <button onClick={() => save({ status: "Investigation Ordered" })}>
            Save Investigation
          </button>
          <hr />
          <button onClick={addInvestigation}>➕ Order Investigation</button>

          {investigations.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {investigations.map((i) => (
                  <tr key={i.id}>
                    <td>{i.test_name}</td>
                    <td>{i.priority}</td>
                    <td>{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (manageStep === "Appointment Management") {
      return (
        <div>
          <h2>Appointment Management</h2>
          <p>
            Appointment management is available from the patient's OPD workflow.
          </p>
          <p>
            Use the existing appointment module/table to create or manage the
            patient's next appointment.
          </p>
        </div>
      );
    }

    if (manageStep === "Add Note") {
      return (
        <div>
          <h2>Add Note</h2>
          <button onClick={addNote}>➕ Add Note</button>
          <label>Saved Notes</label>
          <textarea readOnly value={form.investigation_notes || ""} />
        </div>
      );
    }

    return null;
  };

  const steps = [
    "View",
    "Visit",
    "Diagnosis",
    "Investigation",
    "Appointment Management",
    "Add Note",
  ];

  return (
    <div className="opd-workflow">
      <style>{`
        .opd-workflow {
          width: 100%;
          font-family: "Times New Roman", Times, serif;
          font-size: 20px;
        }

        .workflow-title {
          margin: 10px 0 20px;
          font-size: 32px;
        }

        .workflow-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .workflow-tabs button,
        .workflow-page button {
          font-family: inherit;
          font-size: 19px;
          font-weight: bold;
          padding: 10px 15px;
          border: 1px solid #555;
          border-radius: 7px;
          cursor: pointer;
          background: white;
        }

        .workflow-tabs button.active {
          border: 3px solid #222;
        }

        .workflow-toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .workflow-toolbar input {
          flex: 1;
          min-width: 280px;
          padding: 12px;
          font: inherit;
          border: 1px solid #777;
          border-radius: 7px;
        }

        .workflow-table-wrap {
          overflow-x: auto;
        }

        .workflow-page table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .workflow-page th,
        .workflow-page td {
          border: 1px solid #888;
          padding: 12px;
          text-align: left;
        }

        .workflow-page th {
          font-weight: bold;
        }

        .workflow-empty,
        .workflow-message {
          border: 1px solid #777;
          border-radius: 8px;
          padding: 20px;
          font-weight: bold;
        }

        .workflow-message {
          margin-bottom: 15px;
        }

        .workflow-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .workflow-modal {
          width: min(1200px, 96vw);
          max-height: 94vh;
          overflow: auto;
          background: white;
          border: 2px solid #333;
          border-radius: 10px;
          padding: 24px;
        }

        .workflow-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .workflow-steps {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .workflow-info {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .workflow-info > div {
          border: 1px solid #999;
          padding: 12px;
        }

        .workflow-page label {
          display: block;
          font-weight: bold;
          margin-top: 12px;
        }

        .workflow-page textarea {
          width: 100%;
          min-height: 100px;
          box-sizing: border-box;
          padding: 10px;
          font: inherit;
          border: 1px solid #777;
          border-radius: 6px;
          margin-top: 5px;
        }

        .workflow-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 25px;
          flex-wrap: wrap;
        }

        .finish-buttons {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 800px) {
          .workflow-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="workflow-page">
        <h1 className="workflow-title">🏥 {title}</h1>

        {message && <div className="workflow-message">{message}</div>}

        <div className="workflow-tabs">
          <button
            className={tab === "Active Patients" ? "active" : ""}
            onClick={() => setTab("Active Patients")}
          >
            Active Patients ({activePatients.length})
          </button>

          <button
            className={tab === "All Patients" ? "active" : ""}
            onClick={() => setTab("All Patients")}
          >
            All Patients ({allPatients.length})
          </button>

          <button onClick={loadData}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="workflow-toolbar">
          <input
            placeholder="Search patient name or patient number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <b>{clinic}</b>
        </div>

        {rows.length === 0 ? (
          <div className="workflow-empty">
            {tab === "Active Patients"
              ? `No active patient in ${clinic} today.`
              : `No OPD encounters found for ${clinic}.`}
          </div>
        ) : (
          <div className="workflow-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient Number</th>
                  <th>Patient Name</th>
                  <th>Chief Complaint</th>
                  <th>Status</th>
                  <th>Manage</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.patient_number}</td>
                    <td>{getName(row.patient_number)}</td>
                    <td>{row.chief_complaint || "—"}</td>
                    <td>{row.status || "Waiting OPD"}</td>
                    <td>
                      <button onClick={() => openManage(row)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {manageOpen && selected && (
        <div className="workflow-modal-backdrop">
          <div className="workflow-modal">
            <div className="workflow-modal-head">
              <div>
                <h2 style={{ margin: 0 }}>Manage Patient</h2>
                <div>
                  <b>{getName(selected.patient_number)}</b> —{" "}
                  {selected.patient_number}
                </div>
              </div>

              <button onClick={() => setManageOpen(false)}>
                ✕ Close
              </button>
            </div>

            <div className="workflow-steps">
              {steps.map((step) => (
                <button
                  key={step}
                  className={manageStep === step ? "active" : ""}
                  onClick={() => setManageStep(step)}
                >
                  {step}
                </button>
              ))}
            </div>

            {renderStep()}

            <div className="workflow-actions">
              <button onClick={() => setManageOpen(false)}>
                Back
              </button>

              <div className="finish-buttons">
                <button onClick={() => finish("Completed")}>
                  Finish
                </button>

                <button onClick={() => finish("Closed")}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
