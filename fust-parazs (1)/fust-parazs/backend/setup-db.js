// Létrehozza az adatbázist és feltölti adatokkal:  npm run db:setup
// FIGYELEM: a meglévő fust_parazs táblák tartalma törlődik!
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const here = path.dirname(fileURLToPath(import.meta.url));
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4',
  multipleStatements: true
});

try {
  for (const f of ['schema.sql', 'adatok.sql']) {
    await conn.query(fs.readFileSync(path.join(here, 'sql', f), 'utf8'));
    console.log('Lefutott:', f);
  }
  console.log('Kész. Indítsd a szervert: npm start');
} catch (e) {
  console.error('Hiba az adatbázis létrehozásakor:', e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
