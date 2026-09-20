const config = window.PINPOINT_CONFIG || {};
export const configured = Boolean(config.supabaseUrl && config.supabaseKey);
const base = (config.supabaseUrl || '').replace(/\/$/, '');
export async function request(path, {token, ...options} = {}) {
  if (!configured) throw new Error('Connect Supabase first. See the setup guide.');
  const response = await fetch(base + path, {
    ...options,
    headers: {apikey: config.supabaseKey, ...(token ? {Authorization: `Bearer ${token}`} : {}), ...options.headers},
    signal: options.signal || AbortSignal.timeout(30000)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || data.message || data.error_description || data.error || `Request failed (${response.status})`);
  }
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
export async function getReveal() {
  if (!configured) return null;
  const rows = await request('/rest/v1/reveal_settings?id=eq.1&select=path,mime', {signal: AbortSignal.timeout(5000)});
  return rows[0]?.path ? {...rows[0], url: mediaUrl(rows[0].path)} : null;
}
export function mediaUrl(path) {return `${base}/storage/v1/object/public/reveals/${path.split('/').map(encodeURIComponent).join('/')}`;}
export const allowedTypes = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','audio/mpeg','audio/wav','audio/ogg'];
export function mediaElement(url, mime, controls = true) {
  const el = document.createElement(mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'img');
  el.src = url;
  if (el.tagName === 'IMG') el.alt = 'The prank reveal';
  else {el.controls = controls; el.playsInline = true; el.preload = 'auto';}
  return el;
}
