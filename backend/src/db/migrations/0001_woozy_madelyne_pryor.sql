CREATE TABLE "alert_notification_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_type" text NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cds_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text,
	"encounter_id" text,
	"prescription_id" text,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drug_interaction_cache" (
	"drug_code" text PRIMARY KEY NOT NULL,
	"cache_data" jsonb NOT NULL,
	"cached_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drug_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"drug_code_1" text NOT NULL,
	"drug_name_1" text NOT NULL,
	"drug_code_2" text NOT NULL,
	"drug_name_2" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"mechanism" text,
	"management" text,
	"source" text DEFAULT 'rxnav' NOT NULL,
	"last_verified" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fhir_conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"encounter_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"resource" jsonb NOT NULL,
	"search_code" text,
	"search_clinical_status" text,
	"search_verification_status" text,
	"search_category" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fhir_diagnostic_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"ehr_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"resource" jsonb NOT NULL,
	"search_code" text,
	"search_category" text,
	"search_date" text,
	"search_status" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fhir_diagnostic_reports_ehr_id_unique" UNIQUE("ehr_id")
);
--> statement-breakpoint
CREATE TABLE "fhir_encounters" (
	"id" text PRIMARY KEY NOT NULL,
	"ehr_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"resource" jsonb NOT NULL,
	"search_date" text,
	"search_type" text,
	"search_status" text,
	"search_department" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fhir_encounters_ehr_id_unique" UNIQUE("ehr_id")
);
--> statement-breakpoint
CREATE TABLE "fhir_endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"protocol" text NOT NULL,
	"host" text NOT NULL,
	"port" integer,
	"path" text,
	"username" text,
	"encrypted_password" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"last_tested_at" timestamp,
	"last_connected_at" timestamp,
	"error_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fhir_imaging_studies" (
	"id" text PRIMARY KEY NOT NULL,
	"ehr_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"resource" jsonb NOT NULL,
	"search_modality" text,
	"search_date" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fhir_imaging_studies_ehr_id_unique" UNIQUE("ehr_id")
);
--> statement-breakpoint
CREATE TABLE "fhir_integration_log" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"direction" text NOT NULL,
	"message_type" text,
	"resource_type" text,
	"resource_id" text,
	"status" text NOT NULL,
	"request_body" text,
	"response_body" text,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fhir_medication_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"ehr_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"resource" jsonb NOT NULL,
	"search_status" text,
	"search_medication" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fhir_medication_requests_ehr_id_unique" UNIQUE("ehr_id")
);
--> statement-breakpoint
CREATE TABLE "fhir_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"ehr_source" text NOT NULL,
	"ehr_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"resource" jsonb NOT NULL,
	"search_code" text,
	"search_category" text,
	"search_date" text,
	"search_status" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fhir_patients" (
	"id" text PRIMARY KEY NOT NULL,
	"ehr_id" text NOT NULL,
	"resource" jsonb NOT NULL,
	"search_name" text,
	"search_given" text,
	"search_family" text,
	"search_identifier" text,
	"search_birth_date" text,
	"search_gender" text,
	"search_phone" text,
	"search_abha" text,
	"version_id" integer DEFAULT 1 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fhir_patients_ehr_id_unique" UNIQUE("ehr_id")
);
--> statement-breakpoint
CREATE TABLE "fhir_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"resource_type" text NOT NULL,
	"criteria" text,
	"reason" text,
	"channel_type" text NOT NULL,
	"channel_endpoint" text NOT NULL,
	"channel_headers" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"last_delivered_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loinc_codes" (
	"loinc_num" text PRIMARY KEY NOT NULL,
	"component" text NOT NULL,
	"property" text NOT NULL,
	"time_aspect" text,
	"system" text,
	"scale_type" text,
	"method_type" text,
	"short_name" text,
	"long_common_name" text,
	"class_type" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nabh_committee_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"committee" text NOT NULL,
	"meeting_date" date NOT NULL,
	"chairperson" text,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"agenda" jsonb DEFAULT '[]'::jsonb,
	"minutes" text,
	"decisions" jsonb DEFAULT '[]'::jsonb,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"associated_report_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nabh_evidence_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"nabh_standard" text,
	"period_start" date,
	"period_end" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"package" jsonb NOT NULL,
	"generated_by" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"exported_at" timestamp,
	"format" text DEFAULT 'json',
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nabh_indicator_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"nabh_standard" text NOT NULL,
	"description" text NOT NULL,
	"numerator_desc" text NOT NULL,
	"denominator_desc" text NOT NULL,
	"target_rate" numeric(5, 2),
	"computation_type" text NOT NULL,
	"data_source" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nabh_indicator_values" (
	"id" text PRIMARY KEY NOT NULL,
	"indicator_id" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"period_type" text NOT NULL,
	"numerator" numeric(10, 2) NOT NULL,
	"denominator" numeric(10, 2) NOT NULL,
	"rate" numeric(8, 2) NOT NULL,
	"department" text,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nabh_registers" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"patient_id" text,
	"encounter_id" text,
	"patient_name" text,
	"recorded_by" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"details" jsonb NOT NULL,
	"register_number" text,
	"notified_to" text,
	"notification_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_test_catalog" ADD COLUMN "loinc_code" text;--> statement-breakpoint
ALTER TABLE "lab_test_catalog" ADD COLUMN "critical_thresholds" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_alert_id_cds_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."cds_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cds_alerts" ADD CONSTRAINT "cds_alerts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cds_alerts" ADD CONSTRAINT "cds_alerts_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cds_alerts" ADD CONSTRAINT "cds_alerts_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_conditions" ADD CONSTRAINT "fhir_conditions_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_conditions" ADD CONSTRAINT "fhir_conditions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_diagnostic_reports" ADD CONSTRAINT "fhir_diagnostic_reports_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_diagnostic_reports" ADD CONSTRAINT "fhir_diagnostic_reports_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_encounters" ADD CONSTRAINT "fhir_encounters_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_imaging_studies" ADD CONSTRAINT "fhir_imaging_studies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_imaging_studies" ADD CONSTRAINT "fhir_imaging_studies_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_medication_requests" ADD CONSTRAINT "fhir_medication_requests_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_medication_requests" ADD CONSTRAINT "fhir_medication_requests_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_observations" ADD CONSTRAINT "fhir_observations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_observations" ADD CONSTRAINT "fhir_observations_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fhir_patients" ADD CONSTRAINT "fhir_patients_ehr_id_patients_id_fk" FOREIGN KEY ("ehr_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nabh_indicator_values" ADD CONSTRAINT "nabh_indicator_values_indicator_id_nabh_indicator_definitions_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."nabh_indicator_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nabh_registers" ADD CONSTRAINT "nabh_registers_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nabh_registers" ADD CONSTRAINT "nabh_registers_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cds_alert_patient" ON "cds_alerts" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cds_alert_type" ON "cds_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "idx_cds_alert_created" ON "cds_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ddi_pair" ON "drug_interactions" USING btree ("drug_code_1","drug_code_2");--> statement-breakpoint
CREATE INDEX "idx_ddi_drug1" ON "drug_interactions" USING btree ("drug_code_1");--> statement-breakpoint
CREATE INDEX "idx_ddi_drug2" ON "drug_interactions" USING btree ("drug_code_2");--> statement-breakpoint
CREATE INDEX "idx_fhir_cond_patient" ON "fhir_conditions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_cond_code" ON "fhir_conditions" USING btree ("search_code");--> statement-breakpoint
CREATE INDEX "idx_fhir_dr_patient" ON "fhir_diagnostic_reports" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_dr_code" ON "fhir_diagnostic_reports" USING btree ("search_code");--> statement-breakpoint
CREATE INDEX "idx_fhir_dr_date" ON "fhir_diagnostic_reports" USING btree ("search_date");--> statement-breakpoint
CREATE INDEX "idx_fhir_enc_patient" ON "fhir_encounters" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_enc_date" ON "fhir_encounters" USING btree ("search_date");--> statement-breakpoint
CREATE INDEX "idx_fhir_img_patient" ON "fhir_imaging_studies" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_img_modality" ON "fhir_imaging_studies" USING btree ("search_modality");--> statement-breakpoint
CREATE INDEX "idx_fhir_log_source" ON "fhir_integration_log" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_fhir_log_status" ON "fhir_integration_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fhir_log_created" ON "fhir_integration_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_fhir_med_patient" ON "fhir_medication_requests" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_med_status" ON "fhir_medication_requests" USING btree ("search_status");--> statement-breakpoint
CREATE INDEX "idx_fhir_obs_patient" ON "fhir_observations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_obs_code" ON "fhir_observations" USING btree ("search_code");--> statement-breakpoint
CREATE INDEX "idx_fhir_obs_date" ON "fhir_observations" USING btree ("search_date");--> statement-breakpoint
CREATE INDEX "idx_fhir_obs_ehr" ON "fhir_observations" USING btree ("ehr_source","ehr_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_pat_search_name" ON "fhir_patients" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "idx_fhir_pat_search_identifier" ON "fhir_patients" USING btree ("search_identifier");--> statement-breakpoint
CREATE INDEX "idx_fhir_pat_search_abha" ON "fhir_patients" USING btree ("search_abha");--> statement-breakpoint
CREATE INDEX "idx_fhir_pat_search_birthdate" ON "fhir_patients" USING btree ("search_birth_date");--> statement-breakpoint
CREATE INDEX "idx_fhir_pat_ehr" ON "fhir_patients" USING btree ("ehr_id");--> statement-breakpoint
CREATE INDEX "idx_loinc_component" ON "loinc_codes" USING btree ("component");--> statement-breakpoint
CREATE INDEX "idx_loinc_class" ON "loinc_codes" USING btree ("class_type");--> statement-breakpoint
CREATE INDEX "idx_nabh_committee_date" ON "nabh_committee_reports" USING btree ("meeting_date");--> statement-breakpoint
CREATE INDEX "idx_nabh_committee_type" ON "nabh_committee_reports" USING btree ("committee");--> statement-breakpoint
CREATE INDEX "idx_nabh_val_indicator" ON "nabh_indicator_values" USING btree ("indicator_id");--> statement-breakpoint
CREATE INDEX "idx_nabh_val_period" ON "nabh_indicator_values" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_nabh_val_dept" ON "nabh_indicator_values" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_nabh_reg_type" ON "nabh_registers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_nabh_reg_date" ON "nabh_registers" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_nabh_reg_patient" ON "nabh_registers" USING btree ("patient_id");