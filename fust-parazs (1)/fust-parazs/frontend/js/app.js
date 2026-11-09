document.addEventListener('DOMContentLoaded', function () {
  const evElem = document.getElementById('ev');
  if (evElem) evElem.textContent = new Date().getFullYear();

  const navBtn = document.getElementById('navbtn');
  const nav = document.querySelector('.main-nav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }

  const user = JSON.parse(localStorage.getItem('fp_user') || 'null');
  const authNav = document.getElementById('auth-nav');

  if (authNav) {
    if (user) {
      const kezdo = (user.nev || 'F').charAt(0).toUpperCase();
      authNav.innerHTML = `
        <a href="profil.html" class="btn-login" style="display:flex; align-items:center; gap:8px; padding:6px 16px 6px 6px;">
          <span style="width:28px; height:28px; border-radius:50%; background:var(--mustard); color:var(--ink); display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">${kezdo}</span>
          Profilom
        </a>
        <a href="#" id="logout-btn" class="btn-login" style="background:var(--brick); border:none; color:#fff;">Kilépés</a>
      `;
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          localStorage.removeItem('fp_user');
          window.location.href = 'index.html';
        });
      }
    } else {
      authNav.innerHTML = `
        <a href="belepes.html" class="btn-login">Belépés</a>
        <a href="regisztracio.html" class="btn-register">Regisztráció</a>
      `;
    }
  }

  const API = '/api';
  const CID = (function () {
    try {
      let c = localStorage.getItem('fp_client');
      if (!c) {
        c = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now() + Math.random().toString(16).slice(2);
        localStorage.setItem('fp_client', c);
      }
      return c;
    } catch (e) { return 'anon' + Math.random().toString(16).slice(2); }
  })();

  window.fpApi = function (method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (user && user.id) headers['x-user-id'] = user.id;
    else headers['X-Client-Id'] = CID;
    return fetch(API + url, {
      method: method, headers: headers, body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || 'Hiba történt.');
        return j;
      });
    });
  };

  const tt = document.getElementById('totop');
  if (tt) {
    window.addEventListener('scroll', function () { tt.style.display = window.scrollY > 500 ? 'block' : 'none'; });
    tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  const tabs = document.querySelectorAll('#modszerek [role=tab]');
  if (tabs.length) {
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) {
          const on = o === t;
          o.setAttribute('aria-selected', on);
          const p = document.getElementById(o.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
      });
    });
  }

  function calc() {
    const fo = document.getElementById('k-fo'), hus = document.getElementById('k-hus'), etv = document.getElementById('k-etv'), out = document.getElementById('k-out');
    if (!fo || !hus || !etv || !out) return;
    const n = Math.max(1, parseInt(fo.value) || 1);
    const v = hus.value.split('|');
    if (!v[0]) return;
    const e = parseFloat(etv.value);
    const kg = (n * parseInt(v[0]) * e / 1000).toFixed(1).replace('.', ',');
    out.innerHTML = 'Ennyi kell: <b>' + kg + ' kg</b><br>' + v[1] + '<br>' + v[2] + '.';
  }
  if (document.getElementById('k-fo')) {
    ['k-fo', 'k-hus', 'k-etv'].forEach(function (i) { document.getElementById(i).addEventListener('input', calc); });
    calc();
  }

  let QZ = [
    ['Hány °C a csirke biztonságos belső hőmérséklete?', ['63 °C', '74 °C', '93 °C'], 1],
    ['Mekkora belső hőfokon omlik szét a pulled pork?', ['57 °C', '74 °C', '93–96 °C'], 2],
    ['Mit jelent a low and slow?', ['Alacsony hő, hosszú idő', 'Magas hő, rövid idő', 'Csak hideg füstölés'], 0],
    ['Honnan ered a barbecue szó?', ['A taíno barbacoa szóból', 'Egy francia szóból', 'Egy német szóból'], 0],
    ['Hol szabad erdőben tüzet rakni külön engedély nélkül?', ['Bárhol, ahol nincs száraz fű', 'Csak kijelölt tűzrakóhelyen', 'Csak éjszaka'], 1]
  ];
  let qi = 0, qsc = 0;
  function el(t, c, txt) { const n = document.createElement(t); if (c) n.className = c; if (txt !== undefined) n.textContent = txt; return n; }
  function quiz() {
    const box = document.getElementById('quiz'); if (!box) return;
    box.innerHTML = '';
    if (qi >= QZ.length) {
      box.appendChild(el('p', 'qfb', 'Eredményed: ' + qsc + ' / ' + QZ.length));
      const r = el('button', 'qopt', 'Újra'); r.type = 'button';
      r.addEventListener('click', function () { qi = 0; qsc = 0; quiz(); });
      box.appendChild(r); return;
    }
    const q = QZ[qi];
    box.appendChild(el('p', '', (qi + 1) + '/' + QZ.length + '. ' + q[0]));
    const fb = el('div', 'qfb');
    const btns = [];
    q[1].forEach(function (t, i) {
      const b = el('button', 'qopt', t); b.type = 'button'; btns.push(b);
      b.addEventListener('click', function () {
        btns.forEach(function (x, j) { x.disabled = true; if (j === q[2]) x.classList.add('good'); });
        if (i === q[2]) { qsc++; fb.textContent = 'Helyes!'; }
        else { b.classList.add('bad'); fb.textContent = 'Nem talált.'; }
        const nx = el('button', 'qopt', qi + 1 < QZ.length ? 'Következő' : 'Eredmény');
        nx.type = 'button';
        nx.addEventListener('click', function () { qi++; quiz(); });
        box.appendChild(nx);
      });
      box.appendChild(b);
    });
    box.appendChild(fb);
  }
  quiz();

  const DL = [['Rare (véres)', '50–52 °C', '#b3261e', 44], ['Medium rare', '54–57 °C', '#c4453a', 32], ['Medium', '57–63 °C', '#d9806f', 22], ['Medium well', '63–68 °C', '#c9a08c', 10], ['Well done', '71 °C felett', '#a07a5f', 0]];
  function dn() {
    const slider = document.getElementById('d-lvl'); if (!slider) return;
    const l = parseInt(slider.value) - 1; const d = DL[l];
    const c = document.getElementById('d-core'); const b = document.getElementById('d-band');
    if (!c || !b) return; const i = d[3];
    c.setAttribute('fill', d[2]); c.setAttribute('x', 60 - i * 0.9); c.setAttribute('width', 140 + i * 1.8); c.setAttribute('y', 62 - i * 0.5); c.setAttribute('height', 66 + i);
    b.setAttribute('fill', l >= 3 ? '#a07a5f' : '#b98b73');
    document.getElementById('d-out').innerHTML = '<b>' + d[0] + '</b><br>Belső hőmérséklet: ' + d[1] + '. Az ajánlott biztonságos érték 63 °C körül van.';
  }
  if (document.getElementById('d-lvl')) { document.getElementById('d-lvl').addEventListener('input', dn); dn(); }

  if (document.querySelector('#homerseklet tbody')) {
    window.fpApi('GET', '/homersekletek').then(function (rows) {
      const tb = document.querySelector('#homerseklet tbody'); if (!rows.length || !tb) return;
      tb.innerHTML = ''; rows.forEach(function (r) { const tr = document.createElement('tr'); [r.hus, r.cel, r.homerseklet].forEach(function (t) { tr.appendChild(el('td', '', t)); }); tb.appendChild(tr); });
    }).catch(function () {});
  }
  if (document.getElementById('k-hus')) {
    window.fpApi('GET', '/husok').then(function (rows) {
      const sel = document.getElementById('k-hus'); if (!rows.length) return;
      sel.innerHTML = ''; rows.forEach(function (r) { const o = el('option', '', r.nev); o.value = r.gramm_fo + '|' + r.teljes_nev + '|' + r.sutesi_ido; sel.appendChild(o); }); calc();
    }).catch(function () {});
  }
  if (document.getElementById('quiz')) {
    window.fpApi('GET', '/kviz').then(function (rows) { if (!rows.length) return; QZ = rows.map(function (k) { return [k.kerdes, k.valaszok, k.helyes]; }); qi = 0; qsc = 0; quiz(); }).catch(function () {});
  }
  if (document.querySelector('#gyik .wrap')) {
    window.fpApi('GET', '/gyik').then(function (rows) {
      const wrap = document.querySelector('#gyik .wrap'); if (!rows.length || !wrap) return;
      wrap.querySelectorAll('details.faq').forEach(function (d) { d.remove(); });
      rows.forEach(function (r) { const d = el('details', 'faq'); d.appendChild(el('summary', '', r.kerdes)); d.appendChild(el('p', '', r.valasz)); wrap.appendChild(d); });
    }).catch(function () {});
  }
});