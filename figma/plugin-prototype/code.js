// EventGo — plugin Figma : trace automatiquement les liens du prototype entre les écrans importés.
// Il lit la page courante, retrouve les écrans par leur numéro (01, 02, ...), repère les boutons par leur
// texte ou par le nom de leur calque, puis leur ajoute l'interaction « Au clic > Naviguer vers ».
'use strict';

var TRANS = { type: 'DISSOLVE', easing: { type: 'EASE_IN_AND_OUT' }, duration: 0.25 };
function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }
function bbox(n) { return n.absoluteBoundingBox || null; }

// ---------------------------------------------------------------- règles
function tabRules(frames, items, inside, up) {
  var out = [];
  frames.forEach(function (f) {
    items.forEach(function (it) { out.push({ on: f, t: it[0], inside: inside, up: up, to: it[1], label: 'Onglet ' + it[0] }); });
  });
  return out;
}

function iphoneRules() {
  var R = [];
  var tabItems = [['Accueil', '01'], ['Explorer', '02'], ['Carte', '03'], ['Billets', '07'], ['Profil', '10']];
  R = R.concat(tabRules(['01', '02', '03', '07', '10', '11'], tabItems, /^tabbar/, /^tab-item/));
  var card = /^(card|card-h)\d*$/;
  R.push({ on: '01', name: card, to: '04', label: 'Carte événement' });
  R.push({ on: '01', t: 'Voir la carte des événements', to: '03', opt: true, label: 'Bouton « Voir la carte »' }); // sous la zone visible dans le cadre 390 x 844
  R.push({ on: '01', t: /^rechercher un événement/, up: /^search-bar/, to: '02', label: 'Barre de recherche' });
  R.push({ on: '01', corner: 'topright', to: '09', label: 'Cloche (rappels)' });
  R.push({ on: '01', t: 'Tout voir', up: /^section-link/, to: '02', all: true, label: 'Lien « Tout voir »' });
  R.push({ on: '02', name: card, to: '04', label: 'Carte événement' });
  R.push({ on: '02', back: true, to: '01', label: 'Retour' });
  R.push({ on: '03', name: /^(preview\d*|markerPreview)$/, to: '04', label: 'Aperçu événement' });
  R.push({ on: '03', back: true, to: '01', label: 'Retour' });
  R.push({ on: '04', t: 'Réserver ma place', up: /^btn/, to: '05', label: 'Bouton « Réserver »' });
  R.push({ on: '04', back: true, to: '01', label: 'Retour' });
  R.push({ on: '05', t: 'Confirmer la réservation', up: /^btn/, to: '06', label: 'Bouton « Confirmer »' });
  R.push({ on: '05', back: true, to: '04', label: 'Retour' });
  R.push({ on: '06', t: 'Voir mon billet', up: /^btn/, to: '07', label: 'Bouton « Voir mon billet »' });
  R.push({ on: '06', t: 'Retour aux événements', up: /^btn/, to: '01', label: 'Bouton « Retour aux événements »' });
  R.push({ on: '07', name: /^ticket\d*$/, to: '08', label: 'Carte de billet' });
  R.push({ on: '08', back: true, to: '07', label: 'Retour' });
  R.push({ on: '09', back: true, to: '01', label: 'Retour' });
  [['Mes favoris', '11'], ['Mes billets', '07'], ['Mes rappels', '09'], ['Paramètres', '12'], ['Notifications', '13']].forEach(function (m) {
    R.push({ on: '10', t: m[0], up: /^menu-item/, to: m[1], label: 'Menu « ' + m[0] + ' »' });
  });
  R.push({ on: '11', name: card, to: '04', label: 'Carte événement' });
  R.push({ on: '11', back: true, to: '10', label: 'Retour' });
  R.push({ on: '12', back: true, to: '10', label: 'Retour' });
  R.push({ on: '13', back: true, to: '10', label: 'Retour' });
  return R;
}

