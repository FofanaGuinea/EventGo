# EventGo

Site web responsive (mobile → ordinateur) pour découvrir et réserver des événements à Conakry.
HTML / CSS / JavaScript pur, sans framework ni étape de build à l'exécution.

- `index.html`, `explorer.html`, `carte.html`, `evenement.html`, `reservation.html`, `confirmation.html`,
  `billets.html`, `billet.html`, `rappels.html`, `favoris.html`, `profil.html` : les pages du site.
- `assets/` : styles (`site.css`), données de démonstration (`data.js`), logique (`core.js`, `pages.js`), images.
- `_src/build.js` : génère les pages HTML (`node _src/build.js`).
- `prototype/` et `wireframe/` : maquettes mobiles du projet de design (référence).

Projet de démonstration : événements fictifs, aucun paiement réel. Les données (profil, billets, favoris, rappels)
sont stockées uniquement dans le navigateur (localStorage).
