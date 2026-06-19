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
  icdCode: text("icd_code").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("Primary"), // Primary | Secondary | Complication
  certainty: text("certainty").notNull().default("Confirmed"), // Confirmed | Suspected | Rule Out
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("idx_diag_encounter").on(t.encounterId)]);

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
  parameters: jsonb("parameters").notNull().default([]),   // LabTestParam[]
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
