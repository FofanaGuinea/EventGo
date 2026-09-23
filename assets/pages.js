// EventGo — per-page behaviour. Each page sets <body data-page="...">.
(function () {
  'use strict';
  var EG = window.EG, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = EG.esc, EVENTS = EG.EVENTS, CATS = EG.CATS;
  function param(n) { return new URLSearchParams(location.search).get(n); }
  function byStart(a, b) { return EG.startOf(a) - EG.startOf(b); }
  function upcoming() { var u = EVENTS.filter(function (e) { return !EG.isPast(e); }).sort(byStart); return u.length ? u : EVENTS.slice().sort(byStart); }
  function img(ev) { return (CATS[ev.category] || CATS.Concert).img; }
  function notFound(root, what) {
    root.innerHTML = '<div class="container"><div class="empty" style="margin:60px 0"><h3>' + what + ' introuvable</h3><p>Le lien est peut-être incorrect ou périmé.</p><a class="btn btn-primary" href="explorer.html">Voir les événements</a></div></div>';
  }
  function askNotifPermission(btn) {
    if (!('Notification' in window)) { EG.toast('Notifications non prises en charge par ce navigateur'); return; }
    Notification.requestPermission().then(function (p) { EG.toast(p === 'granted' ? 'Notifications activées' : 'Notifications refusées'); if (btn) btn.classList.toggle('hidden', p === 'granted'); });
  }

  var Pages = {};

  // ------------------------------------------------------------ Accueil
  Pages.home = function () {
    var up = upcoming();
    $('#heroCount').textContent = up.length;
    $('#upcoming').innerHTML = EG.cards(up.slice(0, 4));
    $('#reco').innerHTML = EG.cards(up.slice(4, 8));
    $('#heroCat').innerHTML = '<option value="">Toutes catégories</option>' + Object.keys(CATS).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    $('#quickChips').innerHTML = Object.keys(CATS).slice(0, 5).map(function (c) { return '<a class="chip" href="explorer.html?cat=' + encodeURIComponent(c) + '">' + esc(c) + '</a>'; }).join('');
    $('#catGrid').innerHTML = Object.keys(CATS).map(function (c) {
      var n = up.filter(function (e) { return e.category === c; }).length;
      return '<a class="cat-tile" href="explorer.html?cat=' + encodeURIComponent(c) + '"><img loading="lazy" src="' + CATS[c].img + '" alt=""><div><b>' + esc(c) + '</b><span>' + n + ' événement' + (n > 1 ? 's' : '') + '</span></div></a>';
    }).join('');
  };

  // ------------------------------------------------------------ Explorer
  Pages.explorer = function () {
    var st = { q: param('q') || '', cats: new Set(param('cat') ? [param('cat')] : []), price: 'all', max: 30000, district: '', from: '', to: '', sort: 'date', past: false };
    var all = EVENTS.slice();
    $('#q').value = st.q;
    var districts = Array.from(new Set(all.map(function (e) { return e.district; }))).sort();
    $('#district').innerHTML = '<option value="">Tous les quartiers</option>' + districts.map(function (d) { return '<option>' + esc(d) + '</option>'; }).join('');
    $('#catChecks').innerHTML = Object.keys(CATS).map(function (c) {
      var n = all.filter(function (e) { return e.category === c; }).length;
      return '<label class="check"><input type="checkbox" value="' + esc(c) + '"' + (st.cats.has(c) ? ' checked' : '') + '> ' + esc(c) + '<span class="cnt">' + n + '</span></label>';
    }).join('');
    function render() {
      var q = st.q.trim().toLowerCase();
      var list = all.filter(function (e) {
        if (!st.past && EG.isPast(e)) return false;
        if (st.cats.size && !st.cats.has(e.category)) return false;
        if (st.price === 'free' && e.price !== 0) return false;
        if (st.price === 'paid' && e.price === 0) return false;
        if (e.price > st.max) return false;
        if (st.district && e.district !== st.district) return false;
        var d = EG.startOf(e).toISOString().slice(0, 10);
        if (st.from && d < st.from) return false;
        if (st.to && d > st.to) return false;
        if (q && (e.title + ' ' + e.venue + ' ' + e.district + ' ' + e.category + ' ' + e.organizer).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      list.sort(st.sort === 'price-asc' ? function (a, b) { return a.price - b.price; } : st.sort === 'price-desc' ? function (a, b) { return b.price - a.price; } : byStart);
      $('#resultCount').textContent = list.length + ' événement' + (list.length > 1 ? 's' : '') + ' trouvé' + (list.length > 1 ? 's' : '');
      $('#results').innerHTML = list.length ? EG.cards(list) :
        '<div class="empty" style="grid-column:1/-1"><h3>Aucun événement ne correspond</h3><p>Essayez d\'élargir vos filtres.</p><button class="btn btn-primary" id="resetBtn2" type="button">Réinitialiser les filtres</button></div>';
      var r2 = $('#resetBtn2'); if (r2) r2.onclick = reset;
    }
    function reset() {
      st.q = ''; st.cats.clear(); st.price = 'all'; st.max = 30000; st.district = ''; st.from = ''; st.to = ''; st.past = false;
      $('#q').value = ''; $$('#catChecks input').forEach(function (i) { i.checked = false; });
      $('input[name=price][value=all]').checked = true; $('#maxPrice').value = 30000; $('#maxOut').textContent = EG.money(30000);
      $('#district').value = ''; $('#from').value = ''; $('#to').value = ''; $('#showPast').checked = false; render();
    }
    $('#q').addEventListener('input', function (e) { st.q = e.target.value; render(); });
    $('#catChecks').addEventListener('change', function (e) { if (e.target.checked) st.cats.add(e.target.value); else st.cats.delete(e.target.value); render(); });
    $$('input[name=price]').forEach(function (r) { r.addEventListener('change', function () { st.price = r.value; render(); }); });
    $('#maxPrice').addEventListener('input', function (e) { st.max = +e.target.value; $('#maxOut').textContent = EG.money(st.max); render(); });
    $('#district').addEventListener('change', function (e) { st.district = e.target.value; render(); });
    $('#from').addEventListener('change', function (e) { st.from = e.target.value; render(); });
    $('#to').addEventListener('change', function (e) { st.to = e.target.value; render(); });
    $('#sort').addEventListener('change', function (e) { st.sort = e.target.value; render(); });
    $('#showPast').addEventListener('change', function (e) { st.past = e.target.checked; render(); });
    $('#resetBtn').addEventListener('click', reset);
    var panel = $('#filters'), back = $('#sheetBackdrop');
    function toggleSheet(open) { panel.classList.toggle('open', open); back.classList.toggle('open', open); }
    $('#openFilters').addEventListener('click', function () { toggleSheet(true); });
    $('#closeFilters').addEventListener('click', function () { toggleSheet(false); });
    back.addEventListener('click', function () { toggleSheet(false); });
    render();
  };

  // ------------------------------------------------------------ Carte
  Pages.carte = function () {
    var box = $('#map');
    if (!window.L) { box.innerHTML = '<div class="empty" style="margin:20px">La carte ne peut pas se charger (connexion requise).</div>'; $('#mapList').innerHTML = EG.cards(upcoming()); return; }
    var map = L.map('map').setView([9.537, -13.6785], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    var seen = {}, markers = {}, active = null, catFilter = '';
    upcoming().forEach(function (ev) {
      var key = ev.lat + ',' + ev.lng, k = seen[key] = (seen[key] || 0) + 1, off = (k - 1) * 0.0007;
      var c = CATS[ev.category].c;
      var icon = L.divIcon({ className: '', html: '<div class="pin" style="background:' + c + '"><i></i></div>', iconSize: [34, 34], iconAnchor: [17, 41], popupAnchor: [0, -38] });
      var m = L.marker([ev.lat + off, ev.lng + off], { icon: icon, title: ev.title }).addTo(map);
      m.bindPopup('<b>' + esc(ev.title) + '</b><br>' + EG.fmtDateShort(ev) + ' · ' + EG.fmtTime(ev) + '<br>' + esc(ev.venue) + '<br><a href="evenement.html?id=' + ev.id + '" style="color:#E11D33;font-weight:700">Voir l\'événement →</a>');
      m.on('click', function () { highlight(ev.id, false); });
      markers[ev.id] = m;
    });
    function listHTML() {
      return upcoming().filter(function (e) { return !catFilter || e.category === catFilter; }).map(function (ev) {
        return '<button type="button" class="map-item' + (active === ev.id ? ' on' : '') + '" data-id="' + ev.id + '"><img loading="lazy" src="' + img(ev) + '" alt="">' +
          '<span>' + EG.catBadge(ev.category) + '<b>' + esc(ev.title) + '</b><small>' + EG.fmtDateShort(ev) + ' · ' + EG.fmtTime(ev) + '</small><small>' + esc(ev.venue) + ' · ' + EG.priceLabel(ev) + '</small></span></button>';
      }).join('') || '<div class="empty">Aucun événement dans cette catégorie.</div>';
    }
    function refresh() {
      $('#mapList').innerHTML = listHTML();
      Object.keys(markers).forEach(function (id) { var e = EG.byId(id), show = !catFilter || e.category === catFilter; if (show) markers[id].addTo(map); else map.removeLayer(markers[id]); });
    }
    function highlight(id, fly) {
      active = id; refresh();
      var el = $('.map-item[data-id="' + id + '"]'); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (fly) { var m = markers[id]; map.flyTo(m.getLatLng(), 15, { duration: .8 }); m.openPopup(); }
    }
    $('#mapList').addEventListener('click', function (e) { var b = e.target.closest('.map-item'); if (b) highlight(b.getAttribute('data-id'), true); });
    $('#mapChips').innerHTML = '<button class="chip on" data-c="">Toutes</button>' + Object.keys(CATS).map(function (c) { return '<button class="chip" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    $('#mapChips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return; catFilter = b.getAttribute('data-c');
      $$('#mapChips .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); active = null; refresh();
    });
    $('#locate').addEventListener('click', function () {
      if (!navigator.geolocation) { EG.toast('Géolocalisation indisponible'); return; }
      navigator.geolocation.getCurrentPosition(function (p) {
        var ll = [p.coords.latitude, p.coords.longitude];
        L.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: '#2E6BE6', fillOpacity: 1 }).addTo(map).bindPopup('Vous êtes ici');
        map.flyTo(ll, 14);
      }, function () { EG.toast('Position non autorisée'); });
    });
    refresh();
    setTimeout(function () { map.invalidateSize(); }, 200);
  };

  // ------------------------------------------------------------ Détail événement
  Pages.event = function () {
    var root = $('#eventRoot'), ev = EG.byId(param('id'));
    if (!ev) return notFound(root, 'Événement');
    document.title = ev.title + ' — EventGo';
    var c = CATS[ev.category], left = EG.remaining(ev), pct = Math.round((ev.capacity - left) / ev.capacity * 100);
    var past = EG.isPast(ev), full = left === 0, blocked = past || ev.invitation || full;
    var rem = EG.reminders()[ev.id], remOn = !!(rem && rem.on);
    var cta = past ? 'Événement terminé' : ev.invitation ? 'Sur invitation uniquement' : full ? 'Complet' : 'Réserver ma place';
    var btn = blocked ? '<span class="btn btn-primary btn-lg btn-block disabled">' + cta + '</span>' : '<a class="btn btn-primary btn-lg btn-block" href="reservation.html?id=' + ev.id + '">' + cta + '</a>';
    var org = ev.organizer;
    var related = upcoming().filter(function (e) { return e.id !== ev.id; }).sort(function (a, b) { return (b.category === ev.category) - (a.category === ev.category); }).slice(0, 3);
    root.innerHTML =
      '<div class="container"><nav class="crumbs" aria-label="Fil d\'Ariane"><a href="index.html">Accueil</a><span>/</span><a href="explorer.html">Explorer</a><span>/</span><span>' + esc(ev.category) + '</span></nav>' +
      '<div class="detail"><div class="detail-main">' +
      '<div class="detail-hero"><img src="' + c.img + '" alt="">' + EG.catBadge(ev.category) +
      '<div class="actions"><button type="button" class="icon-btn ev-fav-btn' + (EG.isFav(ev.id) ? ' on' : '') + '" data-fav="' + ev.id + '" aria-label="Ajouter aux favoris" aria-pressed="' + EG.isFav(ev.id) + '">' + EG.ICON.heart + '</button>' +
      '<button type="button" class="icon-btn" id="shareBtn" aria-label="Partager">' + EG.ICON.share + '</button></div></div>' +
      '<h1>' + esc(ev.title) + '</h1>' +
      '<div class="facts">' +
      '<div class="fact"><span class="ic">' + EG.ICON.cal + '</span><div><small>Date</small><b>' + EG.fmtDateLong(ev) + '</b></div></div>' +
      '<div class="fact"><span class="ic">' + EG.ICON.clock + '</span><div><small>Heure · durée</small><b>' + EG.fmtTime(ev) + ' · ' + EG.durationLabel(ev) + '</b></div></div>' +
      '<div class="fact"><span class="ic">' + EG.ICON.pin + '</span><div><small>Lieu</small><b>' + esc(ev.venue) + ', ' + esc(ev.district) + '</b></div></div>' +
      '<div class="fact"><span class="ic">' + EG.ICON.users + '</span><div><small>Places</small><b>' + (past ? 'Terminé' : left + ' restantes sur ' + ev.capacity) + '</b></div></div></div>' +
      '<h2>À propos</h2><p class="prose">' + esc(ev.desc) + '</p>' +
      '<h2>Organisateur</h2><div class="org"><span class="avatar">' + EG.initials(org) + '</span><div><b>' + esc(org) + '</b><div class="verified">✓ Organisateur vérifié</div></div></div>' +
      '<h2>Lieu</h2><p class="muted">' + esc(ev.venue) + ' — ' + esc(ev.address) + '</p><div id="miniMap" role="img" aria-label="Carte du lieu"></div>' +
      '</div>' +
      '<aside class="detail-aside"><div class="book-card"><div class="price">' + EG.priceLabel(ev) + (ev.price > 0 ? ' <small>/ personne</small>' : '') + '</div>' +
      '<div class="progress" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
      '<p class="muted" style="font-size:.88rem">' + (past ? 'Cet événement est terminé.' : full ? 'Plus aucune place disponible.' : left + ' place' + (left > 1 ? 's' : '') + ' restante' + (left > 1 ? 's' : '') + ' sur ' + ev.capacity) + '</p>' +
      '<div class="book-actions">' + btn +
      (past ? '' : '<div class="list-row" style="padding:10px 0"><span class="grow"><b>Me rappeler</b><small>Notification avant l\'événement</small></span><label class="switch"><input type="checkbox" id="remToggle"' + (remOn ? ' checked' : '') + ' aria-label="Activer le rappel"><span></span></label></div>') +
      '<button type="button" class="btn btn-outline btn-block" id="icsBtn">Ajouter au calendrier</button></div></div></aside></div>' +
      '<section class="section" style="padding-top:0"><div class="section-head"><h2>Vous aimerez aussi</h2><a href="explorer.html">Tout voir →</a></div><div class="grid-cards">' + EG.cards(related) + '</div></section></div>' +
      (past || blocked ? '' : '<div class="sticky-cta"><b>' + EG.priceLabel(ev) + '</b><a class="btn btn-primary" href="reservation.html?id=' + ev.id + '">Réserver</a></div>');
    $('#shareBtn').addEventListener('click', function () { EG.shareEvent(ev); });
    $('#icsBtn').addEventListener('click', function () { EG.downloadICS(ev); });
    var rt = $('#remToggle'); if (rt) rt.addEventListener('change', function () { EG.setReminder(ev.id, rt.checked, 120); EG.toast(rt.checked ? 'Rappel activé (2 h avant)' : 'Rappel désactivé'); });
    if (window.L) {
      var m = L.map('miniMap', { scrollWheelZoom: false }).setView([ev.lat, ev.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      L.circleMarker([ev.lat, ev.lng], { radius: 10, color: '#fff', weight: 3, fillColor: c.c, fillOpacity: 1 }).addTo(m);
    } else { $('#miniMap').classList.add('hidden'); }
  };

  // ------------------------------------------------------------ Réservation
  Pages.booking = function () {
    var root = $('#bookRoot'), ev = EG.byId(param('id'));
    if (!ev) return notFound(root, 'Événement');
    document.title = 'Réserver — ' + ev.title;
    var left = EG.remaining(ev);
    if (EG.isPast(ev) || ev.invitation || left === 0) {
      root.innerHTML = '<div class="container"><div class="empty" style="margin:60px 0"><h3>Réservation impossible</h3><p>' + (EG.isPast(ev) ? 'Cet événement est terminé.' : ev.invitation ? 'Cet événement est accessible sur invitation uniquement.' : 'Il n\'y a plus de places disponibles.') + '</p><a class="btn btn-primary" href="evenement.html?id=' + ev.id + '">Retour à l\'événement</a></div></div>'; return;
    }
    var maxQty = Math.min(8, left), qty = 1, fee = 2000, free = ev.price === 0, p = EG.profile(), method = 'om';
    root.innerHTML =
      '<div class="container"><nav class="crumbs"><a href="evenement.html?id=' + ev.id + '">← Retour à l\'événement</a></nav>' +
      '<div class="page-head" style="padding-top:0"><h1>Réservation</h1></div>' +
      '<form class="checkout" id="bookForm" novalidate><div>' +
      '<section class="card"><h2>1. Nombre de billets</h2><div class="stepper"><button type="button" id="minus" aria-label="Moins">−</button><output id="qty" aria-live="polite">1</output><button type="button" id="plus" aria-label="Plus">+</button><span class="muted">' + maxQty + ' max. par réservation</span></div></section>' +
      '<section class="card"><h2>2. Vos informations</h2><div class="form-grid">' +
      '<div class="field full"><label for="name">Nom complet</label><input class="input" id="name" autocomplete="name" value="' + esc(p.name) + '" required><span class="error hidden"></span></div>' +
      '<div class="field"><label for="phone">Téléphone</label><input class="input" id="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+224 6XX XX XX XX" value="' + esc(p.phone) + '" required><span class="error hidden"></span></div>' +
      '<div class="field"><label for="email">E-mail</label><input class="input" id="email" type="email" inputmode="email" autocomplete="email" placeholder="vous@exemple.com" value="' + esc(p.email) + '" required><span class="error hidden"></span></div></div></section>' +
      (free ? '<section class="card"><h2>3. Paiement</h2><p class="muted">Cet événement est gratuit : aucun paiement n\'est nécessaire.</p></section>' :
        '<section class="card"><h2>3. Mode de paiement</h2><div class="pay-grid" role="radiogroup">' +
        '<label class="pay"><input type="radio" name="pay" value="om" checked><span class="logo" style="background:#14171A"><img src="assets/img/orange-money-logo.png" alt=""></span>Orange Money</label>' +
        '<label class="pay"><input type="radio" name="pay" value="mm"><span class="logo" style="background:#FFCC00;padding:8px"><img src="assets/img/mtn-logo.svg" alt=""></span>Mobile Money</label>' +
        '<label class="pay"><input type="radio" name="pay" value="card"><span class="logo" style="background:linear-gradient(135deg,#1F2430,#3A4256);color:#fff"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg></span>Carte bancaire</label></div>' +
        '<div id="payMobile" style="margin-top:18px"><div class="field"><label for="payPhone" id="payPhoneLbl">Numéro Orange Money</label><input class="input" id="payPhone" type="tel" inputmode="tel" placeholder="+224 6XX XX XX XX" value="' + esc(p.phone) + '"><span class="error hidden"></span></div></div>' +
        '<div id="payCard" class="hidden" style="margin-top:18px"><div class="form-grid"><div class="field full"><label for="cardNum">Numéro de carte</label><input class="input" id="cardNum" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" maxlength="23"><span class="error hidden"></span></div>' +
        '<div class="field"><label for="cardExp">Expiration</label><input class="input" id="cardExp" inputmode="numeric" autocomplete="off" placeholder="MM/AA" maxlength="5"><span class="error hidden"></span></div>' +
        '<div class="field"><label for="cardCvv">CVV</label><input class="input" id="cardCvv" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"><span class="error hidden"></span></div></div></div>' +
        '<div class="notice"><b>Mode démonstration.</b> Aucun paiement réel n\'est effectué et aucune donnée bancaire n\'est enregistrée. N\'entrez pas de vraies coordonnées bancaires.</div></section>') +
      '</div><aside class="summary"><div class="card"><div class="sum-event"><img src="' + img(ev) + '" alt=""><div><h3 style="font-size:1rem">' + esc(ev.title) + '</h3><p class="muted" style="font-size:.86rem;margin-top:4px">' + EG.fmtDateShort(ev) + ' · ' + EG.fmtTime(ev) + '<br>' + esc(ev.venue) + '</p></div></div>' +
      '<div class="sum-line"><span id="lineLbl">1 × ' + EG.priceLabel(ev) + '</span><b id="lineVal"></b></div>' +
      '<div class="sum-line"><span>Frais de service</span><b id="feeVal"></b></div>' +
      '<div class="sum-total"><span>Total</span><span id="totalVal"></span></div>' +
      '<button class="btn btn-primary btn-lg btn-block" id="confirmBtn" type="submit" style="margin-top:18px">Confirmer la réservation</button></div></aside></form></div>';

    function update() {
      var sub = ev.price * qty, f = sub > 0 ? fee : 0;
      $('#qty').textContent = qty; $('#lineLbl').textContent = qty + ' × ' + EG.priceLabel(ev);
      $('#lineVal').textContent = free ? 'Gratuit' : EG.money(sub); $('#feeVal').textContent = EG.money(f); $('#totalVal').textContent = free ? 'Gratuit' : EG.money(sub + f);
      $('#minus').disabled = qty <= 1; $('#plus').disabled = qty >= maxQty;
    }
    $('#minus').onclick = function () { qty = Math.max(1, qty - 1); update(); };
    $('#plus').onclick = function () { qty = Math.min(maxQty, qty + 1); update(); };
    $$('input[name=pay]').forEach(function (r) {
      r.addEventListener('change', function () {
        method = r.value;
        $('#payMobile').classList.toggle('hidden', method === 'card'); $('#payCard').classList.toggle('hidden', method !== 'card');
        $('#payPhoneLbl').textContent = method === 'om' ? 'Numéro Orange Money' : 'Numéro Mobile Money';
      });
    });
    var cn = $('#cardNum'); if (cn) cn.addEventListener('input', function () { cn.value = cn.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim(); });
    var ce = $('#cardExp'); if (ce) ce.addEventListener('input', function () { var v = ce.value.replace(/\D/g, '').slice(0, 4); ce.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; });
    function fail(id, msg) { var i = $('#' + id); i.classList.add('err'); var e = i.parentNode.querySelector('.error'); e.textContent = msg; e.classList.remove('hidden'); return false; }
    function clear() { $$('.input.err').forEach(function (i) { i.classList.remove('err'); }); $$('.error').forEach(function (e) { e.classList.add('hidden'); }); }
    $('#bookForm').addEventListener('submit', function (e) {
      e.preventDefault(); clear(); var ok = true;
      var name = $('#name').value.trim(), phone = $('#phone').value.trim(), email = $('#email').value.trim();
      if (name.length < 2) ok = fail('name', 'Indiquez votre nom complet.');
      if (!/^\+?[0-9 ]{8,16}$/.test(phone)) ok = fail('phone', 'Numéro de téléphone invalide.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) ok = fail('email', 'Adresse e-mail invalide.');
      if (!free) {
        if (method === 'card') {
          var num = $('#cardNum').value.replace(/\s/g, ''), exp = $('#cardExp').value, cvv = $('#cardCvv').value, m = /^(\d{2})\/(\d{2})$/.exec(exp);
          if (num.length < 13) ok = fail('cardNum', 'Numéro de carte invalide.');
          if (!m || +m[1] < 1 || +m[1] > 12 || (2000 + +m[2]) * 12 + +m[1] < new Date().getFullYear() * 12 + new Date().getMonth() + 1) ok = fail('cardExp', 'Date invalide.');
          if (!/^\d{3,4}$/.test(cvv)) ok = fail('cardCvv', 'CVV invalide.');
        } else if (!/^\+?[0-9 ]{8,16}$/.test($('#payPhone').value.trim())) ok = fail('payPhone', 'Numéro de paiement invalide.');
      }
      if (!ok) { var f = $('.input.err'); if (f) f.focus(); return; }
      var sub = ev.price * qty, f2 = sub > 0 ? fee : 0, ref = EG.makeRef();
      var list = EG.tickets(); list.push({ ref: ref, eventId: ev.id, qty: qty, unit: ev.price, fee: f2, total: sub + f2, method: free ? 'free' : method, holder: { name: name, email: email, phone: phone }, createdAt: new Date().toISOString() });
      EG.LS.set('eg_tickets', list);
      var pr = EG.profile(); if (!pr.name) EG.LS.set('eg_profile', { name: name, email: email, phone: phone });
      EG.setReminder(ev.id, true, 120);
      location.href = 'confirmation.html?ref=' + encodeURIComponent(ref);
    });
    update();
  };

  // ------------------------------------------------------------ Billet (confirmation + détail)
  var METHODS = { om: 'Orange Money', mm: 'Mobile Money', card: 'Carte bancaire', free: 'Gratuit' };
  function ticketHTML(t, ev) {
    var past = EG.isPast(ev);
    return '<article class="ticket"><div class="ticket-main">' + EG.catBadge(ev.category) + ' <span class="pill ' + (past ? 'pill-grey' : 'pill-green') + '">' + (past ? 'Terminé' : 'À venir') + '</span>' +
      '<h2>' + esc(ev.title) + '</h2><div class="ticket-facts">' +
      '<div><small>Date</small><b>' + EG.fmtDateLong(ev) + '</b></div><div><small>Heure</small><b>' + EG.fmtTime(ev) + '</b></div>' +
      '<div><small>Lieu</small><b>' + esc(ev.venue) + ', ' + esc(ev.district) + '</b></div><div><small>Billets</small><b>' + t.qty + ' × ' + EG.priceLabel(ev) + '</b></div>' +
      '<div><small>Titulaire</small><b>' + esc(t.holder.name) + '</b></div><div><small>Paiement</small><b>' + esc(METHODS[t.method] || '') + (t.total ? ' · ' + EG.money(t.total) : '') + '</b></div></div></div>' +
      '<div class="ticket-stub"><div class="qr" id="qr"></div><div><small class="muted">Référence du billet</small><div class="ref">' + esc(t.ref) + '</div></div><small class="muted">Présentez ce QR code à l\'entrée</small></div></article>';
  }
  function mountQR(t) { EG.renderQR($('#qr'), 'EVENTGO|' + t.ref + '|' + t.eventId + '|' + t.qty); }
  function findTicket() { var r = param('ref'); return EG.tickets().filter(function (t) { return t.ref === r; })[0]; }

  Pages.confirmation = function () {
    var root = $('#ticketRoot'), t = findTicket(), ev = t && EG.byId(t.eventId);
    if (!t || !ev) return notFound(root, 'Réservation');
    root.innerHTML = '<div class="container center-narrow"><div class="success"><div class="check">' + EG.ICON.check + '</div><h1>Réservation confirmée</h1><p class="muted" style="margin-top:8px">Votre billet est enregistré sur cet appareil. Conservez le QR code ci-dessous.</p></div>' +
      ticketHTML(t, ev) +
      '<div class="ticket-actions"><a class="btn btn-primary" href="billet.html?ref=' + encodeURIComponent(t.ref) + '">Voir mon billet</a><button class="btn btn-outline" id="icsBtn" type="button">Ajouter au calendrier</button><a class="btn btn-outline" href="explorer.html">Retour aux événements</a></div></div>';
    mountQR(t); $('#icsBtn').onclick = function () { EG.downloadICS(ev, t.ref); };
  };

  Pages.ticket = function () {
    var root = $('#ticketRoot'), t = findTicket(), ev = t && EG.byId(t.eventId);
    if (!t || !ev) return notFound(root, 'Billet');
    document.title = 'Billet ' + t.ref + ' — EventGo';
    var r = EG.reminders()[ev.id], on = !!(r && r.on), past = EG.isPast(ev);
    root.innerHTML = '<div class="container center-narrow"><nav class="crumbs"><a href="billets.html">← Mes billets</a></nav>' + ticketHTML(t, ev) +
      (past ? '' : '<div class="card" style="margin-top:20px"><div class="list-row" style="padding:0"><span class="grow"><b>Rappel avant l\'événement</b><small>Vous serez prévenu 2 h avant le début</small></span><label class="switch"><input type="checkbox" id="remToggle"' + (on ? ' checked' : '') + ' aria-label="Rappel"><span></span></label></div></div>') +
      '<div class="ticket-actions"><button class="btn btn-primary" id="printBtn" type="button">Imprimer / enregistrer en PDF</button><button class="btn btn-outline" id="icsBtn" type="button">Ajouter au calendrier</button><button class="btn btn-outline" id="shareBtn" type="button">Partager l\'événement</button>' +
      (past ? '' : '<button class="btn btn-ghost" id="cancelBtn" type="button">Annuler la réservation</button>') + '</div></div>';
    mountQR(t);
    $('#printBtn').onclick = function () { window.print(); };
    $('#icsBtn').onclick = function () { EG.downloadICS(ev, t.ref); };
    $('#shareBtn').onclick = function () { EG.shareEvent(ev); };
    var rt = $('#remToggle'); if (rt) rt.onchange = function () { EG.setReminder(ev.id, rt.checked, 120); EG.toast(rt.checked ? 'Rappel activé' : 'Rappel désactivé'); };
    var cb = $('#cancelBtn'); if (cb) cb.onclick = function () {
      if (!confirm('Annuler cette réservation ? Les places seront libérées.')) return;
      EG.LS.set('eg_tickets', EG.tickets().filter(function (x) { return x.ref !== t.ref; })); location.href = 'billets.html';
    };
  };

  // ------------------------------------------------------------ Mes billets
  Pages.tickets = function () {
    var tab = 'up', box = $('#ticketList');
    function draw() {
      var list = EG.tickets().filter(function (t) { var e = EG.byId(t.eventId); return e && (tab === 'up') === !EG.isPast(e); })
        .sort(function (a, b) { var d = EG.startOf(EG.byId(a.eventId)) - EG.startOf(EG.byId(b.eventId)); return tab === 'up' ? d : -d; });
      box.innerHTML = list.length ? list.map(function (t) {
        var e = EG.byId(t.eventId), past = EG.isPast(e);
        return '<div class="t-item' + (past ? ' past' : '') + '"><img src="' + img(e) + '" alt=""><div>' + EG.catBadge(e.category) + '<h3><a class="ev-link" href="billet.html?ref=' + encodeURIComponent(t.ref) + '">' + esc(e.title) + '</a></h3>' +
          '<p class="ev-meta">' + EG.ICON.cal + '<span>' + EG.fmtDateShort(e) + ' · ' + EG.fmtTime(e) + '</span></p><p class="ev-meta">' + EG.ICON.pin + '<span>' + esc(e.venue) + '</span></p>' +
          '<p class="ev-meta">' + EG.ICON.ticket + '<span>' + t.qty + ' billet' + (t.qty > 1 ? 's' : '') + ' · ' + esc(t.ref) + '</span></p></div><span class="btn btn-outline btn-sm">Voir le billet</span></div>';
      }).join('') : '<div class="empty"><h3>' + (tab === 'up' ? 'Aucun billet à venir' : 'Aucun billet passé') + '</h3><p>' + (tab === 'up' ? 'Réservez votre première place pour la retrouver ici.' : 'Vos anciens billets apparaîtront ici.') + '</p><a class="btn btn-primary" href="explorer.html">Découvrir les événements</a></div>';
    }
    $$('.tab').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-tab'); $$('.tab').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); draw(); }; });
    draw();
  };

  // ------------------------------------------------------------ Rappels
  Pages.reminders = function () {
    var box = $('#remList'), perm = $('#permBtn');
    if (perm) { if (!('Notification' in window) || Notification.permission === 'granted') perm.classList.add('hidden'); perm.onclick = function () { askNotifPermission(perm); }; }
    function ids() {
      var s = new Set(Object.keys(EG.reminders()));
      EG.tickets().forEach(function (t) { s.add(t.eventId); }); EG.favs().forEach(function (f) { s.add(f); });
      return Array.from(s).map(EG.byId).filter(function (e) { return e && !EG.isPast(e); }).sort(byStart);
    }
    function draw() {
      var list = ids(), rem = EG.reminders();
      box.innerHTML = list.length ? list.map(function (e) {
        var r = rem[e.id] || { on: false, lead: 120 };
        return '<div class="rem-item"><img src="' + img(e) + '" alt=""><div class="grow"><h3><a href="evenement.html?id=' + e.id + '">' + esc(e.title) + '</a></h3><p class="muted" style="font-size:.86rem">' + EG.fmtDateShort(e) + ' à ' + EG.fmtTime(e) + ' · ' + esc(e.venue) + '</p></div>' +
          '<select class="select lead" data-id="' + e.id + '" aria-label="Délai du rappel">' + [[30, '30 min avant'], [60, '1 h avant'], [120, '2 h avant'], [1440, '1 jour avant']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === r.lead ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
          '<label class="switch"><input type="checkbox" data-id="' + e.id + '"' + (r.on ? ' checked' : '') + ' aria-label="Rappel ' + esc(e.title) + '"><span></span></label></div>';
      }).join('') : '<div class="empty"><h3>Aucun rappel</h3><p>Réservez un billet ou ajoutez un événement à vos favoris pour programmer un rappel.</p><a class="btn btn-primary" href="explorer.html">Découvrir les événements</a></div>';
    }
    box.addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-id'); if (!id) return;
      var row = e.target.closest('.rem-item'), on = row.querySelector('input[type=checkbox]').checked, lead = +row.querySelector('select').value;
      EG.setReminder(id, on, lead); EG.toast(on ? 'Rappel activé' : 'Rappel désactivé');
    });
    draw();
  };

  // ------------------------------------------------------------ Favoris
  Pages.favorites = function () {
    function draw() {
      var list = EG.favs().map(EG.byId).filter(Boolean).sort(byStart);
      $('#favCount').textContent = list.length + ' événement' + (list.length > 1 ? 's' : '') + ' enregistré' + (list.length > 1 ? 's' : '');
      $('#favList').innerHTML = list.length ? EG.cards(list) : '<div class="empty" style="grid-column:1/-1"><h3>Aucun favori pour le moment</h3><p>Touchez le cœur d\'un événement pour le retrouver ici.</p><a class="btn btn-primary" href="explorer.html">Découvrir les événements</a></div>';
    }
    window.EG_onFavChange = function () { setTimeout(draw, 250); };
    draw();
  };

  // ------------------------------------------------------------ Profil
  Pages.profile = function () {
    var p = EG.profile();
    function head() { $('#pAvatar').textContent = p.name ? EG.initials(p.name) : '?'; $('#pName').textContent = p.name || 'Bienvenue sur EventGo'; $('#pMail').textContent = p.email || 'Complétez votre profil pour préremplir vos réservations.'; }
    head();
    $('#f-name').value = p.name; $('#f-email').value = p.email; $('#f-phone').value = p.phone;
    $('#profileForm').addEventListener('submit', function (e) {
      e.preventDefault(); p = { name: $('#f-name').value.trim(), email: $('#f-email').value.trim(), phone: $('#f-phone').value.trim() };
      EG.LS.set('eg_profile', p); head(); var a = $('#accountLink'); if (a) a.textContent = p.name ? p.name.split(' ')[0] : 'Mon compte'; EG.toast('Profil enregistré');
    });
    var tk = EG.tickets(); $('#nTickets').textContent = tk.length; $('#nFavs').textContent = EG.favs().length;
    $('#nRem').textContent = Object.keys(EG.reminders()).filter(function (id) { return EG.reminders()[id].on; }).length;
    var s = EG.settings();
    $('#s-dark').checked = EG.isDark();
    $('#s-dark').addEventListener('change', function (e) { EG.applyTheme(e.target.checked); EG.saveSettings({ dark: e.target.checked }); });
    ['push', 'reminders', 'nearby', 'promo', 'weekly'].forEach(function (k) { var el = $('#n-' + k); el.checked = !!s[k]; el.addEventListener('change', function () { var o = {}; o[k] = el.checked; EG.saveSettings(o); EG.toast('Préférence enregistrée'); }); });
    var perm = $('#permBtn'); if (perm) { if (!('Notification' in window) || Notification.permission === 'granted') perm.classList.add('hidden'); perm.onclick = function () { askNotifPermission(perm); }; }
    $('#wipe').onclick = function () {
      if (!confirm('Effacer toutes vos données (profil, billets, favoris, rappels) sur cet appareil ?')) return;
      ['eg_profile', 'eg_tickets', 'eg_favs', 'eg_reminders', 'eg_settings'].forEach(EG.LS.del); location.href = 'index.html';
    };
    function show(name) {
      $$('.pane').forEach(function (x) { x.classList.toggle('hidden', x.id !== 'pane-' + name); });
      $$('.side-nav [data-pane]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-pane') === name); });
    }
    $$('.side-nav [data-pane]').forEach(function (b) { b.addEventListener('click', function () { history.replaceState(null, '', '#' + b.getAttribute('data-pane')); show(b.getAttribute('data-pane')); }); });
    var h = location.hash.slice(1); show(['profil', 'parametres', 'notifications'].indexOf(h) > -1 ? h : 'profil');
  };

  document.addEventListener('DOMContentLoaded', function () {
    EG.initChrome();
    var fn = Pages[document.body.getAttribute('data-page')]; if (fn) fn();
  });
})();
