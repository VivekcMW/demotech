import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, date, time, numeric, pgEnum,
  uniqueIndex, index, foreignKey, primaryKey,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────

export const sexEnum = pgEnum("sex", ["M", "F", "O"]);
export const bloodGroupEnum = pgEnum("blood_group", ["A+","A-","B+","B-","AB+","AB-","O+","O-"]);
export const rxStatusEnum = pgEnum("rx_status", ["Pending","Verified","Dispensing","Dispensed","Partially Dispensed","On Hold","Cancelled"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["Scheduled","Checked In","In Progress","Completed","Cancelled","No Show"]);
export const encounterTypeEnum = pgEnum("encounter_type", ["OPD","IPD","Emergency","Telemedicine"]);
export const labStatusEnum = pgEnum("lab_status", ["Ordered","Collected","Processing","Completed","Verified","Cancelled"]);
export const callStatusEnum = pgEnum("call_status", ["Scheduled","Ringing","In-Progress","Completed","Missed","Cancelled"]);
export const assetStatusEnum = pgEnum("asset_status", ["Operational","Under Maintenance","Retired","Faulty"]);
export const staffStatusEnum = pgEnum("staff_status", ["Active","On Leave","Inactive"]);
export const shiftEnum = pgEnum("shift", ["Day","Night","Rotating"]);
export const billingStatusEnum = pgEnum("billing_status", ["Draft","Pending","Paid","Partial","Cancelled","Refunded"]);
export const claimStatusEnum = pgEnum("claim_status", ["Submitted","Approved","Rejected","Pending Review","Settled"]);

// ── HIPAA Audit Log ──────────────────────────────────────────────────────
// §164.312(b) — Audit Controls: Immutable record of all PHI access events.
// This table is append-only; rows must never be updated or deleted.
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),               // Who accessed (JWT sub)
  userRole: text("user_role").notNull(),           // Role at time of access
  action: text("action").notNull(),                // READ | CREATE | UPDATE | DELETE | SEARCH | LOGIN | LOGIN_FAILED
  resource: text("resource").notNull(),            // e.g., "patients", "encounters"
  recordId: text("record_id"),                     // Specific record accessed (e.g., "PT-001")
  outcome: text("outcome").notNull(),              // SUCCESS | FAILURE
  requestId: text("request_id"),                   // Correlation ID
  ipAddress: text("ip_address"),                   // Client IP
  path: text("path"),                              // Sanitized request path (no query strings / PHI)
  details: text("details"),                        // Additional context (no raw PHI)
  durationMs: integer("duration_ms"),              // Response time
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_audit_user").on(t.userId),
  index("idx_audit_resource").on(t.resource),
  index("idx_audit_created").on(t.createdAt),
  index("idx_audit_record").on(t.recordId),
]);

// ── Login Attempts (brute-force protection) ──────────────────────────────
// §164.312(d) — Person Authentication: Track failed attempts for lockout
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ipAddress: text("ip_address").notNull(),
  success: boolean("success").notNull().default(false),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
}, (t) => [
  index("idx_login_email_time").on(t.email, t.attemptedAt),
  index("idx_login_ip_time").on(t.ipAddress, t.attemptedAt),
]);

// ── ICD-10 Master Tables ─────────────────────────────────────────────────

export const icd10Chapters = pgTable("icd10_chapters", {
  id: text("id").primaryKey(),                    // e.g., "01", "02", ..., "22"
  romanNumeral: text("roman_numeral").notNull(),  // e.g., "I", "II", ..., "XXII"
  title: text("title").notNull(),                 // e.g., "Certain infectious and parasitic diseases"
  codeRangeStart: text("code_range_start").notNull(), // e.g., "A00"
  codeRangeEnd: text("code_range_end").notNull(),     // e.g., "B99"
});

export const icd10Categories = pgTable("icd10_categories", {
  code: text("code").primaryKey(),                // e.g., "A00-A09", "I10-I16"
  chapterId: text("chapter_id").notNull().references(() => icd10Chapters.id),
  title: text("title").notNull(),
  includes: text("includes"),                     // Inclusion notes
  excludes1: text("excludes1"),                   // Excludes1 notes (conditions not coded here)
  excludes2: text("excludes2"),                   // Excludes2 notes (conditions coded elsewhere)
}, (t) => [index("idx_icd10_cat_chapter").on(t.chapterId)]);

