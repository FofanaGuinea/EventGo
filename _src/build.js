// Builds the EventGo website pages into the repository root.
// Usage:  node _src/build.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const svg = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
const I = {
  home: svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a1 1 0 0 0 1-1v-9"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>'),
  map: svg('<path d="M12 21s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/>'),
  ticket: svg('<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.2a1.6 1.6 0 0 0 0 3.1V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.7a1.6 1.6 0 0 0 0-3.1V9Z"/><path d="M14 7v10" stroke-dasharray="2.2 2.2"/>'),
  user: svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.6-3.6 4.4-5.4 7.5-5.4s5.9 1.8 7.5 5.4"/>'),
  bell: svg('<path d="M6 17h12M8 17v-6a4 4 0 0 1 8 0v6"/><path d="M10.4 20a1.7 1.7 0 0 0 3.2 0"/>'),
  heart: svg('<path d="M12 20s-7-4.4-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5c-2.3 4.6-9.3 9-9.3 9Z"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>'),
  filter: svg('<path d="M4 7h10M18 7h2M4 17h2M8 17h12"/><circle cx="16" cy="7" r="2.2"/><circle cx="6" cy="17" r="2.2"/>'),
  check: svg('<path d="m5 13 4 4 10-10"/>'),
  gear: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>')
};

const LEAFLET_HEAD = `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">`;
const LEAFLET_JS = `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>`;
const QR_JS = `<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>`;

