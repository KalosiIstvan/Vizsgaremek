document.getElementById('ev').textContent = new Date().getFullYear();

/* ============ API-kliens ============ */
// Ha a frontendet a backend szolgálja ki (alapértelmezett), az "/api" elég.
// Ha külön szerverről futtatod, írd át pl. 'http://localhost:3000/api'-ra.
var API = '/api';

// Névtelen kliensazonosító: ez köti a böngészőhöz az értékeléseket és a saját helyeket.
var CID = (function () {
  try {
    var c = localStorage.getItem('fp_client');
    if (!c) {
      c = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now() + Math.random().toString(16).slice(2);
      localStorage.setItem('fp_client', c);
    }
    return c;
  } catch (e) { return 'anon' + Math.random().toString(16).slice(2); }
})();

function api(method, url, body) {
  return fetch(API + url, {
    method: method,
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': CID },
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok) throw new Error(j.error || 'Hiba történt.');
      return j;
    });
  });
}

/* ============ Segédek ============ */
var LIST = { ettermek: [], trucks: [], tuz: [] };
var LOADING = { ettermek: true, trucks: true, tuz: true };
var FAILED = {};

function mapUrl(w) { return 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(w); }
function el(t, c, txt) { var n = document.createElement(t); if (c) n.className = c; if (txt !== undefined) n.textContent = txt; return n; }
function fail(e) { alert(e && e.message === 'Failed to fetch' ? 'A szerver nem érhető el.' : (e && e.message) || 'Hiba történt.'); }

var KATS = [['mind', 'Mind'], ['bbq', 'BBQ'], ['steak', 'Steak'], ['egyeb', 'Egyéb']];
var filt = { ettermek: 'mind', trucks: 'mind' }, qs = { ettermek: '', trucks: '', tuz: '' }, srt = { ettermek: 'alap', trucks: 'alap', tuz: 'alap' };

function load(cat) {
  LOADING[cat] = true; FAILED[cat] = false; render(cat);
  return api('GET', '/helyek?cat=' + cat).then(function (items) {
    LIST[cat] = items;
  }).catch(function () {
    FAILED[cat] = true;
  }).then(function () {
    LOADING[cat] = false; render(cat);
  });
}

/* ============ Szűrősáv ============ */
function build(cat) {
  var f = document.getElementById('filter-' + cat); if (!f) return; f.innerHTML = '';
  if (cat !== 'tuz') KATS.forEach(function (k) {
    var b = el('button', '', k[1]); b.type = 'button'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', filt[cat] === k[0]);
    b.addEventListener('click', function () { filt[cat] = k[0]; build(cat); render(cat); });
    f.appendChild(b);
  });
  var q = el('input'); q.type = 'search'; q.placeholder = 'Keresés névre, városra'; q.value = qs[cat]; q.setAttribute('aria-label', 'Keresés');
  q.addEventListener('input', function () { qs[cat] = q.value; render(cat); }); f.appendChild(q);
  var so = el('select'); so.setAttribute('aria-label', 'Rendezés');
  [['alap', 'Alap sorrend'], ['ertek', 'Átlagos értékelés szerint'], ['nev', 'Név szerint']].forEach(function (o) {
    var op = el('option', '', o[1]); op.value = o[0]; if (srt[cat] === o[0]) op.selected = true; so.appendChild(op);
  });
  so.addEventListener('change', function () { srt[cat] = so.value; render(cat); }); f.appendChild(so);
}

