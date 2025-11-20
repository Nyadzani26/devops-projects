// Enhanced Admin API Utilities
const API_BASE = (() => {
  const hostname = location.hostname;
  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    return 'http://127.0.0.1:8000';
  }
  // TODO: Update with production backend URL when deployed
  // For example: return 'https://your-backend-api.com';
  return 'http://127.0.0.1:8000';
})();

// ---- Enhanced Auth helpers ----
function getToken() {
  return localStorage.getItem('portfolio_token');
}

function setToken(t) {
  localStorage.setItem('portfolio_token', t);
}

function clearToken() {
  localStorage.removeItem('portfolio_token');
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

// ---- Enhanced error message parsing ----
function parseErrorMessage(errorData) {
  console.log('Raw error data:', errorData); // For debugging

  if (typeof errorData === 'string') {
    return errorData;
  }

  if (errorData && typeof errorData === 'object') {
    // Handle array of errors
    if (Array.isArray(errorData)) {
      return errorData.map(item => {
        if (typeof item === 'object' && item.msg) {
          return item.msg;
        }
        return JSON.stringify(item);
      }).join(', ');
    }

    // Handle error object with 'detail' property
    if (errorData.detail) {
      return parseErrorMessage(errorData.detail);
    }

    // Handle validation errors with nested structure
    if (errorData.error || errorData.message) {
      return errorData.error || errorData.message;
    }

    // Handle FastAPI-style validation errors
    const entries = Object.entries(errorData);
    if (entries.length > 0) {
      return entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`;
        }
        return `${key}: ${value}`;
      }).join('; ');
    }

    // Fallback: stringify the object
    return JSON.stringify(errorData);
  }

  return 'An unknown error occurred';
}

// ---- Enhanced API calls with better error handling ----
async function apiLogin(username, password) {
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${API_BASE}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      try {
        errorData = await res.text();
      } catch {
        errorData = 'Login failed';
      }
    }

    if (res.status === 401) {
      throw new Error('Invalid username or password');
    } else if (res.status >= 500) {
      throw new Error('Server error - please try again later');
    } else {
      throw new Error(parseErrorMessage(errorData));
    }
  }

  return res.json();
}

async function apiListCertificates({ skip = 0, limit = 50, issuer = '', tag = '', q = '' } = {}) {
  const qs = new URLSearchParams();
  if (skip) qs.set('skip', skip);
  if (limit) qs.set('limit', limit);
  if (issuer) qs.set('issuer', issuer);
  if (tag) qs.set('tag', tag);
  if (q) qs.set('q', q);

  const res = await fetch(`${API_BASE}/api/certificates?${qs.toString()}`);
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = 'Failed to load certificates';
    }

    if (res.status === 401) throw new Error('Session expired - please login again');
    throw new Error(parseErrorMessage(errorData));
  }
  return res.json();
}

async function apiCreateCertificate(formData) {
  const res = await authFetch(`${API_BASE}/api/certificates`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      try {
        errorData = await res.text();
      } catch {
        errorData = 'Failed to create certificate';
      }
    }

    if (res.status === 401) throw new Error('Session expired - please login again');
    if (res.status === 413) throw new Error('File too large - maximum size is 10MB');

    throw new Error(parseErrorMessage(errorData));
  }
  return res.json();
}

async function apiUpdateCertificate(id, payload) {
  const res = await authFetch(`${API_BASE}/api/certificates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      try {
        errorData = await res.text();
      } catch {
        errorData = 'Failed to update certificate';
      }
    }

    if (res.status === 401) throw new Error('Session expired - please login again');
    throw new Error(parseErrorMessage(errorData));
  }
  return res.json();
}

async function apiReplaceFile(id, file) {
  const fd = new FormData();
  fd.append('new_file', file);

  const res = await authFetch(`${API_BASE}/api/certificates/${id}/file`, {
    method: 'PUT',
    body: fd
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      try {
        errorData = await res.text();
      } catch {
        errorData = 'Failed to replace file';
      }
    }

    if (res.status === 401) throw new Error('Session expired - please login again');
    if (res.status === 413) throw new Error('File too large - maximum size is 10MB');

    throw new Error(parseErrorMessage(errorData));
  }
  return res.json();
}

async function apiDeleteCertificate(id) {
  const res = await authFetch(`${API_BASE}/api/certificates/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      try {
        errorData = await res.text();
      } catch {
        errorData = 'Failed to delete certificate';
      }
    }

    if (res.status === 401) throw new Error('Session expired - please login again');
    throw new Error(parseErrorMessage(errorData));
  }
  return res.json();
}

// ---- Enhanced UI helpers ----
function toast(el, msg, ok = true) {
  // Clear existing classes
  el.className = 'p-4 rounded-lg transition-all duration-300 animate-fade-in';

  if (ok) {
    el.className += ' bg-green-900/30 border border-green-800 text-green-300';
    el.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas fa-check-circle text-green-400"></i>
        <span>${msg}</span>
      </div>
    `;
  } else {
    el.className += ' bg-red-900/30 border border-red-800 text-red-300';
    el.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas fa-exclamation-triangle text-red-400"></i>
        <span>${msg}</span>
      </div>
    `;
  }

  setTimeout(() => {
    el.innerHTML = '';
    el.className = 'transition-all duration-300';
  }, 5000);
}

function guard() {
  if (!getToken()) {
    location.href = './login.html';
  }
}

// ---- Session management ----
function checkSession() {
  const token = getToken();
  if (token) {
    // You could add token expiration check here
    return true;
  }
  return false;
}

// ---- Expose enhanced API ----
window.AdminAPI = {
  API_BASE,
  getToken, setToken, clearToken,
  apiLogin,
  apiListCertificates, apiCreateCertificate, apiUpdateCertificate, apiReplaceFile, apiDeleteCertificate,
  toast, guard, checkSession,
  parseErrorMessage // Exposed for debugging
};

// Auto-redirect if token exists and on login page
if (window.location.pathname.includes('login.html') && getToken()) {
  window.location.href = './dashboard.html';
}