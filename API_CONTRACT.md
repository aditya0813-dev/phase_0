# API Contract & HTTP Status-Code Specification
## Employee Center: New Hire Document Submission & Verification API

---

## 1. Overview & Architectural Principles

This document defines the formal RESTful API contract for onboarding verification document submission and verification status lifecycle tracking.

### Core Protocol Specifications:
* **Protocol**: HTTP/1.1 & HTTP/2 over TLS 1.3 (HTTPS)
* **Architecture**: REST (Representational State Transfer)
  * **Resource-Oriented URIs**: Nouns representing resource collections (`/api/v1/onboarding/documents`)
  * **Standard HTTP Verbs**:
    * `POST`: Create a new document submission resource.
    * `GET`: Query existing submission verification status and audit records.
  * **Statelessness**: Every request contains all context, authentication credentials, and correlation headers needed.
  * **Idempotency Support**: POST operations accept an `Idempotency-Key` header to safely retry requests without duplicate database entry.
* **Payload Serialization**: `application/json; charset=utf-8`

---

## 2. API Endpoints Specification

| Method | Endpoint URI | Description | Auth Required | Success Status | Idempotent |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `POST` | `/api/v1/onboarding/documents` | Submit a new onboarding verification document | Yes | **201 Created** | Yes (with `Idempotency-Key`) |
| `GET` | `/api/v1/onboarding/documents/{submissionId}` | Retrieve real-time verification status & audit metadata | Yes | **200 OK** | Yes |

---

## 3. Comprehensive HTTP Status-Code Matrix

The following matrix documents all valid response states across both `POST` and `GET` operations:

| HTTP Status Code | Reason Phrase | Applicable Operations | Trigger Condition / Scenario | Key Headers | Response Body Schema / Payload | Client Handling Guidance |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **`200`** | **OK** | `GET` | Record matching `submissionId` was located successfully. | `ETag`<br>`Cache-Control: private, max-age=60`<br>`Content-Type: application/json` | `DocumentStatusResponse`<br>*(Contains audit trail, checksum, and approval status)* | Render current status badge; cache using ETag if applicable. |
| **`201`** | **Created** | `POST` | Payload passed validation; document record registered & queued for review. | `Location: /api/v1/onboarding/documents/SUB-XXXXXX`<br>`X-Correlation-ID`<br>`Content-Type: application/json` | `DocumentSubmissionResponse`<br>*(Contains submissionId, trackingUrl, timestamp)* | Navigate/display confirmation card; save `submissionId` to local state/storage. |
| **`400`** | **Bad Request** | `POST`, `GET` | • Malformed JSON syntax<br>• Future `submissionDate`<br>• Missing required attributes<br>• File size > 10 MB or unpermitted extension<br>• Malformed `submissionId` parameter on GET | `Content-Type: application/json`<br>`X-Correlation-ID` | `ErrorResponse`<br>*(Contains `error: "VALIDATION_FAILED"` and `details[]` array)* | Display field-level inline error cues; block retry until fields are corrected. |
| **`401`** | **Unauthorized** | `POST`, `GET` | • Missing `Authorization` header<br>• Expired JWT Bearer token<br>• Invalid API Key in `X-API-Key` | `WWW-Authenticate: Bearer realm="onboarding-api"`<br>`Content-Type: application/json` | `ErrorResponse`<br>*(Contains `error: "UNAUTHORIZED"`)* | Redirect user to login flow or invoke silent token refresh mechanism. |
| **`404`** | **Not Found** | `GET` | No document submission exists with the requested `submissionId`. | `Content-Type: application/json`<br>`X-Correlation-ID` | `ErrorResponse`<br>*(Contains `error: "DOCUMENT_NOT_FOUND"`)* | Display "Document not found" alert; confirm submission reference ID. |
| **`409`** | **Conflict** | `POST` | A document submission for this `documentType` and `requestId` is already pending verification or approved. | `Content-Type: application/json`<br>`X-Correlation-ID` | `ErrorResponse`<br>*(Contains `error: "RESOURCE_CONFLICT"` and `existingResourceId`)* | Prevent duplicate submission; inform user that document is already submitted. |
| **`500`** | **Internal Server Error** | `POST`, `GET` | Unhandled exception, database connection timeout, or downstream microservice storage failure. | `Retry-After: 30`<br>`Content-Type: application/json`<br>`X-Correlation-ID` | `ErrorResponse`<br>*(Contains `error: "INTERNAL_SERVER_ERROR"`)* | Display technical failure notice; offer retry button adhering to `Retry-After`. |

---

## 4. HTTP Headers Specification

