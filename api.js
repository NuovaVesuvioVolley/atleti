const VV_API_BASE = (window.VV_API_BASE || '').replace(/\/$/, '');
async function apiFetch(path, options = {}) {
  const res = await fetch(`${VV_API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Errore HTTP ${res.status}`);
  return data;
}
