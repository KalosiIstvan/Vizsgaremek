import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mysql from 'mysql2/promise';

const PORT = Number(process.env.PORT) || 3000;
const here = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(here, '..', 'frontend');

/* ---------- MySQL kapcsolat ---------- */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fust_parazs',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10
});

/* ---------- konstansok, segédek ---------- */
// A frontend a régi kategórianeveket használja, az adatbázisban magyar ENUM értékek vannak.
const TIPUS = { ettermek: 'etterem', trucks: 'food_truck', tuz: 'tuzrako' };
const KATEGORIAK = ['bbq', 'steak', 'egyeb'];
const MAX_HELY_KLIENSENKENT = 20;

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const kerekit = (n) => (n == null ? 0 : Math.round(Number(n) * 10) / 10);

function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  return salt.toString('hex') + ':' + crypto.scryptSync(pin, salt, 32).toString('hex');
}
function checkPin(pin, stored) {
  if (!stored || typeof pin !== 'string') return false;
  const [s, h] = stored.split(':');
  const calc = crypto.scryptSync(pin, Buffer.from(s, 'hex'), 32);
  return crypto.timingSafeEqual(calc, Buffer.from(h, 'hex'));
}

// Hibás PIN-ek korlátozása (memóriában): 5 hibás kísérlet / 10 perc
const hibak = new Map();
const zarolt = (k) => { const f = hibak.get(k); return !!f && f.n >= 5 && Date.now() - f.t < 600000; };
const hibasPin = (k) => {
  const f = hibak.get(k);
  if (!f || Date.now() - f.t >= 600000) hibak.set(k, { n: 1, t: Date.now() });
  else f.n++;
};
function pinEllenorzes(req, hely, pin) {
  const kulcs = req.ip + ':' + hely.id;
  if (zarolt(kulcs)) throw new HttpError(429, 'Túl sok hibás PIN. Próbáld később.');
  if (!checkPin(String(pin ?? ''), hely.pin_hash)) { hibasPin(kulcs); throw new HttpError(403, 'Hibás PIN.'); }
}

/* ---------- helyek lekérdezése ---------- */
async function helyekLekerdezese(feltetel, parameterek, kliens) {
  const [sorok] = await pool.query(
    `SELECT h.*,
       (SELECT AVG(e.csillag) FROM ertekelesek e WHERE e.hely_id = h.id) AS atlag,
       (SELECT COUNT(*)       FROM ertekelesek e WHERE e.hely_id = h.id) AS darab,
       (SELECT e.csillag      FROM ertekelesek e WHERE e.hely_id = h.id AND e.kliens_id = ?) AS sajat,
       (SELECT GROUP_CONCAT(k.kod ORDER BY k.id)
          FROM hely_kategoriak hk JOIN kategoriak k ON k.id = hk.kategoria_id
         WHERE hk.hely_id = h.id) AS kategoriak
     FROM helyek h
     WHERE ${feltetel}
     ORDER BY h.sorszam`,
    [kliens || '', ...parameterek]
  );

  // A regisztrált food truckok megállói
  const truckIdk = sorok.filter((s) => s.tipus === 'food_truck' && s.regisztralt).map((s) => s.id);
  const megallok = new Map();
  if (truckIdk.length) {
    const [m] = await pool.query(
      'SELECT hely_id, helyszin, mikor FROM megallok WHERE hely_id IN (?) ORDER BY id DESC',
      [truckIdk]
    );
    for (const r of m) {
      if (!megallok.has(r.hely_id)) megallok.set(r.hely_id, []);
      const lista = megallok.get(r.hely_id);
      if (lista.length < 8) lista.push({ place: r.helyszin, when: r.mikor });
    }
  }

  // A JSON mezők nevei a frontenddel egyeznek (where, desc, kat, ...).
  return sorok.map((s) => {
    const o = {
      id: s.id,
      kat: s.kategoriak || 'egyeb',
      name: s.nev,
      where: s.helyszin,
      desc: s.leiras,
      reg: !!s.regisztralt,
      mine: !!kliens && s.tulajdonos_kliens === kliens,
      hasPin: !!s.pin_hash,
      avg: kerekit(s.atlag),
      count: Number(s.darab) || 0,
      myRating: s.sajat || 0
    };
    if (s.tipus === 'food_truck' && s.regisztralt) o.stops = megallok.get(s.id) || [];
    return o;
  });
}
async function egyHely(id, kliens) {
  const [h] = await helyekLekerdezese('h.id = ?', [id], kliens);
  if (!h) throw new HttpError(404, 'Nem található.');
  return h;
}
async function nyersHely(id) {
  const [[hely]] = await pool.query('SELECT * FROM helyek WHERE id = ?', [id]);
  if (!hely) throw new HttpError(404, 'Nem található.');
  return hely;
}