function siteRules() {
  var R = [], all = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'];
  var head = /^site-header/, bottom = /^bottom-nav/;
  all.forEach(function (f) {
    [['Accueil', '01'], ['Explorer', '02'], ['Carte', '03'], ['Mes billets', '07']].forEach(function (m) {
      R.push({ on: f, t: m[0], inside: head, up: 'tight', to: m[1], opt: true, label: 'Menu « ' + m[0] + ' »' });
    });
    R.push({ on: f, t: 'EventGo', inside: head, up: /^brand/, to: '01', opt: true, label: 'Logo' });
    R.push({ on: f, t: /^(mon compte|mamadou)$/, inside: head, up: /^btn/, to: '11', opt: true, label: 'Bouton compte' });
    R.push({ on: f, hdr: 0, to: '09', opt: true, label: 'Cloche (rappels)' });
    R.push({ on: f, hdr: 1, to: '10', opt: true, label: 'Cœur (favoris)' });
    [['Accueil', '01'], ['Explorer', '02'], ['Carte', '03'], ['Billets', '07'], ['Profil', '11']].forEach(function (m) {
      R.push({ on: f, t: m[0], inside: bottom, up: /^(a|active)\d*$/, to: m[1], opt: true, label: 'Barre du bas « ' + m[0] + ' »' });
    });
  });
  var card = /^ev-card\d*$/;
  R.push({ on: '01', name: card, to: '04', label: 'Carte événement' });
  R.push({ on: '01', name: /^cat-tile\d*$/, to: '02', label: 'Catégorie' });
  R.push({ on: '01', name: /^chip\d*$/, to: '02', opt: true, label: 'Puce de catégorie' });
  R.push({ on: '01', t: 'Rechercher', up: /^btn/, to: '02', label: 'Bouton « Rechercher »' });
  R.push({ on: '01', t: 'Ouvrir la carte', up: /^btn/, to: '03', label: 'Bouton « Ouvrir la carte »' });
  R.push({ on: '01', t: /^(tout explorer|voir tout)/, up: 'tight', to: '02', all: true, label: 'Lien « Voir tout »' });
  R.push({ on: '02', name: card, to: '04', label: 'Carte événement' });
  R.push({ on: '03', name: /^map-item\d*$/, to: '04', label: 'Événement de la liste' });
  R.push({ on: '04', t: 'Réserver ma place', up: /^btn/, to: '05', label: 'Bouton « Réserver »' });
  R.push({ on: '04', t: 'Réserver', up: /^btn/, to: '05', opt: true, label: 'Bouton « Réserver » (mobile)' });
  R.push({ on: '04', name: card, to: '04', opt: true, label: 'Événement associé' });
  R.push({ on: '04', t: 'Explorer', inside: /^crumbs/, up: 'tight', to: '02', opt: true, label: 'Fil d’Ariane' });
  R.push({ on: '05', t: 'Confirmer la réservation', up: /^btn/, to: '06', label: 'Bouton « Confirmer »' });
  R.push({ on: '05', t: /retour à l'événement/, up: 'tight', to: '04', label: 'Retour à l’événement' });
  R.push({ on: '06', t: 'Voir mon billet', up: /^btn/, to: '08', label: 'Bouton « Voir mon billet »' });
  R.push({ on: '06', t: 'Retour aux événements', up: /^btn/, to: '02', label: 'Bouton « Retour aux événements »' });
  R.push({ on: '07', name: /^t-item\d*$/, to: '08', opt: true, label: 'Ligne de billet' });
  R.push({ on: '08', t: /mes billets/, inside: /^crumbs/, up: 'tight', to: '07', label: 'Retour aux billets' });
  R.push({ on: '09', name: /^rem-item\d*$/, to: '04', opt: true, label: 'Rappel' });
  R.push({ on: '10', name: card, to: '04', opt: true, label: 'Carte événement' });
  [['Profil', '11'], ['Paramètres', '12'], ['Notifications', '13'], ['Mes billets', '07'], ['Mes favoris', '10'], ['Mes rappels', '09']].forEach(function (m) {
    ['11', '12', '13'].forEach(function (f) {
      R.push({ on: f, t: m[0], inside: /^side-nav/, up: /^(a|button|on)\d*$/, to: m[1], opt: true, label: 'Menu du compte « ' + m[0] + ' »' });
    });
  });
  R.push({ on: '14', t: 'Mes billets', up: /^btn/, to: '07', opt: true, label: 'Bouton « Mes billets »' });
  return R;
}

// ---------------------------------------------------------------- outils
function hasAncestor(node, re, frame) {
  var p = node.parent;
  while (p && p !== frame) { if (re.test(p.name || '')) return true; p = p.parent; }
  return false;
}
function climbByName(node, frame, re) {
  var p = node;
  while (p && p !== frame) { if (re.test(p.name || '')) return p; p = p.parent; }
  return null;
}
// plus petit ancêtre nettement plus grand que le texte (bouton, ligne de menu…), sans jamais prendre une zone géante
function climbBox(node, frame) {
  var t = bbox(node), p = node.parent;
  if (!t) return node;
  while (p && p !== frame) {
    var b = bbox(p);
    if (!b || b.width > 560 || b.height > 160) break;
    if (b.width >= t.width + 28 && b.height >= t.height + 14) return p;
    p = p.parent;
  }
  return climbTight(node, frame);
}
// remonte tant que le parent reste à peine plus grand que le texte (lien de menu sans fond)
function climbTight(node, frame) {
  var t = bbox(node), cur = node, p = node.parent;
  if (!t) return node;
  while (p && p !== frame) {
    var b = bbox(p);
    if (!b || b.width > t.width + 44 || b.height > t.height + 30) break;
    cur = p; p = p.parent;
  }
  return cur;
}

function findSources(ctx, rule) {
  var frame = ctx.frame, nodes = ctx.nodes, fb = bbox(frame) || { x: 0, y: 0, width: frame.width, height: frame.height };
  var out = [];
  function rel(n) { var b = bbox(n); return b ? { x: b.x - fb.x, y: b.y - fb.y, w: b.width, h: b.height } : null; }
  if (rule.t != null) {
    var want = typeof rule.t === 'string' ? norm(rule.t) : null;
    nodes.forEach(function (n) {
      if (n.type !== 'TEXT') return;
      var c = norm(n.characters);
      if (want !== null ? c !== want : !rule.t.test(c)) return;
      if (rule.inside && !hasAncestor(n, rule.inside, frame)) return;
      var tgt;
      if (rule.up === 'tight') tgt = climbTight(n, frame);
      else if (rule.up) tgt = climbByName(n, frame, rule.up) || climbBox(n, frame);
      else tgt = climbBox(n, frame);
      out.push(tgt);
    });
  } else if (rule.name) {
    nodes.forEach(function (n) {
      if (n.type === 'TEXT' || !rule.name.test(n.name || '')) return;
      if (rule.inside && !hasAncestor(n, rule.inside, frame)) return;
      out.push(n);
    });
  } else if (rule.back || rule.corner) {
    var icons = nodes.filter(function (n) { return /^icon-btn\d*$/.test(n.name || ''); });
    icons = icons.filter(function (n) {
      var r = rel(n); if (!r) return false;
      if (rule.corner === 'topright') return r.x > fb.width - 110 && r.y < 130;
      return r.x < 90 && r.y < 130;
    });
    icons.sort(function (a, b) { return rel(a).x - rel(b).x; });
    if (icons.length) out.push(rule.corner === 'topright' ? icons[icons.length - 1] : icons[0]);
  } else if (rule.hdr != null) {
    var hi = nodes.filter(function (n) { return /^icon-btn\d*$/.test(n.name || '') && hasAncestor(n, /^site-header/, frame); });
    hi.sort(function (a, b) { return rel(a).x - rel(b).x; });
    if (hi[rule.hdr]) out.push(hi[rule.hdr]);
  }
  return rule.all ? out : (out.length ? out : []);
}

async function setLink(node, dest, ctx) {
  var target = node;
  while (target && target !== ctx.frame && !('reactions' in target)) target = target.parent;
  if (!target || target === ctx.frame) return false;
  if (ctx.done.has(target.id)) return true; // déjà relié : on garde le premier lien
  var reaction = { trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: TRANS, resetVideoPosition: false }] };
  try {
    if (target.setReactionsAsync) await target.setReactionsAsync([reaction]); else target.reactions = [reaction];
  } catch (e1) {
    try { target.reactions = [{ trigger: { type: 'ON_CLICK' }, action: reaction.actions[0] }]; }
    catch (e2) { ctx.errors.push(String(e2 && e2.message || e2)); return false; }
  }
  ctx.done.add(target.id);
  return true;
}

