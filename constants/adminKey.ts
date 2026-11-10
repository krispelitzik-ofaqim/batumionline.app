// (owner, 9.11.2026) the admin key: remembered on this computer (10.11.2026) and sent as "x-admin-key" with every call to our API
let key = '';
try { key = (typeof localStorage !== 'undefined' && localStorage.getItem('btm_admin_key')) || ''; } catch (e) {}
export function setAdminKey(k: string) {
  key = k;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('btm_admin_key', k); } catch (e) {}
}
export function getAdminKey() { return key; }
// once loaded, every fetch to an /api/ address carries the key (the admin screens use plain fetch everywhere)
const g: any = globalThis as any;
if (!g.__btmAdminFetch && typeof g.fetch === 'function') {
  g.__btmAdminFetch = true;
  const orig = g.fetch.bind(g);
  g.fetch = (input: any, init: any = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (key && url.indexOf('/api/') >= 0) {
      const h = new Headers((init && init.headers) || (typeof input !== 'string' && input && input.headers) || {});
      h.set('x-admin-key', key);
      init = { ...(init || {}), headers: h };
    }
    return orig(input, init);
  };
}
