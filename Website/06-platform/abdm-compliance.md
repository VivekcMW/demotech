---
page: "ABDM & Compliance"
slug: /platform/abdm-compliance
hub: Platform
meta_title: "ABDM-Ready HIMS — ABHA, HPR, HFR, Scan & Share | {Product}"
meta_description: "ABHA creation and verification, scan-and-share registration, linked health records (M2/M3), HPR/HFR onboarding, plus NABH and statutory compliance."
---

# ABDM is not a feature we sell you. It's how the product works.

The Ayushman Bharat Digital Mission is rebuilding how health records move in India. {Product} was built ABDM-native — not retrofitted — and we never price compliance as an upsell.

---

## What's built in

**ABHA (Health ID).** Create ABHA numbers at registration via Aadhaar or mobile OTP, verify existing ABHAs, and link every visit to the patient's ABHA with consent. Patients without ABHA are always served identically — linking is optional per patient, mandatory never.

**Scan and share.** The patient scans your facility's QR with any ABDM-enabled app; verified demographics arrive at your front desk and a token issues automatically. Registration drops from minutes to seconds and your demographic data quality jumps — this is the single highest-ROI ABDM feature for a busy OPD.

**Linked health records (HIP/HIU).** {Product} acts as a Health Information Provider — your records (OP consultations, discharge summaries, diagnostic reports, prescriptions, immunisations, wellness records, in ABDM's FHIR formats) become linkable and shareable when, and only when, the patient consents through a consent manager. As a Health Information User, your doctors can request a patient's records from other facilities the same way — imagine admission with the patient's history actually available.

**Health professional & facility registries.** HPR onboarding for your doctors and HFR registration for your facility, handled during implementation.

---

## Consent, exactly as the architecture intends

Every data exchange rides the ABDM consent artefact: purpose, date range, data types, expiry. {Product} surfaces consent status in the chart, honours revocation immediately, and logs every fulfilment. No side channels, no 'bulk sync', no exceptions.

---

## HIE & PHR connectivity

**Health Information Exchange (HIE).** Push and pull health records through ABDM gateway. {Product} supports:
- **Push:** Upload clinical documents, diagnostic reports, and summaries to the patient's ABHA-linked record
- **Pull:** Retrieve records from other ABDM-compliant facilities when the patient consents
- **Event notifications:** Receive alerts when records are added to a patient's longitudinal health history

**PHR sync.** Patients can sync their records with any ABDM-registered Personal Health App (PHR app). The sync includes consultation summaries, lab reports, prescriptions, and immunisation records — in the patient's preferred app.

**Note:** ABDM gateway integration requires live gateway credentials issued by the National Health Authority. {Product} handles the technical onboarding and certification process during implementation, but the hospital must complete HPR/HFR registration and obtain gateway credentials before going live.

---

## Beyond ABDM: the compliance stack

- **NABH** — quality indicators, audit trails, committee reports, and entry-level to full-accreditation evidence generated from live operations ([details on the Analytics page](/product/analytics-mis-nabh))
- **DPDP Act 2023** — consent records, purpose limitation, data-principal rights workflows ([Security & Data Privacy](/platform/security-data-privacy))
- **Statutory registers** — MTP, PCPNDT, birth/death, MLC, narcotics, biomedical waste, in prescribed formats
- **NMC prescription norms** — generic names, legibility, registration details on every prescription by default
- **GST** — invoice formats, HSN/SAC mapping, returns-ready exports

---

## What this means commercially

Government incentive schemes and payer programmes increasingly assume digital, ABDM-linked records. Hospitals on {Product} are already in position — no migration project, no compliance scramble.

[Book a demo] · Related: [Security & DPDP](/platform/security-data-privacy) · [ABDM/ABHA module](/product/abdm-abha)