/* ---------- API ---------- */
const api = express.Router();
const kliensAzonosito = (req) => clean(req.get('x-client-id'), 64);

// GET /api/helyek?cat=ettermek|trucks|tuz
api.get('/helyek', async (req, res) => {
  const tipus = TIPUS[req.query.cat];
  if (!tipus) throw new HttpError(400, 'Érvénytelen kategória.');
  res.json(await helyekLekerdezese('h.tipus = ?', [tipus], kliensAzonosito(req)));
});

// POST /api/helyek  (új hely / regisztráció)
api.post('/helyek', async (req, res) => {
  const kliens = kliensAzonosito(req);
  if (kliens.length < 8) throw new HttpError(400, 'Hiányzó kliensazonosító.');
  const b = req.body || {};
  const tipus = TIPUS[b.cat];
  if (!tipus) throw new HttpError(400, 'Érvénytelen kategória.');
  const nev = clean(b.name, 60), helyszin = clean(b.where, 90);
  if (!nev || !helyszin) throw new HttpError(400, 'A név és a helyszín kötelező.');
  const kategoria = KATEGORIAK.includes(b.kat) ? b.kat : 'egyeb';
  const leiras = clean(b.desc, 240) || (b.registered ? 'Regisztrált vendéglátóhely.' : 'Saját hozzáadott hely.');

  const [[{ db }]] = await pool.query('SELECT COUNT(*) AS db FROM helyek WHERE tulajdonos_kliens = ?', [kliens]);
  if (db >= MAX_HELY_KLIENSENKENT) throw new HttpError(429, 'Elérted a hozzáadható helyek maximumát.');

  let pinHash = null;
  if (tipus === 'food_truck') {
    if (!/^[0-9]{4}$/.test(String(b.pin ?? ''))) throw new HttpError(400, 'A PIN pontosan 4 számjegy legyen.');
    pinHash = hashPin(String(b.pin));
  }

  const id = 'c' + crypto.randomUUID();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO helyek (id, tipus, nev, helyszin, leiras, regisztralt, tulajdonos_kliens, pin_hash)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, tipus, nev, helyszin, leiras, b.registered ? 1 : 0, kliens, pinHash]
    );
    await conn.query(
      'INSERT INTO hely_kategoriak (hely_id, kategoria_id) SELECT ?, id FROM kategoriak WHERE kod = ?',
      [id, kategoria]
    );
    if (tipus === 'food_truck') {
      await conn.query('INSERT INTO megallok (hely_id, helyszin, mikor) VALUES (?,?,?)',
        [id, clean(b.now, 90) || helyszin, clean(b.when, 40) || 'ma']);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  res.status(201).json(await egyHely(id, kliens));
});

// DELETE /api/helyek/:id
api.delete('/helyek/:id', async (req, res) => {
  const kliens = kliensAzonosito(req);
  const hely = await nyersHely(req.params.id);
  if (hely.pin_hash) pinEllenorzes(req, hely, (req.body || {}).pin);
  else if (!hely.tulajdonos_kliens || hely.tulajdonos_kliens !== kliens) {
    throw new HttpError(403, 'Ezt a helyet nem törölheted.');
  }
  await pool.query('DELETE FROM helyek WHERE id = ?', [hely.id]);
  res.json({ ok: true });
});