function layout({ file, page, nav, title, desc, head = '', scripts = '', main }) {
  const link = (key, href, label) => `<a data-nav-link="${key}" href="${href}">${label}</a>`;
  const bn = (key, href, label, icon) => `<a data-nav-link="${key}" href="${href}">${icon}<span>${label}</span></a>`;
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#E11D33">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
${head}
<script>try{var s=JSON.parse(localStorage.getItem('eg_settings')||'{}');var d=s.dark!=null?s.dark:matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>
</head>
<body data-page="${page}" data-nav="${nav}">
<a class="sr-only" href="#main">Aller au contenu</a>
<header class="site-header"><div class="container nav">
  <a class="brand" href="index.html" aria-label="EventGo — accueil"><span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M12 21s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg></span>EventGo</a>
  <nav class="nav-links" aria-label="Navigation principale">${link('home', 'index.html', 'Accueil')}${link('explorer', 'explorer.html', 'Explorer')}${link('carte', 'carte.html', 'Carte')}${link('billets', 'billets.html', 'Mes billets')}</nav>
  <div class="nav-actions">
    <a class="icon-btn" href="rappels.html" aria-label="Rappels">${I.bell}<span class="dot hidden" id="remDot"></span></a>
    <a class="icon-btn" href="favoris.html" aria-label="Favoris">${I.heart}</a>
    <button class="icon-btn" id="themeBtn" type="button" aria-label="Changer de thème">${I.moon}</button>
    <a class="btn btn-primary btn-sm nav-account" id="accountLink" href="profil.html">Mon compte</a>
  </div>
</div></header>
<main id="main">
${main}
</main>
<footer class="site-footer"><div class="container">
  <div class="foot-grid">
    <div><a class="brand" href="index.html"><span class="brand-mark" style="background:#2a2d35"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M12 21s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg></span>EventGo</a>
      <p>Découvrez et réservez les concerts, ateliers, expositions et rencontres de Conakry.</p><span class="flag"><i style="background:#E11D33"></i><i style="background:#F7B500"></i><i style="background:#12855B"></i></span></div>
    <div><h4>Découvrir</h4><a href="explorer.html">Explorer</a><a href="carte.html">Carte des événements</a><a href="explorer.html?cat=Concert">Concerts</a><a href="explorer.html?cat=Atelier">Ateliers</a></div>
    <div><h4>Mon espace</h4><a href="billets.html">Mes billets</a><a href="favoris.html">Favoris</a><a href="rappels.html">Rappels</a><a href="profil.html">Mon profil</a></div>
    <div><h4>Aide</h4><a href="profil.html#parametres">Paramètres</a><a href="profil.html#notifications">Notifications</a><a href="prototype/index.html">Maquette mobile</a></div>
  </div>
  <div class="foot-bottom">© 2026 EventGo — Projet de démonstration : les événements, organisateurs et billets présentés sont fictifs, aucun paiement réel n'est effectué. Marques Orange Money et MTN Mobile Money citées à titre d'illustration.</div>
</div></footer>
<nav class="bottom-nav" aria-label="Navigation mobile">${bn('home', 'index.html', 'Accueil', I.home)}${bn('explorer', 'explorer.html', 'Explorer', I.search)}${bn('carte', 'carte.html', 'Carte', I.map)}${bn('billets', 'billets.html', 'Billets', I.ticket)}${bn('profil', 'profil.html', 'Profil', I.user)}</nav>
<script src="assets/data.js"></script>
<script src="assets/core.js"></script>
${scripts}
<script src="assets/pages.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, file), html, 'utf8');
  console.log('wrote', file);
}

// ------------------------------------------------------------------ Accueil
layout({
  file: 'index.html', page: 'home', nav: 'home',
  title: 'EventGo — Événements à Conakry : concerts, ateliers, expositions',
  desc: "Découvrez et réservez les événements de Conakry : concerts, ateliers, expositions, rencontres, événements éducatifs et culturels.",
  main: `
<section class="hero"><div class="container hero-grid">
  <div>
    <span class="pill pill-red">Conakry · Guinée</span>
    <h1 style="margin-top:16px">Vivez les <em>meilleurs événements</em> de Conakry</h1>
    <p class="lead">Concerts, ateliers, expositions, rencontres… Découvrez ce qui se passe autour de vous et réservez votre place en quelques clics.</p>
    <form class="search-box" action="explorer.html" method="get" role="search">
      <input name="q" type="search" placeholder="Rechercher un événement, un lieu…" aria-label="Rechercher un événement">
      <select name="cat" id="heroCat" aria-label="Catégorie"></select>
      <button class="btn btn-primary" type="submit">Rechercher</button>
    </form>
    <div class="chip-row quick" id="quickChips"></div>
  </div>
  <div class="hero-collage" aria-hidden="true">
    <img class="c1" src="assets/img/concert.jpg" alt="">
    <img class="c2" src="assets/img/exposition.jpg" alt="">
    <img class="c3" src="assets/img/culturel.jpg" alt="">
    <div class="float-card"><span class="ic">${I.check}</span><div><span id="heroCount">0</span> événements à venir<small>à Conakry</small></div></div>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><h2>Parcourir par catégorie</h2><a href="explorer.html">Tout explorer →</a></div>
  <div class="cat-grid" id="catGrid"></div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><h2>Près de vous à Conakry</h2><a href="explorer.html">Voir tout →</a></div>
  <div class="grid-cards" id="upcoming"></div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><h2>Recommandés pour vous</h2><a href="explorer.html">Voir tout →</a></div>
  <div class="grid-cards" id="reco"></div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><h2>Comment ça marche</h2></div>
  <div class="steps">
    <div class="step"><div class="num">1</div><h3>Découvrez</h3><p class="muted">Parcourez la liste ou la carte, filtrez par date, catégorie, quartier et prix.</p></div>
    <div class="step"><div class="num">2</div><h3>Réservez</h3><p class="muted">Choisissez le nombre de places et payez par Orange Money, Mobile Money ou carte bancaire.</p></div>
    <div class="step"><div class="num">3</div><h3>Présentez votre billet</h3><p class="muted">Retrouvez votre QR code dans « Mes billets » et activez un rappel avant l'événement.</p></div>
  </div>
</div></section>

<section class="section"><div class="container"><div class="banner">
  <div><h2>Trouvez un événement près de chez vous</h2><p>La carte de Conakry affiche tous les événements à venir. Touchez un repère pour voir les détails.</p><a class="btn btn-primary btn-lg" href="carte.html">Ouvrir la carte</a></div>
  <div class="art" aria-hidden="true"></div>
</div></div></section>`
});

// ------------------------------------------------------------------ Explorer
layout({
  file: 'explorer.html', page: 'explorer', nav: 'explorer',
  title: 'Explorer les événements — EventGo', desc: 'Filtrez les événements de Conakry par catégorie, date, quartier et prix.',
  main: `
<div class="container"><div class="page-head"><h1>Explorer les événements</h1><p>Filtrez par catégorie, date, quartier ou prix pour trouver l'événement qui vous correspond.</p></div>
<div class="explore">
  <div class="sheet-backdrop" id="sheetBackdrop"></div>
  <aside class="filters" id="filters" aria-label="Filtres">
    <div class="row-between" style="margin-bottom:8px"><h3 style="margin:0">Filtres</h3><button class="btn btn-ghost btn-sm" id="resetBtn" type="button">Réinitialiser</button></div>
    <div class="fgroup"><h3>Catégorie</h3><div id="catChecks"></div></div>
    <div class="fgroup"><h3>Prix</h3>
      <label class="check"><input type="radio" name="price" value="all" checked> Tous</label>
      <label class="check"><input type="radio" name="price" value="free"> Gratuit</label>
      <label class="check"><input type="radio" name="price" value="paid"> Payant</label>
      <div class="field" style="margin-top:10px"><label for="maxPrice">Prix maximum : <span id="maxOut">30&nbsp;000&nbsp;GNF</span></label><input type="range" id="maxPrice" min="0" max="30000" step="1000" value="30000"></div></div>
    <div class="fgroup"><h3>Quartier</h3><select class="select" id="district" aria-label="Quartier"></select></div>
    <div class="fgroup"><h3>Date</h3><div class="form-grid"><div class="field"><label for="from">Du</label><input class="input" type="date" id="from"></div><div class="field"><label for="to">Au</label><input class="input" type="date" id="to"></div></div>
      <label class="check" style="margin-top:8px"><input type="checkbox" id="showPast"> Afficher les événements passés</label></div>
    <button class="btn btn-primary btn-block filter-btn" id="closeFilters" type="button" style="margin-top:16px">Voir les résultats</button>
  </aside>
  <div>
    <div class="field" style="margin-bottom:16px"><label class="sr-only" for="q">Rechercher</label><input class="input" id="q" type="search" placeholder="Rechercher un événement, un lieu, un organisateur…"></div>
    <div class="toolbar"><span class="result-count" id="resultCount" aria-live="polite"></span>
      <div style="display:flex;gap:10px"><button class="btn btn-outline filter-btn" id="openFilters" type="button">${I.filter} Filtres</button>
      <select class="select" id="sort" aria-label="Trier par" style="width:auto"><option value="date">Date</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select></div></div>
    <div class="grid-cards" id="results"></div>
  </div>
</div></div>`
});

// ------------------------------------------------------------------ Carte
layout({
  file: 'carte.html', page: 'carte', nav: 'carte',
  title: 'Carte des événements — EventGo', desc: 'Tous les événements de Conakry sur une carte interactive.',
  head: LEAFLET_HEAD, scripts: LEAFLET_JS,
  main: `
<div class="map-layout">
  <aside class="map-list" aria-label="Liste des événements">
    <div><h1 style="font-size:1.5rem">Carte des événements</h1><p class="muted" style="margin-top:6px">Touchez un repère ou un événement pour le localiser.</p></div>
    <div class="chip-row" id="mapChips"></div>
    <button class="btn btn-outline btn-block" id="locate" type="button">${I.map} Ma position</button>
    <div id="mapList" style="display:flex;flex-direction:column;gap:12px"></div>
  </aside>
  <div id="map" role="region" aria-label="Carte de Conakry"></div>
</div>`
});

// ------------------------------------------------------------------ Événement
layout({
  file: 'evenement.html', page: 'event', nav: 'explorer',
  title: 'Événement — EventGo', desc: "Détails de l'événement : date, lieu, prix et réservation.",
  head: LEAFLET_HEAD, scripts: LEAFLET_JS,
  main: `<div id="eventRoot"><div class="container" style="padding:60px 0"><p class="muted">Chargement…</p></div></div>`
});

// ------------------------------------------------------------------ Réservation
layout({
  file: 'reservation.html', page: 'booking', nav: 'explorer',
  title: 'Réservation — EventGo', desc: 'Réservez votre place et payez par Orange Money, Mobile Money ou carte bancaire.',
  main: `<div id="bookRoot"><div class="container" style="padding:60px 0"><p class="muted">Chargement…</p></div></div>`
});

// ------------------------------------------------------------------ Confirmation
layout({
  file: 'confirmation.html', page: 'confirmation', nav: 'billets',
  title: 'Réservation confirmée — EventGo', desc: 'Votre réservation est confirmée.',
  scripts: QR_JS,
  main: `<div id="ticketRoot" style="padding-bottom:60px"><div class="container" style="padding:60px 0"><p class="muted">Chargement…</p></div></div>`
});

// ------------------------------------------------------------------ Billet
layout({
  file: 'billet.html', page: 'ticket', nav: 'billets',
  title: 'Mon billet — EventGo', desc: 'Votre billet et son QR code.',
  scripts: QR_JS,
  main: `<div id="ticketRoot" style="padding:12px 0 60px"><div class="container" style="padding:60px 0"><p class="muted">Chargement…</p></div></div>`
});

// ------------------------------------------------------------------ Mes billets
layout({
  file: 'billets.html', page: 'tickets', nav: 'billets',
  title: 'Mes billets — EventGo', desc: 'Retrouvez vos billets à venir et passés.',
  main: `
<div class="container" style="padding-bottom:64px"><div class="page-head"><h1>Mes billets</h1><p>Vos réservations sont enregistrées sur cet appareil.</p></div>
  <div class="tabs" role="tablist"><button class="tab on" data-tab="up" role="tab" aria-selected="true">À venir</button><button class="tab" data-tab="past" role="tab" aria-selected="false">Passés</button></div>
  <div class="ticket-list" id="ticketList"></div></div>`
});

// ------------------------------------------------------------------ Rappels
layout({
  file: 'rappels.html', page: 'reminders', nav: 'profil',
  title: 'Rappels — EventGo', desc: "Programmez des rappels avant vos événements.",
  main: `
<div class="container" style="padding-bottom:64px"><div class="page-head"><h1>Rappels</h1><p>Recevez une alerte avant le début de vos événements. Les notifications s'affichent lorsque EventGo est ouvert dans votre navigateur.</p></div>
  <button class="btn btn-outline" id="permBtn" type="button" style="margin-bottom:20px">${I.bell} Activer les notifications du navigateur</button>
  <div id="remList" style="display:grid;gap:14px"></div></div>`
});

// ------------------------------------------------------------------ Favoris
layout({
  file: 'favoris.html', page: 'favorites', nav: 'profil',
  title: 'Mes favoris — EventGo', desc: 'Vos événements favoris.',
  main: `
<div class="container" style="padding-bottom:64px"><div class="page-head"><h1>Mes favoris</h1><p id="favCount"></p></div>
  <div class="grid-cards" id="favList"></div></div>`
});

// ------------------------------------------------------------------ Profil
const row = (title, sub, id) => `<div class="list-row"><span class="grow"><b>${title}</b><small>${sub}</small></span><label class="switch"><input type="checkbox" id="${id}" aria-label="${title}"><span></span></label></div>`;
layout({
  file: 'profil.html', page: 'profile', nav: 'profil',
  title: 'Mon compte — EventGo', desc: 'Profil, paramètres et notifications.',
  main: `
<div class="container"><div class="page-head"><h1>Mon compte</h1></div>
<div class="account">
  <nav class="side-nav" aria-label="Compte">
    <button data-pane="profil" type="button">${I.user} Profil</button>
    <button data-pane="parametres" type="button">${I.gear} Paramètres</button>
    <button data-pane="notifications" type="button">${I.bell} Notifications</button>
    <a href="billets.html">${I.ticket} Mes billets</a>
    <a href="favoris.html">${I.heart} Mes favoris</a>
    <a href="rappels.html">${I.bell} Mes rappels</a>
  </nav>
  <div>
    <section class="pane" id="pane-profil">
      <div class="profile-head"><span class="avatar" id="pAvatar">?</span><div><h2 id="pName" style="font-size:1.4rem"></h2><p class="muted" id="pMail"></p></div></div>
      <div class="quick-links"><a href="billets.html"><span class="muted">Billets</span><b id="nTickets">0</b></a><a href="favoris.html"><span class="muted">Favoris</span><b id="nFavs">0</b></a><a href="rappels.html"><span class="muted">Rappels actifs</span><b id="nRem">0</b></a></div>
      <form class="card" id="profileForm"><h2>Mes informations</h2><div class="form-grid">
        <div class="field full"><label for="f-name">Nom complet</label><input class="input" id="f-name" autocomplete="name"></div>
        <div class="field"><label for="f-email">E-mail</label><input class="input" id="f-email" type="email" autocomplete="email"></div>
        <div class="field"><label for="f-phone">Téléphone</label><input class="input" id="f-phone" type="tel" autocomplete="tel"></div></div>
        <button class="btn btn-primary" type="submit" style="margin-top:18px">Enregistrer</button>
        <p class="muted" style="margin-top:12px;font-size:.85rem">Ces informations restent sur cet appareil et servent à préremplir vos réservations.</p></form>
    </section>
    <section class="pane hidden" id="pane-parametres"><div class="card"><h2>Paramètres</h2>
      <div class="list-row"><span class="grow"><b>Langue</b><small>Français</small></span></div>
      <div class="list-row"><span class="grow"><b>Devise</b><small>Franc guinéen (GNF)</small></span></div>
      ${row('Mode sombre', "Réduit l'éclat de l'écran", 's-dark')}
      <div class="list-row"><span class="grow"><b>Mes données</b><small>Effacer profil, billets, favoris et rappels de cet appareil</small></span><button class="btn btn-outline btn-sm" id="wipe" type="button">Effacer</button></div>
    </div></section>
    <section class="pane hidden" id="pane-notifications"><div class="card"><h2>Notifications</h2>
      ${row('Notifications push', "Autoriser les alertes de l'application", 'n-push')}
      ${row("Rappels d'événements", 'Avant chaque événement réservé', 'n-reminders')}
      ${row('Événements près de moi', 'Nouveaux événements à Conakry', 'n-nearby')}
      ${row('Offres et promotions', 'Réductions et billets à prix réduit', 'n-promo')}
      ${row('Résumé hebdomadaire', 'Chaque lundi', 'n-weekly')}
      <button class="btn btn-outline" id="permBtn" type="button" style="margin-top:14px">${I.bell} Autoriser les notifications du navigateur</button>
    </div></section>
  </div>
</div></div>`
});