/* ============ Kártyák ============ */
function render(cat) {
  var box = document.getElementById('list-' + cat); box.innerHTML = '';
  var sumEl = document.getElementById('sum-' + cat);
  if (LOADING[cat]) { box.appendChild(el('p', '', 'Betöltés…')); sumEl.textContent = ''; return; }
  if (FAILED[cat]) {
    box.appendChild(el('p', 'apimsg', 'A szerver nem érhető el, ezért a lista nem tölthető be.'));
    var rt = el('button', 'delbtn', 'Újrapróbálom'); rt.type = 'button';
    rt.addEventListener('click', function () { load(cat); }); box.appendChild(rt);
    sumEl.textContent = ''; return;
  }
  var items = LIST[cat].slice();
  if (filt[cat] && filt[cat] !== 'mind') { items = items.filter(function (it) { return (it.kat || '').split(',').indexOf(filt[cat]) > -1; }); }
  var qq = (qs[cat] || '').toLowerCase().trim();
  if (qq) { items = items.filter(function (it) { return (it.name + ' ' + it.where + ' ' + it.desc).toLowerCase().indexOf(qq) > -1; }); }
  if (srt[cat] === 'ertek') { items.sort(function (a, b) { return (b.avg - a.avg) || (b.count - a.count); }); }
  else if (srt[cat] === 'nev') { items.sort(function (a, b) { return a.name.localeCompare(b.name, 'hu'); }); }
  if (!items.length) { box.appendChild(el('p', '', 'Nincs találat.')); }
  var sum = 0, cnt = 0;
  items.forEach(function (it) {
    var card = el('article', 'place' + (it.mine ? ' mine' : ''));
    card.appendChild(el('h3', '', it.name));
    if (it.reg) { card.appendChild(el('span', 'badge', 'Regisztrált')); }
    var wh = el('div', 'where', 'Helyszín: ' + it.where + ' ');
    if (!/^Országos/.test(it.where)) { var a = el('a', 'map', 'Térkép'); a.href = mapUrl(it.where); a.target = '_blank'; a.rel = 'noopener'; wh.appendChild(a); }
    card.appendChild(wh);

    if (cat === 'trucks' && it.reg && it.stops && it.stops.length) {
      var nw = it.stops[0]; card.appendChild(el('div', 'now', 'Most itt: ' + nw.place + ' (' + nw.when + ')'));
      if (it.stops.length > 1) {
        var ul = el('ul', 'stops');
        it.stops.slice(1, 5).forEach(function (x) { ul.appendChild(el('li', '', x.place + ' – ' + x.when)); });
        card.appendChild(el('div', '', 'Korábbi megállók:')); card.appendChild(ul);
      }
      var det = el('details'); det.appendChild(el('summary', '', 'Helyszín frissítése'));
      var ip = el('input'); ip.placeholder = 'PIN'; ip.type = 'password'; ip.maxLength = 4;
      var ipl = el('input'); ipl.placeholder = 'Új helyszín'; ipl.maxLength = 90;
      var ipw = el('input'); ipw.placeholder = 'Mikor (pl. ma 12–20)'; ipw.maxLength = 40;
      var bt = el('button', '', 'Mentés'); bt.type = 'button';
      bt.addEventListener('click', function () {
        if (!ipl.value.trim()) { alert('Add meg az új helyszínt.'); return; }
        api('POST', '/helyek/' + it.id + '/megallok', {
          pin: ip.value, place: ipl.value.trim(),
          when: ipw.value.trim() || ('frissítve: ' + new Date().toLocaleDateString('hu-HU'))
        }).then(function (r) { it.stops = r.stops; render(cat); }).catch(fail);
      });
      det.appendChild(ip); det.appendChild(ipl); det.appendChild(ipw); det.appendChild(bt); card.appendChild(det);
    }

    card.appendChild(el('p', '', it.desc));

    var st = el('div', 'stars'); st.setAttribute('role', 'group'); st.setAttribute('aria-label', it.name + ' értékelése');
    var cur = it.myRating || 0;
    if (cur) { sum += cur; cnt++; }
    for (var i = 1; i <= 5; i++) {
      (function (i) {
        var b = el('button', i <= cur ? 'on' : '', '★'); b.type = 'button';
        b.setAttribute('aria-label', i + ' csillag');
        b.addEventListener('click', function () {
          api('PUT', '/helyek/' + it.id + '/ertekeles', { stars: it.myRating === i ? 0 : i })
            .then(function (r) { it.avg = r.avg; it.count = r.count; it.myRating = r.myRating; render(cat); })
            .catch(fail);
        });
        st.appendChild(b);
      })(i);
    }
    var label = cur ? 'Te: ' + cur + ' / 5' : 'Még nem értékelted';
    if (it.count) label += ' • átlag: ' + it.avg.toFixed(1) + ' (' + it.count + ' értékelés)';
    st.appendChild(el('span', '', label));
    card.appendChild(st);

    if (it.mine) {
      var del = el('button', 'delbtn', 'Törlés'); del.type = 'button';
      del.addEventListener('click', function () {
        var body = {};
        if (it.hasPin) { var q = prompt('Add meg a PIN-kódot a törléshez:'); if (q === null) return; body.pin = q; }
        else if (!confirm('Biztosan törlöd ezt: ' + it.name + '?')) return;
        api('DELETE', '/helyek/' + it.id, body).then(function () {
          LIST[cat] = LIST[cat].filter(function (x) { return x.id !== it.id; }); render(cat);
        }).catch(fail);
      });
      card.appendChild(del);
    }
    box.appendChild(card);
  });
  sumEl.textContent = cnt ? 'Általad értékelt helyek: ' + cnt + ' • átlagod: ' + (sum / cnt).toFixed(1) + ' / 5' : 'Kattints a csillagokra az értékeléshez.';
}

build('ettermek'); build('trucks'); build('tuz');
['ettermek', 'trucks', 'tuz'].forEach(load);

