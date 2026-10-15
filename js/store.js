// =============================================================
// STRATUL DE DATE
// -------------------------------------------------------------
// La fel ca în aplicația Frigider: restul aplicației vorbește doar
// cu funcțiile de aici. Două implementări cu aceleași funcții:
//   - `local`  → mod demo, datele în localStorage
//   - `remote` → Supabase (același proiect și aceleași conturi
//                ca Frigiderul)
// =============================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js?v=1';

export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// După ce coloană sortăm fiecare tabel.
const ORDER = { meds: 'name', shopping: 'created_at' };

// -------------------------------------------------------------
// 1) Supabase
// -------------------------------------------------------------
let sb = null;

async function client() {
  if (!sb) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return sb;
}

function check({ data, error }) {
  if (error) throw error;
  return data;
}

const remote = {
  async getUser() {
    const c = await client();
    const { data } = await c.auth.getSession();
    return data.session?.user ?? null;
  },
  async signIn(email, password) {
    const c = await client();
    return check(await c.auth.signInWithPassword({ email, password })).user;
  },
  async isMember() {
    const c = await client();
    return check(await c.rpc('is_member')) === true;
  },
  async signOut() {
    const c = await client();
    await c.auth.signOut();
  },
  async list(table) {
    const c = await client();
    return check(await c.from(table).select('*').order(ORDER[table]));
  },
  async insert(table, rows) {
    const c = await client();
    check(await c.from(table).insert(rows));
  },
  async update(table, id, patch) {
    const c = await client();
    check(await c.from(table).update(patch).eq('id', id));
  },
  async remove(table, ids) {
    if (!ids.length) return;
    const c = await client();
    check(await c.from(table).delete().in('id', ids));
  },
  async onChange(cb) {
    const c = await client();
    c.channel('medicamente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meds' }, () => cb())
      .subscribe();
  },
};

// -------------------------------------------------------------
// 2) Mod demo (localStorage)
// -------------------------------------------------------------
const KEY = 'medicamente-demo-v1';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

function readDb() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { meds: [], shopping: [] }; } catch { return { meds: [], shopping: [] }; }
}
let db = readDb();
const saveDb = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignorăm */ } };

const local = {
  async getUser() { return { email: 'demo' }; },
  async signIn() { return { email: 'demo' }; },
  async isMember() { return true; },
  async signOut() {},
  async list(table) {
    const key = ORDER[table];
    return JSON.parse(JSON.stringify(db[table]))
      .sort((a, b) => String(a[key]).localeCompare(String(b[key]), 'ro'));
  },
  async insert(table, rows) {
    for (const r of [].concat(rows)) {
      db[table].push({ id: uid(), created_at: new Date().toISOString(), symptoms: [], ...r });
    }
    saveDb();
  },
  async update(table, id, patch) {
    const row = db[table].find((r) => r.id === id);
    if (row) Object.assign(row, patch);
    saveDb();
  },
  async remove(table, ids) {
    db[table] = db[table].filter((r) => !ids.includes(r.id));
    saveDb();
  },
  async onChange(cb) {
    window.addEventListener('storage', (e) => { if (e.key === KEY) { db = readDb(); cb(); } });
  },
};

const impl = isDemo ? local : remote;

export const getUser = impl.getUser;
export const signIn = impl.signIn;
export const isMember = impl.isMember;
export const signOut = impl.signOut;
export const list = impl.list;
export const insert = impl.insert;
export const update = impl.update;
export const remove = impl.remove;
export const onChange = impl.onChange;
