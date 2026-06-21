import { db } from "./index";
import * as s from "./schema";

export async function seedLoincData() {
  console.log("  Seeding LOINC codes for common Indian lab tests...");

  const codes = [
    // ── CBC (Complete Blood Count) ──────────────────────────────────────
    { loincNum: "58410-2", component: "CBC Auto", property: "?", system: "Bld", shortName: "CBC Auto", longCommonName: "Complete blood count (hemogram) automated", classType: "HEM" },
    { loincNum: "789-8", component: "Erythrocytes [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "RBC", longCommonName: "Erythrocyte count", classType: "HEM" },
    { loincNum: "718-7", component: "Hemoglobin [Mass/volume] in Blood", property: "MCnc", system: "Bld", shortName: "Hb", longCommonName: "Hemoglobin", classType: "HEM" },
    { loincNum: "4544-3", component: "Hematocrit [Volume fraction] of Blood", property: "VFr", system: "Bld", shortName: "Hct", longCommonName: "Hematocrit", classType: "HEM" },
    { loincNum: "30428-5", component: "MCV [Entitic volume] in RBC", property: "EntVol", system: "RBC", shortName: "MCV", longCommonName: "Mean corpuscular volume", classType: "HEM" },
    { loincNum: "28539-5", component: "MCH [Entitic mass] in RBC", property: "EntMass", system: "RBC", shortName: "MCH", longCommonName: "Mean corpuscular hemoglobin", classType: "HEM" },
    { loincNum: "28540-3", component: "MCHC [Mass/volume] in RBC", property: "MCnc", system: "RBC", shortName: "MCHC", longCommonName: "Mean corpuscular hemoglobin concentration", classType: "HEM" },
    { loincNum: "30451-7", component: "RBC distribution width [Entitic volume]", property: "EntVol", system: "RBC", shortName: "RDW", longCommonName: "Red cell distribution width", classType: "HEM" },
    { loincNum: "6690-2", component: "Leukocytes [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "WBC", longCommonName: "Leukocyte (white cell) count", classType: "HEM" },
    { loincNum: "777-3", component: "Platelets [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "Plt", longCommonName: "Platelet count", classType: "HEM" },
    { loincNum: "714-6", component: "Neutrophils/100 leukocytes in Blood", property: "NFr", system: "Bld", shortName: "Neutrophils %", longCommonName: "Neutrophil percentage", classType: "HEM" },
    { loincNum: "736-9", component: "Lymphocytes/100 leukocytes in Blood", property: "NFr", system: "Bld", shortName: "Lymphocytes %", longCommonName: "Lymphocyte percentage", classType: "HEM" },
    { loincNum: "5905-5", component: "Monocytes/100 leukocytes in Blood", property: "NFr", system: "Bld", shortName: "Monocytes %", longCommonName: "Monocyte percentage", classType: "HEM" },
    { loincNum: "713-8", component: "Eosinophils/100 leukocytes in Blood", property: "NFr", system: "Bld", shortName: "Eosinophils %", longCommonName: "Eosinophil percentage", classType: "HEM" },
    { loincNum: "27019-4", component: "Basophils/100 leukocytes in Blood", property: "NFr", system: "Bld", shortName: "Basophils %", longCommonName: "Basophil percentage", classType: "HEM" },
    { loincNum: "26464-8", component: "Neutrophils [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "Neutrophils Abs", longCommonName: "Neutrophil absolute count", classType: "HEM" },
    { loincNum: "26474-7", component: "Lymphocytes [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "Lymphocytes Abs", longCommonName: "Lymphocyte absolute count", classType: "HEM" },
    { loincNum: "26485-3", component: "Monocytes [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "Monocytes Abs", longCommonName: "Monocyte absolute count", classType: "HEM" },
    { loincNum: "26449-9", component: "Eosinophils [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "Eosinophils Abs", longCommonName: "Eosinophil absolute count", classType: "HEM" },
    { loincNum: "26444-0", component: "Basophils [#/volume] in Blood", property: "NCnc", system: "Bld", shortName: "Basophils Abs", longCommonName: "Basophil absolute count", classType: "HEM" },

    // ── LFT (Liver Function Test) ────────────────────────────────────────
    { loincNum: "1742-6", component: "ALT in Serum", property: "CCnc", system: "Ser", shortName: "ALT", longCommonName: "Alanine aminotransferase (SGPT)", classType: "CHEM" },
    { loincNum: "1920-8", component: "AST in Serum", property: "CCnc", system: "Ser", shortName: "AST", longCommonName: "Aspartate aminotransferase (SGOT)", classType: "CHEM" },
    { loincNum: "6768-6", component: "ALP in Serum", property: "CCnc", system: "Ser", shortName: "ALP", longCommonName: "Alkaline phosphatase", classType: "CHEM" },
    { loincNum: "1975-2", component: "Bilirubin.total in Serum", property: "MCnc", system: "Ser", shortName: "Bilirubin Total", longCommonName: "Bilirubin total", classType: "CHEM" },
    { loincNum: "14631-0", component: "Bilirubin.direct in Serum", property: "MCnc", system: "Ser", shortName: "Bilirubin Direct", longCommonName: "Bilirubin direct (conjugated)", classType: "CHEM" },
    { loincNum: "1968-7", component: "Bilirubin.indirect in Serum", property: "MCnc", system: "Ser", shortName: "Bilirubin Indirect", longCommonName: "Bilirubin indirect (unconjugated)", classType: "CHEM" },
    { loincNum: "2885-2", component: "Protein.total in Serum", property: "MCnc", system: "Ser", shortName: "Total Protein", longCommonName: "Protein total (serum)", classType: "CHEM" },
    { loincNum: "1751-7", component: "Albumin in Serum", property: "MCnc", system: "Ser", shortName: "Albumin", longCommonName: "Albumin", classType: "CHEM" },
    { loincNum: "10834-0", component: "Globulin in Serum", property: "MCnc", system: "Ser", shortName: "Globulin", longCommonName: "Globulin", classType: "CHEM" },
    { loincNum: "1753-3", component: "Albumin/Globulin [Ratio] in Serum", property: "Rto", system: "Ser", shortName: "A/G Ratio", longCommonName: "Albumin/Globulin ratio", classType: "CHEM" },
    { loincNum: "2324-2", component: "Gamma glutamyl transferase in Serum", property: "CCnc", system: "Ser", shortName: "GGT", longCommonName: "Gamma-glutamyl transferase (GGT)", classType: "CHEM" },
    { loincNum: "14959-6", component: "Microalbumin/Creatinine [Ratio] in Urine", property: "Rto", system: "Urine", shortName: "ACR", longCommonName: "Albumin/Creatinine ratio (ACR)", classType: "URINE" },

    // ── KFT (Kidney Function Test) ──────────────────────────────────────
    { loincNum: "2160-0", component: "Creatinine in Serum", property: "MCnc", system: "Ser", shortName: "Creatinine", longCommonName: "Creatinine", classType: "CHEM" },
    { loincNum: "3094-0", component: "BUN in Serum", property: "MCnc", system: "Ser", shortName: "BUN", longCommonName: "Blood urea nitrogen (BUN)", classType: "CHEM" },
    { loincNum: "6299-2", component: "Urea in Serum", property: "MCnc", system: "Ser", shortName: "Urea", longCommonName: "Urea", classType: "CHEM" },
    { loincNum: "33914-3", component: "eGFR", property: "VRat", system: "Ser", shortName: "eGFR", longCommonName: "Estimated glomerular filtration rate (eGFR)", classType: "CHEM" },
    { loincNum: "2888-6", component: "Uric acid in Serum", property: "MCnc", system: "Ser", shortName: "Uric Acid", longCommonName: "Uric acid", classType: "CHEM" },

    // ── Serum Electrolytes ───────────────────────────────────────────────
    { loincNum: "2951-2", component: "Sodium in Serum", property: "SCnc", system: "Ser", shortName: "Na", longCommonName: "Sodium", classType: "CHEM" },
    { loincNum: "2823-4", component: "Potassium in Serum", property: "SCnc", system: "Ser", shortName: "K", longCommonName: "Potassium", classType: "CHEM" },
    { loincNum: "2075-0", component: "Chloride in Serum", property: "SCnc", system: "Ser", shortName: "Cl", longCommonName: "Chloride", classType: "CHEM" },
    { loincNum: "2028-9", component: "CO2 in Serum", property: "SCnc", system: "Ser", shortName: "Bicarb", longCommonName: "Carbon dioxide (bicarbonate)", classType: "CHEM" },
    { loincNum: "2777-1", component: "Calcium in Serum", property: "MCnc", system: "Ser", shortName: "Ca", longCommonName: "Calcium", classType: "CHEM" },
    { loincNum: "2779-7", component: "Calcium.ionized in Serum", property: "MCnc", system: "Ser", shortName: "Ionized Ca", longCommonName: "Ionized calcium", classType: "CHEM" },
    { loincNum: "1821-8", component: "Magnesium in Serum", property: "MCnc", system: "Ser", shortName: "Mg", longCommonName: "Magnesium", classType: "CHEM" },
    { loincNum: "2601-3", component: "Phosphorus in Serum", property: "MCnc", system: "Ser", shortName: "Phosphorus", longCommonName: "Phosphorus", classType: "CHEM" },

    // ── Thyroid Panel ────────────────────────────────────────────────────
    { loincNum: "11579-0", component: "TSH in Serum", property: "CCnc", system: "Ser", shortName: "TSH", longCommonName: "Thyroid stimulating hormone (TSH)", classType: "HORM" },
    { loincNum: "3024-0", component: "T3 Free in Serum", property: "MCnc", system: "Ser", shortName: "Free T3", longCommonName: "Triiodothyronine free (Free T3)", classType: "HORM" },
    { loincNum: "3050-5", component: "T4 Free in Serum", property: "MCnc", system: "Ser", shortName: "Free T4", longCommonName: "Thyroxine free (Free T4)", classType: "HORM" },
    { loincNum: "3017-4", component: "T3 Total in Serum", property: "MCnc", system: "Ser", shortName: "Total T3", longCommonName: "Triiodothyronine total (Total T3)", classType: "HORM" },
    { loincNum: "3027-3", component: "T4 Total in Serum", property: "MCnc", system: "Ser", shortName: "Total T4", longCommonName: "Thyroxine total (Total T4)", classType: "HORM" },

    // ── Lipid Profile ────────────────────────────────────────────────────
    { loincNum: "14647-6", component: "Cholesterol.total in Serum", property: "MCnc", system: "Ser", shortName: "Total Cholesterol", longCommonName: "Cholesterol total", classType: "CHEM" },
    { loincNum: "2085-9", component: "HDL in Serum", property: "MCnc", system: "Ser", shortName: "HDL", longCommonName: "High-density lipoprotein (HDL) cholesterol", classType: "CHEM" },
    { loincNum: "13457-7", component: "LDL in Serum", property: "MCnc", system: "Ser", shortName: "LDL", longCommonName: "Low-density lipoprotein (LDL) cholesterol", classType: "CHEM" },
    { loincNum: "2571-8", component: "Triglycerides in Serum", property: "MCnc", system: "Ser", shortName: "Triglycerides", longCommonName: "Triglycerides", classType: "CHEM" },
    { loincNum: "9830-1", component: "VLDL in Serum", property: "MCnc", system: "Ser", shortName: "VLDL", longCommonName: "Very low density lipoprotein (VLDL) cholesterol", classType: "CHEM" },
    { loincNum: "2093-3", component: "Cholesterol/HDL Ratio in Serum", property: "Rto", system: "Ser", shortName: "Chol/HDL", longCommonName: "Total cholesterol/HDL ratio", classType: "CHEM" },

    // ── Diabetes / Glucose ───────────────────────────────────────────────
    { loincNum: "1558-6", component: "Glucose [Mass/volume] in Serum — Fasting", property: "MCnc", system: "Ser", shortName: "Fasting Glucose", longCommonName: "Glucose fasting (FBS)", classType: "CHEM" },
    { loincNum: "14749-0", component: "Glucose [Mass/volume] in Serum — 2h post dose glucose", property: "MCnc", system: "Ser", shortName: "PP Glucose", longCommonName: "Glucose post-prandial (PPBS)", classType: "CHEM" },
    { loincNum: "2345-7", component: "Glucose [Mass/volume] in Serum", property: "MCnc", system: "Ser", shortName: "Random Glucose", longCommonName: "Glucose random (RBS)", classType: "CHEM" },
    { loincNum: "4548-4", component: "Hemoglobin A1c in Blood", property: "MFr", system: "Bld", shortName: "HbA1c", longCommonName: "Hemoglobin A1c (HbA1c)", classType: "CHEM" },

    // ── Inflammation / Infection ─────────────────────────────────────────
    { loincNum: "1988-5", component: "CRP in Serum", property: "MCnc", system: "Ser", shortName: "CRP", longCommonName: "C-reactive protein (CRP)", classType: "CHEM" },
    { loincNum: "4537-7", component: "ESR in Blood", property: "VRat", system: "Bld", shortName: "ESR", longCommonName: "Erythrocyte sedimentation rate (ESR)", classType: "HEM" },
    { loincNum: "44784-5", component: "Procalcitonin in Serum", property: "MCnc", system: "Ser", shortName: "PCT", longCommonName: "Procalcitonin", classType: "CHEM" },
    { loincNum: "32223-0", component: "D-dimer in Blood", property: "MCnc", system: "Bld", shortName: "D-Dimer", longCommonName: "D-dimer", classType: "HEM" },

    // ── Vitamins ─────────────────────────────────────────────────────────
    { loincNum: "2132-9", component: "Vitamin B12 in Serum", property: "SCnc", system: "Ser", shortName: "Vitamin B12", longCommonName: "Vitamin B12 (cobalamin)", classType: "HORM" },
    { loincNum: "49263-5", component: "Vitamin D 25OH in Serum", property: "MCnc", system: "Ser", shortName: "Vitamin D", longCommonName: "25-hydroxyvitamin D", classType: "HORM" },
    { loincNum: "5183-4", component: "Folate in Serum", property: "MCnc", system: "Ser", shortName: "Folate", longCommonName: "Folate (folic acid)", classType: "HORM" },
    { loincNum: "2276-4", component: "Ferritin in Serum", property: "MCnc", system: "Ser", shortName: "Ferritin", longCommonName: "Ferritin", classType: "CHEM" },

    // ── Iron Studies ─────────────────────────────────────────────────────
    { loincNum: "2498-4", component: "Iron in Serum", property: "MCnc", system: "Ser", shortName: "Serum Iron", longCommonName: "Iron", classType: "CHEM" },
    { loincNum: "2500-7", component: "TIBC in Serum", property: "MCnc", system: "Ser", shortName: "TIBC", longCommonName: "Total iron binding capacity (TIBC)", classType: "CHEM" },
    { loincNum: "2501-5", component: "Transferrin in Serum", property: "MCnc", system: "Ser", shortName: "Transferrin", longCommonName: "Transferrin", classType: "CHEM" },
    { loincNum: "2276-4", component: "Ferritin in Serum", property: "MCnc", system: "Ser", shortName: "Ferritin", longCommonName: "Ferritin", classType: "CHEM" },

    // ── Cardiac Markers ──────────────────────────────────────────────────
    { loincNum: "10839-9", component: "Troponin I.cardiac in Serum", property: "MCnc", system: "Ser", shortName: "Troponin I", longCommonName: "Troponin I cardiac", classType: "CHEM" },
    { loincNum: "6598-7", component: "Troponin T.cardiac in Serum", property: "MCnc", system: "Ser", shortName: "Troponin T", longCommonName: "Troponin T cardiac", classType: "CHEM" },
    { loincNum: "32673-7", component: "NT-proBNP in Serum", property: "MCnc", system: "Ser", shortName: "NT-proBNP", longCommonName: "N-terminal pro-B-type natriuretic peptide (NT-proBNP)", classType: "CHEM" },
    { loincNum: "2157-6", component: "Creatine kinase in Serum", property: "CCnc", system: "Ser", shortName: "CK", longCommonName: "Creatine kinase (CK)", classType: "CHEM" },
    { loincNum: "2154-3", component: "CK-MB in Serum", property: "CCnc", system: "Ser", shortName: "CK-MB", longCommonName: "Creatine kinase MB isoenzyme", classType: "CHEM" },
    { loincNum: "2532-0", component: "Lactate dehydrogenase in Serum", property: "CCnc", system: "Ser", shortName: "LDH", longCommonName: "Lactate dehydrogenase (LDH)", classType: "CHEM" },

    // ── Coagulation ──────────────────────────────────────────────────────
    { loincNum: "5895-8", component: "PT in Blood", property: "Time", system: "Bld", shortName: "PT", longCommonName: "Prothrombin time (PT)", classType: "HEM" },
    { loincNum: "5964-2", component: "aPTT in Blood", property: "Time", system: "Bld", shortName: "aPTT", longCommonName: "Activated partial thromboplastin time (aPTT)", classType: "HEM" },
    { loincNum: "6301-6", component: "INR in Blood", property: "Rto", system: "Bld", shortName: "INR", longCommonName: "International normalized ratio (INR)", classType: "HEM" },

    // ── Urine ────────────────────────────────────────────────────────────
    { loincNum: "24356-4", component: "Appearance of Urine", property: "Type", system: "Urine", shortName: "Urine Appearance", longCommonName: "Urine appearance", classType: "URINE" },
    { loincNum: "5778-6", component: "Color of Urine", property: "Type", system: "Urine", shortName: "Urine Color", longCommonName: "Urine color", classType: "URINE" },
    { loincNum: "5803-2", component: "Specific gravity of Urine", property: "Rto", system: "Urine", shortName: "Urine Sp Gravity", longCommonName: "Urine specific gravity", classType: "URINE" },
    { loincNum: "5792-7", component: "pH of Urine", property: "Rto", system: "Urine", shortName: "Urine pH", longCommonName: "Urine pH", classType: "URINE" },
    { loincNum: "20454-5", component: "Protein [Mass/volume] in Urine", property: "MCnc", system: "Urine", shortName: "Urine Protein", longCommonName: "Urine protein", classType: "URINE" },
    { loincNum: "20403-2", component: "Glucose [Mass/volume] in Urine", property: "MCnc", system: "Urine", shortName: "Urine Glucose", longCommonName: "Urine glucose", classType: "URINE" },
    { loincNum: "5799-2", component: "Ketones in Urine", property: "MCnc", system: "Urine", shortName: "Urine Ketones", longCommonName: "Urine ketones", classType: "URINE" },
    { loincNum: "5794-3", component: "Urobilinogen in Urine", property: "MCnc", system: "Urine", shortName: "Urine Urobilinogen", longCommonName: "Urine urobilinogen", classType: "URINE" },
    { loincNum: "20505-4", component: "Bilirubin in Urine", property: "?", system: "Urine", shortName: "Urine Bilirubin", longCommonName: "Urine bilirubin", classType: "URINE" },
    { loincNum: "5797-6", component: "Nitrite in Urine", property: "?", system: "Urine", shortName: "Urine Nitrite", longCommonName: "Urine nitrite", classType: "URINE" },
    { loincNum: "5804-0", component: "Leukocyte esterase in Urine", property: "?", system: "Urine", shortName: "Urine LE", longCommonName: "Urine leukocyte esterase", classType: "URINE" },
    { loincNum: "58448-2", component: "Microscopic observation in Urine", property: "?", system: "Urine", shortName: "Urine Microscopy", longCommonName: "Urine microscopy", classType: "URINE" },
    { loincNum: "20458-6", component: "Redox count in Urine", property: "NCnc", system: "Urine", shortName: "Urine RBC", longCommonName: "Urine RBC (microscopy)", classType: "URINE" },
    { loincNum: "20468-5", component: "White cell count in Urine", property: "NCnc", system: "Urine", shortName: "Urine WBC", longCommonName: "Urine WBC (microscopy)", classType: "URINE" },
    { loincNum: "19160-0", component: "Casts in Urine", property: "?", system: "Urine", shortName: "Urine Casts", longCommonName: "Urine casts (microscopy)", classType: "URINE" },
    { loincNum: "5807-3", component: "Crystals in Urine", property: "?", system: "Urine", shortName: "Urine Crystals", longCommonName: "Urine crystals (microscopy)", classType: "URINE" },
    { loincNum: "5772-9", component: "Epithelial cells in Urine", property: "?", system: "Urine", shortName: "Urine Epithelial", longCommonName: "Urine epithelial cells (microscopy)", classType: "URINE" },

    // ── Serology ─────────────────────────────────────────────────────────
    { loincNum: "5195-8", component: "Widal test for typhoid", property: "?", system: "Ser", shortName: "Widal", longCommonName: "Widal agglutination test", classType: "MICRO" },
    { loincNum: "17113-9", component: "Dengue virus IgM Ab in Serum", property: "?", system: "Ser", shortName: "Dengue IgM", longCommonName: "Dengue virus IgM antibody", classType: "MICRO" },
    { loincNum: "33558-8", component: "Dengue virus NS1 Ag in Serum", property: "?", system: "Ser", shortName: "Dengue NS1", longCommonName: "Dengue virus NS1 antigen", classType: "MICRO" },
    { loincNum: "33608-1", component: "Malaria Ag in Blood", property: "?", system: "Bld", shortName: "Malaria Antigen", longCommonName: "Malaria antigen test", classType: "MICRO" },
    { loincNum: "47582-6", component: "Chikungunya virus IgM Ab in Serum", property: "?", system: "Ser", shortName: "Chikungunya IgM", longCommonName: "Chikungunya virus IgM antibody", classType: "MICRO" },
    { loincNum: "22314-8", component: "HBsAg in Serum", property: "?", system: "Ser", shortName: "HBsAg", longCommonName: "Hepatitis B surface antigen", classType: "MICRO" },
    { loincNum: "16935-4", component: "Anti-HCV in Serum", property: "?", system: "Ser", shortName: "Anti-HCV", longCommonName: "Hepatitis C virus antibody", classType: "MICRO" },
    { loincNum: "16936-2", component: "HIV 1+2 Ab in Serum", property: "?", system: "Ser", shortName: "HIV Ab", longCommonName: "HIV 1+2 antibody", classType: "MICRO" },
    { loincNum: "30162-0", component: "RA factor in Serum", property: "?", system: "Ser", shortName: "RA Factor", longCommonName: "Rheumatoid factor", classType: "MICRO" },
    { loincNum: "11256-6", component: "ASO in Serum", property: "?", system: "Ser", shortName: "ASO", longCommonName: "Anti-streptolysin O (ASO) titer", classType: "MICRO" },
    { loincNum: "24112-1", component: "Typhi dot IgM in Serum", property: "?", system: "Ser", shortName: "Typhi Dot IgM", longCommonName: "Typhoid IgM antibody (Typhi dot)", classType: "MICRO" },

    // ── Blood Gas ────────────────────────────────────────────────────────
    { loincNum: "2019-8", component: "pH of Blood", property: "?", system: "Bld", shortName: "pH", longCommonName: "pH (arterial blood)", classType: "ABG" },
    { loincNum: "2017-2", component: "pCO2 in Blood", property: "?", system: "Bld", shortName: "pCO2", longCommonName: "Partial pressure of carbon dioxide (pCO2)", classType: "ABG" },
    { loincNum: "2703-7", component: "pO2 in Blood", property: "?", system: "Bld", shortName: "pO2", longCommonName: "Partial pressure of oxygen (pO2)", classType: "ABG" },
    { loincNum: "1960-4", component: "HCO3 in Blood", property: "?", system: "Bld", shortName: "HCO3", longCommonName: "Bicarbonate (HCO3)", classType: "ABG" },
    { loincNum: "1963-8", component: "Base excess in Blood", property: "?", system: "Bld", shortName: "Base Excess", longCommonName: "Base excess", classType: "ABG" },
    { loincNum: "2707-8", component: "O2 saturation in Blood", property: "?", system: "Bld", shortName: "O2 Sat", longCommonName: "Oxygen saturation", classType: "ABG" },
    { loincNum: "2874-6", component: "Lactate in Blood", property: "?", system: "Bld", shortName: "Lactate", longCommonName: "Lactate (arterial blood)", classType: "ABG" },
  ];

  // Remove duplicate by loincNum (keep last occurrence)
  const seen = new Set<string>();
  const unique = codes.filter((c) => {
    if (seen.has(c.loincNum)) return false;
    seen.add(c.loincNum);
    return true;
  });

  await db.insert(s.loincCodes).values(unique).onConflictDoNothing();
  console.log(`  ✓ ${unique.length} LOINC codes (${codes.length - unique.length} duplicates removed)`);
}

export default seedLoincData;
