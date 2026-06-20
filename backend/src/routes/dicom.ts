import { Hono } from "hono";
import { queryStudies, retrieveStudy, storeInstance } from "../dicom";
import { queryWorklist } from "../dicom";

const dicom = new Hono();

dicom.get("/studies", async (c) => {
  const patientId = c.req.query("patient_id") || "*";
  const modality = c.req.query("modality");
  const dateFrom = c.req.query("date_from");
  const dateTo = c.req.query("date_to");
  const results = await queryStudies(patientId, { modality, dateFrom, dateTo });
  return c.json({ data: results });
});

dicom.get("/studies/:uid", async (c) => {
  try {
    const study = await retrieveStudy(c.req.param("uid"));
    return c.json(study);
  } catch {
    return c.json({ error: "Study not found" }, 404);
  }
});

dicom.post("/studies", async (c) => {
  const body = await c.req.arrayBuffer();
  const instanceUid = await storeInstance(c.req.query("study_uid") || "", Buffer.from(body));
  return c.json({ instanceUid }, 201);
});

dicom.get("/worklist", async (c) => {
  const date = c.req.query("date") || new Date().toISOString().slice(0, 10);
  const modality = c.req.query("modality");
  const results = await queryWorklist(date, modality);
  return c.json({ data: results });
});

export default dicom;
