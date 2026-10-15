// =============================================================
// APLICAȚIA „MEDICAMENTE"
// -------------------------------------------------------------
// Aceeași idee ca la Frigider:
//   1. Datele afișate stau în `state`.
//   2. `render()` desenează ecranul curent doar din `state`.
//   3. Butoanele (data-action) și formularele (id) cheamă funcțiile
//      din `actions` / `forms`, care modifică datele și redesenează.
// =============================================================

import * as store from './store.js?v=1';
import { SYMPTOMS, symptomLabel, suggestSymptoms } from './catalog.js?v=1';
import { norm, esc, monthToDate, dateToMonth, showMonth, daysLeft } from './util.js?v=1';

const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const tabsEl = $('#tabs');

// Formele în care vin medicamentele (opțional).
const FORMS = ['Comprimate', 'Capsule', 'Plicuri', 'Sirop', 'Picături', 'Spray', 'Cremă / gel', 'Supozitoare', 'Altele'];

// Sub câte zile apare „expiră curând".
const SOON = 60;

const state = {
  tab: 'sertar',
  meds: [],
  user: null,
  filter: null,      // simptomul ales în Sertar
  query: '',         // căutare după nume
  openMed: null,     // medicamentul pe care ai apăsat
  editId: null,      // medicamentul pe care îl editezi (null = adaugi unul nou)
  draft: null,       // ce e completat în formular: { name, form, quantity, exp, symptoms, note }
  touched: false,    // ai bifat/debifat simptome de mână → nu mai sugerăm automat
};

const TITLES = { sertar: 'Medicamente', adauga: 'Adaugă', setari: 'Setări' };

function emptyDraft() {
  return { name: '', form: '', quantity: '', exp: '', symptoms: [], note: '' };
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2400);
}

function expiryBadge(iso) {
  const d = daysLeft(iso);
  if (d === null) return '<span class="badge muted-b">fără dată</span>';
  if (d < 0) return `<span class="badge bad">expirat ${showMonth(iso)}</span>`;
  if (d <= SOON) return `<span class="badge warn">expiră ${showMonth(iso)}</span>`;
  return `<span class="badge ok">până la ${showMonth(iso)}</span>`;
}

// Expirate primele, apoi cele care expiră curând, apoi alfabetic.
function byExpiry(a, b) {
  const da = daysLeft(a.expires_on) ?? 99999, db = daysLeft(b.expires_on) ?? 99999;
  return (da - db) || a.name.localeCompare(b.name, 'ro');
}

// -------------------------------------------------------------
// Date și desenare
// -------------------------------------------------------------

async function loadAll(force = true) {
  state.meds = await store.list('meds');
  for (const m of state.meds) m.symptoms ??= [];
  render(force);
}

let pendingRender = false;
const isTyping = () => view.contains(document.activeElement) && document.activeElement.matches('input, textarea, select');
view.addEventListener('focusout', () => {
  setTimeout(() => { if (pendingRender && !isTyping()) render(); }, 0);
});

function render(force = true) {
  if (!force && isTyping()) { pendingRender = true; return; }
  pendingRender = false;

  const loggedOut = !store.isDemo && !state.user;
  tabsEl.hidden = loggedOut;
  $('#title').textContent = loggedOut ? 'Medicamente'
    : state.tab === 'adauga' && state.editId ? 'Modifică' : TITLES[state.tab];
  view.innerHTML = loggedOut ? viewLogin() : VIEWS[state.tab]();
  for (const b of tabsEl.querySelectorAll('button')) b.classList.toggle('active', b.dataset.tab === state.tab);

  const expired = state.meds.filter((m) => (daysLeft(m.expires_on) ?? 1) < 0).length;
  $('#expCount').textContent = expired || '';
}

// -------------------------------------------------------------
// Ecranul „Sertar"
// -------------------------------------------------------------

