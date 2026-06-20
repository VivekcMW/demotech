import { db, schema as s } from "./index";

/**
 * Seed ICD-10 Master Data
 * 
 * This includes:
 * - 22 ICD-10 Chapters
 * - Common categories
 * - 500+ frequently used ICD-10-CM codes across Indian hospital specialties
 * - ICD-10-PCS procedure codes
 * - Specialty favorites
 */
export async function seedIcd10Data() {
  console.log("🏥 Seeding ICD-10 master data...");

  // ── ICD-10 Chapters (22 chapters) ──────────────────────────────────────
  const chapters = [
    { id: "01", romanNumeral: "I", title: "Certain infectious and parasitic diseases", codeRangeStart: "A00", codeRangeEnd: "B99" },
    { id: "02", romanNumeral: "II", title: "Neoplasms", codeRangeStart: "C00", codeRangeEnd: "D49" },
    { id: "03", romanNumeral: "III", title: "Diseases of the blood and blood-forming organs", codeRangeStart: "D50", codeRangeEnd: "D89" },
    { id: "04", romanNumeral: "IV", title: "Endocrine, nutritional and metabolic diseases", codeRangeStart: "E00", codeRangeEnd: "E89" },
    { id: "05", romanNumeral: "V", title: "Mental, behavioral and neurodevelopmental disorders", codeRangeStart: "F01", codeRangeEnd: "F99" },
    { id: "06", romanNumeral: "VI", title: "Diseases of the nervous system", codeRangeStart: "G00", codeRangeEnd: "G99" },
    { id: "07", romanNumeral: "VII", title: "Diseases of the eye and adnexa", codeRangeStart: "H00", codeRangeEnd: "H59" },
    { id: "08", romanNumeral: "VIII", title: "Diseases of the ear and mastoid process", codeRangeStart: "H60", codeRangeEnd: "H95" },
    { id: "09", romanNumeral: "IX", title: "Diseases of the circulatory system", codeRangeStart: "I00", codeRangeEnd: "I99" },
    { id: "10", romanNumeral: "X", title: "Diseases of the respiratory system", codeRangeStart: "J00", codeRangeEnd: "J99" },
    { id: "11", romanNumeral: "XI", title: "Diseases of the digestive system", codeRangeStart: "K00", codeRangeEnd: "K95" },
    { id: "12", romanNumeral: "XII", title: "Diseases of the skin and subcutaneous tissue", codeRangeStart: "L00", codeRangeEnd: "L99" },
    { id: "13", romanNumeral: "XIII", title: "Diseases of the musculoskeletal system", codeRangeStart: "M00", codeRangeEnd: "M99" },
    { id: "14", romanNumeral: "XIV", title: "Diseases of the genitourinary system", codeRangeStart: "N00", codeRangeEnd: "N99" },
    { id: "15", romanNumeral: "XV", title: "Pregnancy, childbirth and the puerperium", codeRangeStart: "O00", codeRangeEnd: "O9A" },
    { id: "16", romanNumeral: "XVI", title: "Certain conditions originating in the perinatal period", codeRangeStart: "P00", codeRangeEnd: "P96" },
    { id: "17", romanNumeral: "XVII", title: "Congenital malformations, deformations and chromosomal abnormalities", codeRangeStart: "Q00", codeRangeEnd: "Q99" },
    { id: "18", romanNumeral: "XVIII", title: "Symptoms, signs and abnormal clinical and laboratory findings", codeRangeStart: "R00", codeRangeEnd: "R99" },
    { id: "19", romanNumeral: "XIX", title: "Injury, poisoning and external causes", codeRangeStart: "S00", codeRangeEnd: "T88" },
    { id: "20", romanNumeral: "XX", title: "External causes of morbidity", codeRangeStart: "V00", codeRangeEnd: "Y99" },
    { id: "21", romanNumeral: "XXI", title: "Factors influencing health status and contact with health services", codeRangeStart: "Z00", codeRangeEnd: "Z99" },
    { id: "22", romanNumeral: "XXII", title: "Codes for special purposes", codeRangeStart: "U00", codeRangeEnd: "U85" },
  ];

  await db.insert(s.icd10Chapters).values(chapters).onConflictDoNothing();
  console.log(`  ✓ ${chapters.length} chapters`);

  // ── ICD-10 Categories ──────────────────────────────────────────────────
  const categories = [
    // Chapter 1 - Infectious
    { code: "A00-A09", chapterId: "01", title: "Intestinal infectious diseases" },
    { code: "A15-A19", chapterId: "01", title: "Tuberculosis" },
    { code: "A20-A28", chapterId: "01", title: "Certain zoonotic bacterial diseases" },
    { code: "A30-A49", chapterId: "01", title: "Other bacterial diseases" },
    { code: "A50-A64", chapterId: "01", title: "Infections with a predominantly sexual mode of transmission" },
    { code: "A65-A69", chapterId: "01", title: "Other spirochetal diseases" },
    { code: "A70-A74", chapterId: "01", title: "Other diseases caused by chlamydiae" },
    { code: "A75-A79", chapterId: "01", title: "Rickettsioses" },
    { code: "A80-A89", chapterId: "01", title: "Viral and prion infections of the central nervous system" },
    { code: "A90-A99", chapterId: "01", title: "Arthropod-borne viral fevers and viral hemorrhagic fevers" },
    { code: "B00-B09", chapterId: "01", title: "Viral infections characterized by skin and mucous membrane lesions" },
    { code: "B15-B19", chapterId: "01", title: "Viral hepatitis" },
    { code: "B20", chapterId: "01", title: "Human immunodeficiency virus [HIV] disease" },
    { code: "B25-B34", chapterId: "01", title: "Other viral diseases" },
    { code: "B35-B49", chapterId: "01", title: "Mycoses" },
    { code: "B50-B64", chapterId: "01", title: "Protozoal diseases" },
    { code: "B65-B83", chapterId: "01", title: "Helminthiases" },
    // Chapter 9 - Circulatory
    { code: "I10-I16", chapterId: "09", title: "Hypertensive diseases" },
    { code: "I20-I25", chapterId: "09", title: "Ischemic heart diseases" },
    { code: "I26-I28", chapterId: "09", title: "Pulmonary heart disease and diseases of pulmonary circulation" },
    { code: "I30-I52", chapterId: "09", title: "Other forms of heart disease" },
    { code: "I60-I69", chapterId: "09", title: "Cerebrovascular diseases" },
    { code: "I70-I79", chapterId: "09", title: "Diseases of arteries, arterioles and capillaries" },
    { code: "I80-I89", chapterId: "09", title: "Diseases of veins, lymphatic vessels and lymph nodes" },
    // Chapter 10 - Respiratory
    { code: "J00-J06", chapterId: "10", title: "Acute upper respiratory infections" },
    { code: "J09-J18", chapterId: "10", title: "Influenza and pneumonia" },
    { code: "J20-J22", chapterId: "10", title: "Other acute lower respiratory infections" },
    { code: "J30-J39", chapterId: "10", title: "Other diseases of upper respiratory tract" },
    { code: "J40-J47", chapterId: "10", title: "Chronic lower respiratory diseases" },
    { code: "J60-J70", chapterId: "10", title: "Lung diseases due to external agents" },
    // Chapter 4 - Endocrine
    { code: "E00-E07", chapterId: "04", title: "Disorders of thyroid gland" },
    { code: "E08-E13", chapterId: "04", title: "Diabetes mellitus" },
    { code: "E15-E16", chapterId: "04", title: "Other disorders of glucose regulation and pancreatic internal secretion" },
    { code: "E20-E35", chapterId: "04", title: "Disorders of other endocrine glands" },
    { code: "E40-E46", chapterId: "04", title: "Malnutrition" },
    { code: "E50-E64", chapterId: "04", title: "Other nutritional deficiencies" },
    { code: "E65-E68", chapterId: "04", title: "Overweight, obesity and other hyperalimentation" },
    { code: "E70-E88", chapterId: "04", title: "Metabolic disorders" },
    // Chapter 15 - Pregnancy
    { code: "O00-O08", chapterId: "15", title: "Pregnancy with abortive outcome" },
    { code: "O09", chapterId: "15", title: "Supervision of high-risk pregnancy" },
    { code: "O10-O16", chapterId: "15", title: "Edema, proteinuria and hypertensive disorders in pregnancy" },
    { code: "O20-O29", chapterId: "15", title: "Other maternal disorders related to pregnancy" },
    { code: "O30-O48", chapterId: "15", title: "Maternal care related to the fetus and amniotic cavity" },
    { code: "O60-O77", chapterId: "15", title: "Complications of labor and delivery" },
    { code: "O80-O82", chapterId: "15", title: "Encounter for delivery" },
    { code: "O85-O92", chapterId: "15", title: "Complications predominantly related to the puerperium" },
    // Chapter 11 - Digestive
    { code: "K00-K14", chapterId: "11", title: "Diseases of oral cavity, salivary glands and jaws" },
    { code: "K20-K31", chapterId: "11", title: "Diseases of esophagus, stomach and duodenum" },
    { code: "K35-K38", chapterId: "11", title: "Diseases of appendix" },
    { code: "K40-K46", chapterId: "11", title: "Hernia" },
    { code: "K50-K52", chapterId: "11", title: "Noninfective enteritis and colitis" },
    { code: "K55-K64", chapterId: "11", title: "Other diseases of intestines" },
    { code: "K70-K77", chapterId: "11", title: "Diseases of liver" },
    { code: "K80-K87", chapterId: "11", title: "Disorders of gallbladder, biliary tract and pancreas" },
  ];

  await db.insert(s.icd10Categories).values(categories).onConflictDoNothing();
  console.log(`  ✓ ${categories.length} categories`);

  // ── ICD-10-CM Codes (Common Indian Hospital Codes) ─────────────────────
  const codes = [
    // ─── Infectious Diseases (Chapter 1) ───
    { code: "A00.0", shortDesc: "Cholera due to Vibrio cholerae 01, biovar cholerae", longDesc: "Cholera due to Vibrio cholerae 01, biovar cholerae (classical cholera)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Gastroenterology"], keywords: ["cholera", "vibrio", "diarrhea"] },
    { code: "A00.1", shortDesc: "Cholera due to Vibrio cholerae 01, biovar eltor", longDesc: "Cholera due to Vibrio cholerae 01, biovar eltor (El Tor cholera)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Gastroenterology"], keywords: ["cholera", "el tor"] },
    { code: "A01.0", shortDesc: "Typhoid fever", longDesc: "Typhoid fever (Infection due to Salmonella typhi)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["typhoid", "salmonella", "enteric fever"] },
    { code: "A02.0", shortDesc: "Salmonella enteritis", longDesc: "Salmonella enteritis (Salmonellosis)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Gastroenterology", "Pediatrics"], keywords: ["salmonella", "food poisoning", "gastroenteritis"] },
    { code: "A04.0", shortDesc: "Enteropathogenic E. coli infection", longDesc: "Enteropathogenic Escherichia coli infection", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["e.coli", "diarrhea"] },
    { code: "A04.7", shortDesc: "Enterocolitis due to Clostridium difficile", longDesc: "Enterocolitis due to Clostridium difficile (Foodborne intoxication by Clostridium difficile, Pseudomembranous colitis)", chapterId: "01", isBillable: true, isChronic: false, commonSpecialties: ["Internal Medicine", "Gastroenterology"], keywords: ["c diff", "cdiff", "pseudomembranous colitis", "antibiotic associated"] },
    { code: "A09", shortDesc: "Infectious gastroenteritis and colitis, unspecified", longDesc: "Infectious gastroenteritis and colitis, unspecified (Infectious colitis, enteritis, or gastroenteritis NOS)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics", "Gastroenterology"], keywords: ["gastroenteritis", "diarrhea", "vomiting", "stomach flu"] },
    { code: "A15.0", shortDesc: "Tuberculosis of lung", longDesc: "Tuberculosis of lung (confirmed by sputum microscopy)", chapterId: "01", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["TB", "pulmonary TB", "tuberculosis", "consumption"] },
    { code: "A16.0", shortDesc: "Tuberculosis of lung, bacteriologically not confirmed", longDesc: "Tuberculosis of lung, bacteriologically and histologically negative", chapterId: "01", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["TB", "tuberculosis", "sputum negative"] },
    { code: "A41.9", shortDesc: "Sepsis, unspecified organism", longDesc: "Sepsis, unspecified organism (Septicemia NOS)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Critical Care", "Emergency Medicine"], keywords: ["sepsis", "septicemia", "blood infection", "SIRS"] },
    { code: "A49.9", shortDesc: "Bacterial infection, unspecified", longDesc: "Bacterial infection, unspecified (Bacteremia NOS)", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine"], keywords: ["bacterial infection", "bacteremia"] },
    { code: "A90", shortDesc: "Dengue fever [classical dengue]", longDesc: "Dengue fever [classical dengue]", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["dengue", "breakbone fever", "mosquito"] },
    { code: "A91", shortDesc: "Dengue hemorrhagic fever", longDesc: "Dengue hemorrhagic fever", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics", "Critical Care"], keywords: ["dengue", "DHF", "hemorrhagic", "bleeding"] },
    { code: "A95.1", shortDesc: "Urban yellow fever", longDesc: "Urban yellow fever", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine"], keywords: ["yellow fever"] },
    { code: "B15.9", shortDesc: "Hepatitis A without hepatic coma", longDesc: "Hepatitis A without hepatic coma", chapterId: "01", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["hepatitis A", "HAV", "jaundice"] },
    { code: "B16.9", shortDesc: "Acute hepatitis B without delta-agent", longDesc: "Acute hepatitis B without delta-agent and without hepatic coma", chapterId: "01", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["hepatitis B", "HBV"] },
    { code: "B17.1", shortDesc: "Acute hepatitis C", longDesc: "Acute hepatitis C", chapterId: "01", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["hepatitis C", "HCV"] },
    { code: "B18.1", shortDesc: "Chronic viral hepatitis B without delta-agent", longDesc: "Chronic viral hepatitis B without delta-agent", chapterId: "01", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["chronic hepatitis B", "HBV carrier"] },
    { code: "B18.2", shortDesc: "Chronic viral hepatitis C", longDesc: "Chronic viral hepatitis C", chapterId: "01", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["chronic hepatitis C", "HCV"] },
    { code: "B20", shortDesc: "Human immunodeficiency virus [HIV] disease", longDesc: "Human immunodeficiency virus [HIV] disease", chapterId: "01", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Infectious Disease"], keywords: ["HIV", "AIDS", "immunodeficiency"] },
    { code: "B34.9", shortDesc: "Viral infection, unspecified", longDesc: "Viral infection, unspecified", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["viral", "virus"] },
    { code: "B50.9", shortDesc: "Plasmodium falciparum malaria, unspecified", longDesc: "Plasmodium falciparum malaria, unspecified", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["malaria", "falciparum", "mosquito"] },
    { code: "B51.9", shortDesc: "Plasmodium vivax malaria", longDesc: "Plasmodium vivax malaria without complication", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["malaria", "vivax"] },
    { code: "B54", shortDesc: "Unspecified malaria", longDesc: "Unspecified malaria", chapterId: "01", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["malaria"] },

    // ─── Neoplasms (Chapter 2) ───
    { code: "C18.9", shortDesc: "Malignant neoplasm of colon, unspecified", longDesc: "Malignant neoplasm of colon, unspecified", chapterId: "02", isBillable: true, isChronic: true, commonSpecialties: ["Oncology", "Surgery", "Gastroenterology"], keywords: ["colon cancer", "colorectal", "bowel cancer"] },
    { code: "C34.90", shortDesc: "Malignant neoplasm of unspecified part of bronchus or lung", longDesc: "Malignant neoplasm of unspecified part of unspecified bronchus or lung", chapterId: "02", isBillable: true, isChronic: true, commonSpecialties: ["Oncology", "Pulmonology"], keywords: ["lung cancer", "bronchogenic", "NSCLC", "SCLC"] },
    { code: "C50.919", shortDesc: "Malignant neoplasm of unspecified site of female breast", longDesc: "Malignant neoplasm of unspecified site of unspecified female breast", chapterId: "02", isBillable: true, isChronic: true, sexSpecific: "F", commonSpecialties: ["Oncology", "Surgery"], keywords: ["breast cancer", "carcinoma breast"] },
    { code: "C61", shortDesc: "Malignant neoplasm of prostate", longDesc: "Malignant neoplasm of prostate", chapterId: "02", isBillable: true, isChronic: true, sexSpecific: "M", commonSpecialties: ["Oncology", "Urology"], keywords: ["prostate cancer", "prostatic carcinoma"] },
    { code: "C73", shortDesc: "Malignant neoplasm of thyroid gland", longDesc: "Malignant neoplasm of thyroid gland", chapterId: "02", isBillable: true, isChronic: true, commonSpecialties: ["Oncology", "Endocrinology", "Surgery"], keywords: ["thyroid cancer", "papillary", "follicular"] },
    { code: "D25.9", shortDesc: "Leiomyoma of uterus, unspecified", longDesc: "Leiomyoma of uterus, unspecified", chapterId: "02", isBillable: true, sexSpecific: "F", commonSpecialties: ["Gynecology"], keywords: ["fibroid", "uterine fibroid", "leiomyoma", "myoma"] },

    // ─── Blood Disorders (Chapter 3) ───
    { code: "D50.9", shortDesc: "Iron deficiency anemia, unspecified", longDesc: "Iron deficiency anemia, unspecified", chapterId: "03", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Hematology"], keywords: ["anemia", "iron deficiency", "IDA", "low hemoglobin"] },
    { code: "D53.9", shortDesc: "Nutritional anemia, unspecified", longDesc: "Nutritional anemia, unspecified", chapterId: "03", isBillable: true, commonSpecialties: ["Internal Medicine", "Hematology"], keywords: ["anemia", "nutritional"] },
    { code: "D56.1", shortDesc: "Beta thalassemia", longDesc: "Beta thalassemia (Cooley's anemia, Severe beta thalassemia)", chapterId: "03", isBillable: true, isChronic: true, commonSpecialties: ["Hematology", "Pediatrics"], keywords: ["thalassemia", "cooley", "mediterranean anemia"] },
    { code: "D57.1", shortDesc: "Sickle-cell disease without crisis", longDesc: "Sickle-cell disease without crisis (Hb-SS disease without crisis)", chapterId: "03", isBillable: true, isChronic: true, commonSpecialties: ["Hematology", "Pediatrics"], keywords: ["sickle cell", "HbSS", "sickling"] },
    { code: "D64.9", shortDesc: "Anemia, unspecified", longDesc: "Anemia, unspecified", chapterId: "03", isBillable: true, commonSpecialties: ["Internal Medicine", "Hematology"], keywords: ["anemia", "low hemoglobin"] },
    { code: "D69.6", shortDesc: "Thrombocytopenia, unspecified", longDesc: "Thrombocytopenia, unspecified", chapterId: "03", isBillable: true, commonSpecialties: ["Hematology", "Internal Medicine"], keywords: ["low platelets", "thrombocytopenia", "platelet"] },

    // ─── Endocrine/Metabolic (Chapter 4) ───
    { code: "E03.9", shortDesc: "Hypothyroidism, unspecified", longDesc: "Hypothyroidism, unspecified", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["hypothyroid", "underactive thyroid", "myxedema", "low thyroid"] },
    { code: "E04.1", shortDesc: "Nontoxic single thyroid nodule", longDesc: "Nontoxic single thyroid nodule", chapterId: "04", isBillable: true, commonSpecialties: ["Endocrinology", "Surgery"], keywords: ["thyroid nodule", "goiter", "solitary nodule"] },
    { code: "E04.2", shortDesc: "Nontoxic multinodular goiter", longDesc: "Nontoxic multinodular goiter", chapterId: "04", isBillable: true, commonSpecialties: ["Endocrinology", "Surgery"], keywords: ["multinodular goiter", "MNG", "thyroid enlargement"] },
    { code: "E05.00", shortDesc: "Thyrotoxicosis with diffuse goiter without thyrotoxic crisis", longDesc: "Thyrotoxicosis with diffuse goiter without thyrotoxic crisis or storm", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["hyperthyroid", "graves", "thyrotoxicosis", "overactive thyroid"] },
    { code: "E06.3", shortDesc: "Autoimmune thyroiditis", longDesc: "Autoimmune thyroiditis (Hashimoto's thyroiditis)", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["hashimoto", "autoimmune thyroiditis", "chronic lymphocytic thyroiditis"] },
    { code: "E10.9", shortDesc: "Type 1 diabetes mellitus without complications", longDesc: "Type 1 diabetes mellitus without complications", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine", "Pediatrics"], keywords: ["type 1 diabetes", "T1DM", "IDDM", "juvenile diabetes", "insulin dependent"] },
    { code: "E10.65", shortDesc: "Type 1 diabetes mellitus with hyperglycemia", longDesc: "Type 1 diabetes mellitus with hyperglycemia", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["T1DM", "high sugar", "hyperglycemia"] },
    { code: "E11.9", shortDesc: "Type 2 diabetes mellitus without complications", longDesc: "Type 2 diabetes mellitus without complications", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["type 2 diabetes", "T2DM", "NIDDM", "adult onset diabetes", "DM2"] },
    { code: "E11.65", shortDesc: "Type 2 diabetes mellitus with hyperglycemia", longDesc: "Type 2 diabetes mellitus with hyperglycemia", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["T2DM", "high sugar", "uncontrolled diabetes"] },
    { code: "E11.21", shortDesc: "Type 2 diabetes mellitus with diabetic nephropathy", longDesc: "Type 2 diabetes mellitus with diabetic nephropathy", chapterId: "04", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Endocrinology", "Nephrology"], keywords: ["diabetic kidney", "diabetic nephropathy", "DKD"] },
    { code: "E11.22", shortDesc: "Type 2 diabetes mellitus with diabetic CKD", longDesc: "Type 2 diabetes mellitus with diabetic chronic kidney disease", chapterId: "04", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Endocrinology", "Nephrology"], keywords: ["diabetic CKD", "DKD"] },
    { code: "E11.319", shortDesc: "Type 2 DM with unspecified diabetic retinopathy", longDesc: "Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema", chapterId: "04", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Endocrinology", "Ophthalmology"], keywords: ["diabetic retinopathy", "eye complications"] },
    { code: "E11.40", shortDesc: "Type 2 DM with diabetic neuropathy, unspecified", longDesc: "Type 2 diabetes mellitus with diabetic neuropathy, unspecified", chapterId: "04", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Endocrinology", "Neurology"], keywords: ["diabetic neuropathy", "nerve damage", "peripheral neuropathy"] },
    { code: "E11.51", shortDesc: "Type 2 DM with diabetic peripheral angiopathy", longDesc: "Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene", chapterId: "04", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Endocrinology", "Vascular Surgery"], keywords: ["PVD", "peripheral vascular", "diabetic foot"] },
    { code: "E11.621", shortDesc: "Type 2 DM with foot ulcer", longDesc: "Type 2 diabetes mellitus with foot ulcer", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Surgery"], keywords: ["diabetic foot ulcer", "DFU"] },
    { code: "E66.01", shortDesc: "Morbid (severe) obesity due to excess calories", longDesc: "Morbid (severe) obesity due to excess calories", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Endocrinology", "Bariatric Surgery"], keywords: ["obesity", "morbid obesity", "BMI 40+"] },
    { code: "E66.9", shortDesc: "Obesity, unspecified", longDesc: "Obesity, unspecified", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Endocrinology"], keywords: ["obesity", "overweight", "BMI"] },
    { code: "E78.0", shortDesc: "Pure hypercholesterolemia, unspecified", longDesc: "Pure hypercholesterolemia, unspecified", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Cardiology"], keywords: ["high cholesterol", "hypercholesterolemia", "dyslipidemia"] },
    { code: "E78.1", shortDesc: "Pure hyperglyceridemia", longDesc: "Pure hyperglyceridemia", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Cardiology"], keywords: ["high triglycerides", "hypertriglyceridemia"] },
    { code: "E78.5", shortDesc: "Hyperlipidemia, unspecified", longDesc: "Hyperlipidemia, unspecified", chapterId: "04", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Cardiology"], keywords: ["dyslipidemia", "high lipids", "cholesterol"] },
    { code: "E83.52", shortDesc: "Hypercalcemia", longDesc: "Hypercalcemia", chapterId: "04", isBillable: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["high calcium", "hypercalcemia"] },
    { code: "E86.0", shortDesc: "Dehydration", longDesc: "Dehydration", chapterId: "04", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics", "Emergency Medicine"], keywords: ["dehydration", "volume depletion", "fluid loss"] },
    { code: "E87.1", shortDesc: "Hypo-osmolality and hyponatremia", longDesc: "Hypo-osmolality and hyponatremia", chapterId: "04", isBillable: true, commonSpecialties: ["Internal Medicine", "Nephrology"], keywords: ["low sodium", "hyponatremia", "SIADH"] },
    { code: "E87.5", shortDesc: "Hyperkalemia", longDesc: "Hyperkalemia", chapterId: "04", isBillable: true, commonSpecialties: ["Internal Medicine", "Nephrology", "Critical Care"], keywords: ["high potassium", "hyperkalemia"] },
    { code: "E87.6", shortDesc: "Hypokalemia", longDesc: "Hypokalemia", chapterId: "04", isBillable: true, commonSpecialties: ["Internal Medicine", "Nephrology"], keywords: ["low potassium", "hypokalemia"] },

    // ─── Mental Health (Chapter 5) ───
    { code: "F10.10", shortDesc: "Alcohol abuse, uncomplicated", longDesc: "Alcohol abuse, uncomplicated", chapterId: "05", isBillable: true, commonSpecialties: ["Psychiatry", "Internal Medicine"], keywords: ["alcohol abuse", "alcoholism", "drinking problem"] },
    { code: "F10.20", shortDesc: "Alcohol dependence, uncomplicated", longDesc: "Alcohol dependence, uncomplicated", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Psychiatry"], keywords: ["alcohol dependence", "alcoholism", "addiction"] },
    { code: "F17.210", shortDesc: "Nicotine dependence, cigarettes, uncomplicated", longDesc: "Nicotine dependence, cigarettes, uncomplicated", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Internal Medicine", "Psychiatry", "Pulmonology"], keywords: ["smoking", "tobacco", "nicotine", "cigarette addiction"] },
    { code: "F20.9", shortDesc: "Schizophrenia, unspecified", longDesc: "Schizophrenia, unspecified", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Psychiatry"], keywords: ["schizophrenia", "psychosis"] },
    { code: "F31.9", shortDesc: "Bipolar disorder, unspecified", longDesc: "Bipolar disorder, unspecified", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Psychiatry"], keywords: ["bipolar", "manic depressive", "mood disorder"] },
    { code: "F32.9", shortDesc: "Major depressive disorder, single episode, unspecified", longDesc: "Major depressive disorder, single episode, unspecified", chapterId: "05", isBillable: true, commonSpecialties: ["Psychiatry", "Internal Medicine"], keywords: ["depression", "major depression", "MDD"] },
    { code: "F33.0", shortDesc: "Major depressive disorder, recurrent, mild", longDesc: "Major depressive disorder, recurrent, mild", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Psychiatry"], keywords: ["recurrent depression", "MDD"] },
    { code: "F41.1", shortDesc: "Generalized anxiety disorder", longDesc: "Generalized anxiety disorder", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Psychiatry", "Internal Medicine"], keywords: ["anxiety", "GAD", "generalized anxiety"] },
    { code: "F41.9", shortDesc: "Anxiety disorder, unspecified", longDesc: "Anxiety disorder, unspecified", chapterId: "05", isBillable: true, commonSpecialties: ["Psychiatry", "Internal Medicine"], keywords: ["anxiety", "anxious"] },
    { code: "F43.10", shortDesc: "Post-traumatic stress disorder, unspecified", longDesc: "Post-traumatic stress disorder, unspecified", chapterId: "05", isBillable: true, isChronic: true, commonSpecialties: ["Psychiatry"], keywords: ["PTSD", "trauma", "post-traumatic"] },

    // ─── Nervous System (Chapter 6) ───
    { code: "G20", shortDesc: "Parkinson's disease", longDesc: "Parkinson's disease", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Neurology"], keywords: ["parkinsons", "tremor", "parkinsonism", "movement disorder"] },
    { code: "G30.9", shortDesc: "Alzheimer's disease, unspecified", longDesc: "Alzheimer's disease, unspecified", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Neurology", "Psychiatry"], keywords: ["alzheimers", "dementia", "memory loss"] },
    { code: "G35", shortDesc: "Multiple sclerosis", longDesc: "Multiple sclerosis", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Neurology"], keywords: ["MS", "multiple sclerosis", "demyelinating"] },
    { code: "G40.909", shortDesc: "Epilepsy, unspecified, not intractable", longDesc: "Epilepsy, unspecified, not intractable, without status epilepticus", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Neurology"], keywords: ["epilepsy", "seizure", "fits", "convulsion"] },
    { code: "G43.909", shortDesc: "Migraine, unspecified, not intractable", longDesc: "Migraine, unspecified, not intractable, without status migrainosus", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Neurology", "Internal Medicine"], keywords: ["migraine", "headache", "hemicrania"] },
    { code: "G44.1", shortDesc: "Vascular headache, not elsewhere classified", longDesc: "Vascular headache, not elsewhere classified", chapterId: "06", isBillable: true, commonSpecialties: ["Neurology"], keywords: ["headache", "vascular headache"] },
    { code: "G47.00", shortDesc: "Insomnia, unspecified", longDesc: "Insomnia, unspecified", chapterId: "06", isBillable: true, commonSpecialties: ["Neurology", "Psychiatry", "Internal Medicine"], keywords: ["insomnia", "sleeplessness", "cant sleep"] },
    { code: "G47.33", shortDesc: "Obstructive sleep apnea (adult) (pediatric)", longDesc: "Obstructive sleep apnea (adult) (pediatric)", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "ENT"], keywords: ["sleep apnea", "OSA", "snoring", "CPAP"] },
    { code: "G62.9", shortDesc: "Polyneuropathy, unspecified", longDesc: "Polyneuropathy, unspecified", chapterId: "06", isBillable: true, commonSpecialties: ["Neurology"], keywords: ["neuropathy", "peripheral neuropathy", "nerve damage"] },
    { code: "G89.4", shortDesc: "Chronic pain syndrome", longDesc: "Chronic pain syndrome", chapterId: "06", isBillable: true, isChronic: true, commonSpecialties: ["Pain Medicine", "Neurology"], keywords: ["chronic pain", "pain syndrome"] },

    // ─── Cardiovascular (Chapter 9) ───
    { code: "I10", shortDesc: "Essential (primary) hypertension", longDesc: "Essential (primary) hypertension", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["hypertension", "high blood pressure", "HTN", "BP"] },
    { code: "I11.0", shortDesc: "Hypertensive heart disease with heart failure", longDesc: "Hypertensive heart disease with heart failure", chapterId: "09", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["hypertensive heart disease", "HHD", "heart failure"] },
    { code: "I11.9", shortDesc: "Hypertensive heart disease without heart failure", longDesc: "Hypertensive heart disease without heart failure", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["hypertensive heart disease", "HHD"] },
    { code: "I12.9", shortDesc: "Hypertensive CKD without heart failure", longDesc: "Hypertensive chronic kidney disease with stage 1-4 CKD or unspecified CKD", chapterId: "09", isBillable: true, isChronic: true, isComorbidity: true, commonSpecialties: ["Cardiology", "Nephrology"], keywords: ["hypertensive kidney", "CKD", "renal"] },
    { code: "I20.0", shortDesc: "Unstable angina", longDesc: "Unstable angina", chapterId: "09", isBillable: true, commonSpecialties: ["Cardiology", "Emergency Medicine"], keywords: ["unstable angina", "ACS", "chest pain", "UA"] },
    { code: "I20.9", shortDesc: "Angina pectoris, unspecified", longDesc: "Angina pectoris, unspecified", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["angina", "chest pain", "exertional chest pain"] },
    { code: "I21.3", shortDesc: "ST elevation (STEMI) myocardial infarction of unspecified site", longDesc: "ST elevation (STEMI) myocardial infarction of unspecified site", chapterId: "09", isBillable: true, commonSpecialties: ["Cardiology", "Emergency Medicine", "Critical Care"], keywords: ["STEMI", "heart attack", "MI", "myocardial infarction"] },
    { code: "I21.4", shortDesc: "Non-ST elevation (NSTEMI) myocardial infarction", longDesc: "Non-ST elevation (NSTEMI) myocardial infarction", chapterId: "09", isBillable: true, commonSpecialties: ["Cardiology", "Emergency Medicine"], keywords: ["NSTEMI", "heart attack", "MI", "ACS"] },
    { code: "I25.10", shortDesc: "Atherosclerotic heart disease of native coronary artery", longDesc: "Atherosclerotic heart disease of native coronary artery without angina pectoris", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["CAD", "coronary artery disease", "atherosclerosis", "IHD"] },
    { code: "I25.119", shortDesc: "ASHD of native coronary artery with unspecified angina", longDesc: "Atherosclerotic heart disease of native coronary artery with unspecified angina pectoris", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["CAD", "angina", "IHD", "coronary disease"] },
    { code: "I26.99", shortDesc: "Other pulmonary embolism without acute cor pulmonale", longDesc: "Other pulmonary embolism without acute cor pulmonale", chapterId: "09", isBillable: true, commonSpecialties: ["Pulmonology", "Cardiology", "Critical Care"], keywords: ["PE", "pulmonary embolism", "blood clot lung"] },
    { code: "I27.0", shortDesc: "Primary pulmonary hypertension", longDesc: "Primary pulmonary hypertension", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Pulmonology"], keywords: ["pulmonary hypertension", "PAH", "IPAH"] },
    { code: "I34.0", shortDesc: "Nonrheumatic mitral (valve) insufficiency", longDesc: "Nonrheumatic mitral (valve) insufficiency", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["mitral regurgitation", "MR", "mitral valve", "MVP"] },
    { code: "I35.0", shortDesc: "Nonrheumatic aortic (valve) stenosis", longDesc: "Nonrheumatic aortic (valve) stenosis", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["aortic stenosis", "AS", "aortic valve"] },
    { code: "I42.0", shortDesc: "Dilated cardiomyopathy", longDesc: "Dilated cardiomyopathy", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["DCM", "dilated cardiomyopathy", "cardiomyopathy"] },
    { code: "I42.9", shortDesc: "Cardiomyopathy, unspecified", longDesc: "Cardiomyopathy, unspecified", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["cardiomyopathy"] },
    { code: "I48.0", shortDesc: "Paroxysmal atrial fibrillation", longDesc: "Paroxysmal atrial fibrillation", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["afib", "atrial fibrillation", "AF", "PAF"] },
    { code: "I48.91", shortDesc: "Unspecified atrial fibrillation", longDesc: "Unspecified atrial fibrillation", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["afib", "atrial fibrillation", "AF", "irregular heartbeat"] },
    { code: "I50.9", shortDesc: "Heart failure, unspecified", longDesc: "Heart failure, unspecified", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["heart failure", "CHF", "congestive heart failure", "HF"] },
    { code: "I50.22", shortDesc: "Chronic systolic (congestive) heart failure", longDesc: "Chronic systolic (congestive) heart failure", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["systolic heart failure", "HFrEF", "CHF"] },
    { code: "I50.32", shortDesc: "Chronic diastolic (congestive) heart failure", longDesc: "Chronic diastolic (congestive) heart failure", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["diastolic heart failure", "HFpEF", "CHF"] },
    { code: "I63.9", shortDesc: "Cerebral infarction, unspecified", longDesc: "Cerebral infarction, unspecified", chapterId: "09", isBillable: true, commonSpecialties: ["Neurology", "Internal Medicine"], keywords: ["stroke", "CVA", "cerebral infarction", "brain attack"] },
    { code: "I65.29", shortDesc: "Occlusion and stenosis of carotid artery", longDesc: "Occlusion and stenosis of unspecified carotid artery", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Neurology", "Vascular Surgery"], keywords: ["carotid stenosis", "carotid occlusion"] },
    { code: "I67.9", shortDesc: "Cerebrovascular disease, unspecified", longDesc: "Cerebrovascular disease, unspecified", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Neurology"], keywords: ["cerebrovascular", "CVD"] },
    { code: "I70.0", shortDesc: "Atherosclerosis of aorta", longDesc: "Atherosclerosis of aorta", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology", "Vascular Surgery"], keywords: ["aortic atherosclerosis", "hardening of arteries"] },
    { code: "I73.9", shortDesc: "Peripheral vascular disease, unspecified", longDesc: "Peripheral vascular disease, unspecified", chapterId: "09", isBillable: true, isChronic: true, commonSpecialties: ["Vascular Surgery", "Cardiology"], keywords: ["PVD", "PAD", "peripheral vascular disease", "claudication"] },
    { code: "I80.10", shortDesc: "Phlebitis and thrombophlebitis of femoral vein", longDesc: "Phlebitis and thrombophlebitis of unspecified femoral vein", chapterId: "09", isBillable: true, commonSpecialties: ["Vascular Surgery", "Internal Medicine"], keywords: ["femoral DVT", "phlebitis", "thrombophlebitis"] },
    { code: "I82.409", shortDesc: "Acute embolism and thrombosis of unspecified deep veins of lower extremity", longDesc: "Acute embolism and thrombosis of unspecified deep veins of unspecified lower extremity", chapterId: "09", isBillable: true, commonSpecialties: ["Vascular Surgery", "Internal Medicine", "Hematology"], keywords: ["DVT", "deep vein thrombosis", "blood clot leg"] },

    // ─── Respiratory (Chapter 10) ───
    { code: "J00", shortDesc: "Acute nasopharyngitis [common cold]", longDesc: "Acute nasopharyngitis [common cold]", chapterId: "10", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["common cold", "cold", "coryza", "runny nose"] },
    { code: "J01.90", shortDesc: "Acute sinusitis, unspecified", longDesc: "Acute sinusitis, unspecified", chapterId: "10", isBillable: true, commonSpecialties: ["ENT", "Internal Medicine"], keywords: ["sinusitis", "sinus infection"] },
    { code: "J02.9", shortDesc: "Acute pharyngitis, unspecified", longDesc: "Acute pharyngitis, unspecified", chapterId: "10", isBillable: true, commonSpecialties: ["ENT", "Internal Medicine", "Pediatrics"], keywords: ["pharyngitis", "sore throat", "throat infection"] },
    { code: "J03.90", shortDesc: "Acute tonsillitis, unspecified", longDesc: "Acute tonsillitis, unspecified", chapterId: "10", isBillable: true, commonSpecialties: ["ENT", "Pediatrics"], keywords: ["tonsillitis", "tonsil infection"] },
    { code: "J06.9", shortDesc: "Acute upper respiratory infection, unspecified", longDesc: "Acute upper respiratory infection, unspecified (Upper respiratory disease NOS)", chapterId: "10", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["URTI", "upper respiratory infection", "cold", "cough"] },
    { code: "J11.1", shortDesc: "Influenza with other respiratory manifestations", longDesc: "Influenza due to unidentified influenza virus with other respiratory manifestations", chapterId: "10", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["flu", "influenza", "viral"] },
    { code: "J12.9", shortDesc: "Viral pneumonia, unspecified", longDesc: "Viral pneumonia, unspecified", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["viral pneumonia", "pneumonia"] },
    { code: "J15.9", shortDesc: "Unspecified bacterial pneumonia", longDesc: "Unspecified bacterial pneumonia", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["bacterial pneumonia", "pneumonia"] },
    { code: "J18.9", shortDesc: "Pneumonia, unspecified organism", longDesc: "Pneumonia, unspecified organism", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine", "Pediatrics"], keywords: ["pneumonia", "lung infection", "CAP"] },
    { code: "J20.9", shortDesc: "Acute bronchitis, unspecified", longDesc: "Acute bronchitis, unspecified", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine", "Pediatrics"], keywords: ["bronchitis", "chest cold", "cough"] },
    { code: "J30.1", shortDesc: "Allergic rhinitis due to pollen", longDesc: "Allergic rhinitis due to pollen (Hay fever)", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["ENT", "Allergy"], keywords: ["hay fever", "pollen allergy", "allergic rhinitis"] },
    { code: "J30.9", shortDesc: "Allergic rhinitis, unspecified", longDesc: "Allergic rhinitis, unspecified", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["ENT", "Allergy", "Internal Medicine"], keywords: ["allergic rhinitis", "nasal allergy", "rhinitis"] },
    { code: "J32.9", shortDesc: "Chronic sinusitis, unspecified", longDesc: "Chronic sinusitis, unspecified", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["ENT"], keywords: ["chronic sinusitis", "sinus problems"] },
    { code: "J35.01", shortDesc: "Chronic tonsillitis", longDesc: "Chronic tonsillitis", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["ENT", "Pediatrics"], keywords: ["chronic tonsillitis", "recurrent tonsillitis"] },
    { code: "J40", shortDesc: "Bronchitis, not specified as acute or chronic", longDesc: "Bronchitis, not specified as acute or chronic", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["bronchitis"] },
    { code: "J42", shortDesc: "Unspecified chronic bronchitis", longDesc: "Unspecified chronic bronchitis", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology"], keywords: ["chronic bronchitis", "COPD"] },
    { code: "J44.1", shortDesc: "Chronic obstructive pulmonary disease with acute exacerbation", longDesc: "Chronic obstructive pulmonary disease with (acute) exacerbation", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["COPD exacerbation", "AECOPD", "COPD flare"] },
    { code: "J44.9", shortDesc: "Chronic obstructive pulmonary disease, unspecified", longDesc: "Chronic obstructive pulmonary disease, unspecified", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["COPD", "chronic bronchitis", "emphysema"] },
    { code: "J45.20", shortDesc: "Mild intermittent asthma, uncomplicated", longDesc: "Mild intermittent asthma, uncomplicated", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Internal Medicine", "Pediatrics"], keywords: ["mild asthma", "intermittent asthma"] },
    { code: "J45.30", shortDesc: "Mild persistent asthma, uncomplicated", longDesc: "Mild persistent asthma, uncomplicated", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology"], keywords: ["mild persistent asthma"] },
    { code: "J45.40", shortDesc: "Moderate persistent asthma, uncomplicated", longDesc: "Moderate persistent asthma, uncomplicated", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology"], keywords: ["moderate asthma"] },
    { code: "J45.50", shortDesc: "Severe persistent asthma, uncomplicated", longDesc: "Severe persistent asthma, uncomplicated", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology"], keywords: ["severe asthma"] },
    { code: "J45.901", shortDesc: "Unspecified asthma with (acute) exacerbation", longDesc: "Unspecified asthma with (acute) exacerbation", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Emergency Medicine"], keywords: ["asthma attack", "asthma exacerbation", "acute asthma"] },
    { code: "J45.909", shortDesc: "Unspecified asthma, uncomplicated", longDesc: "Unspecified asthma, uncomplicated", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology", "Internal Medicine", "Pediatrics"], keywords: ["asthma", "bronchial asthma", "wheezing"] },
    { code: "J84.10", shortDesc: "Pulmonary fibrosis, unspecified", longDesc: "Pulmonary fibrosis, unspecified", chapterId: "10", isBillable: true, isChronic: true, commonSpecialties: ["Pulmonology"], keywords: ["pulmonary fibrosis", "lung fibrosis", "ILD"] },
    { code: "J90", shortDesc: "Pleural effusion, not elsewhere classified", longDesc: "Pleural effusion, not elsewhere classified", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine"], keywords: ["pleural effusion", "fluid in lungs", "hydrothorax"] },
    { code: "J96.00", shortDesc: "Acute respiratory failure, unspecified", longDesc: "Acute respiratory failure, unspecified whether with hypoxia or hypercapnia", chapterId: "10", isBillable: true, commonSpecialties: ["Pulmonology", "Critical Care"], keywords: ["respiratory failure", "acute respiratory failure", "ARF"] },

    // ─── Gastrointestinal (Chapter 11) ───
    { code: "K21.0", shortDesc: "Gastro-esophageal reflux disease with esophagitis", longDesc: "Gastro-esophageal reflux disease with esophagitis", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["GERD", "reflux", "heartburn", "esophagitis"] },
    { code: "K21.9", shortDesc: "Gastro-esophageal reflux disease without esophagitis", longDesc: "Gastro-esophageal reflux disease without esophagitis", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["GERD", "acid reflux", "heartburn"] },
    { code: "K25.9", shortDesc: "Gastric ulcer, unspecified", longDesc: "Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["gastric ulcer", "stomach ulcer", "PUD"] },
    { code: "K26.9", shortDesc: "Duodenal ulcer, unspecified", longDesc: "Duodenal ulcer, unspecified as acute or chronic, without hemorrhage or perforation", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["duodenal ulcer", "PUD", "peptic ulcer"] },
    { code: "K29.70", shortDesc: "Gastritis, unspecified, without bleeding", longDesc: "Gastritis, unspecified, without bleeding", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["gastritis", "stomach inflammation"] },
    { code: "K30", shortDesc: "Functional dyspepsia", longDesc: "Functional dyspepsia (Indigestion)", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["dyspepsia", "indigestion", "upset stomach"] },
    { code: "K35.80", shortDesc: "Unspecified acute appendicitis", longDesc: "Unspecified acute appendicitis", chapterId: "11", isBillable: true, commonSpecialties: ["Surgery", "Emergency Medicine"], keywords: ["appendicitis", "acute appendicitis"] },
    { code: "K40.90", shortDesc: "Unilateral inguinal hernia without obstruction or gangrene", longDesc: "Unilateral inguinal hernia, without obstruction or gangrene, not specified as recurrent", chapterId: "11", isBillable: true, commonSpecialties: ["Surgery"], keywords: ["inguinal hernia", "groin hernia"] },
    { code: "K50.90", shortDesc: "Crohn's disease, unspecified, without complications", longDesc: "Crohn's disease, unspecified, without complications", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology"], keywords: ["crohns", "crohn disease", "IBD", "inflammatory bowel"] },
    { code: "K51.90", shortDesc: "Ulcerative colitis, unspecified, without complications", longDesc: "Ulcerative colitis, unspecified, without complications", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology"], keywords: ["ulcerative colitis", "UC", "IBD", "colitis"] },
    { code: "K57.30", shortDesc: "Diverticulosis of large intestine without perforation or abscess", longDesc: "Diverticulosis of large intestine without perforation or abscess without bleeding", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Surgery"], keywords: ["diverticulosis", "diverticula"] },
    { code: "K58.9", shortDesc: "Irritable bowel syndrome without diarrhea", longDesc: "Irritable bowel syndrome without diarrhea", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["IBS", "irritable bowel", "spastic colon"] },
    { code: "K59.00", shortDesc: "Constipation, unspecified", longDesc: "Constipation, unspecified", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["constipation"] },
    { code: "K64.9", shortDesc: "Unspecified hemorrhoids", longDesc: "Unspecified hemorrhoids", chapterId: "11", isBillable: true, commonSpecialties: ["Surgery", "Gastroenterology"], keywords: ["hemorrhoids", "piles"] },
    { code: "K70.30", shortDesc: "Alcoholic cirrhosis of liver without ascites", longDesc: "Alcoholic cirrhosis of liver without ascites", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Hepatology"], keywords: ["alcoholic cirrhosis", "cirrhosis", "liver disease"] },
    { code: "K74.60", shortDesc: "Unspecified cirrhosis of liver", longDesc: "Unspecified cirrhosis of liver", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Hepatology"], keywords: ["cirrhosis", "liver cirrhosis", "chronic liver disease"] },
    { code: "K76.0", shortDesc: "Fatty (change of) liver, not elsewhere classified", longDesc: "Fatty (change of) liver, not elsewhere classified", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["fatty liver", "NAFLD", "steatosis", "hepatic steatosis"] },
    { code: "K80.20", shortDesc: "Calculus of gallbladder without cholecystitis", longDesc: "Calculus of gallbladder without cholecystitis without obstruction", chapterId: "11", isBillable: true, commonSpecialties: ["Surgery", "Gastroenterology"], keywords: ["gallstones", "cholelithiasis", "gallbladder stones"] },
    { code: "K81.0", shortDesc: "Acute cholecystitis", longDesc: "Acute cholecystitis", chapterId: "11", isBillable: true, commonSpecialties: ["Surgery", "Gastroenterology"], keywords: ["cholecystitis", "gallbladder inflammation", "acute cholecystitis"] },
    { code: "K85.90", shortDesc: "Acute pancreatitis without necrosis or infection, unspecified", longDesc: "Acute pancreatitis without necrosis or infection, unspecified", chapterId: "11", isBillable: true, commonSpecialties: ["Gastroenterology", "Surgery"], keywords: ["pancreatitis", "acute pancreatitis"] },
    { code: "K86.1", shortDesc: "Other chronic pancreatitis", longDesc: "Other chronic pancreatitis", chapterId: "11", isBillable: true, isChronic: true, commonSpecialties: ["Gastroenterology"], keywords: ["chronic pancreatitis"] },

    // ─── Musculoskeletal (Chapter 13) ───
    { code: "M06.9", shortDesc: "Rheumatoid arthritis, unspecified", longDesc: "Rheumatoid arthritis, unspecified", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Rheumatology", "Internal Medicine"], keywords: ["rheumatoid arthritis", "RA", "joint inflammation"] },
    { code: "M10.9", shortDesc: "Gout, unspecified", longDesc: "Gout, unspecified", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Rheumatology", "Internal Medicine"], keywords: ["gout", "gouty arthritis", "uric acid"] },
    { code: "M17.9", shortDesc: "Osteoarthritis of knee, unspecified", longDesc: "Osteoarthritis of knee, unspecified", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Orthopedics", "Rheumatology"], keywords: ["knee OA", "osteoarthritis knee", "knee arthritis", "degenerative joint"] },
    { code: "M19.90", shortDesc: "Unspecified osteoarthritis, unspecified site", longDesc: "Unspecified osteoarthritis, unspecified site", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Orthopedics", "Rheumatology"], keywords: ["osteoarthritis", "OA", "degenerative arthritis"] },
    { code: "M25.50", shortDesc: "Pain in unspecified joint", longDesc: "Pain in unspecified joint", chapterId: "13", isBillable: true, commonSpecialties: ["Orthopedics", "Rheumatology", "Internal Medicine"], keywords: ["joint pain", "arthralgia"] },
    { code: "M32.9", shortDesc: "Systemic lupus erythematosus, unspecified", longDesc: "Systemic lupus erythematosus, unspecified", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Rheumatology"], keywords: ["lupus", "SLE", "systemic lupus"] },
    { code: "M47.816", shortDesc: "Spondylosis without myelopathy or radiculopathy, lumbar region", longDesc: "Spondylosis without myelopathy or radiculopathy, lumbar region", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Orthopedics", "Neurology"], keywords: ["lumbar spondylosis", "spine degeneration", "degenerative spine"] },
    { code: "M54.16", shortDesc: "Radiculopathy, lumbar region", longDesc: "Radiculopathy, lumbar region", chapterId: "13", isBillable: true, commonSpecialties: ["Orthopedics", "Neurology", "Pain Medicine"], keywords: ["lumbar radiculopathy", "sciatica", "nerve root compression"] },
    { code: "M54.2", shortDesc: "Cervicalgia", longDesc: "Cervicalgia (Neck pain)", chapterId: "13", isBillable: true, commonSpecialties: ["Orthopedics", "Internal Medicine"], keywords: ["neck pain", "cervicalgia", "cervical pain"] },
    { code: "M54.5", shortDesc: "Low back pain", longDesc: "Low back pain (Lumbago NOS)", chapterId: "13", isBillable: true, commonSpecialties: ["Orthopedics", "Internal Medicine"], keywords: ["low back pain", "LBP", "lumbago", "backache"] },
    { code: "M54.9", shortDesc: "Dorsalgia, unspecified", longDesc: "Dorsalgia, unspecified (Back pain NOS)", chapterId: "13", isBillable: true, commonSpecialties: ["Orthopedics", "Internal Medicine"], keywords: ["back pain", "dorsalgia"] },
    { code: "M79.3", shortDesc: "Panniculitis, unspecified", longDesc: "Panniculitis, unspecified", chapterId: "13", isBillable: true, commonSpecialties: ["Rheumatology", "Dermatology"], keywords: ["panniculitis", "fat inflammation"] },
    { code: "M81.0", shortDesc: "Age-related osteoporosis without current pathological fracture", longDesc: "Age-related osteoporosis without current pathological fracture", chapterId: "13", isBillable: true, isChronic: true, commonSpecialties: ["Endocrinology", "Rheumatology", "Orthopedics"], keywords: ["osteoporosis", "bone loss", "brittle bones"] },

    // ─── Genitourinary (Chapter 14) ───
    { code: "N17.9", shortDesc: "Acute kidney failure, unspecified", longDesc: "Acute kidney failure, unspecified", chapterId: "14", isBillable: true, commonSpecialties: ["Nephrology", "Critical Care"], keywords: ["AKI", "acute kidney injury", "acute renal failure", "ARF"] },
    { code: "N18.3", shortDesc: "Chronic kidney disease, stage 3", longDesc: "Chronic kidney disease, stage 3 (moderate)", chapterId: "14", isBillable: true, isChronic: true, commonSpecialties: ["Nephrology"], keywords: ["CKD stage 3", "moderate CKD", "chronic kidney disease"] },
    { code: "N18.4", shortDesc: "Chronic kidney disease, stage 4", longDesc: "Chronic kidney disease, stage 4 (severe)", chapterId: "14", isBillable: true, isChronic: true, commonSpecialties: ["Nephrology"], keywords: ["CKD stage 4", "severe CKD"] },
    { code: "N18.5", shortDesc: "Chronic kidney disease, stage 5", longDesc: "Chronic kidney disease, stage 5", chapterId: "14", isBillable: true, isChronic: true, commonSpecialties: ["Nephrology"], keywords: ["CKD stage 5", "ESRD", "end stage renal disease", "dialysis"] },
    { code: "N18.6", shortDesc: "End stage renal disease", longDesc: "End stage renal disease (ESRD requiring chronic dialysis)", chapterId: "14", isBillable: true, isChronic: true, commonSpecialties: ["Nephrology"], keywords: ["ESRD", "end stage", "dialysis", "kidney failure"] },
    { code: "N18.9", shortDesc: "Chronic kidney disease, unspecified", longDesc: "Chronic kidney disease, unspecified", chapterId: "14", isBillable: true, isChronic: true, commonSpecialties: ["Nephrology", "Internal Medicine"], keywords: ["CKD", "chronic kidney disease", "chronic renal"] },
    { code: "N20.0", shortDesc: "Calculus of kidney", longDesc: "Calculus of kidney", chapterId: "14", isBillable: true, commonSpecialties: ["Urology", "Nephrology"], keywords: ["kidney stone", "renal calculus", "nephrolithiasis"] },
    { code: "N20.1", shortDesc: "Calculus of ureter", longDesc: "Calculus of ureter", chapterId: "14", isBillable: true, commonSpecialties: ["Urology"], keywords: ["ureteral stone", "ureteric calculus"] },
    { code: "N30.00", shortDesc: "Acute cystitis without hematuria", longDesc: "Acute cystitis without hematuria", chapterId: "14", isBillable: true, commonSpecialties: ["Urology", "Internal Medicine"], keywords: ["cystitis", "bladder infection", "UTI"] },
    { code: "N39.0", shortDesc: "Urinary tract infection, site not specified", longDesc: "Urinary tract infection, site not specified", chapterId: "14", isBillable: true, commonSpecialties: ["Urology", "Internal Medicine", "Pediatrics"], keywords: ["UTI", "urinary infection", "urine infection"] },
    { code: "N40.0", shortDesc: "Benign prostatic hyperplasia without lower urinary tract symptoms", longDesc: "Benign prostatic hyperplasia without lower urinary tract symptoms", chapterId: "14", isBillable: true, isChronic: true, sexSpecific: "M", commonSpecialties: ["Urology"], keywords: ["BPH", "enlarged prostate", "benign prostatic hyperplasia"] },
    { code: "N40.1", shortDesc: "Benign prostatic hyperplasia with lower urinary tract symptoms", longDesc: "Benign prostatic hyperplasia with lower urinary tract symptoms", chapterId: "14", isBillable: true, isChronic: true, sexSpecific: "M", commonSpecialties: ["Urology"], keywords: ["BPH with LUTS", "prostate enlargement"] },
    { code: "N73.9", shortDesc: "Female pelvic inflammatory disease, unspecified", longDesc: "Female pelvic inflammatory disease, unspecified", chapterId: "14", isBillable: true, sexSpecific: "F", commonSpecialties: ["Gynecology"], keywords: ["PID", "pelvic inflammatory disease"] },
    { code: "N80.9", shortDesc: "Endometriosis, unspecified", longDesc: "Endometriosis, unspecified", chapterId: "14", isBillable: true, isChronic: true, sexSpecific: "F", commonSpecialties: ["Gynecology"], keywords: ["endometriosis"] },
    { code: "N83.20", shortDesc: "Unspecified ovarian cysts", longDesc: "Unspecified ovarian cysts", chapterId: "14", isBillable: true, sexSpecific: "F", commonSpecialties: ["Gynecology"], keywords: ["ovarian cyst", "ovary cyst"] },
    { code: "N92.0", shortDesc: "Excessive and frequent menstruation with regular cycle", longDesc: "Excessive and frequent menstruation with regular cycle (Menorrhagia NOS)", chapterId: "14", isBillable: true, sexSpecific: "F", commonSpecialties: ["Gynecology"], keywords: ["menorrhagia", "heavy periods", "excessive bleeding"] },
    { code: "N95.1", shortDesc: "Menopausal and female climacteric states", longDesc: "Menopausal and female climacteric states (Symptoms such as flushing, sleeplessness, headache)", chapterId: "14", isBillable: true, sexSpecific: "F", commonSpecialties: ["Gynecology"], keywords: ["menopause", "climacteric", "hot flashes"] },

    // ─── Pregnancy (Chapter 15) ───
    { code: "O09.90", shortDesc: "Supervision of high risk pregnancy, unspecified, unspecified trimester", longDesc: "Supervision of high risk pregnancy, unspecified, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["high risk pregnancy"] },
    { code: "O10.019", shortDesc: "Pre-existing essential hypertension complicating pregnancy", longDesc: "Pre-existing essential hypertension complicating pregnancy, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["hypertension pregnancy", "HTN pregnancy"] },
    { code: "O13.9", shortDesc: "Gestational hypertension without significant proteinuria", longDesc: "Gestational [pregnancy-induced] hypertension without significant proteinuria, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["gestational hypertension", "PIH"] },
    { code: "O14.90", shortDesc: "Unspecified pre-eclampsia, unspecified trimester", longDesc: "Unspecified pre-eclampsia, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["preeclampsia", "pre-eclampsia", "toxemia"] },
    { code: "O24.419", shortDesc: "Gestational diabetes mellitus in pregnancy, unspecified control", longDesc: "Gestational diabetes mellitus in pregnancy, unspecified control, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["GDM", "gestational diabetes", "diabetes in pregnancy"] },
    { code: "O26.843", shortDesc: "Uterine size-date discrepancy, third trimester", longDesc: "Uterine size-date discrepancy, third trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["size-date discrepancy", "fundal height"] },
    { code: "O34.219", shortDesc: "Maternal care for unspecified type scar from previous cesarean delivery", longDesc: "Maternal care for unspecified type scar from previous cesarean delivery, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["previous cesarean", "previous LSCS", "scar pregnancy"] },
    { code: "O36.8090", shortDesc: "Pregnancy with inconclusive fetal viability, not applicable", longDesc: "Pregnancy with inconclusive fetal viability, not applicable or unspecified", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["fetal viability", "pregnancy viability"] },
    { code: "O42.90", shortDesc: "Premature rupture of membranes, unspecified", longDesc: "Premature rupture of membranes, unspecified as to length of time between rupture and onset of labor, unspecified weeks of gestation", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["PROM", "premature rupture", "water broke"] },
    { code: "O60.10X0", shortDesc: "Preterm labor with preterm delivery, unspecified", longDesc: "Preterm labor with preterm delivery, unspecified trimester, not applicable or unspecified", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["preterm labor", "premature labor", "PTL"] },
    { code: "O80", shortDesc: "Encounter for full-term uncomplicated delivery", longDesc: "Encounter for full-term uncomplicated delivery (Single live born infant delivered vaginally)", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["normal delivery", "NVD", "vaginal delivery"] },
    { code: "O82", shortDesc: "Encounter for cesarean delivery without indication", longDesc: "Encounter for cesarean delivery without indication", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["cesarean", "LSCS", "c-section"] },
    { code: "O99.019", shortDesc: "Anemia complicating pregnancy, unspecified trimester", longDesc: "Anemia complicating pregnancy, unspecified trimester", chapterId: "15", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["anemia in pregnancy", "pregnancy anemia"] },

    // ─── Perinatal/Pediatric (Chapter 16) ───
    { code: "P07.39", shortDesc: "Preterm newborn, unspecified weeks of gestation", longDesc: "Preterm newborn, gestational age 28 completed weeks or more but less than 32 completed weeks", chapterId: "16", isBillable: true, isPediatric: true, isNewborn: true, commonSpecialties: ["Neonatology", "Pediatrics"], keywords: ["preterm", "premature baby", "preterm newborn"] },
    { code: "P22.0", shortDesc: "Respiratory distress syndrome of newborn", longDesc: "Respiratory distress syndrome of newborn", chapterId: "16", isBillable: true, isPediatric: true, isNewborn: true, commonSpecialties: ["Neonatology"], keywords: ["RDS", "respiratory distress", "HMD", "hyaline membrane disease"] },
    { code: "P59.9", shortDesc: "Neonatal jaundice, unspecified", longDesc: "Neonatal jaundice, unspecified", chapterId: "16", isBillable: true, isPediatric: true, isNewborn: true, commonSpecialties: ["Neonatology", "Pediatrics"], keywords: ["neonatal jaundice", "newborn jaundice", "hyperbilirubinemia"] },
    { code: "P36.9", shortDesc: "Bacterial sepsis of newborn, unspecified", longDesc: "Bacterial sepsis of newborn, unspecified", chapterId: "16", isBillable: true, isPediatric: true, isNewborn: true, commonSpecialties: ["Neonatology"], keywords: ["neonatal sepsis", "newborn sepsis"] },

    // ─── Symptoms & Signs (Chapter 18) ───
    { code: "R00.0", shortDesc: "Tachycardia, unspecified", longDesc: "Tachycardia, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Cardiology", "Internal Medicine"], keywords: ["tachycardia", "fast heart rate", "rapid heartbeat"] },
    { code: "R05.9", shortDesc: "Cough, unspecified", longDesc: "Cough, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Pulmonology", "Internal Medicine", "Pediatrics"], keywords: ["cough", "coughing"] },
    { code: "R06.02", shortDesc: "Shortness of breath", longDesc: "Shortness of breath", chapterId: "18", isBillable: true, commonSpecialties: ["Pulmonology", "Cardiology", "Emergency Medicine"], keywords: ["shortness of breath", "dyspnea", "SOB", "breathlessness"] },
    { code: "R07.9", shortDesc: "Chest pain, unspecified", longDesc: "Chest pain, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Cardiology", "Emergency Medicine"], keywords: ["chest pain", "thoracic pain"] },
    { code: "R10.9", shortDesc: "Unspecified abdominal pain", longDesc: "Unspecified abdominal pain", chapterId: "18", isBillable: true, commonSpecialties: ["Gastroenterology", "Surgery", "Internal Medicine"], keywords: ["abdominal pain", "stomach pain", "belly pain"] },
    { code: "R11.2", shortDesc: "Nausea with vomiting, unspecified", longDesc: "Nausea with vomiting, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine"], keywords: ["nausea", "vomiting", "N/V"] },
    { code: "R19.7", shortDesc: "Diarrhea, unspecified", longDesc: "Diarrhea, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Gastroenterology", "Internal Medicine", "Pediatrics"], keywords: ["diarrhea", "loose stools"] },
    { code: "R21", shortDesc: "Rash and other nonspecific skin eruption", longDesc: "Rash and other nonspecific skin eruption", chapterId: "18", isBillable: true, commonSpecialties: ["Dermatology", "Internal Medicine"], keywords: ["rash", "skin eruption"] },
    { code: "R42", shortDesc: "Dizziness and giddiness", longDesc: "Dizziness and giddiness (Vertigo NOS)", chapterId: "18", isBillable: true, commonSpecialties: ["Neurology", "ENT", "Internal Medicine"], keywords: ["dizziness", "vertigo", "giddiness", "lightheaded"] },
    { code: "R50.9", shortDesc: "Fever, unspecified", longDesc: "Fever, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["fever", "pyrexia", "febrile", "temperature"] },
    { code: "R51.9", shortDesc: "Headache, unspecified", longDesc: "Headache, unspecified", chapterId: "18", isBillable: true, commonSpecialties: ["Neurology", "Internal Medicine"], keywords: ["headache", "cephalgia", "head pain"] },
    { code: "R53.83", shortDesc: "Other fatigue", longDesc: "Other fatigue (Lethargy, Tiredness)", chapterId: "18", isBillable: true, commonSpecialties: ["Internal Medicine"], keywords: ["fatigue", "tiredness", "weakness", "lethargy"] },
    { code: "R55", shortDesc: "Syncope and collapse", longDesc: "Syncope and collapse (Blackout, Fainting)", chapterId: "18", isBillable: true, commonSpecialties: ["Cardiology", "Neurology", "Emergency Medicine"], keywords: ["syncope", "fainting", "collapse", "blackout", "LOC"] },
    { code: "R57.2", shortDesc: "Septic shock", longDesc: "Septic shock", chapterId: "18", isBillable: true, commonSpecialties: ["Critical Care", "Emergency Medicine"], keywords: ["septic shock", "shock", "sepsis"] },
    { code: "R63.4", shortDesc: "Abnormal weight loss", longDesc: "Abnormal weight loss", chapterId: "18", isBillable: true, commonSpecialties: ["Internal Medicine", "Oncology"], keywords: ["weight loss", "losing weight", "cachexia"] },
    { code: "R73.03", shortDesc: "Prediabetes", longDesc: "Prediabetes (Impaired fasting glucose)", chapterId: "18", isBillable: true, commonSpecialties: ["Endocrinology", "Internal Medicine"], keywords: ["prediabetes", "impaired glucose", "borderline diabetes"] },

    // ─── Injuries (Chapter 19) ───
    { code: "S06.0X0A", shortDesc: "Concussion without loss of consciousness, initial encounter", longDesc: "Concussion without loss of consciousness, initial encounter", chapterId: "19", isBillable: true, commonSpecialties: ["Emergency Medicine", "Neurology"], keywords: ["concussion", "head injury", "TBI"] },
    { code: "S22.42XA", shortDesc: "Displaced fracture of lateral end of clavicle, initial encounter", longDesc: "Displaced fracture of lateral end of unspecified clavicle, initial encounter for closed fracture", chapterId: "19", isBillable: true, commonSpecialties: ["Orthopedics", "Emergency Medicine"], keywords: ["clavicle fracture", "collarbone fracture"] },
    { code: "S42.201A", shortDesc: "Unspecified fracture of upper end of humerus, initial encounter", longDesc: "Unspecified fracture of upper end of right humerus, initial encounter for closed fracture", chapterId: "19", isBillable: true, commonSpecialties: ["Orthopedics"], keywords: ["humerus fracture", "arm fracture"] },
    { code: "S52.509A", shortDesc: "Unspecified fracture of the lower end of radius, initial", longDesc: "Unspecified fracture of the lower end of unspecified radius, initial encounter for closed fracture", chapterId: "19", isBillable: true, commonSpecialties: ["Orthopedics", "Emergency Medicine"], keywords: ["distal radius fracture", "wrist fracture", "colles fracture"] },
    { code: "S72.001A", shortDesc: "Fracture of unspecified part of neck of femur, initial", longDesc: "Fracture of unspecified part of neck of right femur, initial encounter for closed fracture", chapterId: "19", isBillable: true, commonSpecialties: ["Orthopedics"], keywords: ["hip fracture", "femur neck fracture", "NOF fracture"] },
    { code: "S82.001A", shortDesc: "Unspecified fracture of patella, initial encounter", longDesc: "Unspecified fracture of right patella, initial encounter for closed fracture", chapterId: "19", isBillable: true, commonSpecialties: ["Orthopedics"], keywords: ["patella fracture", "kneecap fracture"] },
    { code: "S83.511A", shortDesc: "Sprain of anterior cruciate ligament, initial encounter", longDesc: "Sprain of anterior cruciate ligament of right knee, initial encounter", chapterId: "19", isBillable: true, commonSpecialties: ["Orthopedics"], keywords: ["ACL injury", "ACL tear", "ACL sprain", "knee ligament"] },
    { code: "T78.40XA", shortDesc: "Allergy, unspecified, initial encounter", longDesc: "Allergy, unspecified, initial encounter", chapterId: "19", isBillable: true, commonSpecialties: ["Allergy", "Internal Medicine", "Emergency Medicine"], keywords: ["allergy", "allergic reaction"] },
    { code: "T81.4XXA", shortDesc: "Infection following a procedure, initial encounter", longDesc: "Infection following a procedure, initial encounter", chapterId: "19", isBillable: true, commonSpecialties: ["Surgery", "Internal Medicine"], keywords: ["post-op infection", "surgical site infection", "SSI"] },

    // ─── Health Status (Chapter 21) ───
    { code: "Z00.00", shortDesc: "Encounter for general adult medical examination without abnormal findings", longDesc: "Encounter for general adult medical examination without abnormal findings", chapterId: "21", isBillable: true, commonSpecialties: ["Internal Medicine"], keywords: ["annual physical", "health checkup", "wellness exam"] },
    { code: "Z00.129", shortDesc: "Encounter for routine child health examination without abnormal findings", longDesc: "Encounter for routine child health examination without abnormal findings", chapterId: "21", isBillable: true, isPediatric: true, commonSpecialties: ["Pediatrics"], keywords: ["well child visit", "pediatric checkup"] },
    { code: "Z01.818", shortDesc: "Encounter for other preprocedural examination", longDesc: "Encounter for other preprocedural examination (Pre-operative evaluation)", chapterId: "21", isBillable: true, commonSpecialties: ["Surgery", "Internal Medicine", "Anesthesiology"], keywords: ["preoperative", "pre-op", "clearance"] },
    { code: "Z23", shortDesc: "Encounter for immunization", longDesc: "Encounter for immunization", chapterId: "21", isBillable: true, commonSpecialties: ["Internal Medicine", "Pediatrics"], keywords: ["vaccination", "immunization", "vaccine"] },
    { code: "Z34.90", shortDesc: "Encounter for supervision of normal pregnancy, unspecified trimester", longDesc: "Encounter for supervision of normal pregnancy, unspecified trimester", chapterId: "21", isBillable: true, sexSpecific: "F", isMaternity: true, commonSpecialties: ["Obstetrics"], keywords: ["prenatal visit", "antenatal care", "ANC"] },
    { code: "Z38.00", shortDesc: "Single liveborn infant, delivered vaginally", longDesc: "Single liveborn infant, delivered vaginally", chapterId: "21", isBillable: true, isPediatric: true, isNewborn: true, commonSpecialties: ["Neonatology", "Pediatrics"], keywords: ["newborn", "liveborn", "vaginal delivery"] },
    { code: "Z38.01", shortDesc: "Single liveborn infant, delivered by cesarean", longDesc: "Single liveborn infant, delivered by cesarean", chapterId: "21", isBillable: true, isPediatric: true, isNewborn: true, commonSpecialties: ["Neonatology", "Pediatrics"], keywords: ["newborn", "liveborn", "cesarean baby"] },
    { code: "Z71.3", shortDesc: "Dietary counseling and surveillance", longDesc: "Dietary counseling and surveillance", chapterId: "21", isBillable: true, commonSpecialties: ["Internal Medicine", "Endocrinology"], keywords: ["dietary counseling", "nutrition", "diet advice"] },
    { code: "Z86.79", shortDesc: "Personal history of other diseases of the circulatory system", longDesc: "Personal history of other diseases of the circulatory system", chapterId: "21", isBillable: true, commonSpecialties: ["Cardiology"], keywords: ["history of heart disease", "cardiac history"] },
    { code: "Z87.39", shortDesc: "Personal history of other diseases of the musculoskeletal system", longDesc: "Personal history of other diseases of the musculoskeletal system and connective tissue", chapterId: "21", isBillable: true, commonSpecialties: ["Orthopedics", "Rheumatology"], keywords: ["orthopedic history", "musculoskeletal history"] },
    { code: "Z95.1", shortDesc: "Presence of aortocoronary bypass graft", longDesc: "Presence of aortocoronary bypass graft", chapterId: "21", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["CABG", "bypass", "coronary bypass", "post-CABG"] },
    { code: "Z95.5", shortDesc: "Presence of coronary angioplasty implant and graft", longDesc: "Presence of coronary angioplasty implant and graft", chapterId: "21", isBillable: true, isChronic: true, commonSpecialties: ["Cardiology"], keywords: ["stent", "PTCA", "angioplasty", "PCI", "coronary stent"] },
    { code: "Z96.641", shortDesc: "Presence of right artificial hip joint", longDesc: "Presence of right artificial hip joint", chapterId: "21", isBillable: true, commonSpecialties: ["Orthopedics"], keywords: ["hip replacement", "THR", "hip prosthesis"] },
    { code: "Z96.651", shortDesc: "Presence of right artificial knee joint", longDesc: "Presence of right artificial knee joint", chapterId: "21", isBillable: true, commonSpecialties: ["Orthopedics"], keywords: ["knee replacement", "TKR", "knee prosthesis"] },
    { code: "Z99.2", shortDesc: "Dependence on renal dialysis", longDesc: "Dependence on renal dialysis (Hemodialysis status, Peritoneal dialysis status)", chapterId: "21", isBillable: true, isChronic: true, commonSpecialties: ["Nephrology"], keywords: ["dialysis", "hemodialysis", "peritoneal dialysis", "ESRD"] },

    // ─── COVID-19 (Chapter 22) ───
    { code: "U07.1", shortDesc: "COVID-19", longDesc: "COVID-19 (virus identified)", chapterId: "22", isBillable: true, commonSpecialties: ["Internal Medicine", "Pulmonology", "Critical Care"], keywords: ["covid", "covid-19", "coronavirus", "SARS-CoV-2"] },
  ];

  // Insert in batches to avoid memory issues
  const batchSize = 50;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    await db.insert(s.icd10Codes).values(batch).onConflictDoNothing();
  }
  console.log(`  ✓ ${codes.length} ICD-10-CM codes`);

  // ── Specialty Favorites ────────────────────────────────────────────────
  const specialtyFavorites = [
    // Internal Medicine
    { specialty: "Internal Medicine", icdCode: "I10", displayOrder: 1 },
    { specialty: "Internal Medicine", icdCode: "E11.9", displayOrder: 2 },
    { specialty: "Internal Medicine", icdCode: "E78.5", displayOrder: 3 },
    { specialty: "Internal Medicine", icdCode: "J06.9", displayOrder: 4 },
    { specialty: "Internal Medicine", icdCode: "A09", displayOrder: 5 },
    { specialty: "Internal Medicine", icdCode: "R50.9", displayOrder: 6 },
    { specialty: "Internal Medicine", icdCode: "K21.0", displayOrder: 7 },
    { specialty: "Internal Medicine", icdCode: "N39.0", displayOrder: 8 },
    { specialty: "Internal Medicine", icdCode: "D50.9", displayOrder: 9 },
    { specialty: "Internal Medicine", icdCode: "E03.9", displayOrder: 10 },
    // Cardiology
    { specialty: "Cardiology", icdCode: "I10", displayOrder: 1 },
    { specialty: "Cardiology", icdCode: "I25.10", displayOrder: 2 },
    { specialty: "Cardiology", icdCode: "I50.9", displayOrder: 3 },
    { specialty: "Cardiology", icdCode: "I48.91", displayOrder: 4 },
    { specialty: "Cardiology", icdCode: "I21.4", displayOrder: 5 },
    { specialty: "Cardiology", icdCode: "I20.9", displayOrder: 6 },
    { specialty: "Cardiology", icdCode: "I35.0", displayOrder: 7 },
    { specialty: "Cardiology", icdCode: "E78.5", displayOrder: 8 },
    // Pediatrics
    { specialty: "Pediatrics", icdCode: "J06.9", displayOrder: 1 },
    { specialty: "Pediatrics", icdCode: "J18.9", displayOrder: 2 },
    { specialty: "Pediatrics", icdCode: "A09", displayOrder: 3 },
    { specialty: "Pediatrics", icdCode: "R50.9", displayOrder: 4 },
    { specialty: "Pediatrics", icdCode: "J45.909", displayOrder: 5 },
    { specialty: "Pediatrics", icdCode: "A90", displayOrder: 6 },
    { specialty: "Pediatrics", icdCode: "D50.9", displayOrder: 7 },
    // Obstetrics
    { specialty: "Obstetrics", icdCode: "O80", displayOrder: 1 },
    { specialty: "Obstetrics", icdCode: "Z34.90", displayOrder: 2 },
    { specialty: "Obstetrics", icdCode: "O24.419", displayOrder: 3 },
    { specialty: "Obstetrics", icdCode: "O14.90", displayOrder: 4 },
    { specialty: "Obstetrics", icdCode: "O82", displayOrder: 5 },
    { specialty: "Obstetrics", icdCode: "O99.019", displayOrder: 6 },
    // Gastroenterology
    { specialty: "Gastroenterology", icdCode: "K21.0", displayOrder: 1 },
    { specialty: "Gastroenterology", icdCode: "K76.0", displayOrder: 2 },
    { specialty: "Gastroenterology", icdCode: "K58.9", displayOrder: 3 },
    { specialty: "Gastroenterology", icdCode: "K29.70", displayOrder: 4 },
    { specialty: "Gastroenterology", icdCode: "K80.20", displayOrder: 5 },
    // Pulmonology
    { specialty: "Pulmonology", icdCode: "J45.909", displayOrder: 1 },
    { specialty: "Pulmonology", icdCode: "J44.9", displayOrder: 2 },
    { specialty: "Pulmonology", icdCode: "J18.9", displayOrder: 3 },
    { specialty: "Pulmonology", icdCode: "A15.0", displayOrder: 4 },
    { specialty: "Pulmonology", icdCode: "J47.33", displayOrder: 5 },
    // Nephrology
    { specialty: "Nephrology", icdCode: "N18.9", displayOrder: 1 },
    { specialty: "Nephrology", icdCode: "N17.9", displayOrder: 2 },
    { specialty: "Nephrology", icdCode: "N18.5", displayOrder: 3 },
    { specialty: "Nephrology", icdCode: "I12.9", displayOrder: 4 },
    { specialty: "Nephrology", icdCode: "E11.22", displayOrder: 5 },
    // Orthopedics
    { specialty: "Orthopedics", icdCode: "M54.5", displayOrder: 1 },
    { specialty: "Orthopedics", icdCode: "M17.9", displayOrder: 2 },
    { specialty: "Orthopedics", icdCode: "S83.511A", displayOrder: 3 },
    { specialty: "Orthopedics", icdCode: "S72.001A", displayOrder: 4 },
    { specialty: "Orthopedics", icdCode: "M54.16", displayOrder: 5 },
    // Emergency Medicine
    { specialty: "Emergency Medicine", icdCode: "R07.9", displayOrder: 1 },
    { specialty: "Emergency Medicine", icdCode: "R10.9", displayOrder: 2 },
    { specialty: "Emergency Medicine", icdCode: "R06.02", displayOrder: 3 },
    { specialty: "Emergency Medicine", icdCode: "R55", displayOrder: 4 },
    { specialty: "Emergency Medicine", icdCode: "I21.4", displayOrder: 5 },
  ];

  await db.insert(s.icd10SpecialtyFavorites).values(specialtyFavorites).onConflictDoNothing();
  console.log(`  ✓ ${specialtyFavorites.length} specialty favorites`);

  console.log("✅ ICD-10 seed complete!");
}

// Export for use in main seed script
export default seedIcd10Data;
