export interface DicomEndpointConfig {
  url: string;
  username: string;
  password: string;
}

interface DicomStudy {
  studyUid: string;
  patientId: string;
  patientName: string;
  studyDescription: string;
  studyDate: string;
  modality: string;
  seriesCount: number;
  instanceCount: number;
}

const MOCK_STUDIES: DicomStudy[] = [
  { studyUid: "1.2.840.113619.2.55.3.2831214267.1234.1", patientId: "PAT-0001", patientName: "Rajesh Kumar", studyDescription: "Chest CT - Routine Follow-up", studyDate: "2026-06-15", modality: "CT", seriesCount: 3, instanceCount: 120 },
  { studyUid: "1.2.840.113619.2.55.3.2831214267.1235.1", patientId: "PAT-0002", patientName: "Priya Sharma", studyDescription: "MRI Brain - Post Contrast", studyDate: "2026-06-14", modality: "MR", seriesCount: 5, instanceCount: 240 },
  { studyUid: "1.2.840.113619.2.55.3.2831214267.1236.1", patientId: "PAT-0003", patientName: "Anil Verma", studyDescription: "X-Ray Chest PA View", studyDate: "2026-06-13", modality: "DX", seriesCount: 1, instanceCount: 2 },
  { studyUid: "1.2.840.113619.2.55.3.2831214267.1237.1", patientId: "PAT-0001", patientName: "Rajesh Kumar", studyDescription: "Abdominal Ultrasound", studyDate: "2026-06-12", modality: "US", seriesCount: 4, instanceCount: 60 },
  { studyUid: "1.2.840.113619.2.55.3.2831214267.1238.1", patientId: "PAT-0004", patientName: "Sunita Patel", studyDescription: "Mammography Screening", studyDate: "2026-06-11", modality: "MG", seriesCount: 2, instanceCount: 8 },
];

function buildAuthHeader(config: DicomEndpointConfig): string {
  return `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
}

export async function queryStudies(patientId: string, options?: { modality?: string; dateFrom?: string; dateTo?: string }): Promise<object[]> {
  let results = MOCK_STUDIES.filter((s) => s.patientId === patientId);
  if (!patientId || patientId === "*") results = [...MOCK_STUDIES];
  if (options?.modality) results = results.filter((s) => s.modality === options.modality);
  if (options?.dateFrom) results = results.filter((s) => s.studyDate >= options.dateFrom!);
  if (options?.dateTo) results = results.filter((s) => s.studyDate <= options.dateTo!);
  return results;
}

export async function retrieveStudy(studyUid: string): Promise<object> {
  const study = MOCK_STUDIES.find((s) => s.studyUid === studyUid);
  if (!study) throw new Error(`Study ${studyUid} not found`);
  return {
    ...study,
    series: [
      { seriesUid: "1.2.840.113619.2.55.3.2831214267.9901.1", seriesNumber: 1, modality: study.modality, instances: study.instanceCount },
    ],
  };
}

export async function storeInstance(studyUid: string, dicomData: Buffer): Promise<string> {
  const instanceUid = `1.2.840.113619.2.55.3.${Date.now()}.1`;
  return instanceUid;
}

export async function retrieveThumbnail(studyUid: string, seriesUid: string, instanceUid: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect fill="#111" width="256" height="256"/><text x="128" y="128" fill="#0891b2" font-family="monospace" font-size="12" text-anchor="middle" dominant-baseline="middle">DICOM</text></svg>`;
  return Buffer.from(svg);
}

export function mapDicomToFhir(dicomMetadata: Record<string, unknown>): object {
  return {
    resourceType: "ImagingStudy",
    id: dicomMetadata.studyUid as string,
    status: "available",
    subject: { reference: `Patient/${dicomMetadata.patientId}` },
    started: dicomMetadata.studyDate as string,
    numberOfSeries: dicomMetadata.seriesCount ?? 0,
    numberOfInstances: dicomMetadata.instanceCount ?? 0,
    description: dicomMetadata.studyDescription as string,
    modality: [{ system: "http://dicom.nema.org/resources/ontology/dcm", code: dicomMetadata.modality as string }],
  };
}
