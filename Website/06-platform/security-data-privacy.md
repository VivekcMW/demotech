---
page: "Security & Data Privacy"
slug: /platform/security-data-privacy
hub: Platform
meta_title: "Healthcare Data Security & DPDP Compliance | {Product}"
meta_description: "Encryption in transit and at rest, role-based access with break-glass audit, DPDP Act 2023 readiness, Indian data residency, and tested backups."
---

# Patient data is a liability until it's protected. Then it's an asset.

Hospitals hold the most sensitive personal data there is. Under the DPDP Act 2023, protecting it is no longer good practice — it's a legal obligation with penalties. Here is, specifically, how {Product} protects it.

---

## Data protection

**Encryption.** TLS 1.2+ for every connection; AES-256 encryption at rest for databases, documents, and backups. No exceptions for 'internal' traffic.

**Residency.** Patient data is stored in Indian data-centre regions. Backups stay in India. This is contractual, not aspirational.

**Backups & recovery.** Automated encrypted backups with defined RPO/RTO, and — the part most vendors skip — scheduled restore drills, because a backup that's never been restored is a hope, not a plan.

---

## Access control

**Role-based access** with least-privilege defaults: a billing executive doesn't see clinical notes; a visiting consultant sees their patients. Privileges are granular to the action level (view, create, modify, cancel, print, export).

**Break-glass access** for genuine emergencies — any clinician can reach a record they normally couldn't, but the access is flagged, justified, and reviewed. Safety and accountability, both.

**Authentication** — strong password policy, optional 2FA, SSO (SAML/OIDC) for enterprises, automatic session timeout on shared ward machines, and device-level controls for high-risk roles.

**Audit trail** — every view, edit, print, and export, by whom, when, from where. Bill modifications and record amendments keep before/after values. The audit log itself is append-only.

---

## DPDP Act 2023, operationally

The Act's principles map to product behaviour, not just policy documents:

- **Consent & notice** — capture at registration in the patient's language; granular consent for ABDM sharing, research use, and communications
- **Purpose limitation** — role-based access and module boundaries enforce it technically
- **Data-principal rights** — workflows for access requests, correction, and grievance logging
- **Breach readiness** — anomaly alerts (mass exports, off-hours access patterns), incident runbooks, and notification support
- **Retention** — policy-driven retention schedules honouring medical-record norms and legal holds

---

## Shared responsibility, stated honestly

We secure the platform, infrastructure, and application. You control user discipline, role assignments, and physical access. Implementation includes hardening your side: privilege reviews, shared-login elimination, and staff training — because the commonest breach is a password on a sticky note, not a hacker.

[Book a demo] · Related: [Architecture & Reliability](/platform/architecture-reliability) · [ABDM & Compliance](/platform/abdm-compliance)
