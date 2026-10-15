# Medicamente

Evidența sertarului cu medicamente, comună pentru doi: ce aveți, când expiră și pentru ce simptom e fiecare.
Merge pe iPhone ca o aplicație (de pe ecranul principal), fără App Store.

**Ce face**
- **Sertar:** apeși un simptom (durere, febră, tuse, alergie…) și vezi ce aveți valabil pentru el.
  Expiratele apar separat, cu roșu; numărul lor apare pe iconița „Sertar".
- **Adaugă:** nume, formă, cât a rămas, luna de expirare de pe cutie și simptomele.
  Pentru medicamentele cunoscute (Paracetamol, Nurofen, Smecta, Claritine…) simptomele se bifează singure; verificați-le în prospect.
- **Terminat + pe lista de cumpărături:** numele ajunge pe lista din aplicația Frigider.

Aplicația doar ține evidența. Nu conține doze și nu înlocuiește prospectul, farmacistul sau medicul.

## Instalare

Folosește **același proiect Supabase** ca aplicația Frigider (aceleași conturi, aceeași listă a casei).

1. Supabase → **SQL Editor → New query** → lipește `supabase/medicamente.sql` → **Run**.
2. GitHub → repo → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → **Save**.
3. Pe iPhone, în Safari: adresa site-ului → **Partajează → Adaugă pe ecranul principal** → intri cu emailul și parola de la Frigider.

## Cum e construit codul

```
index.html            scheletul paginii
css/style.css         aspectul (același ca la Frigider + câteva reguli la final)
js/config.js          adresa și cheia publică Supabase
js/store.js           citire/scriere: Supabase sau mod demo (localStorage)
js/util.js            funcții mici: diacritice, date, lunile de expirare
js/catalog.js         lista de simptome și sugestiile pentru medicamente cunoscute
js/app.js             ecranele, butoanele, formularul
supabase/medicamente.sql  tabelul meds și regula de acces
versiune.sh           schimbă ?v=N în legături după o actualizare
```

- **Data de expirare:** pe cutie scrie doar luna (EXP 03/2027). Medicamentul e bun până la sfârșitul lunii,
  așa că `monthToDate()` din `util.js` salvează ultima zi a lunii (2027-03-31).
- **Simptomele** stau într-o singură coloană de tip listă (`symptoms text[]`), ex. `{durere,febra}`.
- **Sugestiile** (`catalog.js`): dacă numele conține un cuvânt cunoscut („nurofen", „smecta"), se bifează simptomele
  din lista `HINTS`. Dacă bifați ceva de mână, sugestiile automate se opresc pentru acel formular.
- Poți adăuga medicamente în `HINTS` după modelul celor existente.