function medRow(m) {
  const open = state.openMed === m.id;
  const expired = (daysLeft(m.expires_on) ?? 1) < 0;
  return `
    <li class="${expired ? 'is-expired' : ''}">
      <button class="item-main" data-action="toggle" data-id="${m.id}">
        <span class="name">${esc(m.name)}</span>
        ${m.form ? `<span class="qty-t">${esc(m.form)}</span>` : ''}
        ${m.quantity ? `<span class="qty-t">· ${esc(m.quantity)}</span>` : ''}
        ${expiryBadge(m.expires_on)}
        <span class="tags">${m.symptoms.map((s) => `<span class="tag">${esc(symptomLabel(s))}</span>`).join('')}</span>
        ${m.note ? `<span class="note">${esc(m.note)}</span>` : ''}
      </button>
      ${open ? `
        <div class="item-actions">
          <button class="secondary" data-action="edit" data-id="${m.id}">Modifică</button>
          <button class="secondary" data-action="done" data-id="${m.id}">${expired ? 'Aruncat' : 'Terminat'}</button>
        </div>
        <div class="item-actions">
          <button class="primary" data-action="done-shop" data-id="${m.id}">${expired ? 'Aruncat' : 'Terminat'} + pe lista de cumpărături</button>
        </div>` : ''}
    </li>`;
}

function viewSertar() {
  const q = norm(state.query);
  let meds = state.meds.filter((m) =>
    (!state.filter || m.symptoms.includes(state.filter)) && (!q || norm(m.name).includes(q)));
  meds = meds.sort(byExpiry);

  const valid = meds.filter((m) => (daysLeft(m.expires_on) ?? 1) >= 0);
  const expired = meds.filter((m) => (daysLeft(m.expires_on) ?? 1) < 0);

  // Câte medicamente bune aveți pentru fiecare simptom.
  const count = (id) => state.meds.filter((m) => m.symptoms.includes(id) && (daysLeft(m.expires_on) ?? 1) >= 0).length;
  const chips = SYMPTOMS.map((s) => {
    const n = count(s.id);
    return `<button class="chip ${state.filter === s.id ? 'on' : ''} ${n ? '' : 'none'}" data-action="filter" data-s="${s.id}">
      ${esc(s.label)} <span class="n">${n}</span></button>`;
  }).join('');

  const heading = state.filter ? `Pentru: ${esc(symptomLabel(state.filter))}` : 'În sertar';
  const emptyMsg = state.filter
    ? `Nu aveți nimic valabil pentru „${esc(symptomLabel(state.filter))}”.`
    : state.meds.length ? 'Nimic nu se potrivește căutării.' : 'Sertarul e gol. Apasă „Adaugă” jos ca să pui primul medicament.';

  return `
    <section class="card">
      <p class="muted small" style="margin:0 0 8px">Ce simptom ai? Apasă și vezi ce aveți în casă.</p>
      <div class="chips sym">${chips}</div>
      <input id="q" class="search" type="search" placeholder="Caută după nume" value="${esc(state.query)}" autocomplete="off">
    </section>

    <h2>${heading} <span class="muted">(${valid.length})</span></h2>
    <ul class="list">${valid.map(medRow).join('') || `<li class="empty">${emptyMsg}</li>`}</ul>

    ${expired.length ? `
      <h2 class="bad-h">Expirate, nu le mai folosiți <span class="muted">(${expired.length})</span></h2>
      <ul class="list">${expired.map(medRow).join('')}</ul>` : ''}

    <p class="disclaimer">Aplicația doar ține evidența sertarului. Pentru doze, interacțiuni și dacă un medicament e potrivit pentru tine: prospectul, farmacistul sau medicul.</p>`;
}

// -------------------------------------------------------------
// Ecranul „Adaugă / Modifică"
// -------------------------------------------------------------

