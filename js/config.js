// =============================================================
// CONFIGURARE
// -------------------------------------------------------------
// Același proiect Supabase ca aplicația Frigider, deci aceleași
// conturi. Cheia „publishable" e făcută să fie publică: datele sunt
// protejate de regulile din supabase/medicamente.sql (doar emailurile
// din tabelul members au acces), nu de secretul cheii.
//
// Dacă lași cele două valori goale, aplicația rulează în MOD DEMO:
// datele stau doar în browserul curent.
// =============================================================

export const SUPABASE_URL = 'https://pkbnlaeoodsgizwrmmwy.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_8GcBnNaPHkPSz1cTnYFNCQ_aeKqLIIw';
