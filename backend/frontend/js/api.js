const API_BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('rms_token');
}
function setToken(token) {
  localStorage.setItem('rms_token', token);
}
function clearToken() {
  localStorage.removeItem('rms_token');
}

async function apiRequest(path, method = 'GET', body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // fetch itself failed — server unreachable, wrong port, offline, CORS block, etc.
    throw new Error('Could not reach the server. Check that the backend is running and try again.');
  }

  // Read the body as text first — some responses (crashes, proxies, wrong
  // port hitting a different server) aren't valid JSON or are empty, and
  // res.json() would throw its own confusing parser error in that case.
  const raw = await res.text();
  let json = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch (parseErr) {
      throw new Error(`Server returned an unexpected response (status ${res.status}). Check the backend logs.`);
    }
  }

  if (!res.ok) {
    throw new Error((json && json.message) || `Request failed (status ${res.status})`);
  }

  if (!json) {
    throw new Error('Server returned an empty response.');
  }

  return json;
}