/* ============ Regisztráció ============ */
function regToggle() {
  var t = document.getElementById('r-type').value === 'trucks';
  document.getElementById('r-nowl').hidden = !t; document.getElementById('r-pinl').hidden = !t;
  document.getElementById('r-wherel').firstChild.nodeValue = t ? 'Bázis (város)' : 'Cím (város, utca)';
}
document.getElementById('r-type').addEventListener('change', regToggle); regToggle();

document.getElementById('r-add').addEventListener('click', function () {
  var cat = document.getElementById('r-type').value,
      n = document.getElementById('r-name').value.trim(),
      w = document.getElementById('r-where').value.trim(),
      d = document.getElementById('r-desc').value.trim(),
      k = document.getElementById('r-kat').value,
      pin = document.getElementById('r-pin').value.trim(),
      now = document.getElementById('r-now').value.trim();
  if (!n || !w) { alert('Add meg a nevet és a helyszínt.'); return; }
  var payload = { cat: cat, kat: k, name: n, where: w, desc: d, registered: true };
  if (cat === 'trucks') {
    if (!/^[0-9]{4}$/.test(pin)) { alert('A PIN pontosan 4 számjegy legyen.'); return; }
    payload.pin = pin; payload.now = now || w; payload.when = 'ma (' + new Date().toLocaleDateString('hu-HU') + ')';
  }
  api('POST', '/helyek', payload).then(function (p) {
    LIST[cat].push(p); filt[cat] = 'mind'; build(cat); render(cat);
    ['r-name', 'r-where', 'r-desc', 'r-pin', 'r-now'].forEach(function (i) { document.getElementById(i).value = ''; });
    document.getElementById(cat === 'trucks' ? 'trucklista' : 'ettermek').scrollIntoView({ behavior: 'smooth' });
  }).catch(fail);
});

/* ============ Új hely javaslata ============ */
document.getElementById('f-add').addEventListener('click', function () {
  var cat = document.getElementById('f-cat').value,
      n = document.getElementById('f-name').value.trim(),
      w = document.getElementById('f-where').value.trim(),
      d = document.getElementById('f-desc').value.trim();
  if (!n || !w) { alert('Add meg a hely nevét és helyszínét.'); return; }
  api('POST', '/helyek', { cat: cat, kat: 'egyeb', name: n, where: w, desc: d }).then(function (p) {
    LIST[cat].push(p); render(cat);
    ['f-name', 'f-where', 'f-desc'].forEach(function (i) { document.getElementById(i).value = ''; });
    var last = document.getElementById('list-' + cat).lastChild;
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }).catch(fail);
});

/* ============ Húsmennyiség-kalkulátor ============ */
function calc() {
  var n = Math.max(1, parseInt(document.getElementById('k-fo').value) || 1),
      v = document.getElementById('k-hus').value.split('|'),
      e = parseFloat(document.getElementById('k-etv').value);
  var kg = (n * parseInt(v[0]) * e / 1000).toFixed(1).replace('.', ',');
  document.getElementById('k-out').innerHTML = 'Ennyi kell: <b>' + kg + ' kg</b><br>' + v[1] + '<br>' + v[2] + '.';
}
['k-fo', 'k-hus', 'k-etv'].forEach(function (i) { document.getElementById(i).addEventListener('input', calc); }); calc();

/* ============ Kvíz ============ */
var QZ = [
  ['Hány °C a csirke biztonságos belső hőmérséklete?', ['63 °C', '74 °C', '93 °C'], 1],
  ['Mekkora belső hőfokon omlik szét a pulled pork?', ['57 °C', '74 °C', '93–96 °C'], 2],
  ['Mit jelent a low and slow?', ['Alacsony hő, hosszú idő', 'Magas hő, rövid idő', 'Csak hideg füstölés'], 0],
  ['Honnan ered a barbecue szó?', ['A taíno barbacoa szóból', 'Egy francia szóból', 'Egy német szóból'], 0],
  ['Hol szabad erdőben tüzet rakni külön engedély nélkül?', ['Bárhol, ahol nincs száraz fű', 'Csak kijelölt tűzrakóhelyen', 'Csak éjszaka'], 1]
];
var qi = 0, qsc = 0;
function quiz() {
  var box = document.getElementById('quiz'); box.innerHTML = '';
  if (qi >= QZ.length) {
    box.appendChild(el('p', 'qfb', 'Eredményed: ' + qsc + ' / ' + QZ.length));
    var r = el('button', 'qopt', 'Újra'); r.type = 'button';
    r.addEventListener('click', function () { qi = 0; qsc = 0; quiz(); }); box.appendChild(r); return;
  }
  var q = QZ[qi]; box.appendChild(el('p', '', (qi + 1) + '/' + QZ.length + '. ' + q[0]));
  var fb = el('div', 'qfb'); var btns = [];
  q[1].forEach(function (t, i) {
    var b = el('button', 'qopt', t); b.type = 'button'; btns.push(b);
    b.addEventListener('click', function () {
      btns.forEach(function (x, j) { x.disabled = true; if (j === q[2]) x.classList.add('good'); });
      if (i === q[2]) { qsc++; fb.textContent = 'Helyes!'; } else { b.classList.add('bad'); fb.textContent = 'Nem talált.'; }
      var nx = el('button', 'qopt', qi + 1 < QZ.length ? 'Következő' : 'Eredmény'); nx.type = 'button';
      nx.addEventListener('click', function () { qi++; quiz(); }); box.appendChild(nx);
    });
    box.appendChild(b);
  });
  box.appendChild(fb);
}
quiz();