export const icd10Codes = pgTable("icd10_codes", {
  code: text("code").primaryKey(),                // e.g., "A00.0", "I10", "J06.9"
  shortDesc: text("short_desc").notNull(),        // Short description (<=60 chars)
  longDesc: text("long_desc").notNull(),          // Full description
  categoryCode: text("category_code"),            // Parent category reference
  chapterId: text("chapter_id").notNull(),        // Chapter reference
  isBillable: boolean("is_billable").notNull().default(true),
  isChronic: boolean("is_chronic").notNull().default(false),
  isComorbidity: boolean("is_comorbidity").notNull().default(false),
  isPediatric: boolean("is_pediatric").notNull().default(false),
  isMaternity: boolean("is_maternity").notNull().default(false),
  isNewborn: boolean("is_newborn").notNull().default(false),
  ageRange: text("age_range"),                    // e.g., "0-17", "18+", "adult", "pediatric"
  sexSpecific: text("sex_specific"),              // "M", "F", or null for both
  manifestationCode: boolean("manifestation_code").notNull().default(false),
  poa: text("poa"),                               // Present on Admission indicator guidance
  hccCategory: text("hcc_category"),              // Hierarchical Condition Category (risk adjustment)
  commonSpecialties: text("common_specialties").array(), // e.g., ["Cardiology", "Internal Medicine"]
  keywords: text("keywords").array(),             // Search keywords/synonyms
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_icd10_short_desc").on(t.shortDesc),
  index("idx_icd10_chapter").on(t.chapterId),
  index("idx_icd10_billable").on(t.isBillable),
  index("idx_icd10_chronic").on(t.isChronic),
]);

// ICD-10-PCS (Procedure Coding System)
export const icd10PcsCodes = pgTable("icd10_pcs_codes", {
  code: text("code").primaryKey(),                // 7-character alphanumeric
  section: text("section").notNull(),             // Section (0-9, B-H, X)
  bodySystem: text("body_system").notNull(),      
  rootOperation: text("root_operation").notNull(),
  bodyPart: text("body_part").notNull(),
  approach: text("approach").notNull(),
  device: text("device"),
  qualifier: text("qualifier"),
  shortDesc: text("short_desc").notNull(),
  longDesc: text("long_desc").notNull(),
  commonSpecialties: text("common_specialties").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_icd10_pcs_section").on(t.section),
  index("idx_icd10_pcs_root_op").on(t.rootOperation),
]);

// Frequently used codes per specialty (for quick-pick)
export const icd10SpecialtyFavorites = pgTable("icd10_specialty_favorites", {
  id: serial("id").primaryKey(),
  specialty: text("specialty").notNull(),
  icdCode: text("icd_code").notNull().references(() => icd10Codes.code),
  displayOrder: integer("display_order").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
}, (t) => [
  index("idx_icd10_fav_specialty").on(t.specialty),
  uniqueIndex("idx_icd10_fav_unique").on(t.specialty, t.icdCode),
]);

// ── Core Tables ──────────────────────────────────────────────────────────

