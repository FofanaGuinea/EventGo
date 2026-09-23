const fs = require('fs');
const site = [
  ['01-accueil', '/index.html', 1200], ['02-explorer', '/explorer.html', 1200], ['03-carte', '/carte.html', 4500],
  ['04-evenement', '/evenement.html?id=nuit-acoustique', 3500], ['05-reservation', '/reservation.html?id=nuit-acoustique', 1200],
  ['06-confirmation', '/confirmation.html?ref=EVG-DEMO-0001', 2500], ['07-mes-billets', '/billets.html', 1200],
  ['08-billet', '/billet.html?ref=EVG-DEMO-0001', 2500], ['09-rappels', '/rappels.html', 1200], ['10-favoris', '/favoris.html', 1200],
  ['11-profil', '/profil.html?p=1', 1200], ['12-parametres', '/profil.html?p=2#parametres', 1200], ['13-notifications', '/profil.html?p=3#notifications', 1200],
  ['14-hors-ligne', '/offline.html', 1200]
];
const proto = [
  ['01-accueil', 'accueil'], ['02-explorer', 'explorer'], ['03-carte', 'carte'], ['04-detail-evenement', 'detail'], ['05-reservation', 'reservation'],
  ['06-confirmation', 'confirmation'], ['07-mes-billets', 'billets'], ['08-detail-billet', 'billet-detail'], ['09-rappels', 'rappels'],
  ['10-profil', 'profil'], ['11-favoris', 'favoris'], ['12-parametres', 'parametres'], ['13-notifications', 'notifications']
];
const jobs = [];
site.forEach(([n, url, wait]) => {
  jobs.push({ url, width: 1440, fullPage: true, wait, theme: 'light', out: 'site-desktop-1440/' + n + '.svg' });
  jobs.push({ url, width: 390, fullPage: true, wait, theme: 'light', out: 'site-mobile-390/' + n + '.svg' });
});
proto.forEach(([n, p]) => jobs.push({ url: '/prototype/' + p + '.html', width: 390, height: 844, fullPage: false, wait: 1200, theme: 'light', out: 'maquette-ui-iphone-390x844/' + n + '.svg' }));
proto.forEach(([n, p]) => jobs.push({ url: '/wireframe/' + p + '.html', width: 390, height: 844, fullPage: false, wait: 1200, theme: 'light', out: 'wireframe-iphone-390x844/' + n + '.svg' }));
fs.writeFileSync(__dirname + '/jobs-all.json', JSON.stringify(jobs, null, 1));
console.log(jobs.length + ' jobs');
