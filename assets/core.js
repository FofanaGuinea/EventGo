// EventGo — core helpers: storage, formatting, cards, share, QR, calendar, reminders, theme.
(function () {
  'use strict';
  var TZ = 'Africa/Conakry';
  var EVENTS = window.EG_EVENTS, CATS = window.EG_CATS;

  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  var ICON = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5c-2.3 4.6-9.3 9-9.3 9Z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.2a1.6 1.6 0 0 0 0 3.1V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.7a1.6 1.6 0 0 0 0-3.1V9Z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="9" r="3.2"/><circle cx="17" cy="10" r="2.6"/><path d="M3 20c.8-3.2 3-5 6-5s5.2 1.8 6 5M15.5 15.4c2.4.1 4.2 1.6 5 4.6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M8 10.8 16 6.2M8 13.2l8 4.6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4 10-10"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 17h12M8 17v-6a4 4 0 0 1 8 0v6"/><path d="M10.4 20a1.7 1.7 0 0 0 3.2 0"/></svg>'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function byId(id) { return EVENTS.find(function (e) { return e.id === id; }); }
  function dtf(o) { return new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: TZ }, o)); }
  function startOf(ev) { return new Date(ev.start); }
  function endOf(ev) { return new Date(startOf(ev).getTime() + ev.hours * 3600000); }
  function isPast(ev) { return endOf(ev).getTime() < Date.now(); }
  function fmtDateLong(ev) { return dtf({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(startOf(ev)); }
  function fmtDateShort(ev) { return dtf({ day: 'numeric', month: 'short' }).format(startOf(ev)); }
  function fmtTime(ev) { return dtf({ hour: '2-digit', minute: '2-digit', hour12: false }).format(startOf(ev)).replace(':', 'h'); }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' GNF'; }
  function priceLabel(ev) { return ev.invitation ? 'Sur invitation' : ev.price === 0 ? 'Gratuit' : money(ev.price); }
  function durationLabel(ev) { var h = Math.floor(ev.hours), m = Math.round((ev.hours - h) * 60); return h + 'h' + (m ? String(m).padStart(2, '0') : ''); }

  // ---- bookings / favourites / reminders / profile / settings
  function tickets() { return LS.get('eg_tickets', []); }
  function bookedByMe(id) { return tickets().filter(function (t) { return t.eventId === id; }).reduce(function (s, t) { return s + t.qty; }, 0); }
  function remaining(ev) { return Math.max(0, ev.capacity - ev.booked - bookedByMe(ev.id)); }
  function favs() { return LS.get('eg_favs', []); }
  function isFav(id) { return favs().indexOf(id) !== -1; }
  function toggleFav(id) {
    var f = favs(), i = f.indexOf(id);
    if (i === -1) f.push(id); else f.splice(i, 1);
    LS.set('eg_favs', f); return i === -1;
  }
  function reminders() { return LS.get('eg_reminders', {}); }
  function setReminder(id, on, lead) {
    var r = reminders(), cur = r[id] || {};
    r[id] = { on: on, lead: lead != null ? lead : (cur.lead || 120), notified: false };
    LS.set('eg_reminders', r); updateDot();
  }
  function profile() { return LS.get('eg_profile', { name: '', email: '', phone: '' }); }
  function settings() { return Object.assign({ dark: null, push: true, reminders: true, nearby: true, promo: false, weekly: false }, LS.get('eg_settings', {})); }
  function saveSettings(patch) { LS.set('eg_settings', Object.assign(settings(), patch)); }
  function initials(name) { var p = String(name || '').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
  function makeRef() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '', a = new Uint8Array(8);
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < 8; i++) { out += A[a[i] % A.length]; if (i === 3) out += '-'; }
    return 'EVG-' + out;
  }

  // ---- UI bits
  function catBadge(cat, extra) {
    var c = CATS[cat] || CATS.Concert;
    return '<span class="badge-cat ' + (extra || '') + '" style="--c:' + c.c + ';--fg:' + c.fg + '">' + esc(cat) + '</span>';
  }
  function card(ev) {
    var c = CATS[ev.category] || CATS.Concert, fav = isFav(ev.id), free = ev.price === 0;
    return '<article class="ev-card">' +
      '<div class="ev-media"><img loading="lazy" src="' + c.img + '" alt="">' + catBadge(ev.category, 'ev-cat') +
      '<button type="button" class="ev-fav' + (fav ? ' on' : '') + '" data-fav="' + ev.id + '" aria-pressed="' + fav + '" aria-label="Ajouter aux favoris">' + ICON.heart + '</button></div>' +
      '<div class="ev-body"><h3 class="ev-title"><a class="ev-link" href="evenement.html?id=' + ev.id + '">' + esc(ev.title) + '</a></h3>' +
      '<p class="ev-meta">' + ICON.cal + '<span>' + fmtDateShort(ev) + ' · ' + fmtTime(ev) + '</span></p>' +
      '<p class="ev-meta">' + ICON.pin + '<span>' + esc(ev.venue) + ', ' + esc(ev.district) + '</span></p>' +
      '<div class="ev-foot"><span class="ev-price">' + priceLabel(ev) + '</span><span class="btn btn-outline btn-sm">Voir</span></div></div></article>';
  }
  function cards(list) { return list.map(card).join(''); }

  var toastEl, toastTimer;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2600);
  }

  function evUrl(ev) { return new URL('evenement.html?id=' + ev.id, location.href).href; }
  function shareEvent(ev) {
    var url = evUrl(ev), text = ev.title + ' — ' + fmtDateLong(ev);
    if (navigator.share) { navigator.share({ title: ev.title, text: text, url: url }).catch(function () {}); return; }
    var dlg = document.getElementById('shareDlg');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'shareDlg'; document.body.appendChild(dlg); }
    var t = encodeURIComponent(text + ' ' + url);
    dlg.innerHTML = '<div class="dlg"><h3>Partager cet événement</h3><div class="share-grid">' +
      '<a href="https://wa.me/?text=' + t + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '" target="_blank" rel="noopener">Facebook</a>' +
      '<a href="mailto:?subject=' + encodeURIComponent(ev.title) + '&body=' + t + '">E-mail</a>' +
      '<a href="sms:?&body=' + t + '">SMS</a>' +
      '<button type="button" id="copyLink">Copier le lien</button>' +
      '<button type="button" id="closeShare">Fermer</button></div></div>';
    dlg.showModal();
    dlg.querySelector('#closeShare').onclick = function () { dlg.close(); };
    dlg.querySelector('#copyLink').onclick = function () {
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Lien copié'); dlg.close(); }, function () { window.prompt('Copiez ce lien :', url); });
    };
    dlg.onclick = function (e) { if (e.target === dlg) dlg.close(); };
  }

  function renderQR(el, text) {
    if (!window.qrcode) { el.textContent = text; return; }
    var qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
    var n = qr.getModuleCount(), d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + c + ',' + r + 'h1v1h-1z';
    el.innerHTML = '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR code du billet ' + esc(text) + '"><path d="' + d + '" fill="currentColor"/></svg>';
  }

  function icsDate(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function downloadICS(ev, ref) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EventGo//FR', 'BEGIN:VEVENT',
      'UID:' + (ref || ev.id) + '@eventgo', 'DTSTAMP:' + icsDate(new Date()),
      'DTSTART:' + icsDate(startOf(ev)), 'DTEND:' + icsDate(endOf(ev)),
      'SUMMARY:' + ev.title.replace(/[,;]/g, ' '), 'LOCATION:' + (ev.venue + ', ' + ev.address).replace(/[,;]/g, ' '),
      'DESCRIPTION:' + (ref ? 'Billet ' + ref + '. ' : '') + 'EventGo', 'END:VEVENT', 'END:VCALENDAR'];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ev.id + '.ics';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function checkReminders() {
    var rem = reminders(), changed = false;
    if (settings().reminders === false) return;
    Object.keys(rem).forEach(function (id) {
      var r = rem[id], ev = byId(id); if (!ev || !r.on || r.notified) return;
      var start = startOf(ev).getTime(), now = Date.now();
      if (now >= start - r.lead * 60000 && now < start) {
        r.notified = true; changed = true;
        var msg = 'Rappel : ' + ev.title + ' commence à ' + fmtTime(ev);
        toast(msg, 7000);
        if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('EventGo', { body: msg, icon: 'assets/favicon.svg' }); } catch (e) {} }
      }
    });
    if (changed) LS.set('eg_reminders', rem);
  }
  function updateDot() {
    var dot = document.getElementById('remDot'); if (!dot) return;
    var rem = reminders(), any = Object.keys(rem).some(function (id) { var e = byId(id); return e && rem[id].on && !isPast(e); });
    dot.classList.toggle('hidden', !any);
  }

  function applyTheme(dark) {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
  }
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function initChrome() {
    var page = document.body.getAttribute('data-nav');
    document.querySelectorAll('[data-nav-link]').forEach(function (a) { if (a.getAttribute('data-nav-link') === page) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); } });
    var acc = document.getElementById('accountLink'), p = profile();
    if (acc && p.name) acc.textContent = p.name.split(' ')[0];
    var tb = document.getElementById('themeBtn');
    if (tb) tb.addEventListener('click', function () { var d = !isDark(); applyTheme(d); saveSettings({ dark: d }); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-fav]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var on = toggleFav(b.getAttribute('data-fav'));
      document.querySelectorAll('[data-fav="' + b.getAttribute('data-fav') + '"]').forEach(function (x) { x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
      if (window.EG_onFavChange) window.EG_onFavChange();
    });
    updateDot(); checkReminders();
  }

  window.EG = { LS: LS, ICON: ICON, CATS: CATS, EVENTS: EVENTS, esc: esc, byId: byId, startOf: startOf, endOf: endOf, isPast: isPast,
    fmtDateLong: fmtDateLong, fmtDateShort: fmtDateShort, fmtTime: fmtTime, money: money, priceLabel: priceLabel, durationLabel: durationLabel,
    tickets: tickets, remaining: remaining, favs: favs, isFav: isFav, toggleFav: toggleFav, reminders: reminders, setReminder: setReminder,
    profile: profile, settings: settings, saveSettings: saveSettings, initials: initials, makeRef: makeRef, catBadge: catBadge, card: card, cards: cards,
    toast: toast, shareEvent: shareEvent, renderQR: renderQR, downloadICS: downloadICS, applyTheme: applyTheme, isDark: isDark, initChrome: initChrome, updateDot: updateDot };
})();