function frameNumber(name) { var m = /^\s*(\d{1,2})/.exec(name || ''); return m ? ('0' + m[1]).slice(-2) : null; }

function wrapInFrame(node) {
  if (node.type === 'FRAME' || !('width' in node)) return node;
  var f = figma.createFrame();
  f.name = node.name; f.x = node.x; f.y = node.y;
  f.resize(Math.max(1, node.width), Math.max(1, node.height));
  f.fills = []; f.clipsContent = true;
  f.appendChild(node); node.x = 0; node.y = 0;
  return f;
}

// ---------------------------------------------------------------- exécution
async function run() {
  var lines = [], created = 0, missing = 0, errors = [];
  var frames = {};
  figma.currentPage.children.slice().forEach(function (n) {
    var k = frameNumber(n.name); if (!k) return;
    frames[k] = wrapInFrame(n);
  });
  var nums = Object.keys(frames).sort();
  if (!nums.length) return { text: 'Aucun écran trouvé sur cette page.\nLes cadres doivent commencer par un numéro : « 01 Accueil », « 02 Explorer »…', created: 0 };
  var isSite = !!frames['14'] || /site/i.test(figma.currentPage.name || '');
  var rules = isSite ? siteRules() : iphoneRules();
  lines.push('Page : ' + figma.currentPage.name + '  |  mode : ' + (isSite ? 'site web (14 pages)' : 'écrans iPhone (13 écrans)') + '  |  écrans trouvés : ' + nums.length);
  var named = 0, total = 0;
  nums.forEach(function (k) { frames[k].findAll(function (n) { total++; if (/^(tab-item|card|card-h|ev-card|btn|icon-btn|ticket|menu-item)\d+$/.test(n.name || '')) named++; return false; }); });
  if (!named) lines.push('⚠ Les calques n’ont pas les noms attendus (btn1, card1…). Seuls les liens repérés par leur texte peuvent fonctionner. Envoyez une capture du panneau des calques.');
  var ctxByNum = {};
  for (var i = 0; i < nums.length; i++) {
    var f = frames[nums[i]];
    ctxByNum[nums[i]] = { frame: f, nodes: f.findAll(function () { return true; }), done: new Set(), errors: errors };
  }
  for (var r = 0; r < rules.length; r++) {
    var rule = rules[r], ctx = ctxByNum[rule.on], dest = frames[rule.to];
    if (!ctx) { if (!rule.opt) { lines.push('· écran ' + rule.on + ' absent : ' + rule.label); missing++; } continue; }
    if (!dest) { lines.push('· écran cible ' + rule.to + ' absent : ' + rule.label); missing++; continue; }
    var srcs = findSources(ctx, rule), ok = 0;
    for (var s = 0; s < srcs.length; s++) { if (await setLink(srcs[s], dest, ctx)) ok++; }
    created += ok;
    if (!ok && !rule.opt) { lines.push('✗ ' + rule.on + ' → ' + rule.to + ' : ' + rule.label + ' introuvable'); missing++; }
  }
  try { if (frames['01']) figma.currentPage.flowStartingPoints = [{ nodeId: frames['01'].id, name: 'Parcours EventGo' }]; }
  catch (e) { lines.push('Point de départ à définir à la main : Prototype > Flow starting point > 01.'); }
  if (errors.length) lines.push('Erreurs : ' + errors.slice(0, 3).join(' | '));
  lines.unshift(created + ' liens créés, ' + missing + ' éléments introuvables.');
  return { text: lines.join('\n'), created: created, missing: missing };
}

if (typeof figma !== 'undefined' && figma.showUI) {
  figma.showUI(__html__, { width: 480, height: 420 });
  run().then(function (res) {
    figma.ui.postMessage({ type: 'report', text: res.text });
    figma.notify(res.created + ' liens de prototype créés', { timeout: 4000 });
  }).catch(function (e) {
    figma.ui.postMessage({ type: 'report', text: 'Erreur : ' + (e && e.message || e) });
  });
  figma.ui.onmessage = function (m) { if (m && m.type === 'close') figma.closePlugin(); };
}
if (typeof module !== 'undefined') module.exports = { run: run };