### Standard Request Headers
| Header Name | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `Content-Type` | String | Yes (POST) | Media type of the request body. | `application/json` |
| `Accept` | String | Yes | Expected response format. | `application/json` |
| `Authorization` | String | Yes* | Standard Bearer JWT token (*or use `X-API-Key`). | `Bearer eyJhbGciOiJIUzI1Ni...` |
| `X-API-Key` | String | Alternative | Service-to-service internal API key. | `hr_live_9f83a8b27164` |
| `Idempotency-Key` | String (UUID) | Recommended | Ensures safe retry on network blips without duplicate records. | `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d` |
| `X-Correlation-ID` | String | Optional | Distributed request tracing ID for APM & logging. | `corr-789a-4bc1-bf22-1092837465ab` |

### Standard Response Headers
| Header Name | Type | Status Codes | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `Content-Type` | String | All | MIME format of returned payload. | `application/json; charset=utf-8` |
| `Location` | URI | `201` | Canonical URL to query the created resource status. | `/api/v1/onboarding/documents/SUB-731934` |
| `ETag` | String | `200` | Entity tag hash for caching and concurrency control. | `W/"sub-731934-v1"` |
| `Cache-Control` | String | `200` | Cache directives. | `private, max-age=60` |
| `WWW-Authenticate` | String | `401` | Authentication challenge specification. | `Bearer realm="onboarding-api"` |
| `Retry-After` | Integer | `500`, `503` | Number of seconds client should wait before retrying. | `30` |
| `X-Correlation-ID` | String | All | Correlation ID echoed back for debugging & support tickets. | `corr-789a-4bc1-bf22-1092837465ab` |

---

## 5. Schema Basics & Type Definitions

### 5.1 Document Types (`DocumentTypeEnum`)
| Value | Display Label | Mandatory / Optional | Accepted Formats | Deadline SLA |
| :--- | :--- | :---: | :--- | :--- |
| `government-id` | Government Issued Photo ID | Mandatory | PDF, JPG, PNG | Before Day 1 |
| `tax-form` | Tax Withholding Form (W-4 / Form 16) | Mandatory | PDF | Within 3 Days |
| `degree-certificate` | Educational Degree Certificate | Mandatory | PDF | Within 7 Days |
| `relieving-letter` | Previous Employment Relieving Letter | Optional | PDF | Within 15 Days |
| `direct-deposit` | Direct Deposit / Bank Details | Mandatory | PDF, PNG | First Payroll Cycle |
| `nda-agreement` | Signed Non-Disclosure Agreement | Mandatory | PDF | Day 1 Orientation |

### 5.2 Required Fields & Validation Rules
| Field | Type | Format / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `employeeName` | `string` | Min: 2, Max: 60, Regex: `^[a-zA-Z\s.'-]{2,60}$` | Full legal name matching official ID. |
| `requestId` | `string` | Min: 3, Max: 20, Regex: `^[A-Za-z0-9_-]{3,20}$` | Candidate onboarding ID (e.g. `REQ-54321`). |
| `documentType` | `string` | Enum: 6 supported keys | Category of uploaded verification document. |
| `submissionDate` | `string` | Format: `date` (`YYYY-MM-DD`), `date <= TODAY` | Cannot be a future date. |
| `file.name` | `string` | Max: 255 chars | Original filename. |
| `file.sizeBytes` | `integer` | Min: 1, Max: `10485760` (10 MB) | File size in bytes. |
| `file.mimeType` | `string` | Enum: `application/pdf`, `image/png`, `image/jpeg` | Approved MIME type. |
| `file.extension` | `string` | Enum: `PDF`, `PNG`, `JPG`, `JPEG` | Uppercase extension string. |
| `consentCertified`| `boolean` | Must be strictly `true` | Legal certification of document authenticity. |

---

## 6. Deliverable Artifact Index

All schema and sample files are delivered in the repository:
* OpenAPI Specification (YAML): [openapi.yaml](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/openapi.yaml)
* OpenAPI Specification (JSON): [openapi.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/openapi.json)
* Sample Request Payload: [post_request_document_submission.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/post_request_document_submission.json)
* Sample 201 Response: [post_response_201_created.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/post_response_201_created.json)
* Sample 200 Response: [get_response_200_ok.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/get_response_200_ok.json)
* Sample 400 Error: [error_response_400_bad_request.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/error_response_400_bad_request.json)
* Sample 401 Error: [error_response_401_unauthorized.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/error_response_401_unauthorized.json)
* Sample 404 Error: [error_response_404_not_found.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/error_response_404_not_found.json)
* Sample 409 Error: [error_response_409_conflict.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/error_response_409_conflict.json)
* Sample 500 Error: [error_response_500_internal_server_error.json](file:///c:/Users/AdityaPandeyMAQSoftw/Desktop/Frontend_1/samples/error_response_500_internal_server_error.json)
