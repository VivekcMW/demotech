interface WorklistEntry {
  accessionNumber: string;
  patientId: string;
  patientName: string;
  modality: string;
  scheduledDate: string;
  scheduledTime: string;
  procedureStepId: string;
  studyUid: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

const MOCK_WORKLIST: WorklistEntry[] = [
  { accessionNumber: "ACC-001", patientId: "PAT-0001", patientName: "Rajesh Kumar", modality: "CT", scheduledDate: "2026-06-20", scheduledTime: "09:00", procedureStepId: "SPS-001", studyUid: "1.2.840.113619.2.55.3.2831214267.1234.1", status: "SCHEDULED" },
  { accessionNumber: "ACC-002", patientId: "PAT-0002", patientName: "Priya Sharma", modality: "MR", scheduledDate: "2026-06-20", scheduledTime: "10:30", procedureStepId: "SPS-002", studyUid: "1.2.840.113619.2.55.3.2831214267.1235.1", status: "SCHEDULED" },
  { accessionNumber: "ACC-003", patientId: "PAT-0003", patientName: "Anil Verma", modality: "DX", scheduledDate: "2026-06-20", scheduledTime: "11:00", procedureStepId: "SPS-003", studyUid: "1.2.840.113619.2.55.3.2831214267.1236.1", status: "IN_PROGRESS" },
  { accessionNumber: "ACC-004", patientId: "PAT-0004", patientName: "Sunita Patel", modality: "US", scheduledDate: "2026-06-19", scheduledTime: "14:00", procedureStepId: "SPS-004", studyUid: "1.2.840.113619.2.55.3.2831214267.1237.1", status: "COMPLETED" },
  { accessionNumber: "ACC-005", patientId: "PAT-0005", patientName: "Vikram Singh", modality: "MG", scheduledDate: "2026-06-21", scheduledTime: "08:30", procedureStepId: "SPS-005", studyUid: "1.2.840.113619.2.55.3.2831214267.1238.1", status: "SCHEDULED" },
];

export async function queryWorklist(date: string, modality?: string): Promise<object[]> {
  let results = MOCK_WORKLIST.filter((w) => w.scheduledDate === date);
  if (modality) results = results.filter((w) => w.modality === modality);
  return results;
}

export async function updateProcedureStatus(studyUid: string, status: string): Promise<void> {
  const entry = MOCK_WORKLIST.find((w) => w.studyUid === studyUid);
  if (entry) entry.status = status as WorklistEntry["status"];
}

export async function getWorklistForModality(modality: string, date: string): Promise<object[]> {
  return MOCK_WORKLIST.filter((w) => w.modality === modality && w.scheduledDate === date);
}
