// =============================================================
// SIMPTOME ȘI SUGESTII
// -------------------------------------------------------------
// SYMPTOMS: lista de simptome după care căutați în sertar.
//
// HINTS: când scrieți numele unui medicament cunoscut, aplicația
// bifează automat simptomele pentru care e folosit de obicei.
// E DOAR o sugestie, ca să nu le alegeți de fiecare dată de mână:
// verificați în prospect și debifați/bifați ce trebuie. Aplicația
// nu conține doze și nu înlocuiește prospectul sau farmacistul.
// =============================================================

import { norm } from './util.js?v=1';

export const SYMPTOMS = [
  { id: 'durere', label: 'Durere' },
  { id: 'febra', label: 'Febră' },
  { id: 'raceala', label: 'Răceală, gripă' },
  { id: 'gat', label: 'Durere în gât' },
  { id: 'tuse', label: 'Tuse' },
  { id: 'nas', label: 'Nas înfundat' },
  { id: 'alergie', label: 'Alergie' },
  { id: 'arsuri', label: 'Arsuri stomac' },
  { id: 'diaree', label: 'Diaree' },
  { id: 'constipatie', label: 'Constipație' },
  { id: 'greata', label: 'Greață' },
  { id: 'balonare', label: 'Balonare, digestie' },
  { id: 'spasme', label: 'Crampe, spasme' },
  { id: 'piele', label: 'Răni, arsuri piele' },
  { id: 'mancarime', label: 'Mâncărime, înțepături' },
  { id: 'muschi', label: 'Dureri musculare' },
  { id: 'ochi', label: 'Ochi' },
  { id: 'altele', label: 'Altele' },
];

export const symptomLabel = (id) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;

// [începuturi de cuvinte din nume, simptome sugerate]
const HINTS = [
  [['paracetamol', 'panadol', 'efferalgan', 'perfalgan'], ['durere', 'febra']],
  [['ibuprofen', 'nurofen', 'paduden', 'advil', 'ibalgin'], ['durere', 'febra']],
  [['aspirin', 'acid acetilsalicilic'], ['durere', 'febra']],
  [['algocalmin', 'metamizol'], ['durere', 'febra']],
  [['ketonal', 'ketoprofen', 'dexketoprofen'], ['durere']],
  [['no-spa', 'nospa', 'drotaverin', 'scobutil'], ['spasme']],
  [['coldrex', 'theraflu', 'fervex', 'nurofen raceala', 'paracetamol raceala'], ['raceala', 'febra']],
  [['strepsils', 'tantum', 'faringosept', 'septolete', 'dorithricin', 'mebucaina', 'hexoral'], ['gat']],
  [['acc ', 'acetilcistein', 'mucosolvan', 'ambroxol', 'bromhexin', 'erdomed'], ['tuse']],
  [['sinecod', 'tusin', 'stoptussin', 'codein'], ['tuse']],
  [['nasivin', 'olynth', 'otrivin', 'bixtonim', 'vibrocil', 'xilometazolin', 'oximetazolin'], ['nas']],
  [['ser fiziologic', 'sterimar', 'marimer', 'aqua maris'], ['nas']],
  [['claritine', 'loratadin', 'aerius', 'desloratadin', 'zyrtec', 'cetirizin', 'xyzal', 'levocetirizin', 'telfast'], ['alergie']],
  [['fenistil'], ['mancarime', 'alergie']],
  [['rennie', 'maalox', 'dicarbocalm', 'gaviscon', 'talcid', 'omeprazol', 'controloc', 'pantoprazol', 'nolpaza'], ['arsuri']],
  [['smecta', 'imodium', 'loperamid', 'enterol', 'saccharomyces'], ['diaree']],
  [['linex', 'probiotic', 'bioflor'], ['diaree']],
  [['dulcolax', 'bisacodil', 'duphalac', 'lactuloza', 'guttalax', 'forlax'], ['constipatie']],
  [['metoclopramid', 'domperidon', 'motilium'], ['greata']],
  [['espumisan', 'simeticon', 'mezym', 'creon', 'triferment', 'colebil'], ['balonare']],
  [['carbune', 'carbo'], ['balonare', 'diaree']],
  [['bepanthen', 'dexpantenol', 'panthenol'], ['piele']],
  [['betadin', 'iod povidon', 'rivanol', 'apa oxigenata', 'cicatridina', 'alcool sanitar'], ['piele']],
  [['voltaren', 'diclofenac', 'fastum', 'reparil', 'dolobene', 'ketonal gel'], ['muschi', 'durere']],
  [['hydrocortizon', 'hidrocortizon', 'locoid'], ['mancarime']],
  [['picaturi de ochi', 'lacrimi artificiale', 'systane', 'visine', 'hylo'], ['ochi']],
];

// Sugestii de simptome pentru un nume de medicament.
export function suggestSymptoms(name) {
  const t = ' ' + norm(name) + ' ';
  const found = new Set();
  for (const [stems, symptoms] of HINTS) {
    if (stems.some((s) => t.includes(' ' + s))) symptoms.forEach((x) => found.add(x));
  }
  return [...found];
}
