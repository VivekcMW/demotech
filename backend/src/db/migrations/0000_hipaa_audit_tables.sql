CREATE TYPE "public"."appointment_status" AS ENUM('Scheduled', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No Show');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('Operational', 'Under Maintenance', 'Retired', 'Faulty');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('Draft', 'Pending', 'Paid', 'Partial', 'Cancelled', 'Refunded');--> statement-breakpoint
CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."call_status" AS ENUM('Scheduled', 'Ringing', 'In-Progress', 'Completed', 'Missed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('Submitted', 'Approved', 'Rejected', 'Pending Review', 'Settled');--> statement-breakpoint
CREATE TYPE "public"."encounter_type" AS ENUM('OPD', 'IPD', 'Emergency', 'Telemedicine');--> statement-breakpoint
CREATE TYPE "public"."lab_status" AS ENUM('Ordered', 'Collected', 'Processing', 'Completed', 'Verified', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."rx_status" AS ENUM('Pending', 'Verified', 'Dispensing', 'Dispensed', 'Partially Dispensed', 'On Hold', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('M', 'F', 'O');--> statement-breakpoint
CREATE TYPE "public"."shift" AS ENUM('Day', 'Night', 'Rotating');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('Active', 'On Leave', 'Inactive');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"doctor_id" text,
	"department" text NOT NULL,
	"datetime" timestamp NOT NULL,
	"duration" integer DEFAULT 15 NOT NULL,
	"status" "appointment_status" DEFAULT 'Scheduled' NOT NULL,
	"reason" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"model" text,
	"serial_no" text,
	"department" text,
	"location" text,
	"purchase_date" date,
	"warranty_expiry" date,
	"last_maintenance" date,
	"next_maintenance" date,
	"status" "asset_status" DEFAULT 'Operational' NOT NULL,
	"vendor" text,
	"cost" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_role" text NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"record_id" text,
	"outcome" text NOT NULL,
	"request_id" text,
	"ip_address" text,
	"path" text,
	"details" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"total" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance" numeric(10, 2) NOT NULL,
	"status" "billing_status" DEFAULT 'Pending' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payment_mode" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cardio_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"echocardiogram" jsonb,
	"stress_test" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY NOT NULL,
	"bill_id" text NOT NULL,
	"insurer" text NOT NULL,
	"policy_no" text,
	"claimed_amount" numeric(10, 2),
	"approved_amount" numeric(10, 2),
	"status" "claim_status" DEFAULT 'Submitted' NOT NULL,
	"submitted_at" timestamp,
	"settled_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "cme_records" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"course_name" text NOT NULL,
	"provider" text,
	"type" text,
	"credits" integer DEFAULT 0 NOT NULL,
	"date" date,
	"completed" boolean DEFAULT false NOT NULL,
	"expiry_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnoses" (
	"id" text PRIMARY KEY NOT NULL,
	"encounter_id" text NOT NULL,
	"icd_code" text NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'Primary' NOT NULL,
	"certainty" text DEFAULT 'Confirmed' NOT NULL,
	"present_on_admission" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecg_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"waveform" jsonb,
	"measurements" jsonb,
	"interpretation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"doctor_id" text,
	"department" text NOT NULL,
	"datetime" timestamp DEFAULT now() NOT NULL,
	"type" "encounter_type" DEFAULT 'OPD' NOT NULL,
	"chief_complaint" text,
	"diagnosis" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icd10_categories" (
	"code" text PRIMARY KEY NOT NULL,
	"chapter_id" text NOT NULL,
	"title" text NOT NULL,
	"includes" text,
	"excludes1" text,
	"excludes2" text
);
--> statement-breakpoint
CREATE TABLE "icd10_chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"roman_numeral" text NOT NULL,
	"title" text NOT NULL,
	"code_range_start" text NOT NULL,
	"code_range_end" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icd10_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"short_desc" text NOT NULL,
	"long_desc" text NOT NULL,
	"category_code" text,
	"chapter_id" text NOT NULL,
	"is_billable" boolean DEFAULT true NOT NULL,
	"is_chronic" boolean DEFAULT false NOT NULL,
	"is_comorbidity" boolean DEFAULT false NOT NULL,
	"is_pediatric" boolean DEFAULT false NOT NULL,
	"is_maternity" boolean DEFAULT false NOT NULL,
	"is_newborn" boolean DEFAULT false NOT NULL,
	"age_range" text,
	"sex_specific" text,
	"manifestation_code" boolean DEFAULT false NOT NULL,
	"poa" text,
	"hcc_category" text,
	"common_specialties" text[],
	"keywords" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icd10_pcs_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"body_system" text NOT NULL,
	"root_operation" text NOT NULL,
	"body_part" text NOT NULL,
	"approach" text NOT NULL,
	"device" text,
	"qualifier" text,
	"short_desc" text NOT NULL,
	"long_desc" text NOT NULL,
	"common_specialties" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icd10_specialty_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialty" text NOT NULL,
	"icd_code" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imaging_studies" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"study_uid" text,
	"modality" text,
	"description" text,
	"series_count" integer,
	"dicom_metadata" jsonb,
	"report" text,
	"radiologist_id" text,
	"status" text DEFAULT 'Ordered' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"department" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"reorder_qty" integer,
	"location" text,
	"vendor" text,
	"unit_cost" integer,
	"last_restocked" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"encounter_id" text,
	"patient_id" text NOT NULL,
	"doctor_id" text,
	"test_id" text NOT NULL,
	"status" "lab_status" DEFAULT 'Ordered' NOT NULL,
	"priority" text DEFAULT 'Routine' NOT NULL,
	"collected_at" timestamp,
	"collected_by" text,
	"resulted_at" timestamp,
	"resulted_by" text,
	"result" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_test_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"sample_type" text,
	"container" text,
	"parameters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price" integer,
	"turnaround_hours" integer,
	"instructions" text
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"ip_address" text NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nephrology_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"dialysis" jsonb,
	"ckd" jsonb,
	"ktv" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obgyn_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"partograph" jsonb,
	"ctg" jsonb,
	"fetal_growth" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oncology_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"chemo_regimen" jsonb,
	"toxicities" jsonb,
	"recist" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"uhid" text NOT NULL,
	"abha_id" text,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"dob" date NOT NULL,
	"sex" "sex" NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"phone" text NOT NULL,
	"alt_phone" text,
	"address" text,
	"id_proof_type" text,
	"id_proof_number" text,
	"email" text,
	"occupation" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"allergies" text[],
	"chronic_conditions" text[],
	"insurance_provider" text,
	"insurance_policy_no" text,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"last_visit" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_uhid_unique" UNIQUE("uhid")
);
--> statement-breakpoint
CREATE TABLE "pft_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"flow_loop" jsonb,
	"abg" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"encounter_id" text,
	"patient_id" text NOT NULL,
	"doctor_id" text,
	"status" "rx_status" DEFAULT 'Pending' NOT NULL,
	"notes" text,
	"received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rx_items" (
	"id" text PRIMARY KEY NOT NULL,
	"prescription_id" text NOT NULL,
	"drug_code" text NOT NULL,
	"drug_name" text NOT NULL,
	"dosage" text NOT NULL,
	"route" text,
	"frequency" text NOT NULL,
	"duration" text,
	"quantity" integer,
	"instructions" text
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL,
	"department" text NOT NULL,
	"qualification" text,
	"experience" integer,
	"phone" text,
	"email" text,
	"join_date" date,
	"status" "staff_status" DEFAULT 'Active' NOT NULL,
	"shift" "shift" DEFAULT 'Day' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teleconsultations" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"doctor_id" text,
	"scheduled_at" timestamp NOT NULL,
	"scheduled_duration" integer DEFAULT 15 NOT NULL,
	"call_status" "call_status" DEFAULT 'Scheduled' NOT NULL,
	"call_started_at" timestamp,
	"call_ended_at" timestamp,
	"actual_duration" integer,
	"reason" text,
	"notes" text,
	"video_enabled" boolean DEFAULT false,
	"audio_enabled" boolean DEFAULT false,
	"is_recording" boolean DEFAULT false,
	"screen_share" boolean DEFAULT false,
	"prescriptions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'doctor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vitals" (
	"id" text PRIMARY KEY NOT NULL,
	"encounter_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"bp_systolic" integer,
	"bp_diastolic" integer,
	"hr" integer,
	"rr" integer,
	"temp" numeric(4, 1),
	"spo2" integer,
	"weight" numeric(5, 1),
	"height" numeric(5, 1),
	"bmi" numeric(4, 1),
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_staff_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing" ADD CONSTRAINT "billing_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing" ADD CONSTRAINT "billing_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cardio_records" ADD CONSTRAINT "cardio_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cardio_records" ADD CONSTRAINT "cardio_records_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_bill_id_billing_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."billing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cme_records" ADD CONSTRAINT "cme_records_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_icd_code_icd10_codes_code_fk" FOREIGN KEY ("icd_code") REFERENCES "public"."icd10_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecg_records" ADD CONSTRAINT "ecg_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecg_records" ADD CONSTRAINT "ecg_records_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_doctor_id_staff_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icd10_categories" ADD CONSTRAINT "icd10_categories_chapter_id_icd10_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."icd10_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icd10_specialty_favorites" ADD CONSTRAINT "icd10_specialty_favorites_icd_code_icd10_codes_code_fk" FOREIGN KEY ("icd_code") REFERENCES "public"."icd10_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_radiologist_id_staff_id_fk" FOREIGN KEY ("radiologist_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_staff_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_test_id_lab_test_catalog_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."lab_test_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nephrology_records" ADD CONSTRAINT "nephrology_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nephrology_records" ADD CONSTRAINT "nephrology_records_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obgyn_records" ADD CONSTRAINT "obgyn_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obgyn_records" ADD CONSTRAINT "obgyn_records_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oncology_records" ADD CONSTRAINT "oncology_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oncology_records" ADD CONSTRAINT "oncology_records_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pft_records" ADD CONSTRAINT "pft_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pft_records" ADD CONSTRAINT "pft_records_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_staff_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rx_items" ADD CONSTRAINT "rx_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teleconsultations" ADD CONSTRAINT "teleconsultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teleconsultations" ADD CONSTRAINT "teleconsultations_doctor_id_staff_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_appt_patient" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_appt_date" ON "appointments" USING btree ("datetime");--> statement-breakpoint
CREATE INDEX "idx_appt_status" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_asset_status" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_record" ON "audit_logs" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "idx_bill_patient" ON "billing" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bill_status" ON "billing" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cardio_patient" ON "cardio_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cme_staff" ON "cme_records" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_diag_encounter" ON "diagnoses" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_diag_icd" ON "diagnoses" USING btree ("icd_code");--> statement-breakpoint
CREATE INDEX "idx_ecg_patient" ON "ecg_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_enc_patient" ON "encounters" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_enc_datetime" ON "encounters" USING btree ("datetime");--> statement-breakpoint
CREATE INDEX "idx_icd10_cat_chapter" ON "icd10_categories" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "idx_icd10_short_desc" ON "icd10_codes" USING btree ("short_desc");--> statement-breakpoint
CREATE INDEX "idx_icd10_chapter" ON "icd10_codes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "idx_icd10_billable" ON "icd10_codes" USING btree ("is_billable");--> statement-breakpoint
CREATE INDEX "idx_icd10_chronic" ON "icd10_codes" USING btree ("is_chronic");--> statement-breakpoint
CREATE INDEX "idx_icd10_pcs_section" ON "icd10_pcs_codes" USING btree ("section");--> statement-breakpoint
CREATE INDEX "idx_icd10_pcs_root_op" ON "icd10_pcs_codes" USING btree ("root_operation");--> statement-breakpoint
CREATE INDEX "idx_icd10_fav_specialty" ON "icd10_specialty_favorites" USING btree ("specialty");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_icd10_fav_unique" ON "icd10_specialty_favorites" USING btree ("specialty","icd_code");--> statement-breakpoint
CREATE INDEX "idx_img_patient" ON "imaging_studies" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_inv_dept" ON "inventory" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_inv_reorder" ON "inventory" USING btree ("stock");--> statement-breakpoint
CREATE INDEX "idx_lab_patient" ON "lab_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_lab_status" ON "lab_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_login_email_time" ON "login_attempts" USING btree ("email","attempted_at");--> statement-breakpoint
CREATE INDEX "idx_login_ip_time" ON "login_attempts" USING btree ("ip_address","attempted_at");--> statement-breakpoint
CREATE INDEX "idx_neph_patient" ON "nephrology_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_obgyn_patient" ON "obgyn_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_onc_patient" ON "oncology_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patients_uhid" ON "patients" USING btree ("uhid");--> statement-breakpoint
CREATE INDEX "idx_patients_abha" ON "patients" USING btree ("abha_id");--> statement-breakpoint
CREATE INDEX "idx_pft_patient" ON "pft_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_rx_patient" ON "prescriptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_rx_status" ON "prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rx_item_prescription" ON "rx_items" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_staff_dept" ON "staff" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_tel_patient" ON "teleconsultations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_tel_status" ON "teleconsultations" USING btree ("call_status");--> statement-breakpoint
CREATE INDEX "idx_vitals_encounter" ON "vitals" USING btree ("encounter_id");