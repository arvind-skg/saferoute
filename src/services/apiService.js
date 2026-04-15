// API Service - connects frontend to Express backend
const API_BASE = 'http://localhost:3001/api';

async function request(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    console.error(`API Error [${url}]:`, err);
    throw err;
  }
}

// AUTH
export async function apiSignUp(name, username, password, email) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, username, password, email }),
  });
}

export async function apiSignIn(username, password) {
  return request('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function apiVerifyOtp(userId, otp) {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ userId, otp }),
  });
}

export async function apiGoogleLogin() {
  return request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      googleId: 'google_' + Date.now(),
      name: 'Google User',
      email: 'user@gmail.com',
    }),
  });
}

export async function apiUpdateSettings(userId, settings) {
  return request(`/auth/settings/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// TRIPS
export async function apiSaveTrip(tripData) {
  return request('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
}

export async function apiGetTrips(userId) {
  return request(`/trips/${userId}`);
}

// REPORTS
export async function apiGetReports() {
  return request('/reports');
}

export async function apiCreateReport(report) {
  return request('/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function apiUpvoteReport(reportId) {
  return request(`/reports/${reportId}/upvote`, { method: 'POST' });
}

// HEALTH
export async function apiHealthCheck() {
  return request('/health');
}
