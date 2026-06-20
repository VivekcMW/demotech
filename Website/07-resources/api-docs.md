---
page: "API Documentation — Landing"
slug: /resources/api-docs
hub: Resources
meta_title: "Developer & API Documentation | {Product}"
meta_description: "FHIR R4 APIs, webhooks, and integration guides — published openly. Build against {Product} without signing an NDA."
---

# API Documentation

## Position

Published openly — no NDA, no sales call to read the docs. Hospitals' integration partners, in-house developers, and even competitors can read exactly what {Product} exposes. Open doors are a feature; see [Interoperability](/platform/interoperability).

## Contents

1. **Getting started** — authentication (JWT Bearer token), environments, sandbox access, rate limits
2. **FHIR R4 API reference** — Patient, Encounter, Observation, MedicationRequest, DiagnosticReport, DocumentReference and the supported resource catalogue, with ABDM profile notes
3. **Webhooks & events** — admission/discharge/transfer, result-released, bill-finalised, appointment events
4. **Integration guides** — analyser interfacing, DICOM modality setup, accounting posting, WhatsApp/SMS configuration, payment-gateway linkage
5. **Recipes** — common builds: a patient-facing report portal, a referral-partner dashboard, a group-BI extract
6. **Changelog & deprecation policy** — versioning rules and minimum notice periods, in writing

## FHIR API Reference

### Base URL

```
https://api.{product-domain}/fhir/r4/
```

Sandbox: `https://sandbox-api.{product-domain}/fhir/r4/`

### Authentication

All requests require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

Tokens are obtained from the EHR API authentication endpoint using your client credentials. Include the same token across all FHIR requests within a session.

### Example: Patient Search

```
GET /Patient?name=Sharma&birthdate=eq1990-01-01
```

Response:

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 2,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "pat-001234",
        "name": [{"family": "Sharma", "given": ["Ravi"]}],
        "birthDate": "1990-01-01"
      }
    }
  ]
}
```

### Example: Create Observation

```
POST /Observation
Content-Type: application/fhir+json

{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [{"system": "http://loinc.org", "code": "2345-7", "display": "Glucose [Mass/volume] in Serum or Plasma"}]
  },
  "subject": {"reference": "Patient/pat-001234"},
  "valueQuantity": {"value": 92, "unit": "mg/dL", "system": "http://unitsofmeasure.org", "code": "mg/dL"}
}
```

### Pagination

Use `_count` to limit results (default 50, max 200) and `_sort` to order:

```
GET /Observation?patient=pat-001234&_count=20&_sort=-date
```

The response Bundle includes `self`, `next`, and `previous` links for navigation.

### Error Handling

Errors return standard FHIR `OperationOutcome` resources:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "processing",
    "diagnostics": "Resource Patient/not-found-id is not known"
  }]
}
```

### Rate Limits

- **Production:** 1,000 requests per minute per tenant
- **Sandbox:** 10,000 requests per minute per tenant
- Batch/transaction bundles count as a single request
- Exceeding the limit returns HTTP 429 with a `Retry-After` header

### Specification

The API follows the [HL7 FHIR R4 specification](https://hl7.org/fhir/R4/). ABDM FHIR profiles are available on request.

Sandbox tenancy with synthetic Indian-context data (names, ABHA-format IDs, lakh/crore amounts) available on request.
