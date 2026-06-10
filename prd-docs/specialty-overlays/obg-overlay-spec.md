# Specialty Overlay Spec: Obstetrics & Gynecology (OBG)
## Configuration Pack for the Common Core Platform

**Document Version:** 1.0  
**Last Updated:** June 10, 2026  
**Specialty Tier:** Tier 1 (#2)  
**Priority:** Launch Essential (MVP)

**Related Documents:**
- [common-services-workflows.md](common-services-workflows.md) — Core platform services
- [specialty-priority-list.md](specialty-priority-list.md) — Prioritization reference

---

## 📋 Document Purpose

This spec defines **only** what is unique to OBG on top of the common core. It does NOT redefine registration, scheduling, billing, or orders — those come from the core platform. This document is the engineering and clinical configuration guide for the OBG module.

---

## 🏥 Specialty Overview

| Attribute | Value |
|-----------|-------|
| **Sub-specialties covered** | Obstetrics, Gynecology, High-Risk Pregnancy, Fetal Medicine |
| **Care settings** | OPD, IPD (Labor ward, Post-natal ward), OT, Daycare |
| **Key patient types** | Pregnant women (ANC → delivery → PNC), gynec patients (all ages) |
| **Revenue drivers** | Maternity packages, normal/C-section deliveries, gynec surgeries |
| **Regulatory** | MTP Act documentation, PCPNDT compliance, birth registration |

---

## 1️⃣ NOTE TEMPLATES

### 1.1 Antenatal Care (ANC) Registration Note

**Trigger:** First OPD visit of a pregnant patient

| Section | Fields | Data Type | Required | Notes |
|---------|--------|-----------|----------|-------|
| **Menstrual History** | LMP (Last Menstrual Period) | Date | Yes | Auto-calculates EDD |
| | EDD (Expected Date of Delivery) | Date (calculated) | Yes | LMP + 280 days (Naegele's rule) |
| | Cycle regularity | Dropdown (Regular/Irregular) | Yes | |
| | Cycle length (days) | Number | No | Default 28 |
| **Obstetric History** | Gravida | Number | Yes | Total pregnancies |
| | Para | Number | Yes | Deliveries > 20 weeks |
| | Abortion | Number | Yes | Spontaneous + induced |
| | Living | Number | Yes | Living children |
| | Ectopic | Number | No | |
| | Previous delivery details | Repeating group | No | Year, type (NVD/LSCS/instrumental), place, birth weight, complications |
| **Current Pregnancy** | Gestational age (weeks+days) | Calculated | Yes | From LMP or dating scan |
| | High-risk factors | Multi-select checklist | No | See High-Risk Checklist below |
| | Booking weight | Number (kg) | Yes | |
| | Booking BP | Systolic/Diastolic | Yes | |
| | Booking hemoglobin | Number (g/dL) | Yes | |
| **Medical History** | Known medical conditions | Multi-select + free text | No | DM, HTN, thyroid, cardiac, etc. |
| | Surgical history | Free text | No | |
| | Drug allergies | Linked to core allergy module | Yes | |
| | Current medications | Linked to core med list | No | |
| **Family History** | Relevant conditions | Free text | No | Twins, congenital anomalies, DM, HTN |
| **Social History** | Occupation | Text | No | |
| | Smoking/alcohol/substance | Dropdown | No | |

**High-Risk Checklist (Multi-select):**
- [ ] Age < 18 or > 35
- [ ] Grand multipara (≥ 5)
- [ ] Previous cesarean section
- [ ] Previous stillbirth / neonatal death
- [ ] Previous preterm delivery
- [ ] Previous low birth weight
- [ ] Rh negative
- [ ] Multiple gestation
- [ ] Pre-existing diabetes
- [ ] Pre-existing hypertension
- [ ] Thyroid disorder
- [ ] Cardiac disease
- [ ] Renal disease
- [ ] Anemia (Hb < 7)
- [ ] BMI > 30 or < 18
- [ ] Bad obstetric history (BOH)
- [ ] Consanguineous marriage

**Auto-actions on save:**
- Create pregnancy episode (linked to patient record)
- Schedule ANC visit series based on gestational age
- Flag high-risk if any checklist item selected
- Add to ANC register

---

### 1.2 ANC Follow-up Visit Note

**Trigger:** Subsequent ANC visits (typically 4-8+ visits per pregnancy)

| Section | Fields | Data Type | Notes |
|---------|--------|-----------|-------|
| **Visit Info** | Visit number | Auto (1, 2, 3...) | |
| | Gestational age | Calculated from LMP | |
| | Weeks since last visit | Calculated | |
| **Vitals** | Weight | Number (kg) | Graph weight gain |
| | BP | Systolic/Diastolic | Alert if > 140/90 |
| | Pulse | Number | |
| | Urine albumin | Dropdown (Nil/Trace/+/++/+++) | |
| | Urine sugar | Dropdown (Nil/Trace/+/++/+++) | |
| **Obstetric Examination** | Fundal height (weeks) | Number | |
| | Presentation | Dropdown (Cephalic/Breech/Transverse/Unstable) | |
| | Lie | Dropdown (Longitudinal/Oblique/Transverse) | |
| | Engagement | Dropdown (Not engaged/1/5 to 5/5) | |
| | Fetal heart rate | Number (bpm) | Normal 120-160 |
| | Fetal movements | Dropdown (Present/Absent/Reduced) | |
| | Liquor | Dropdown (Adequate/Reduced/Increased) | |
| | Edema | Dropdown (Nil/Pedal/Generalized) | |
| **Investigations** | Link to lab orders | Core orders module | |
| | Link to scan reports | Core radiology module | USG dating, NT, anomaly, growth |
| **Assessment** | Risk status | Dropdown (Low/High) | |
| | Complications noted | Multi-select | PIH, GDM, IUGR, preterm labor, etc. |
| **Plan** | Advice | Template text + free text | Diet, iron, calcium, rest |
| | Next visit date | Date picker | Auto-schedule |
| | Referral | Core referral module | High-risk → fetal medicine / tertiary |

**ANC Visit Schedule (India — per MoHFW guidelines):**
| Trimester | Recommended Visits |
|-----------|-------------------|
| 1st (up to 12 weeks) | 1 visit (registration + booking) |
| 2nd (13-28 weeks) | 2 visits (around 20 & 26 weeks) |
| 3rd (29-40 weeks) | 4+ visits (monthly till 36w, then weekly) |

---

### 1.3 Labor Admission Note

**Trigger:** Admission to labor ward

| Section | Fields |
|---------|--------|
| **Admission details** | Date/time, referred from, mode of transport |
| **Chief complaints** | Labor pains, leaking PV, bleeding PV, reduced fetal movements, etc. |
| **Current pregnancy summary** | Auto-pulled from ANC record |
| **General examination** | Vitals, pallor, edema, built |
| **Abdominal examination** | Fundal height, lie, presentation, engagement, contractions (frequency, duration), FHR |
| **Per vaginal examination** | Cervical dilatation (cm), effacement (%), station, membranes (intact/ruptured), liquor color, presenting part |
| **Bishop score** | Calculated from PV findings |
| **Initial assessment** | Stage of labor, risk categorization |
| **Plan** | Admit, monitor, induce, ARM, prepare for LSCS, etc. |

---

### 1.4 Partograph (WHO Standard)

**Purpose:** Graphical record of labor progress — the most critical OBG-specific flowsheet

**Components:**

#### A. Patient Information Header
- Name, age, UHID, gravida/para, EDD, gestational age, date/time of admission, membrane rupture time

#### B. Fetal Condition (recorded every 30 min)
| Parameter | Recording Method |
|-----------|------------------|
| Fetal heart rate | Number, plotted on graph (normal band 120-160 shaded) |
| Liquor color | Code: C (clear), M (meconium), B (blood), A (absent) |
| Moulding | Code: 0 (none), + (sutures apposed), ++ (overlapping reducible), +++ (overlapping irreducible) |

#### C. Labor Progress (recorded every 4 hours or per PV exam)
| Parameter | Recording Method |
|-----------|------------------|
| Cervical dilatation | Number (0-10 cm), plotted on graph |
| Alert line | Pre-drawn diagonal (1 cm/hour from 4 cm) |
| Action line | Pre-drawn diagonal (4 hours to right of alert line) |
| Descent | Fifths of head palpable abdominally (5/5 to 0/5), plotted |

#### D. Contractions (recorded every 30 min)
| Duration | Recording |
|----------|-----------|
| < 20 sec | Dots |
| 20-40 sec | Diagonal lines |
| > 40 sec | Solid shading |
| Frequency | Number per 10 minutes (1-5) |

#### E. Oxytocin & Drugs
| Parameter | Recording |
|-----------|-----------|
| Oxytocin (if used) | Concentration, drops/min, time started |
| Other drugs | Name, dose, time |

#### F. Maternal Condition (recorded every 30 min to 2 hours)
| Parameter | Frequency |
|-----------|-----------|
| Pulse | Every 30 min |
| BP | Every 2 hours (hourly if high-risk) |
| Temperature | Every 4 hours |
| Urine output | Volume, protein, acetone |

**Alerts (auto-triggered):**
- FHR < 110 or > 160 for > 10 min → Fetal distress alert
- Cervical dilatation crosses alert line → Call senior
- Cervical dilatation crosses action line → Immediate intervention required
- BP > 140/90 → Pre-eclampsia alert
- Meconium-stained liquor → Alert

**Digital Implementation:**
- Touch/click entry on tablet at bedside
- Real-time graph rendering
- Color-coded alerts
- Auto-print for MRD

---

### 1.5 Delivery Note

**Trigger:** Post-delivery documentation

| Section | Fields |
|---------|--------|
| **Delivery details** | Date, time, place (labor room/OT), conducted by |
| **Mode of delivery** | NVD / Instrumental (forceps/vacuum) / LSCS |
| | If LSCS: indication, type (elective/emergency), incision |
| **Baby details** | Sex, birth weight, APGAR 1 min, APGAR 5 min, resuscitation needed, cry at birth |
| | Congenital anomalies (if any) |
| **Placenta** | Delivery mode (spontaneous/manual), complete (yes/no), weight |
| **Third stage** | Blood loss (estimated), oxytocin given, cord clamping time |
| **Perineum** | Intact / Episiotomy (type) / Tear (degree 1-4), repair done |
| **Maternal condition** | Post-delivery vitals, uterus contracted, bladder emptied |
| **Newborn handover** | Baby handed to mother / shifted to NICU, breastfeeding initiated |

**Auto-actions:**
- Create newborn patient record (linked to mother)
- Trigger birth registration workflow
- Schedule post-natal visits
- Add to delivery register

---

### 1.6 LSCS (Cesarean Section) OT Note

**Trigger:** Cesarean delivery

| Section | Fields |
|---------|--------|
| **Pre-op** | Indication for LSCS (list of standard indications), consent taken, PAC clearance |
| **Anesthesia** | Type (spinal/epidural/GA), anesthetist name |
| **Surgical details** | Incision (Pfannenstiel/midline), uterine incision (lower segment transverse/classical) |
| | Findings (adhesions, fibroid, etc.) |
| | Baby extraction (time from incision to delivery) |
| | Placenta (manual removal/spontaneous) |
| | Tubes (visualized/ligated if requested) |
| | Hemostasis, closure layers, estimated blood loss |
| | Complications (if any) |
| **Post-op orders** | IV fluids, antibiotics, analgesics, DVT prophylaxis, catheter care, diet progression |

---

### 1.7 Post-Natal Note (PNC)

**Trigger:** Post-delivery ward rounds (day 1, 2, 3...) and follow-up visits

| Section | Fields |
|---------|--------|
| **Mother** | General condition, vitals, pallor, breast (engorgement, nipple condition) |
| | Abdomen (uterine involution, wound if LSCS) |
| | Lochia (type, amount, odor) |
| | Perineum (wound healing if episiotomy) |
| | Voiding, bowels |
| | Breastfeeding (established/problems) |
| **Baby** | Weight, feeding, jaundice (Kramer zone), umbilical stump, passed urine/meconium |
| **Advice** | Breastfeeding, hygiene, contraception counseling, immunization, danger signs |
| **Discharge** | Criteria met, discharge summary, follow-up date |

---

### 1.8 Gynecology OPD Note

**Trigger:** Non-pregnant gynec patient visit

| Section | Fields |
|---------|--------|
| **Chief complaint** | Menstrual irregularity, white discharge, pain, infertility, post-menopausal bleeding, mass, etc. |
| **Menstrual history** | LMP, cycle length, duration, flow (scanty/normal/heavy), dysmenorrhea, intermenstrual bleeding |
| **Obstetric history** | G/P/A/L (if applicable) |
| **Sexual & contraceptive history** | Active, contraception used, dyspareunia |
| **General examination** | Vitals, BMI, thyroid, breast exam |
| **Abdominal examination** | Tenderness, mass, organomegaly |
| **Per speculum** | Cervix (healthy/erosion/growth/discharge), vagina |
| **Per vaginal (bimanual)** | Uterus (size, position, mobility), adnexa (mass, tenderness), fornices |
| **Provisional diagnosis** | ICD-10 linked |
| **Plan** | Investigations, treatment, surgery, referral |

---

### 1.9 Gynec Procedure Notes

**Templates for common procedures:**

| Procedure | Key Documentation Points |
|-----------|-------------------------|
| **D&C / Suction evacuation** | Indication (incomplete abortion, MTP, diagnostic), cervical dilatation, products obtained, completeness, blood loss |
| **Hysteroscopy** | Indication, findings (cavity, endometrium, polyp, fibroid, septum), procedure done (polypectomy, septum resection, biopsy) |
| **Laparoscopy (diagnostic/operative)** | Indication, port placement, findings (uterus, tubes, ovaries, cul-de-sac), procedure (cystectomy, adhesiolysis, tubal patency) |
| **Hysterectomy** | Indication, type (TAH/TLH/VH/LAVH), adnexa removed, findings, complications, blood loss |
| **MTP (Medical Termination of Pregnancy)** | Indication (as per MTP Act), gestational age, method (medical/surgical), consent (including spouse if applicable), completion confirmed |

---

## 2️⃣ FLOWSHEETS

### 2.1 Partograph
See section 1.4 above — primary OBG flowsheet.

### 2.2 Post-op Monitoring Sheet (LSCS / Gynec Surgery)

| Time | Parameter | Normal Range |
|------|-----------|--------------|
| Every 15 min x 4 | Pulse, BP, SpO2 | Per anesthesia protocol |
| Every 30 min x 4 | Above + consciousness, pain score | |
| Every 1 hour x 4 | Above + urine output, bleeding PV/wound | |
| Every 4 hours | Above + temperature, drain output | |

### 2.3 Newborn Monitoring Sheet (Labor Room / Post-natal Ward)

| Parameter | Frequency |
|-----------|-----------|
| Temperature | Every 4 hours |
| Feeding (breast/formula/both) | Every feed |
| Weight | Daily |
| Jaundice (Kramer zone) | Every 12 hours |
| Urine/stool | Every episode |
| Umbilical stump | Daily |

---

## 3️⃣ ORDER SETS

### 3.1 ANC Booking Investigations

| Order | Timing |
|-------|--------|
| Hemoglobin | Booking |
| Blood group & Rh | Booking |
| VDRL | Booking |
| HIV (with consent) | Booking |
| HBsAg | Booking |
| Urine routine | Booking |
| Random blood sugar | Booking |
| TSH | Booking (if history) |
| USG dating (if dates uncertain) | Booking |

### 3.2 ANC Trimester-wise Investigations

| Trimester | Tests |
|-----------|-------|
| **1st (11-14 weeks)** | NT scan + dual marker (PAPP-A, free β-hCG) |
| **2nd (18-22 weeks)** | Anomaly scan (TIFFA) |
| **2nd (24-28 weeks)** | OGTT (75g) for GDM screening, Hb |
| **3rd (32-34 weeks)** | Growth scan, Hb, repeat HIV/VDRL (high-risk) |
| **3rd (36+ weeks)** | NST (non-stress test) weekly if high-risk |

### 3.3 Labor Admission Orders

| Order |
|-------|
| NPO / clear liquids only |
| IV access, start RL |
| FHR monitoring continuous / intermittent |
| Vitals every 30 min |
| PV exam as per partograph protocol |
| Inform pediatrician / NICU |
| Blood grouping & cross-match (if not done / high-risk) |
| Keep consent ready (LSCS, blood transfusion) |

### 3.4 Post-LSCS Orders

| Order |
|-------|
| NPO x 6 hours, then sips, then liquid diet, then soft diet |
| IV fluids: RL / DNS as per weight |
| Antibiotics: Cefuroxime 1.5g IV BD x 3 doses |
| Analgesics: Paracetamol 1g IV TDS, Diclofenac 75mg IM SOS |
| DVT prophylaxis: Enoxaparin 40mg SC OD (if indicated) |
| Catheter: Remove after 12-24 hours |
| Wound care: Dressing on day 2 |
| Ambulation: Encourage after 12 hours |
| Breastfeeding: Initiate within 1 hour |
| Vitals: Every 4 hours |
| Hb check: Day 1 post-op |

### 3.5 Gynec Pre-op Orders (Hysterectomy Example)

| Order |
|-------|
| Pre-op investigations (CBC, RFT, LFT, coagulation, ECG, CXR) |
| Blood grouping & cross-match, arrange 2 units PRBC |
| Bowel preparation (if indicated) |
| NPO from midnight |
| PAC clearance |
| DVT risk assessment |
| Consent: procedure, blood transfusion, conversion to open (if laparoscopic) |
| Antibiotics: Cefuroxime 1.5g IV at induction |

---

## 4️⃣ SCORES & CALCULATORS

### 4.1 Bishop Score (Labor Induction Readiness)

| Parameter | 0 | 1 | 2 | 3 |
|-----------|---|---|---|---|
| Cervical dilatation (cm) | Closed | 1-2 | 3-4 | ≥ 5 |
| Cervical effacement (%) | 0-30 | 40-50 | 60-70 | ≥ 80 |
| Cervical consistency | Firm | Medium | Soft | — |
| Cervical position | Posterior | Mid | Anterior | — |
| Fetal station | -3 | -2 | -1, 0 | +1, +2 |

**Interpretation:**
- Score ≥ 8: Favorable for induction
- Score < 6: Cervical ripening recommended before induction

### 4.2 APGAR Score (Newborn)

| Parameter | 0 | 1 | 2 |
|-----------|---|---|---|
| **A**ppearance (color) | Blue/pale all over | Pink body, blue extremities | Pink all over |
| **P**ulse (heart rate) | Absent | < 100 bpm | ≥ 100 bpm |
| **G**rimace (reflex) | No response | Grimace | Cry/cough/sneeze |
| **A**ctivity (muscle tone) | Limp | Some flexion | Active movement |
| **R**espiration | Absent | Slow/irregular | Good cry |

**Timing:** 1 minute & 5 minutes after birth (10 min if score < 7 at 5 min)

**Interpretation:**
- 7-10: Normal
- 4-6: Moderately depressed, needs intervention
- 0-3: Severely depressed, needs resuscitation

### 4.3 Gestational Age Calculator

**Input:** LMP date OR Dating scan CRL
**Output:** 
- Gestational age (weeks + days)
- EDD (Expected Date of Delivery)
- Trimester

**Formula (Naegele's rule):** EDD = LMP + 280 days (adjusted for cycle length if ≠ 28 days)

### 4.4 BMI & Weight Gain Calculator

**Inputs:** Pre-pregnancy weight, height, current weight, gestational age
**Outputs:**
- Pre-pregnancy BMI
- Category (underweight/normal/overweight/obese)
- Recommended total weight gain range (IOM guidelines)
- Current weight gain
- On track / above / below recommendation

| Pre-pregnancy BMI | Recommended Total Gain (singleton) |
|-------------------|-----------------------------------|
| < 18.5 | 12.5-18 kg |
| 18.5-24.9 | 11.5-16 kg |
| 25-29.9 | 7-11.5 kg |
| ≥ 30 | 5-9 kg |

### 4.5 EBL (Estimated Blood Loss) Calculator

**For delivery:** Visual estimation + clot size + soaked pads
**For PPH staging:**
- < 500 mL (NVD) / < 1000 mL (LSCS): Normal
- 500-1000 mL: Minor PPH
- > 1000 mL: Major PPH → trigger massive transfusion protocol alert

---

## 5️⃣ BODY DIAGRAMS & VISUAL CHARTING

### 5.1 Fetal Lie & Presentation Diagram
- Uterus outline with fetal position marking
- Head/breech/transverse options
- Click to mark presenting part

### 5.2 Perineal Tear Diagram
- Perineum anatomy
- Mark tear location and degree (1-4)
- Episiotomy type (mediolateral L/R, midline)

### 5.3 Pelvic Examination Diagram
- Uterus with size marking (weeks)
- Adnexal mass marking (size, side)
- Cervical findings

### 5.4 Fetal Growth Chart
- Plot EFW (estimated fetal weight) on percentile chart
- Indicate IUGR (< 10th percentile) or macrosomia (> 90th)

---

## 6️⃣ EQUIPMENT INTERFACES

| Equipment | Interface Standard | Data Captured |
|-----------|-------------------|---------------|
| **Fetal Doppler** | Manual entry or Bluetooth | FHR |
| **CTG / NST machine** | RS-232 / USB / HL7 | FHR tracing, uterine contractions, interpretation |
| **Ultrasound (OBG)** | DICOM | Dating scan, NT scan, anomaly scan, growth scan images & reports |
| **Fetal monitor (intrapartum)** | Bedside interface | Continuous FHR, contractions → auto-populate partograph |

---

## 7️⃣ PACKAGE DEFINITIONS

### 7.1 Normal Vaginal Delivery Package

| Component | Inclusions |
|-----------|------------|
| **Room charges** | Labor room + post-natal ward (2 nights mother, 2 nights baby) |
| **Doctor fees** | OBG consultant, pediatrician (newborn exam) |
| **Nursing care** | Labor monitoring, post-natal care |
| **Procedures** | Delivery conducting charges, episiotomy (if done) |
| **Consumables** | Delivery kit, IV fluids, routine meds |
| **Investigations** | Hb post-delivery, baby: blood group (if Rh- mother) |
| **Exclusions** | ICU, NICU, blood transfusion, epidural, instrumental delivery |

### 7.2 Cesarean Section Package

| Component | Inclusions |
|-----------|------------|
| **Room charges** | OT + post-natal ward (3 nights mother, 3 nights baby) |
| **Doctor fees** | OBG surgeon, assistant, anesthetist, pediatrician |
| **OT charges** | OT usage, equipment |
| **Procedures** | LSCS, anesthesia (spinal/epidural) |
| **Consumables** | OT kit, sutures, IV fluids, antibiotics x 3 days, analgesics |
| **Investigations** | Pre-op panel, Hb post-op, baby blood group |
| **Exclusions** | ICU, NICU, blood transfusion, GA (if needed), complications |

### 7.3 Maternity Package (Comprehensive ANC to Delivery)

| Component | Inclusions |
|-----------|------------|
| **ANC visits** | 8 visits (doctor consultation) |
| **Investigations** | Booking panel, OGTT, Hb x 3, NT scan, anomaly scan, growth scan x 2, NST x 2 |
| **Delivery** | Normal delivery OR LSCS (single price or differential) |
| **Post-natal** | 2 PNC visits |
| **Exclusions** | High-risk add-ons, NICU, complications |

### 7.4 Gynec Daycare Package (D&C / Hysteroscopy)

| Component | Inclusions |
|-----------|------------|
| **Daycare charges** | 6-8 hour stay |
| **Doctor fees** | Surgeon, anesthetist |
| **Procedure** | D&C or diagnostic hysteroscopy |
| **Anesthesia** | Short GA / sedation |
| **Consumables** | Procedure kit, IV, meds |
| **Exclusions** | Biopsy processing, operative hysteroscopy, conversion to laparoscopy |

---

## 8️⃣ SPECIALTY WORKFLOWS (Beyond Core)

### 8.1 ANC Tracking Workflow

```
Patient registration → Pregnancy episode created → ANC booking note →
EDD calculated → Visit schedule auto-generated →
[Loop: ANC visit note → Investigations → Next visit] →
High-risk flagging (if criteria met) → Referral to fetal medicine (if needed) →
Term reached → Labor admission →
Delivery → Delivery note + Baby record created →
Post-natal visits → Episode closed
```

### 8.2 Labor & Delivery Workflow

```
Labor admission → Admission note → Partograph started →
[Monitoring loop: Vitals, FHR, contractions, PV exams] →
Progress assessment → 
  → Normal progress: Continue monitoring → Delivery
  → Slow progress / complication: Intervention (ARM, oxytocin, LSCS decision)
Delivery → APGAR → Placenta delivery → Third stage management →
Delivery note → Baby handed to mother OR NICU →
Post-delivery monitoring → Transfer to ward
```

### 8.3 High-Risk Pregnancy Workflow

```
High-risk identified (any ANC visit) → Flag in record →
Auto-schedule more frequent visits →
Fetal medicine / MFM referral (if needed) →
Additional monitoring (NST, Doppler, growth scans) →
Delivery planning (mode, place, timing) →
Pediatrician / NICU alert before delivery →
Delivery with high-risk protocol → Close monitoring
```

### 8.4 MTP (Medical Termination) Workflow

```
Patient request → Counseling → Eligibility check (MTP Act) →
Gestational age confirmation (USG) →
  → ≤ 9 weeks: Medical MTP option
  → 9-20 weeks: Surgical MTP
  → > 20 weeks: Medical board approval needed
Consent (patient + spouse if married) →
Pre-procedure investigations →
Procedure → Completion confirmed (USG / clinical) →
Contraception counseling → Follow-up visit
```

### 8.5 PCPNDT Compliance Workflow (Mandatory in India)

```
USG scan ordered (any OBG scan) →
Form F auto-generated with scan details →
Sonologist declaration (no sex determination) →
Form F stored in PCPNDT register →
Monthly PCPNDT report generation →
Audit trail maintained
```

---

## 9️⃣ SPECIALTY MASTERS & REFERENCE DATA

### 9.1 Diagnosis Master (OBG-specific ICD-10)

| Category | Common Codes |
|----------|--------------|
| **Pregnancy** | O00-O08 (ectopic, abortion), O10-O16 (HTN), O20-O29 (complications), O30-O48 (fetal/amniotic), O60-O75 (labor/delivery), O80-O84 (delivery), O85-O92 (puerperium), Z34 (normal pregnancy supervision) |
| **Gynecology** | N80-N98 (female genital disorders), D25 (fibroid), N84 (polyp), N92 (menstrual disorders), N94 (dysmenorrhea, PMS), N95 (menopausal), N97 (infertility), C53-C56 (gynec cancers) |

### 9.2 Procedure Master

| Category | Procedures |
|----------|------------|
| **Obstetric** | Normal delivery, forceps, vacuum, LSCS (emergency/elective), episiotomy repair, tear repair, manual placenta removal, PPH management, cervical cerclage |
| **Gynecologic** | D&C, MTP (surgical/medical), hysteroscopy (diagnostic/operative), laparoscopy (diagnostic/operative), hysterectomy (TAH/TLH/VH/LAVH), myomectomy, cystectomy, colposcopy, LEEP, Pap smear |

### 9.3 Drug Formulary (OBG-specific)

| Category | Drugs |
|----------|-------|
| **ANC supplements** | Iron + folic acid, calcium, Vitamin D |
| **Tocolytics** | Nifedipine, Isoxsuprine, Atosiban |
| **Uterotonics** | Oxytocin, Methylergometrine, Misoprostol, Carboprost |
| **Cervical ripening** | Dinoprostone (PGE2), Misoprostol |
| **MTP drugs** | Mifepristone, Misoprostol |
| **Antibiotics (OBG)** | Cefuroxime, Metronidazole, Azithromycin |
| **Anti-D** | Anti-D immunoglobulin (Rh- mothers) |
| **Steroids (lung maturity)** | Betamethasone, Dexamethasone |
| **Magnesium sulfate** | Eclampsia prophylaxis/treatment |

---

## 🔟 REGISTERS & REPORTS (Regulatory)

### 10.1 Mandatory Registers

| Register | Purpose | Regulatory Body |
|----------|---------|-----------------|
| ANC register | All registered pregnancies | MoHFW (RCH program) |
| Delivery register | All deliveries (NVD/LSCS/instrumental) | MoHFW |
| MTP register | All MTPs performed | MTP Act compliance |
| PCPNDT register (Form F) | All USG scans | PCPNDT Act compliance |
| Birth register | All live births | Municipal / Panchayat |
| Stillbirth register | All stillbirths | Municipal / Panchayat |
| Maternal death register | All maternal deaths | MDSR (Maternal Death Surveillance) |
| Blood transfusion register | All transfusions | Blood bank regulations |

### 10.2 Statutory Reports

| Report | Frequency | Submitted To |
|--------|-----------|--------------|
| Monthly delivery report | Monthly | District health officer |
| PCPNDT quarterly report | Quarterly | Appropriate authority |
| Maternal death report | Within 24 hours | CMO / MDSR committee |
| HMIS data (RCH portal) | Monthly | NHM portal |
| Birth/death certificates | Per event | Registrar of Births & Deaths |

---

## 1️⃣1️⃣ USER ROLES & PERMISSIONS (OBG-specific)

| Role | Permissions |
|------|-------------|
| **OBG Consultant** | All OBG notes, orders, delivery, surgery |
| **OBG Resident** | Notes (with co-sign), basic orders, assist surgery |
| **Labor Room Nurse** | Partograph entry, vitals, basic delivery assist documentation |
| **Post-natal Nurse** | PNC notes, baby vitals, feeding records |
| **Sonologist** | USG reports, PCPNDT Form F |
| **OBG Front Desk** | ANC scheduling, package billing |

---

## 1️⃣2️⃣ INTEGRATION POINTS (Beyond Core)

| External System | Integration |
|-----------------|-------------|
| **USG machines** | DICOM import of OBG scans |
| **CTG/NST machines** | Real-time FHR tracing import |
| **Fetal Doppler** | FHR capture (if digital) |
| **PCPNDT portal** | Auto-upload of Form F data (state-specific) |
| **RCH (ANMOL/RCH) portal** | ANC & delivery data upload for NHM |
| **Birth registration portal** | Digital birth certificate generation |

---

## ✅ Acceptance Criteria for OBG Module

| # | Criteria |
|---|----------|
| 1 | ANC registration creates pregnancy episode with EDD auto-calculated |
| 2 | ANC visits auto-scheduled per gestational age |
| 3 | High-risk flagging works based on checklist |
| 4 | Partograph can be filled digitally with real-time graph |
| 5 | Partograph alerts fire when crossing alert/action lines |
| 6 | Delivery note auto-creates newborn patient record linked to mother |
| 7 | APGAR, Bishop scores calculate correctly |
| 8 | Birth registration workflow generates certificate |
| 9 | PCPNDT Form F auto-generated for every OBG USG |
| 10 | Maternity package billing works end-to-end |
| 11 | All mandatory registers can be printed / exported |
| 12 | HMIS / RCH data export works |

---

**Document Owner:** Product Management (Clinical Lead: OBG SME)  
**Engineering Lead:** [TBD]  
**Clinical Validation:** OBG Advisory Board  
**Review Cycle:** Bi-weekly during development
