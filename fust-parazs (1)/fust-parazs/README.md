# Füst & Parázs

```
fust-parazs/
├── backend/               Express szerver + MySQL
│   ├── server.js          REST API (minden végpont itt van)
│   ├── setup-db.js        adatbázis létrehozása és feltöltése
│   ├── sql/schema.sql     táblák (magyar nevekkel)
│   ├── sql/adatok.sql     kezdő adatok
│   ├── .env.example       MySQL kapcsolat beállításai
│   └── package.json
└── frontend/              index.html, css/style.css, js/app.js
```

## Indítás

Szükséges: **Node.js 22.9+** és egy futó **MySQL 8** (vagy MariaDB 10.5+) szerver.

```bash
cd backend
cp .env.example .env      # írd át a DB_USER / DB_PASSWORD értékeket
npm install
npm run db:setup          # létrehozza a fust_parazs adatbázist és feltölti adatokkal
npm start
```

Ezután: http://localhost:3000

> `npm run db:setup` minden futtatáskor **törli és újra létrehozza** a táblákat, vagyis a felhasználók által felvitt adatok is elvesznek.

## Adatbázis: `fust_parazs`

| Tábla | Tartalom |
|---|---|
| `kategoriak` | BBQ, Steak, Egyéb |
| `helyek` | éttermek, food truckok, tűzrakóhelyek (`tipus` = `etterem` / `food_truck` / `tuzrako`), tulajdonos, hash-elt PIN |
| `hely_kategoriak` | hely ↔ kategória kapcsolat (egy helynek több kategóriája is lehet) |
| `megallok` | regisztrált food truckok megállói |
| `ertekelesek` | csillagok; (`hely_id`, `kliens_id`) az elsődleges kulcs, így egy böngésző egy helyet egyszer értékelhet |
| `homersekletek` | „Mikor kész a hús?” táblázat |
| `husok` | húskalkulátor adatai |
| `kviz_kerdesek`, `kviz_valaszok` | BBQ-kvíz |
| `gyik` | gyakori kérdések |

## API (backend/server.js)

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/api/helyek?cat=ettermek\|trucks\|tuz` | Helyek átlagértékeléssel és a saját értékeléssel |
| POST | `/api/helyek` | Új hely / regisztráció (food trucknál 4 számjegyű PIN kötelező) |
| DELETE | `/api/helyek/:id` | Törlés (PIN-es helynél PIN kell, egyébként csak a létrehozó törölhet; a kezdő adatok nem törölhetők) |
| POST | `/api/helyek/:id/megallok` | Food truck új helyszíne (PIN kell) |
| PUT | `/api/helyek/:id/ertekeles` | `{ "stars": 0-5 }` (0 = értékelés törlése) |
| GET | `/api/homersekletek` | hőmérséklet-táblázat |
| GET | `/api/husok` | húskalkulátor adatai |
| GET | `/api/kviz` | kvízkérdések válaszokkal |
| GET | `/api/gyik` | gyakori kérdések |

A böngésző egy véletlen azonosítót tárol (`X-Client-Id` fejléc), ez azonosítja a saját értékeléseket és hozzáadott helyeket. Bejelentkezés nincs.
A JSON mezők nevei (`where`, `desc`, `kat`, ...) a frontenddel egyeznek, az adatbázisban viszont magyar oszlopnevek vannak.
