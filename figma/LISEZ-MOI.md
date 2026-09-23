# EventGo — frames prêts pour Figma

54 fichiers SVG, un par écran. Chaque fichier devient un cadre (frame) dans Figma avec des textes modifiables,
des icônes vectorielles, les photos et les logos intégrés.

| Dossier | Contenu | Taille du cadre |
|---|---|---|
| `site-desktop-1440/` | les 14 pages du site, version ordinateur | 1440 px de large |
| `site-mobile-390/` | les mêmes 14 pages, version téléphone | 390 px de large |
| `maquette-ui-iphone-390x844/` | les 13 écrans iPhone en maquette colorée | 390 × 844 |
| `wireframe-iphone-390x844/` | les 13 écrans iPhone en wireframe (gris) | 390 × 844 |

Les fichiers sont numérotés (`01-accueil`, `02-explorer`, `03-carte`, `04-evenement`, `05-reservation`,
`06-confirmation`, `07-mes-billets`, `08-billet`, `09-rappels`, `10-favoris`, `11-profil`, `12-parametres`,
`13-notifications`, `14-hors-ligne`) dans l'ordre du parcours utilisateur.

## Importer dans Figma (une frame à la fois, ou tout un dossier)

1. Installez les polices **Sora** et **Manrope** (gratuites, déjà disponibles dans Figma via Google Fonts).
2. Ouvrez votre fichier Figma (ou créez-en un).
3. Glissez un fichier `.svg` sur le canvas. Pour importer tout un dossier d'un coup, sélectionnez tous les
   fichiers du dossier et glissez-les ensemble : Figma les place côte à côte.
4. Si un import arrive sous forme de groupe et non de cadre : sélectionnez-le, puis **Ctrl+Alt+G**
   (Cadre de la sélection). Si vous renommez un cadre, gardez le numéro au début (par exemple « 01 Accueil ») : le plugin de prototype s'en sert.
5. Rangez-les par pages Figma : `01 Site — Ordinateur`, `02 Site — Mobile`, `03 iPhone — Maquette`,
   `04 iPhone — Wireframe`.

Les calques portent le nom de leur classe CSS (`site-header`, `ev-card`, `badge-cat`, `btn`…), ce qui aide à
se repérer dans le panneau des calques.

## Prototype automatique (plugin Figma)

Le dossier `plugin-prototype/` contient un plugin qui trace tous les liens du prototype d'un coup
(environ 70 liens par série d'écrans iPhone, environ 190 pour le site).

1. Utilisez l'application **Figma pour ordinateur** (figma.com/downloads). Les plugins locaux ne marchent pas dans le navigateur.
2. Gardez les noms des cadres tels qu'importés (`01-accueil`, `02-explorer`…) : le plugin retrouve les écrans par leur numéro.
3. Menu Figma, **Plugins**, **Development**, **Import plugin from manifest…**, puis choisissez `plugin-prototype/manifest.json`.
4. Ouvrez la page à relier (par exemple « Maquette iPhone »), puis **Plugins**, **Development**, **EventGo — liens du prototype**.
5. Une fenêtre affiche le rapport : nombre de liens créés et éléments introuvables.
6. Répétez pour chaque page. Le plugin détecte tout seul s'il s'agit des écrans iPhone (13 écrans) ou du site (14 pages).
7. Contrôle : sélectionnez un écran, onglet **Prototype** à droite, puis lecture (bouton triangle en haut à droite).

Le point de départ du parcours est placé sur l'écran 01. Sur l'écran iPhone Accueil, le bouton « Voir la carte » est sous la zone visible : utilisez l'onglet Carte.

## À savoir

- Chaque écran est exporté dans son état par défaut (thème clair, profil de démonstration « Mamadou Diallo »,
  un billet de démonstration, quelques favoris). Les fenêtres ouvertes (filtres, partage) ne sont pas incluses.
- Les ombres portées ne sont pas exportées (les bordures fines restent).
- Les hachures grises des images du wireframe ne sont pas exportées (l'icône image reste).
- La carte est exportée en image (fond OpenStreetMap), avec les repères par-dessus.
- Le texte peut se décaler très légèrement selon la version de Figma : ajustez avec l'auto-layout si besoin.
- Les fichiers sont des SVG : Figma ne recrée pas de composants ni d'auto-layout, il faut les construire ensuite
  à partir des cadres importés.

## Régénérer les fichiers

Le code de l'export est dans `_src/figma-export/` (convertisseur `dom-to-svg`, navigateur sans fenêtre).
`npm install`, puis `npx esbuild entry.js --bundle --format=iife --minify --outfile=bundle.js`,
`node jobs-gen.js` et `run.ps1` (adaptez les chemins en tête du script).
