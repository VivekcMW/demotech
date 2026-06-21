import { Hono } from "hono";
import {
  COMPLIANCE_STANDARDS,
  generateCertificationReport,
  generateGapAnalysis,
  getComplianceByCategory,
} from "../compliance";

const compliance = new Hono();

compliance.get("/standards", (c) => {
  const category = c.req.query("category");
  if (category) {
    const filtered = COMPLIANCE_STANDARDS.filter((s) => s.category === category);
    return c.json(filtered);
  }
  return c.json(COMPLIANCE_STANDARDS);
});

compliance.get("/standards/categories", (c) => {
  const grouped = getComplianceByCategory();
  const categories = Object.keys(grouped).map((key) => ({
    id: key,
    name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count: grouped[key].length,
    implemented: grouped[key].filter((s) => s.implemented).length,
  }));
  return c.json(categories);
});

compliance.get("/standards/:id", (c) => {
  const id = c.req.param("id");
  const standard = COMPLIANCE_STANDARDS.find((s) => s.id === id);
  if (!standard) return c.json({ error: "Standard not found" }, 404);
  return c.json(standard);
});

compliance.get("/report", (c) => {
  const certification = c.req.query("certification") || "MeitY/STQC EMR";
  const report = generateCertificationReport(certification);
  return c.json(report);
});

compliance.get("/gap-analysis", (c) => {
  const analysis = generateGapAnalysis();
  return c.json(analysis);
});

compliance.get("/summary", (c) => {
  const report = generateCertificationReport();
  return c.json({
    certification: report.certification,
    generatedAt: report.generatedAt,
    summary: report.summary,
    byCategory: report.byCategory,
  });
});

export default compliance;
