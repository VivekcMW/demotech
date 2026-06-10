# Specialty PRD — General Medicine / Internal Medicine
## End-to-End Overlay Specification for Single/Multi-Doctor and Single/Multi-Branch Deployments

**Document Version:** 1.0  
**Last Updated:** June 10, 2026  
**Specialty Tier:** Tier 1 (#1)  
**Priority:** Launch Essential (MVP)

**Related Documents:**
- [../common-services-workflows.md](../common-services-workflows.md)
- [../specialty-priority-list.md](../specialty-priority-list.md)
- [../core-platform/1.1-patient-management-prd.md](../core-platform/1.1-patient-management-prd.md)
- [../core-platform/1.2-scheduling-prd.md](../core-platform/1.2-scheduling-prd.md)
- [../core-platform/1.3-clinical-documentation-engine-prd.md](../core-platform/1.3-clinical-documentation-engine-prd.md)
- [../core-platform/1.4-orders-cpoe-prd.md](../core-platform/1.4-orders-cpoe-prd.md)
- [../core-platform/1.11-platform-services-prd.md](../core-platform/1.11-platform-services-prd.md)

---

## 1) PURPOSE & SCOPE

This PRD defines the **General Medicine/Internal Medicine** specialty layer on top of the shared core platform. It is designed to run with identical business logic across these deployment profiles:

1. **Solo Doctor Clinic** (1 physician + minimal staff)
2. **Multi-Doctor Clinic** (2+ physicians sharing common operations)
3. **Single-Branch Hospital** (OPD + IPD + ER handoffs)
4. **Multi-Branch Chain** (shared standards, branch-level operations)

### 1.1 In Scope
- GenMed clinical templates and documentation standards
- Acute and chronic care workflows
- GenMed-specific order sets and protocol bundles
- Follow-up cadence and continuity-of-care workflows
- Inpatient GenMed rounding/discharge standards
- Multi-doctor and multi-branch governance behavior
- Specialty KPIs and quality indicators

### 1.2 Out of Scope
- Non-GenMed specialty deep workflows (Cardio/Neuro/Onco etc.)
- Core platform services already covered in core PRDs
- Insurance adjudication internals (billing core handles claims lifecycle)

---

## 2) DEPLOYMENT PROFILES (MANDATORY SUPPORT)

## 2.1 Profile A — Solo Doctor Clinic

**Operational assumptions:**
- One doctor, one queue, one front desk user, optional nurse
- Mostly OPD + chronic follow-up + referrals

**Behavior requirements:**
- Simplified queue with fast walk-in + booked blending
- Minimal mandatory fields (while preserving legal and safety standards)
- Quick note templates with macro-heavy workflows
- Low-click medication refill and chronic review patterns

## 2.2 Profile B — Multi-Doctor Clinic

**Operational assumptions:**
- Shared front desk and shared diagnostics/pharmacy coordination
- Doctors may subspecialize but within GenMed umbrella

**Behavior requirements:**
- Doctor-specific schedules + common pool balancing
- Inter-doctor handoff notes and referral-internal workflow
- Cross-cover mode for absent doctor

## 2.3 Profile C — Single-Branch Hospital

**Operational assumptions:**
- OPD + ER referrals + IPD admissions under GenMed

**Behavior requirements:**
- Admission criteria and inpatient round templates
- Escalation to ICU and specialty consult routing
- Discharge + follow-up + readmission tracking

## 2.4 Profile D — Multi-Branch Chain

**Operational assumptions:**
- Central governance with branch-level execution

**Behavior requirements:**
- Shared template and protocol governance
- Branch-specific overrides (tariff, roster, local pathways)
- Cross-branch patient continuity (consent + RBAC scoped)
- Central quality dashboard + branch benchmarking

---

## 3) PERSONAS & ROLE BEHAVIOR

| Persona | Solo Clinic | Multi-Doctor/Branch | Needs |
|---|---|---|---|
| GenMed Consultant | Primary owner of all decisions | Shared responsibility with peers | Rapid consult, chronic trend visibility |
| Duty/On-call Doctor | N/A or minimal | Required for hospital/chain | Cross-cover handoff clarity |
| Nurse | Optional/minimal | Structured shifts and charting | Vitals/tasks/handover |
| Front Desk | Multi-task role | Dedicated operations role | Queue + follow-up + recall |
| Billing Executive | Combined role | Dedicated role | Accurate consult/procedure capture |
| Admin/HOD | Basic oversight | Full governance | Template control + KPI monitoring |

---

## 4) CLINICAL SERVICE CATALOG (GENMED)

1. New OPD consultation
2. Follow-up OPD consultation
3. Chronic disease review clinic
4. Fever/acute illness clinic
5. Geriatric/internal medicine comprehensive review
6. ER medical screening handoff
7. IPD admission assessment
8. Daily inpatient progress rounds
9. Discharge planning and transition-of-care
10. Preventive annual health assessment

---

## 5) END-TO-END WORKFLOWS

## 5.1 New OPD Consultation Workflow

```text
Registration/check-in → triage vitals → doctor consult template load →
history + exam + differential/assessment → order set selection (if needed) →
medication/prescription → diagnosis coding → follow-up booking → billing closure
```

**Controls:**
- Allergy and interaction checks mandatory for prescriptions
- Primary diagnosis required before note sign
- Follow-up recommendation required (date or reason not required)

## 5.2 Follow-up Consultation Workflow

```text
Retrieve last encounter summary → compare symptom/vitals/lab trends →
update problem list and treatment response → adjust plan/medications →
next follow-up window assignment
```

**Controls:**
- Copy-forward allowed with stale-data confirmation
- Chronic disease care-gap prompts if due tests missing

## 5.3 Chronic Disease Management Workflow

Applicable for: Diabetes, HTN, CKD early-stage, COPD/asthma, thyroid disorders, dyslipidemia, CAD follow-up (medical management).

```text
Registry enrollment (auto by diagnosis) → periodic review template →
trend capture (BP/HbA1c/lipids/renal markers etc.) → medication adherence review →
lifestyle counseling checklist → next review + due investigations
```

**Care-gap examples:**
- Diabetes: HbA1c overdue > 3 months
- HTN: BP uncontrolled in last 2 visits
- CKD: creatinine/eGFR trend worsening without nephrology referral

## 5.4 Acute Illness Workflow (GenMed)

```text
Presenting complaint triage → severity flag (routine/urgent/stat) →
focused exam template → acute panel orders (if needed) →
initial treatment + reassessment decision → discharge/admit/refer
```

Common acute pathways:
- Fever without focus
- Respiratory symptoms
- Suspected UTI
- Gastroenteritis/dehydration
- Non-trauma chest discomfort triage to higher pathway

## 5.5 ER to GenMed Handoff Workflow

```text
ER initial stabilization → handoff note (SBAR) → GenMed acceptance →
admission/observation/discharge decision → treatment plan continuity
```

**Controls:**
- Mandatory handoff note fields before transfer acceptance
- Critical pending orders displayed in acceptance panel

## 5.6 IPD Admission & Daily Rounds Workflow

```text
Admission note → initial order bundle → daily progress notes + vitals review →
therapy modifications → consult requests/escalation if needed → discharge readiness scoring
```

## 5.7 Discharge & Transition-of-Care Workflow

```text
Clinical stability check → diagnosis/final summary completion →
medication reconciliation → warning signs counseling →
follow-up booking + investigation plan → discharge summary sign-off
```

**Controls:**
- Discharge summary hard-stop for missing final diagnosis and medication plan
- Follow-up date or referral rationale mandatory

---

## 6) CLINICAL DOCUMENTATION REQUIREMENTS

## 6.1 Mandatory Template Set

1. GenMed New Consult SOAP
2. GenMed Follow-up SOAP
3. Chronic Disease Review Template
4. Acute Illness Focused Template
5. IPD Admission Note
6. Daily Progress Note
7. Discharge Summary (GenMed)
8. Internal Referral Note

## 6.2 Core Fields (Minimum Mandatory)

| Section | Mandatory Fields |
|---|---|
| History | Chief complaint, duration, key associated symptoms |
| Vitals | BP, pulse, temperature, SpO2 (context-based), weight where relevant |
| Exam | Systemic exam summary |
| Assessment | Primary diagnosis (coded), differential (optional) |
| Plan | Treatment plan, investigations (if any), follow-up advice |

## 6.3 Coding & Compliance
- ICD-10 coded primary diagnosis mandatory at sign-off
- Secondary diagnoses mandatory for significant comorbidities
- Signed note immutability + addendum workflow

---

## 7) ORDER SETS & PROTOCOL BUNDLES (GENMED)

## 7.1 Baseline Order Sets

1. Fever Workup Panel
2. Hypertension Review Panel
3. Diabetes Follow-up Panel
4. Dyspnea Workup Panel
5. Chest Pain Initial Medical Panel (non-cardiac triage-aware)
6. CKD Monitoring Panel
7. Thyroid Follow-up Panel
8. Anemia Workup Panel
9. Geriatric Polypharmacy Review Bundle
10. Pre-admission Medical Clearance Panel

## 7.2 Medication Governance
- Interaction and allergy checks mandatory
- Duplicate therapy warnings for same pharmacologic class
- High-alert meds require override justification where configured

---

## 8) DIAGNOSTICS & RESULT MANAGEMENT

## 8.1 Ordering Patterns
- Labs and imaging routed through unified CPOE
- Priority states: routine, urgent, stat
- Duplicate-window checks for frequent repeat tests

## 8.2 Critical Result Closure

```text
Critical result flagged → ordering doctor + assigned nurse alerted →
acknowledgment + action note mandatory → escalation if SLA missed
```

---

## 9) MEDICATION MANAGEMENT REQUIREMENTS

1. OPD ePrescription with language-friendly instructions
2. IPD medication plan with administration linkage
3. Renewal/refill logic with follow-up dependency
4. Deprescribing and medication reconciliation support
5. Adherence review fields in chronic follow-up template

---

## 10) SCHEDULING & QUEUE REQUIREMENTS

## 10.1 Single Doctor Mode
- One shared queue with token + appointment merge
- Simple delay broadcast to waiting patients

## 10.2 Multi-Doctor Mode
- Provider-specific and pooled slot models
- Cross-cover reassignment when doctor unavailable

## 10.3 Multi-Branch Mode
- Branch-level schedule isolation with optional cross-branch booking rights
- Travel-distance aware branch suggestion (optional)

---

## 11) ADT & INPATIENT (GENMED)

1. Admission criteria template from OPD/ER
2. Daily rounds checklist (clinical status, pending tests, treatment response)
3. Transfer-to-ICU trigger fields
4. Discharge readiness and LOS monitoring
5. Readmission flag for <30-day returns

---

## 12) NURSING & CARE COORDINATION

1. Frequency-based vitals charting profiles (ward vs high-dependency)
2. Nursing tasks from GenMed orders
3. Intake/output and symptom monitoring where relevant
4. Shift handover (SBAR) with pending critical tasks

---

## 13) MULTI-BRANCH GOVERNANCE MODEL

## 13.1 Central Controls
- Template and order-set publishing (maker-checker)
- Core quality KPI definitions
- Coding dictionary governance

## 13.2 Branch Overrides
- Working hours and queue policy
- Local tariff and package pricing
- Optional local protocol add-ons with central approval

## 13.3 Data Access
- Consent-aware cross-branch clinical record access
- RBAC scope: own/department/branch/all-branch as configured

---

## 14) QUALITY, SAFETY, AND COMPLIANCE

1. ICD coding completeness checks
2. Critical result acknowledgment SLA
3. Documentation deficiency dashboard
4. Discharge summary completion SLA
5. Break-glass and sensitive access auditing
6. NABH evidence export readiness for GenMed indicators

---

## 15) REPORTS & KPIs

## 15.1 Clinical KPIs
- Chronic disease control rates (e.g., BP/HbA1c trends)
- Readmission within 30 days
- Escalation rates to ICU/specialty consult

## 15.2 Operational KPIs
- OPD TAT (arrival-to-consult)
- Follow-up adherence rate
- No-show rate
- Average consultation duration

## 15.3 Financial KPIs
- Revenue per consult/day/doctor
- Diagnostics conversion from consult
- Chronic package adoption and retention

---

## 16) NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|---|---|
| Note load latency | < 1.5 sec P95 |
| Order entry search latency | < 300 ms P95 |
| Queue board refresh | < 5 sec |
| Critical alert dispatch | < 30 sec |
| Availability | 99.9% |
| Audit coverage | 100% state-changing actions |

---

## 17) ACCEPTANCE CRITERIA

1. Works in solo and multi-doctor operating modes without workflow forks.
2. Works in single-branch and multi-branch environments with RBAC-scoped access.
3. New and follow-up consultations complete end-to-end with coded diagnosis.
4. Chronic care workflow supports care-gap prompting and trend review.
5. Critical result workflow closes with acknowledgment and action note.
6. Discharge summary hard-stops for missing mandatory sections.
7. Cross-cover handoff workflow works for doctor unavailability.
8. Branch governance supports central templates with local overrides.
9. All safety overrides and break-glass actions are auditable.
10. KPI dashboards populate from transactional data correctly.

---

## 18) IMPLEMENTATION PHASING

### Phase 1 (MVP)
- New consult + follow-up templates
- Core order sets (fever, HTN, diabetes)
- Basic chronic registry prompts
- Single/multi-doctor queue support

### Phase 2
- Full IPD and discharge enhancement
- Expanded order sets and protocol analytics
- Multi-branch governance dashboards

### Phase 3
- Advanced risk stratification and proactive recall workflows
- Outcome benchmarking across branches

---

## 19) APPENDIX

### 19.1 Suggested File Naming Alignment
- This file: `specialty-overlays/general-medicine-overlay-spec.md`
- Optional companion full PRD: `core-platform/2.1-general-medicine-prd.md`

### 19.2 Change Log
| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | June 10, 2026 | Product Team | Initial full GenMed specialty PRD |

---

**Owner:** Clinical Product + Internal Medicine SME Panel  
**Validation Stakeholders:** GenMed HOD, Nursing Lead, Quality Lead, Operations Manager  
**Status:** Draft ready for review