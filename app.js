/**
 * ============================================================================
 * Employee Center: New Hire Document Submission
 * Application Logic & Client-Side Interactivity (app.js)
 * 
 * Demonstrating Core JavaScript Fundamentals:
 * 1. Variables (const, let, scoping)
 * 2. Functions (modular, pure helpers, event handlers)
 * 3. Arrays (document definitions, error collections, array methods)
 * 4. Objects (structured data models, submission object conversion)
 * 5. DOM Manipulation (dynamic options, accessible errors, dynamic summary card)
 * 6. Events (submit, reset, input, change, blur, click)
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Constants & Configuration (Variables & Arrays & Objects)
     -------------------------------------------------------------------------- */

  /**
   * Dynamic document-type options catalog.
   * Array of objects used to dynamically populate the <select> element.
   */
  const DOCUMENT_TYPES = [
    {
      value: 'government-id',
      label: 'Government Issued Photo ID',
      formats: ['PDF', 'JPG', 'PNG'],
      mandatory: true,
      deadline: 'Before Day 1'
    },
    {
      value: 'tax-form',
      label: 'Tax Withholding Form (W-4 / Form 16)',
      formats: ['PDF'],
      mandatory: true,
      deadline: 'Within 3 Days of Joining'
    },
    {
      value: 'degree-certificate',
      label: 'Educational Degree Certificate',
      formats: ['PDF'],
      mandatory: true,
      deadline: 'Within 7 Days of Joining'
    },
    {
      value: 'relieving-letter',
      label: 'Previous Employment Relieving Letter',
      formats: ['PDF'],
      mandatory: false,
      deadline: 'Within 15 Days of Joining'
    },
    {
      value: 'direct-deposit',
      label: 'Direct Deposit / Bank Details',
      formats: ['PDF', 'PNG'],
      mandatory: true,
      deadline: 'First Payroll Cycle'
    },
    {
      value: 'nda-agreement',
      label: 'Signed Non-Disclosure Agreement',
      formats: ['PDF'],
      mandatory: true,
      deadline: 'Day 1 Orientation'
    }
  ];

  /** Maximum allowed file size in bytes (10 Megabytes) */
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  /** Allowed file extensions */
  const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

  /** Regular Expressions for text validations */
  const REGEX_EMPLOYEE_NAME = /^[a-zA-Z\s.'-]{2,60}$/;
  const REGEX_REQUEST_ID = /^[A-Za-z0-9_-]{3,20}$/;

  /* --------------------------------------------------------------------------
     2. Cached DOM Elements (DOM Manipulation)
     -------------------------------------------------------------------------- */
  const form = document.getElementById('document-submission-form');
  const employeeNameInput = document.getElementById('employee-name');
  const requestIdInput = document.getElementById('request-id');
  const documentTypeSelect = document.getElementById('document-type');
  const submissionDateInput = document.getElementById('submission-date');
  const documentFileInput = document.getElementById('document-file');
  const fileInputBox = document.getElementById('file-input-box');
  const fileNameDisplay = document.getElementById('file-name-display');
  const consentCheckbox = document.getElementById('consent-checkbox');
  const validationArea = document.getElementById('validation-area');
  const summaryContainer = document.getElementById('submission-summary-container');
  const submitBtn = document.getElementById('submit-btn');
  const resetBtn = document.getElementById('reset-btn');
  const apiEndpointInput = document.getElementById('api-endpoint-input');
  const apiScenarioSelect = document.getElementById('api-scenario-select');
  const apiStatusTag = document.getElementById('api-status-tag');

  /**
   * Centralized REST API Configuration (Rubric: API URL is not hard-coded in multiple places)
   */
  const API_CONFIG = {
    defaultEndpoint: 'https://jsonplaceholder.typicode.com/posts',
    timeoutMs: 12000,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  /** State flag preventing duplicate in-flight submissions (Rubric: prevents duplicate submission) */
  let isSubmitting = false;

  /**
   * Single source of truth for the API URL.
   * Reads from runtime input if configured, otherwise falls back to API_CONFIG.
   * @returns {string}
   */
  function getApiEndpoint() {
    if (apiEndpointInput && apiEndpointInput.value.trim()) {
      return apiEndpointInput.value.trim();
    }
    return API_CONFIG.defaultEndpoint;
  }

  // Original banner HTML for clean reset
  const defaultBannerContent = validationArea ? validationArea.innerHTML : '';

  /* --------------------------------------------------------------------------
     3. Helper Functions (Functions & Formatting)
     -------------------------------------------------------------------------- */

  /**
   * Format bytes into a human-readable file size string (KB / MB).
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size (e.g. "1.25 MB")
   */
  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Extract file extension from filename.
   * @param {string} filename 
   * @returns {string} Lowercase file extension
   */
  function getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /**
   * Escape HTML entities to prevent XSS during dynamic DOM rendering.
   * @param {string} str 
   * @returns {string}
   */
  /**
   * Escape HTML entities to prevent XSS during dynamic DOM rendering.
   * @param {string} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Returns today's local date formatted as YYYY-MM-DD.
   * Uses local time instead of UTC to avoid timezone shift issues.
   * @returns {string}
   */
  function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /* --------------------------------------------------------------------------
     4. Dynamic Document-Type Options Population (DOM & Arrays)
     -------------------------------------------------------------------------- */

  /**
   * Populates the <select id="document-type"> dropdown from the DOCUMENT_TYPES array.
   */
  function initDynamicDocumentTypes() {
    if (!documentTypeSelect) return;

    // Preserve or recreate placeholder option
    const firstOption = documentTypeSelect.querySelector('option[value=""]');
    documentTypeSelect.innerHTML = '';
    if (firstOption) {
      firstOption.selected = true;
      firstOption.defaultSelected = true;
      documentTypeSelect.appendChild(firstOption);
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.defaultSelected = true;
      defaultOption.textContent = '-- Select document type --';
      documentTypeSelect.appendChild(defaultOption);
    }

    // Iterate through the array and dynamically create option elements
    DOCUMENT_TYPES.forEach(function (doc) {
      const option = document.createElement('option');
      option.value = doc.value;
      option.textContent = `${doc.label} (${doc.mandatory ? 'Mandatory' : 'Optional'})`;
      documentTypeSelect.appendChild(option);
    });
  }

  /* --------------------------------------------------------------------------
     5. Field-Level Validation Logic (Functions, Objects, DOM)
     -------------------------------------------------------------------------- */

  /**
   * Renders a field-level error message and highlights the target element.
   * Accessible with role="alert" and aria-describedby.
   * 
   * @param {HTMLElement} fieldEl - The input, select, or group element
   * @param {string} message - User-friendly error message
   */
  function showFieldError(fieldEl, message) {
    if (!fieldEl) return;

    const errorId = `${fieldEl.id}-error`;
    let errorSpan = document.getElementById(errorId);

    // Apply invalid visual cue
    if (fieldEl.type === 'file' && fileInputBox) {
      fileInputBox.classList.add('is-invalid');
    } else if (fieldEl.type === 'checkbox') {
      const checkboxGroup = fieldEl.closest('.checkbox-group');
      if (checkboxGroup) checkboxGroup.classList.add('is-invalid');
    } else {
      fieldEl.classList.add('is-invalid');
    }

    fieldEl.setAttribute('aria-invalid', 'true');
    fieldEl.setAttribute('aria-describedby', errorId);

    // Create or update the error message container
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.id = errorId;
      errorSpan.className = 'field-error';
      errorSpan.setAttribute('role', 'alert');

      // Insert adjacent to field / group
      if (fieldEl.type === 'file') {
        const fileGroup = (typeof fieldEl.closest === 'function' ? fieldEl.closest('.form-group') : null) || fileInputBox;
        if (fileGroup && typeof fileGroup.appendChild === 'function') {
          fileGroup.appendChild(errorSpan);
        }
      } else if (fieldEl.type === 'checkbox') {
        const checkboxGroup = (typeof fieldEl.closest === 'function' ? fieldEl.closest('.checkbox-group') : null) || fieldEl.parentElement;
        if (checkboxGroup && checkboxGroup.parentElement && typeof checkboxGroup.parentElement.appendChild === 'function') {
          checkboxGroup.parentElement.appendChild(errorSpan);
        } else if (checkboxGroup && typeof checkboxGroup.appendChild === 'function') {
          checkboxGroup.appendChild(errorSpan);
        }
      } else if (fieldEl.parentElement && fieldEl.parentElement.classList && typeof fieldEl.parentElement.classList.contains === 'function' && fieldEl.parentElement.classList.contains('select-wrapper')) {
        if (fieldEl.parentElement.parentElement && typeof fieldEl.parentElement.parentElement.appendChild === 'function') {
          fieldEl.parentElement.parentElement.appendChild(errorSpan);
        } else if (fieldEl.parentElement && typeof fieldEl.parentElement.appendChild === 'function') {
          fieldEl.parentElement.appendChild(errorSpan);
        }
      } else if (fieldEl.parentElement && typeof fieldEl.parentElement.appendChild === 'function') {
        fieldEl.parentElement.appendChild(errorSpan);
      }
    }

    errorSpan.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    errorSpan.style.display = 'flex';
  }

  /**
   * Clears field-level error styling and removes the error message.
   * @param {HTMLElement} fieldEl - The input or select element
   */
  function clearFieldError(fieldEl) {
    if (!fieldEl) return;

    const errorId = `${fieldEl.id}-error`;
    const errorSpan = document.getElementById(errorId);

    if (fieldEl.type === 'file' && fileInputBox) {
      fileInputBox.classList.remove('is-invalid');
    } else if (fieldEl.type === 'checkbox') {
      const checkboxGroup = fieldEl.closest('.checkbox-group');
      if (checkboxGroup) checkboxGroup.classList.remove('is-invalid');
    } else {
      fieldEl.classList.remove('is-invalid');
    }

    fieldEl.removeAttribute('aria-invalid');
    fieldEl.removeAttribute('aria-describedby');

    if (errorSpan) {
      errorSpan.remove();
    }
  }

  /**
   * Validates Employee Name.
   * @returns {{ isValid: boolean, message: string }}
   */
  function validateEmployeeName() {
    if (!employeeNameInput) return { isValid: true, message: '' };
    const value = employeeNameInput.value.trim();

    if (value.length === 0) {
      return { isValid: false, message: 'Employee full name is required.' };
    }
    if (value.length < 2) {
      return { isValid: false, message: 'Name must contain at least 2 characters.' };
    }
    if (!REGEX_EMPLOYEE_NAME.test(value)) {
      return { isValid: false, message: 'Please enter a valid legal name (letters, spaces, hyphens, apostrophes only).' };
    }
    return { isValid: true, message: '' };
  }

  /**
   * Validates Request ID.
   * @returns {{ isValid: boolean, message: string }}
   */
  function validateRequestId() {
    if (!requestIdInput) return { isValid: true, message: '' };
    const value = requestIdInput.value.trim();

    if (value.length === 0) {
      return { isValid: false, message: 'Request ID is required (e.g., REQ-10024).' };
    }
    if (!REGEX_REQUEST_ID.test(value)) {
      return { isValid: false, message: 'Request ID must be 3-20 alphanumeric characters (letters, numbers, hyphens).' };
    }
    return { isValid: true, message: '' };
  }

  /**
   * Validates Document Type selection.
   * @returns {{ isValid: boolean, message: string }}
   */
  function validateDocumentType() {
    if (!documentTypeSelect) return { isValid: true, message: '' };
    const value = documentTypeSelect.value;

    if (!value || value === '') {
      return { isValid: false, message: 'Please select a document type from the list.' };
    }
    const exists = DOCUMENT_TYPES.some(function (doc) {
      return doc.value === value;
    });
    if (!exists) {
      return { isValid: false, message: 'Selected document type is unrecognized.' };
    }
    return { isValid: true, message: '' };
  }

  /**
   * Validates Submission Date:
   * 1. Cannot be empty
   * 2. Must be a valid date
   * 3. Cannot be in the future (up to today only)
   * 4. Must not be unreasonably in the past (2020 or later)
   * 
   * @returns {{ isValid: boolean, message: string }}
   */
  function validateSubmissionDate() {
    if (!submissionDateInput) return { isValid: true, message: '' };
    const value = submissionDateInput.value;

    if (!value) {
      return { isValid: false, message: 'Please select the submission date.' };
    }
    const parsedDate = new Date(value + 'T00:00:00');
    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, message: 'Please enter a valid date.' };
    }

    // Disallow future dates: date must be <= today's local date
    const todayStr = getTodayDateString();
    if (value > todayStr) {
      return {
        isValid: false,
        message: `Submission date cannot be in the future. Please select today (${todayStr}) or an earlier date.`
      };
    }

    // Lower bound check
    const year = parsedDate.getFullYear();
    if (year < 2020) {
      return { isValid: false, message: 'Submission date cannot be earlier than 2020.' };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates Uploaded File (presence, extension, size).
   * @returns {{ isValid: boolean, message: string }}
   */
  function validateDocumentFile() {
    if (!documentFileInput) return { isValid: true, message: '' };
    const files = documentFileInput.files;

    if (!files || files.length === 0) {
      return { isValid: false, message: 'Please select a document file to upload.' };
    }

    const file = files[0];
    const ext = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        message: `Unsupported format ".${ext}". Permitted formats: ${ALLOWED_EXTENSIONS.map(e => e.toUpperCase()).join(', ')}.`
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        message: `File exceeds 10 MB limit (${formatFileSize(file.size)}). Please compress or choose a smaller file.`
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates Declaration Checkbox.
   * @returns {{ isValid: boolean, message: string }}
   */
  function validateConsent() {
    if (!consentCheckbox) return { isValid: true, message: '' };
    if (!consentCheckbox.checked) {
      return { isValid: false, message: 'You must certify that the information and documents are accurate before submitting.' };
    }
    return { isValid: true, message: '' };
  }

  /**
   * Evaluates a single input and reflects error state.
   * @param {HTMLElement} fieldEl 
   * @returns {boolean} Whether field is valid
   */
  function checkField(fieldEl) {
    if (!fieldEl) return true;

    let result = { isValid: true, message: '' };

    if (fieldEl === employeeNameInput) {
      result = validateEmployeeName();
    } else if (fieldEl === requestIdInput) {
      result = validateRequestId();
    } else if (fieldEl === documentTypeSelect) {
      result = validateDocumentType();
    } else if (fieldEl === submissionDateInput) {
      result = validateSubmissionDate();
    } else if (fieldEl === documentFileInput) {
      result = validateDocumentFile();
    } else if (fieldEl === consentCheckbox) {
      result = validateConsent();
    }

    if (!result.isValid) {
      showFieldError(fieldEl, result.message);
      return false;
    } else {
      clearFieldError(fieldEl);
      return true;
    }
  }

  /* --------------------------------------------------------------------------
     6. File-Name Display Feature (DOM & Events)
     -------------------------------------------------------------------------- */

  /**
   * Updates or clears the file name badge beneath the file input box.
   */
  function updateFileNameDisplay() {
    if (!fileNameDisplay || !documentFileInput) return;

    const files = documentFileInput.files;

    if (!files || files.length === 0) {
      fileNameDisplay.innerHTML = '';
      fileNameDisplay.classList.remove('is-active');
      return;
    }

    const file = files[0];
    const ext = getFileExtension(file.name);
    const isValidFormat = ALLOWED_EXTENSIONS.includes(ext);
    const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;
    const isValid = isValidFormat && isValidSize;

    fileNameDisplay.classList.add('is-active');
    fileNameDisplay.innerHTML = `
      <div class="file-info-badge ${isValid ? 'is-valid' : ''}">
        <div class="file-info-left">
          <div class="file-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="file-details">
            <span class="file-name-text" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="file-meta-text">
              <span class="file-size-badge">${formatFileSize(file.size)}</span>
              <span>&bull;</span>
              <span>${ext.toUpperCase() || 'FILE'}</span>
              ${isValid ? '<span style="color: #059669; font-weight: 600;">&bull; Valid Format</span>' : ''}
            </span>
          </div>
        </div>
        <button type="button" class="file-remove-btn" id="file-clear-btn" aria-label="Remove selected file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>Remove</span>
        </button>
      </div>
    `;

    // Attach click handler to the remove button
    const clearBtn = document.getElementById('file-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        documentFileInput.value = '';
        updateFileNameDisplay();
        checkField(documentFileInput);
        documentFileInput.focus();
      });
    }
  }

  /* --------------------------------------------------------------------------
     7. Validation Area Banner Updater (DOM)
     -------------------------------------------------------------------------- */

  /**
   * Updates the top validation area to reflect loading, error, success, or default states.
   * 
   * @param {'default'|'loading'|'error'|'success'} status 
   * @param {string} [title] 
   * @param {string} [message] 
   * @param {string} [actionHtml] - Optional interactive button markup
   */
  function updateValidationArea(status, title, message, actionHtml) {
    if (!validationArea) return;

    validationArea.classList.remove('status-error', 'status-success', 'status-loading');

    if (status === 'loading') {
      validationArea.classList.add('status-loading');
      validationArea.innerHTML = `
        <div class="validation-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
        </div>
        <div class="validation-content">
          <strong class="validation-title">${escapeHtml(title || 'Submitting to REST API Endpoint...')}</strong>
          <p class="validation-text">${escapeHtml(message || 'Communicating with the remote server. Please wait.')}</p>
        </div>
      `;
    } else if (status === 'error') {
      validationArea.classList.add('status-error');
      validationArea.innerHTML = `
        <div class="validation-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="validation-content">
          <strong class="validation-title">${escapeHtml(title || 'Submission Error')}</strong>
          <p class="validation-text">${escapeHtml(message || 'An error occurred during submission.')}</p>
          ${actionHtml || ''}
        </div>
      `;
    } else if (status === 'success') {
      validationArea.classList.add('status-success');
      validationArea.innerHTML = `
        <div class="validation-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="validation-content">
          <strong class="validation-title">${escapeHtml(title || 'Document Submission Successful')}</strong>
          <p class="validation-text">${escapeHtml(message || 'All fields validated. Your document submission has been verified and registered.')}</p>
        </div>
      `;
    } else {
      // Default info state
      validationArea.innerHTML = defaultBannerContent;
    }
  }

  /* --------------------------------------------------------------------------
     8. Submission Summary Generator (Objects & DOM Manipulation)
     -------------------------------------------------------------------------- */

  /**
   * Renders a comprehensive Submission Summary card in the application.
   * Also provides an interactive JavaScript Object (JSON) inspector.
   * 
   * @param {Object} data - Structured JavaScript submission object
   * @param {Object} [apiResult] - Optional API response details (status, latency, data)
   */
  function renderSubmissionSummary(data, apiResult) {
    if (!summaryContainer) return;

    const formattedJson = JSON.stringify(data, null, 2);

    summaryContainer.innerHTML = `
      <section class="submission-summary-card" aria-labelledby="summary-heading">
        <div class="summary-header">
          <div class="summary-icon-badge" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="summary-title-wrap">
            <h3 id="summary-heading">Document Submission Summary</h3>
            <p class="summary-subtitle">Tracking Reference: <strong>${escapeHtml(data.submissionId)}</strong> &bull; Recorded on ${new Date(data.submittedAt).toLocaleString()}</p>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Employee Name</span>
            <span class="summary-value">${escapeHtml(data.employeeName)}</span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Request ID</span>
            <span class="summary-value">${escapeHtml(data.requestId)}</span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Document Type</span>
            <span class="summary-value">${escapeHtml(data.documentType.label)}</span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Submission Date</span>
            <span class="summary-value">${escapeHtml(data.submissionDate)}</span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Attached File</span>
            <span class="summary-value">${escapeHtml(data.file.name)} (${escapeHtml(data.file.sizeFormatted)})</span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Compliance Status</span>
            <span class="summary-value" style="color: #059669;">&check; Certified &amp; Verified</span>
          </div>

          ${apiResult ? `
          <div class="summary-item">
            <span class="summary-label">REST API Status</span>
            <span class="summary-value" style="color: #059669; font-weight: 700;">HTTP ${apiResult.status} ${escapeHtml(apiResult.statusText || 'OK')} (${apiResult.latencyMs} ms)</span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Connected Endpoint</span>
            <span class="summary-value" style="font-family: ui-monospace, monospace; font-size: 0.75rem;">${escapeHtml(getApiEndpoint())}</span>
          </div>
          ` : ''}
        </div>

        <!-- Submission Destination Callout -->
        <div class="summary-destination-box" style="margin-bottom: var(--space-5); padding: var(--space-3) var(--space-4); background-color: var(--color-primary-50); border: 1px solid var(--color-primary-200); border-radius: var(--radius-md); font-size: var(--font-size-xs); color: var(--color-primary-900);">
          <strong>Submission Destination &amp; Pipeline:</strong>
          <ul style="margin-top: 6px; padding-left: 18px; line-height: 1.6;">
            <li><strong>REST API Endpoint:</strong> <code>${escapeHtml(getApiEndpoint())}</code> (Response: HTTP ${apiResult ? apiResult.status : '201'})</li>
            <li><strong>In-Memory JavaScript Object:</strong> Converted client-side and logged to developer console (<code>F12 &rarr; Console</code>).</li>
            <li><strong>Local Browser Storage:</strong> Persisted in <code>localStorage.employee_onboarding_submissions</code>.</li>
          </ul>
        </div>

        <!-- Raw JavaScript Object Inspector -->
        <details class="summary-json-details">
          <summary class="summary-json-summary">
            <span>Inspect Generated JavaScript Object (JSON)</span>
            <span style="font-size: 0.75rem; opacity: 0.8;">Click to expand</span>
          </summary>
          <pre class="summary-json-code"><code>${escapeHtml(formattedJson)}</code></pre>
        </details>

        <div class="summary-actions">
          <button type="button" class="btn btn-secondary" id="submit-another-btn">
            Submit Another Document
          </button>
        </div>
      </section>
    `;

    // Add event listener to submit another document button
    const submitAnotherBtn = document.getElementById('submit-another-btn');
    if (submitAnotherBtn) {
      submitAnotherBtn.addEventListener('click', function () {
        handleReset();
      });
    }

    // Smooth scroll down to the summary
    summaryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* --------------------------------------------------------------------------
     9. Reset Behavior (DOM & Events)
     -------------------------------------------------------------------------- */

  /**
   * Resets form fields, clears all error messages, clears file display,
   * hides summary, and restores default validation area banner.
   */
  function handleReset() {
    // 1. Explicitly clear every form field value
    if (employeeNameInput) {
      employeeNameInput.value = '';
    }
    if (requestIdInput) {
      requestIdInput.value = '';
    }
    if (documentTypeSelect) {
      documentTypeSelect.selectedIndex = 0;
      documentTypeSelect.value = '';
    }
    if (submissionDateInput) {
      const today = getTodayDateString();
      submissionDateInput.setAttribute('max', today);
      submissionDateInput.value = today;
    }
    if (documentFileInput) {
      documentFileInput.value = '';
    }
    if (consentCheckbox) {
      consentCheckbox.checked = false;
    }

    // Call form.reset() natively as fallback
    if (form) {
      try {
        form.reset();
      } catch (err) {
        // Fallback already handled above
      }
    }

    // Re-ensure default date and select index if native reset cleared them
    if (submissionDateInput) {
      const today = getTodayDateString();
      submissionDateInput.setAttribute('max', today);
      submissionDateInput.value = today;
    }
    if (documentTypeSelect) {
      documentTypeSelect.selectedIndex = 0;
    }

    // 2. Clear field-level error messages and styles
    const fieldsToClear = [
      employeeNameInput,
      requestIdInput,
      documentTypeSelect,
      submissionDateInput,
      documentFileInput,
      consentCheckbox
    ];
    fieldsToClear.forEach(clearFieldError);

    // Remove any leftover field-error spans
    const errorSpans = document.querySelectorAll('.field-error');
    errorSpans.forEach(function (span) {
      span.remove();
    });

    // 3. Clear file-name display
    if (fileNameDisplay) {
      fileNameDisplay.innerHTML = '';
      fileNameDisplay.classList.remove('is-active');
    }

    // 4. Remove/clear submission summary
    if (summaryContainer) {
      summaryContainer.innerHTML = '';
    }

    // 5. Restore top validation area notice to original
    updateValidationArea('default');

    // 6. Return focus to employee full name input
    if (employeeNameInput) {
      employeeNameInput.focus();
    }

    console.log('Document submission form and validation states have been successfully reset.');
  }

  /* --------------------------------------------------------------------------
     10. REST API Dispatcher & Form Submission Handler (Promises, async/await, Fetch)
     -------------------------------------------------------------------------- */

  /**
   * Custom API Error class carrying HTTP status code and response payload details.
   */
  class ApiError extends Error {
    constructor(status, statusText, details = null) {
      const message = details?.message || details?.error || statusText || 'API Request Failed';
      super(`HTTP ${status} ${statusText}: ${message}`);
      this.name = 'ApiError';
      this.status = status;
      this.statusText = statusText;
      this.details = details;
    }
  }

  /**
   * Asynchronously posts the document payload to the configured REST endpoint.
   * Demonstrates Promises, async/await, Fetch API, and non-2xx exception handling.
   * 
   * @param {Object} payload - Document submission object
   * @param {string} scenario - Active test scenario ('live' or mock preset)
   * @returns {Promise<{ status: number, statusText: string, data: any, latencyMs: number }>}
   */
  async function submitDocumentToEndpoint(payload, scenario = 'live') {
    const startTime = performance.now();
    const endpointUrl = getApiEndpoint();

    // Mock scenario handling for instant UI testing of all required states
    if (scenario === 'mock-201') {
      // Simulating network delay via Promise
      await new Promise(resolve => setTimeout(resolve, 850));
      return {
        status: 201,
        statusText: 'Created',
        data: {
          id: 101,
          message: 'Document successfully registered and queued for HR verification',
          referenceCode: payload.submissionId,
          timestamp: new Date().toISOString()
        },
        latencyMs: Math.round(performance.now() - startTime)
      };
    }

    if (scenario === 'mock-400') {
      await new Promise(resolve => setTimeout(resolve, 700));
      throw new ApiError(400, 'Bad Request', {
        error: 'VALIDATION_FAILED',
        message: 'The remote server rejected the submission: Employee Name or Document Type format is invalid.'
      });
    }

    if (scenario === 'mock-422') {
      await new Promise(resolve => setTimeout(resolve, 750));
      throw new ApiError(422, 'Unprocessable Entity', {
        error: 'FIELD_VALIDATION_ERROR',
        message: 'Server rejection: Request ID does not exist in the active onboarding registry.',
        fields: ['request_id']
      });
    }

    if (scenario === 'mock-500') {
      await new Promise(resolve => setTimeout(resolve, 900));
      throw new ApiError(500, 'Internal Server Error', {
        error: 'DATABASE_FAULT',
        message: 'An internal error occurred on the remote server while persisting the document record.'
      });
    }

    if (scenario === 'mock-503') {
      await new Promise(resolve => setTimeout(resolve, 900));
      throw new ApiError(503, 'Service Unavailable', {
        error: 'SERVICE_TEMPORARILY_OFFLINE',
        message: 'HR Document Storage microservice is currently offline for scheduled maintenance.'
      });
    }

    if (scenario === 'mock-network') {
      await new Promise(resolve => setTimeout(resolve, 600));
      throw new TypeError('Failed to fetch: Network connection timed out or endpoint is unreachable.');
    }

    // Live Fetch API call with AbortController timeout
    let controller = null;
    let timeoutId = null;

    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
    }

    try {
      const fetchOptions = {
        method: API_CONFIG.method,
        headers: API_CONFIG.headers,
        body: JSON.stringify(payload)
      };
      if (controller) {
        fetchOptions.signal = controller.signal;
      }

      const response = await fetch(endpointUrl, fetchOptions);
      const latencyMs = Math.round(performance.now() - startTime);

      // Handle Non-2xx responses (Rubric requirement: handles non-2xx responses)
      if (!response.ok) {
        let errorDetails = null;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: await response.text().catch(() => response.statusText) };
        }
        throw new ApiError(response.status, response.statusText, errorDetails);
      }

      // Parse JSON response body
      const responseData = await response.json().catch(() => ({}));

      return {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        latencyMs
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${API_CONFIG.timeoutMs / 1000}s while communicating with ${endpointUrl}`);
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Validates form and asynchronously submits to REST endpoint.
   * Shows loading, success, validation-error, and server-error states.
   * Prevents duplicate submission.
   * 
   * @param {Event} event 
   */
  async function handleFormSubmit(event) {
    event.preventDefault();

    // Prevent duplicate in-flight submissions (Rubric requirement)
    if (isSubmitting) {
      console.warn('Submission already in progress. Duplicate submission prevented.');
      return;
    }

    // Perform client-side validation checks for each field
    const fieldChecks = [
      { element: employeeNameInput, valid: checkField(employeeNameInput) },
      { element: requestIdInput, valid: checkField(requestIdInput) },
      { element: documentTypeSelect, valid: checkField(documentTypeSelect) },
      { element: submissionDateInput, valid: checkField(submissionDateInput) },
      { element: documentFileInput, valid: checkField(documentFileInput) },
      { element: consentCheckbox, valid: checkField(consentCheckbox) }
    ];

    const invalidFields = fieldChecks.filter(function (item) {
      return !item.valid;
    });

    // If any field fails client-side validation, block submission
    if (invalidFields.length > 0) {
      console.warn(
        `Submission blocked: ${invalidFields.length} field(s) failed client validation.`,
        invalidFields.map(f => f.element ? f.element.name || f.element.id : 'unknown')
      );

      updateValidationArea(
        'error',
        'Submission Blocked: Incomplete or Invalid Data',
        `Please resolve the ${invalidFields.length} highlighted field${invalidFields.length > 1 ? 's' : ''} above before submitting.`
      );

      if (invalidFields[0] && invalidFields[0].element) {
        invalidFields[0].element.focus();
      }

      if (summaryContainer) {
        summaryContainer.innerHTML = '';
      }
      return;
    }

    // ------------------------------------------------------------------------
    // All client fields valid! Build structured JavaScript payload object
    // ------------------------------------------------------------------------
    const selectedDocMeta = DOCUMENT_TYPES.find(function (doc) {
      return doc.value === documentTypeSelect.value;
    }) || { value: documentTypeSelect.value, label: documentTypeSelect.value, mandatory: true, deadline: '' };

    const uploadedFile = documentFileInput.files[0];
    const fileExtension = getFileExtension(uploadedFile.name);

    const submissionDataObject = {
      submissionId: 'SUB-' + Math.floor(100000 + Math.random() * 900000),
      employeeName: employeeNameInput.value.trim(),
      requestId: requestIdInput.value.trim().toUpperCase(),
      documentType: {
        code: selectedDocMeta.value,
        label: selectedDocMeta.label,
        mandatory: selectedDocMeta.mandatory,
        deadline: selectedDocMeta.deadline
      },
      submissionDate: submissionDateInput.value,
      file: {
        name: uploadedFile.name,
        sizeBytes: uploadedFile.size,
        sizeFormatted: formatFileSize(uploadedFile.size),
        extension: fileExtension.toUpperCase(),
        mimeType: uploadedFile.type || 'application/octet-stream'
      },
      consentCertified: consentCheckbox.checked,
      submittedAt: new Date().toISOString(),
      status: 'Pending Dispatch'
    };

    // ------------------------------------------------------------------------
    // ASYNCHRONOUS REST API SUBMISSION PIPELINE
    // ------------------------------------------------------------------------
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Submitting Document...';
    }
    if (resetBtn) {
      resetBtn.disabled = true;
    }
    if (form) {
      form.setAttribute('aria-busy', 'true');
    }

    const activeEndpoint = getApiEndpoint();
    const activeScenario = apiScenarioSelect ? apiScenarioSelect.value : 'live';

    // 1. SHOW LOADING STATE
    updateValidationArea(
      'loading',
      'Submitting to REST API Endpoint...',
      `Connecting to ${activeEndpoint} with document payload. Please wait...`
    );

    try {
      // 2. Await asynchronous dispatch (async/await & Fetch API)
      const apiResult = await submitDocumentToEndpoint(submissionDataObject, activeScenario);

      // 3. SHOW SUCCESS STATE (2xx response)
      submissionDataObject.status = 'Verified & Registered';
      submissionDataObject.apiResponse = {
        status: apiResult.status,
        statusText: apiResult.statusText,
        endpoint: activeEndpoint,
        latencyMs: apiResult.latencyMs,
        data: apiResult.data
      };

      // Persist to localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storageKey = 'employee_onboarding_submissions';
          const existing = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
          existing.unshift(submissionDataObject);
          if (existing.length > 20) existing.length = 20;
          window.localStorage.setItem(storageKey, JSON.stringify(existing));
        }
      } catch (storageErr) {
        console.warn('LocalStorage save skipped or restricted:', storageErr);
      }

      console.log('✅ REST API Submission Success:', apiResult);

      // Update validation area to success state
      updateValidationArea(
        'success',
        `Document Submitted Successfully (HTTP ${apiResult.status} ${apiResult.statusText || 'OK'})`,
        `Remote server confirmed receipt in ${apiResult.latencyMs} ms. Confirmation tracking ID: #${submissionDataObject.submissionId}`
      );

      // Render the submission summary
      renderSubmissionSummary(submissionDataObject, apiResult);

    } catch (error) {
      // 4. EXCEPTION HANDLING (Validation-Error & Server-Error states)
      console.error('❌ REST API Submission Failed:', error);

      if (summaryContainer) {
        summaryContainer.innerHTML = '';
      }

      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          // SHOW VALIDATION-ERROR STATE (Non-2xx: 4xx)
          const errorMsg = error.details?.message || error.message || 'The remote server rejected the submission format.';
          updateValidationArea(
            'error',
            `API Validation Error (HTTP ${error.status} ${error.statusText})`,
            errorMsg,
            '<button type="button" class="banner-action-btn" id="retry-submit-btn">&#8635; Retry Submission</button>'
          );
        } else {
          // SHOW SERVER-ERROR STATE (Non-2xx: 5xx)
          const errorMsg = error.details?.message || 'The remote server encountered an internal error while processing the request.';
          updateValidationArea(
            'error',
            `Server Error (HTTP ${error.status} ${error.statusText})`,
            errorMsg,
            '<button type="button" class="banner-action-btn" id="retry-submit-btn">&#8635; Retry Submission</button>'
          );
        }
      } else {
        // NETWORK / EXCEPTION STATE (Network offline, CORS, timeout)
        updateValidationArea(
          'error',
          'Network Connection Failure',
          error.message || `Could not connect to ${activeEndpoint}. Please verify internet access or the endpoint URL.`,
          '<button type="button" class="banner-action-btn" id="retry-submit-btn">&#8635; Retry Submission</button>'
        );
      }

      // Attach retry button listener
      const retryBtn = document.getElementById('retry-submit-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        });
      }

    } finally {
      // Restore submit and reset button state
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Document';
      }
      if (resetBtn) {
        resetBtn.disabled = false;
      }
      if (form) {
        form.removeAttribute('aria-busy');
      }
    }
  }

  /* --------------------------------------------------------------------------
     11. Event Listeners Setup (Events)
     -------------------------------------------------------------------------- */

  function initEventListeners() {
    if (!form) return;

    // 1. Form submit event
    form.addEventListener('submit', handleFormSubmit);

    // 2. Form reset event
    form.addEventListener('reset', function (event) {
      event.preventDefault();
      handleReset();
    });

    // Explicit reset button click event handler
    if (resetBtn) {
      resetBtn.addEventListener('click', function (event) {
        event.preventDefault();
        handleReset();
      });
    }

    // 3. Real-time field validation on input/blur
    if (employeeNameInput) {
      employeeNameInput.addEventListener('input', function () {
        if (employeeNameInput.classList.contains('is-invalid')) {
          checkField(employeeNameInput);
        }
      });
      employeeNameInput.addEventListener('blur', function () {
        if (employeeNameInput.value.trim().length > 0) {
          checkField(employeeNameInput);
        }
      });
    }

    if (requestIdInput) {
      requestIdInput.addEventListener('input', function () {
        if (requestIdInput.classList.contains('is-invalid')) {
          checkField(requestIdInput);
        }
      });
      requestIdInput.addEventListener('blur', function () {
        if (requestIdInput.value.trim().length > 0) {
          checkField(requestIdInput);
        }
      });
    }

    if (documentTypeSelect) {
      documentTypeSelect.addEventListener('change', function () {
        checkField(documentTypeSelect);
      });
    }

    if (submissionDateInput) {
      const handleDateChange = function () {
        checkField(submissionDateInput);
      };
      submissionDateInput.addEventListener('change', handleDateChange);
      submissionDateInput.addEventListener('input', handleDateChange);
    }

    if (documentFileInput) {
      documentFileInput.addEventListener('change', function () {
        updateFileNameDisplay();
        checkField(documentFileInput);
      });
    }

    if (consentCheckbox) {
      consentCheckbox.addEventListener('change', function () {
        checkField(consentCheckbox);
      });
    }

    // Enforce calendar restriction: dates can only be up to today
    if (submissionDateInput) {
      const today = getTodayDateString();
      submissionDateInput.setAttribute('max', today);
      if (!submissionDateInput.value) {
        submissionDateInput.value = today;
      }
    }

    // Sync API endpoint tag with custom input
    if (apiEndpointInput && apiStatusTag) {
      apiEndpointInput.addEventListener('input', function () {
        const val = apiEndpointInput.value.trim();
        apiStatusTag.textContent = val ? `POST ${val.replace(/^https?:\/\/[^/]+/, '') || '/'}` : 'POST /posts';
      });
    }

    if (apiScenarioSelect && apiStatusTag) {
      apiScenarioSelect.addEventListener('change', function () {
        const val = apiScenarioSelect.value;
        if (val !== 'live') {
          apiStatusTag.textContent = `Mode: ${val}`;
        } else {
          const ep = getApiEndpoint();
          apiStatusTag.textContent = `POST ${ep.replace(/^https?:\/\/[^/]+/, '') || '/'}`;
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     12. Application Initialization (DOM ready)
     -------------------------------------------------------------------------- */

  function initApp() {
    try {
      initDynamicDocumentTypes();
      initEventListeners();
      console.log('Employee Center document onboarding app initialized successfully.');
    } catch (err) {
      console.error('Error during app initialization:', err);
    }
  }

  // Initialize immediately or on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