export const patients = pgTable("patients", {
  id: text("id").primaryKey(),           // PT-XXXX
  uhid: text("uhid").notNull().unique(),
  abhaId: text("abha_id"),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  dob: date("dob").notNull(),
  sex: sexEnum("sex").notNull(),
  bloodGroup: bloodGroupEnum("blood_group").notNull(),
  phone: text("phone").notNull(),
  altPhone: text("alt_phone"),
  address: text("address"),
  idProofType: text("id_proof_type"),
  idProofNumber: text("id_proof_number"),
  email: text("email"),
  occupation: text("occupation"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  allergies: text("allergies").array(),
  chronicConditions: text("chronic_conditions").array(),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNo: text("insurance_policy_no"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("idx_patients_uhid").on(t.uhid), index("idx_patients_abha").on(t.abhaId)]);

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),           // EMP-XXXX
  name: text("name").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  qualification: text("qualification"),
  experience: integer("experience"),
  phone: text("phone"),
  email: text("email"),
  joinDate: date("join_date"),
  status: staffStatusEnum("status").notNull().default("Active"),
  shift: shiftEnum("shift").notNull().default("Day"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_staff_dept").on(t.department)]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").references(() => staff.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("doctor"), // admin | doctor | nurse | receptionist | pharmacist | lab_tech
  active: boolean("active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Clinical Core ────────────────────────────────────────────────────────

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),           // APPT-XXXX
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").references(() => staff.id),
  department: text("department").notNull(),
  datetime: timestamp("datetime").notNull(),
  duration: integer("duration").notNull().default(15),
  status: appointmentStatusEnum("status").notNull().default("Scheduled"),
  reason: text("reason"),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_appt_patient").on(t.patientId), index("idx_appt_date").on(t.datetime), index("idx_appt_status").on(t.status)]);

export const encounters = pgTable("encounters", {
  id: text("id").primaryKey(),           // ENC-XXXX
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").references(() => staff.id),
  department: text("department").notNull(),
  datetime: timestamp("datetime").notNull().defaultNow(),
  type: encounterTypeEnum("type").notNull().default("OPD"),
  chiefComplaint: text("chief_complaint"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_enc_patient").on(t.patientId), index("idx_enc_datetime").on(t.datetime)]);

export const diagnoses = pgTable("diagnoses", {
  id: text("id").primaryKey(),
  encounterId: text("encounter_id").notNull().references(() => encounters.id),
  icdCode: text("icd_code").notNull().references(() => icd10Codes.code),
  description: text("description").notNull(),
  type: text("type").notNull().default("Primary"), // Primary | Secondary | Complication
  certainty: text("certainty").notNull().default("Confirmed"), // Confirmed | Suspected | Rule Out
  presentOnAdmission: boolean("present_on_admission"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_diag_encounter").on(t.encounterId), index("idx_diag_icd").on(t.icdCode)]);

// ── Vitals ───────────────────────────────────────────────────────────────

export const vitals = pgTable("vitals", {
  id: text("id").primaryKey(),
  encounterId: text("encounter_id").notNull().references(() => encounters.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  bpSystolic: integer("bp_systolic"),
  bpDiastolic: integer("bp_diastolic"),
  hr: integer("hr"),
  rr: integer("rr"),
  temp: numeric("temp", { precision: 4, scale: 1 }),
  spo2: integer("spo2"),
  weight: numeric("weight", { precision: 5, scale: 1 }),
  height: numeric("height", { precision: 5, scale: 1 }),
  bmi: numeric("bmi", { precision: 4, scale: 1 }),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
}, (t) => [index("idx_vitals_encounter").on(t.encounterId)]);

// ── Prescriptions ────────────────────────────────────────────────────────

export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),           // RX-XXXX
  encounterId: text("encounter_id").references(() => encounters.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").references(() => staff.id),
  status: rxStatusEnum("status").notNull().default("Pending"),
  notes: text("notes"),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_rx_patient").on(t.patientId), index("idx_rx_status").on(t.status)]);

export const rxItems = pgTable("rx_items", {
  id: text("id").primaryKey(),
  prescriptionId: text("prescription_id").notNull().references(() => prescriptions.id),
  drugCode: text("drug_code").notNull(),
  drugName: text("drug_name").notNull(),
  dosage: text("dosage").notNull(),
  route: text("route"),
  frequency: text("frequency").notNull(),
  duration: text("duration"),
  quantity: integer("quantity"),
  instructions: text("instructions"),
}, (t) => [index("idx_rx_item_prescription").on(t.prescriptionId)]);

// ── Lab ──────────────────────────────────────────────────────────────────

export const labTestCatalog = pgTable("lab_test_catalog", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  sampleType: text("sample_type"),
  container: text("container"),
  loincCode: text("loinc_code"),
  parameters: jsonb("parameters").notNull().default([]),   // LabTestParam[]
  criticalThresholds: jsonb("critical_thresholds").default({}),  // e.g., {"low": 3.5, "high": 5.5}
  price: integer("price"),
  turnaroundHours: integer("turnaround_hours"),
  instructions: text("instructions"),
});

export const labOrders = pgTable("lab_orders", {
  id: text("id").primaryKey(),
  encounterId: text("encounter_id").references(() => encounters.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").references(() => staff.id),
  testId: text("test_id").notNull().references(() => labTestCatalog.id),
  status: labStatusEnum("status").notNull().default("Ordered"),
  priority: text("priority").notNull().default("Routine"), // Routine | Urgent | STAT
  collectedAt: timestamp("collected_at"),
  collectedBy: text("collected_by"),
  resultedAt: timestamp("resulted_at"),
  resultedBy: text("resulted_by"),
  result: jsonb("result"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_lab_patient").on(t.patientId), index("idx_lab_status").on(t.status)]);

// ── Radiology / Imaging ──────────────────────────────────────────────────

export const imagingStudies = pgTable("imaging_studies", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  studyUid: text("study_uid"),
  modality: text("modality"),
  description: text("description"),
  seriesCount: integer("series_count"),
  dicomMetadata: jsonb("dicom_metadata"),
  report: text("report"),
  radiologistId: text("radiologist_id").references(() => staff.id),
  status: text("status").notNull().default("Ordered"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_img_patient").on(t.patientId)]);

// ── Billing ──────────────────────────────────────────────────────────────

export const billing = pgTable("billing", {
  id: text("id").primaryKey(),            // BILL-XXXX
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
  paid: numeric("paid", { precision: 10, scale: 2 }).notNull().default("0"),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull(),
  status: billingStatusEnum("status").notNull().default("Pending"),
  items: jsonb("items").notNull().default([]),   // BillItem[]
  paymentMode: text("payment_mode"),              // Cash | Card | UPI | Insurance | Mixed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_bill_patient").on(t.patientId), index("idx_bill_status").on(t.status)]);

export const claims = pgTable("claims", {
  id: text("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => billing.id),
  insurer: text("insurer").notNull(),
  policyNo: text("policy_no"),
  claimedAmount: numeric("claimed_amount", { precision: 10, scale: 2 }),
  approvedAmount: numeric("approved_amount", { precision: 10, scale: 2 }),
  status: claimStatusEnum("status").notNull().default("Submitted"),
  submittedAt: timestamp("submitted_at"),
  settledAt: timestamp("settled_at"),
  notes: text("notes"),
});

// ── Specialty Clinical Data (JSONB) ──────────────────────────────────────

export const obgynRecords = pgTable("obgyn_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  partograph: jsonb("partograph"),
  ctg: jsonb("ctg"),
  fetalGrowth: jsonb("fetal_growth"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_obgyn_patient").on(t.patientId)]);

export const ecgRecords = pgTable("ecg_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  waveform: jsonb("waveform"),
  measurements: jsonb("measurements"),
  interpretation: text("interpretation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_ecg_patient").on(t.patientId)]);

export const pftRecords = pgTable("pft_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  flowLoop: jsonb("flow_loop"),
  abg: jsonb("abg"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_pft_patient").on(t.patientId)]);

export const nephrologyRecords = pgTable("nephrology_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  dialysis: jsonb("dialysis"),
  ckd: jsonb("ckd"),
  ktV: jsonb("ktv"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_neph_patient").on(t.patientId)]);

export const cardioRecords = pgTable("cardio_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  echocardiogram: jsonb("echocardiogram"),
  stressTest: jsonb("stress_test"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_cardio_patient").on(t.patientId)]);

export const oncologyRecords = pgTable("oncology_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  chemoRegimen: jsonb("chemo_regimen"),
  toxicities: jsonb("toxicities"),
  recist: jsonb("recist"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_onc_patient").on(t.patientId)]);

// ── Operations ───────────────────────────────────────────────────────────

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),            // INV-XXXX
  name: text("name").notNull(),
  category: text("category").notNull(),
  department: text("department").notNull(),
  stock: integer("stock").notNull().default(0),
  unit: text("unit").notNull(),
  reorderLevel: integer("reorder_level").notNull().default(0),
  reorderQty: integer("reorder_qty"),
  location: text("location"),
  vendor: text("vendor"),
  unitCost: integer("unit_cost"),
  lastRestocked: date("last_restocked"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_inv_dept").on(t.department), index("idx_inv_reorder").on(t.stock)]);

export const assets = pgTable("assets", {
  id: text("id").primaryKey(),            // AST-XXXX
  name: text("name").notNull(),
  type: text("type").notNull(),
  model: text("model"),
  serialNo: text("serial_no"),
  department: text("department"),
  location: text("location"),
  purchaseDate: date("purchase_date"),
  warrantyExpiry: date("warranty_expiry"),
  lastMaintenance: date("last_maintenance"),
  nextMaintenance: date("next_maintenance"),
  status: assetStatusEnum("status").notNull().default("Operational"),
  vendor: text("vendor"),
  cost: integer("cost"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_asset_status").on(t.status)]);

export const cmeRecords = pgTable("cme_records", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id),
  courseName: text("course_name").notNull(),
  provider: text("provider"),
  type: text("type"),
  credits: integer("credits").notNull().default(0),
  date: date("date"),
  completed: boolean("completed").notNull().default(false),
  expiryDate: date("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_cme_staff").on(t.staffId)]);

// ── Telemedicine ─────────────────────────────────────────────────────────

export const teleconsultations = pgTable("teleconsultations", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").references(() => staff.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  scheduledDuration: integer("scheduled_duration").notNull().default(15),
  callStatus: callStatusEnum("call_status").notNull().default("Scheduled"),
  callStartedAt: timestamp("call_started_at"),
  callEndedAt: timestamp("call_ended_at"),
  actualDuration: integer("actual_duration"),
  reason: text("reason"),
  notes: text("notes"),
  videoEnabled: boolean("video_enabled").default(false),
  audioEnabled: boolean("audio_enabled").default(false),
  isRecording: boolean("is_recording").default(false),
  screenShare: boolean("screen_share").default(false),
  prescriptions: jsonb("prescriptions").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_tel_patient").on(t.patientId), index("idx_tel_status").on(t.callStatus)]);

// ── FHIR Resource Tables ─────────────────────────────────────────────────
// These store FHIR R4 resources synced from EHR tables for API access.

export const fhirPatients = pgTable("fhir_patients", {
  id: text("id").primaryKey(),
  ehrId: text("ehr_id").notNull().unique().references(() => patients.id),
  resource: jsonb("resource").notNull(),
  searchName: text("search_name"),
  searchGiven: text("search_given"),
  searchFamily: text("search_family"),
  searchIdentifier: text("search_identifier"),
  searchBirthDate: text("search_birth_date"),
  searchGender: text("search_gender"),
  searchPhone: text("search_phone"),
  searchAbha: text("search_abha"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_pat_search_name").on(t.searchName),
  index("idx_fhir_pat_search_identifier").on(t.searchIdentifier),
  index("idx_fhir_pat_search_abha").on(t.searchAbha),
  index("idx_fhir_pat_search_birthdate").on(t.searchBirthDate),
  index("idx_fhir_pat_ehr").on(t.ehrId),
]);

export const fhirObservations = pgTable("fhir_observations", {
  id: text("id").primaryKey(),
  ehrSource: text("ehr_source").notNull(),  // vitals | lab_orders
  ehrId: text("ehr_id").notNull(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  resource: jsonb("resource").notNull(),
  searchCode: text("search_code"),
  searchCategory: text("search_category"),
  searchDate: text("search_date"),
  searchStatus: text("search_status"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_obs_patient").on(t.patientId),
  index("idx_fhir_obs_code").on(t.searchCode),
  index("idx_fhir_obs_date").on(t.searchDate),
  index("idx_fhir_obs_ehr").on(t.ehrSource, t.ehrId),
]);

export const fhirEncounters = pgTable("fhir_encounters", {
  id: text("id").primaryKey(),
  ehrId: text("ehr_id").notNull().unique(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  resource: jsonb("resource").notNull(),
  searchDate: text("search_date"),
  searchType: text("search_type"),
  searchStatus: text("search_status"),
  searchDepartment: text("search_department"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_enc_patient").on(t.patientId),
  index("idx_fhir_enc_date").on(t.searchDate),
]);

export const fhirConditions = pgTable("fhir_conditions", {
  id: text("id").primaryKey(),
  encounterId: text("encounter_id").notNull().references(() => encounters.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  resource: jsonb("resource").notNull(),
  searchCode: text("search_code"),
  searchClinicalStatus: text("search_clinical_status"),
  searchVerificationStatus: text("search_verification_status"),
  searchCategory: text("search_category"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_cond_patient").on(t.patientId),
  index("idx_fhir_cond_code").on(t.searchCode),
]);

export const fhirMedicationRequests = pgTable("fhir_medication_requests", {
  id: text("id").primaryKey(),
  ehrId: text("ehr_id").notNull().unique(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  resource: jsonb("resource").notNull(),
  searchStatus: text("search_status"),
  searchMedication: text("search_medication"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_med_patient").on(t.patientId),
  index("idx_fhir_med_status").on(t.searchStatus),
]);

export const fhirDiagnosticReports = pgTable("fhir_diagnostic_reports", {
  id: text("id").primaryKey(),
  ehrId: text("ehr_id").notNull().unique(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  resource: jsonb("resource").notNull(),
  searchCode: text("search_code"),
  searchCategory: text("search_category"),
  searchDate: text("search_date"),
  searchStatus: text("search_status"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_dr_patient").on(t.patientId),
  index("idx_fhir_dr_code").on(t.searchCode),
  index("idx_fhir_dr_date").on(t.searchDate),
]);

export const fhirImagingStudies = pgTable("fhir_imaging_studies", {
  id: text("id").primaryKey(),
  ehrId: text("ehr_id").notNull().unique(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  resource: jsonb("resource").notNull(),
  searchModality: text("search_modality"),
  searchDate: text("search_date"),
  versionId: integer("version_id").notNull().default(1),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_img_patient").on(t.patientId),
  index("idx_fhir_img_modality").on(t.searchModality),
]);

// ── FHIR Infrastructure Tables ───────────────────────────────────────────

export const fhirSubscriptions = pgTable("fhir_subscriptions", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("active"),  // active | off | error
  resourceType: text("resource_type").notNull(),
  criteria: text("criteria"),
  reason: text("reason"),
  channelType: text("channel_type").notNull(),  // rest-hook | websocket | email
  channelEndpoint: text("channel_endpoint").notNull(),
  channelHeaders: jsonb("channel_headers").default({}),
  error: text("error"),
  lastDeliveredAt: timestamp("last_delivered_at"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fhirIntegrationLog = pgTable("fhir_integration_log", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),  // hl7 | fhir_api | abdm | dicom | webhook
  direction: text("direction").notNull(),  // inbound | outbound
  messageType: text("message_type"),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  status: text("status").notNull(),  // success | error | pending
  requestBody: text("request_body"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_fhir_log_source").on(t.source),
  index("idx_fhir_log_status").on(t.status),
  index("idx_fhir_log_created").on(t.createdAt),
]);

// ── Clinical Decision Support Tables ─────────────────────────────────────

export const drugInteractions = pgTable("drug_interactions", {
  id: text("id").primaryKey(),
  drugCode1: text("drug_code_1").notNull(),
  drugName1: text("drug_name_1").notNull(),
  drugCode2: text("drug_code_2").notNull(),
  drugName2: text("drug_name_2").notNull(),
  severity: text("severity").notNull(),  // contraindicated | major | moderate | minor
  description: text("description").notNull(),
  mechanism: text("mechanism"),
  management: text("management"),
  source: text("source").notNull().default("rxnav"),
  lastVerified: timestamp("last_verified").notNull().defaultNow(),
}, (t) => [
  index("idx_ddi_pair").on(t.drugCode1, t.drugCode2),
  index("idx_ddi_drug1").on(t.drugCode1),
  index("idx_ddi_drug2").on(t.drugCode2),
]);

export const drugInteractionCache = pgTable("drug_interaction_cache", {
  drugCode: text("drug_code").primaryKey(),
  cacheData: jsonb("cache_data").notNull(),
  cachedAt: timestamp("cached_at").notNull().defaultNow(),
});

export const cdsAlerts = pgTable("cds_alerts", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  prescriptionId: text("prescription_id").references(() => prescriptions.id),
  alertType: text("alert_type").notNull(),  // drug_interaction | duplicate_therapy | critical_result | allergy
  severity: text("severity").notNull(),     // info | warning | critical
  message: text("message").notNull(),
  details: jsonb("details"),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_cds_alert_patient").on(t.patientId),
  index("idx_cds_alert_type").on(t.alertType),
  index("idx_cds_alert_created").on(t.createdAt),
]);

// ── LOINC Codes ─────────────────────────────────────────────────────────

export const loincCodes = pgTable("loinc_codes", {
  loincNum: text("loinc_num").primaryKey(),  // LOINC numeric code
  component: text("component").notNull(),
  property: text("property").notNull(),
  timeAspect: text("time_aspect"),
  system: text("system"),
  scaleType: text("scale_type"),
  methodType: text("method_type"),
  shortName: text("short_name"),
  longCommonName: text("long_common_name"),
  classType: text("class_type"),
  status: text("status").notNull().default("ACTIVE"),
}, (t) => [
  index("idx_loinc_component").on(t.component),
  index("idx_loinc_class").on(t.classType),
]);

// ── ALERTING: notification rules ────────────────────────────────────────

export const alertNotificationRules = pgTable("alert_notification_rules", {
  id: text("id").primaryKey(),
  alertType: text("alert_type").notNull(),  // drug_interaction | duplicate_therapy | critical_result | allergy
  channel: text("channel").notNull(),       // sms | email | in_app | webhook
  recipient: text("recipient").notNull(),   // phone | email | url
  enabled: boolean("enabled").notNull().default(true),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alertNotifications = pgTable("alert_notifications", {
  id: text("id").primaryKey(),
  alertId: text("alert_id").notNull().references(() => cdsAlerts.id),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").notNull(),  // sent | failed | pending
  error: text("error"),
  deliveredAt: timestamp("delivered_at"),
});

// ── NABH Compliance Tables ───────────────────────────────────────────────

export const nabhIndicatorDefinitions = pgTable("nabh_indicator_definitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),  // Clinical | Infection Control | Patient Safety | etc.
  nabhStandard: text("nabh_standard").notNull(),  // e.g., "COP-1", "PCI-2"
  description: text("description").notNull(),
  numeratorDesc: text("numerator_desc").notNull(),
  denominatorDesc: text("denominator_desc").notNull(),
  targetRate: numeric("target_rate", { precision: 5, scale: 2 }),
  computationType: text("computation_type").notNull(),  // auto | manual | semi
  dataSource: text("data_source").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const nabhIndicatorValues = pgTable("nabh_indicator_values", {
  id: text("id").primaryKey(),
  indicatorId: text("indicator_id").notNull().references(() => nabhIndicatorDefinitions.id),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  periodType: text("period_type").notNull(),  // daily | weekly | monthly | quarterly
  numerator: numeric("numerator", { precision: 10, scale: 2 }).notNull(),
  denominator: numeric("denominator", { precision: 10, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 8, scale: 2 }).notNull(),
  department: text("department"),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
}, (t) => [
  index("idx_nabh_val_indicator").on(t.indicatorId),
  index("idx_nabh_val_period").on(t.periodStart, t.periodEnd),
  index("idx_nabh_val_dept").on(t.department),
]);

export const nabhRegisters = pgTable("nabh_registers", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),       // birth | death | notifiable_disease | pcpndt
  patientId: text("patient_id").references(() => patients.id),
  encounterId: text("encounter_id").references(() => encounters.id),
  patientName: text("patient_name"),
  recordedBy: text("recorded_by").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  details: jsonb("details").notNull(),   // flexible per register type
  registerNumber: text("register_number"),
  notifiedTo: text("notified_to"),
  notificationDate: date("notification_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_nabh_reg_type").on(t.type),
  index("idx_nabh_reg_date").on(t.recordedAt),
  index("idx_nabh_reg_patient").on(t.patientId),
]);

export const nabhCommitteeReports = pgTable("nabh_committee_reports", {
  id: text("id").primaryKey(),
  committee: text("committee").notNull(),   // Infection Control | Mortality Review | Safety | etc.
  meetingDate: date("meeting_date").notNull(),
  chairperson: text("chairperson"),
  attendees: jsonb("attendees").default([]),
  agenda: jsonb("agenda").default([]),
  minutes: text("minutes"),
  decisions: jsonb("decisions").default([]),
  actionItems: jsonb("action_items").default([]),
  associatedReportId: text("associated_report_id"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_nabh_committee_date").on(t.meetingDate),
  index("idx_nabh_committee_type").on(t.committee),
]);

export const nabhEvidencePacks = pgTable("nabh_evidence_packs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  nabhStandard: text("nabh_standard"),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  status: text("status").notNull().default("draft"),   // draft | final | archived
  package: jsonb("package").notNull(),
  generatedBy: text("generated_by"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  exportedAt: timestamp("exported_at"),
  format: text("format").default("json"),   // json | pdf | csv
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fhirEndpoints = pgTable("fhir_endpoints", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),  // lis | ris | pacs | hie | abdm | fhir | hl7
  protocol: text("protocol").notNull(),  // mllp | dicomweb | fhir_rest | hl7_mllp
  host: text("host").notNull(),
  port: integer("port"),
  path: text("path"),
  username: text("username"),
  encryptedPassword: text("encrypted_password"),
  settings: jsonb("settings").default({}),
  status: text("status").notNull().default("active"),  // active | inactive | error
  lastTestedAt: timestamp("last_tested_at"),
  lastConnectedAt: timestamp("last_connected_at"),
  errorCount: integer("error_count").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
