// EventGo — shared vanilla-JS interactions for the static prototype.
// No framework, no build step: every page includes this file and calls
// these helpers from inline onclick attributes.

function toggleSwitch(el) {
  el.classList.toggle('on');
}

function openSheet(id) {
  document.getElementById(id).style.display = 'block';
}
function closeSheet(id) {
  document.getElementById(id).style.display = 'none';
}
function stopProp(e) {
  e.stopPropagation();
}

// Segmented tabs: buttons carry data-tabgroup + data-tabvalue,
// panels carry data-tabpanel + data-panelvalue.
function setTab(group, value) {
  document.querySelectorAll('[data-tabgroup="' + group + '"]').forEach(function (el) {
    el.classList.toggle('on', el.getAttribute('data-tabvalue') === value);
  });
  document.querySelectorAll('[data-tabpanel="' + group + '"]').forEach(function (el) {
    var shown = el.getAttribute('data-panelvalue') === value;
    el.style.display = shown ? (el.getAttribute('data-panel-display') || 'block') : 'none';
  });
}

// Favorite heart toggle: swaps the fill of the first <svg> inside el.
function toggleFav(el, onColor) {
  var on = el.getAttribute('data-on') === '1';
  el.setAttribute('data-on', on ? '0' : '1');
  var svg = el.querySelector('svg');
  if (svg) svg.setAttribute('fill', on ? 'none' : (onColor || 'currentColor'));
}

// Ticket-quantity stepper on the Réservation screen.
function stepQty(delta, min, max, unitPrice, flatFee) {
  var qtyEl = document.getElementById('qtyVal');
  var qtyLabelEl = document.getElementById('qtyLabel');
  var subEl = document.getElementById('subtotalVal');
  var totEl = document.getElementById('totalVal');
  var q = parseInt(qtyEl.getAttribute('data-qty'), 10) + delta;
  q = Math.max(min, Math.min(max, q));
  qtyEl.setAttribute('data-qty', q);
  qtyEl.textContent = q + ' billet(s)';
  if (qtyLabelEl) qtyLabelEl.textContent = q;
  var sub = q * unitPrice;
  var tot = sub + flatFee;
  if (subEl) subEl.textContent = sub.toLocaleString('fr-FR') + ' GNF';
  if (totEl) totEl.textContent = tot.toLocaleString('fr-FR') + ' GNF';
}

// Payment method selector on the Réservation screen.
function selectPay(which) {
  ['om', 'mm', 'card'].forEach(function (k) {
    var opt = document.getElementById('pay-' + k);
    if (opt) opt.classList.toggle('selected', k === which);
    var panel = document.getElementById('payfields-' + k);
    if (panel) panel.style.display = k === which ? '' : 'none';
  });
}

// Map marker selection on the Carte screen. `data` is an array of
// { title, date, loc, cat, color, bg, img } indexed by marker.
function selectMarker(idx, data) {
  document.querySelectorAll('.marker').forEach(function (m) {
    m.classList.remove('selected');
  });
  var m = document.getElementById('marker-' + idx);
  if (m) m.classList.add('selected');
  var d = data[idx];
  var titleEl = document.getElementById('prevTitle');
  var metaEl = document.getElementById('prevMeta');
  var catEl = document.getElementById('prevCat');
  var mediaEl = document.getElementById('prevMedia');
  if (titleEl) titleEl.textContent = d.title;
  if (metaEl) metaEl.textContent = d.date + ' · ' + d.loc;
  if (catEl) {
    catEl.textContent = d.cat;
    if (d.bg) catEl.style.background = d.bg;
    if (d.color) catEl.style.color = d.color;
  }
  if (mediaEl) {
    if (d.img) {
      mediaEl.innerHTML = '<img src="' + d.img + '" alt="' + d.cat + '" style="width:100%;height:100%;object-fit:cover;">';
    } else {
      mediaEl.innerHTML = '';
      mediaEl.style.background = 'linear-gradient(135deg,' + d.color + ',#333)';
    }
  }
}