function viewAdauga() {
  const d = state.draft ?? (state.draft = emptyDraft());
  const chips = SYMPTOMS.map((s) =>
    `<button type="button" class="chip ${d.symptoms.includes(s.id) ? 'on' : ''}" data-action="sym" data-s="${s.id}">${esc(s.label)}</button>`).join('');

  return `
    <form id="save" class="card add">
      <label class="lbl" for="f-name">Nume</label>
      <input id="f-name" name="name" placeholder="ex. Paracetamol 500 mg" value="${esc(d.name)}" autocomplete="off" maxlength="80" required>

      <div class="row two">
        <div>
          <label class="lbl" for="f-form">Formă</label>
          <select id="f-form" name="form">
            <option value="">—</option>
            ${FORMS.map((f) => `<option ${d.form === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="lbl" for="f-qty">Cât a rămas</label>
          <input id="f-qty" name="quantity" placeholder="ex. 8 buc." value="${esc(d.quantity)}" autocomplete="off" maxlength="40">
        </div>
      </div>

      <label class="lbl" for="f-exp">Expiră (luna și anul de pe cutie)</label>
      <input id="f-exp" name="exp" type="month" value="${esc(d.exp)}" placeholder="AAAA-LL">

      <label class="lbl">Pentru ce e <span class="muted small">(bifate automat pentru cele cunoscute; verifică în prospect)</span></label>
      <div class="chips">${chips}</div>

      <label class="lbl" for="f-note">Notă <span class="muted small">(opțional)</span></label>
      <input id="f-note" name="note" placeholder="ex. pentru copii, recomandat de medic" value="${esc(d.note)}" autocomplete="off" maxlength="120">

      <button class="primary">${state.editId ? 'Salvează modificările' : 'Pune în sertar'}</button>
      ${state.editId ? '<button type="button" class="secondary" data-action="cancel-edit">Renunță</button>' : ''}
    </form>`;
}

// Ținem `draft` la zi cât scrii, ca bifele să nu șteargă textul.
function readForm() {
  const f = $('#save');
  if (!f || !state.draft) return;
  const data = Object.fromEntries(new FormData(f));
  Object.assign(state.draft, { name: data.name, form: data.form, quantity: data.quantity, exp: data.exp, note: data.note });
}

view.addEventListener('input', (e) => {
  if (e.target.id === 'q') {
    state.query = e.target.value;
    // redesenăm doar listele, păstrând focusul în câmpul de căutare
    const pos = e.target.selectionStart;
    render();
    const q = $('#q');
    q.focus();
    q.setSelectionRange(pos, pos);
    return;
  }
  if (e.target.id === 'f-name' && !state.touched) {
    readForm();
    const s = suggestSymptoms(e.target.value);
    const changed = s.join() !== state.draft.symptoms.join();
    if (changed) {
      state.draft.symptoms = s;
      document.querySelectorAll('[data-action="sym"]').forEach((b) => b.classList.toggle('on', s.includes(b.dataset.s)));
    }
  }
});

// -------------------------------------------------------------
// Ecranul „Setări" și login
// -------------------------------------------------------------

function viewSetari() {
  return `
    <h2>Cont</h2>
    <section class="card">
      ${store.isDemo
        ? '<p style="margin:0">Rulezi în <b>mod demo</b>: datele stau doar pe acest dispozitiv.</p>'
        : `<p style="margin-top:0">Conectat ca <b>${esc(state.user?.email)}</b></p>
           <button class="secondary block" data-action="logout">Deconectare</button>`}
    </section>
    <h2>Pe iPhone</h2>
    <section class="card small">
      În Safari: butonul <b>Partajează</b> → <b>Adaugă pe ecranul principal</b>.
    </section>
    <h2>Cum se citește data</h2>
    <section class="card small">
      Pe cutie scrie de obicei luna și anul (ex. EXP 03/2027). Medicamentul e bun până la sfârșitul lunii respective.
      Siropurile, picăturile de ochi și unele creme au termen mai scurt după deschidere; scrie-l la „Notă” dacă e cazul.
    </section>`;
}

function viewLogin() {
  return `
    <section class="card">
      <p style="margin-top:0">Intră cu același email și aceeași parolă ca în aplicația Frigider.</p>
      <form id="login" class="add">
        <input name="email" type="email" placeholder="email@exemplu.ro" autocomplete="username" required>
        <input name="password" type="password" placeholder="Parola" autocomplete="current-password" required>
        <button class="primary">Intră</button>
      </form>
    </section>`;
}

const VIEWS = { sertar: viewSertar, adauga: viewAdauga, setari: viewSetari };

// -------------------------------------------------------------
// Acțiuni
// -------------------------------------------------------------

function go(tab) {
  state.tab = tab;
  state.openMed = null;
  render();
  window.scrollTo(0, 0);
}

const actions = {
  filter(btn) {
    state.filter = state.filter === btn.dataset.s ? null : btn.dataset.s;
    state.openMed = null;
    render();
  },

  toggle(btn) {
    state.openMed = state.openMed === btn.dataset.id ? null : btn.dataset.id;
    render();
  },

  sym(btn) {
    readForm();
    state.touched = true;
    const s = state.draft.symptoms;
    const id = btn.dataset.s;
    state.draft.symptoms = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
    btn.classList.toggle('on');
  },

  edit(btn) {
    const m = state.meds.find((x) => x.id === btn.dataset.id);
    state.editId = m.id;
    state.touched = true;
    state.draft = {
      name: m.name, form: m.form || '', quantity: m.quantity || '',
      exp: dateToMonth(m.expires_on), symptoms: [...m.symptoms], note: m.note || '',
    };
    go('adauga');
  },

  'cancel-edit'() {
    state.editId = null;
    state.draft = null;
    state.touched = false;
    go('sertar');
  },

  async done(btn) {
    await store.remove('meds', [btn.dataset.id]);
    state.openMed = null;
    await loadAll();
  },

  // Pune numele pe lista de cumpărături din aplicația Frigider.
  async 'done-shop'(btn) {
    const m = state.meds.find((x) => x.id === btn.dataset.id);
    await store.insert('shopping', { name: m.name });
    await store.remove('meds', [m.id]);
    state.openMed = null;
    await loadAll();
    toast(`${m.name} — pe lista de cumpărături`);
  },

  async logout() {
    await store.signOut();
    state.user = null;
    render();
  },
};

const forms = {
  async save() {
    readForm();
    const d = state.draft;
    const name = d.name.trim();
    if (!name) return;
    if (d.exp && !monthToDate(d.exp)) { toast('Data trebuie să fie de forma AAAA-LL, ex. 2027-03'); return; }
    const row = {
      name,
      form: d.form || null,
      quantity: d.quantity.trim() || null,
      expires_on: monthToDate(d.exp),
      symptoms: d.symptoms.length ? d.symptoms : ['altele'],
      note: d.note.trim() || null,
    };
    if (state.editId) await store.update('meds', state.editId, row);
    else await store.insert('meds', row);
    toast(state.editId ? 'Salvat' : `${name} — pus în sertar`);
    const wasEdit = Boolean(state.editId);
    state.editId = null;
    state.draft = null;
    state.touched = false;
    await loadAll(false);
    if (wasEdit) go('sertar');
    else { render(); $('#f-name')?.focus(); } // rămâi aici ca să adaugi următorul
  },

  async login(data) {
    try {
      state.user = await store.signIn(data.email.trim(), data.password);
    } catch {
      toast('Email sau parolă greșită');
      return;
    }
    await startSession();
  },
};

// -------------------------------------------------------------
// Evenimente
// -------------------------------------------------------------

view.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || !actions[btn.dataset.action]) return;
  e.preventDefault();
  btn.disabled = true;
  try {
    await actions[btn.dataset.action](btn);
  } catch (err) {
    console.error(err);
    toast('Eroare: ' + (err.message || err));
  } finally {
    btn.disabled = false;
  }
});

view.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    await forms[form.id]?.(Object.fromEntries(new FormData(form)), form);
  } catch (err) {
    console.error(err);
    toast('Eroare: ' + (err.message || err));
  }
});

tabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  if (btn.dataset.tab === 'adauga' && !state.editId) { state.draft = null; state.touched = false; }
  if (btn.dataset.tab !== 'adauga') { state.editId = null; state.draft = null; state.touched = false; }
  go(btn.dataset.tab);
});

// -------------------------------------------------------------
// Pornire
// -------------------------------------------------------------

async function startSession() {
  if (!(await store.isMember())) {
    await store.signOut();
    state.user = null;
    render();
    toast('Emailul ăsta nu e pe lista casei');
    return;
  }
  await loadAll();
  if (!startSession.listening) {
    startSession.listening = true;
    await store.onChange(() => loadAll(false).catch(console.error));
  }
}

async function init() {
  $('#mode').textContent = store.isDemo ? 'mod demo' : '';
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (store.isDemo || state.user)) loadAll(false).catch(console.error);
  });
  if (!store.isDemo) {
    state.user = await store.getUser();
    if (!state.user) { render(); return; }
  }
  await startSession();
}

init().catch((err) => {
  console.error(err);
  view.innerHTML = `<p class="card">Nu am putut porni aplicația: ${esc(err.message || err)}</p>`;
});
