---
page: "Integrations"
slug: /platform/integrations
hub: Platform
meta_title: "Hospital Software Integrations — Devices, WhatsApp, Tally, Payments | {Product}"
meta_description: "Lab analysers, imaging modalities, WhatsApp Business, payment gateways and UPI, Tally/SAP, PBX, biometrics, and a growing integration library."
---

# The hospital is an ecosystem. We connect to it.

{Product} replaces the systems that fragment care — and integrates with everything that doesn't need replacing.

---

## Clinical devices

- **Lab analysers** — two-way interfaces (ASTM/HL7) across chemistry, haematology, immunoassay, coagulation, electrolytes; the interface library grows with every implementation
- **Imaging modalities** — DICOM worklist and store for CT, MRI, X-ray, ultrasound, mammography
- **Bedside monitors & POCT** — vitals capture into ICU flowsheets where devices support data output; glucometers and blood-gas analysers at the point of care
- **Ophthalmic, dental, derma devices** — specialty equipment (autorefractors, OCT, intraoral scanners, imaging systems) per the relevant specialty module

## Patient communication

- **WhatsApp Business API** — appointment confirmations, queue tokens, report-ready links, payment links, follow-up reminders, in the patient's language
- **SMS** — DLT-compliant transactional messaging as the universal fallback
- **Email** — reports and invoices where patients prefer it

## Money

- **Payment gateways & UPI** — counter QR, payment links, patient-app payments, auto-reconciled against bills
- **Accounting** — summarised voucher posting to Tally and enterprise ERPs (SAP, Oracle); your CA's world stays intact
- **EDC/card terminals** — supported terminal integrations for counter payments

## Operations

- **Biometric/HR devices** — attendance feeds for duty rosters where used
- **PBX/IVR** — screen-pop of the patient record on incoming calls (supported systems)
- **Barcode & label printers, document scanners** — standard across registration, pharmacy, lab, and records

---

## Integration endpoints

**HL7v2 MLLP server.** Dedicated MLLP listener on port 6165 for ADT (admission, discharge, transfer), ORM (orders), and ORU (results) messages. Supports ER7 (pipe-delimited) encoding. Connect lab analysers, legacy systems, and third-party middleware directly.

**DICOMweb.** DICOMweb endpoints available at `/dicomweb/studies` for STOW-RS (store), WADO-RS (retrieve), and QIDO-RS (query). Supports CT, MRI, X-ray, ultrasound, and mammography modalities.

**LIS connector.** Dedicated LIS Gateway service for bi-directional lab integration. ASTM E1381-02 and HL7 v2.5 message formats supported. Auto-orders and auto-results with configurable mapping rules.

**Webhook subscriptions.** Subscribe to real-time events — admission, discharge, transfer, result released, bill finalised, appointment changes. Webhook payloads are delivered as JSON to your configured endpoint with retry and logging.

**Admin configuration.** All integration endpoints are configurable from the admin dashboard — connection strings, ports, API keys, mapping tables, and webhook targets — without touching code or config files.

---

## When something isn't on the list

The honest answer most vendors avoid: integration feasibility depends on the other system having a door. If your device or software exposes a standard interface (HL7, FHIR, DICOM, ASTM, REST), we connect during implementation as scoped work, quoted before we start. If it has no interface at all, we say so upfront rather than after the contract.

[Book a demo] · Related: [Interoperability](/platform/interoperability)