/* ============ Steak átsütöttség ============ */
var DL = [['Rare (véres)', '50–52 °C', '#b3261e', 44], ['Medium rare', '54–57 °C', '#c4453a', 32], ['Medium', '57–63 °C', '#d9806f', 22], ['Medium well', '63–68 °C', '#c9a08c', 10], ['Well done', '71 °C felett', '#a07a5f', 0]];
function dn() {
  var l = parseInt(document.getElementById('d-lvl').value) - 1, d = DL[l];
  var c = document.getElementById('d-core'), b = document.getElementById('d-band'), i = d[3];
  c.setAttribute('fill', d[2]);
  c.setAttribute('x', 60 - i * 0.9); c.setAttribute('width', 140 + i * 1.8); c.setAttribute('y', 62 - i * 0.5); c.setAttribute('height', 66 + i);
  b.setAttribute('fill', l >= 3 ? '#a07a5f' : '#b98b73');
  document.getElementById('d-out').innerHTML = '<b>' + d[0] + '</b><br>Belső hőmérséklet: ' + d[1] + '. Az ajánlott biztonságos érték 63 °C körül van.';
}
document.getElementById('d-lvl').addEventListener('input', dn); dn();

/* ============ Navigáció, "vissza a tetejére" ============ */
var nb = document.getElementById('navbtn'), nv = document.querySelector('nav');
nb.addEventListener('click', function () { var o = nv.classList.toggle('open'); nb.setAttribute('aria-expanded', o); });
document.querySelectorAll('#navlist a').forEach(function (a) {
  a.addEventListener('click', function () { nv.classList.remove('open'); nb.setAttribute('aria-expanded', 'false'); });
});
var tt = document.getElementById('totop');
window.addEventListener('scroll', function () { tt.style.display = window.scrollY > 500 ? 'block' : 'none'; });
tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

/* ============ Módszer-fülek (csak a "Sütési módszerek" szekcióban) ============ */
// Az eredeti kód minden [role=tab] gombra rákötődött, a szűrőgombokra is; ez hibát okozott.
(function () {
  var tabs = document.querySelectorAll('#modszerek [role=tab]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute('aria-selected', on);
        document.getElementById(o.getAttribute('aria-controls')).hidden = !on;
      });
    });
  });
})();

/* ============ Tartalom az adatbázisból ============ */
// A HTML-ben maradt statikus tartalom tartalékként szolgál; ha az API válaszol, az adatbázis adataival cseréljük le.

// Hőmérséklet-táblázat
api('GET', '/homersekletek').then(function (rows) {
  var tb = document.querySelector('#homerseklet tbody');
  if (!rows.length || !tb) return;
  tb.innerHTML = '';
  rows.forEach(function (r) {
    var tr = document.createElement('tr');
    [r.hus, r.cel, r.homerseklet].forEach(function (t) { tr.appendChild(el('td', '', t)); });
    tb.appendChild(tr);
  });
}).catch(function () {});

// Húskalkulátor: a select opciói
api('GET', '/husok').then(function (rows) {
  var sel = document.getElementById('k-hus');
  if (!rows.length) return;
  sel.innerHTML = '';
  rows.forEach(function (r) {
    var o = el('option', '', r.nev);
    o.value = r.gramm_fo + '|' + r.teljes_nev + '|' + r.sutesi_ido;
    sel.appendChild(o);
  });
  calc();
}).catch(function () {});

// Kvíz
api('GET', '/kviz').then(function (rows) {
  if (!rows.length) return;
  QZ = rows.map(function (k) { return [k.kerdes, k.valaszok, k.helyes]; });
  qi = 0; qsc = 0; quiz();
}).catch(function () {});

// GYIK
api('GET', '/gyik').then(function (rows) {
  var wrap = document.querySelector('#gyik .wrap');
  if (!rows.length || !wrap) return;
  wrap.querySelectorAll('details.faq').forEach(function (d) { d.remove(); });
  rows.forEach(function (r) {
    var d = el('details', 'faq');
    d.appendChild(el('summary', '', r.kerdes));
    d.appendChild(el('p', '', r.valasz));
    wrap.appendChild(d);
  });
}).catch(function () {});
