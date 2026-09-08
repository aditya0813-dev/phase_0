# 🏢 New Hire Onboarding Portal — Document Submission System

An enterprise-grade, accessible, and responsive client-side web application designed for new hire employee onboarding verification. Built with **Semantic HTML5**, modern **Vanilla CSS3**, modular **Vanilla JavaScript (ES6+)**, and integrated with an asynchronous **REST API client** and **OpenAPI 3.0.3 specification**.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Semantic HTML5 & Accessibility](#1-semantic-html5--accessibility)
  - [2. Design System & Responsive CSS3](#2-design-system--responsive-css3)
  - [3. Core JavaScript Fundamentals](#3-core-javascript-fundamentals)
  - [4. Advanced JavaScript & REST API Integration](#4-advanced-javascript--rest-api-integration)
  - [5. API Contract & OpenAPI Specification](#5-api-contract--openapi-specification)
- [Project Architecture & File Structure](#-project-architecture--file-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Testing & Quality Verification Guide](#-testing--quality-verification-guide)
  - [A. Client-Side Validation Testing](#a-client-side-validation-testing)
  - [B. Date-Picker Future Date Restriction](#b-date-picker-future-date-restriction)
  - [C. Duplicate Submission Prevention](#c-duplicate-submission-prevention)
  - [D. Form Reset Behavior](#d-form-reset-behavior)
  - [E. REST API & Error State Simulation](#e-rest-api--error-state-simulation)
- [HTTP Status-Code Matrix Summary](#-http-status-code-matrix-summary)
- [Technology Stack](#-technology-stack)
- [License](#-license)

---

## 🌟 Overview

The **New Hire Onboarding Portal** streamlines the collection, validation, and tracking of pre-employment verification documents (Government ID, Tax Forms, Educational Degrees, Direct Deposit, Relieving Letters, and NDAs). 

It implements client-side validation, non-blocking asynchronous submission with duplicate request guards, real-time UI feedback, and an interactive REST API configuration and mock testing harness.

---

## 🚀 Key Features

### 1. Semantic HTML5 & Accessibility
* **Semantic Structure**: Built using semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<fieldset>`, `<legend>`, and `<footer>`).
* **Accessible Forms**: Standardized `<label for="...">` association, `aria-required="true"`, `aria-invalid`, `role="alert"`, and dynamic `aria-describedby` linking input fields directly to inline error messages.
* **Document Reference Table**: Semantic `<table>` featuring `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, and `<th scope="col|row">` providing clear onboarding submission guidelines and deadlines.

### 2. Design System & Responsive CSS3
* **Enterprise Color Tokens**: Curated palette utilizing corporate slates, deep indigos, semantic alerts (success green, danger red, warning amber, and info blue).
* **Typography**: Professional typography hierarchy powered by Google Font **Inter**.
* **Layout Engines**: Flexbox for navigation, headers, footers, and buttons; CSS Grid for multi-column form layouts.
* **Responsive Breakpoints**: Fluid desktop, tablet (768px), and mobile (480px) adaptation without horizontal scroll or layout shifts.
* **Micro-Animations**: Smooth focus indicator rings, animated error slide-ins, and button hover states.

### 3. Core JavaScript Fundamentals
* **Dynamic Document-Type Generation**: Dropdown options are dynamically loaded and rendered from a JavaScript array of document metadata objects.
* **Client-Side Form Validation**:
  * **Employee Name**: Min 2, max 60 characters, regex character validation (`^[a-zA-Z\s.'-]{2,60}$`).
  * **Request ID**: Alphanumeric format validation (`^[A-Za-z0-9_-]{3,20}$`).
  * **Document Type**: Selection required from registered options.
  * **Submission Date**: Enforced to **today or past dates only** via calendar `max` attribute and runtime validation checks.
  * **File Upload**: Restricted to `.pdf`, `.png`, `.jpg`, `.jpeg` under **10 MB**.
  * **Declaration Checkbox**: Mandatory certification before submission.
* **Dynamic File-Name Display**: Renders an interactive file badge displaying the selected file name, formatted size (KB/MB), format validation indicator, and an instant **Remove** button.
* **Robust Reset Behavior**: Explicitly clears all inputs, removes inline error messages, hides the file badge, closes the summary card, and restores the validation notice to its default state.
* **Submission Summary Card**: Converts valid data into a structured JavaScript object, logs it to the browser console, displays a formatted summary grid, and includes an expandable raw **JSON Object Inspector**.
* **Local Persistence**: Submissions are automatically saved to `localStorage` (`employee_onboarding_submissions`) for persistence across page refreshes.

### 4. Advanced JavaScript & REST API Integration
* **Async/Await & Fetch API**: Form submission is handled asynchronously using `async`/`await` and the native Fetch API with `AbortController` timeout protection.
* **Centralized API Configuration**: Defined in a single `API_CONFIG` object (`defaultEndpoint: 'https://jsonplaceholder.typicode.com/posts'`). The API URL is **never hardcoded across multiple functions**.
* **Duplicate Submission Prevention**:
  * Guarded by an `isSubmitting` in-flight boolean flag.
  * Immediately disables the **Submit Document** and **Reset Form** buttons upon click.
  * Displays an animated loading spinner inside the submit button (`Submitting Document...`).
  * Re-enables controls in a `finally` block once the network roundtrip completes.
* **Comprehensive Error & State Management**:
  * **Loading State**: Active spinner and loading banner.
  * **Success State (HTTP 2xx)**: Confirms receipt with status code and roundtrip latency in milliseconds.
  * **Validation-Error State (HTTP 4xx non-2xx)**: Handles 400 Bad Request / 422 Unprocessable Entity with error breakdown.
  * **Server-Error State (HTTP 5xx & Network Failures)**: Catches 500, 503, timeouts, and network offline exceptions with a retry action button.

### 5. API Contract & OpenAPI Specification
* **OpenAPI 3.0.3 Definitions**: Delivered in both YAML ([openapi.yaml](openapi.yaml)) and JSON ([openapi.json](openapi.json)).
* **Operations**:
  * `POST /api/v1/onboarding/documents`: Create document record.
  * `GET /api/v1/onboarding/documents/{submissionId}`: Query status, audit trail, and verification checksum.
* **HTTP Status-Code Matrix**: Documented in [API_CONTRACT.md](API_CONTRACT.md) covering codes `200`, `201`, `400`, `401`, `404`, `409`, and `500`.
* **Standard Samples**: 8 validated JSON samples located in the [`samples/`](samples/) directory matching the OpenAPI schema 100%.

---

## 📁 Project Architecture & File Structure

```text
Frontend_1/
├── index.html                   # Semantic HTML5 onboarding portal
├── styles.css                   # Custom enterprise CSS3 design system & animations
├── app.js                       # Core & Advanced JavaScript application logic
├── openapi.yaml                 # OpenAPI 3.0.3 specification (YAML format)
├── openapi.json                 # OpenAPI 3.0.3 specification (JSON format)
├── API_CONTRACT.md              # Detailed API contract, headers, & status matrix
├── README.md                    # Project documentation & run guide
├── .gitignore                   # Git exclusion rules
└── samples/                     # Validated sample request & response payloads
    ├── post_request_document_submission.json
    ├── post_response_201_created.json
    ├── get_response_200_ok.json
    ├── error_response_400_bad_request.json
    ├── error_response_401_unauthorized.json
    ├── error_response_404_not_found.json
    ├── error_response_409_conflict.json
    └── error_response_500_internal_server_error.json
```

---

## 💻 Getting Started & Local Setup

### Prerequisites
* Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
* *(Optional)* Node.js installed if using `live-server` or `http-server`.

### Running the Application

#### Option 1: Using Live Server (Recommended)
If Node.js is installed on your machine, launch the local development server:
```bash
npx live-server
```
The application will automatically open in your default browser at:
```
http://localhost:8080
```

#### Option 2: Direct Browser Launch
Open `index.html` directly in any web browser:
* Double-click `index.html` in your file explorer, or
* Right-click `index.html` &rarr; **Open with** &rarr; **Google Chrome** / **Microsoft Edge**.

---

## 🧪 Testing & Quality Verification Guide

### A. Client-Side Validation Testing
1. Click **Submit Document** while the form is empty.
2. **Expected Result**:
   * Form submission is blocked (`event.preventDefault()`).
   * Red field-level error messages appear beneath all invalid fields.
   * Invalid inputs receive a red outline and focus ring (`.is-invalid`).
   * The top **Validation Notice** banner turns red, displaying the count of fields needing correction.
   * Focus automatically shifts to the first invalid field.
3. Start typing a valid name and Request ID.
4. **Expected Result**: Field-level errors automatically clear in real time as valid input is provided.

---

### B. Date-Picker Future Date Restriction
1. Open the **Submission Date** calendar picker.
2. **Expected Result**:
   * All future dates beyond today are disabled and unclickable due to the dynamic `max="YYYY-MM-DD"` attribute.
3. Manually type a future date (e.g., next month) into the field and click Submit.
4. **Expected Result**: The validator catches the future date and displays:
   `Submission date cannot be in the future. Please select today or an earlier date.`

---

### C. Duplicate Submission Prevention
1. Complete all fields with valid data.
2. Rapidly double-click or triple-click the **Submit Document** button.
3. **Expected Result**:
   * On the very first click, the button disables (`disabled="true"`), cursor becomes `not-allowed`, and text changes to a spinning `Submitting Document...`.
   * Subsequent clicks are blocked by the `isSubmitting` guard.
   * Open Developer Tools (**F12** &rarr; **Network tab**) to verify that **only one single HTTP POST request** was dispatched.

---

### D. Form Reset Behavior
1. Fill out inputs, select a document type, upload a file, and check the declaration box.
2. Click the **Reset Form** button.
3. **Expected Result**:
   * All input fields are cleared.
   * Document type dropdown returns to `-- Select document type --`.
   * Submission date restores to today's date.
   * The file-name display badge is cleared.
   * Any previous field error messages (`.field-error`) and invalid styling are removed.
   * Any previously rendered Submission Summary card is removed.
   * The top validation notice banner resets back to its default neutral state.
   * Focus returns to the **Employee Full Name** field.

---

### E. REST API & Error State Simulation
Expand the **"REST API Settings & Mock Testing"** panel above the form to test each response scenario:

| Scenario | How to Test | Expected Behavior |
| :--- | :--- | :--- |
| **Live Fetch** *(Default)* | Leave scenario on `Live Fetch` and submit. | Sends a real `POST` request to `https://jsonplaceholder.typicode.com/posts`. Returns HTTP 201 Created and displays latency in milliseconds. |
| **Mock 201 Created** | Select `Mock 201 Created` and submit. | Simulates an asynchronous 201 Created response. Renders the green success banner and full Submission Summary card. |
| **Mock 400 Bad Request** | Select `Mock 400 Bad Request` and submit. | Simulates client payload rejection. Banner displays `API Validation Error (HTTP 400 Bad Request)` with an actionable **Retry Submission** button. |
| **Mock 422 Unprocessable** | Select `Mock 422 Unprocessable Entity` and submit. | Simulates server rejection: `Request ID does not exist in the active onboarding registry`. |
| **Mock 500 Internal Error** | Select `Mock 500 Internal Server Error` and submit. | Simulates server database crash. Banner displays `Server Error (HTTP 500)` with error details and retry options. |
| **Mock Network Failure** | Select `Mock Network Failure / Offline` and submit. | Simulates connection timeout or offline status. Demonstrates `try...catch` network exception handling. |

---

## 📊 HTTP Status-Code Matrix Summary

| Code | Status | Method | Description |
| :---: | :--- | :---: | :--- |
| **`200`** | **OK** | `GET` | Document status located and verification details returned. |
| **`201`** | **Created** | `POST` | New document submitted, validated, and registered. |
| **`400`** | **Bad Request** | `POST`, `GET` | Validation failure (future date, invalid characters, file > 10 MB). |
| **`401`** | **Unauthorized** | `POST`, `GET` | Missing or invalid authentication credentials (`Authorization` / `X-API-Key`). |
| **`404`** | **Not Found** | `GET` | Submission reference ID was not found in the registry. |
| **`409`** | **Conflict** | `POST` | Document type for this candidate is already submitted or pending review. |
| **`500`** | **Internal Server Error** | `POST`, `GET` | Server-side database failure or unexpected exception. |

*(For full header specifications, schema mappings, and caching directives, refer to [API_CONTRACT.md](API_CONTRACT.md).)*

---

## 🛠 Technology Stack

* **Frontend Structure**: HTML5 (W3C Validated Semantic Elements)
* **Styling**: Vanilla CSS3 (Custom Properties, Flexbox, CSS Grid, Media Queries)
* **Typography**: Google Fonts ([Inter](https://fonts.google.com/specimen/Inter))
* **Logic & Runtime**: Vanilla JavaScript (ES6+, Promises, `async`/`await`, Fetch API)
* **Contract Specification**: OpenAPI 3.0.3 (YAML & JSON)
* **Local Web Server**: Node.js `live-server` / Static File Hosting

---

## 📄 License

This project is developed for internal Human Resources Operations and Onboarding Portal systems. All rights reserved &copy; 2026.
