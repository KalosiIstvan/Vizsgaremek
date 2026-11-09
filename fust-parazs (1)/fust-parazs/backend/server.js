import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mysql from 'mysql2/promise';

const PORT = Number(process.env.PORT) || 3000;
const here = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(here, '..', 'frontend');

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

const TIPUS = { ettermek: 'etterem', trucks: 'food_truck', tuz: 'tuzrako' };
const MAX_HELY_KLIENSENKENT = 20;

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const kerekit = (n) => (n == null ? 0 : Math.round(Number(n) * 10) / 10);

function hashJelszo(jelszo) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(jelszo, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function ellenorizJelszo(jelszo, tarolt) {
  if (!tarolt) return false;
  const [salt, hash] = tarolt.split(':');
  const calc = crypto.scryptSync(jelszo, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(hash, 'hex'));
}
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

function getBejelentkezettUser(req) {
  const userId = req.get('x-user-id');
  if (!userId) return null;
  return Number(userId);
}
function requireAuth(req, res, next) {
  const uid = getBejelentkezettUser(req);
  if (!uid) throw new HttpError(401, 'Bejelentkezés szükséges.');
  req.userId = uid;
  next();
}

async function helyekLekerdezese(tipus, felhasznaloId) {
  let where = '1=1';
  let params = [];
  if (tipus) { where += ' AND h.tipus = ?'; params.push(tipus); }

  const [sorok] = await pool.query(
    `SELECT h.*,
       (SELECT AVG(e.csillag) FROM ertekelesek e WHERE e.hely_id = h.id) AS atlag,
       (SELECT COUNT(*)       FROM ertekelesek e WHERE e.hely_id = h.id) AS darab,
       (SELECT e.csillag      FROM ertekelesek e WHERE e.hely_id = h.id AND e.felhasznalo_id = ?) AS sajat
     FROM helyek h WHERE ${where} ORDER BY h.sorszam`,
    [felhasznaloId || 0, ...params]
  );

  const truckIdk = sorok.filter((s) => s.tipus === 'food_truck' && s.regisztralt).map((s) => s.id);
  const megallok = new Map();
  if (truckIdk.length) {
    const [m] = await pool.query('SELECT hely_id, helyszin, mikor FROM megallok WHERE hely_id IN (?) ORDER BY id DESC', [truckIdk]);
    for (const r of m) {
      if (!megallok.has(r.hely_id)) megallok.set(r.hely_id, []);
      const lista = megallok.get(r.hely_id);
      if (lista.length < 8) lista.push({ place: r.helyszin, when: r.mikor });
    }
  }

  return sorok.map((s) => {
    const o = {
      id: s.id, tipus: s.tipus, nev: s.nev, helyszin: s.helyszin,
      megye: s.megye, leiras: s.leiras, regisztralt: !!s.regisztralt,
      tulajdonos_id: s.tulajdonos_id, avg: kerekit(s.atlag),
      count: Number(s.darab) || 0, myRating: s.sajat || 0
    };
    if (s.tipus === 'food_truck' && s.regisztralt) o.stops = megallok.get(s.id) || [];
    return o;
  });
}

async function egyHely(id, felhasznaloId) {
  const [sorok] = await pool.query('SELECT tipus FROM helyek WHERE id = ?', [id]);
  if (!sorok.length) throw new HttpError(404, 'Nem található.');
  const lista = await helyekLekerdezese(sorok[0].tipus, felhasznaloId);
  const talalat = lista.find(h => h.id === id);
  if (!talalat) throw new HttpError(404, 'Nem található.');
  return talalat;
}

async function nyersHely(id) {
  const [[hely]] = await pool.query('SELECT * FROM helyek WHERE id = ?', [id]);
  if (!hely) throw new HttpError(404, 'Nem található.');
  return hely;
}

const api = express.Router();

api.post('/auth/register', async (req, res) => {
  const { nev, email, jelszo, szerep } = req.body || {};
  if (!nev || !email || !jelszo) throw new HttpError(400, 'Minden mező kötelező.');
  const validSzerep = ['user', 'etterem', 'truck', 'mindketto'].includes(szerep) ? szerep : 'user';
  const hash = hashJelszo(jelszo);
  try {
    const [result] = await pool.query(
      'INSERT INTO felhasznalok (nev, email, jelszo_hash, szerep) VALUES (?, ?, ?, ?)',
      [clean(nev, 60), clean(email, 100), hash, validSzerep]
    );
    res.status(201).json({ message: 'Sikeres regisztráció', user: { id: result.insertId, nev, email, szerep: validSzerep } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ez az email már regisztrálva van.');
    throw e;
  }
});

api.post('/auth/login', async (req, res) => {
  const { email, jelszo } = req.body || {};
  if (!email || !jelszo) throw new HttpError(400, 'Email és jelszó kötelező.');
  const [[user]] = await pool.query('SELECT * FROM felhasznalok WHERE email = ?', [clean(email, 100)]);
  if (!user || !ellenorizJelszo(jelszo, user.jelszo_hash)) throw new HttpError(401, 'Hibás email vagy jelszó.');
  res.json({ message: 'Sikeres belépés', user: { id: user.id, nev: user.nev, email: user.email, szerep: user.szerep } });
});

api.get('/profil', requireAuth, async (req, res) => {
  const [[u]] = await pool.query('SELECT id, nev, email, szerep, letrehozva FROM felhasznalok WHERE id = ?', [req.userId]);
  if (!u) throw new HttpError(404, 'Felhasználó nem található.');
  const [helyek] = await pool.query('SELECT id, tipus, nev, helyszin, megye, leiras, letrehozva FROM helyek WHERE tulajdonos_id = ? ORDER BY letrehozva DESC', [req.userId]);
  const [receptek] = await pool.query('SELECT id, cim, kat, ido_perc, feltoltve FROM receptek WHERE feltolto_id = ? ORDER BY feltoltve DESC', [req.userId]);
  res.json({ user: u, helyek, receptek });
});

api.delete('/profil', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM helyek WHERE tulajdonos_id = ?', [req.userId]);
    await conn.query('DELETE FROM receptek WHERE feltolto_id = ?', [req.userId]);
    await conn.query('DELETE FROM felhasznalok WHERE id = ?', [req.userId]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json({ ok: true, message: 'Fiók és minden kapcsolódó adat törölve.' });
});

api.get('/helyek', async (req, res) => {
  const tipus = TIPUS[req.query.cat] || null;
  const uid = getBejelentkezettUser(req);
  res.json(await helyekLekerdezese(tipus, uid));
});

api.post('/helyek', requireAuth, async (req, res) => {
  const b = req.body || {};
  const tipus = TIPUS[b.cat];
  if (!tipus) throw new HttpError(400, 'Érvénytelen kategória.');
  const nev = clean(b.nev, 60);
  const helyszin = clean(b.helyszin, 90);
  const megye = clean(b.megye, 40) || 'Budapest';
  if (!nev || !helyszin) throw new HttpError(400, 'A név és a helyszín kötelező.');
  const leiras = clean(b.leiras, 240) || 'Regisztrált vendéglátóhely.';

  const [[{ db }]] = await pool.query('SELECT COUNT(*) AS db FROM helyek WHERE tulajdonos_id = ?', [req.userId]);
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
      `INSERT INTO helyek (id, tipus, nev, helyszin, megye, leiras, regisztralt, tulajdonos_id, pin_hash) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, tipus, nev, helyszin, megye, leiras, 1, req.userId, pinHash]
    );
    if (tipus === 'food_truck') {
      await conn.query('INSERT INTO megallok (hely_id, helyszin, mikor) VALUES (?,?,?)', [id, clean(b.now, 90) || helyszin, clean(b.when, 40) || 'ma']);
    }
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.status(201).json(await egyHely(id, req.userId));
});

api.delete('/helyek/:id', requireAuth, async (req, res) => {
  const hely = await nyersHely(req.params.id);
  if (hely.tulajdonos_id !== req.userId) throw new HttpError(403, 'Ezt a helyet nem törölheted.');
  await pool.query('DELETE FROM helyek WHERE id = ?', [hely.id]);
  res.json({ ok: true });
});

api.post('/helyek/:id/megallok', requireAuth, async (req, res) => {
  const hely = await nyersHely(req.params.id);
  if (hely.tipus !== 'food_truck') throw new HttpError(404, 'Nem található.');
  if (hely.tulajdonos_id !== req.userId) throw new HttpError(403, 'Nincs jogosultságod.');
  const helyszin = clean((req.body || {}).place, 90);
  if (!helyszin) throw new HttpError(400, 'Add meg az új helyszínt.');
  await pool.query('INSERT INTO megallok (hely_id, helyszin, mikor) VALUES (?,?,?)', [hely.id, helyszin, clean((req.body || {}).when, 40) || 'frissítve']);
  await pool.query(`DELETE FROM megallok WHERE hely_id = ? AND id NOT IN (SELECT id FROM (SELECT id FROM megallok WHERE hely_id = ? ORDER BY id DESC LIMIT 8) AS legutobbi)`, [hely.id, hely.id]);
  const frissitett = await egyHely(hely.id, req.userId);
  res.json({ stops: frissitett.stops || [] });
});

api.put('/helyek/:id/ertekeles', requireAuth, async (req, res) => {
  const hely = await nyersHely(req.params.id);
  const csillag = Number((req.body || {}).stars);
  if (!Number.isInteger(csillag) || csillag < 1 || csillag > 5) throw new HttpError(400, 'Az értékelés 1 és 5 közötti szám.');
  if (hely.tulajdonos_id === req.userId) throw new HttpError(403, 'A saját helyedet nem értékelheted.');
  await pool.query(`INSERT INTO ertekelesek (hely_id, felhasznalo_id, csillag) VALUES (?,?,?) ON DUPLICATE KEY UPDATE csillag = VALUES(csillag)`, [hely.id, req.userId, csillag]);
  const [[r]] = await pool.query(`SELECT AVG(csillag) AS atlag, COUNT(*) AS darab, (SELECT csillag FROM ertekelesek WHERE hely_id = ? AND felhasznalo_id = ?) AS sajat FROM ertekelesek WHERE hely_id = ?`, [hely.id, req.userId, hely.id]);
  res.json({ avg: kerekit(r.atlag), count: Number(r.darab) || 0, myRating: r.sajat || 0 });
});

// --- RECEPTEK ---
api.get('/receptek', async (req, res) => {
  const [sorok] = await pool.query(`SELECT r.*, f.nev AS feltolto_nev FROM receptek r LEFT JOIN felhasznalok f ON f.id = r.feltolto_id ORDER BY r.feltoltve DESC`);
  res.json(sorok);
});

api.post('/receptek', requireAuth, async (req, res) => {
  const { cim, kat, ido_perc, hozzavalok, lepesek } = req.body || {};
  if (!cim || !hozzavalok || !lepesek) throw new HttpError(400, 'A cím, a hozzávalók és a lépések kötelezőek.');
  const validKat = ['marha', 'sertes', 'csirke', 'hal', 'vega', 'egyeb'].includes(kat) ? kat : 'egyeb';
  const ido = Number(ido_perc) || 60;
  const [result] = await pool.query(`INSERT INTO receptek (cim, kat, ido_perc, hozzavalok, lepesek, feltolto_id) VALUES (?, ?, ?, ?, ?, ?)`, [clean(cim, 80), validKat, ido, hozzavalok, lepesek, req.userId]);
  res.status(201).json({ id: result.insertId, message: 'Recept sikeresen mentve.' });
});

// ÚJ: Recept módosítása
api.put('/receptek/:id', requireAuth, async (req, res) => {
  const { cim, kat, ido_perc, hozzavalok, lepesek } = req.body || {};
  const [[r]] = await pool.query('SELECT feltolto_id FROM receptek WHERE id = ?', [req.params.id]);
  
  if (!r) throw new HttpError(404, 'Recept nem található.');
  if (r.feltolto_id !== req.userId) throw new HttpError(403, 'Ezt a receptet nem módosíthatod.');
  if (!cim || !hozzavalok || !lepesek) throw new HttpError(400, 'A cím, a hozzávalók és a lépések kötelezőek.');

  const validKat = ['marha', 'sertes', 'csirke', 'hal', 'vega', 'egyeb'].includes(kat) ? kat : 'egyeb';
  const ido = Number(ido_perc) || 60;

  await pool.query(
    `UPDATE receptek SET cim = ?, kat = ?, ido_perc = ?, hozzavalok = ?, lepesek = ? WHERE id = ?`,
    [clean(cim, 80), validKat, ido, hozzavalok, lepesek, req.params.id]
  );
  res.json({ message: 'Recept sikeresen módosítva.' });
});

api.delete('/receptek/:id', requireAuth, async (req, res) => {
  const [[r]] = await pool.query('SELECT feltolto_id FROM receptek WHERE id = ?', [req.params.id]);
  if (!r) throw new HttpError(404, 'Recept nem található.');
  if (r.feltolto_id !== req.userId) throw new HttpError(403, 'Ezt a receptet nem törölheted.');
  await pool.query('DELETE FROM receptek WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- STATIKUS ADATOK ---
api.get('/homersekletek', async (req, res) => { const [sorok] = await pool.query('SELECT hus, cel, homerseklet FROM homersekletek ORDER BY sorszam'); res.json(sorok); });
api.get('/husok', async (req, res) => { const [sorok] = await pool.query('SELECT id, nev, teljes_nev, gramm_fo, sutesi_ido FROM husok ORDER BY sorszam'); res.json(sorok); });
api.get('/kviz', async (req, res) => {
  const [kerdesek] = await pool.query('SELECT id, kerdes FROM kviz_kerdesek ORDER BY sorszam');
  const [valaszok] = await pool.query('SELECT id, kerdes_id, szoveg, helyes FROM kviz_valaszok ORDER BY id');
  res.json(kerdesek.map((k) => { const sajat = valaszok.filter((v) => v.kerdes_id === k.id); return { id: k.id, kerdes: k.kerdes, valaszok: sajat.map((v) => v.szoveg), helyes: sajat.findIndex((v) => v.helyes) }; }));
});
api.get('/gyik', async (req, res) => { const [sorok] = await pool.query('SELECT kerdes, valasz FROM gyik ORDER BY sorszam'); res.json(sorok); });

api.use((req, res) => { throw new HttpError(404, 'Ismeretlen végpont.'); });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use('/api', api);
app.use(express.static(FRONTEND));

app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Túl nagy kérés.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Érvénytelen JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Szerverhiba.' });
});

try {
  await pool.query('SELECT 1');
  console.log('Sikeres adatbázis kapcsolat.');
} catch (e) {
  console.error('Nem sikerült csatlakozni a MySQL-hez:', e.message);
  process.exit(1);
}

app.listen(PORT, () => console.log(`Füst & Parázs fut: http://localhost:${PORT}`));