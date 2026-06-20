---
page: "API Documentation — Landing"
slug: /resources/api-docs
hub: Resources
meta_title: "डेवलपर और API दस्तावेज़ीकरण | {Product}"
meta_description: "FHIR R4 APIs, वेबहुक और इंटीग्रेशन गाइड — खुले तौर पर प्रकाशित। NDA साइन किए बिना {Product} पर बनाएँ।"
---

# API दस्तावेज़ीकरण

## स्थिति

खुले तौर पर प्रकाशित — डॉक्स पढ़ने के लिए कोई NDA या सेल्स कॉल नहीं। अस्पतालों के इंटीग्रेशन पार्टनर, इन-हाउस डेवलपर और प्रतियोगी भी देख सकते हैं कि {Product} क्या एक्सपोज़ करता है। खुले दरवाज़े एक फीचर हैं; देखें [इंटरऑपरेबिलिटी](/platform/interoperability)।

## विषय-सूची

1. **शुरुआत** — प्रमाणीकरण (JWT Bearer टोकन), एनवायरनमेंट, सैंडबॉक्स एक्सेस, रेट लिमिट
2. **FHIR R4 API रेफ़रेंस** — Patient, Encounter, Observation, MedicationRequest, DiagnosticReport, DocumentReference और समर्थित रिसोर्स कैटलॉग, ABDM प्रोफाइल नोट्स के साथ
3. **वेबहुक और इवेंट** — admission/discharge/transfer, result-released, bill-finalised, appointment इवेंट
4. **इंटीग्रेशन गाइड** — एनालाइज़र इंटरफ़ेसिंग, DICOM मोडैलिटी सेटअप, अकाउंटिंग पोस्टिंग, WhatsApp/SMS कॉन्फ़िगरेशन, पेमेंट-गेटवे लिंकेज
5. **रेसिपीज़** — सामान्य बिल्ड: एक मरीज-फेसिंग रिपोर्ट पोर्टल, एक रेफरल-पार्टनर डैशबोर्ड, एक ग्रुप-BI एक्सट्रैक्ट
6. **चेंजलॉग और डेप्रिकेशन पॉलिसी** — वर्ज़निंग नियम और न्यूनतम नोटिस अवधि, लिखित रूप में

## FHIR API रेफ़रेंस

### बेस URL

```
https://api.{product-domain}/fhir/r4/
```

सैंडबॉक्स: `https://sandbox-api.{product-domain}/fhir/r4/`

### प्रमाणीकरण

सभी अनुरोधों के लिए `Authorization` हेडर में JWT Bearer टोकन आवश्यक है:

```
Authorization: Bearer <your-token>
```

टोकन आपके क्लाइंट क्रेडेंशियल का उपयोग करके EHR API प्रमाणीकरण एंडपॉइंट से प्राप्त किए जाते हैं। एक सत्र के भीतर सभी FHIR अनुरोधों में एक ही टोकन शामिल करें।

### उदाहरण: Patient सर्च

```
GET /Patient?name=Sharma&birthdate=eq1990-01-01
```

प्रतिक्रिया:

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

### उदाहरण: Observation बनाना

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

### पेजिनेशन

परिणाम सीमित करने के लिए `_count` (डिफ़ॉल्ट 50, अधिकतम 200) और क्रमबद्ध करने के लिए `_sort` का उपयोग करें:

```
GET /Observation?patient=pat-001234&_count=20&_sort=-date
```

प्रतिक्रिया बंडल में नेविगेशन के लिए `self`, `next` और `previous` लिंक शामिल हैं।

### त्रुटि प्रबंधन

त्रुटियाँ मानक FHIR `OperationOutcome` रिसोर्स लौटाती हैं:

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

### रेट लिमिट

- **प्रोडक्शन:** 1,000 अनुरोध प्रति मिनट प्रति टेनेंट
- **सैंडबॉक्स:** 10,000 अनुरोध प्रति मिनट प्रति टेनेंट
- बैच/ट्रांज़ैक्शन बंडल एकल अनुरोध के रूप में गिने जाते हैं
- सीमा पार करने पर HTTP 429 और `Retry-After` हेडर लौटता है

### स्पेसिफिकेशन

API [HL7 FHIR R4 स्पेसिफिकेशन](https://hl7.org/fhir/R4/) का पालन करता है। ABDM FHIR प्रोफ़ाइल अनुरोध पर उपलब्ध हैं।

सिंथेटिक भारतीय-संदर्भ डेटा (नाम, ABHA-फ़ॉर्मेट ID, लाख/करोड़ राशि) के साथ सैंडबॉक्स टेनेंसी अनुरोध पर उपलब्ध।
