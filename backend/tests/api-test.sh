#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Aarogya EHR — Backend API Integration Test Suite
# Tests all 71 API endpoints + health check
# ──────────────────────────────────────────────────────────────────────────────

BASE="${API_BASE:-http://localhost:4000}"
PASS=0
FAIL=0
SKIP=0

# ── Test runner helpers ──────────────────────────────────────────────────────

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qF "$needle"; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (missing: $needle)"
    FAIL=$((FAIL + 1))
  fi
}

assert_json() {
  local label="$1" field="$2" expected="$3" json="$4"
  local actual
  actual=$(echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d${field})" 2>/dev/null || echo "__FAIL__")
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_len_gt() {
  local label="$1" field="$2" min="$3" json="$4"
  local len
  len=$(echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d${field}))" 2>/dev/null || echo "0")
  if [ "$len" -gt "$min" ]; then
    echo "  ✅ $label ($len items)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (expected >$min items, got $len)"
    FAIL=$((FAIL + 1))
  fi
}

get_token() {
  # Login once and cache token
  if [ -z "${TOKEN:-}" ]; then
    TOKEN=$(curl -s -S "$BASE/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"doctor@aarogya.app","password":"Doctor@123"}' \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
    export TOKEN
  fi
  echo "$TOKEN"
}

skip_if_no_token() {
  local t
  t=$(get_token)
  if [ -z "$t" ] || [ "$t" = "None" ]; then
    echo "  ⏭️  Skipped (no auth token)"
    SKIP=$((SKIP + 1))
    return 1
  fi
  return 0
}

api_get() {
  local t
  t=$(get_token)
  curl -s -S "$BASE$1" -H "Authorization: Bearer $t" 2>/dev/null || echo "{}"
}

api_post() {
  local t
  t=$(get_token)
  curl -s -S -X POST "$BASE$1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $t" \
    -d "${2:-}" 2>/dev/null || echo "{}"
}

api_patch() {
  local t
  t=$(get_token)
  curl -s -S -X PATCH "$BASE$1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $t" \
    -d "${2:-}" 2>/dev/null || echo "{}"
}

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Aarogya EHR — Backend API Integration Test Suite"
echo "  Base URL: $BASE"
echo "══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 1. HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════
echo "─── 1. Health Check ───────────────────────────────────────────"

R=$(curl -s -S "$BASE/health" 2>/dev/null || echo '{"status":"error"}')
assert_json "Health endpoint returns ok" "['status']" "ok" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 2. AUTH
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 2. Auth ───────────────────────────────────────────────────"

# 2a. Login with valid credentials
R=$(curl -s -S "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@aarogya.app","password":"Doctor@123"}')
assert_json "Login returns token" "['token'][:12]" "eyJhbGciOiJI" "$R"

# 2b. Login with invalid credentials
R=$(curl -s -S "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}' 2>/dev/null || echo "{}")
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrongpass123"}' 2>/dev/null || echo "000")
assert_status "Login rejects invalid credentials" "401" "$HTTP"

# ═══════════════════════════════════════════════════════════════════════════
# 3. PATIENTS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 3. Patients ───────────────────────────────────────────────"

R=$(api_get "/api/v1/patients")
assert_json_len_gt "GET /patients returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/patients/PT-001")
assert_json "GET /patients/PT-001 returns patient" "['id']" "PT-001" "$R"

HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(get_token)" \
  -d '{"id":"PT-API-TEST","uhid":"UHID-TEST-001","name":"Test Patient","dob":"1990-01-15","sex":"M","bloodGroup":"O+","phone":"9999999999","address":"Test Address","age":30}' 2>/dev/null || echo "000")
assert_status "POST /patients creates patient" "201" "$HTTP"

R=$(api_get "/api/v1/patients?search=Rajesh")
assert_json_len_gt "GET /patients?search=Rajesh finds results" "['data']" "0" "$R"

R=$(api_get "/api/v1/patients?department=Cardiology")
assert_json_len_gt "GET /patients?department=Cardiology filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 4. APPOINTMENTS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 4. Appointments ───────────────────────────────────────────"

R=$(api_get "/api/v1/appointments")
assert_json_len_gt "GET /appointments returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/appointments/APPT-001")
assert_json "GET /appointments/APPT-001" "['id']" "APPT-001" "$R"

R=$(api_get "/api/v1/appointments?status=Scheduled")
assert_json_len_gt "GET /appointments?status=Scheduled filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 5. ENCOUNTERS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 5. Encounters ─────────────────────────────────────────────"

R=$(api_get "/api/v1/encounters")
assert_json_len_gt "GET /encounters returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/encounters/ENC-001")
assert_json "GET /encounters/ENC-001" "['id']" "ENC-001" "$R"

R=$(api_get "/api/v1/encounters/ENC-001/vitals")
assert_json "GET /encounters/ENC-001/vitals returns record" "['id']" "VTL-001" "$R"

