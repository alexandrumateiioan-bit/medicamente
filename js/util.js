// =============================================================
// Funcții mici folosite peste tot
// =============================================================

// „Ouă Proaspete" → „oua proaspete": litere mici, fără diacritice.
export function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Orice text scris de voi trece prin esc() înainte să ajungă în HTML.
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Data de azi în formatul AAAA-LL-ZZ, în ora locală.
export function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// Pe cutie scrie doar luna și anul (ex. 03/2027). Medicamentul e bun
// până la ULTIMA zi a lunii, așa că salvăm data de 31 (sau 30, 28...).
export function monthToDate(ym) {
  if (!/^\d{4}-\d{2}$/.test(ym || '')) return null;
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(last).padStart(2, '0')}`;
}

export const dateToMonth = (iso) => (iso ? iso.slice(0, 7) : '');

// „2027-03-31" → „03/2027"
export const showMonth = (iso) => (iso ? `${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

// Câte zile mai sunt până la expirare (negativ = a expirat).
export function daysLeft(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);
}
