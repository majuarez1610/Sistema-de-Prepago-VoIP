const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Error HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export const api = {
  getHealth: () => request('/health'),

  getUsers: () => request('/api/users'),

  createUser: (payload) =>
    request('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  rechargeUser: (id, amount) =>
    request(`/api/users/${id}/recharge`, {
      method: 'PUT',
      body: JSON.stringify({ amount })
    }),

  getCalls: () => request('/api/calls'),

  getDecisions: () => request('/api/decisions'),

  getScheduleAnalysis: () => request('/api/calls/schedule-analysis'),

  syncTwilioCalls: (payload = {}) =>
    request('/api/calls/sync-twilio', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};