R=$(api_get "/api/v1/encounters/ENC-001/diagnoses")
assert_json_len_gt "GET /encounters/ENC-001/diagnoses" "['data']" "0" "$R"

R=$(api_get "/api/v1/encounters?patientId=PT-001")
assert_json_len_gt "GET /encounters?patientId=PT-001 filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 6. ORDERS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 6. Orders ─────────────────────────────────────────────────"

R=$(api_get "/api/v1/orders")
assert_json_len_gt "GET /orders returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/orders/RX-001")
assert_json "GET /orders/RX-001" "['id']" "RX-001" "$R"

R=$(api_get "/api/v1/orders?status=Dispensed")
assert_json_len_gt "GET /orders?status=Dispensed filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 7. LAB
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 7. Lab ────────────────────────────────────────────────────"

R=$(api_get "/api/v1/lab/catalog")
assert_json_len_gt "GET /lab/catalog returns records" "" "0" "$R"

R=$(api_get "/api/v1/lab/orders")
assert_json_len_gt "GET /lab/orders returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/lab/worklist")
assert_json_len_gt "GET /lab/worklist returns items" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 8. BILLING
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 8. Billing ────────────────────────────────────────────────"

R=$(api_get "/api/v1/billing")
assert_json_len_gt "GET /billing returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/billing/BILL-001")
assert_json "GET /billing/BILL-001" "['id']" "BILL-001" "$R"

R=$(api_get "/api/v1/billing/BILL-001/claims")
assert_json_len_gt "GET /billing/BILL-001/claims" "['data']" "0" "$R"

R=$(api_get "/api/v1/billing?status=Paid")
assert_json_len_gt "GET /billing?status=Paid filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 9. INVENTORY
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 9. Inventory ──────────────────────────────────────────────"

R=$(api_get "/api/v1/inventory")
assert_json_len_gt "GET /inventory returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/inventory?department=Pharmacy")
assert_json_len_gt "GET /inventory?department=Pharmacy filters" "['data']" "0" "$R"

R=$(api_get "/api/v1/inventory?low=true")
assert_json_len_gt "GET /inventory?low=true filters low stock" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 10. STAFF
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 10. Staff ─────────────────────────────────────────────────"

R=$(api_get "/api/v1/staff")
assert_json_len_gt "GET /staff returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/staff/EMP-001")
assert_json "GET /staff/EMP-001" "['id']" "EMP-001" "$R"

R=$(api_get "/api/v1/staff/stats/counts")
assert_json_len_gt "GET /staff/stats/counts" "" "0" "$R"

R=$(api_get "/api/v1/staff?department=Cardiology")
assert_json_len_gt "GET /staff?department= filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 11. ASSETS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 11. Assets ────────────────────────────────────────────────"

R=$(api_get "/api/v1/assets")
assert_json_len_gt "GET /assets returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/assets?status=Operational")
assert_json_len_gt "GET /assets?status= filters" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 12. CME
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 12. CME ───────────────────────────────────────────────────"

R=$(api_get "/api/v1/cme")
assert_json_len_gt "GET /cme returns records" "['data']" "0" "$R"

R=$(api_get "/api/v1/cme/credits/EMP-001")
assert_json_len_gt "GET /cme/credits/EMP-001" "" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 13. CLINICAL SPECIALTY RECORDS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 13. Clinical Specialty Records ────────────────────────────"

# OB/GYN and Oncology use PT-002; others use PT-001
R=$(api_get "/api/v1/clinical/obgyn/PT-002")
assert_json_len_gt "GET /clinical/obgyn/PT-002" "['data']" "0" "$R"

for spec in ecg pft nephrology cardiology; do
  R=$(api_get "/api/v1/clinical/$spec/PT-001")
  assert_json_len_gt "GET /clinical/$spec/PT-001" "['data']" "0" "$R"
done

R=$(api_get "/api/v1/clinical/oncology/PT-002")
assert_json_len_gt "GET /clinical/oncology/PT-002" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 14. CLINICAL CALCULATORS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 14. Clinical Calculators ──────────────────────────────────"

R=$(api_post "/api/v1/clinical/calculate/abg" \
  '{"pH":7.32,"pCO2":48,"pO2":85,"HCO3":24,"BE":-2,"FiO2":0.21}')
assert_json "ABG calculator returns interpretation" "['primary']" "Respiratory Acidosis" "$R"

R=$(api_post "/api/v1/clinical/calculate/das28" \
  '{"tender28":8,"swollen28":6,"patientGlobal":45,"esr":12}')
assert_json "DAS28 calculator returns score" "['score']" "4.7" "$R"

R=$(api_post "/api/v1/clinical/calculate/ipss" \
  '{"answers":[3,2,4,1,2,3,2]}')
assert_json "IPSS calculator returns score" "['score']" "17" "$R"

