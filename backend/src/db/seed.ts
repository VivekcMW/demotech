import { db } from "./index";
import * as s from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // ── Staff ──────────────────────────────────────────────────────────────
  const staffData = [
    { id: "EMP-001", name: "Dr. Priya Sharma", designation: "Senior Consultant - Cardiology", department: "Cardiology", qualification: "MD, DM", experience: 15, phone: "9876543210", email: "priya.sharma@aarogya.app", joinDate: "2018-03-01", status: "Active" as const, shift: "Day" as const },
    { id: "EMP-002", name: "Dr. Rajesh Kumar", designation: "Consultant - Neurology", department: "Neurology", qualification: "MD, DM", experience: 12, phone: "9876543211", email: "rajesh.kumar@aarogya.app", joinDate: "2019-06-15", status: "Active" as const, shift: "Day" as const },
    { id: "EMP-003", name: "Dr. Ananya Gupta", designation: "Junior Consultant - Pediatrics", department: "Pediatrics", qualification: "MD", experience: 5, phone: "9876543212", email: "ananya.gupta@aarogya.app", joinDate: "2021-01-10", status: "Active" as const, shift: "Rotating" as const },
    { id: "EMP-004", name: "Dr. Vikram Singh", designation: "Senior Consultant - Orthopedics", department: "Orthopedics", qualification: "MS, MCh", experience: 18, phone: "9876543213", email: "vikram.singh@aarogya.app", joinDate: "2016-09-20", status: "Active" as const, shift: "Day" as const },
    { id: "EMP-005", name: "Dr. Sneha Patel", designation: "Consultant - OB/GYN", department: "OB/GYN", qualification: "MD, DNB", experience: 10, phone: "9876543214", email: "sneha.patel@aarogya.app", joinDate: "2020-04-01", status: "Active" as const, shift: "Day" as const },
  ];
  await db.insert(s.staff).values(staffData);
  console.log("  Staff seeded");

  // ── Users ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("Doctor@123", 10);
  const userData = [
    { id: "USR-001", staffId: "EMP-001", email: "doctor@aarogya.app", passwordHash: hash, role: "admin", active: true },
    { id: "USR-002", staffId: "EMP-002", email: "rajesh.kumar@aarogya.app", passwordHash: hash, role: "doctor", active: true },
    { id: "USR-003", staffId: "EMP-003", email: "ananya.gupta@aarogya.app", passwordHash: hash, role: "doctor", active: true },
    { id: "USR-004", staffId: "EMP-004", email: "vikram.singh@aarogya.app", passwordHash: hash, role: "doctor", active: true },
    { id: "USR-005", staffId: "EMP-005", email: "sneha.patel@aarogya.app", passwordHash: hash, role: "doctor", active: true },
    { id: "USR-006", email: "nurse@aarogya.app", passwordHash: hash, role: "nurse", active: true },
    { id: "USR-007", email: "reception@aarogya.app", passwordHash: hash, role: "receptionist", active: true },
    { id: "USR-008", email: "pharmacist@aarogya.app", passwordHash: hash, role: "pharmacist", active: true },
    { id: "USR-009", email: "lab@aarogya.app", passwordHash: hash, role: "lab_tech", active: true },
  ];
  await db.insert(s.users).values(userData);
  console.log("  Users seeded");

  // ── Patients ───────────────────────────────────────────────────────────
  const patientData = [
    { id: "PT-001", uhid: "UHID-2024-0001", abhaId: "ABHA-45-1234-5678", name: "Ram Lal",        age: 65, dob: "1959-03-12", sex: "M" as const, bloodGroup: "O+" as const, phone: "9812345678", address: "123 Main St, Delhi", allergies: ["Penicillin"], chronicConditions: ["Diabetes", "Hypertension"] },
    { id: "PT-002", uhid: "UHID-2024-0002", name: "Sita Devi",      age: 45, dob: "1979-07-22", sex: "F" as const, bloodGroup: "B+" as const, phone: "9812345679", address: "456 Park Ave, Mumbai" },
    { id: "PT-003", uhid: "UHID-2024-0003", name: "Amit Kumar",     age: 8,  dob: "2016-11-05", sex: "M" as const, bloodGroup: "A+" as const, phone: "9812345680", address: "789 Lake Rd, Bangalore" },
    { id: "PT-004", uhid: "UHID-2024-0004", name: "Meera Joshi",    age: 55, dob: "1969-02-14", sex: "F" as const, bloodGroup: "AB+" as const, phone: "9812345681", address: "321 Hill View, Pune", allergies: ["Sulfa"] },
    { id: "PT-005", uhid: "UHID-2024-0005", name: "Arjun Singh",    age: 28, dob: "1996-09-30", sex: "M" as const, bloodGroup: "O-" as const, phone: "9812345682", address: "654 River Bank, Chennai" },
  ];
  await db.insert(s.patients).values(patientData);
  console.log("  Patients seeded");

  // ── Appointments ──────────────────────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const apptData = [
    { id: "APPT-001", patientId: "PT-001", doctorId: "EMP-001", department: "Cardiology", datetime: new Date(`${todayStr}T09:00:00`), duration: 30, status: "Scheduled" as const, reason: "Chest pain follow-up" },
    { id: "APPT-002", patientId: "PT-002", doctorId: "EMP-005", department: "OB/GYN", datetime: new Date(`${todayStr}T10:00:00`), duration: 20, status: "Checked In" as const, reason: "Annual checkup" },
    { id: "APPT-003", patientId: "PT-003", doctorId: "EMP-003", department: "Pediatrics", datetime: new Date(`${todayStr}T11:00:00`), duration: 15, status: "In Progress" as const, reason: "Fever & cough" },
    { id: "APPT-004", patientId: "PT-004", doctorId: "EMP-002", department: "Neurology", datetime: new Date(`${todayStr}T14:00:00`), duration: 30, status: "Scheduled" as const, reason: "Migraine consultation" },
    { id: "APPT-005", patientId: "PT-005", doctorId: "EMP-004", department: "Orthopedics", datetime: new Date(`${todayStr}T15:00:00`), duration: 20, status: "Scheduled" as const, reason: "Knee pain" },
    { id: "APPT-006", patientId: "PT-001", doctorId: "EMP-001", department: "Cardiology", datetime: new Date(`${todayStr}T16:00:00`), duration: 15, status: "Cancelled" as const, reason: "Test results review" },
  ];
  await db.insert(s.appointments).values(apptData);
  console.log("  Appointments seeded");

  // ── Encounters ─────────────────────────────────────────────────────────
  const encounterData = [
    { id: "ENC-001", patientId: "PT-001", doctorId: "EMP-001", department: "Cardiology", datetime: new Date(`${todayStr}T09:30:00`), type: "OPD" as const, chiefComplaint: "Chest pain on exertion since 1 week", diagnosis: "Stable angina", notes: "ECG shows mild ST depression" },
    { id: "ENC-002", patientId: "PT-003", doctorId: "EMP-003", department: "Pediatrics", datetime: new Date(`${todayStr}T11:15:00`), type: "OPD" as const, chiefComplaint: "Fever 101°F, dry cough since 3 days", diagnosis: "Upper respiratory tract infection", notes: "Throat congested, chest clear" },
    { id: "ENC-003", patientId: "PT-002", doctorId: "EMP-005", department: "OB/GYN", datetime: new Date(`${todayStr}T10:30:00`), type: "OPD" as const, chiefComplaint: "Lower abdominal pain since 2 days", diagnosis: "Pelvic inflammatory disease", notes: "Ultrasound scheduled" },
    { id: "ENC-004", patientId: "PT-004", doctorId: "EMP-002", department: "Neurology", datetime: new Date("2024-06-10T10:00:00"), type: "OPD" as const, chiefComplaint: "Recurring migraines with aura", diagnosis: "Chronic migraine", notes: "MRI brain normal" },
    { id: "ENC-005", patientId: "PT-005", doctorId: "EMP-004", department: "Orthopedics", datetime: new Date("2024-06-11T11:00:00"), type: "OPD" as const, chiefComplaint: "Right knee pain since 2 months", diagnosis: "ACL strain", notes: "X-ray shows no fracture" },
  ];
  await db.insert(s.encounters).values(encounterData);
  console.log("  Encounters seeded");

  // ── Diagnoses ──────────────────────────────────────────────────────────
  const diagnosisData = [
    { id: "DX-001", encounterId: "ENC-001", icdCode: "I20.8", description: "Stable angina", type: "Primary", certainty: "Confirmed" },
    { id: "DX-002", encounterId: "ENC-001", icdCode: "I10", description: "Essential hypertension", type: "Secondary", certainty: "Confirmed" },
    { id: "DX-003", encounterId: "ENC-002", icdCode: "J06.9", description: "Acute upper respiratory infection", type: "Primary", certainty: "Confirmed" },
    { id: "DX-004", encounterId: "ENC-003", icdCode: "N73.9", description: "Pelvic inflammatory disease", type: "Primary", certainty: "Confirmed" },
    { id: "DX-005", encounterId: "ENC-004", icdCode: "G43.909", description: "Chronic migraine without aura", type: "Primary", certainty: "Confirmed" },
    { id: "DX-006", encounterId: "ENC-005", icdCode: "S83.511A", description: "Right knee ACL strain", type: "Primary", certainty: "Confirmed" },
  ];
  await db.insert(s.diagnoses).values(diagnosisData);
  console.log("  Diagnoses seeded");

  // ── Vitals ─────────────────────────────────────────────────────────────
  const vitalData = [
    { id: "VTL-001", encounterId: "ENC-001", patientId: "PT-001", bpSystolic: 142, bpDiastolic: 92, hr: 82, rr: 18, temp: "36.8", spo2: 97, weight: "72.5", height: "168", bmi: "25.7" },
    { id: "VTL-002", encounterId: "ENC-002", patientId: "PT-003", bpSystolic: 110, bpDiastolic: 70, hr: 98, rr: 22, temp: "38.5", spo2: 98, weight: "28.0", height: "130", bmi: "16.6" },
    { id: "VTL-003", encounterId: "ENC-003", patientId: "PT-002", bpSystolic: 118, bpDiastolic: 76, hr: 76, rr: 16, temp: "37.1", spo2: 99, weight: "62.0", height: "162", bmi: "23.6" },
    { id: "VTL-004", encounterId: "ENC-004", patientId: "PT-004", bpSystolic: 132, bpDiastolic: 84, hr: 72, rr: 17, temp: "36.6", spo2: 98, weight: "68.0", height: "165", bmi: "25.0" },
    { id: "VTL-005", encounterId: "ENC-005", patientId: "PT-005", bpSystolic: 120, bpDiastolic: 80, hr: 68, rr: 16, temp: "36.5", spo2: 99, weight: "75.0", height: "178", bmi: "23.7" },
  ];
  await db.insert(s.vitals).values(vitalData);
  console.log("  Vitals seeded");

  // ── Prescriptions ──────────────────────────────────────────────────────
  const rxData = [
    { id: "RX-001", encounterId: "ENC-001", patientId: "PT-001", doctorId: "EMP-001", status: "Dispensed" as const, notes: "Take with food" },
    { id: "RX-002", encounterId: "ENC-002", patientId: "PT-003", doctorId: "EMP-003", status: "Dispensed" as const, notes: "Complete antibiotic course" },
    { id: "RX-003", encounterId: "ENC-003", patientId: "PT-002", doctorId: "EMP-005", status: "Pending" as const },
  ];
  await db.insert(s.prescriptions).values(rxData);
  console.log("  Prescriptions seeded");

  // ── Rx Items ───────────────────────────────────────────────────────────
  const rxItemData = [
    { id: "RXI-001", prescriptionId: "RX-001", drugCode: "ASP-75", drugName: "Aspirin 75mg", dosage: "75mg", route: "Oral", frequency: "Once daily", duration: "30 days", quantity: 30, instructions: "After breakfast" },
    { id: "RXI-002", prescriptionId: "RX-001", drugCode: "ATR-25", drugName: "Atorvastatin 25mg", dosage: "25mg", route: "Oral", frequency: "Once daily at bedtime", duration: "30 days", quantity: 30 },
    { id: "RXI-003", prescriptionId: "RX-002", drugCode: "AMX-500", drugName: "Amoxicillin 500mg", dosage: "500mg", route: "Oral", frequency: "Three times daily", duration: "7 days", quantity: 21, instructions: "Complete full course" },
    { id: "RXI-004", prescriptionId: "RX-002", drugCode: "PAR-650", drugName: "Paracetamol 650mg", dosage: "650mg", route: "Oral", frequency: "As needed for fever", duration: "5 days", quantity: 15 },
    { id: "RXI-005", prescriptionId: "RX-003", drugCode: "MET-500", drugName: "Metronidazole 500mg", dosage: "500mg", route: "Oral", frequency: "Three times daily", duration: "7 days", quantity: 21 },
  ];
  await db.insert(s.rxItems).values(rxItemData);
  console.log("  Rx Items seeded");

  // ── Lab Test Catalog ───────────────────────────────────────────────────
  const labCatalogData = [
    { id: "LABT-001", name: "Complete Blood Count (CBC)", category: "Hematology", sampleType: "Blood (EDTA)", container: "Purple top", parameters: [{ name: "Hemoglobin", unit: "g/dL", refRange: "13.5-17.5" }, { name: "WBC", unit: "x10³/µL", refRange: "4.5-11.0" }], price: 350, turnaroundHours: 24 },
    { id: "LABT-002", name: "Lipid Profile", category: "Biochemistry", sampleType: "Blood (Serum)", container: "Red top", parameters: [{ name: "Total Cholesterol", unit: "mg/dL", refRange: "<200" }, { name: "HDL", unit: "mg/dL", refRange: ">40" }], price: 500, turnaroundHours: 24 },
    { id: "LABT-003", name: "HbA1c", category: "Biochemistry", sampleType: "Blood (EDTA)", container: "Purple top", parameters: [{ name: "HbA1c", unit: "%", refRange: "4.0-5.6" }], price: 400, turnaroundHours: 24 },
    { id: "LABT-004", name: "COVID-19 RT-PCR", category: "Microbiology", sampleType: "Nasopharyngeal swab", container: "VTM", parameters: [{ name: "SARS-CoV-2 RNA", unit: "Detected/Not Detected", refRange: "Not Detected" }], price: 750, turnaroundHours: 48 },
    { id: "LABT-005", name: "Liver Function Test (LFT)", category: "Biochemistry", sampleType: "Blood (Serum)", container: "Red top", parameters: [{ name: "ALT", unit: "U/L", refRange: "10-40" }, { name: "AST", unit: "U/L", refRange: "10-35" }], price: 600, turnaroundHours: 24 },
  ];
  await db.insert(s.labTestCatalog).values(labCatalogData);
  console.log("  Lab catalog seeded");

  // ── Lab Orders ─────────────────────────────────────────────────────────
  const labOrderData = [
    { id: "LAB-001", encounterId: "ENC-001", patientId: "PT-001", doctorId: "EMP-001", testId: "LABT-001", status: "Completed" as const, priority: "Routine", collectedAt: new Date(`${todayStr}T10:00:00`), resultedAt: new Date(`${todayStr}T15:00:00`), result: { hemoglobin: "14.2", wbc: "7.8" } },
    { id: "LAB-002", encounterId: "ENC-001", patientId: "PT-001", doctorId: "EMP-001", testId: "LABT-002", status: "Completed" as const, priority: "Routine", result: { totalCholesterol: "185", hdl: "48" } },
    { id: "LAB-003", encounterId: "ENC-002", patientId: "PT-003", doctorId: "EMP-003", testId: "LABT-001", status: "Processing" as const, priority: "Urgent" },
    { id: "LAB-004", patientId: "PT-005", doctorId: "EMP-004", testId: "LABT-001", status: "Ordered" as const, priority: "Routine" },
  ];
  await db.insert(s.labOrders).values(labOrderData);
  console.log("  Lab orders seeded");

  // ── Imaging Studies ────────────────────────────────────────────────────
  const imgData = [
    { id: "IMG-001", patientId: "PT-001", encounterId: "ENC-001", studyUid: "1.2.840.113619.2.55.3.2831", modality: "ECG", description: "Resting ECG 12-lead", seriesCount: 1, status: "Completed" },
    { id: "IMG-002", patientId: "PT-005", encounterId: "ENC-005", modality: "X-Ray", description: "Right knee AP & Lateral", seriesCount: 2, status: "Completed", report: "No fracture or dislocation" },
  ];
  await db.insert(s.imagingStudies).values(imgData);
  console.log("  Imaging seeded");

  // ── Billing ────────────────────────────────────────────────────────────
  const billData = [
    { id: "BILL-001", patientId: "PT-001", encounterId: "ENC-001", total: "1850", discount: "0", netAmount: "1850", paid: "1850", balance: "0", status: "Paid" as const, paymentMode: "UPI", items: [{ name: "Consultation", qty: 1, rate: 500 }, { name: "ECG", qty: 1, rate: 350 }, { name: "CBC", qty: 1, rate: 350 }, { name: "Lipid Profile", qty: 1, rate: 500 }] },
    { id: "BILL-002", patientId: "PT-003", encounterId: "ENC-002", total: "1350", discount: "0", netAmount: "1350", paid: "1350", balance: "0", status: "Paid" as const, paymentMode: "Cash", items: [{ name: "Consultation", qty: 1, rate: 500 }, { name: "CBC", qty: 1, rate: 350 }] },
    { id: "BILL-003", patientId: "PT-002", encounterId: "ENC-003", total: "2000", discount: "200", netAmount: "1800", paid: "0", balance: "1800", status: "Pending" as const, items: [{ name: "Consultation", qty: 1, rate: 500 }, { name: "Ultrasound", qty: 1, rate: 1500 }] },
    { id: "BILL-004", patientId: "PT-004", total: "500", discount: "0", netAmount: "500", paid: "500", balance: "0", status: "Paid" as const, paymentMode: "Card", items: [{ name: "Consultation", qty: 1, rate: 500 }] },
    { id: "BILL-005", patientId: "PT-005", encounterId: "ENC-005", total: "1500", discount: "0", netAmount: "1500", paid: "750", balance: "750", status: "Partial" as const, paymentMode: "Cash", items: [{ name: "Consultation", qty: 1, rate: 500 }, { name: "X-Ray", qty: 1, rate: 500 }] },
  ];
  await db.insert(s.billing).values(billData);
  console.log("  Billing seeded");

  // ── Claims ─────────────────────────────────────────────────────────────
  const claimData = [
    { id: "CLM-001", billId: "BILL-001", insurer: "National Insurance Co.", policyNo: "POL-12345", claimedAmount: "1850", approvedAmount: "1800", status: "Settled" as const, submittedAt: new Date("2024-06-01"), settledAt: new Date("2024-06-15") },
    { id: "CLM-002", billId: "BILL-003", insurer: "Star Health", policyNo: "POL-67890", claimedAmount: "1800", status: "Submitted" as const, submittedAt: new Date("2024-06-16") },
  ];
  await db.insert(s.claims).values(claimData);
  console.log("  Claims seeded");

  // ── Inventory ──────────────────────────────────────────────────────────
  const inventoryData = [
    { id: "INV-001", name: "Paracetamol 650mg", category: "Medication", department: "Pharmacy", stock: 500, unit: "Tablets", reorderLevel: 100, reorderQty: 200, location: "A-01", vendor: "MediSupply Co.", unitCost: 2 },
    { id: "INV-002", name: "Amoxicillin 500mg", category: "Medication", department: "Pharmacy", stock: 300, unit: "Capsules", reorderLevel: 80, reorderQty: 150, location: "A-02", vendor: "PharmaCorp", unitCost: 5 },
    { id: "INV-003", name: "Aspirin 75mg", category: "Medication", department: "Pharmacy", stock: 200, unit: "Tablets", reorderLevel: 50, reorderQty: 100, location: "A-03", vendor: "MediSupply Co.", unitCost: 1 },
    { id: "INV-004", name: "Cetirizine 10mg", category: "Medication", department: "Pharmacy", stock: 150, unit: "Tablets", reorderLevel: 40, reorderQty: 80, location: "A-04", vendor: "PharmaCorp", unitCost: 2 },
    { id: "INV-005", name: "Surgical Masks", category: "Consumable", department: "All", stock: 1000, unit: "Pieces", reorderLevel: 200, reorderQty: 500, location: "B-01", vendor: "SafeCare Supplies", unitCost: 3 },
    { id: "INV-006", name: "IV Cannula 22G", category: "Consumable", department: "Nursing", stock: 10, unit: "Pieces", reorderLevel: 25, reorderQty: 50, location: "B-02", vendor: "HospiEquip", unitCost: 15 },
    { id: "INV-007", name: "Glucose 5% 500ml", category: "Medication", department: "Nursing", stock: 60, unit: "Bottles", reorderLevel: 20, reorderQty: 40, location: "C-01", vendor: "IV Solutions Ltd", unitCost: 25 },
    { id: "INV-008", name: "Insulin Humalog", category: "Medication", department: "Pharmacy", stock: 15, unit: "Vials", reorderLevel: 10, reorderQty: 20, location: "C-02", vendor: "LilyPharma", unitCost: 350 },
    { id: "INV-009", name: "EDTA Vacutainers", category: "Lab", department: "Lab", stock: 400, unit: "Pieces", reorderLevel: 50, reorderQty: 100, location: "D-01", vendor: "DiagLab Supplies", unitCost: 8 },
    { id: "INV-010", name: "Syringe 5ml", category: "Consumable", department: "Nursing", stock: 200, unit: "Pieces", reorderLevel: 50, reorderQty: 100, location: "B-03", vendor: "HospiEquip", unitCost: 5 },
  ];
  await db.insert(s.inventory).values(inventoryData);
  console.log("  Inventory seeded");

  // ── Assets ─────────────────────────────────────────────────────────────
  const assetData = [
    { id: "AST-001", name: "MRI Scanner 3T", type: "Imaging", model: "Siemens Skyra 3T", serialNo: "SIEM-2021-001", department: "Radiology", location: "Ground Floor - Room 101", purchaseDate: "2021-03-15", warrantyExpiry: "2026-03-15", lastMaintenance: "2026-05-01", nextMaintenance: "2026-08-01", status: "Operational" as const, vendor: "Siemens Healthineers", cost: 45000000 },
    { id: "AST-002", name: "Ventilator", type: "Life Support", model: "Drager Evita V500", serialNo: "DRG-2022-002", department: "ICU", location: "ICU - Bed 5", purchaseDate: "2022-06-01", warrantyExpiry: "2025-06-01", lastMaintenance: "2026-04-15", nextMaintenance: "2026-10-15", status: "Operational" as const, vendor: "Drager Medical", cost: 2500000 },
    { id: "AST-003", name: "Ultrasound Machine", type: "Imaging", model: "GE Voluson E10", serialNo: "GE-2020-003", department: "OB/GYN", location: "First Floor - Room 205", purchaseDate: "2020-09-20", warrantyExpiry: "2023-09-20", lastMaintenance: "2026-03-10", nextMaintenance: "2026-03-10", status: "Under Maintenance" as const, vendor: "GE Healthcare", cost: 12000000 },
    { id: "AST-004", name: "ECG Machine", type: "Diagnostic", model: "BPL Cardiart 6208", serialNo: "BPL-2023-004", department: "Cardiology", location: "OPD - Room 302", purchaseDate: "2023-01-10", warrantyExpiry: "2025-01-10", lastMaintenance: "2026-02-20", nextMaintenance: "2026-08-20", status: "Operational" as const, vendor: "BPL Medical", cost: 85000 },
    { id: "AST-005", name: "X-Ray Machine", type: "Imaging", model: "Shimadzu RADspeed Pro", serialNo: "SHM-2022-005", department: "Radiology", location: "Ground Floor - Room 105", purchaseDate: "2022-11-01", warrantyExpiry: "2025-11-01", lastMaintenance: "2026-01-15", nextMaintenance: "2026-07-15", status: "Faulty" as const, vendor: "Shimadzu Medical", cost: 8000000 },
  ];
  await db.insert(s.assets).values(assetData);
  console.log("  Assets seeded");

  // ── CME Records ───────────────────────────────────────────────────────
  const cmeData = [
    { id: "CME-001", staffId: "EMP-001", courseName: "Advanced Cardiac Life Support (ACLS)", provider: "American Heart Association", type: "Certification", credits: 40, date: "2026-01-15", completed: true, expiryDate: "2028-01-15" },
    { id: "CME-002", staffId: "EMP-001", courseName: "EHRA Cardiology Summit 2026", provider: "EHRA", type: "Conference", credits: 24, date: "2026-03-20", completed: true },
    { id: "CME-003", staffId: "EMP-002", courseName: "World Stroke Congress", provider: "WSO", type: "Conference", credits: 30, date: "2025-11-10", completed: true },
    { id: "CME-004", staffId: "EMP-003", courseName: "Pediatric Advanced Life Support (PALS)", provider: "American Heart Association", type: "Certification", credits: 35, date: "2026-02-28", completed: true, expiryDate: "2028-02-28" },
    { id: "CME-005", staffId: "EMP-004", courseName: "AO Trauma Course - Advanced", provider: "AO Foundation", type: "Workshop", credits: 20, date: "2026-05-01", completed: false },
  ];
  await db.insert(s.cmeRecords).values(cmeData);
  console.log("  CME records seeded");

  // ── Teleconsultations ──────────────────────────────────────────────────
  const teleData = [
    { id: "TEL-001", patientId: "PT-002", doctorId: "EMP-005", scheduledAt: new Date(`${todayStr}T11:00:00`), scheduledDuration: 15, callStatus: "Scheduled" as const, reason: "Follow-up ultrasound results" },
    { id: "TEL-002", patientId: "PT-001", doctorId: "EMP-001", scheduledAt: new Date("2026-06-10T10:00:00"), scheduledDuration: 20, callStatus: "Completed" as const, callStartedAt: new Date("2026-06-10T10:05:00"), callEndedAt: new Date("2026-06-10T10:20:00"), actualDuration: 15, reason: "Routine tele-follow-up", videoEnabled: true, audioEnabled: true, isRecording: false },
  ];
  await db.insert(s.teleconsultations).values(teleData);
  console.log("  Teleconsultations seeded");

  // ── Specialty Records (JSONB) ──────────────────────────────────────────
  const specialtyData = {
    obgyn: [
      { id: "OBG-001", patientId: "PT-002", encounterId: "ENC-003", partograph: { dilatation: 6, station: -2, contractions: "3/10" } },
    ],
    ecg: [
      { id: "ECG-001", patientId: "PT-001", encounterId: "ENC-001", measurements: { hr: 82, pr: 160, qrs: 92, qtc: 410 }, interpretation: "Normal sinus rhythm, mild ST depression" },
    ],
    pft: [
      { id: "PFT-001", patientId: "PT-001", encounterId: "ENC-001", abg: { ph: 7.42, pco2: 38, po2: 92, hco3: 24, sao2: 97 } },
    ],
    nephro: [
      { id: "NEP-001", patientId: "PT-001", encounterId: "ENC-001", ktv: { preBun: 52, postBun: 18, dialyzerCl: 200, qd: 30, sessionHrs: 4, ktv: 1.45, weightLoss: 2.1 } },
    ],
    cardio: [
      { id: "CARD-001", patientId: "PT-001", encounterId: "ENC-001", echocardiogram: { lvef: 55, rvsp: 25, eA: 0.8, septalThickness: 11 } },
    ],
    oncology: [
      { id: "ONC-001", patientId: "PT-002", encounterId: "ENC-003", recist: { lesions: [{ site: "Liver", diameter: 2.1, status: "Stable" }, { site: "Lung", diameter: 1.5, status: "Partial Response" }] } },
    ],
  };
  if (specialtyData.obgyn.length) await db.insert(s.obgynRecords).values(specialtyData.obgyn);
  if (specialtyData.ecg.length) await db.insert(s.ecgRecords).values(specialtyData.ecg);
  if (specialtyData.pft.length) await db.insert(s.pftRecords).values(specialtyData.pft);
  if (specialtyData.nephro.length) await db.insert(s.nephrologyRecords).values(specialtyData.nephro);
  if (specialtyData.cardio.length) await db.insert(s.cardioRecords).values(specialtyData.cardio);
  if (specialtyData.oncology.length) await db.insert(s.oncologyRecords).values(specialtyData.oncology);
  console.log("  Specialty records seeded");

  // ── ICD-10 Master Data ─────────────────────────────────────────────────
  const { default: seedIcd10Data } = await import("./seed-icd10");
  await seedIcd10Data();

  console.log("Seed complete!");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
