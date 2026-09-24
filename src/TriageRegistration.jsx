import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function TriageRegistration({ user, initialMode = "Reception", initialPatientNumber = "" }) {
  const [section, setSection] = useState(initialMode);
  const [selectedPatientNumber, setSelectedPatientNumber] = useState(initialPatientNumber);
  const [showTriage, setShowTriage] = useState(initialMode === "Triage");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSection(initialMode);
    setSelectedPatientNumber(initialPatientNumber || "");
    setShowTriage(initialMode === "Triage");
    setMessage("");
  }, [initialMode, initialPatientNumber]);

  function openTriage(patientNumber = "") {
    setSelectedPatientNumber(patientNumber);
    setMessage("");
    setShowTriage(true);
  }


  return (
    <div style={styles.wrapper}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={{ margin: 0 }}>🧾 Triage & Registration</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>
            Reception, reports and registration are organized under one module.
          </p>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {showTriage ? (
        <TriageSection
          user={user}
          selectedPatientNumber={selectedPatientNumber}
          onBackToReception={() => {
            setShowTriage(false);
            setMessage("");
          }}
        />
      ) : (
        <Reception
          key={section}
          mode={section}
          user={user}
          onSendToTriage={openTriage}
          onMessage={setMessage}
        />
      )}
    </div>
  );
}