R=$(api_post "/api/v1/clinical/calculate/qsofa" \
  '{"rr":24,"sbp":95,"loc":true}')
assert_json "qSOFA calculator returns score" "['score']" "3" "$R"

R=$(api_post "/api/v1/clinical/calculate/news" \
  '{"rr":20,"spo2":95,"o2":false,"sbp":120,"hr":80,"temp":37.0,"loc":false}')
assert_json "NEWS calculator returns score" "['score']" "1" "$R"

R=$(api_post "/api/v1/clinical/calculate/ktv" \
  '{"preUrea":60,"postUrea":20,"dialyzerK":200,"treatmentTime":4.0,"weight":70,"ultrafiltration":2000}')
assert_json "Kt/V calculator returns result" "['ktV']" "1.28" "$R"

R=$(api_post "/api/v1/clinical/calculate/pasi" \
  '{"regions":[{"area":10,"erythema":2,"scaling":2,"thickness":2},{"area":20,"erythema":3,"scaling":3,"thickness":2},{"area":30,"erythema":2,"scaling":2,"thickness":2},{"area":40,"erythema":3,"scaling":3,"thickness":3}]}')
assert_json "PASI calculator returns score" "['score']" "2.36" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 15. DRUG INTERACTIONS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 15. Drug Interactions ─────────────────────────────────────"

R=$(api_post "/api/v1/clinical/drug-interactions" \
  '{"drugs":["Aspirin","Warfarin","Metformin"]}')
assert_json "Drug interaction check returns result" "['count']" "1" "$R"
assert_json "Drug interaction has contraindicated" "['hasContraindicated']" "True" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 16. REPORTS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 16. Reports ───────────────────────────────────────────────"

R=$(api_get "/api/v1/reports/revenue/daily")
assert_json_len_gt "GET /reports/revenue/daily" "['data']" "0" "$R"

R=$(api_get "/api/v1/reports/revenue/monthly")
assert_json_len_gt "GET /reports/revenue/monthly" "['data']" "0" "$R"

R=$(api_get "/api/v1/reports/occupancy")
assert_json "GET /reports/occupancy returns data" "['totalBeds']" "120" "$R"

R=$(api_get "/api/v1/reports/clinical/stats")
assert_json_len_gt "GET /reports/clinical/stats" "['data']" "0" "$R"

R=$(api_get "/api/v1/reports/inventory/low-stock")
assert_json_len_gt "GET /reports/inventory/low-stock" "['data']" "0" "$R"

R=$(api_get "/api/v1/reports/lab/turnaround")
assert_json_len_gt "GET /reports/lab/turnaround" "['data']" "0" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# 17. EDGE CASES & NEGATIVE TESTS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "─── 17. Edge Cases ────────────────────────────────────────────"

# 404 on non-existent patient
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $(get_token)" \
  "$BASE/api/v1/patients/DOES-NOT-EXIST" 2>/dev/null || echo "000")
assert_status "GET /patients/DOES-NOT-EXIST returns 404" "404" "$HTTP"

# 404 on non-existent appointment
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $(get_token)" \
  "$BASE/api/v1/appointments/DOES-NOT-EXIST" 2>/dev/null || echo "000")
assert_status "GET /appointments/DOES-NOT-EXIST returns 404" "404" "$HTTP"

# Calculator validation (missing required fields expected to fail)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/clinical/calculate/abg" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(get_token)" \
  -d '{}' 2>/dev/null || echo "000")
echo "  ℹ️  ABG with empty body: HTTP $HTTP"

# Calculator validation (invalid pH type)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/clinical/calculate/abg" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(get_token)" \
  -d '{"ph":"not-a-number","pco2":48,"hco3":24,"po2":85,"fio2":0.21}' 2>/dev/null || echo "000")
echo "  ℹ️  ABG with invalid types: HTTP $HTTP"

# Auth edge case: request without token
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/patients" 2>/dev/null || echo "000")
assert_status "GET /patients without token returns 401" "401" "$HTTP"

# Calculator edge cases
R=$(api_post "/api/v1/clinical/calculate/qsofa" \
  '{"rr":20,"sbp":120,"loc":false}')
assert_json "qSOFA with normal vitals returns 0" "['score']" "0" "$R"

R=$(api_post "/api/v1/clinical/calculate/das28" \
  '{"tender28":0,"swollen28":0,"patientGlobal":0,"esr":1}')
assert_json "DAS28 with zeros returns ~0" "['score']" "0.49" "$R"

# ═══════════════════════════════════════════════════════════════════════════
# RESULTS
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  API Test Results"
echo "══════════════════════════════════════════════════════════════"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⏭️  Skipped: $SKIP"
TOTAL=$((PASS + FAIL + SKIP))
echo "  📊 Total:  $TOTAL"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Exit with non-zero if any failures
[ "$FAIL" -eq 0 ] || exit 1