// POST /api/helyek/:id/megallok  (food truck új helyszíne, PIN kell)
api.post('/helyek/:id/megallok', async (req, res) => {
  const hely = await nyersHely(req.params.id);
  if (hely.tipus !== 'food_truck' || !hely.pin_hash) throw new HttpError(404, 'Nem található.');
  const b = req.body || {};
  pinEllenorzes(req, hely, b.pin);
  const helyszin = clean(b.place, 90);
  if (!helyszin) throw new HttpError(400, 'Add meg az új helyszínt.');
  await pool.query('INSERT INTO megallok (hely_id, helyszin, mikor) VALUES (?,?,?)',
    [hely.id, helyszin, clean(b.when, 40) || 'frissítve']);
  // csak a legutóbbi 8 megálló marad
  await pool.query(
    `DELETE FROM megallok WHERE hely_id = ? AND id NOT IN
       (SELECT id FROM (SELECT id FROM megallok WHERE hely_id = ? ORDER BY id DESC LIMIT 8) AS legutobbi)`,
    [hely.id, hely.id]
  );
  const frissitett = await egyHely(hely.id, kliensAzonosito(req));
  res.json({ stops: frissitett.stops || [] });
});

// PUT /api/helyek/:id/ertekeles   { stars: 0-5 }   (0 = értékelés törlése)
api.put('/helyek/:id/ertekeles', async (req, res) => {
  const kliens = kliensAzonosito(req);
  if (kliens.length < 8) throw new HttpError(400, 'Hiányzó kliensazonosító.');
  const hely = await nyersHely(req.params.id);
  const csillag = Number((req.body || {}).stars);
  if (!Number.isInteger(csillag) || csillag < 0 || csillag > 5) {
    throw new HttpError(400, 'Az értékelés 0 és 5 közötti szám.');
  }
  if (csillag === 0) {
    await pool.query('DELETE FROM ertekelesek WHERE hely_id = ? AND kliens_id = ?', [hely.id, kliens]);
  } else {
    await pool.query(
      `INSERT INTO ertekelesek (hely_id, kliens_id, csillag) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE csillag = VALUES(csillag)`,
      [hely.id, kliens, csillag]
    );
  }
  const [[r]] = await pool.query(
    `SELECT AVG(csillag) AS atlag, COUNT(*) AS darab,
            (SELECT csillag FROM ertekelesek WHERE hely_id = ? AND kliens_id = ?) AS sajat
       FROM ertekelesek WHERE hely_id = ?`,
    [hely.id, kliens, hely.id]
  );
  res.json({ avg: kerekit(r.atlag), count: Number(r.darab) || 0, myRating: r.sajat || 0 });
});

// GET /api/homersekletek
api.get('/homersekletek', async (req, res) => {
  const [sorok] = await pool.query('SELECT hus, cel, homerseklet FROM homersekletek ORDER BY sorszam');
  res.json(sorok);
});

// GET /api/husok  (kalkulátor)
api.get('/husok', async (req, res) => {
  const [sorok] = await pool.query(
    'SELECT id, nev, teljes_nev, gramm_fo, sutesi_ido FROM husok ORDER BY sorszam'
  );
  res.json(sorok);
});

// GET /api/kviz  -> [{ id, kerdes, valaszok: [szöveg, ...], helyes: index }]
api.get('/kviz', async (req, res) => {
  const [kerdesek] = await pool.query('SELECT id, kerdes FROM kviz_kerdesek ORDER BY sorszam');
  const [valaszok] = await pool.query('SELECT id, kerdes_id, szoveg, helyes FROM kviz_valaszok ORDER BY id');
  res.json(kerdesek.map((k) => {
    const sajat = valaszok.filter((v) => v.kerdes_id === k.id);
    return { id: k.id, kerdes: k.kerdes, valaszok: sajat.map((v) => v.szoveg), helyes: sajat.findIndex((v) => v.helyes) };
  }));
});

// GET /api/gyik
api.get('/gyik', async (req, res) => {
  const [sorok] = await pool.query('SELECT kerdes, valasz FROM gyik ORDER BY sorszam');
  res.json(sorok);
});

api.use((req, res) => { throw new HttpError(404, 'Ismeretlen végpont.'); });

/* ---------- szerver ---------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use('/api', api);
app.use(express.static(FRONTEND));

// Hibakezelő (az Express 5 az aszinkron hibákat is ide irányítja)
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Túl nagy kérés.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Érvénytelen JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Szerverhiba.' });
});

try {
  await pool.query('SELECT 1');
} catch (e) {
  console.error('Nem sikerült csatlakozni a MySQL-hez:', e.message);
  console.error('Ellenőrizd a .env fájlt, és futtasd: npm run db:setup');
  process.exit(1);
}
app.listen(PORT, () => console.log(`Füst & Parázs fut: http://localhost:${PORT}`));