function Reception({ mode = "Reception", user, onSendToTriage, onMessage }) {
  const emptyForm = {
    first_name: "",
    father_name: "",
    grandfather_name: "",
    card_number: "",
    sex: "",
    birth_date_type: "",
    birth_year: "",
    birth_month: "",
    birth_day: "",
    birth_time: "",
    region: "",
    zone: "",
    woreda: "",
    kebele: "",
    phone: "",
    nationality: "",
    marital_status: "",
    physical_status: "",
    education: "",
    occupation: "",
    referred_from: "",
  };

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [registrationMenu, setRegistrationMenu] = useState("entry");
  const [reportsMenu, setReportsMenu] = useState("quality");
  const [activeArea, setActiveArea] = useState("registration");
  const [listView, setListView] = useState("daily");
  const TRIAGE_TYPES = [
    "Adult emergency triage",
    "Central Triage",
    "Pedi Triage",
    "Gyn Triage",
    "Obs Triage",
    "Neonatal triage",
  ];
  const [receptionTriageType, setReceptionTriageType] = useState("Central Triage");

  useEffect(() => {
    if (mode === "Report") {
      setActiveArea("reports");
      setReportsMenu("quality");
    } else if (mode === "Register") {
      setActiveArea("registration");
      setRegistrationMenu("patients");
    } else if (mode === "Attach Document") {
      setActiveArea("documents");
      setDocumentPatient(null);
      setDocuments([]);
      setDocumentSearch("");
      setDocumentSearchResults([]);
      setDocumentSearchPerformed(false);
    } else {
      setActiveArea("registration");
      setRegistrationMenu("entry");
    }
  }, [mode]);

  const [entrySearch, setEntrySearch] = useState("");
  const [entrySearchPerformed, setEntrySearchPerformed] = useState(false);
  const [entrySearchResults, setEntrySearchResults] = useState([]);
  const [listSearch, setListSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const [imrSearch, setImrSearch] = useState("");
  const [imrPatient, setImrPatient] = useState(null);
  const [imrData, setImrData] = useState({
    appointments: [],
    triage: [],
    medicalRecords: [],
    consultations: [],
  });
  const [imrLoading, setImrLoading] = useState(false);

  const [documentPatient, setDocumentPatient] = useState(null);
  const [documentSearch, setDocumentSearch] = useState("");
  const [documentSearchResults, setDocumentSearchResults] = useState([]);
  const [documentSearchPerformed, setDocumentSearchPerformed] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({
    document_type: "",
    description: "",
    given_by: "",
    attached_by: "",
    document_date: getLocalDate(),
    document_time: new Date().toTimeString().slice(0, 5),
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentSaving, setDocumentSaving] = useState(false);

  const [qualityStart, setQualityStart] = useState(getLocalDate());
  const [qualityEnd, setQualityEnd] = useState(getLocalDate());
  const [qualityCategory, setQualityCategory] = useState("Reception");
  const [showQualityCategoryMenu, setShowQualityCategoryMenu] = useState(false);
  const [qualityData, setQualityData] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  const [tracerSearch, setTracerSearch] = useState("");
  const [tracerStart, setTracerStart] = useState("");
  const [tracerEnd, setTracerEnd] = useState("");
  const [tracerAppointments, setTracerAppointments] = useState([]);
  const [tracerLoading, setTracerLoading] = useState(false);

  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");

  const selectedRegion = regions.find((item) => item.id === form.region);
  const selectedZone = zones.find((item) => item.id === form.zone);
  const availableZones = selectedRegion
    ? zones.filter((item) => item.regionId === selectedRegion.id)
    : [];
  const availableWoredas = selectedZone
    ? woredas.filter((item) => item.zoneId === selectedZone.id)
    : [];

  useEffect(() => {
    loadPatients();
    loadAppointments();
    loadLocations();
  }, []);

  async function loadPatients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      onMessage(`❌ ${error.message}`);
      setPatients([]);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  }

  async function loadAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (error) {
      onMessage(`❌ ${error.message}`);
      setAppointments([]);
    } else {
      setAppointments(data || []);
    }
  }

  async function loadLocations() {
    const cached = localStorage.getItem("emr_ethiopia_admin_v2026");
    try {
      setLocationLoading(true);
      setLocationError("");
      let records = cached ? JSON.parse(cached) : null;
      if (!Array.isArray(records) || records.length === 0) {
        const response = await fetch(
          "https://raw.githubusercontent.com/open-admin-data/ethiopia-administrative-divisions/master/data/all-woreda.json"
        );
        if (!response.ok) throw new Error(`Location data request failed (${response.status}).`);
        records = await response.json();
        localStorage.setItem("emr_ethiopia_admin_v2026", JSON.stringify(records));
      }

      const regionMap = new Map();
      const zoneMap = new Map();
      const woredaList = [];
      records.forEach((record) => {
        const region = record.ancestors?.find((item) => item.level === 1);
        const zone = record.parent;
        if (region) {
          regionMap.set(region.id, {
            id: region.id,
            name: region.name?.local || region.name?.en || region.id,
            englishName: region.name?.en || region.name?.local || region.id,
          });
        }
        if (zone) {
          zoneMap.set(zone.id, {
            id: zone.id,
            regionId: region?.id || "",
            name: zone.name?.local || zone.name?.en || zone.id,
            englishName: zone.name?.en || zone.name?.local || zone.id,
          });
        }
        woredaList.push({
          id: record.id,
          zoneId: zone?.id || "",
          name: record.name?.local || record.name?.en || record.id,
          englishName: record.name?.en || record.name?.local || record.id,
        });
      });
      const sortItems = (items) => items.sort((a, b) => a.name.localeCompare(b.name));
      setRegions(sortItems(Array.from(regionMap.values())));
      setZones(sortItems(Array.from(zoneMap.values())));
      setWoredas(sortItems(woredaList));
    } catch (error) {
      console.error("Location loading error:", error);
      setLocationError(
        "Could not load the Ethiopia administrative list. Please check your internet connection and refresh."
      );
    } finally {
      setLocationLoading(false);
    }
  }

  async function queuePatientForTriage(patientNumber, triageType = receptionTriageType) {
    if (!patientNumber) {
      onMessage("❗ Patient number is missing.");
      return;
    }
    if (!triageType) {
      onMessage("❗ Please select the destination triage unit.");
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("triage_records")
      .select("id, patient_number, triage_type, disposition")
      .eq("patient_number", patientNumber)
      .eq("triage_type", triageType)
      .is("disposition", null)
      .limit(1);

    if (existingError) {
      onMessage(`❌ ${existingError.message}`);
      return;
    }

    if (existing && existing.length > 0) {
      onMessage(`⚠️ ${patientNumber} is already waiting in ${triageType}.`);
      return;
    }

    const { error } = await supabase.from("triage_records").insert([{
      patient_number: patientNumber,
      triage_type: triageType,
      triage_date: getLocalDate(),
      arrival_time: new Date().toTimeString().slice(0, 5),
      triage_status: "Pending",
      created_by: user?.id || null,
    }]);

    if (error) {
      onMessage(`❌ Could not send patient to ${triageType}: ${error.message}`);
      return;
    }

    onMessage(`✅ Patient ${patientNumber} saved and sent to ${triageType}.`);
  }

  async function sendSearchResultToTriage(patientNumber) {
    await queuePatientForTriage(patientNumber, receptionTriageType);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function generatePatientNumber() {
    const suffix = String(Date.now()).slice(-6);
    return `P${suffix}`;
  }

  function performEntrySearch() {
    const text = entrySearch.toLowerCase().trim();
    if (!text) {
      setEntrySearchPerformed(false);
      setEntrySearchResults([]);
      onMessage("❗ Search for the patient before registration.");
      return;
    }
    const matches = patients.filter((patient) =>
      [
        patient.patient_number,
        patient.first_name,
        patient.father_name,
        patient.grandfather_name,
        patient.phone,
      ].some((value) => String(value || "").toLowerCase().includes(text))
    );
    setEntrySearchPerformed(true);
    setEntrySearchResults(matches);
    onMessage(
      matches.length > 0
        ? `⚠️ ${matches.length} matching patient${matches.length === 1 ? "" : "s"} found. Registration is blocked to help prevent duplicates.`
        : "✅ No matching patient found. You can now register the patient."
    );
  }

  function resetEntrySearch() {
    setEntrySearch("");
    setEntrySearchPerformed(false);
    setEntrySearchResults([]);
    setForm(emptyForm);
    setDocumentPatient(null);
    setDocuments([]);
    setDocumentFile(null);
    setDocumentForm({
      document_type: "",
      description: "",
      given_by: "",
      attached_by: "",
      document_date: getLocalDate(),
      document_time: new Date().toTimeString().slice(0, 5),
    });
    onMessage("");
  }

  async function loadPatientDocuments(patientNumber) {
    if (!patientNumber) return;
    setDocumentsLoading(true);
    const { data, error } = await supabase
      .from("patient_documents")
      .select("*")
      .eq("patient_number", patientNumber)
      .order("id", { ascending: false });
    if (error) {
      onMessage(`❌ ${error.message}`);
      setDocuments([]);
    } else {
      setDocuments(data || []);
    }
    setDocumentsLoading(false);
  }

  async function performDocumentPatientSearch() {
    const text = documentSearch.trim();
    if (!text) {
      onMessage("❗ Enter a patient number, name or phone number to search.");
      setDocumentSearchPerformed(false);
      setDocumentSearchResults([]);
      return;
    }

    setDocumentsLoading(true);
    onMessage("");
    const lowered = text.toLowerCase();
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .or(`patient_number.ilike.%${text}%,first_name.ilike.%${text}%,father_name.ilike.%${text}%,grandfather_name.ilike.%${text}%,phone.ilike.%${text}%`)
      .order("id", { ascending: false });

    if (error) {
      setDocumentsLoading(false);
      setDocumentSearchPerformed(true);
      setDocumentSearchResults([]);
      onMessage(`❌ ${error.message}`);
      return;
    }

    const cleaned = (data || []).filter((patient) => {
      const haystack = [
        patient.patient_number,
        patient.first_name,
        patient.father_name,
        patient.grandfather_name,
        patient.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowered);
    });

    setDocumentSearchPerformed(true);
    setDocumentSearchResults(cleaned);
    setDocumentsLoading(false);
  }

  async function openDocumentManager(patient) {
    setDocumentPatient(patient);
    setDocumentFile(null);
    setDocumentForm({
      document_type: "",
      description: "",
      given_by: "",
      attached_by: "",
      document_date: getLocalDate(),
      document_time: new Date().toTimeString().slice(0, 5),
    });
    await loadPatientDocuments(patient.patient_number);
    onMessage("");
  }

  async function attachPatientDocument(e) {
    e.preventDefault();
    if (!documentPatient?.patient_number) {
      onMessage("❗ Select a patient before attaching a document.");
      return;
    }
    if (!documentFile) {
      onMessage("❗ Please choose a file to attach.");
      return;
    }
    if (!documentForm.document_type.trim()) {
      onMessage("❗ Document type is required.");
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (documentFile.size > maxBytes) {
      onMessage("❗ File is too large. Maximum allowed size is 10 MB.");
      return;
    }

    setDocumentSaving(true);
    onMessage("");
    const safeName = documentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${documentPatient.patient_number}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("patient-documents")
      .upload(filePath, documentFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: documentFile.type || undefined,
      });

    if (uploadError) {
      setDocumentSaving(false);
      onMessage(`❌ Document upload failed: ${uploadError.message}`);
      return;
    }

    const { error: metadataError } = await supabase
      .from("patient_documents")
      .insert([{
        patient_number: documentPatient.patient_number,
        document_type: documentForm.document_type.trim(),
        description: documentForm.description.trim() || null,
        given_by: documentForm.given_by.trim() || null,
        attached_by: documentForm.attached_by.trim() || null,
        document_date: documentForm.document_date || null,
        document_time: documentForm.document_time || null,
        file_name: documentFile.name,
        storage_path: filePath,
        mime_type: documentFile.type || null,
        file_size: documentFile.size,
        created_by: user?.id || null,
      }]);

    if (metadataError) {
      await supabase.storage.from("patient-documents").remove([filePath]);
      setDocumentSaving(false);
      onMessage(`❌ Could not save document details: ${metadataError.message}`);
      return;
    }

    setDocumentFile(null);
    setDocumentForm({
      document_type: "",
      description: "",
      given_by: "",
      attached_by: "",
      document_date: getLocalDate(),
      document_time: new Date().toTimeString().slice(0, 5),
    });
    await loadPatientDocuments(documentPatient.patient_number);
    setDocumentSaving(false);
    onMessage(`✅ Document attached to patient ${documentPatient.patient_number}.`);
  }

  async function openStoredDocument(documentRow) {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(documentRow.storage_path, 60 * 10);
    if (error) {
      onMessage(`❌ Could not open document: ${error.message}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deletePatientDocument(documentRow) {
    if (!window.confirm(`Delete document \"${documentRow.file_name}\"?`)) return;
    const { error: storageError } = await supabase.storage
      .from("patient-documents")
      .remove([documentRow.storage_path]);
    if (storageError) {
      onMessage(`❌ Could not delete file: ${storageError.message}`);
      return;
    }
    const { error: metadataError } = await supabase
      .from("patient_documents")
      .delete()
      .eq("id", documentRow.id);
    if (metadataError) {
      onMessage(`❌ File deleted but record cleanup failed: ${metadataError.message}`);
      return;
    }
    await loadPatientDocuments(documentPatient.patient_number);
    onMessage("✅ Document deleted.");
  }

  async function registerPatient(e) {
    e.preventDefault();
    if (!entrySearchPerformed) {
      onMessage("❗ Please search for the patient first.");
      return;
    }
    if (entrySearchResults.length > 0) {
      onMessage("❌ Registration is blocked because a matching patient already exists.");
      return;
    }
    if (!form.first_name.trim() || !form.father_name.trim()) {
      onMessage("❗ First name and father's name are required.");
      return;
    }
    if (!form.sex) {
      onMessage("❗ Please select sex.");
      return;
    }
    if (!form.birth_date_type || !form.birth_year || !form.birth_month || !form.birth_day) {
      onMessage("❗ Birth date type, year, month and day are required.");
      return;
    }
    if (!receptionTriageType) {
      onMessage("❗ Please select the destination triage unit.");
      return;
    }
    const month = Number(form.birth_month);
    const day = Number(form.birth_day);
    const year = Number(form.birth_year);
    if (month < 1 || month > 12 || day < 1 || day > 31 || !Number.isInteger(year)) {
      onMessage("❗ Please enter a valid birth year, month and day.");
      return;
    }

    setSaving(true);
    onMessage("");
    const patientNumber = generatePatientNumber();
    const patientData = {
      patient_number: patientNumber,
      first_name: form.first_name.trim(),
      father_name: form.father_name.trim(),
      grandfather_name: form.grandfather_name.trim() || null,
      card_number: form.card_number.trim() || null,
      sex: form.sex || null,
      birth_date_type: form.birth_date_type || null,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      birth_month: form.birth_month ? Number(form.birth_month) : null,
      birth_day: form.birth_day ? Number(form.birth_day) : null,
      birth_time: form.birth_time || null,
      region: selectedRegion?.name || null,
      zone: selectedZone?.name || null,
      woreda: form.woreda || null,
      kebele: form.kebele.trim() || null,
      phone: form.phone.trim() || null,
      nationality: form.nationality.trim() || null,
      marital_status: form.marital_status || null,
      physical_status: form.physical_status || null,
      education: form.education || null,
      occupation: form.occupation.trim() || null,
      referred_from: form.referred_from.trim() || null,
    };

    const { error } = await supabase.from("patients").insert([patientData]);
    if (error) {
      onMessage(`❌ ${error.message}`);
      setSaving(false);
      return;
    }

    const { error: triageError } = await supabase.from("triage_records").insert([{
      patient_number: patientNumber,
      triage_type: receptionTriageType,
      triage_date: getLocalDate(),
      arrival_time: new Date().toTimeString().slice(0, 5),
      triage_status: "Pending",
      created_by: user?.id || null,
    }]);

    const createdPatient = { ...patientData };
    setDocumentPatient(createdPatient);
    setDocuments([]);
    setDocumentFile(null);
    setDocumentForm({
      document_type: "",
      description: "",
      given_by: "",
      attached_by: "",
      document_date: getLocalDate(),
      document_time: new Date().toTimeString().slice(0, 5),
    });
    setForm(emptyForm);
    setSaving(false);
    setEntrySearchPerformed(false);
    setEntrySearchResults([]);
    setEntrySearch("");
    if (triageError) {
      onMessage(`✅ Patient ${patientNumber} registered. ⚠️ Could not send to ${receptionTriageType}: ${triageError.message}`);
    } else {
      onMessage(`✅ Patient ${patientNumber} registered, saved at Reception, and sent to ${receptionTriageType}.`);
    }
    await Promise.all([loadPatients(), loadAppointments()]);
    setRegistrationMenu("patients");
  }

  const today = getLocalDate();
  const dailyPatients = patients.filter((patient) => getPatientRegistrationDate(patient) === today);
  const basePatientList = listView === "daily" ? dailyPatients : patients;
  const filteredPatients = basePatientList.filter((patient) => {
    const text = listSearch.toLowerCase().trim();
    return (
      !text ||
      [
        patient.patient_number,
        patient.first_name,
        patient.father_name,
        patient.grandfather_name,
        patient.phone,
        patient.region,
        patient.zone,
        patient.woreda,
      ].some((value) => String(value || "").toLowerCase().includes(text))
    );
  });

  const filteredAppointments = appointments.filter((item) => {
    const text = appointmentSearch.toLowerCase().trim();
    return (
      !text ||
      [item.patient_number, item.doctor_name, item.department, item.status, item.location]
        .some((value) => String(value || "").toLowerCase().includes(text))
    );
  });

  async function runImrTracer() {
    const text = imrSearch.toLowerCase().trim();
    if (!text) {
      onMessage("❗ Enter patient number, name or phone for IMR tracing.");
      return;
    }
    const patient = patients.find((item) =>
      [item.patient_number, item.first_name, item.father_name, item.grandfather_name, item.phone]
        .some((value) => String(value || "").toLowerCase().includes(text))
    );
    if (!patient) {
      setImrPatient(null);
      setImrData({ appointments: [], triage: [], medicalRecords: [], consultations: [] });
      onMessage("⚠️ Patient not found.");
      return;
    }

    setImrLoading(true);
    setImrPatient(patient);
    const [a, t, m, c] = await Promise.all([
      supabase.from("appointments").select("*").eq("patient_number", patient.patient_number).order("appointment_date", { ascending: false }),
      supabase.from("triage_records").select("*").eq("patient_number", patient.patient_number).order("triage_date", { ascending: false }),
      supabase.from("medical_records").select("*").eq("patient_number", patient.patient_number).order("visit_date", { ascending: false }),
      supabase.from("doctor_consultations").select("*").eq("patient_number", patient.patient_number).order("consultation_date", { ascending: false }),
    ]);
    setImrData({
      appointments: a.data || [],
      triage: t.data || [],
      medicalRecords: m.data || [],
      consultations: c.data || [],
    });
    setImrLoading(false);
  }

  async function runQualityReport() {
    setQualityLoading(true);
    const [p, a, t, c] = await Promise.all([
      supabase.from("patients").select("*").order("id", { ascending: false }),
      supabase.from("appointments").select("*").order("appointment_date", { ascending: false }),
      supabase.from("triage_records").select("*").order("triage_date", { ascending: false }),
      supabase.from("doctor_consultations").select("*").order("consultation_date", { ascending: false }),
    ]);

    const patientsData = (p.data || []).filter((row) => {
      const d = getPatientRegistrationDate(row);
      return (!qualityStart || d >= qualityStart) && (!qualityEnd || d <= qualityEnd);
    });
    const appointmentData = (a.data || []).filter((row) => inDateRange(row.appointment_date, qualityStart, qualityEnd));
    const triageData = (t.data || []).filter((row) => inDateRange(row.triage_date, qualityStart, qualityEnd));
    const consultationData = (c.data || []).filter((row) => inDateRange(row.consultation_date, qualityStart, qualityEnd));

    const completePatient = (row) =>
      Boolean(
        row.first_name &&
        row.father_name &&
        row.sex &&
        row.birth_date_type &&
        row.birth_year &&
        row.birth_month &&
        row.birth_day &&
        row.region &&
        row.zone &&
        row.woreda
      );

    const completeCount = patientsData.filter(completePatient).length;
    const totalAppointments = appointmentData.length;
    const completedAppointments = appointmentData.filter((x) => x.status === "Completed").length;
    const cancelledAppointments = appointmentData.filter((x) => x.status === "Cancelled").length;
    const noShowAppointments = appointmentData.filter((x) => x.status === "No Show").length;

    const triageByScore = [
      { label: "No score recorded", count: triageData.filter((x) => x.pain_score === null || x.pain_score === undefined || x.pain_score === "").length },
      { label: "Low (0-3)", count: triageData.filter((x) => Number(x.pain_score) >= 0 && Number(x.pain_score) <= 3).length },
      { label: "Moderate (4-6)", count: triageData.filter((x) => Number(x.pain_score) >= 4 && Number(x.pain_score) <= 6).length },
      { label: "High (7-10)", count: triageData.filter((x) => Number(x.pain_score) >= 7 && Number(x.pain_score) <= 10).length },
    ];

    const triageByCaseCategory = Array.from(
      triageData.reduce((map, row) => {
        const key = row.triage_type || row.scope || "Unassigned";
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map()),
      ([label, count]) => ({ label, count })
    ).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    setQualityData({
      patients: patientsData,
      appointments: appointmentData,
      triage: triageData,
      consultations: consultationData,
      triageByScore,
      triageByCaseCategory,
      metrics: {
        registeredPatients: patientsData.length,
        completeProfiles: completeCount,
        profileCompleteness: patientsData.length ? Math.round((completeCount / patientsData.length) * 100) : 0,
        appointments: totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        triageRecords: triageData.length,
        consultations: consultationData.length,
        totalPatientLoad: patientsData.length,
      },
    });
    setQualityLoading(false);
  }

  async function runAppointmentTracer() {
    setTracerLoading(true);
    let query = supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (tracerStart) query = query.gte("appointment_date", tracerStart);
    if (tracerEnd) query = query.lte("appointment_date", tracerEnd);
    const { data, error } = await query;
    if (error) {
      onMessage(`❌ ${error.message}`);
      setTracerAppointments([]);
      setTracerLoading(false);
      return;
    }
    const text = tracerSearch.toLowerCase().trim();
    setTracerAppointments(
      (data || []).filter((item) =>
        !text ||
        [item.patient_number, item.doctor_name, item.department, item.status, item.location]
          .some((value) => String(value || "").toLowerCase().includes(text))
      )
    );
    setTracerLoading(false);
  }

  function exportCsv(filename, rows) {
    if (!rows || rows.length === 0) {
      onMessage("⚠️ There is no data to export.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const escapeCell = (value) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replaceAll('"', '""')}"`;
    };
    const csv = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printReport(title) {
    const oldTitle = document.title;
    document.title = title;
    window.print();
    document.title = oldTitle;
  }

  function openList(menu) {
    setRegistrationMenu(menu);
    setActiveArea("registration");
    onMessage("");
  }

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.row}>
          <div>
            <h3 style={{ margin: 0 }}>🧑‍💼 Reception</h3>
            <p style={styles.helpText}>Registration, patient tracking and reception reports.</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => { loadPatients(); loadAppointments(); }}>
            🔄 Refresh
          </button>
        </div>

        <div style={styles.dropdownRow}>
          {mode === "Reception" && (
            <div style={styles.dropdownGroup}>
              <label style={styles.dropdownLabel}>Reception Menu</label>
              <select
                style={styles.dropdown}
                value={registrationMenu}
                onChange={(e) => openList(e.target.value)}
              >
                <option value="entry">📝 Patient Entry</option>
                <option value="patients">👥 Reception Patient List</option>
              </select>
            </div>
          )}

          {mode === "Register" && (
            <div style={styles.dropdownGroup}>
              <label style={styles.dropdownLabel}>Register Menu</label>
              <select
                style={styles.dropdown}
                value={registrationMenu}
                onChange={(e) => openList(e.target.value)}
              >
                <option value="patients">👥 Registration Patient List</option>
                <option value="appointments">📅 Appointment List</option>
                <option value="imr">📂 IMR Tracer</option>
                <option value="appointmentTracer">🔎 Appointment Tracer</option>
              </select>
            </div>
          )}

          {mode === "Attach Document" && (
            <div style={styles.dropdownGroup}>
              <label style={styles.dropdownLabel}>Attach Document Menu</label>
              <select style={styles.dropdown} value="documents" disabled>
                <option value="documents">📎 Attach Document</option>
              </select>
            </div>
          )}

          {mode === "Report" && (
            <div style={styles.dropdownGroup}>
              <label style={styles.dropdownLabel}>Report Menu</label>
              <select
                style={styles.dropdown}
                value={reportsMenu}
                onChange={(e) => {
                  setReportsMenu(e.target.value);
                  onMessage("");
                }}
              >
                <option value="quality">📈 Quality Report</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {activeArea === "registration" && registrationMenu === "entry" && (
        <div style={styles.panel}>
          <h3>📝 Patient Entry</h3>
          <p style={styles.helpText}>Search first. Registration is available only after a search is completed and no matching patient is found.</p>

          <div style={styles.searchBox}>
            🔍
            <input
              style={styles.searchInput}
              placeholder="Search patient number, name or phone..."
              value={entrySearch}
              onChange={(e) => {
                setEntrySearch(e.target.value);
                setEntrySearchPerformed(false);
                setEntrySearchResults([]);
                onMessage("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  performEntrySearch();
                }
              }}
            />
            <button type="button" style={styles.primaryButton} onClick={performEntrySearch}>🔍 Search</button>
          </div>

          {entrySearchPerformed && entrySearchResults.length > 0 && (
            <div style={styles.warningBox}>
              <strong>Existing patient found</strong>
              <p style={{ marginBottom: 10 }}>Registration is disabled because a matching patient already exists.</p>
              <div style={{ ...styles.formBox, marginBottom: "14px" }}>
                <Field label="Destination Triage Unit *">
                  <select value={receptionTriageType} onChange={(e) => setReceptionTriageType(e.target.value)}>
                    <option value="">Select triage unit *</option>
                    {TRIAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Patient Number</th><th style={styles.th}>Name</th><th style={styles.th}>Sex</th><th style={styles.th}>Phone</th><th style={styles.th}>Action</th></tr></thead>
                  <tbody>
                    {entrySearchResults.map((patient) => (
                      <tr key={patient.id}>
                        <td style={styles.td}>{patient.patient_number}</td>
                        <td style={styles.td}>{[patient.first_name, patient.father_name, patient.grandfather_name].filter(Boolean).join(" ")}</td>
                        <td style={styles.td}>{patient.sex || "-"}</td>
                        <td style={styles.td}>{patient.phone || "-"}</td>
                        <td style={styles.td}>
                          <button type="button" style={styles.triageButton} onClick={() => sendSearchResultToTriage(patient.patient_number)}>🩺 Save & Send to Triage</button>
                          <button type="button" style={styles.documentButtonSmall} onClick={() => openDocumentManager(patient)}>📎 Manage Documents</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {entrySearchPerformed && entrySearchResults.length === 0 && (
            <div style={styles.successBox}>✅ No matching patient found. The registration form is now unlocked.</div>
          )}

          <div style={{ ...styles.formBox, opacity: !entrySearchPerformed || entrySearchResults.length > 0 ? 0.68 : 1 }}>
            <h4>New Patient Registration</h4>
            <form onSubmit={registerPatient}>
              <div style={styles.formSectionTitle}>👤 Personal Information</div>
              <div style={styles.formGrid}>
                <Field label="First Name *"><input name="first_name" placeholder="Enter first name" value={form.first_name} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Father's Name *"><input name="father_name" placeholder="Enter father's name" value={form.father_name} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Grandfather's Name"><input name="grandfather_name" placeholder="Enter grandfather's name" value={form.grandfather_name} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Card Number"><input name="card_number" placeholder="Enter card number" value={form.card_number} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Sex *"><select name="sex" value={form.sex} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0}><option value="">Select sex *</option><option value="Male">Male</option><option value="Female">Female</option></select></Field>
                <Field label="Birth Date Type *"><select name="birth_date_type" value={form.birth_date_type} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0}><option value="">Select date type *</option><option value="Gregorian">Gregorian</option><option value="Ethiopian">Ethiopian</option></select></Field>
                <Field label="Birth Year *"><input type="number" name="birth_year" placeholder="Year" value={form.birth_year} onChange={handleChange} min="1" disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Birth Month *"><input type="number" name="birth_month" placeholder="Month (1-12)" value={form.birth_month} onChange={handleChange} min="1" max="12" disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Birth Day *"><input type="number" name="birth_day" placeholder="Day (1-31)" value={form.birth_day} onChange={handleChange} min="1" max="31" disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Birth Time"><input type="time" name="birth_time" value={form.birth_time} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
              </div>

              <div style={styles.formSectionTitle}>📍 Address Information</div>
              {locationError && <div style={styles.warningBox}>⚠️ {locationError} <button type="button" style={styles.secondaryButton} onClick={loadLocations}>🔄 Reload Locations</button></div>}
              <div style={styles.formGrid}>
                <Field label="Region"><select value={form.region} onChange={(e) => setForm((current) => ({ ...current, region: e.target.value, zone: "", woreda: "" }))} disabled={!entrySearchPerformed || entrySearchResults.length > 0 || locationLoading}><option value="">{locationLoading ? "Loading regions..." : "Select region"}</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.name}{region.englishName !== region.name ? ` / ${region.englishName}` : ""}</option>)}</select></Field>
                <Field label="Zone"><select value={form.zone} onChange={(e) => setForm((current) => ({ ...current, zone: e.target.value, woreda: "" }))} disabled={!entrySearchPerformed || entrySearchResults.length > 0 || locationLoading || !selectedRegion}><option value="">{!selectedRegion ? "Select region first" : locationLoading ? "Loading zones..." : "Select zone"}</option>{availableZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.englishName !== zone.name ? ` / ${zone.englishName}` : ""}</option>)}</select></Field>
                <Field label="Woreda"><select value={form.woreda} onChange={(e) => setForm((current) => ({ ...current, woreda: e.target.value }))} disabled={!entrySearchPerformed || entrySearchResults.length > 0 || locationLoading || !selectedZone}><option value="">{!selectedZone ? "Select zone first" : locationLoading ? "Loading woredas..." : "Select woreda"}</option>{availableWoredas.map((woreda) => <option key={woreda.id} value={woreda.name}>{woreda.name}{woreda.englishName !== woreda.name ? ` / ${woreda.englishName}` : ""}</option>)}</select></Field>
                <Field label="Kebele"><input name="kebele" placeholder="Enter kebele" value={form.kebele} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Phone Number"><input name="phone" placeholder="Enter phone number" value={form.phone} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
              </div>

              <div style={styles.formSectionTitle}>📋 Social & Administrative Information</div>
              <div style={styles.formGrid}>
                <Field label="Nationality"><input name="nationality" placeholder="Enter nationality" value={form.nationality} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Marital Status"><select name="marital_status" value={form.marital_status} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0}><option value="">Select marital status</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option></select></Field>
                <Field label="Physical Status"><select name="physical_status" value={form.physical_status} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0}><option value="">Select physical status</option><option value="No Disability">No Disability</option><option value="Physical Disability">Physical Disability</option><option value="Other">Other</option></select></Field>
                <Field label="Education Level"><select name="education" value={form.education} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0}><option value="">Select education level</option><option value="No Formal Education">No Formal Education</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option><option value="Certificate">Certificate</option><option value="Diploma">Diploma</option><option value="Bachelor Degree">Bachelor Degree</option><option value="Master Degree">Master Degree</option><option value="Doctorate">Doctorate</option><option value="Other">Other</option></select></Field>
                <Field label="Occupation / Job"><input name="occupation" placeholder="Enter occupation / job" value={form.occupation} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
                <Field label="Referred From Institution"><input name="referred_from" placeholder="Enter referring institution" value={form.referred_from} onChange={handleChange} disabled={!entrySearchPerformed || entrySearchResults.length > 0} /></Field>
              </div>

              <div style={{ ...styles.formBox, marginTop: "18px" }}>
                <div style={styles.formSectionTitle}>🩺 Send to Triage</div>
                <Field label="Destination Triage Unit *">
                  <select
                    value={receptionTriageType}
                    onChange={(e) => setReceptionTriageType(e.target.value)}
                    disabled={!entrySearchPerformed || entrySearchResults.length > 0}
                  >
                    <option value="">Select triage unit *</option>
                    {TRIAGE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <button type="submit" style={styles.primaryButton} disabled={saving || !entrySearchPerformed || entrySearchResults.length > 0}>
                {saving ? "Saving..." : "✅ Register Patient & Save to Reception"}
              </button>
              <button type="button" style={styles.cancelButton} onClick={resetEntrySearch}>Clear Search</button>
            </form>
          </div>
        </div>
      )}

      {activeArea === "documents" && !documentPatient && (
        <div style={styles.panel}>
          <h3>📎 Attach Document</h3>
          <p style={styles.helpText}>Search for an existing patient first, then select the patient to attach a document.</p>
          <div style={styles.searchBox}>
            🔍
            <input
              style={styles.searchInput}
              placeholder="Search patient number, name or phone..."
              value={documentSearch}
              onChange={(e) => {
                setDocumentSearch(e.target.value);
                setDocumentSearchPerformed(false);
                setDocumentSearchResults([]);
                onMessage("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  performDocumentPatientSearch();
                }
              }}
            />
            <button type="button" style={styles.primaryButton} onClick={performDocumentPatientSearch}>🔍 Search Patient</button>
          </div>

          {documentSearchPerformed && documentSearchResults.length === 0 && (
            <div style={styles.warningBox}>No matching patient found. Documents can only be attached to an existing patient.</div>
          )}

          {documentSearchResults.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient Number</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Sex</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documentSearchResults.map((patient) => (
                    <tr key={patient.id}>
                      <td style={styles.td}>{patient.patient_number}</td>
                      <td style={styles.td}>{[patient.first_name, patient.father_name, patient.grandfather_name].filter(Boolean).join(" ")}</td>
                      <td style={styles.td}>{patient.sex || "-"}</td>
                      <td style={styles.td}>{patient.phone || "-"}</td>
                      <td style={styles.td}>
                        <button type="button" style={styles.documentButtonSmall} onClick={() => openDocumentManager(patient)}>📎 Attach / Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {documentPatient && (
        <div style={styles.panel}>
          <div style={styles.row}>
            <div>
              <h3>📎 Attach Document</h3>
              <p style={styles.helpText}>
                Patient: <strong>{documentPatient.patient_number}</strong> — {[documentPatient.first_name, documentPatient.father_name, documentPatient.grandfather_name].filter(Boolean).join(" ")}
              </p>
            </div>
            <button type="button" style={styles.cancelButton} onClick={() => { setDocumentPatient(null); setDocuments([]); setDocumentFile(null); }}>Close</button>
          </div>

          <div style={styles.formBox}>
            <form onSubmit={attachPatientDocument}>
              <div style={styles.formSectionTitle}>📋 Document Information</div>
              <div style={styles.formGrid}>
                <Field label="Type of Document *">
                  <select
                    name="document_type"
                    value={documentForm.document_type}
                    onChange={(e) =>
                      setDocumentForm((current) => ({
                        ...current,
                        document_type: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Document Type *</option>
                    <option value="Lab">Lab</option>
                    <option value="X-ray">X-ray</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="CT scan">CT scan</option>
                    <option value="MRI">MRI</option>
                    <option value="Consent – major">Consent – major</option>
                    <option value="Consent – minor">Consent – minor</option>
                    <option value="ECG">ECG</option>
                    <option value="Pathology">Pathology</option>
                    <option value="EEG">EEG</option>
                    <option value="Endoscopy">Endoscopy</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Description">
                  <textarea style={styles.fullTextarea} placeholder="Document description" value={documentForm.description} onChange={(e) => setDocumentForm((current) => ({ ...current, description: e.target.value }))} />
                </Field>
                <Field label="Document Given By">
                  <input placeholder="Name of person / institution that gave the document" value={documentForm.given_by} onChange={(e) => setDocumentForm((current) => ({ ...current, given_by: e.target.value }))} />
                </Field>
                <Field label="Attached By">
                  <input placeholder="Name of person attaching the document" value={documentForm.attached_by} onChange={(e) => setDocumentForm((current) => ({ ...current, attached_by: e.target.value }))} />
                </Field>
                <Field label="Document Date">
                  <input type="date" value={documentForm.document_date} onChange={(e) => setDocumentForm((current) => ({ ...current, document_date: e.target.value }))} />
                </Field>
                <Field label="Document Time">
                  <input type="time" value={documentForm.document_time} onChange={(e) => setDocumentForm((current) => ({ ...current, document_time: e.target.value }))} />
                </Field>
                <Field label="Attached File *">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                </Field>
              </div>

              {documentFile && (
                <div style={styles.fileInfo}>
                  <strong>Selected file:</strong> {documentFile.name} ({formatFileSize(documentFile.size)})
                </div>
              )}

              <button type="submit" style={styles.primaryButton} disabled={documentSaving}>
                {documentSaving ? "Uploading..." : "📎 Attach Document"}
              </button>
              <p style={styles.helpText}>Maximum file size: 10 MB. Accepted: PDF, JPG, PNG, DOC, DOCX.</p>
            </form>
          </div>

          <div style={{ marginTop: "24px" }}>
            <div style={styles.row}>
              <h4>Attached Documents</h4>
              <button type="button" style={styles.secondaryButton} onClick={() => loadPatientDocuments(documentPatient.patient_number)}>🔄 Refresh</button>
            </div>
            {documentsLoading ? <p>Loading documents...</p> : documents.length === 0 ? <p style={styles.helpText}>No documents attached yet.</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Document Type</th><th style={styles.th}>Description</th><th style={styles.th}>Given By</th><th style={styles.th}>Attached By</th><th style={styles.th}>Date</th><th style={styles.th}>Time</th><th style={styles.th}>File</th><th style={styles.th}>Actions</th></tr></thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td style={styles.td}>{doc.document_type || "-"}</td>
                        <td style={styles.td}>{doc.description || "-"}</td>
                        <td style={styles.td}>{doc.given_by || "-"}</td>
                        <td style={styles.td}>{doc.attached_by || "-"}</td>
                        <td style={styles.td}>{doc.document_date || "-"}</td>
                        <td style={styles.td}>{doc.document_time || "-"}</td>
                        <td style={styles.td}>{doc.file_name || "-"}</td>
                        <td style={styles.td}>
                          <button type="button" style={styles.viewButton} onClick={() => openStoredDocument(doc)}>👁️ Open</button>
                          <button type="button" style={styles.deleteButton} onClick={() => deletePatientDocument(doc)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeArea === "registration" && registrationMenu === "patients" && (
        <div style={styles.panel}>
          <div style={styles.row}>
            <div><h3>{listView === "daily" ? "📅 Daily Registration Patient List" : "👥 All Registration Patient List"}</h3><p style={styles.helpText}>{listView === "daily" ? `Patients registered on ${today}.` : "All registered patients."}</p></div>
            <button type="button" style={styles.primaryButton} onClick={() => { setRegistrationMenu("entry"); resetEntrySearch(); }}>📝 Patient Entry</button>
          </div>
          <div style={styles.dropdownRow}>
            <div style={styles.dropdownGroup}><label style={styles.dropdownLabel}>Patient List</label><select style={styles.dropdown} value={listView} onChange={(e) => { setListView(e.target.value); setListSearch(""); }}><option value="daily">📅 Daily Patient List</option><option value="all">👥 All Patient List</option></select></div>
          </div>
          <div style={styles.searchBox}>🔍<input style={styles.searchInput} placeholder="Search patient in this list..." value={listSearch} onChange={(e) => setListSearch(e.target.value)} /></div>
          {loading ? <p>Loading patients...</p> : filteredPatients.length === 0 ? <p>{listView === "daily" ? "No patients registered today." : "No patients found."}</p> : (
            <div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr><th style={styles.th}>Patient Number</th><th style={styles.th}>Name</th><th style={styles.th}>Sex</th><th style={styles.th}>Birth Date</th><th style={styles.th}>Phone</th><th style={styles.th}>Region</th><th style={styles.th}>Occupation</th><th style={styles.th}>Registered</th><th style={styles.th}>Action</th></tr></thead><tbody>
              {filteredPatients.map((patient) => <tr key={patient.id}><td style={styles.td}>{patient.patient_number}</td><td style={styles.td}>{[patient.first_name, patient.father_name, patient.grandfather_name].filter(Boolean).join(" ")}</td><td style={styles.td}>{patient.sex || "-"}</td><td style={styles.td}>{patient.birth_year || patient.birth_month || patient.birth_day ? `${patient.birth_year || "-"}/${patient.birth_month || "-"}/${patient.birth_day || "-"}` : "-"}</td><td style={styles.td}>{patient.phone || "-"}</td><td style={styles.td}>{patient.region || "-"}</td><td style={styles.td}>{patient.occupation || "-"}</td><td style={styles.td}>{getPatientRegistrationDate(patient) || "-"}</td><td style={styles.td}>
                    <button type="button" style={styles.triageButton} onClick={() => sendSearchResultToTriage(patient.patient_number)}>🩺 Save & Send to Triage</button>
                    <button type="button" style={styles.documentButtonSmall} onClick={() => openDocumentManager(patient)}>📎 Documents</button>
                  </td></tr>)}
            </tbody></table></div>
          )}
        </div>
      )}

      {activeArea === "registration" && registrationMenu === "appointments" && (
        <div style={styles.panel}>
          <div style={styles.row}><div><h3>📅 Appointment List</h3><p style={styles.helpText}>Appointments available to reception for tracking and patient flow.</p></div><button type="button" style={styles.secondaryButton} onClick={loadAppointments}>🔄 Refresh</button></div>
          <div style={styles.searchBox}>🔍<input style={styles.searchInput} placeholder="Search patient, doctor, department, location or status..." value={appointmentSearch} onChange={(e) => setAppointmentSearch(e.target.value)} /></div>
          {filteredAppointments.length === 0 ? <p>No appointments found.</p> : <div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr><th style={styles.th}>Patient</th><th style={styles.th}>Date</th><th style={styles.th}>Time</th><th style={styles.th}>Department</th><th style={styles.th}>Location</th><th style={styles.th}>Doctor</th><th style={styles.th}>Status</th><th style={styles.th}>Payment</th><th style={styles.th}>Action</th></tr></thead><tbody>{filteredAppointments.map((item) => <tr key={item.id}><td style={styles.td}>{item.patient_number}</td><td style={styles.td}>{item.appointment_date}</td><td style={styles.td}>{item.appointment_time || "-"}</td><td style={styles.td}>{item.department || "-"}</td><td style={styles.td}>{item.location || "-"}</td><td style={styles.td}>{item.doctor_name || "-"}</td><td style={styles.td}>{item.status || "-"}</td><td style={styles.td}>{item.payment_status || "-"}</td><td style={styles.td}><button type="button" style={styles.triageButton} onClick={() => queuePatientForTriage(item.patient_number, receptionTriageType)}>🩺 Triage</button></td></tr>)}</tbody></table></div>}
        </div>
      )}

      {activeArea === "registration" && registrationMenu === "imr" && (
        <div style={styles.panel}>
          <div className="printOnlyTitle"><h2>Integrated Medical Record (IMR) Tracer</h2></div>
          <h3>📂 IMR Tracer</h3>
          <p style={styles.helpText}>Trace one patient's integrated record across registration, appointments, triage, medical records and doctor consultations.</p>
          <div style={styles.searchBox}>🔍<input style={styles.searchInput} placeholder="Search patient number, name or phone..." value={imrSearch} onChange={(e) => setImrSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runImrTracer(); }} /><button type="button" style={styles.primaryButton} onClick={runImrTracer}>🔎 Trace IMR</button></div>
          {imrLoading && <p>Tracing patient record...</p>}
          {imrPatient && !imrLoading && <>
            <div style={styles.detailsBox}><div style={styles.detailsGrid}><Detail label="Patient Number" value={imrPatient.patient_number} /><Detail label="Name" value={[imrPatient.first_name, imrPatient.father_name, imrPatient.grandfather_name].filter(Boolean).join(" ")} /><Detail label="Sex" value={imrPatient.sex} /><Detail label="Phone" value={imrPatient.phone} /><Detail label="Region" value={imrPatient.region} /><Detail label="Woreda" value={imrPatient.woreda} /><Detail label="Registration Date" value={getPatientRegistrationDate(imrPatient)} /><Detail label="Education" value={imrPatient.education} /></div></div>
            <div style={styles.reportGrid}>
              <div style={styles.metricCard}><span>Appointments</span><strong>{imrData.appointments.length}</strong></div><div style={styles.metricCard}><span>Triage Records</span><strong>{imrData.triage.length}</strong></div><div style={styles.metricCard}><span>Medical Records</span><strong>{imrData.medicalRecords.length}</strong></div><div style={styles.metricCard}><span>Consultations</span><strong>{imrData.consultations.length}</strong></div>
            </div>
            <h4>Appointment History</h4><SmallTable rows={imrData.appointments} columns={["appointment_date", "appointment_time", "department", "doctor_name", "status"]} labels={["Date", "Time", "Department", "Doctor", "Status"]} />
            <h4>Triage History</h4><SmallTable rows={imrData.triage} columns={["triage_date", "acuity", "scope", "disposition"]} labels={["Date", "Acuity", "Scope", "Disposition"]} />
            <h4>Medical Record History</h4><SmallTable rows={imrData.medicalRecords} columns={["visit_date", "chief_complaint", "diagnosis", "treatment_plan"]} labels={["Date", "Chief Complaint", "Diagnosis", "Treatment"]} />
            <h4>Doctor Consultation History</h4><SmallTable rows={imrData.consultations} columns={["consultation_date", "doctor_name", "department", "diagnosis", "disposition"]} labels={["Date", "Doctor", "Department", "Diagnosis", "Disposition"]} />
            <div style={styles.actionRow}><button type="button" style={styles.primaryButton} onClick={() => printReport(`IMR Tracer - ${imrPatient.patient_number}`)}>🖨️ Print / Save PDF</button><button type="button" style={styles.secondaryButton} onClick={() => exportCsv(`IMR_${imrPatient.patient_number}.csv`, imrData.appointments.map((item) => ({ type: "Appointment", ...item })).concat(imrData.triage.map((item) => ({ type: "Triage", ...item })), imrData.medicalRecords.map((item) => ({ type: "Medical Record", ...item })), imrData.consultations.map((item) => ({ type: "Consultation", ...item }))))}>⬇️ Export CSV</button></div>
          </>}
        </div>
      )}

      {activeArea === "reports" && reportsMenu === "quality" && (
        <div style={styles.panel}>
          <div className="printOnlyTitle"><h2>Quality Report</h2></div>
          <div style={styles.row}>
            <div>
              <h3>📈 Quality Report</h3>
              <p style={styles.helpText}>Choose a category and date range. The report is generated from Reception registration and Triage records.</p>
            </div>
            <div>
              <button type="button" style={styles.primaryButton} onClick={runQualityReport}>
                {qualityLoading ? "Loading..." : "Generate Report"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => qualityData && printReport(`Quality Report - ${qualityCategory}`)}>🖨️ Print / Save PDF</button>
              {qualityData && <button type="button" style={styles.secondaryButton} onClick={() => exportCsv(`Quality_Report_${qualityCategory.replaceAll(" ", "_")}.csv`, buildQualityExportRows(qualityCategory, qualityData))}>⬇️ Export CSV</button>}
            </div>
          </div>

          <div style={styles.categoryOverlayAnchor}>
            <label style={styles.dropdownLabel}>Category</label>
            <button
              type="button"
              style={styles.categoryButton}
              onClick={() => setShowQualityCategoryMenu((open) => !open)}
            >
              {qualityCategory} <span style={{ marginLeft: "auto" }}>▾</span>
            </button>
            {showQualityCategoryMenu && (
              <div style={styles.categoryOverlayMenu}>
                {[
                  "Reception",
                  "Triage by score",
                  "Triage by case category",
                  "Total patient load",
                ].map((category) => (
                  <button
                    key={category}
                    type="button"
                    style={category === qualityCategory ? styles.categoryOptionActive : styles.categoryOption}
                    onClick={() => {
                      setQualityCategory(category);
                      setQualityData(null);
                      setShowQualityCategoryMenu(false);
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.dropdownRow}>
            <div style={styles.dropdownGroup}><label style={styles.dropdownLabel}>From Date</label><input style={styles.dateInput} type="date" value={qualityStart} onChange={(e) => { setQualityStart(e.target.value); setQualityData(null); }} /></div>
            <div style={styles.dropdownGroup}><label style={styles.dropdownLabel}>To Date</label><input style={styles.dateInput} type="date" value={qualityEnd} onChange={(e) => { setQualityEnd(e.target.value); setQualityData(null); }} /></div>
          </div>

          {qualityData && (
            <div style={styles.reportSection}>
              {qualityCategory === "Reception" && (
                <>
                  <div style={styles.reportGrid}>
                    <Metric label="Registered Patients" value={qualityData.metrics.registeredPatients} />
                    <Metric label="Complete Profiles" value={qualityData.metrics.completeProfiles} />
                    <Metric label="Profile Completeness" value={`${qualityData.metrics.profileCompleteness}%`} />
                  </div>
                  <h4>Reception Registered Patient List</h4>
                  <SmallTable
                    rows={qualityData.patients}
                    columns={["patient_number", "first_name", "father_name", "grandfather_name", "sex", "phone"]}
                    labels={["Patient Number", "First Name", "Father Name", "Grandfather Name", "Sex", "Phone"]}
                  />
                </>
              )}

              {qualityCategory === "Triage by score" && (
                <>
                  <div style={styles.reportGrid}><Metric label="Total Triage Records" value={qualityData.metrics.triageRecords} /></div>
                  <h4>Triage by Score</h4>
                  <SmallTable rows={qualityData.triageByScore} columns={["label", "count"]} labels={["Score Category", "Patients"]} />
                </>
              )}

              {qualityCategory === "Triage by case category" && (
                <>
                  <div style={styles.reportGrid}><Metric label="Total Triage Records" value={qualityData.metrics.triageRecords} /><Metric label="Case Categories" value={qualityData.triageByCaseCategory.length} /></div>
                  <h4>Triage by Case Category</h4>
                  <SmallTable rows={qualityData.triageByCaseCategory} columns={["label", "count"]} labels={["Triage Unit / Case Category", "Patients"]} />
                </>
              )}

              {qualityCategory === "Total patient load" && (
                <>
                  <div style={styles.reportGrid}>
                    <Metric label="Total Patient Load" value={qualityData.metrics.totalPatientLoad} />
                    <Metric label="Appointments" value={qualityData.metrics.appointments} />
                    <Metric label="Triage Records" value={qualityData.metrics.triageRecords} />
                    <Metric label="Consultations" value={qualityData.metrics.consultations} />
                  </div>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Category</th><th style={styles.th}>Total</th></tr></thead>
                    <tbody>
                      <tr><td style={styles.td}>Reception</td><td style={styles.td}>{qualityData.metrics.registeredPatients}</td></tr>
                      <tr><td style={styles.td}>Appointments</td><td style={styles.td}>{qualityData.metrics.appointments}</td></tr>
                      <tr><td style={styles.td}>Triage</td><td style={styles.td}>{qualityData.metrics.triageRecords}</td></tr>
                      <tr><td style={styles.td}>Consultations</td><td style={styles.td}>{qualityData.metrics.consultations}</td></tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeArea === "registration" && registrationMenu === "appointmentTracer" && (
        <div style={styles.panel}>
          <div className="printOnlyTitle"><h2>Appointment Tracer</h2></div>
          <div style={styles.row}><div><h3>🔎 Appointment Tracer</h3><p style={styles.helpText}>Trace appointments by patient, doctor, department, status or date.</p></div><div><button type="button" style={styles.primaryButton} onClick={runAppointmentTracer}>{tracerLoading ? "Tracing..." : "Trace Appointments"}</button><button type="button" style={styles.secondaryButton} onClick={() => tracerAppointments.length && printReport("Appointment Tracer")}>🖨️ Print / Save PDF</button><button type="button" style={styles.secondaryButton} onClick={() => exportCsv("Appointment_Tracer.csv", tracerAppointments)}>⬇️ Export CSV</button></div></div>
          <div style={styles.dropdownRow}><div style={styles.dropdownGroup}><label style={styles.dropdownLabel}>Search</label><input style={styles.searchInputStandalone} placeholder="Patient / Doctor / Department / Status" value={tracerSearch} onChange={(e) => setTracerSearch(e.target.value)} /></div><div style={styles.dropdownGroup}><label style={styles.dropdownLabel}>Start Date</label><input style={styles.dateInput} type="date" value={tracerStart} onChange={(e) => setTracerStart(e.target.value)} /></div><div style={styles.dropdownGroup}><label style={styles.dropdownLabel}>End Date</label><input style={styles.dateInput} type="date" value={tracerEnd} onChange={(e) => setTracerEnd(e.target.value)} /></div></div>
          {tracerAppointments.length === 0 ? <p style={styles.helpText}>No traced appointments yet. Set filters and click Trace Appointments.</p> : <div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr><th style={styles.th}>Patient</th><th style={styles.th}>Date</th><th style={styles.th}>Time</th><th style={styles.th}>Department</th><th style={styles.th}>Doctor</th><th style={styles.th}>Location</th><th style={styles.th}>Status</th><th style={styles.th}>Payment</th></tr></thead><tbody>{tracerAppointments.map((item) => <tr key={item.id}><td style={styles.td}>{item.patient_number}</td><td style={styles.td}>{item.appointment_date}</td><td style={styles.td}>{item.appointment_time || "-"}</td><td style={styles.td}>{item.department || "-"}</td><td style={styles.td}>{item.doctor_name || "-"}</td><td style={styles.td}>{item.location || "-"}</td><td style={styles.td}>{item.status || "-"}</td><td style={styles.td}>{item.payment_status || "-"}</td></tr>)}</tbody></table></div>}
        </div>
      )}
    </>
  );
}

function buildQualityExportRows(category, data) {
  if (category === "Reception") return data.patients || [];
  if (category === "Triage by score") return data.triageByScore || [];
  if (category === "Triage by case category") return data.triageByCaseCategory || [];
  if (category === "Total patient load") {
    return [
      { category: "Reception", total: data.metrics.registeredPatients },
      { category: "Appointments", total: data.metrics.appointments },
      { category: "Triage", total: data.metrics.triageRecords },
      { category: "Consultations", total: data.metrics.consultations },
    ];
  }
  return [];
}

function inDateRange(value, start, end) {
  if (!value) return false;
  const date = String(value).slice(0, 10);
  return (!start || date >= start) && (!end || date <= end);
}

function Metric({ label, value }) {
  return <div style={styles.metricCard}><span>{label}</span><strong>{value}</strong></div>;
}

function SmallTable({ rows, columns, labels }) {
  if (!rows || rows.length === 0) return <p style={styles.helpText}>No records found.</p>;
  return <div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr>{labels.map((label) => <th key={label} style={styles.th}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column} style={styles.td}>{row[column] || "-"}</td>)}</tr>)}</tbody></table></div>;
}

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPatientRegistrationDate(patient) {
  const value = patient.created_at || patient.registration_date || patient.registered_at;
  if (!value) return "";
  return String(value).slice(0, 10);
}


function DispositionSection({ user, onBackToTriage }) {
  const TRIAGE_TYPES = [
    "Adult emergency triage",
    "Central Triage",
    "Pedi Triage",
    "Gyn Triage",
    "Obs Triage",
    "Neonatal triage",
  ];

  const DISPOSITION_OPTIONS = [
    "Immediate Treatment",
    "Observation",
    "Doctor Review",
    "Admission",
    "Referral",
    "Discharge",
  ];

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState("All Triage Units");
  const [listView, setListView] = useState("daily");
  const [selected, setSelected] = useState(null);
  const [disposition, setDisposition] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [{ data: triageData, error: triageError }, { data: patientData, error: patientError }] =
      await Promise.all([
        supabase
          .from("triage_records")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("patients")
          .select("patient_number, first_name, father_name, grandfather_name, phone, card_number")
          .order("patient_number", { ascending: true }),
      ]);

    if (triageError) {
      alert(triageError.message);
      setRecords([]);
    } else {
      setRecords(triageData || []);
    }

    if (patientError) {
      alert(patientError.message);
      setPatients([]);
    } else {
      setPatients(patientData || []);
    }

    setLoading(false);
  }

  function patientInfo(patientNumber) {
    return patients.find((item) => item.patient_number === patientNumber);
  }

  function getPatientName(patient) {
    return patient
      ? [patient.first_name, patient.father_name, patient.grandfather_name]
          .filter(Boolean)
          .join(" ")
      : "-";
  }

  function getRecordDate(record) {
    return record.disposition_sent_at || record.created_at || `${record.triage_date}T00:00:00`;
  }

  function getAgeHours(record) {
    const value = new Date(getRecordDate(record)).getTime();
    if (Number.isNaN(value)) return 0;
    return (Date.now() - value) / (1000 * 60 * 60);
  }

  const filteredRecords = records.filter((record) => {
    const typeMatches = unit === "All Triage Units" || (record.triage_type || "") === unit;
    if (!typeMatches) return false;

    if (listView === "daily") {
      if (!record.disposition) return false;
      const sentDate = String(record.disposition_sent_at || record.created_at || record.triage_date || "").slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      if (sentDate !== today) return false;
    }

    if (listView === "pending") {
      if (record.disposition) return false;
      if (getAgeHours(record) <= 24) return false;
    }

    const patient = patientInfo(record.patient_number);
    const text = search.toLowerCase().trim();
    if (!text) return true;

    const values = [
      record.patient_number,
      record.triage_type,
      record.disposition,
      record.acuity,
      record.scope,
      patient?.first_name,
      patient?.father_name,
      patient?.grandfather_name,
      patient?.phone,
      patient?.card_number,
    ];

    return values.some((value) => String(value || "").toLowerCase().includes(text));
  });

  function openRecord(record) {
    setSelected(record);
    setDisposition(record.disposition || "");
  }

  async function updateDisposition(record) {
    if (!disposition) {
      alert("Please select a disposition.");
      return;
    }

    setSavingId(record.id);
    const { error } = await supabase
      .from("triage_records")
      .update({
        disposition,
        disposition_sent_at: record.disposition_sent_at || new Date().toISOString(),
      })
      .eq("id", record.id);

    if (error) {
      alert(error.message);
      setSavingId(null);
      return;
    }

    setSelected(null);
    setDisposition("");
    setSavingId(null);
    await loadData();
  }

  function printDispositionReport() {
    const oldTitle = document.title;
    document.title = `Disposition ${listView}`;
    window.print();
    document.title = oldTitle;
  }

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div>
          <h3 style={{ margin: 0 }}>📤 Disposition</h3>
          <p style={styles.helpText}>
            Manage patients leaving triage, across all triage units.
          </p>
        </div>
        <div>
          <button type="button" style={styles.secondaryButton} onClick={onBackToTriage}>
            ← Triage
          </button>
          <button type="button" style={styles.secondaryButton} onClick={loadData}>
            🔄 Refresh
          </button>
          <button type="button" style={styles.primaryButton} onClick={printDispositionReport}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div style={styles.reportGrid}>
        <Metric label="Daily Sent" value={records.filter((record) => record.disposition && String(record.disposition_sent_at || record.created_at || record.triage_date || "").slice(0, 10) === new Date().toISOString().slice(0, 10)).length} />
        <Metric label="Pending >24h" value={records.filter((record) => !record.disposition && getAgeHours(record) > 24).length} />
        <Metric label="All Triage Records" value={records.length} />
      </div>

      <div style={styles.formBox}>
        <div style={styles.dropdownRow}>
          <div style={styles.dropdownGroup}>
            <label style={styles.dropdownLabel}>Triage Unit</label>
            <select style={styles.dropdown} value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="All Triage Units">All Triage Units</option>
              {TRIAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div style={styles.dropdownGroup}>
            <label style={styles.dropdownLabel}>Disposition List</label>
            <select style={styles.dropdown} value={listView} onChange={(e) => setListView(e.target.value)}>
              <option value="daily">📅 Daily List — Sent Today</option>
              <option value="pending">⏳ Pending List — Over 24 Hours</option>
              <option value="all">📋 All List — All Triage Records</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "14px" }}>
          <label style={styles.dropdownLabel}>Search</label>
          <div style={styles.searchBox}>
            🔍
            <input
              style={styles.searchInput}
              placeholder="Search by phone, name or card number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading disposition list...</p>
      ) : filteredRecords.length === 0 ? (
        <p>No patients found for this disposition list.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Card Number</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Triage Unit</th>
                <th style={styles.th}>Triage Date</th>
                <th style={styles.th}>Acuity</th>
                <th style={styles.th}>Disposition</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const patient = patientInfo(record.patient_number);
                return (
                  <tr key={record.id}>
                    <td style={styles.td}>{record.patient_number}</td>
                    <td style={styles.td}>{patient?.card_number || "-"}</td>
                    <td style={styles.td}>{getPatientName(patient)}</td>
                    <td style={styles.td}>{patient?.phone || "-"}</td>
                    <td style={styles.td}>{record.triage_type || "-"}</td>
                    <td style={styles.td}>{record.triage_date || "-"}</td>
                    <td style={styles.td}>{record.acuity || "-"}</td>
                    <td style={styles.td}>{record.disposition || "Pending"}</td>
                    <td style={styles.td}>
                      <button type="button" style={styles.viewButton} onClick={() => openRecord(record)}>
                        👁️ View
                      </button>
                      <button type="button" style={styles.triageButtonSmall} onClick={() => openRecord(record)}>
                        📤 Disposition
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={styles.detailsBox}>
          <div style={styles.row}>
            <h3 style={{ margin: 0 }}>Disposition Details</h3>
            <button type="button" style={styles.cancelButton} onClick={() => setSelected(null)}>Close</button>
          </div>

          <div style={styles.detailsGrid}>
            <Detail label="Patient Number" value={selected.patient_number} />
            <Detail label="Card Number" value={patientInfo(selected.patient_number)?.card_number} />
            <Detail label="Patient Name" value={getPatientName(patientInfo(selected.patient_number))} />
            <Detail label="Phone" value={patientInfo(selected.patient_number)?.phone} />
            <Detail label="Triage Unit" value={selected.triage_type} />
            <Detail label="Triage Date" value={selected.triage_date} />
            <Detail label="Acuity" value={selected.acuity} />
            <Detail label="Current Disposition" value={selected.disposition || "Pending"} />
          </div>

          <div style={styles.formBox}>
            <div style={styles.field}>
              <label style={styles.label}>Disposition</label>
              <select value={disposition} onChange={(e) => setDisposition(e.target.value)}>
                <option value="">Select disposition</option>
                {DISPOSITION_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <button
              type="button"
              style={styles.primaryButton}
              disabled={savingId === selected.id}
              onClick={() => updateDisposition(selected)}
            >
              {savingId === selected.id ? "Saving..." : "💾 Save Disposition"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TriageSection({
  user,
  selectedPatientNumber,
  onBackToReception,
}) {
  const TRIAGE_TYPES = [
    "Adult emergency triage",
    "Central Triage",
    "Pedi Triage",
    "Gyn Triage",
    "Obs Triage",
    "Neonatal triage",
  ];

  const EXAMINATION_UNITS = [
    "Adult Emergency Examination",
    "Central Examination",
    "Pediatrics Examination",
    "Gynecology Examination",
    "Obstetrics Examination",
    "Neonatal Examination",
    "General OPD Examination",
    "Other Examination Unit",
  ];

  const today = getLocalDate();

  const makeEmptyForm = (type = "Central Triage", patientNumber = "") => ({
    patient_number: patientNumber || "",
    appointment_id: "",
    triage_type: type,
    triage_status: "Pending",
    triage_completed_at: "",
    triage_date: getLocalDate(),
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
    notes: "",
  });

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedTriageType, setSelectedTriageType] = useState("Central Triage");
  const [listView, setListView] = useState("daily");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDisposition, setShowDisposition] = useState(false);
  const [dispositionRecord, setDispositionRecord] = useState(null);
  const [examinationUnit, setExaminationUnit] = useState("");
  const [dispositionNote, setDispositionNote] = useState("");
  const [loading, setLoading] = useState(true);

  // Manage workspace: View -> Score Form -> Add Note
  const [manageRecord, setManageRecord] = useState(null);
  const [manageTab, setManageTab] = useState("view");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [wronglyAssigned, setWronglyAssigned] = useState("No");
  const [reassignTo, setReassignTo] = useState("");
  const [reassignSaving, setReassignSaving] = useState(false);

  const [form, setForm] = useState(makeEmptyForm());

  useEffect(() => {
    loadRecords();
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientNumber) return;

    const openReceptionPatient = async () => {
      const { data, error } = await supabase
        .from("triage_records")
        .select("*")
        .eq("patient_number", selectedPatientNumber)
        .order("id", { ascending: false })
        .limit(10);

      if (error) {
        alert(error.message);
        return;
      }

      const pending = (data || []).find(
        (record) =>
          !record.disposition_sent_at &&
          (record.triage_status || "Pending") !== "Completed"
      );

      if (pending) {
        openManage(pending, "view");
      } else {
        newTriage(selectedTriageType, selectedPatientNumber);
      }
    };

    openReceptionPatient();
  }, [selectedPatientNumber]);

  async function loadRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from("triage_records")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      setRecords([]);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("patient_number", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setPatients(data || []);
  }

  function patientInfo(patientNumber) {
    return patients.find((item) => item.patient_number === patientNumber);
  }

  function patientName(patientNumber) {
    const p = patientInfo(patientNumber);
    return p
      ? [p.first_name, p.father_name, p.grandfather_name]
          .filter(Boolean)
          .join(" ")
      : "-";
  }

  function recordCreatedDate(record) {
    if (record.created_at) {
      const date = new Date(record.created_at);
      if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("en-CA");
    }
    return record.triage_date || "";
  }

  function recordAgeHours(record) {
    if (!record.created_at) return 0;
    const created = new Date(record.created_at).getTime();
    if (Number.isNaN(created)) return 0;
    return (Date.now() - created) / (1000 * 60 * 60);
  }

  function isCompleted(record) {
    return (record.triage_status || "Pending") === "Completed";
  }

  function isSentToExamination(record) {
    return isCompleted(record) && Boolean(record.disposition_sent_at);
  }

  async function loadPatientHistory(patientNumber, currentId = null) {
    if (!patientNumber) {
      setHistoryRecords([]);
      return;
    }

    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("triage_records")
      .select("*")
      .eq("patient_number", patientNumber)
      .order("triage_date", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      setHistoryRecords([]);
    } else {
      setHistoryRecords(
        (data || []).filter((record) => currentId === null || record.id !== currentId)
      );
    }
    setHistoryLoading(false);
  }

  function newTriage(type = selectedTriageType, patientNumber = "") {
    setEditingId(null);
    setManageRecord(null);
    setManageTab("score");
    setForm(makeEmptyForm(type, patientNumber || selectedPatientNumber || ""));
    setShowForm(true);
    setShowDisposition(false);
    setDispositionRecord(null);
    setNoteText("");
    setWronglyAssigned("No");
    setReassignTo("");
  }

  function selectTriageType(type) {
    setSelectedTriageType(type);
    setSearch("");
    setListView("daily");
    setManageRecord(null);
    setManageTab("view");
    setEditingId(null);
    setShowForm(false);
    setShowDisposition(false);
    setDispositionRecord(null);
    setHistoryRecords([]);
    setForm(makeEmptyForm(type));
  }

  function openManage(record, tab = "view") {
    setManageRecord(record);
    setManageTab(tab);
    setSelectedTriageType(record.triage_type || selectedTriageType);
    setShowDisposition(false);
    setDispositionRecord(null);
    setWronglyAssigned("No");
    setReassignTo("");
    setNoteText("");
    loadPatientHistory(record.patient_number, record.id);

    if (tab === "score") {
      editTriage(record);
      return;
    }

    setShowForm(false);
    setEditingId(null);
  }

  function editTriage(record) {
    const recordType = record.triage_type || selectedTriageType;
    setManageRecord(record);
    setManageTab("score");
    setSelectedTriageType(recordType);
    setEditingId(record.id);

    setForm({
      patient_number: record.patient_number || "",
      appointment_id:
        record.appointment_id === null || record.appointment_id === undefined
          ? ""
          : String(record.appointment_id),
      triage_type: recordType,
      triage_status: record.triage_status || "Pending",
      triage_completed_at: record.triage_completed_at || "",
      triage_date: record.triage_date || getLocalDate(),
      arrival_time: record.arrival_time || "",
      chief_complaint: record.chief_complaint || "",
      blood_pressure: record.blood_pressure || "",
      pulse: record.pulse ?? "",
      temperature: record.temperature ?? "",
      respiratory_rate: record.respiratory_rate ?? "",
      oxygen_saturation: record.oxygen_saturation ?? "",
      pain_score: record.pain_score ?? "",
      consciousness: record.consciousness || "",
      acuity: record.acuity || "",
      scope: record.scope || "",
      notes: record.notes || "",
    });

    setShowForm(true);
    loadPatientHistory(record.patient_number, record.id);
  }

  function closeManage() {
    setManageRecord(null);
    setManageTab("view");
    setShowForm(false);
    setEditingId(null);
    setHistoryRecords([]);
    setNoteText("");
    setWronglyAssigned("No");
    setReassignTo("");
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveTriage(e) {
    e.preventDefault();

    if (!form.triage_type) {
      alert("Triage type is required.");
      return;
    }

    if (!form.patient_number.trim()) {
      alert("Patient number is required.");
      return;
    }

    const data = {
      patient_number: form.patient_number.trim(),
      appointment_id: form.appointment_id ? Number(form.appointment_id) : null,
      triage_type: form.triage_type,
      triage_status: "Completed",
      triage_completed_at: new Date().toISOString(),
      triage_date: form.triage_date,
      arrival_time: form.arrival_time || null,
      chief_complaint: form.chief_complaint || null,
      blood_pressure: form.blood_pressure || null,
      pulse: form.pulse === "" ? null : Number(form.pulse),
      temperature: form.temperature === "" ? null : Number(form.temperature),
      respiratory_rate:
        form.respiratory_rate === "" ? null : Number(form.respiratory_rate),
      oxygen_saturation:
        form.oxygen_saturation === "" ? null : Number(form.oxygen_saturation),
      pain_score: form.pain_score === "" ? null : Number(form.pain_score),
      consciousness: form.consciousness || null,
      acuity: form.acuity || null,
      scope: form.scope || null,
      notes: form.notes || null,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("triage_records")
        .update(data)
        .eq("id", editingId)
        .select("*")
        .single();
    } else {
      result = await supabase
        .from("triage_records")
        .insert([{ ...data, created_by: user?.id || null }])
        .select("*")
        .single();
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    const completedRecord = result.data;
    setShowForm(false);
    setEditingId(null);
    setManageRecord(completedRecord);
    setManageTab("view");
    await loadRecords();
    await loadPatientHistory(completedRecord.patient_number, completedRecord.id);

    // After triage is completed, immediately offer Disposition.
    setDispositionRecord(completedRecord);
    setExaminationUnit(completedRecord?.examination_unit || "");
    setDispositionNote("");
    setShowDisposition(true);
  }

  function openDisposition(record) {
    if (!isCompleted(record)) {
      alert("Please complete triage first.");
      return;
    }
    setManageRecord(record);
    setManageTab("view");
    setDispositionRecord(record);
    setExaminationUnit(record.examination_unit || "");
    setDispositionNote("");
    setShowDisposition(true);
    loadPatientHistory(record.patient_number, record.id);
  }

  async function saveDisposition() {
    if (!dispositionRecord) return;
    if (!examinationUnit) {
      alert("Please select the examination unit.");
      return;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("triage_records")
      .update({
        disposition: "Sent to Examination",
        examination_unit: examinationUnit,
        examination_entered_at: now,
        disposition_sent_at: now,
        notes:
          [dispositionRecord.notes, dispositionNote]
            .filter(Boolean)
            .join("\n") || null,
        updated_at: now,
      })
      .eq("id", dispositionRecord.id)
      .select("*")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setShowDisposition(false);
    setDispositionRecord(null);
    setExaminationUnit("");
    setDispositionNote("");
    setManageRecord(data);
    setManageTab("view");
    await loadRecords();
    await loadPatientHistory(data.patient_number, data.id);
  }

  async function saveNote() {
    if (!manageRecord) return;
    const cleanNote = noteText.trim();
    if (!cleanNote) {
      alert("Please enter a note.");
      return;
    }

    setNoteSaving(true);
    const stamp = new Date().toLocaleString();
    const author = user?.email || "User";
    const newEntry = `[${stamp}] ${author}: ${cleanNote}`;
    const combined = [manageRecord.notes, newEntry].filter(Boolean).join("\n");

    const { data, error } = await supabase
      .from("triage_records")
      .update({ notes: combined, updated_at: new Date().toISOString() })
      .eq("id", manageRecord.id)
      .select("*")
      .single();

    if (error) {
      alert(error.message);
      setNoteSaving(false);
      return;
    }

    setManageRecord(data);
    setNoteText("");
    setNoteSaving(false);
    await loadRecords();
    await loadPatientHistory(data.patient_number, data.id);
  }

  async function reassignPatient() {
    if (!manageRecord) return;

    if (wronglyAssigned !== "Yes") {
      alert('Select "Yes" under Is The Patient Wrongly Assigned? first.');
      return;
    }

    if (!reassignTo) {
      alert("Please select the new triage unit.");
      return;
    }

    if (reassignTo === manageRecord.triage_type) {
      alert("Please select a different triage unit.");
      return;
    }

    const now = new Date().toISOString();
    const auditNote = `[${new Date().toLocaleString()}] Reassigned from ${manageRecord.triage_type} to ${reassignTo} by ${user?.email || "User"}.`;

    setReassignSaving(true);
    const { data, error } = await supabase
      .from("triage_records")
      .update({
        triage_type: reassignTo,
        triage_status: "Pending",
        triage_completed_at: null,
        disposition: null,
        disposition_sent_at: null,
        examination_unit: null,
        examination_entered_at: null,
        notes: [manageRecord.notes, auditNote].filter(Boolean).join("\n") || null,
        updated_at: now,
      })
      .eq("id", manageRecord.id)
      .select("*")
      .single();

    if (error) {
      alert(error.message);
      setReassignSaving(false);
      return;
    }

    setReassignSaving(false);
    setSelectedTriageType(reassignTo);
    setListView("daily");
    setSearch("");
    closeManage();
    await loadRecords();
    alert(`Patient ${data.patient_number} was reassigned to ${reassignTo}.`);
  }

  function matchesSearch(record) {
    const text = search.toLowerCase().trim();
    if (!text) return true;

    const p = patientInfo(record.patient_number);
    const name = [p?.first_name, p?.father_name, p?.grandfather_name]
      .filter(Boolean)
      .join(" ");

    return [
      record.patient_number,
      record.triage_type,
      record.acuity,
      record.scope,
      record.disposition,
      p?.phone,
      p?.card_number,
      name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(text);
  }

  const unitRecords = records.filter(
    (record) => (record.triage_type || "") === selectedTriageType
  );

  const visibleRecords = unitRecords.filter((record) => {
    const sent = isSentToExamination(record);
    const completed = isCompleted(record);

    if (listView === "daily") {
      return recordCreatedDate(record) === today && !sent && matchesSearch(record);
    }
    if (listView === "pending") {
      return !completed && !sent && recordAgeHours(record) > 24 && matchesSearch(record);
    }
    return completed && sent && matchesSearch(record);
  });

  const dailyCount = unitRecords.filter(
    (record) => recordCreatedDate(record) === today && !isSentToExamination(record)
  ).length;
  const pendingCount = unitRecords.filter(
    (record) =>
      !isCompleted(record) &&
      !isSentToExamination(record) &&
      recordAgeHours(record) > 24
  ).length;
  const allCount = unitRecords.filter(isSentToExamination).length;

  const currentPatient = manageRecord
    ? patientInfo(manageRecord.patient_number)
    : null;

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.row}>
          <div>
            <h3 style={{ margin: 0 }}>🩺 Triage</h3>
            <p style={styles.helpText}>
              Card/Reception → selected triage unit → Manage → View / Score Form / Add Note → Disposition → Examination.
            </p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={onBackToReception}>
            ← Reception
          </button>
        </div>

        <div style={styles.formBox}>
          <label style={styles.dropdownLabel}>Triage Unit</label>
          <select
            style={styles.fullSelect}
            value={selectedTriageType}
            onChange={(e) => selectTriageType(e.target.value)}
          >
            {TRIAGE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={styles.searchBox}>
          🔍
          <input
            style={styles.searchInput}
            placeholder="Search by phone, name or card number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.triageListTabs}>
          <button type="button" style={listView === "daily" ? styles.activeTab : styles.tab} onClick={() => setListView("daily")}>
            📅 Daily List <span style={styles.badge}>{dailyCount}</span>
          </button>
          <button type="button" style={listView === "pending" ? styles.activeTab : styles.tab} onClick={() => setListView("pending")}>
            ⏳ Pending &gt;24 Hours <span style={styles.badge}>{pendingCount}</span>
          </button>
          <button type="button" style={listView === "all" ? styles.activeTab : styles.tab} onClick={() => setListView("all")}>
            📋 All List <span style={styles.badge}>{allCount}</span>
          </button>
        </div>

        <div style={styles.panel}>
          <div style={styles.row}>
            <div>
              <h3 style={{ margin: 0 }}>
                {listView === "daily" && "📅 Daily List — Sent from Card Today"}
                {listView === "pending" && "⏳ Pending List — Over 24 Hours"}
                {listView === "all" && "📋 All List — Sent to Examination"}
              </h3>
              <p style={styles.helpText}>
                {selectedTriageType} · {visibleRecords.length} patient{visibleRecords.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {loading ? (
            <p>Loading triage patients...</p>
          ) : visibleRecords.length === 0 ? (
            <p>No patients found in this list.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Card Number</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Sent</th>
                    <th style={styles.th}>Triage Status</th>
                    {listView === "all" && <th style={styles.th}>Examination Unit</th>}
                    {listView === "all" && <th style={styles.th}>Examination Time</th>}
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record) => {
                    const p = patientInfo(record.patient_number);
                    const name = patientName(record.patient_number);
                    const completed = isCompleted(record);
                    const sent = isSentToExamination(record);

                    return (
                      <tr key={record.id}>
                        <td style={styles.td}>{record.patient_number}</td>
                        <td style={styles.td}>{p?.card_number || "-"}</td>
                        <td style={styles.td}>{name}</td>
                        <td style={styles.td}>{p?.phone || "-"}</td>
                        <td style={styles.td}>
                          {record.created_at
                            ? new Date(record.created_at).toLocaleString()
                            : record.triage_date}
                        </td>
                        <td style={styles.td}>{record.triage_status || "Pending"}</td>
                        {listView === "all" && <td style={styles.td}>{record.examination_unit || "-"}</td>}
                        {listView === "all" && (
                          <td style={styles.td}>
                            {record.examination_entered_at
                              ? new Date(record.examination_entered_at).toLocaleString()
                              : "-"}
                          </td>
                        )}
                        <td style={styles.td}>
                          {listView !== "all" && !completed && (
                            <button type="button" style={styles.editButton} onClick={() => openManage(record, "view")}>
                              🩺 Manage
                            </button>
                          )}

                          {listView !== "all" && completed && !sent && (
                            <button type="button" style={styles.secondaryButton} onClick={() => openDisposition(record)}>
                              📤 Disposition
                            </button>
                          )}

                          {listView === "all" && (
                            <button type="button" style={styles.viewButton} onClick={() => openManage(record, "view")}>
                              👁️ View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {manageRecord && (
          <div style={styles.formBox}>
            <div style={styles.row}>
              <div>
                <h3 style={{ margin: 0 }}>🧑‍⚕️ Patient Management</h3>
                <p style={styles.helpText}>
                  {manageRecord.patient_number} · {patientName(manageRecord.patient_number)} · {manageRecord.triage_type}
                </p>
              </div>
              <button type="button" style={styles.cancelButton} onClick={closeManage}>
                Close
              </button>
            </div>

            <div style={styles.triageListTabs}>
              <button type="button" style={manageTab === "view" ? styles.activeTab : styles.tab} onClick={() => { setManageTab("view"); setShowForm(false); }}>
                👁️ View
              </button>
              <button type="button" style={manageTab === "score" ? styles.activeTab : styles.tab} onClick={() => { setManageTab("score"); editTriage(manageRecord); }}>
                🩺 Score Form
              </button>
              <button type="button" style={manageTab === "note" ? styles.activeTab : styles.tab} onClick={() => { setManageTab("note"); setShowForm(false); }}>
                📝 Add Note
              </button>
            </div>

            {manageTab === "view" && (
              <div>
                <h4 style={{ marginTop: 0 }}>👁️ Patient Information & Current Triage</h4>
                <div style={styles.detailsGrid}>
                  <Detail label="Patient Number" value={manageRecord.patient_number} />
                  <Detail label="Card Number" value={currentPatient?.card_number} />
                  <Detail label="Full Name" value={patientName(manageRecord.patient_number)} />
                  <Detail label="Sex" value={currentPatient?.sex} />
                  <Detail label="Phone" value={currentPatient?.phone} />
                  <Detail label="Region" value={currentPatient?.region} />
                  <Detail label="Zone" value={currentPatient?.zone} />
                  <Detail label="Woreda" value={currentPatient?.woreda} />
                  <Detail label="Kebele" value={currentPatient?.kebele} />
                  <Detail label="Nationality" value={currentPatient?.nationality} />
                  <Detail label="Marital Status" value={currentPatient?.marital_status} />
                  <Detail label="Physical Status" value={currentPatient?.physical_status} />
                  <Detail label="Education" value={currentPatient?.education_level} />
                  <Detail label="Occupation" value={currentPatient?.occupation} />
                  <Detail label="Birth Date Type" value={currentPatient?.birth_date_type} />
                  <Detail
                    label="Birth Date"
                    value={[
                      currentPatient?.birth_year,
                      currentPatient?.birth_month,
                      currentPatient?.birth_day,
                    ].filter(Boolean).join("-")}
                  />
                  <Detail label="Birth Time" value={currentPatient?.birth_time} />
                  <Detail label="Referred From" value={currentPatient?.referred_from_institution} />
                  <Detail label="Triage Unit" value={manageRecord.triage_type} />
                  <Detail label="Triage Status" value={manageRecord.triage_status} />
                  <Detail label="Acuity" value={manageRecord.acuity} />
                  <Detail label="Chief Complaint" value={manageRecord.chief_complaint} />
                  <Detail label="Blood Pressure" value={manageRecord.blood_pressure} />
                  <Detail label="Pulse" value={manageRecord.pulse} />
                  <Detail label="Temperature" value={manageRecord.temperature} />
                  <Detail label="Respiratory Rate" value={manageRecord.respiratory_rate} />
                  <Detail label="Oxygen Saturation" value={manageRecord.oxygen_saturation} />
                  <Detail label="Pain Score" value={manageRecord.pain_score} />
                  <Detail label="Consciousness" value={manageRecord.consciousness} />
                  <Detail label="Scope / Care Area" value={manageRecord.scope} />
                  <Detail label="Disposition" value={manageRecord.disposition} />
                  <Detail label="Examination Unit" value={manageRecord.examination_unit} />
                </div>

                <div style={{ ...styles.formBox, marginTop: "20px" }}>
                  <h4 style={{ marginTop: 0 }}>🔄 Is The Patient Wrongly Assigned?</h4>
                  <Field label="Is The Patient Wrongly Assigned?">
                    <select
                      value={wronglyAssigned}
                      onChange={(e) => {
                        setWronglyAssigned(e.target.value);
                        if (e.target.value !== "Yes") setReassignTo("");
                      }}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </Field>

                  {wronglyAssigned === "Yes" && (
                    <div style={{ marginTop: "12px" }}>
                      <Field label="Reassign To Triage Unit">
                        <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                          <option value="">Select Triage Unit</option>
                          {TRIAGE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </Field>
                      <button
                        type="button"
                        style={styles.editButton}
                        onClick={reassignPatient}
                        disabled={reassignSaving}
                      >
                        {reassignSaving ? "Reassigning..." : "🔄 Reassign Patient"}
                      </button>
                      <p style={styles.helpText}>
                        Reassigning sends the patient back as Pending to the selected triage unit.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h4>📚 Previous Triage Results</h4>
                  {historyLoading ? (
                    <p>Loading previous triage results...</p>
                  ) : historyRecords.length === 0 ? (
                    <p>No previous triage results found for this patient.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Triage Unit</th>
                            <th style={styles.th}>Acuity</th>
                            <th style={styles.th}>Chief Complaint</th>
                            <th style={styles.th}>Disposition</th>
                            <th style={styles.th}>Examination Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyRecords.map((oldRecord) => (
                            <tr key={oldRecord.id}>
                              <td style={styles.td}>{oldRecord.triage_date || "-"}</td>
                              <td style={styles.td}>{oldRecord.triage_type || "-"}</td>
                              <td style={styles.td}>{oldRecord.acuity || "-"}</td>
                              <td style={styles.td}>{oldRecord.chief_complaint || "-"}</td>
                              <td style={styles.td}>{oldRecord.disposition || "-"}</td>
                              <td style={styles.td}>{oldRecord.examination_unit || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {manageTab === "score" && showForm && (
              <div>
                <h4 style={{ marginTop: 0 }}>🩺 Triage Score Form</h4>
                <form onSubmit={saveTriage}>
                  <div style={styles.formGrid}>
                    <Field label="Triage Unit">
                      <select
                        name="triage_type"
                        value={form.triage_type}
                        onChange={handleChange}
                        disabled={Boolean(editingId)}
                      >
                        {TRIAGE_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Patient Number *">
                      <input name="patient_number" value={form.patient_number} onChange={handleChange} />
                    </Field>
                    <Field label="Triage Date">
                      <input type="date" name="triage_date" value={form.triage_date} onChange={handleChange} />
                    </Field>
                    <Field label="Arrival Time">
                      <input type="time" name="arrival_time" value={form.arrival_time} onChange={handleChange} />
                    </Field>
                    <Field label="Blood Pressure">
                      <input name="blood_pressure" value={form.blood_pressure} onChange={handleChange} placeholder="e.g. 120/80" />
                    </Field>
                    <Field label="Pulse">
                      <input type="number" name="pulse" value={form.pulse} onChange={handleChange} />
                    </Field>
                    <Field label="Temperature °C">
                      <input type="number" step="0.1" name="temperature" value={form.temperature} onChange={handleChange} />
                    </Field>
                    <Field label="Respiratory Rate">
                      <input type="number" name="respiratory_rate" value={form.respiratory_rate} onChange={handleChange} />
                    </Field>
                    <Field label="Oxygen Saturation %">
                      <input type="number" step="0.1" name="oxygen_saturation" value={form.oxygen_saturation} onChange={handleChange} />
                    </Field>
                    <Field label="Pain Score 0–10">
                      <input type="number" min="0" max="10" name="pain_score" value={form.pain_score} onChange={handleChange} />
                    </Field>
                    <Field label="Consciousness">
                      <select name="consciousness" value={form.consciousness} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Alert">Alert</option>
                        <option value="Verbal Response">Verbal Response</option>
                        <option value="Pain Response">Pain Response</option>
                        <option value="Unresponsive">Unresponsive</option>
                      </select>
                    </Field>
                    <Field label="Acuity">
                      <select name="acuity" value={form.acuity} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Critical">Critical</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Semi-Urgent">Semi-Urgent</option>
                        <option value="Non-Urgent">Non-Urgent</option>
                      </select>
                    </Field>
                    <Field label="Scope / Care Area">
                      <select name="scope" value={form.scope} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Emergency">Emergency</option>
                        <option value="OPD">OPD</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Internal Medicine">Internal Medicine</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Gynecology">Gynecology</option>
                        <option value="Obstetrics">Obstetrics</option>
                        <option value="Neonatal">Neonatal</option>
                      </select>
                    </Field>
                    <Field label="Chief Complaint">
                      <textarea name="chief_complaint" value={form.chief_complaint} onChange={handleChange} style={styles.fullTextarea} />
                    </Field>
                    <Field label="Triage Notes">
                      <textarea name="notes" value={form.notes} onChange={handleChange} style={styles.fullTextarea} />
                    </Field>
                  </div>
                  <button type="submit" style={styles.triageButton}>💾 Save Triage & Continue</button>
                </form>
              </div>
            )}

            {manageTab === "note" && (
              <div>
                <h4 style={{ marginTop: 0 }}>📝 Add Note</h4>
                <Field label="Note">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write a note about this patient or triage visit..."
                    style={{ ...styles.fullTextarea, minHeight: "150px" }}
                  />
                </Field>
                <button type="button" style={styles.primaryButton} onClick={saveNote} disabled={noteSaving}>
                  {noteSaving ? "Saving..." : "💾 Save Note"}
                </button>

                <div style={{ marginTop: "20px" }}>
                  <h4>Existing Notes</h4>
                  <div style={styles.fileInfo}>
                    {manageRecord.notes || "No notes have been added yet."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showDisposition && dispositionRecord && (
          <div style={styles.formBox}>
            <div style={styles.row}>
              <div>
                <h3 style={{ margin: 0 }}>📤 Disposition</h3>
                <p style={styles.helpText}>
                  Triage completed for {dispositionRecord.patient_number}. Send the patient to the required Examination Unit.
                </p>
              </div>
              <button type="button" style={styles.cancelButton} onClick={() => setShowDisposition(false)}>
                Close
              </button>
            </div>

            <div style={styles.detailsGrid}>
              <Detail label="Patient" value={dispositionRecord.patient_number} />
              <Detail label="Name" value={patientName(dispositionRecord.patient_number)} />
              <Detail label="Triage Unit" value={dispositionRecord.triage_type} />
              <Detail label="Acuity" value={dispositionRecord.acuity} />
              <Detail label="Triage Date" value={dispositionRecord.triage_date} />
              <Detail label="Triage Status" value="Completed" />
            </div>

            <div style={{ ...styles.formGrid, marginTop: "18px" }}>
              <Field label="Send To Examination Unit *">
                <select value={examinationUnit} onChange={(e) => setExaminationUnit(e.target.value)}>
                  <option value="">Select Examination Unit *</option>
                  {EXAMINATION_UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </Field>
              <Field label="Disposition Note">
                <input value={dispositionNote} onChange={(e) => setDispositionNote(e.target.value)} placeholder="Optional note" />
              </Field>
            </div>

            <button type="button" style={styles.primaryButton} onClick={saveDisposition}>
              📤 Send to Examination & Finish
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Detail({ label, value }) {
  return (
    <div>
      <strong>{label}</strong>
      <p style={{ marginTop: "5px" }}>{value || "-"}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  categoryOverlayAnchor: { position: "relative", width: "100%", margin: "18px 0 8px", padding: "16px", border: "1px solid #cbd5e1", borderRadius: "12px", background: "#f8fafc", zIndex: 30 },
  categoryButton: { width: "100%", display: "flex", alignItems: "center", padding: "14px 16px", fontSize: "18px", fontWeight: 700, borderRadius: "10px", border: "2px solid #94a3b8", background: "white", cursor: "pointer", textAlign: "left" },
  categoryOverlayMenu: { position: "absolute", left: "16px", right: "16px", top: "94px", background: "white", border: "2px solid #cbd5e1", borderRadius: "10px", boxShadow: "0 14px 30px rgba(15,23,42,0.18)", overflow: "hidden", zIndex: 100 },
  categoryOption: { width: "100%", padding: "14px 16px", border: 0, background: "white", textAlign: "left", fontSize: "17px", fontWeight: 700, cursor: "pointer" },
  categoryOptionActive: { width: "100%", padding: "14px 16px", border: 0, background: "#e2e8f0", textAlign: "left", fontSize: "17px", fontWeight: 700, cursor: "pointer" },
  reportSection: { marginTop: "20px" },
  wrapper: {
    width: "100%",
  },

  sectionHeader: {
    marginBottom: "18px",
  },

  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  dropdownRow: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  triageListTabs: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    margin: "18px 0",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "24px",
    padding: "2px 7px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "800",
    marginLeft: "5px",
  },

  dropdownGroup: {
    minWidth: "240px",
    flex: "1 1 240px",
  },

  dropdownLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "6px",
  },

  dropdown: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "white",
    fontSize: "15px",
    cursor: "pointer",
  },

  tab: {
    padding: "12px 20px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    background: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },

  activeTab: {
    padding: "12px 20px",
    border: "1px solid #2563eb",
    borderRadius: "9px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",
  },

  message: {
    marginBottom: "16px",
    padding: "12px 15px",
    borderRadius: "8px",
    background: "#f1f5f9",
    fontWeight: "600",
  },

  warningBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "9px",
    border: "1px solid #fde68a",
    background: "#fffbeb",
    color: "#92400e",
  },

  successBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "9px",
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    fontWeight: "600",
  },

  panel: {
    background: "white",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  helpText: {
    color: "#64748b",
    marginTop: "6px",
  },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  fieldLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "15px",
  },

  fullTextarea: {
    gridColumn: "1 / -1",
    minHeight: "90px",
    resize: "vertical",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 12px",
    margin: "18px 0",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "15px",
  },

  primaryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },

  secondaryButton: {
    padding: "10px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    marginRight: "8px",
  },

  triageButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    marginRight: "8px",
    marginBottom: "5px",
  },

  formBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
    marginTop: "18px",
  },

  cancelButton: {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    fontSize: "15px",
    marginRight: "8px",
  },

  actionRow: {
    marginTop: "18px",
  },

  viewButton: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#e0f2fe",
    color: "#075985",
    cursor: "pointer",
  },

  editButton: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#fef3c7",
    color: "#92400e",
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

  documentButtonSmall: {
    padding: "7px 10px",
    marginRight: "6px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "6px",
    background: "#ede9fe",
    color: "#5b21b6",
    cursor: "pointer",
  },

  fileInfo: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "12px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
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

  reportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "18px",
    marginBottom: "20px",
  },

  metricCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  dateInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "white",
    fontSize: "15px",
  },

  searchInputStandalone: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
  },
};


if (typeof document !== "undefined" && !document.getElementById("reception-report-print-style")) {
  const style = document.createElement("style");
  style.id = "reception-report-print-style";
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      .printOnlyTitle, .printOnlyTitle * { visibility: visible !important; }
      .panel, .panel * { visibility: visible !important; }
      .sidebar, button, input, select { visibility: hidden !important; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  `;
  document.head.appendChild(style);
}
