// =====================================================================
//  EEPATHO — app.js
//  Carte MapLibre + semiologie + classification + filtres + tableau de bord
// =====================================================================

const GEOJSON = "communes_web.geojson";
const DATA_DIR = "data";
const CLE = "INSEE_COM";

const LIBELLES = {
  POPULATION:"Population municipale", DENSITE:"Densité (hab/km²)",
  REV_MEDIAN:"Revenu médian par UC (€)", APL_GENERALISTES:"APL médecins généralistes",
  FDEP:"Indice de défavorisation FDep", FDEP_QUINTILE:"Quintile FDep (1→5)",
  POP_TOTALE:"Population totale", NB_IMMIGRES:"Nb immigrés",
  PART_IMMIGRES:"Part d'immigrés (%)",
  DIST_CHU_CLCC:"Distance patient → CHU/CLCC (km)",
  DIST_PRESCRIPTEUR:"Distance → prescripteur (km)",
  DUREE_PRESCRIPTEUR:"Durée → prescripteur (min)",
  PRESCRIPTEURS:"Présence de prescripteurs par commune",
  NITRATES_MOY:"Nitrates — moyenne (mg/L)",
  NITRATES_MAX:"Nitrates — maximum (mg/L)",
  ARSENIC_MOY:"Arsenic — moyenne (µg/L)",
  ARSENIC_MAX:"Arsenic — maximum (µg/L)",
  PESTICIDES_MOY:"Pesticides totaux — moyenne (µg/L)",
  PESTICIDES_MAX:"Pesticides totaux — maximum (µg/L)",
  CVM:"Chlorure de vinyle — maximum (µg/L)",
  RADON:"Potentiel radon (catégorie)",
  NO2:"NO₂ — moyenne annuelle (µg/m³)",
  O3:"Ozone O₃ — moyenne annuelle (µg/m³)",
  PM10:"Particules PM10 (µg/m³)",
  PM25:"Particules fines PM2,5 (µg/m³)",
  TYPE_COMMUNE:"Type urbain/rural",
  GEOCLASH:"Typologie Geoclash",
  GRILLE_DENSITE:"Grille de densité (7 niveaux)",
  DIST_PRESC_ETAB:"Distance prescripteur → établissement (km)",
  DUREE_PRESC_ETAB:"Durée prescripteur → établissement (min)",
  DIST_COMMUNE_ETAB:"Distance commune → établissement (km)",
  DUREE_COMMUNE_ETAB:"Durée commune → établissement (min)",
  POP_20P:"Population 20 ans et plus",
  POP_20P_H:"Hommes de 20 ans et plus",
  POP_20P_F:"Femmes de 20 ans et plus",
  PART_H_20P:"Part d'hommes chez les 20 ans et plus (%)",
  PREVALENCE:"Prévalence — nombre de cas",
  INCIDENCE:"Incidence — nombre de nouveaux cas",
  PREVALENCE_PERIODES:"Prévalence — total par période (4 ans)",
  INCIDENCE_PERIODES:"Incidence — total par période (4 ans)",
  ETIO_VIRALE:"Étiologie virale — nombre de cas",
  ETIO_ALCOOLIQUE:"Étiologie alcoolique — nombre de cas",
  ETIO_METABOLIQUE:"Étiologie métabolique — nombre de cas",
  ETIO_AUTO_IMMUNE:"Étiologie auto-immune — nombre de cas",
  ETIO_VASCULAIRE:"Étiologie vasculaire — nombre de cas",
  ETIO_INCONNUE:"Étiologie inconnue — nombre de cas",
  ETIO_MIXTE_ALCOOLIQUE:"Étiologie mixte alcoolique — nombre de cas",
  ETIO_MIXTE_METABOLIQUE:"Étiologie mixte métabolique — nombre de cas",
  ETIO_MIXTE_AUTRE:"Étiologie mixte, autre — nombre de cas"
};

// ---- SEMIOLOGIE : palettes (ColorBrewer) adaptees a chaque variable ----
const RAMPS = {
  reds:    ["#ffffb2","#fecc5c","#fd8d3c","#f03b20","#bd0026"],
  greens:  ["#ffffcc","#c2e699","#78c679","#31a354","#006837"],
  blues:   ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"],
  purples: ["#f2f0f7","#cbc9e2","#9e9ac8","#756bb1","#54278f"],
  oranges: ["#feedde","#fdbe85","#fd8d3c","#e6550d","#a63603"],
  teal:    ["#edf8fb","#b2e2e2","#66c2a4","#2ca25f","#006d2c"],
  diverging:["#2166ac","#92c5de","#f7f7f7","#f4a582","#b2182b"],
  // --- pollution eau : dégradés dédiés, esthétiques et thématiques ---
  ylOrBr:  ["#ffffd4","#fed98e","#fe9929","#d95f0e","#993404"],  // nitrates (agricole)
  puRd:    ["#f1eef6","#d7b5d8","#df65b0","#dd1c77","#980043"],  // arsenic (toxique)
  buPu:    ["#edf8fb","#b3cde3","#8c96c6","#8856a7","#810f7c"],  // pesticides (chimique)
  // Chlorure de vinyle : rupture visuelle voulue à la limite réglementaire.
  // Vert très pâle = rien trouvé, sable = présent mais conforme, puis orange →
  // rouge → rouge sombre pour les seuls dépassements. Le vert pâle se distingue
  // du gris-bleu hachuré des communes non analysées (NODATA), à ne surtout pas
  // confondre ici : « non analysé » n'est pas « non détecté ».
  cvmSeuils: ["#dfeee4","#f2d479","#ef9b42","#cf4429","#78150f"],
  // --- qualité de l'air ---
  ylOrRd:  ["#ffffb2","#fed976","#feb24c","#fd8d3c","#e31a1c"],  // particules (PM)
  rdPu:    ["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"],  // NO2 (trafic)
  gnBu:    ["#f0f9e8","#bae4bc","#7bccc4","#43a2ca","#0868ac"],  // O3 (ozone)
  // --- accessibilité prescripteur → établissement ---
  amber:   ["#fee391","#fec44f","#fb9a29","#d95f0e","#8c2d04"],  // distance
  coral:   ["#fcbba1","#fc9272","#fb6a4a","#cb181d","#67000d"],  // durée
  // --- accessibilité commune → établissement ---
  nightCyan:  ["#d5f4f2","#7fd4d8","#2c9ec4","#1f5fa6","#10275e"],  // distance : bleu-nuit → cyan clair
  forestLime: ["#e6f5c9","#a6d96a","#5aae4a","#2f7d32","#14532d"],  // durée : citron clair → vert-forêt
  // --- population 20 ans et plus (palettes dédiées, absentes du reste de l'atlas) ---
  // viridis : perceptuellement uniforme (pas de faux palier visuel) et lisible en
  // daltonisme deutan/protan — la carte reste lisible même très dense.
  viridis:    ["#fde725","#7ad151","#22a884","#414487","#440154"],  // effectif 20+
  steelIndigo:["#eef2fb","#c3cfe9","#8b9fd4","#4f6bb0","#1f2f6b"],  // hommes 20+
  roseGold:   ["#fdf0f3","#f6c9d5","#e893ac","#c85480","#7d1f4b"],  // femmes 20+
  // Divergent centré sur la parité : ROSE = femmes majoritaires, BLEU = hommes
  // majoritaires — l'opposition doit se lire d'un coup d'œil, y compris sur des
  // cercles de 3 px. Teintes volontairement saturées : une version pastel rendait
  // la quasi-totalité du semis blafarde (l'écart à la parité dépasse rarement 5 pts,
  // c'est un signal ténu qu'il faut amplifier pour qu'il existe visuellement).
  // Les deux extrémités sont à luminosité comparable, condition d'une divergente
  // honnête : aucun des deux camps ne doit paraître « plus lourd » que l'autre.
  // Le neutre reste la teinte la PLUS CLAIRE de la gamme (sinon la divergente se lit
  // à l'envers), mais assez soutenu pour ne pas se confondre avec le fond Positron :
  // un cercle crème cerclé de blanc sur fond blanc n'existe tout simplement pas.
  pariteHF:   ["#a4133c","#ff7096","#e3ddd0","#5b8fd4","#1d4a87"],
  // --- prévalence EEPATHO : rose -> grenat sombre, propre à la pathologie étudiée,
  // pour ne pas se confondre avec les "reds" déjà utilisés par Population/FDep.
  maroon:     ["#fff0f3","#ffb3c6","#ff4d6d","#a4133c","#590212"],
  // --- incidence EEPATHO : paille -> rouille sombre, même famille "pathologie"
  // que maroon (prévalence) mais teinte chaude/jaune pour rester distincte à l'œil.
  incidence:  ["#fff7e0","#ffd166","#f4954b","#c0501e","#6b2708"],
  // --- étiologies EEPATHO (nb_etio_1..9) : une teinte propre à chaque nature
  // d'étiologie (pas de ramp partagée) pour les distinguer d'un coup d'œil en
  // passant de l'une à l'autre dans le menu. Choisies pour ne recouper aucune
  // ramp déjà utilisée ailleurs dans l'atlas.
  amethyst:  ["#f6f0fb","#d9b8ea","#b478d1","#8034a8","#450a6b"],  // virale
  whisky:    ["#fff9db","#ffe066","#f7b731","#c67c0e","#6b3d00"],  // alcoolique
  jade:      ["#e8fbf3","#a8e6cf","#4dbf9d","#1f8a70","#0b4a3d"],  // métabolique
  fuchsia:   ["#fef0f7","#f6a6d1","#e451a0","#a01464","#520a35"],  // auto-immune
  crimson:   ["#fff0ee","#ffab9e","#fa5a4a","#c81e1e","#6e0a0a"],  // vasculaire
  slate:     ["#f2f4f7","#c3cbd6","#8d9baf","#54677f","#263445"],  // inconnue
  copper:    ["#fff3e8","#ffc794","#f28d3f","#c1560f","#6b2a04"],  // mixte alcoolique
  lime:      ["#f7fbe8","#d4e896","#a3c93f","#6e9412","#3a5006"],  // mixte métabolique
  indigoDeep:["#eef1fd","#b7c2f0","#7c8fe0","#4257b8","#1c2a6b"]   // mixte autre
};

// ---- Fiches méthodo par variable : source, millésimes, limites connues ----
// Uniquement des faits vérifiés du projet — pas de source inventée pour les variables non documentées ici.
const METADATA = {
  REV_MEDIAN: { source:"Insee-DGFiP, Filosofi", limite:"Disponible 2017-2021 uniquement. Filosofi 2022 n'existe pas. Filosofi 2023 relève de « Filosofi 2 », méthodologiquement non comparable aux millésimes antérieurs (rupture de série)." },
  RADON: { source:"Arrêté ministériel 2018 (potentiel radon par commune)", limite:"Variable catégorielle figée sur l'arrêté 2018 : un seul millésime, ne varie pas dans le temps." },
  GRILLE_DENSITE: { source:"Insee, grille communale de densité (7 niveaux)", limite:"Disponible 2017-2024. L'Insee a révisé la méthode début 2025 : le millésime 2025 n'est pas intégré pour éviter une rupture de série." },
  // Recherchée sur le web (2026-07-29) : aucune publication ni jeu de données public ne
  // correspond à ces 5 classes précises ("Zones urbaines défavorisées"...) sous le nom
  // Geoclash — vraisemblablement une typologie interne au projet. Pas de source inventée
  // (politique du fichier, cf. l'entête) : à confirmer auprès de l'équipe avant publication.
  GEOCLASH: { source:"Typologie territoriale interne au projet — source précise à confirmer auprès de l'équipe", limite:"Millésime unique (non annuel) — vérifier l'année de référence avant publication." },
  ARSENIC_MOY: { source:"SISE-Eaux (ARS)", limite:"Moyenne annuelle par commune, 2017-2024." },
  ARSENIC_MAX: { source:"SISE-Eaux (ARS)", limite:"Maximum annuel par commune, 2017-2024." },
  NITRATES_MOY: { source:"SISE-Eaux (ARS)", limite:"Moyenne annuelle par commune, 2017-2024." },
  NITRATES_MAX: { source:"SISE-Eaux (ARS)", limite:"Maximum annuel par commune, 2017-2024." },
  PESTICIDES_MOY: { source:"SISE-Eaux (ARS)", limite:"Moyenne annuelle par commune, 2017-2024." },
  PESTICIDES_MAX: { source:"SISE-Eaux (ARS)", limite:"Maximum annuel par commune, 2017-2024." },
  // Une commune sans valeur n'a PAS été analysée cette année-là : ce n'est pas une
  // commune conforme. Une valeur 0 signifie « recherché, non détecté ».
  CVM: { source:"SISE-Eaux (ARS) — paramètre SANDRE 1753, generate_cvm.py",
         limite:"Maximum annuel par commune, 2017-2024. Limite de qualité 0,5 µg/L. Valeur étendue aux communes desservies par le même réseau de distribution ; commune sans valeur = non analysée, et non « conforme ».",
         lien:"https://www.cancer-environnement.fr/fiches/expositions-environnementales/chlorure-de-vinyle/",
         lienLabel:"Fiche Cancer Environnement — chlorure de vinyle (Centre Léon Bérard)" },
  NO2: { source:"INERIS", limite:"2017-2024." },
  O3: { source:"INERIS", limite:"2017-2024." },
  PM10: { source:"INERIS", limite:"2017-2024." },
  PM25: { source:"INERIS", limite:"2017-2024." },
  // Distances/durées calculées en interne par l'équipe avec le Distancier METRIC de
  // l'Insee (mesure des trajets routiers inter-communes, moteur OSRM) — précision
  // communiquée par l'équipe le 2026-07-29, cf. https://www.progedo.fr/donnees/quetelet-progedo/acceder-aux-donnees/produits-a-facon/distancier-metric/
  DIST_PRESC_ETAB: { source:"Calcul interne équipe — Distancier METRIC (Insee, routage OSRM)", limite:"Millésime 2024. Uniquement renseignée pour les ~11 255 communes disposant d'un prescripteur (NA sinon, volontaire). Trou de couverture connu sur la Corse (2A/2B) à vérifier côté script R." },
  DUREE_PRESC_ETAB: { source:"Calcul interne équipe — Distancier METRIC (Insee, routage OSRM)", limite:"Millésime 2024. Uniquement renseignée pour les ~11 255 communes disposant d'un prescripteur (NA sinon, volontaire). Trou de couverture connu sur la Corse (2A/2B) à vérifier côté script R." },
  DIST_COMMUNE_ETAB:  { source:"Calcul interne équipe — Distancier METRIC (Insee, routage OSRM)", limite:"Distance commune de résidence → établissement de soins." },
  DUREE_COMMUNE_ETAB: { source:"Calcul interne équipe — Distancier METRIC (Insee, routage OSRM)", limite:"Durée commune de résidence → établissement de soins." },
  DIST_PRESCRIPTEUR:   { source:"Calcul interne équipe — Distancier METRIC (Insee, routage OSRM)", limite:"Distance commune → prescripteur." },
  DUREE_PRESCRIPTEUR:  { source:"Calcul interne équipe — Distancier METRIC (Insee, routage OSRM)", limite:"Durée commune → prescripteur." },
  PRESCRIPTEURS: { source:"cod_commune_prescripteur_b.xlsx (colonne nb_prescripteur), generate_prescripteurs.py", limite:"Millésime non précisé par la source, aligné arbitrairement sur Distance/Durée au prescripteur (2024) — à confirmer auprès de l'équipe. 3 classes : aucun prescripteur recensé (commune absente du classeur), 1 à 9 (secret statistique — le classeur ne livre qu'un « <10 », jamais le nombre exact) ou pôle de 10 prescripteurs ou plus. Paris/Lyon/Marseille : arrondissements sommés sur la commune globale (75056/69123/13055), même règle que la Prévalence. Corse : mêmes codes département hérités numériques (« 20 ») que la Prévalence, résolus via le numéro de commune ; 458 lignes du classeur (arrondissements exclus) restent sans polygone correspondant et ne sont pas représentées." },
  POPULATION: { source:"Insee, population légale (recensement)", limite:null },
  DENSITE:    { source:"Insee, population légale (recensement), rapportée à la surface communale", limite:null },
  TYPE_COMMUNE: { source:"Insee, zonage urbain/rural — millésime précis à confirmer auprès de l'équipe", limite:null },
  NB_IMMIGRES:   { source:"Insee, recensement de la population (population immigrée)", limite:null },
  PART_IMMIGRES: { source:"Insee, recensement de la population (population immigrée)", limite:null },
  APL_GENERALISTES: { source:"Drees/Insee/Cnam, indicateur APL (Accessibilité Potentielle Localisée)", limite:null },
  FDEP: { source:"French Deprivation index (FDep)", limite:null },
  FDEP_QUINTILE: { source:"French Deprivation index (FDep), quintiles", limite:null },
  // Population 20+ : SOURCE NON RENSEIGNÉE ICI À DESSEIN — elle n'a pas été
  // documentée par l'équipe et ce fichier ne contient que des faits vérifiés.
  // Les limites ci-dessous sont, elles, mesurées sur les fichiers livrés.
  POP_20P: { limite:"Disponible 2017-2022, 34 858 communes. L'effectif total est arrondi indépendamment des effectifs hommes et femmes : H + F s'écarte du total de ±1 sur environ 24 % des communes (arrondi des poids fractionnaires). C'est le total qui fait foi. Source à confirmer auprès de l'équipe." },
  POP_20P_H: { limite:"Disponible 2017-2022. Arrondi indépendamment du total (cf. Population 20 ans et plus). Source à confirmer auprès de l'équipe." },
  POP_20P_F: { limite:"Disponible 2017-2022. Une commune (04107) ne compte aucune femme de 20 ans et plus. Source à confirmer auprès de l'équipe." },
  PART_H_20P: { limite:"Disponible 2017-2022, 34 847 communes (les 11 communes sans population 20+ n'ont pas de part). Médiane 49,5 % : l'écart à la parité est faible, d'où une carte volontairement divergente à seuils fixes (47 / 49,5 / 50,5 / 53) et non à quantiles, qui décentreraient le neutre. Extrêmes portés par de très petites communes (min 25 %, max 88,9 %) — prudence à l'interprétation. Source à confirmer auprès de l'équipe." },
  PREVALENCE: { source:"Base EEPATHO, table commune × année (nb_prev)", limite:"Secret statistique : une commune totalisant moins de 10 cas prévalents sur l'année est notée « <10 » dans la source — 65,7 % des couples commune×année sont dans ce cas. Ces communes sont cartographiées à part (catégorie « secret statistique »), sans valeur inventée. Paris/Lyon/Marseille : le classeur détaille les 20/9/16 arrondissements séparément (codes 751xx/693xx/132xx) — ils sont sommés et attribués à la commune globale (75056/69123/13055), seule géométrie disponible dans le fond de carte ; un éventuel résidu « ville entière » numérique du classeur est ajouté à la somme, jamais s'il est masqué. Par ailleurs, ~4 170 codes communaux antérieurs à une fusion en « commune nouvelle » (surtout millésimes 2017-2019) n'ont plus de polygone dans le fond de carte actuel et ne sont donc pas représentés. Corse (mise à jour 2026-07-28) : le classeur source encode ses communes sous deux codes département hérités numériques, « 020 » et « 209 », faute de pouvoir stocker « 2A »/« 2B » — « 020 » s'est avéré masqué à 100 % sans aucune valeur exploitable et a été ignoré ; « 209 » a permis de retrouver 209 communes actuelles sur 360 (58 %) via leur numéro de commune, qui ne se recoupe jamais entre 2A et 2B. Les 151 communes restantes (numéros de commune hérités ne correspondant à aucun découpage actuel, essentiellement des communes fusionnées) restent non représentées, comme pour le reste de la France." },
  INCIDENCE: { source:"Base EEPATHO, table commune × année (nb_inc)", limite:"Nombre de NOUVEAUX cas diagnostiqués dans l'année (à distinguer de la Prévalence, qui compte tous les cas actifs). Même règle de secret statistique que la Prévalence : une commune sous les 10 nouveaux cas sur l'année est notée « <10 » et cartographiée à part (catégorie « secret statistique »), sans valeur inventée. Mêmes règles de reconstruction communale que la Prévalence : arrondissements de Paris/Lyon/Marseille sommés sur la commune globale (75056/69123/13055), communes fusionnées sans polygone actuel non représentées, Corse réintégrée à 58 % (209/360 communes, code hérité 209) — cf. fiche de la Prévalence pour le détail." },
  PREVALENCE_PERIODES: { source:"Somme de data/PREVALENCE.json sur 2 périodes de 4 ans (2017-2020 et 2021-2024), calculée hors-ligne — cf. generate_periodes_prevalence_incidence.py.", limite:"Total communal des 4 années de la période. Règle de secret statistique volontairement stricte : si au moins une des 4 années de la période est masquée (< 10 cas) OU si la commune n'apparaît pas cette année-là (code apparu/disparu suite à une fusion), le total de la période est ENTIÈREMENT masqué (« non calculable »), jamais partiellement additionné — on ne peut garantir ni la valeur ni même le dépassement du seuil de 10 dès qu'une composante est incertaine. Conséquence attendue : la part de mailles masquées est plus élevée que sur la Prévalence annuelle (73,9 % sur 2017-2020, 68,6 % sur 2021-2024). Mêmes limites de reconstruction communale que la Prévalence annuelle (PLM sommés, Corse réintégrée à 58 %, communes fusionnées non représentées)." },
  INCIDENCE_PERIODES: { source:"Somme de data/INCIDENCE.json sur 2 périodes de 4 ans (2017-2020 et 2021-2024), calculée hors-ligne — cf. generate_periodes_prevalence_incidence.py.", limite:"Total communal des 4 années de la période, même règle de secret statistique stricte que Prévalence — total par période (toute année masquée ou manquante masque la période entière). Le seuil de 10 nouveaux cas/an étant plus dur à atteindre que celui de la Prévalence, la part masquée est très élevée (96,6 % sur 2017-2020, 96,9 % sur 2021-2024) : cet indicateur ne devient lisible qu'à une échelle supra-communale (région, département) via le filtre territorial. Mêmes limites de reconstruction communale que l'Incidence annuelle." },
  // --- Étiologies (nb_etio_1..9) : nature de la pathologie chez les cas prévalents,
  // d'après dico_EEPATHO_table_comm_ann.xlsx. Même pipeline que Prévalence/Incidence
  // (secret statistique < 10, arrondissements PLM sommés, Corse réintégrée à 58 %,
  // communes fusionnées sans polygone non représentées) — rejoué à l'identique et
  // validé à 0 écart sur nb_prev/nb_inc avant application aux 9 colonnes nb_etio_*.
  ETIO_VIRALE: { source:"Base EEPATHO, table commune × année (nb_etio_1), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est virale. Secret statistique : 92,6 % des mailles commune×année sont sous le seuil de 10 cas (catégorie « secret statistique », jamais de valeur inventée). Mêmes règles de reconstruction communale que la Prévalence (PLM sommés, Corse réintégrée à 58 %, communes fusionnées non représentées) — cf. fiche de la Prévalence pour le détail." },
  ETIO_ALCOOLIQUE: { source:"Base EEPATHO, table commune × année (nb_etio_2), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est alcoolique. Secret statistique : 93,8 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_METABOLIQUE: { source:"Base EEPATHO, table commune × année (nb_etio_3), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est métabolique. Secret statistique : 90,2 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_AUTO_IMMUNE: { source:"Base EEPATHO, table commune × année (nb_etio_4), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est auto-immune. Secret statistique : 90,7 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_VASCULAIRE: { source:"Base EEPATHO, table commune × année (nb_etio_5), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est vasculaire — étiologie la plus rare des 9 : 280 653 mailles sur 280 700 sont masquées (secret statistique), soit 99,98 %. Seules quelques grandes villes (Marseille, Nice, Bordeaux, Paris…) dépassent occasionnellement le seuil de 10 cas. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_INCONNUE: { source:"Base EEPATHO, table commune × année (nb_etio_6), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie n'a pas été identifiée. Secret statistique : 96,0 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_MIXTE_ALCOOLIQUE: { source:"Base EEPATHO, table commune × année (nb_etio_7), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est mixte à composante alcoolique. Secret statistique : 99,2 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_MIXTE_METABOLIQUE: { source:"Base EEPATHO, table commune × année (nb_etio_8), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est mixte à composante métabolique. Secret statistique : 98,0 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." },
  ETIO_MIXTE_AUTRE: { source:"Base EEPATHO, table commune × année (nb_etio_9), dico_EEPATHO_table_comm_ann.xlsx", limite:"Cas prévalents dont l'étiologie déclarée est mixte, autre composante. Secret statistique : 97,0 % des mailles masquées. Mêmes règles de reconstruction communale que la Prévalence — cf. sa fiche pour le détail." }
};
function ficheMethodo(v){
  const meta = METADATA[v];
  const info = INDEX[v] || {};
  const annees = (info.annees||[]).join(", ") || "non renseignées";
  let html = `<b>${LIBELLES[v]||v}</b><br><br>Années disponibles : <b>${annees}</b>`;
  if(meta && meta.source) html += `<br>Source : ${meta.source}`;
  if(meta && meta.limite) html += `<br><br>⚠️ ${meta.limite}`;
  // Lien de documentation (champ `lien` de METADATA), ouvert dans un nouvel onglet
  // pour ne pas faire perdre la carte en cours ; rel="noopener" par principe.
  if(meta && meta.lien)
    html += `<br><br>🔗 <a href="${meta.lien}" target="_blank" rel="noopener">${meta.lienLabel||"En savoir plus"}</a>`;
  if(!meta) html += `<br><br>Pas de fiche méthodo détaillée saisie pour cette variable — vérifier le dictionnaire de variables du projet.`;
  return html;
}

// ============ CORRÉLATIONS SPATIALES (Prévalence vs autres variables) ============
// Sur demande explicite (2026-07-31) : "les hotspots coïncident-ils avec les zones
// défavorisées/mal desservies ?" — corrélation de rang de Spearman (robuste aux
// effectifs très asymétriques, cf. [[prevalence-indicator]]) entre l'effectif brut de
// Prévalence par période et un jeu ciblé de déterminants sociaux/environnementaux
// plausibles. PAS une comparaison de toutes les ~50 variables de l'atlas (bruit de
// corrélations parasites) : liste choisie avec l'utilisateur.
const CORR_VARS_PREVALENCE = [
  {v:"FDEP_QUINTILE",     label:"Défavorisation (quintile FDep)"},
  {v:"REV_MEDIAN",        label:"Revenu médian"},
  {v:"DIST_PRESCRIPTEUR", label:"Distance au prescripteur"},
  {v:"DUREE_PRESCRIPTEUR",label:"Durée d'accès au prescripteur"},
  {v:"NO2",               label:"NO₂ (pollution trafic)"},
  {v:"PM25",              label:"Particules fines PM2,5"},
  {v:"PM10",              label:"Particules PM10"},
  {v:"O3",                label:"Ozone O₃"},
  {v:"NITRATES_MOY",      label:"Nitrates (eau)"},
  {v:"ARSENIC_MOY",       label:"Arsenic (eau)"},
  {v:"PESTICIDES_MOY",    label:"Pesticides (eau)"},
  {v:"CVM",               label:"Chlorure de vinyle (eau)"},
  {v:"RADON",             label:"Potentiel radon"},
  {v:"DENSITE",           label:"Densité de population"},
  {v:"PART_IMMIGRES",     label:"Part d'immigrés"}
];
// rangs moyens en cas d'ex-aequo (méthode standard de Spearman)
function rangsMoyens(arr){
  const idx = arr.map((_,i)=>i).sort((a,b)=>arr[a]-arr[b]);
  const rangs = new Array(arr.length);
  let i=0;
  while(i<idx.length){
    let j=i;
    while(j+1<idx.length && arr[idx[j+1]]===arr[idx[i]]) j++;
    const rangMoyen = (i+j)/2 + 1;
    for(let k=i;k<=j;k++) rangs[idx[k]]=rangMoyen;
    i=j+1;
  }
  return rangs;
}
function pearson(xs, ys){
  const n=xs.length;
  const mx=xs.reduce((a,b)=>a+b,0)/n, my=ys.reduce((a,b)=>a+b,0)/n;
  let sxy=0, sxx=0, syy=0;
  for(let i=0;i<n;i++){ const dx=xs[i]-mx, dy=ys[i]-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy; }
  const den=Math.sqrt(sxx*syy);
  return den===0 ? 0 : sxy/den;
}
function spearman(xs, ys){ return pearson(rangsMoyens(xs), rangsMoyens(ys)); }

// Corrélation calculée à l'échelle NATIONALE (pas de filtre territorial courant) :
// un filtre région/département réduirait vite l'échantillon sous le seuil utile.
const CORR_N_MIN = 30;


const CONFIG = {
  // Effectifs masqués pour secret statistique (< 10 cas) : stockés comme "M" dans
  // data/PREVALENCE.json plutôt qu'un nombre inventé. maskedValue déclare ce
  // sentinel à dessiner()/applyPaint(), qui l'affichent dans une classe grisée à
  // part, exclue du dégradé et de son calcul de seuils.
  PREVALENCE: {type:"seq", ramp:"maroon", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  INCIDENCE: {type:"seq", ramp:"incidence", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  PREVALENCE_PERIODES: {type:"seq", ramp:"maroon", maskedValue:"M",
               maskedLabel:"Non calculable (≥ 1 année secret statistique)", maskedColor:"#9aa0a8",
               labels:{"M":"Non calculable (≥ 1 année sur la période masquée)"}},
  INCIDENCE_PERIODES: {type:"seq", ramp:"incidence", maskedValue:"M",
               maskedLabel:"Non calculable (≥ 1 année secret statistique)", maskedColor:"#9aa0a8",
               labels:{"M":"Non calculable (≥ 1 année sur la période masquée)"}},
  ETIO_VIRALE:            {type:"seq", ramp:"amethyst", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_ALCOOLIQUE:        {type:"seq", ramp:"whisky", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_METABOLIQUE:       {type:"seq", ramp:"jade", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_AUTO_IMMUNE:       {type:"seq", ramp:"fuchsia", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_VASCULAIRE:        {type:"seq", ramp:"crimson", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_INCONNUE:          {type:"seq", ramp:"slate", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_MIXTE_ALCOOLIQUE:  {type:"seq", ramp:"copper", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_MIXTE_METABOLIQUE: {type:"seq", ramp:"lime", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  ETIO_MIXTE_AUTRE:       {type:"seq", ramp:"indigoDeep", maskedValue:"M",
               maskedLabel:"Secret statistique (< 10 cas)", maskedColor:"#9aa0a8",
               labels:{"M":"Secret statistique (moins de 10 cas)"}},
  POPULATION:      {type:"seq", ramp:"reds"},
  POP_TOTALE:      {type:"seq", ramp:"reds"},
  DENSITE:         {type:"seq", ramp:"reds"},
  REV_MEDIAN:      {type:"seq", ramp:"greens"},
  APL_GENERALISTES:{type:"seq", ramp:"blues"},
  NB_IMMIGRES:     {type:"seq", ramp:"oranges"},
  PART_IMMIGRES:   {type:"seq", ramp:"oranges"},
  FDEP:            {type:"div", ramp:"diverging"},
  FDEP_QUINTILE:   {type:"seq", ramp:"reds"},
  DIST_CHU_CLCC:      {type:"seq", ramp:"purples"},
  DIST_PRESCRIPTEUR:  {type:"seq", ramp:"teal"},
  DUREE_PRESCRIPTEUR: {type:"seq", ramp:"teal"},
  // Présence de prescripteurs : catégoriel à 3 classes (pas un dégradé — la classe
  // "1" n'est pas une vraie mesure mais le résultat du secret statistique, elle ne
  // doit donc jamais être confondue avec un niveau intermédiaire d'un gradient).
  PRESCRIPTEURS: {type:"cat",
    order:["0","1","2"],
    palette:{"0":"#f0eee6","1":"#f0a860","2":"#7b1c1c"},
    labels:{"0":"Aucun prescripteur","1":"1 à 9 prescripteurs (effectif masqué)","2":"Pôle (10 prescripteurs ou plus)"}},
  // --- pollution eau ---
  NITRATES_MOY:   {type:"seq", ramp:"ylOrBr"},
  NITRATES_MAX:   {type:"seq", ramp:"ylOrBr"},
  ARSENIC_MOY:    {type:"seq", ramp:"puRd"},
  ARSENIC_MAX:    {type:"seq", ramp:"puRd"},
  PESTICIDES_MOY: {type:"seq", ramp:"buPu"},
  PESTICIDES_MAX: {type:"seq", ramp:"buPu"},
  // Seuils RÉGLEMENTAIRES imposés, et non des classes calculées : 77 à 92 % des
  // communes sont à zéro et 300 à 600 seulement dépassent la limite. En quantiles
  // ou en Jenks, les bornes s'écrasent toutes sur le zéro et les dépassements —
  // le seul message de la carte — deviennent invisibles.
  // 0,50005 plutôt que 0,5 : la limite de qualité est « ≤ 0,5 µg/L » et 12 à 58
  // communes par an valent exactement 0,5. Elles sont conformes ; classIndex
  // comparant en « < » strict, une borne à 0,5 les ferait basculer à tort dans
  // la classe « dépassement ».
  // 0,00005 isole le zéro exact : les valeurs sont arrondies à 4 décimales, donc
  // la plus petite valeur positive possible est 0,0001.
  CVM:            {type:"seq", ramp:"cvmSeuils", fixedBreaks:[0.00005,0.50005,1,5],
                   classLabels:["Non détecté",
                                "Détecté, sous la limite (≤ 0,5 µg/L)",
                                "Dépassement (0,5 – 1 µg/L)",
                                "Dépassement marqué (1 – 5 µg/L)",
                                "Dépassement sévère (≥ 5 µg/L)"]},
  RADON: {type:"cat",
          order:["1","2","3"],
          palette:{"1":"#1a9850","2":"#fee08b","3":"#d73027"},
          labels:{"1":"1 — faible","2":"2 — moyen","3":"3 — élevé"}},
  // --- qualité de l'air ---
  PM25: {type:"seq", ramp:"ylOrRd"},
  PM10: {type:"seq", ramp:"ylOrRd"},
  NO2:  {type:"seq", ramp:"rdPu"},
  O3:   {type:"seq", ramp:"gnBu"},
  TYPE_COMMUNE:    {type:"cat"},
  GEOCLASH: {type:"cat",
    order:["1","2","3","4","5"],
    palette:{"1":"#6a3d9a","2":"#1f78b4","3":"#33a02c","4":"#ff7f00","5":"#e31a1c"},
    labels:{"1":"Zones urbaines défavorisées","2":"Aires métropolitaines aisées","3":"Périurbain résidentiel","4":"Marges rurales","5":"Plaines agricoles et industrielles"}},
  GRILLE_DENSITE: {type:"cat",
    order:["1","2","3","4","5","6","7"],
    palette:{"1":"#7a0177","2":"#c51b8a","3":"#f768a1","4":"#fbb4b9","5":"#a1d99b","6":"#41ab5d","7":"#006d2c"},
    labels:{"1":"Grands centres urbains","2":"Centres urbains intermédiaires","3":"Petites villes","4":"Ceintures urbaines","5":"Bourgs ruraux","6":"Rural à habitat dispersé","7":"Rural à habitat très dispersé"}},
  DIST_PRESC_ETAB:  {type:"seq", ramp:"amber"},
  DUREE_PRESC_ETAB: {type:"seq", ramp:"coral"},
  DIST_COMMUNE_ETAB:  {type:"seq", ramp:"nightCyan"},
  DUREE_COMMUNE_ETAB: {type:"seq", ramp:"forestLime"},
  // --- population 20 ans et plus ---
  POP_20P:   {type:"seq", ramp:"viridis"},
  POP_20P_H: {type:"seq", ramp:"steelIndigo"},
  POP_20P_F: {type:"seq", ramp:"roseGold"},
  // Seuils FIXES et symétriques autour de 50 % : sur un indicateur de parité, des bornes
  // calculées (quantiles/Jenks) placeraient le neutre ailleurs qu'à 50 % et la carte
  // divergente mentirait. Médiane observée : 49,7 % — l'écart à la parité est le message.
  // Bande neutre serrée (±0,5 pt) : à ±1 pt elle absorbait 34 % des communes, qui
  // viraient toutes au gris — le clivage hommes/femmes devenait invisible.
  // Seuils revérifiés sur les 20+ (médiane 49,5 %) : bande neutre à 17,1 % des
  // communes, classe rose foncé à 44,3 % de la population — ils tiennent tels quels.
  PART_H_20P:{type:"div", ramp:"pariteHF", fixedBreaks:[47,49.5,50.5,53],
              classLabels:["Femmes nettement majoritaires (< 47 %)",
                           "Femmes majoritaires (47 – 49,5 %)",
                           "Quasi-parité (49,5 – 50,5 %)",
                           "Hommes majoritaires (50,5 – 53 %)",
                           "Hommes nettement majoritaires (≥ 53 %)"]}
};
const PALETTE_CAT = { "Rural":"#1a9850", "Urbain":"#b30000" };
const NODATA = "#cdd3da";
// Couleurs de surbrillance du mode comparaison de régions (A = bleu, B = orange).
// Réutilisées par la couche "communes-compare" (carte) et par le bandeau de comparaison.
const CMP_COLOR_A = "#1f6feb";   // région A — bleu
const CMP_COLOR_B = "#f97316";   // région B — orange

// ---- Carte ----
const map = new maplibregl.Map({
  container:"map",
  style:"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  center:[2.5,46.6], zoom:5.2, minZoom:4, maxZoom:13,
  fadeDuration:0,               // pas de fondu des libellés -> zoom/pan nettement plus fluides
  refreshExpiredTiles:false     // évite des rechargements de tuiles en tâche de fond
  // NB : preserveDrawingBuffer RETIRÉ (il forçait la conservation du buffer GL à chaque
  //      image = zoom saccadé). L'export PNG fonctionne via un rendu à la demande
  //      (triggerRepaint + once('render')), voir le bouton « Exporter en PNG ».
});
map.addControl(new maplibregl.NavigationControl({showCompass:true}), "top-right");
map.addControl(new maplibregl.ScaleControl({maxWidth:130, unit:"metric"}), "bottom-right");

const loading = document.getElementById("loading");
const show = t => { loading.textContent=t; loading.style.display="block"; };
const hide = () => loading.style.display="none";

let INDEX = {}, CURRENT = null, GEO = null;
let ALL_DATA = {};
let REGIONS_COMPAREES = [];
const _b=document.getElementById("cmp-banner"); if(_b) _b.remove();

// =====================================================================
//  ACCÈS AUX DONNÉES — chargement à la demande, mémoire bornée
//
//  L'atlas servait auparavant TOUTES les variables de l'index d'un coup
//  (preloadAllData) : 56 fichiers, 137 Mo de JSON brut, conservés
//  indéfiniment dans ALL_DATA — en plus des 16 Mo du fond communal (gardé
//  à la fois dans GEO et dans MapLibre), des 8 Mo des cercles 20+ et des
//  cartes de chaleur. Une fois désérialisés en objets JS (56 fichiers ×
//  ~8 millésimes × ~35 000 clés textuelles), on dépassait largement le
//  giga-octet résident et l'onglet finissait tué par le navigateur : c'est
//  ce que l'équipe décrivait par « l'application se ferme quand on essaie
//  de progresser ».
//
//  Désormais : rien n'est chargé tant qu'on n'en a pas besoin, et le cache
//  ne retient qu'un nombre borné de variables (les moins récemment
//  utilisées sont libérées). La variable affichée et celle de la
//  comparaison sont épinglées : elles ne peuvent jamais être évincées
//  sous les pieds de l'utilisateur.
// =====================================================================

// Au-delà de ce nombre de variables en cache, on libère les plus anciennes.
// 10 × ~3,5 Mo ≈ 35 Mo de JSON brut : large pour enchaîner les consultations,
// sans jamais approcher la limite mémoire de l'onglet.
const CACHE_MAX_VARS = 10;
const _cacheOrdre = [];              // clés de ALL_DATA, de la plus ancienne à la plus récente
const _cacheEpingle = new Set();     // variables protégées de l'éviction

function epinglerVariable(v){
  _cacheEpingle.clear();
  if(v) _cacheEpingle.add(v);
  const vb = document.getElementById("sel-var-b");
  if(vb && vb.value) _cacheEpingle.add(vb.value);
}

function _toucherCache(v){
  const i=_cacheOrdre.indexOf(v);
  if(i>=0) _cacheOrdre.splice(i,1);
  _cacheOrdre.push(v);
  for(let k=0; k<_cacheOrdre.length && _cacheOrdre.length>CACHE_MAX_VARS; ){
    const candidat=_cacheOrdre[k];
    if(_cacheEpingle.has(candidat)){ k++; continue; }   // jamais la variable affichée
    _cacheOrdre.splice(k,1);
    delete ALL_DATA[candidat];
  }
}

// Session réellement close : le serveur répond 401 sur data/*.json. Sans
// traitement, le .json() levait une exception non rattrapée, le voile « Chargement
// des données… » restait affiché et l'appli paraissait figée.
//
// On CONFIRME auprès du serveur avant de quitter l'atlas. Un 401 isolé — requête
// partie pendant un redémarrage du service, réponse tronquée sous pression
// mémoire — ne doit jamais éjecter un utilisateur dont la session est valide :
// c'est ce retour inexpliqué à l'accueil qui donnait l'impression que
// l'application se refermait toute seule. Tant que /session-status dit que la
// session tient, on reste sur place.
let _sessionPerdue=false;
async function sessionExpiree(){
  if(_sessionPerdue) return;
  _sessionPerdue=true;
  try{
    const r=await fetch("/session-status",{cache:"no-store"});
    if(r.ok){
      const d=await r.json();
      if(d && d.auth){ _sessionPerdue=false; return; }   // fausse alerte : on ne bouge pas
    }
  }catch(e){
    _sessionPerdue=false;                                // serveur injoignable : on reste
    return;
  }
  show("Session expirée — retour à la page de connexion…");
  setTimeout(()=>location.replace("index.html"), 1500);
}

// Erreur explicite, distincte d'un simple échec réseau, pour que les appelants
// puissent réagir différemment (message à l'utilisateur vs. dégradation silencieuse).
class ErreurDonnees extends Error {
  constructor(message, statut){ super(message); this.statut=statut; }
}

async function fetchJSON(url){
  let r;
  try{ r = await fetch(url, {cache:"default"}); }
  catch(e){ throw new ErreurDonnees(`réseau injoignable (${url})`, 0); }
  if(r.status===401){ sessionExpiree(); throw new ErreurDonnees("session expirée", 401); }
  if(!r.ok) throw new ErreurDonnees(`HTTP ${r.status} sur ${url}`, r.status);
  try{ return await r.json(); }
  catch(e){ throw new ErreurDonnees(`réponse illisible (${url})`, r.status); }
}

// Charge une variable si besoin et la met en cache. Les appels concurrents sur la
// même variable partagent la même requête (pas de double téléchargement quand le
// tableau de bord et l'assistant la demandent en même temps).
const _envolVariable = {};
async function assurerVariable(v){
  if(!v || !INDEX[v]) return null;
  if(ALL_DATA[v]){ _toucherCache(v); return ALL_DATA[v]; }
  if(!_envolVariable[v]){
    _envolVariable[v] = fetchJSON(`${DATA_DIR}/${v}.json`)
      .then(j=>{
        patchPLM(j, (CONFIG[v]||{}).type==="cat");
        ALL_DATA[v]=j; _toucherCache(v);
        delete _envolVariable[v];
        return j;
      })
      .catch(err=>{ delete _envolVariable[v]; throw err; });
  }
  return _envolVariable[v];
}

// Variante économe pour les calculs qui balaient BEAUCOUP de variables (corrélations
// de Spearman : 16 variables). On ne retient que le millésime utile — quelques
// centaines de Ko — au lieu de garder les ~8 années de chaque fichier en mémoire.
async function anneeDeVariable(v, annee){
  if(ALL_DATA[v]) return ALL_DATA[v][annee] || null;
  try{
    const j = await fetchJSON(`${DATA_DIR}/${v}.json`);
    return j[annee] || null;                       // le reste du fichier est abandonné au GC
  }catch(e){ return null; }
}

// Tentative silencieuse : renvoie null au lieu de propager (chemins d'affichage
// secondaires, où une variable manquante doit dégrader la réponse, pas la casser).
async function assurerVariableSoft(v){
  try{ return await assurerVariable(v); }catch(e){ return null; }
}


map.on("load", async () => {
  // Étape 1 — données de base (fond communal + index). Sans elles, rien ne peut
  // fonctionner : on s'arrête avec un message explicite plutôt que de laisser
  // l'exception remonter, ce qui laissait auparavant une page morte et un voile
  // « Chargement… » figé, sans la moindre indication de ce qui s'était passé.
  try{
    show("Chargement de la carte…");
    GEO = await fetchJSON(GEOJSON);
    construireNoms();
    ajouterCouchesCommunes();
    INDEX = await fetchJSON(`${DATA_DIR}/_index.json`);
  }catch(err){
    if(err && err.statut===401) return;          // sessionExpiree() a déjà pris la main
    console.error("Données de base indisponibles :", err);
    show("Impossible de charger le fond de carte. Vérifiez que le serveur est démarré (python server.py) puis rechargez la page.");
    return;
  }

  // Étape 2 — interface. Chaque module est isolé : un module en panne ne doit plus
  // empêcher tous les suivants de s'initialiser (l'assistant, l'export, les filtres…
  // étaient tous perdus dès qu'un seul levait une exception).
  const modules = [
    ["menu des variables", remplirMenuVariables],
    ["filtres territoriaux", remplirFiltres],
    ["interactions carte", interactions],
    ["redimensionnement", initResizer],
    ["habillage", initEmbellissements],
    ["fond de carte", initFond],
    ["cercles 20+", initCercles],
    ["carte de chaleur", initChaleur],
    ["assistant", initAssistant]
  ];
  for(const [nom, fn] of modules){
    try{ fn(); }
    catch(err){ console.error(`Module « ${nom} » non initialisé :`, err); }
  }

  const selVar = document.getElementById("sel-var");
  selVar.onchange = ()=>chargerVariable(selVar.value);
  document.getElementById("sel-year").onchange = ()=>dessiner();
  document.getElementById("sel-class").onchange = ()=>dessiner();

  hide();

  // 1re carte : chargerVariable() télécharge UNIQUEMENT le fichier de cette variable
  // et gère lui-même ses erreurs. Plus aucun préchargement de masse derrière.
  chargerVariable(selVar.value);
});

// Motif "pas de données" (EEPATHO uniquement) : hachures diagonales générées en canvas,
// plutôt qu'un aplat gris de plus qui se confond avec le gris du "secret statistique"
// juste au-dessus dans la légende — cf. demande explicite du 2026-07-29.
// Portées par une couche fill DÉDIÉE ("communes-fill-nodata"), séparée de "communes-fill" :
// "fill-pattern" ne supporte PAS les expressions à base de feature-state (contrairement à
// fill-color/fill-opacity) — un premier essai posant le motif directement sur "communes-fill"
// via une expression ["case",["feature-state","val"],...] a fait basculer TOUTE la couche
// dans le motif, sur chaque commune, quelle que soit sa valeur (bug constaté le 2026-07-29).
// Ici "fill-pattern" reste une CONSTANTE (autorisé) et c'est "fill-opacity" — qui supporte
// bien feature-state — qui décide, commune par commune, si la hachure est visible ou non.
const NODATA_HACHURE="nodata-hachure";
function imageHachures(){
  const size=12, periode=6, epaisseur=2.4;
  const c=document.createElement("canvas"); c.width=size; c.height=size;
  const ctx=c.getContext("2d");
  ctx.strokeStyle="rgba(108,118,133,0.85)";
  ctx.lineWidth=epaisseur;
  ctx.lineCap="square";
  // plusieurs diagonales "/" décalées de "periode", débordant largement du canevas :
  // une fois répétée en tuile par MapLibre, la ligne se prolonge sans coupure visible.
  for(let x=-size; x<=size*2; x+=periode){
    ctx.beginPath();
    ctx.moveTo(x, size);
    ctx.lineTo(x+size, 0);
    ctx.stroke();
  }
  return ctx.getImageData(0,0,size,size);
}
function assurerMotifsNoData(){
  if(!map.hasImage(NODATA_HACHURE)) map.addImage(NODATA_HACHURE, imageHachures());
}

// (ré)injecte les couches communes — appelée au chargement ET à chaque changement de fond
function ajouterCouchesCommunes(){
  assurerMotifsNoData();   // images du style : détruites comme le reste au changement de fond (setStyle)
  if(!map.getSource("communes"))
    // buffer/tolerance/maxzoom réduits => moins de sommets à tesséler = zoom/pan plus fluides
    // sur ce GeoJSON volumineux (~16 Mo). promoteId conservé pour l'état de survol.
    map.addSource("communes", { type:"geojson", data:GEO, promoteId:CLE,
      buffer:64, tolerance:0.5, maxzoom:12 });
  // getLayer avant chaque addLayer => fonction idempotente (rejouable sans erreur après
  // un changement de fond, où toutes les couches ont été supprimées puis recréées).
  if(!map.getLayer("communes-fill"))
    map.addLayer({ id:"communes-fill", type:"fill", source:"communes",
      paint:{ "fill-color":NODATA, "fill-opacity":0.85,
        "fill-color-transition":{duration:350}, "fill-opacity-transition":{duration:350} } });
  // couche dédiée aux hachures "pas de données" (EEPATHO) : "fill-pattern" reste une
  // constante, seule "fill-opacity" (feature-state par commune) décide où elles
  // apparaissent — cf. commentaire au-dessus de assurerMotifsNoData(). Opacité à 0 par
  // défaut : applyPaint() la relève uniquement pour les variables EEPATHO concernées.
  if(!map.getLayer("communes-fill-nodata"))
    map.addLayer({ id:"communes-fill-nodata", type:"fill", source:"communes",
      paint:{ "fill-pattern":NODATA_HACHURE, "fill-opacity":0,
        "fill-opacity-transition":{duration:200} } });
  // bordures blanches masquées en vue nationale (inutiles et coûteuses à dessiner sur
  // ~35 000 communes) puis révélées progressivement au zoom.
  if(!map.getLayer("communes-line"))
    map.addLayer({ id:"communes-line", type:"line", source:"communes",
      paint:{ "line-color":"#ffffff",
        "line-width":["interpolate",["linear"],["zoom"], 6,0, 8,0.15, 12,0.5] } });
  if(!map.getLayer("communes-hover"))
    map.addLayer({ id:"communes-hover", type:"line", source:"communes",
      paint:{ "line-color":"#1f6feb", "line-opacity":0.95,
        "line-width":["case",["boolean",["feature-state","hover"],false],2.4,0],
        "line-width-transition":{duration:120} } });
  // si une comparaison est active, on ré-injecte la surbrillance colorée des deux régions
  if(REGIONS_COMPAREES && REGIONS_COMPAREES.length===2)
    surlignerComparaison(REGIONS_COMPAREES[0], REGIONS_COMPAREES[1]);
  // le changement de fond détruit toutes les couches : on remet les cercles s'ils
  // étaient affichés (no-op tant que la donnée n'a jamais été chargée)
  if(CERCLES_DATA) ajouterCouchesCercles();
  if(CHALEUR_DATA) ajouterCoucheChaleur();
}

// Fonds raster (tuiles image) construits en style MapLibre inline — pour OSM et Satellite,
// qui ne sont pas des styles GL JSON. Aucune clé requise. (Tuiles externes, comme les
// fonds Carto/OpenFreeMap déjà utilisés par l'application.)
const RASTER_STYLES = {
  osm: { version:8,
    sources:{ osm:{ type:"raster",
      tiles:["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
             "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
             "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize:256, maxzoom:19, attribution:"© OpenStreetMap" } },
    layers:[{ id:"osm", type:"raster", source:"osm" }] },
  satellite: { version:8,
    sources:{ sat:{ type:"raster",
      tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize:256, maxzoom:19, attribution:"© Esri, Maxar, Earthstar Geographics" } },
    layers:[{ id:"sat", type:"raster", source:"sat" }] }
};

// sélecteur de fond de carte (protégé : ne plante pas si le menu n'existe pas)
function initFond(){
  const sel=document.getElementById("sel-fond");
  if(!sel) return;
  // Jeton de séquence : chaque changement de fond reçoit un numéro. On NE bloque JAMAIS les
  // changements suivants (l'ancien verrou pouvait rester coincé si l'événement "idle" ne se
  // déclenchait pas -> le fond restait figé). On ignore simplement la ré-injection périmée.
  let styleSeq=0;
  sel.onchange=(e)=>{
    const v=e.target.value;
    const style = RASTER_STYLES[v] || v;      // clé raster connue -> style inline, sinon URL de style GL
    const monTour=++styleSeq;
    // diff:false => remplacement PROPRE du style. Évite les états incohérents/bugs quand on
    // passe d'un style vectoriel (Carto) à un fond raster (OSM/Satellite) ou inversement.
    map.setStyle(style, {diff:false});
    // Ré-injecte les couches "communes" une fois le nouveau style posé. On ré-essaie au
    // prochain "styledata" tant que le style n'est pas prêt (fiable, contrairement à "idle"
    // qui peut ne jamais se déclencher sur un fond raster -> les variables disparaissaient).
    const reinjecter=()=>{
      if(monTour!==styleSeq) return;          // un changement plus récent a pris la main
      try{
        ajouterCouchesCommunes();             // recrée source + couches communes (idempotent)
        dessiner();                           // recolore selon la variable/année en cours
      }catch(err){
        map.once("styledata", reinjecter);    // style pas encore prêt -> nouvelle tentative
      }
    };
    map.once("styledata", reinjecter);
  };
}

// =====================================================================
//  CERCLES PROPORTIONNELS — population 20 ans et plus (hommes / femmes)
// =====================================================================
//  Surface du cercle ∝ population 20+, couleur = part d'hommes (palette pariteHF).
//  C'est une carte à symboles proportionnels bivariée : elle superpose l'effectif
//  (taille) et la structure par sexe (couleur) sans masquer la variable choroplèthe.
//
//  Trois précautions contre la saturation / le ralentissement :
//   1. Chargement PARESSEUX : le GeoJSON (~8 Mo) n'est téléchargé qu'au premier
//      affichage des cercles, jamais au démarrage.
//   2. Paliers de zoom : chaque commune porte un palier `t` (0 = les 500 plus
//      peuplées, 1 = les 3 000 suivantes, 2 = le reste), calculé une fois pour
//      toutes sur la population MAXIMALE toutes années — le palier ne bouge donc
//      pas quand on change d'année. Une couche par palier, avec son `minzoom` :
//      en vue France on dessine 500 cercles, pas 34 810.
//   3. Rendu GPU pur : couches `circle` pilotées par des expressions MapLibre.
//      Aucun recalcul JS au zoom/pan, aucune géométrie régénérée au changement
//      d'année (on ne fait que pointer une autre propriété).
// ---------------------------------------------------------------------
const CERCLES_URL = `${DATA_DIR}/CERCLES_20P.geojson`;
const CERCLES_SRC = "cercles15p";
const CERCLES_PALIERS = [
  { id:"cercles15p-t0", t:0, minzoom:4   },   // grandes villes : visibles dès la vue France
  { id:"cercles15p-t1", t:1, minzoom:6.6 },   // villes moyennes : à l'échelle régionale
  { id:"cercles15p-t2", t:2, minzoom:8.4 }    // reste du semis : à l'échelle locale
];
let CERCLES_DATA=null, CERCLES_ANNEES=[], CERCLES_ON=false, CERCLES_CHARGEMENT=null;
// Classes de parité affichées (mêmes 5 classes que la choroplèthe PART_H_20P).
// Décocher une classe RETIRE les cercles du filtre de la couche : le symbole
// disparaît vraiment, liseré compris — le rendre transparent laisserait un anneau
// blanc fantôme sur la carte.
let CERCLES_ACTIVE=new Set([0,1,2,3,4]);

// Année la plus proche disponible dans les cercles (2017-2022) : la variable
// affichée peut porter un millésime que le recensement ne couvre pas (ex. 2024).
function anneeCercles(a){
  if(!CERCLES_ANNEES.length) return null;
  if(CERCLES_ANNEES.includes(String(a))) return String(a);
  let best=CERCLES_ANNEES[0];
  for(const y of CERCLES_ANNEES)
    if(Math.abs(+y-+a) < Math.abs(+best-+a)) best=y;
  return best;
}

function chargerCercles(){
  if(CERCLES_CHARGEMENT) return CERCLES_CHARGEMENT;
  CERCLES_CHARGEMENT = fetch(CERCLES_URL)
    .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(j=>{
      CERCLES_DATA=j;
      CERCLES_ANNEES=(j.annees||[]).map(String);
      return j;
    })
    .catch(err=>{
      CERCLES_CHARGEMENT=null;            // laisse une nouvelle tentative possible
      throw err;
    });
  return CERCLES_CHARGEMENT;
}

// Rayon = k·√(population) : c'est la SURFACE du disque qui est proportionnelle à
// l'effectif, sinon les grandes villes écrasent tout. k croît avec le zoom ;
// borné en haut (villes) et en bas (lisibilité des petites communes).
// [zoom, k, rayon plafond] — source unique, partagée par la carte ET la légende
// pour que les deux ne puissent pas diverger.
const RAYON_STOPS = [[5,0.024,30],[8,0.045,40],[11,0.080,52],[13,0.120,62]];

function exprRayon(cle){
  const racine = ["sqrt", ["max", ["coalesce", ["get", cle], 0], 1]];
  const palier = (k, plafond) => ["max", 1.1, ["min", plafond, ["*", k, racine]]];
  // Le zoom doit rester l'entrée d'un interpolate de premier niveau (contrainte
  // MapLibre) : le min/max est donc placé DANS chaque arrêt, pas autour.
  const e=["interpolate", ["linear"], ["zoom"]];
  RAYON_STOPS.forEach(([z,k,plafond])=>{ e.push(z, palier(k,plafond)); });
  return e;
}

// Équivalent JS de exprRayon, pour dessiner une légende à la bonne échelle.
// Reproduit la sémantique de `interpolate` : MapLibre interpole les SORTIES déjà
// évaluées à chaque arrêt — pas le coefficient k.
function rayonPour(pop, zoom){
  const sortie=([,k,plafond])=>Math.max(1.1, Math.min(plafond, k*Math.sqrt(Math.max(pop,1))));
  const S=RAYON_STOPS;
  if(zoom<=S[0][0]) return sortie(S[0]);
  if(zoom>=S.at(-1)[0]) return sortie(S.at(-1));
  for(let i=0;i<S.length-1;i++){
    const [z0]=S[i], [z1]=S[i+1];
    if(zoom>=z0 && zoom<=z1){
      const t=(zoom-z0)/(z1-z0);
      return sortie(S[i]) + t*(sortie(S[i+1])-sortie(S[i]));
    }
  }
  return sortie(S.at(-1));
}

// Couleur = part d'hommes, seuils identiques à la choroplèthe PART_H_20P pour que
// les deux représentations racontent exactement la même chose.
function exprCouleurCercle(cle){
  const p=RAMPS.pariteHF, b=CONFIG.PART_H_20P.fixedBreaks;
  return ["step", ["coalesce", ["get", cle], 50],
    p[0], b[0], p[1], b[1], p[2], b[2], p[3], b[3], p[4]];
}

// Numéro de classe (0..4) d'un cercle — mêmes bornes que la couleur, sinon la
// case à cocher masquerait une classe différente de celle affichée en pastille.
function exprClasseCercle(cle){
  const b=CONFIG.PART_H_20P.fixedBreaks;
  const e=["step", ["coalesce", ["get", cle], 50], 0];
  b.forEach((s,i)=>{ e.push(s, i+1); });
  return e;
}

// Périmètre région/département, appliqué AUX CERCLES aussi.
// Sans ça, filtrer sur un département laissait les 34 810 cercles de France entière
// dessinés par-dessus — et la légende, qui utilise scopeSet(), annonçait pourtant le
// bon nombre. On repart donc de scopeSet() : une seule définition du périmètre pour
// la carte et la légende, elles ne peuvent plus se contredire.
// Les 2 premiers caractères du code INSEE = département (2A/2B et 97x compris),
// exactement la convention déjà utilisée pour la couche des communes.
function exprPerimetreCercles(){
  const scope=scopeSet();
  if(!scope) return null;                       // France entière : aucun filtre
  return ["in", ["slice", ["get","c"], 0, 2], ["literal", [...scope]]];
}

// Filtre d'un palier : le bon palier de zoom, une donnée pour l'année courante,
// une classe de parité cochée dans la légende, et le périmètre affiché.
function filtreCercles(t, cleP, cleS){
  const f=["all",
    ["==", ["get","t"], t],
    ["has", cleP],
    ["in", exprClasseCercle(cleS), ["literal", [...CERCLES_ACTIVE]]]];
  const perimetre=exprPerimetreCercles();
  if(perimetre) f.push(perimetre);
  return f;
}

function ajouterCouchesCercles(){
  if(!CERCLES_DATA) return;
  if(!map.getSource(CERCLES_SRC))
    map.addSource(CERCLES_SRC, { type:"geojson", data:CERCLES_DATA });
  const a=anneeCercles(document.getElementById("sel-year").value) || CERCLES_ANNEES.at(-1);
  const cleP="p"+a.slice(2), cleS="s"+a.slice(2);
  CERCLES_PALIERS.forEach(({id,t,minzoom})=>{
    if(map.getLayer(id)) return;
    map.addLayer({
      id, type:"circle", source:CERCLES_SRC, minzoom,
      filter:filtreCercles(t, cleP, cleS),
      paint:{
        "circle-radius": exprRayon(cleP),
        "circle-color": exprCouleurCercle(cleS),
        // opaques : ce sont eux le sujet quand ils sont allumés. Un liseré blanc
        // franc détache chaque cercle de son voisin et du fond, sans quoi les
        // amas urbains fusionnent en une tache unique.
        "circle-opacity": 0.92,
        "circle-stroke-color":"#ffffff",
        "circle-stroke-width":["interpolate",["linear"],["zoom"], 5,0.6, 9,1.1, 13,1.6],
        "circle-stroke-opacity":0.95,
        "circle-radius-transition":{duration:250}
      }
    });
  });
  majVisibiliteCercles();
}

// Opacité de la choroplèthe (variable en cours) sous les couches superposées.
// Priorité à la carte de chaleur : quand elle est active, AUCUNE variable ne doit
// rester visible en dessous (0 — masquée, pas juste estompée) ; sinon, les cercles
// ramènent la choroplèthe en toile de fond (0,14) ; sinon, opacité normale (0,85).
function opaciteFondActuelle(){ return CHALEUR_ON ? 0 : CERCLES_ON ? 0.14 : 0.85; }

function majOpaciteFond(){
  const opFill = opaciteFondActuelle();
  const opLine = CHALEUR_ON ? 0 : CERCLES_ON ? 0.18 : 1;
  if(map.getLayer("communes-fill")) map.setPaintProperty("communes-fill","fill-opacity", opFill);
  if(map.getLayer("communes-line")) map.setPaintProperty("communes-line","line-opacity", opLine);
  majOpaciteHachureNoData(opFill);
}

// La couche de hachures "pas de données" suit la même règle d'estompage que le reste
// du fond (masquée avec la carte de chaleur, réduite avec les cercles) : appelée à la
// fois par majOpaciteFond() (bascule cercles/chaleur, sans redessiner) et par
// applyPaint() (changement de variable/année/classe, où CLASSES vient d'être recalculé).
function majOpaciteHachureNoData(opFill){
  if(!map.getLayer("communes-fill-nodata")) return;
  const actif = CLASSES && CLASSES.type==="num" && CLASSES.noData && CLASSES.active.has("N");
  map.setPaintProperty("communes-fill-nodata","fill-opacity",
    ["case", ["==",["feature-state","val"],null], actif?opFill:0, 0]);
}

function majVisibiliteCercles(){
  CERCLES_PALIERS.forEach(({id})=>{
    if(map.getLayer(id))
      map.setLayoutProperty(id,"visibility", CERCLES_ON ? "visible" : "none");
  });
  majOpaciteFond();
}

// Repointe les couches sur l'année choisie, sans retoucher à la source ni à la
// géométrie : seules deux expressions de peinture changent -> instantané.
function majAnneeCercles(){
  if(!CERCLES_DATA || !map.getLayer(CERCLES_PALIERS[0].id)) return;
  const a=anneeCercles(document.getElementById("sel-year").value);
  if(!a) return;
  const cleP="p"+a.slice(2), cleS="s"+a.slice(2);
  CERCLES_PALIERS.forEach(({id,t})=>{
    if(!map.getLayer(id)) return;
    map.setFilter(id, filtreCercles(t, cleP, cleS));
    map.setPaintProperty(id,"circle-radius", exprRayon(cleP));
    map.setPaintProperty(id,"circle-color", exprCouleurCercle(cleS));
  });
  legendeCercles(a);
}

// Décochage d'une classe dans la légende : on ne retouche que le filtre.
function toggleCercleClasse(i){
  if(CERCLES_ACTIVE.has(i)) CERCLES_ACTIVE.delete(i); else CERCLES_ACTIVE.add(i);
  const a=anneeCercles(document.getElementById("sel-year").value);
  if(a){
    const cleP="p"+a.slice(2), cleS="s"+a.slice(2);
    CERCLES_PALIERS.forEach(({id,t})=>{
      if(map.getLayer(id)) map.setFilter(id, filtreCercles(t, cleP, cleS));
    });
  }
  legendeCercles();
}

// Comptage par classe sur le périmètre affiché (région/département), pour que la
// légende des cercles réagisse aux filtres comme celle de la variable.
//
// Mis en cache : le balayage des 34 810 cercles coûte ~11 ms, soit les deux tiers
// d'une image à 60 Hz. Or le résultat ne dépend QUE de l'année et du périmètre —
// pas du zoom. Sans cache, chaque zoomend le recalculait pour rien et hachait le
// geste. La clé couvre exactement ce dont dépend scopeSet().
let _cacheComptages={cle:null, val:null};
function comptagesCercles(a){
  const cle=[a,
    document.getElementById("sel-region").value,
    document.getElementById("sel-dept").value,
    (REGIONS_COMPAREES||[]).join("~")].join("|");
  if(_cacheComptages.cle===cle) return _cacheComptages.val;

  const cleP="p"+a.slice(2), cleS="s"+a.slice(2);
  const b=CONFIG.PART_H_20P.fixedBreaks, scope=scopeSet();
  const counts=[0,0,0,0,0], pops=[0,0,0,0,0];
  for(const f of CERCLES_DATA.features){
    const pr=f.properties, p=pr[cleP];
    if(p==null) continue;
    if(scope && !scope.has(pr.c.slice(0,2))) continue;
    const i=classIndex(pr[cleS]==null ? 50 : pr[cleS], b);
    counts[i]++; pops[i]+=p;
  }
  _cacheComptages={cle, val:{counts, pops}};
  return _cacheComptages.val;
}

function legendeCercles(a){
  const box=document.getElementById("legend-cercles");
  if(!box) return;
  // CERCLES_DATA est requis : comptagesCercles() lit les features. La légende peut
  // être appelée par dessiner() avant que le fichier ne soit arrivé.
  if(!CERCLES_ON || !CERCLES_DATA){ box.innerHTML=""; box.style.display="none"; return; }
  box.style.display="block";
  const p=RAMPS.pariteHF, labs=CONFIG.PART_H_20P.classLabels;
  const annee=a || anneeCercles(document.getElementById("sel-year").value);
  const anneeVar=document.getElementById("sel-year").value;
  if(!annee){ box.innerHTML=""; box.style.display="none"; return; }

  // Lignes cochables — mêmes classes CSS que la légende de la variable, donc même
  // apparence et même geste. Pastille ronde (et non carrée) : elle doit désigner
  // un cercle de la carte, pas un aplat.
  const {counts, pops}=comptagesCercles(annee);
  const lignes=p.map((c,i)=>{
    const on=CERCLES_ACTIVE.has(i);
    return `<div class="legend-row${on?'':' off'}" onclick="toggleCercleClasse(${i})">
      <span class="lg-check">${on?'☑':'☐'}</span>
      <span class="swatch" style="background:${c};border-radius:50%"></span>
      <span class="lg-lab">${labs[i]}</span>
      <span class="lg-cnt">${counts[i].toLocaleString("fr-FR")} · ${fmtPop(pops[i])} hab</span>
    </div>`;
  }).join("");

  // Cercles emboîtés, aux rayons RÉELS du zoom courant : la légende suit donc la
  // carte quand on zoome, au lieu d'afficher une échelle décorative fausse.
  const z=map.getZoom();
  const reperes=[1e6,1e5,1e4,1e3].map(v=>({v, r:rayonPour(v,z)}))
                                 .filter((o,i,t)=>i===0 || o.r < t[i-1].r-1.4);  // évite les cercles confondus
  const rmax=reperes[0].r, W=rmax*2+58, H=rmax*2+8;
  const nid=reperes.map(({v,r})=>{
    const cy=H-4-r, lab=v>=1e6?(v/1e6)+" M":(v/1e3)+" k";
    return `<circle cx="${rmax+4}" cy="${cy}" r="${r}" fill="none" stroke="var(--muted)" stroke-width="1"/>
            <line x1="${rmax+4}" y1="${cy-r}" x2="${rmax*2+12}" y2="${cy-r}" stroke="var(--muted)" stroke-width=".6" stroke-dasharray="2 2"/>
            <text x="${rmax*2+15}" y="${cy-r+3.2}" font-size="9.5" fill="var(--muted)">${lab}</text>`;
  }).join("");

  box.innerHTML =
    `<div style="font-size:11px;font-weight:600;color:var(--ink-2);padding:0 5px 5px">
       Cercles — 20 ans et plus
     </div>
     <div style="font-size:10.5px;color:var(--muted);padding:0 5px 6px">
       Surface ∝ population 20+ · ${annee}${String(annee)!==String(anneeVar)?` <b>(millésime le plus proche de ${anneeVar})</b>`:""}
     </div>
     <div style="padding:0 5px 8px">
       <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-label="Échelle des cercles">${nid}</svg>
     </div>
     ${lignes}`;
}

async function basculerCercles(actif){
  CERCLES_ON=!!actif;
  const chk=document.getElementById("chk-cercles");
  if(CERCLES_ON && !CERCLES_DATA){
    show("Chargement des cercles 20+…");
    if(chk) chk.disabled=true;
    try{
      await chargerCercles();
    }catch(err){
      console.warn("Cercles 20+ indisponibles :", err);
      CERCLES_ON=false;
      if(chk) chk.checked=false;
      hide();
      if(chk) chk.disabled=false;
      signalerErreur("Les cercles « 20 ans et plus » n'ont pas pu être chargés (data/CERCLES_20P.geojson).");
      return;
    }
    if(chk) chk.disabled=false;
    hide();
  }
  ajouterCouchesCercles();
  majVisibiliteCercles();
  majAnneeCercles();
  legendeCercles();
}

function initCercles(){
  const chk=document.getElementById("chk-cercles");
  if(chk) chk.onchange=e=>basculerCercles(e.target.checked);

  // l'échelle des cercles dépend du zoom : la légende doit suivre. "zoomend" (et non
  // "zoom") pour ne rien recalculer pendant le geste.
  map.on("zoomend", ()=>{ if(CERCLES_ON) legendeCercles(); });

  // Infobulle dédiée aux cercles : elle donne le détail hommes / femmes, que la
  // popup choroplèthe (qui n'affiche que la variable courante) ne montre pas.
  const popup=new maplibregl.Popup({closeButton:false, closeOnClick:false, offset:8});
  const nb=n=>Math.round(n).toLocaleString("fr-FR");
  CERCLES_PALIERS.forEach(({id})=>{
    map.on("mousemove", id, e=>{
      const f=e.features[0]; if(!f) return;
      const a=anneeCercles(document.getElementById("sel-year").value); if(!a) return;
      const p=f.properties["p"+a.slice(2)], s=f.properties["s"+a.slice(2)];
      if(p==null) return;
      // cercle de la commune déjà ouverte dans la fiche : pas de popup redondante
      if(ficheOuvertePour(f.properties.c)){ popup.remove(); return; }
      const nom=(GEO_NOMS && GEO_NOMS[f.properties.c]) || f.properties.c;
      const h=Math.round(p*s/100), fem=p-h;
      map.getCanvas().style.cursor="pointer";
      popup.setLngLat(f.geometry.coordinates).setHTML(
        `<b>${nom}</b><br>
         <span style="color:#666">20 ans et plus · ${a}</span><br>
         Total : <b>${nb(p)}</b><br>
         Hommes : <b>${nb(h)}</b> (${s.toFixed(1)} %)<br>
         Femmes : <b>${nb(fem)}</b> (${(100-s).toFixed(1)} %)`
      ).addTo(map);
    });
    map.on("mouseleave", id, ()=>{ map.getCanvas().style.cursor=""; popup.remove(); });
  });
}

// ---------------------------------------------------------------------
//  CARTE DE CHALEUR — pathologies EEPATHO (nb_prev, nb_inc, et leurs totaux
//  par période)
//
//  Complément à la choroplèthe communale : un lissage spatial (noyau de
//  densité MapLibre natif, type "heatmap") pondéré par le nombre de cas,
//  sur des centroïdes communaux (même algorithme que les cercles 20+,
//  cf. generate_cercles_20p.py / generate_heat_geojson.py).
//
//  Disponible uniquement pour les 4 variables ci-dessous (CHALEUR_VARS) : la
//  case est désactivée pour toute autre variable, et se recharge/se coupe
//  automatiquement quand on change de variable (cf. syncChaleurVariable(),
//  appelée depuis chargerVariable()).
//
//  Les communes en secret statistique ("<10"/masquées) n'entrent PAS dans le
//  poids du noyau : leur injecter une valeur inventée fausserait le relief de
//  densité, exactement comme la choroplèthe les affiche à part plutôt que de
//  leur prêter un effectif. Le relief est donc une borne basse de la réalité,
//  pas une estimation complète — assumé et documenté dans la légende plutôt
//  que masqué. Le plafond de pondération ("cap") diffère par variable car
//  l'Incidence et les totaux par période n'ont pas la même échelle que la
//  Prévalence annuelle (cf. percentiles calculés lors de l'ajout, 2026-07-28).
//
//  Dégradé ("couleurs") propre à chaque variable plutôt qu'un unique dégradé
//  rose partagé : Prévalence et Incidence reprennent exactement les teintes de
//  leur ramp de choroplèthe (RAMPS.maroon / RAMPS.incidence, cf. plus haut) pour
//  que carte de chaleur et choroplèthe se lisent comme la même famille visuelle
//  une fois la variable choisie. Les 2 totaux par période partagent la même
//  famille de teinte que leur variable annuelle (même identité "prévalence" ou
//  "incidence") mais déplacée vers un ton plus soutenu (magenta/prune, sienne
//  brûlée) pour rester distinguable au premier coup d'œil de sa version
//  annuelle — 4 dégradés uniques au total (2026-07-28, sur demande explicite).
// ---------------------------------------------------------------------
const CHALEUR_VARS = {
  PREVALENCE: { fichier:"PREVALENCE_HEAT.geojson", label:"Prévalence", cap:500,
    couleurs:["rgba(255,240,243,0)","#ffb3c6","#ff4d6d","#d81159","#a4133c","#590212"] },
  INCIDENCE: { fichier:"INCIDENCE_HEAT.geojson", label:"Incidence", cap:150,
    couleurs:["rgba(255,247,224,0)","#ffd166","#f4954b","#d76a2f","#c0501e","#6b2708"] },
  PREVALENCE_PERIODES: { fichier:"PREVALENCE_PERIODES_HEAT.geojson", label:"Prévalence — total par période", cap:2000,
    couleurs:["rgba(255,235,246,0)","#ffb8e0","#f0529b","#b81f78","#7d1257","#3d0630"] },
  INCIDENCE_PERIODES: { fichier:"INCIDENCE_PERIODES_HEAT.geojson", label:"Incidence — total par période", cap:700,
    couleurs:["rgba(255,238,224,0)","#ffb066","#f2732e","#c8451a","#8c2a10","#431405"] },
};
const CHALEUR_SRC = "prevalence-heat";
const CHALEUR_LAYER = "prevalence-heatmap";
let CHALEUR_VAR=null;          // variable actuellement chargée dans CHALEUR_DATA (null si aucune)
let CHALEUR_CACHE = {};        // fichiers déjà chargés, par variable : {annees, features}
let CHALEUR_ENVOL = {};        // fetch en cours, par variable (évite les doublons de requête)
let CHALEUR_DATA=null, CHALEUR_ANNEES=[], CHALEUR_ON=false;

function chaleurEligible(v){ return !!CHALEUR_VARS[v]; }
function pondCap(){ return (CHALEUR_VARS[CHALEUR_VAR]||{}).cap || 500; }
function pondCouleurs(){
  return (CHALEUR_VARS[CHALEUR_VAR]||{}).couleurs ||
    ["rgba(255,240,243,0)","#ffb3c6","#ff4d6d","#d81159","#a4133c","#590212"];
}
function expressionCouleurChaleur(){
  const c=pondCouleurs();
  return ["interpolate",["linear"],["heatmap-density"], 0,c[0], 0.2,c[1], 0.4,c[2], 0.6,c[3], 0.8,c[4], 1,c[5]];
}

function anneeChaleur(a){
  if(!CHALEUR_ANNEES.length) return null;
  if(CHALEUR_ANNEES.includes(String(a))) return String(a);
  let best=CHALEUR_ANNEES[0];
  for(const y of CHALEUR_ANNEES) if(Math.abs(+y-+a) < Math.abs(+best-+a)) best=y;
  return best;
}

function chargerChaleur(v){
  if(CHALEUR_CACHE[v]){
    CHALEUR_DATA=CHALEUR_CACHE[v]; CHALEUR_ANNEES=(CHALEUR_DATA.annees||[]).map(String); CHALEUR_VAR=v;
    return Promise.resolve(CHALEUR_DATA);
  }
  if(!CHALEUR_ENVOL[v]){
    const url = `${DATA_DIR}/${CHALEUR_VARS[v].fichier}`;
    CHALEUR_ENVOL[v] = fetch(url)
      .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j=>{ CHALEUR_CACHE[v]=j; return j; })
      .catch(err=>{ delete CHALEUR_ENVOL[v]; throw err; });
  }
  return CHALEUR_ENVOL[v].then(j=>{
    CHALEUR_DATA=j; CHALEUR_ANNEES=(j.annees||[]).map(String); CHALEUR_VAR=v; return j;
  });
}

function ajouterCoucheChaleur(){
  if(!CHALEUR_DATA) return;
  if(map.getSource(CHALEUR_SRC)) map.getSource(CHALEUR_SRC).setData(CHALEUR_DATA);
  else map.addSource(CHALEUR_SRC, { type:"geojson", data:CHALEUR_DATA });
  if(!map.getLayer(CHALEUR_LAYER)){
    const a=anneeChaleur(document.getElementById("sel-year").value) || CHALEUR_ANNEES.at(-1);
    const cleY="y"+a;
    map.addLayer({
      id:CHALEUR_LAYER, type:"heatmap", source:CHALEUR_SRC,
      filter:["has", cleY],
      paint:{
        "heatmap-weight": ["interpolate",["linear"], ["min", ["get", cleY], pondCap()], 0,0, pondCap(),1],
        "heatmap-intensity": ["interpolate",["linear"],["zoom"], 4,0.7, 8,1.6, 12,2.6],
        "heatmap-radius": ["interpolate",["linear"],["zoom"], 4,10, 8,22, 12,38],
        "heatmap-opacity": 0.82,
        "heatmap-color": expressionCouleurChaleur()
      }
    }, "communes-line");   // sous les libellés/liserés, au-dessus de la choroplèthe
  } else {
    // le calque persiste d'une variable à l'autre (setData ci-dessus) : le
    // dégradé doit être réappliqué explicitement à chaque bascule de variable,
    // sinon la couleur de la variable précédente reste affichée.
    map.setPaintProperty(CHALEUR_LAYER,"heatmap-color", expressionCouleurChaleur());
  }
  majVisibiliteChaleur();
}

function majVisibiliteChaleur(){
  if(map.getLayer(CHALEUR_LAYER))
    map.setLayoutProperty(CHALEUR_LAYER,"visibility", CHALEUR_ON?"visible":"none");
  majOpaciteFond();
}

function majAnneeChaleur(){
  if(!CHALEUR_DATA || !map.getLayer(CHALEUR_LAYER)) return;
  const a=anneeChaleur(document.getElementById("sel-year").value);
  if(!a) return;
  const cleY="y"+a;
  map.setFilter(CHALEUR_LAYER, ["has", cleY]);
  map.setPaintProperty(CHALEUR_LAYER,"heatmap-weight",
    ["interpolate",["linear"], ["min", ["get", cleY], pondCap()], 0,0, pondCap(),1]);
  legendeChaleur(a);
}

function legendeChaleur(a){
  const box=document.getElementById("legend-chaleur");
  if(!box) return;
  if(!CHALEUR_ON || !CHALEUR_DATA){ box.innerHTML=""; box.style.display="none"; return; }
  box.style.display="block";
  const annee=a || anneeChaleur(document.getElementById("sel-year").value);
  const anneeVar=document.getElementById("sel-year").value;
  if(!annee){ box.innerHTML=""; box.style.display="none"; return; }
  const n=CHALEUR_DATA.features.filter(f=>f.properties["y"+annee]!=null).length;
  const label=(CHALEUR_VARS[CHALEUR_VAR]||{}).label||"";
  const grad=pondCouleurs().join(", ");
  box.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:var(--ink-2);padding:0 5px 5px">
      Carte de chaleur — ${label} ${annee}${String(annee)!==String(anneeVar)?` <b>(millésime le plus proche de ${anneeVar})</b>`:""}
    </div>
    <div style="padding:0 5px 6px">
      <div style="height:10px;border-radius:5px;background:linear-gradient(to right, ${grad})"></div>
      <div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--muted);padding-top:3px">
        <span>Faible densité</span><span>Forte densité</span>
      </div>
    </div>
    <div style="font-size:10.5px;color:var(--muted);padding:0 5px 6px">
      ${n.toLocaleString("fr-FR")} communes à effectif connu pondèrent le relief.
      Communes en secret statistique (&lt; 10 cas) exclues du calcul, non estimées.
    </div>`;
}

async function basculerChaleur(actif){
  CHALEUR_ON=!!actif;
  const chk=document.getElementById("chk-heat-prev");
  const v=document.getElementById("sel-var").value;
  if(CHALEUR_ON && chaleurEligible(v) && (CHALEUR_VAR!==v || !CHALEUR_DATA)){
    show("Chargement de la carte de chaleur…");
    if(chk) chk.disabled=true;
    try{ await chargerChaleur(v); }
    catch(err){
      console.warn("Carte de chaleur indisponible :", err);
      CHALEUR_ON=false; if(chk){ chk.checked=false; chk.disabled=false; }
      hide();
      signalerErreur(`La carte de chaleur n'a pas pu être chargée (data/${(CHALEUR_VARS[v]||{}).fichier||v}).`);
      return;
    }
    if(chk) chk.disabled=false;
    hide();
  }
  ajouterCoucheChaleur();
  majVisibiliteChaleur();
  majAnneeChaleur();
  legendeChaleur();
}

// Bascule/désactive automatiquement la carte de chaleur au changement de
// variable (appelée depuis chargerVariable()) : recharge le bon fichier si
// elle est active et qu'on change entre 2 variables éligibles, l'éteint et
// grise la case si la nouvelle variable n'a pas de carte de chaleur.
async function syncChaleurVariable(v){
  const chk=document.getElementById("chk-heat-prev");
  if(!chaleurEligible(v)){
    if(CHALEUR_ON){ CHALEUR_ON=false; if(chk) chk.checked=false; majVisibiliteChaleur(); legendeChaleur(); }
    if(chk) chk.disabled=true;
    return;
  }
  if(chk) chk.disabled=false;
  if(CHALEUR_ON && CHALEUR_VAR!==v){
    try{ await chargerChaleur(v); }
    catch(err){
      console.warn("Carte de chaleur indisponible :", err);
      CHALEUR_ON=false; if(chk) chk.checked=false;
      majVisibiliteChaleur(); legendeChaleur();
      return;
    }
    ajouterCoucheChaleur();
    majVisibiliteChaleur();
  }
}

function initChaleur(){
  const chk=document.getElementById("chk-heat-prev");
  if(chk) chk.onchange=e=>basculerChaleur(e.target.checked);
  map.on("zoomend", ()=>{ if(CHALEUR_ON) legendeChaleur(); });
}

// Table code -> nom, construite une fois depuis le GeoJSON communal déjà chargé :
// évite d'embarquer les noms (et ~700 Ko) dans le fichier des cercles.
let GEO_NOMS=null;
function construireNoms(){
  if(GEO_NOMS || !GEO) return;
  GEO_NOMS={};
  for(const f of GEO.features)
    GEO_NOMS[f.properties[CLE]] = f.properties.NOM || f.properties.NOM_COM || f.properties[CLE];
}

// ============ MENU VARIABLES groupé par thème ============
const GROUPES = [
  // Population en tête : la Pathologie (données sensibles) ne doit pas être le
  // groupe ni la variable affichés par défaut à l'ouverture de l'atlas.
  ["Population",          ["POPULATION","DENSITE","TYPE_COMMUNE",
                          "POP_20P","POP_20P_H","POP_20P_F","PART_H_20P"]],
  // Observation brute d'un côté, résultats d'analyse de l'autre : mélanger les deux
  // laissait croire que « clusters Gi* » ou « taux lissé » étaient des mesures livrées
  // par la base au même titre que nb_prev, alors que ce sont des sorties de modèles
  // calculées par le protocole spatial (cf. schéma Moran → LISA/Gi* → lissage → SAR/CAR).
  ["Pathologie du foie (EEPATHO)", ["PREVALENCE","INCIDENCE","PREVALENCE_PERIODES","INCIDENCE_PERIODES"]],
  ["Étiologie (EEPATHO)", ["ETIO_VIRALE","ETIO_ALCOOLIQUE","ETIO_METABOLIQUE",
                          "ETIO_AUTO_IMMUNE","ETIO_VASCULAIRE","ETIO_INCONNUE",
                          "ETIO_MIXTE_ALCOOLIQUE","ETIO_MIXTE_METABOLIQUE","ETIO_MIXTE_AUTRE"]],
  ["Contexte social",    ["REV_MEDIAN","FDEP","FDEP_QUINTILE","NB_IMMIGRES","PART_IMMIGRES"]],
  ["Accès aux soins",    ["APL_GENERALISTES",
                          "DIST_PRESCRIPTEUR","DUREE_PRESCRIPTEUR","PRESCRIPTEURS",
                          "DIST_PRESC_ETAB","DUREE_PRESC_ETAB",
                          "DIST_COMMUNE_ETAB","DUREE_COMMUNE_ETAB"]],
  ["Eau potable",        ["NITRATES_MOY","NITRATES_MAX","ARSENIC_MOY","ARSENIC_MAX",
                          "PESTICIDES_MOY","PESTICIDES_MAX","CVM"]],
  ["Pollution de l'air", ["PM25","PM10","NO2","O3"]],
  ["Typologies",         ["GEOCLASH","GRILLE_DENSITE"]],
  ["Radon",              ["RADON"]]
];

function remplirMenuVariables(cibleId){
  const EXCLURE=new Set(["POP_TOTALE","DIST_CHU_CLCC"]);
  const selVar=document.getElementById(cibleId||"sel-var");
  selVar.innerHTML="";
  const places=new Set(EXCLURE);
  GROUPES.forEach(([titre,vars])=>{
    const dispo=vars.filter(v=>INDEX[v]);
    if(!dispo.length) return;
    const og=document.createElement("optgroup"); og.label=titre;
    dispo.forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=LIBELLES[v]||v; og.appendChild(o); places.add(v); });
    selVar.appendChild(og);
  });
  const restes=Object.keys(INDEX).filter(v=>!places.has(v)).sort();
  if(restes.length){
    const og=document.createElement("optgroup"); og.label="Autres";
    restes.forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=LIBELLES[v]||v; og.appendChild(o); });
    selVar.appendChild(og);
  }
}

// NOTE — le préchargement en bloc des 56 variables (137 Mo) a été RETIRÉ : c'était
// la cause des fermetures intempestives de l'onglet (cf. le bloc « ACCÈS AUX
// DONNÉES » en tête de fichier). Tout passe désormais par assurerVariable(), qui
// charge à la demande et borne le cache. Les consommateurs historiques de ALL_DATA
// (assistant, comparaison de régions, profil territorial, corrélations) attendent
// explicitement les variables dont ils ont besoin.

// Comble Paris/Lyon/Marseille à partir de leurs arrondissements (toutes variables)
const PLM_ARR = {
  "75056": Array.from({length:20},(_,i)=>String(75101+i)),
  "13055": Array.from({length:16},(_,i)=>String(13201+i)),
  "69123": Array.from({length:9 },(_,i)=>String(69381+i))
};
function patchPLM(data, estCategoriel){
  for(const annee in data){
    const o=data[annee];
    for(const ville in PLM_ARR){
      if(o[ville]!=null) continue;
      const vals=PLM_ARR[ville].map(c=>o[c]).filter(v=>v!=null);
      if(!vals.length) continue;
      if(estCategoriel){
        const cnt={}; vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);
        o[ville]=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0];
      }else{
        const nums=vals.map(Number).filter(x=>!isNaN(x));
        if(nums.length) o[ville]=Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*1000)/1000;
      }
    }
  }
  return data;
}

// Sélecteur de variable : on mémorise le dernier choix VALIDE pour pouvoir y
// revenir si le nouveau échoue — sinon le menu affichait une variable que la
// carte ne montrait pas.
let VAR_COURANTE = null;

async function chargerVariable(v){
  const selVar = document.getElementById("sel-var");
  if(!INDEX[v]){
    console.warn("Variable inconnue de l'index :", v);
    return;
  }
  const dejaEnCache = !!ALL_DATA[v];
  if(!dejaEnCache) show("Chargement des données…");
  if(selVar) selVar.disabled = true;
  try{
    // assurerVariable() gère le cache borné, les appels concurrents, le 401
    // (session expirée) et applique patchPLM une seule fois.
    epinglerVariable(v);
    CURRENT = await assurerVariable(v);
    if(!CURRENT) throw new ErreurDonnees(`données vides pour ${v}`, 0);
    VAR_COURANTE = v;
  }catch(err){
    if(err && err.statut===401) return;          // sessionExpiree() a déjà pris la main
    console.error("Chargement de la variable impossible :", v, err);
    hide();
    if(selVar){
      selVar.disabled = false;
      if(VAR_COURANTE) selVar.value = VAR_COURANTE;   // le menu ne ment plus sur ce qui est affiché
    }
    signalerErreur(`Impossible de charger « ${LIBELLES[v]||v} ». `
      + (VAR_COURANTE ? "La variable précédente reste affichée." : "Vérifiez que le serveur est bien démarré."));
    return;
  }
  if(selVar) selVar.disabled = false;
  const selYear = document.getElementById("sel-year");
  selYear.innerHTML="";
  INDEX[v].annees.forEach(a=>{ const o=document.createElement("option"); o.value=a; o.textContent=a; selYear.appendChild(o); });
  selYear.value = INDEX[v].annees[INDEX[v].annees.length-1];
  try{ await syncChaleurVariable(v); }catch(e){ console.warn("Carte de chaleur :", e); }
  hide();
  dessiner();
}

// Bandeau d'erreur non bloquant (remplace les alert() qui interrompaient le travail).
// Disparaît seul ; empilé au même endroit que le voile de chargement.
let _timerErreur=null;
function signalerErreur(texte){
  let el=document.getElementById("app-erreur");
  if(!el){
    el=document.createElement("div");
    el.id="app-erreur";
    el.style.cssText=
      "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;"+
      "max-width:min(560px,92vw);background:#7f1d1d;color:#fff;padding:11px 16px;"+
      "border-radius:12px;font:500 13px/1.5 'IBM Plex Sans',system-ui,sans-serif;"+
      "box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer";
    el.title="Cliquer pour fermer";
    el.onclick=()=>el.remove();
    document.body.appendChild(el);
  }
  el.textContent=texte;
  clearTimeout(_timerErreur);
  _timerErreur=setTimeout(()=>{ if(el) el.remove(); }, 9000);
}

// ============ CLASSIFICATION ============
function quantiles(arr, qs){
  const s=[...arr].sort((a,b)=>a-b), out=[];
  qs.forEach(q=>{ const i=(s.length-1)*q, lo=Math.floor(i), hi=Math.ceil(i);
    out.push(lo===hi? s[lo] : s[lo]+(s[hi]-s[lo])*(i-lo)); });
  return out;
}
function equalBreaks(arr,k){
  const mn=Math.min(...arr), mx=Math.max(...arr), out=[];
  for(let i=1;i<k;i++) out.push(mn+(mx-mn)*i/k);
  return out;
}
function jenksBreaks(arr,k){
  let d=[...arr];
  if(d.length>1200){ const step=d.length/1200; const s=[]; for(let i=0;i<d.length;i+=step) s.push(d[Math.floor(i)]); d=s; }
  d.sort((a,b)=>a-b);
  const n=d.length;
  const mat1=Array.from({length:n+1},()=>new Array(k+1).fill(0));
  const mat2=Array.from({length:n+1},()=>new Array(k+1).fill(Infinity));
  for(let i=1;i<=k;i++){ mat1[1][i]=1; mat2[1][i]=0; }
  for(let l=2;l<=n;l++){
    let s1=0,s2=0,w=0;
    for(let m=1;m<=l;m++){
      const i3=l-m+1, val=d[i3-1];
      s2+=val*val; s1+=val; w++;
      const variance=s2-(s1*s1)/w;
      const i4=i3-1;
      if(i4!==0){ for(let j=2;j<=k;j++){
        if(mat2[l][j]>=variance+mat2[i4][j-1]){ mat1[l][j]=i3; mat2[l][j]=variance+mat2[i4][j-1]; } } }
    }
    mat1[l][1]=1; mat2[l][1]=s2-(s1*s1)/w;
  }
  const kb=new Array(k+1); kb[k]=d[n-1]; kb[0]=d[0];
  let kk=n;
  for(let j=k;j>=2;j--){ const id=mat1[kk][j]-1; kb[j-1]=d[id]; kk=mat1[kk][j]-1; }
  return kb.slice(1,k);
}
function getBreaks(arr, method, k=5){
  const clean = arr.filter(x=>typeof x==="number" && isFinite(x));
  if(!clean.length) return [];
  let b;
  if(method==="equal") b=equalBreaks(clean,k);
  else if(method==="jenks") b=jenksBreaks(clean,k);
  else b=quantiles(clean,[0.2,0.4,0.6,0.8]);
  // ne garder que des nombres finis, sans doublon, strictement croissants
  b = b.filter(x=>typeof x==="number" && isFinite(x));
  b = [...new Set(b)].sort((x,y)=>x-y);
  return b;
}

// ============ DESSIN ============
let CLASSES = null;   // état de la classification courante (pour légende interactive)

// Codes déjà porteurs d'un feature-state "val" lors du dernier dessin : sert à
// nettoyer précisément ceux qui disparaissent d'une variable à l'autre (cf. dessiner()).
// NB : map.removeFeatureState({source:"communes"}, "val") — sans id — est rejeté par
// MapLibre ("A feature id is required to remove its specific state property") et ne
// nettoie donc jamais rien : sans ce suivi, une commune absente de la variable courante
// (ex. la Corse, exclue de Prévalence/Incidence/Étiologies) garde la valeur — et donc la
// couleur — de la dernière variable qui l'avait renseignée.
let PREV_VAL_CODES = new Set();

// ---- Population par commune (population concernée en légende) ----
let POP_DATA=null;   // {annee:{code:pop}} — chargé une fois, en arrière-plan (non bloquant)
// `r.ok` vérifié avant .json() : sur une session expirée le serveur renvoie une page
// d'erreur, dont le parsing JSON levait une exception au lieu du simple avertissement
// attendu. La légende doit pouvoir se passer de la population, pas casser.
fetch("data/POPULATION.json").then(r=>{
  if(!r.ok) throw new Error("HTTP "+r.status);
  return r.json();
}).then(j=>{
  POP_DATA=j;
  try{ if(CLASSES) dessiner(); }catch(e){}   // rafraîchit la légende une fois la pop arrivée
}).catch(e=>console.warn("Population indisponible pour la légende:", e.message));
function popPourAnnee(a){
  if(!POP_DATA) return {annee:null, vals:null};
  if(POP_DATA[a]) return {annee:a, vals:POP_DATA[a]};
  // année absente (ex: 2014, 2024) -> année de population la plus proche disponible
  let best=null;
  for(const y of Object.keys(POP_DATA)){
    if(best===null || Math.abs(+y-+a)<Math.abs(+best-+a)) best=y;
  }
  return {annee:best, vals:POP_DATA[best]};
}
const fmtPop=n=> n>=1e6 ? (n/1e6).toLocaleString("fr-FR",{maximumFractionDigits:1})+" M"
              : n>=1e3 ? Math.round(n/1e3).toLocaleString("fr-FR")+" k"
              : Math.round(n).toLocaleString("fr-FR");
const TRANSP = "rgba(0,0,0,0)";

function classIndex(v, b){
  if(v < b[0]) return 0;
  if(b[1]!=null && v < b[1]) return 1;
  if(b[2]!=null && v < b[2]) return 2;
  if(b[3]!=null && v < b[3]) return 3;
  return 4;
}

// titre flottant sur la carte (mis à jour à chaque variable/année) — sans risque si absent du HTML
function majTitreCarte(v,a){
  const box=document.getElementById("map-title"); if(!box) return;
  const lib=LIBELLES[v]||v;
  const m=lib.match(/\(([^)]+)\)/);
  const unit=m?m[1]:"";
  const name=lib.replace(/\s*\([^)]*\)\s*/," ").trim();
  const en=document.getElementById("display-var");   if(en) en.textContent=name;
  const ey=document.getElementById("display-year");  if(ey) ey.textContent=a||"";
  const eu=document.getElementById("display-unit");  if(eu) eu.textContent=unit?("· "+unit):"";
  box.classList.add("visible");
}

function dessiner(){
  // CURRENT est null tant qu'aucune variable n'a pu être chargée (échec réseau au
  // démarrage, session expirée). dessiner() est appelée par plusieurs déclencheurs
  // indépendants — arrivée de POPULATION.json, changement de fond de carte, filtre
  // territorial — qui n'ont aucun moyen de le savoir : on sort proprement.
  if(!CURRENT) return;
  const v=document.getElementById("sel-var").value;
  const a=document.getElementById("sel-year").value;
  const method=document.getElementById("sel-class").value;
  const vals=CURRENT[a]||{};
  const cfg=CONFIG[v]||{type:"seq",ramp:"reds"};
  const scope=scopeSet();
  majTitreCarte(v,a);

  // clé "val" seulement : ne touche pas "valB" (variable de comparaison, cf. module
  // de comparaison en fin de fichier), qui vit dans le même feature-state.
  // (removeFeatureState en masse sur une clé précise sans id n'est pas supporté par
  // MapLibre : on nettoie donc explicitement les seuls codes qui portaient une valeur
  // au dessin précédent et n'en ont plus — cf. commentaire sur PREV_VAL_CODES.)
  const nouveauxCodes=new Set();
  for(const code in vals){ if(vals[code]==null) continue;
    map.setFeatureState({source:"communes", id:code}, {val:vals[code]}); nouveauxCodes.add(code); }
  for(const code of PREV_VAL_CODES){ if(!nouveauxCodes.has(code))
    map.setFeatureState({source:"communes", id:code}, {val:null}); }
  PREV_VAL_CODES=nouveauxCodes;

  if(cfg.type==="cat"){
    document.getElementById("sel-class").disabled=true;
    const present=new Set(Object.values(vals).filter(x=>x!=null).map(String));
    let cats = cfg.order ? cfg.order.filter(c=>present.has(c)) : [...present].sort();
    const pal = cfg.palette ? {...cfg.palette} : {...PALETTE_CAT};
    const base=["#1a9850","#fdbb84","#b30000","#2166ac","#762a83"];
    cats.forEach((c,i)=>{ if(!pal[c]) pal[c]=base[i%base.length]; });
    // comptage par catégorie (sur le périmètre affiché)
    const counts={}; cats.forEach(c=>counts[c]=0);
    const pop=popPourAnnee(a); const pops={}; cats.forEach(c=>pops[c]=0);
    for(const code in vals){ const val=vals[code]; if(val==null) continue;
      if(scope && !scope.has(code.slice(0,2))) continue;
      const k=String(val); if(k in counts){ counts[k]++;
        if(pop.vals) pops[k]+=pop.vals[code]||0; } }
    CLASSES={type:"cat", cats, pal, labels:cfg.labels, counts, pops, popAnnee:pop.annee, active:new Set(cats)};
  } else {
    const arr=Object.values(vals).filter(x=>typeof x==="number");
    // "div" retombe sur la palette divergente historique UNIQUEMENT si aucune palette
    // n'est déclarée (FDep déclare déjà ramp:"diverging" -> comportement inchangé).
    let ramp=RAMPS[cfg.ramp] || (cfg.type==="div" ? RAMPS.diverging : RAMPS.reds);
    let b;
    if(cfg.fixedBreaks){
      // seuils imposés par la variable : la classification choisie ne s'applique pas
      b=[...cfg.fixedBreaks];
      document.getElementById("sel-class").disabled=true;
    }else{
      document.getElementById("sel-class").disabled=false;
      b=getBreaks(arr, method, 5);
    }
    b=[...new Set(b)].sort((x,y)=>x-y);
    // comptage par classe (sur le périmètre affiché)
    const counts=[0,0,0,0,0];
    const pop=popPourAnnee(a); const pops=[0,0,0,0,0];
    // classe à part pour les valeurs masquées (secret statistique) : comptée
    // séparément, jamais mélangée aux classes numériques ni à leurs seuils.
    let maskedCount=0, maskedPop=0;
    for(const code in vals){ const val=vals[code];
      if(scope && !scope.has(code.slice(0,2))) continue;
      if(cfg.maskedValue!=null && val===cfg.maskedValue){
        maskedCount++; if(pop.vals) maskedPop+=pop.vals[code]||0; continue; }
      if(typeof val!=="number") continue;
      const ci=classIndex(val,b); counts[ci]++;
      if(pop.vals) pops[ci]+=pop.vals[code]||0; }
    // classe à part pour les communes SANS AUCUNE ligne dans la source (pas "secret
    // statistique" : simplement absentes de la table commune×année, ex. communes
    // fusionnées sans code résolu — cf. fiches méthodo Prévalence/Incidence). Comptée
    // sur l'univers complet des communes du fond de carte (GEO), pas sur les clés de
    // "vals" : c'est justement leur ABSENCE de "vals" qu'on veut détecter et afficher
    // à part, plutôt que la même teinte grise ambiguë qu'un vrai secret statistique.
    // Restreint aux variables EEPATHO (Prévalence/Incidence/Étiologies, seules à
    // déclarer maskedValue) — sur demande explicite : les autres variables (Population,
    // FDep, etc.) n'ont pas cette lecture "pas de cas" et gardent leur comportement
    // NODATA d'origine, non compté ni affiché à part dans la légende.
    let noDataCount=0, noDataPop=0;
    if(GEO && cfg.maskedValue!=null) for(const f of GEO.features){
      const code=f.properties[CLE];
      if(scope && !scope.has(String(code).slice(0,2))) continue;
      if(vals[code]!=null) continue;
      noDataCount++; if(pop.vals) noDataPop+=pop.vals[code]||0;
    }
    const active=new Set([0,1,2,3,4,"N"]);
    const masked = cfg.maskedValue!=null
      ? {value:cfg.maskedValue, count:maskedCount, pop:maskedPop,
         label:cfg.maskedLabel||"Secret statistique", color:cfg.maskedColor||"#9aa0a8"}
      : null;
    if(masked) active.add("M");
    // null (pas seulement count:0) sur les variables hors EEPATHO : applyPaint() s'en sert
    // pour décider d'activer ou non le motif hachuré sur la couche, pas seulement pour
    // savoir si la légende doit afficher la ligne.
    const noData = cfg.maskedValue!=null
      ? {count:noDataCount, pop:noDataPop,
         label:"Pas de données (commune non renseignée)", color:NODATA}
      : null;
    CLASSES={type:"num", breaks:b, ramp, counts, pops, popAnnee:pop.annee,
             classLabels:cfg.classLabels, active, masked, noData, fixed:!!cfg.fixedBreaks};
  }
  applyPaint();
  renderLegend();
  majCompteur();
  majAnneeCercles();      // suit le sélecteur d'année (no-op si les cercles sont éteints)
  majVisibiliteCercles(); // applyPaint/ré-injection peuvent avoir remis l'opacité à 0,85
  majAnneeChaleur();      // idem pour la carte de chaleur prévalence (no-op si éteinte)
  rafraichirFicheOuverte();  // la fiche déjà ouverte suit le changement d'année/variable
}

// applique la couleur en masquant les classes décochées
function applyPaint(){
  if(!CLASSES) return;
  if(CLASSES.type==="cat"){
    const m=["match",["feature-state","val"]];
    CLASSES.cats.forEach(c=> m.push(c, CLASSES.active.has(c)?CLASSES.pal[c]:TRANSP));
    m.push(NODATA);
    map.setPaintProperty("communes-fill","fill-color",m);
    majOpaciteHachureNoData(opaciteFondActuelle());   // pas de "pas de données" hors variables EEPATHO -> 0
  } else {
    const ramp=CLASSES.ramp, A=CLASSES.active, masked=CLASSES.masked;
    // bornes nettoyées : numériques, finies, strictement croissantes
    let b=(CLASSES.breaks||[]).filter(x=>typeof x==="number"&&isFinite(x));
    b=[...new Set(b)].sort((x,y)=>x-y);

    // valeurs masquées (secret statistique) : une branche "case" à part, évaluée
    // AVANT le "step" numérique -> la comparaison ["==",val,"M"] ne fait jamais
    // transiter une chaîne dans une expression "step" qui n'accepte que des nombres.
    // "Pas de données" (commune absente de la source, pas masquée) suit la même
    // logique de toggle que "Secret statistique" plutôt qu'une couleur imposée : sans
    // ça, décocher "Secret statistique" dans la légende laissait ces communes visibles
    // avec un gris presque identique, sans explication ni moyen de les masquer aussi.
    // Sur les variables EEPATHO, cette couleur sert de fond sous les hachures posées par
    // la couche "communes-fill-nodata" (cf. majOpaciteHachureNoData) plutôt que le seul
    // signal — le gris plat seul se confondait avec le "secret statistique" juste au-dessus
    // dans la légende.
    const caseHead=["case",["==",["feature-state","val"],null], A.has("N")?NODATA:TRANSP];
    if(masked) caseHead.push(["==",["feature-state","val"],masked.value], A.has("M")?masked.color:TRANSP);

    majOpaciteHachureNoData(opaciteFondActuelle());

    // si pas assez de bornes distinctes -> couleur unique (pas de "step")
    if(b.length<1){
      const col0 = A.has(0)?ramp[0]:TRANSP;
      map.setPaintProperty("communes-fill","fill-color", [...caseHead, col0]);
      return;
    }

    // step construit dynamiquement selon le nombre réel de bornes
    const expr=["step",["feature-state","val"], A.has(0)?ramp[0]:TRANSP];
    b.forEach((seuil,i)=>{ expr.push(seuil, A.has(i+1)?ramp[i+1]:TRANSP); });

    map.setPaintProperty("communes-fill","fill-color", [...caseHead, expr]);
  }
}

// clic sur une ligne de légende -> masque/affiche la classe
function toggleClasse(i){
  if(!CLASSES) return;
  if(CLASSES.active.has(i)) CLASSES.active.delete(i); else CLASSES.active.add(i);
  applyPaint(); renderLegend();
}
function toggleCat(c){
  if(!CLASSES) return;
  if(CLASSES.active.has(c)) CLASSES.active.delete(c); else CLASSES.active.add(c);
  applyPaint(); renderLegend();
}
function renderLegend(){
  if(!CLASSES) return;
  if(CLASSES.type==="cat") legendeCat();
  else legendeNum();
}

// ============ FILTRES region / departement ============
function remplirFiltres(){
  const r=document.getElementById("sel-region");
  r.innerHTML='<option value="">France entière</option>';
  Object.keys(REGIONS).sort().forEach(name=>{ const o=document.createElement("option"); o.value=name; o.textContent=name; r.appendChild(o); });
  r.onchange=()=>{ remplirDepts(); appliquerFiltre(); };
  remplirDepts();
  document.getElementById("sel-dept").onchange=appliquerFiltre;
}
function remplirDepts(){
  const region=document.getElementById("sel-region").value;
  const codes = region ? REGIONS[region] : Object.keys(DEPTS);
  const d=document.getElementById("sel-dept");
  d.innerHTML='<option value="">Tous</option>';
  codes.sort().forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=`${c} — ${DEPTS[c]||""}`; d.appendChild(o); });
}
function appliquerFiltre(){
  REGIONS_COMPAREES = [];
  effacerComparaison();   // retour à la normale : on retire la surbrillance colorée des régions
  const region=document.getElementById("sel-region").value;
  const dept=document.getElementById("sel-dept").value;
  const deptCode=["slice",["get",CLE],0,2];
  let filtre=null, scope=null;
  if(dept){ filtre=["==",deptCode,dept]; scope=new Set([dept]); }
  else if(region){ const L=REGIONS[region]; filtre=["in",deptCode,["literal",L]]; scope=new Set(L); }
  map.setFilter("communes-fill", filtre);
  map.setFilter("communes-line", filtre);
  if(map.getLayer("communes-fill-b")) map.setFilter("communes-fill-b", filtre);
  if(map.getLayer("communes-fill-nodata")) map.setFilter("communes-fill-nodata", filtre);
  zoomSur(scope);
  dessiner();   // recalcule légende (communes + population) sur le périmètre affiché
}

// Réinitialise le "calcul" : France entière, classification par défaut, comparaison annulée,
// lignes/fiche établissements effacées. N'utilise que des fonctions déjà existantes.
function reinitialiserAtlas(){
  REGIONS_COMPAREES = [];
  if(typeof effacerComparaison==="function") effacerComparaison();
  const banner=document.getElementById("cmp-banner"); if(banner) banner.remove();
  const rSel=document.getElementById("sel-region"), dSel=document.getElementById("sel-dept");
  if(rSel) rSel.value="";
  remplirDepts();
  if(dSel) dSel.value="";
  const cSel=document.getElementById("sel-class"); if(cSel) cSel.value="quantile";
  LAST_REGION=""; LAST_DEPT="";                       // mémoire de territoire du chatbot
  if(typeof window.__resetEtabs==="function") window.__resetEtabs();  // décoche + masque CHU/CLCC + lignes
  if(typeof window.__resetEtabsCancer==="function") window.__resetEtabsCancer();  // idem établissements cancer
  if(typeof window.__resetCompareVar==="function") window.__resetCompareVar();  // décoche + masque la variable B comparée
  else { const src=map.getSource("etabs-lignes"); if(src) src.setData({type:"FeatureCollection",features:[]}); }
  const card=document.getElementById("commune-card"); if(card) card.classList.remove("show");
  const chkC=document.getElementById("chk-cercles");  // cercles 20+ : décoche + masque
  CERCLES_ACTIVE=new Set([0,1,2,3,4]);                // et rétablit les 5 classes de parité
  if(chkC && chkC.checked){ chkC.checked=false; basculerCercles(false); }
  const chkH=document.getElementById("chk-heat-prev");  // carte de chaleur prévalence : décoche + masque
  if(chkH && chkH.checked){ chkH.checked=false; basculerChaleur(false); }
  appliquerFiltre();                                  // filtre nul -> France, recadre + redessine
  map.flyTo({center:[2.5,46.6], zoom:5.2, duration:700});
}
window.reinitialiserAtlas = reinitialiserAtlas;

function zoomSur(scope){
  if(!scope){ map.flyTo({center:[2.5,46.6],zoom:5.2}); return; }
  let minX=180,minY=90,maxX=-180,maxY=-90;
  const scan=(g)=>{ const c=g.coordinates;
    const eat=(a)=>{ if(typeof a[0]==="number"){ if(a[0]<minX)minX=a[0]; if(a[0]>maxX)maxX=a[0]; if(a[1]<minY)minY=a[1]; if(a[1]>maxY)maxY=a[1]; } else a.forEach(eat); };
    eat(c);
  };
  for(const f of GEO.features){ if(scope.has((f.properties[CLE]||"").slice(0,2))) scan(f.geometry); }
  if(minX<=maxX) map.fitBounds([[minX,minY],[maxX,maxY]],{padding:40,duration:800});
}

function majCompteur(){
  const a=document.getElementById("sel-year").value;
  const scope=scopeSet();
  const vals=(CURRENT && CURRENT[a])||{};   // appelée aussi hors dessiner() (mode comparaison)
  let n=0;
  for(const code in vals){ if(vals[code]==null) continue; if(scope && !scope.has(code.slice(0,2))) continue; n++; }
  document.getElementById("stat-count").textContent=n.toLocaleString("fr-FR");
  majDashboard();
}

// ============ TABLEAU DE BORD ============
function scopeSet(){

    // Mode comparaison

    if(
        REGIONS_COMPAREES &&
        REGIONS_COMPAREES.length === 2
    ){

        return new Set([
            ...REGIONS[REGIONS_COMPAREES[0]],
            ...REGIONS[REGIONS_COMPAREES[1]]
        ]);
    }

    const region =
        document.getElementById("sel-region").value;

    const dept =
        document.getElementById("sel-dept").value;

    if(dept)
        return new Set([dept]);

    if(region)
        return new Set(REGIONS[region]);

    return null;
}
function valsScope(obj, scope){
  const out=[];
  for(const code in obj){ const v=obj[code];
    if(v==null||typeof v!=="number") continue;
    if(scope && !scope.has(code.slice(0,2))) continue;
    out.push(v); }
  return out;
}
function statsOf(arr){
  if(!arr.length) return null;
  const s=[...arr].sort((a,b)=>a-b), n=s.length;
  const med=n%2? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2;
  const mean=arr.reduce((a,b)=>a+b,0)/n;
  const sd=Math.sqrt(arr.reduce((q,x)=>q+(x-mean)*(x-mean),0)/n);
  return {n, min:s[0], max:s[n-1], med, mean, sd};
}
const fmtD = x => Number(x).toLocaleString("fr-FR",{maximumFractionDigits:1});
function setYear(y){ document.getElementById("sel-year").value=y; dessiner(); }

function miniBar(years, vals, current){
  const valid=vals.filter(x=>x!=null);
  if(!valid.length) return "";
  const mx=Math.max(...valid), mn=Math.min(0, Math.min(...valid));
  const W=290,H=92,gap=W/years.length,bw=gap*0.6; let bars="";
  // les variables "par période" (ex. PREVALENCE_PERIODES) ont des millésimes du
  // type "2017-2020" : le slice(2) pensé pour des années à 4 chiffres tronquerait
  // ces libellés de façon illisible ("17-2020") — on les affiche donc tels quels.
  const parPeriode = years.some(y=>String(y).includes("-"));
  years.forEach((y,i)=>{
    const v=vals[i]; if(v==null) return;
    const h=(mx===mn)?2:((v-mn)/(mx-mn))*(H-26);
    const x=i*gap+(gap-bw)/2, yy=H-18-h, on=String(y)===String(current);
    const label=parPeriode?String(y):String(y).slice(2);
    bars+=`<rect x="${x}" y="${yy}" width="${bw}" height="${h}" rx="2" fill="${on?'#1f6feb':'#b9c4d4'}"
      style="cursor:pointer" onclick="setYear('${y}')"><title>${y} : ${fmtD(v)}</title></rect>
      <text x="${x+bw/2}" y="${H-5}" font-size="9" text-anchor="middle" fill="#6b7785">${label}</text>`;
  });
  return `<div class="dash-title">Évolution (médiane / ${parPeriode?"période":"an"})</div>
          <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${bars}</svg>`;
}

function majDashboard(){
  const dash=document.getElementById("dashboard"); if(!dash||!CURRENT) return;
  const v=document.getElementById("sel-var").value;
  const a=document.getElementById("sel-year").value;
  const scope=scopeSet();
  const cfg=CONFIG[v]||{};

  if(cfg.type==="cat"){
    const obj=CURRENT[a]||{}, counts={};
    for(const code in obj){ const val=obj[code]; if(val==null) continue;
      if(scope && !scope.has(code.slice(0,2))) continue; counts[val]=(counts[val]||0)+1; }
    const tot=Object.values(counts).reduce((x,y)=>x+y,0)||1;
    const order = cfg.order ? cfg.order.filter(k=>counts[k]!=null) : Object.keys(counts).sort((x,y)=>counts[y]-counts[x]);
    const rows=order.map(k=>{ const lab=(cfg.labels&&cfg.labels[k])||k;
      return `<div class="cat-row"><span>${lab}</span><span><b>${counts[k].toLocaleString("fr-FR")}</b><small>${(100*counts[k]/tot).toFixed(0)}%</small></span></div>`; }).join("");
    dash.innerHTML=`<div class="dash-title">Répartition (${a})</div>${rows||'<div class="dash-empty">Aucune donnée</div>'}`;
    majKPIcat(order, counts, cfg.labels, tot);
    majLegendMeta("cat", {n:tot});
    return;
  }

  const st=statsOf(valsScope(CURRENT[a]||{}, scope));
  if(!st){ dash.innerHTML='<div class="dash-empty">Aucune donnée</div>'; majKPI(null); majLegendMeta("num", null); return; }
  const annees=INDEX[v].annees;
  // stats de chaque année (une seule fois) : alimente à la fois la mini-frise du
  // tableau de bord (médiane) et les sparklines de la barre KPI (médiane/moyenne/min/max).
  const statsParAn = annees.length>=2 ? annees.map(y=>statsOf(valsScope(CURRENT[y]||{}, scope))) : null;
  majKPI(st);
  majLegendMeta("num", st);
  let html=`<div class="dash-grid">
    <div><div class="dv">${fmtD(st.med)}</div><div class="dl">médiane</div></div>
    <div><div class="dv">${fmtD(st.mean)}</div><div class="dl">moyenne</div></div>
    <div><div class="dv">${fmtD(st.min)}</div><div class="dl">minimum</div></div>
    <div><div class="dv">${fmtD(st.max)}</div><div class="dl">maximum</div></div>
  </div>
  <div class="dash-extra">${st.n.toLocaleString("fr-FR")} communes · écart-type ${fmtD(st.sd)}</div>`;
  if(statsParAn){
    const meds=statsParAn.map(s=>s?s.med:null);
    html+=miniBar(annees, meds, a);
  }
  dash.innerHTML=html;
}

// ============ BARRE KPI (cartes de stats, look "control room") ============
// icônes (24x24, stroke=currentColor) + mini-graphique d'évolution par carte.
const ICONES_KPI = {
  med:  '<path d="M19 9l-7 7-7-7"/>',
  mean: '<path d="M3 12h18M12 3v18"/>',
  min:  '<path d="M12 19V5"/><path d="M5 12l7 7 7-7"/>',
  max:  '<path d="M12 5v19"/><path d="M5 12l7-7 7 7"/>',
  n:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
};
function kpiIcon(k){
  return `<span class="kpi-ico"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICONES_KPI[k]||""}</svg></span>`;
}
function majKPI(st){
  const bar=document.getElementById("kpibar"); if(!bar) return;
  if(!st){ bar.innerHTML=`<div class="kpi-empty">Aucune donnée</div>`; return; }
  const cards=[["Médiane","med"],["Moyenne","mean"],["Minimum","min"],["Maximum","max"]];
  bar.innerHTML = cards.map(([l,k])=>`
    <div class="kpi">
      <div class="kpi-l">${kpiIcon(k)}${l}</div>
      <div class="kpi-v">${fmtD(st[k])}</div>
    </div>`).join("") +
    `<div class="kpi kpi-n">
      <div class="kpi-l">${kpiIcon("n")}Communes</div>
      <div class="kpi-v">${st.n.toLocaleString("fr-FR")}</div>
    </div>`;
}
function majKPIcat(order, counts, labels, tot){
  const bar=document.getElementById("kpibar"); if(!bar) return;
  bar.innerHTML = order.map(k=>{ const lab=(labels&&labels[k])||k;
    return `<div class="kpi"><div class="kpi-l">${lab}</div><div class="kpi-v">${counts[k].toLocaleString("fr-FR")}</div><div class="kpi-s">${(100*counts[k]/tot).toFixed(0)}%</div></div>`;
  }).join("");
}

// ============ LEGENDES ============
function legendeNum(){
  const {breaks:b, ramp, counts, pops, popAnnee, active, classLabels, masked, noData}=CLASSES;
  const fmt=x=>Number(x).toLocaleString("fr-FR",{maximumFractionDigits:1});
  const lab=classLabels ||
    [`< ${fmt(b[0])}`,`${fmt(b[0])} – ${fmt(b[1])}`,`${fmt(b[1])} – ${fmt(b[2])}`,`${fmt(b[2])} – ${fmt(b[3])}`,`> ${fmt(b[3])}`];
  const maskedRow = masked ? (()=>{ const on=active.has("M");
    return `<div class="legend-row${on?'':' off'}" onclick="toggleClasse('M')">
        <span class="lg-check">${on?'☑':'☐'}</span>
        <span class="swatch" style="background:${masked.color}"></span>
        <span class="lg-lab">${masked.label}</span>
        <span class="lg-cnt">${masked.count.toLocaleString("fr-FR")}${pops?` · ${fmtPop(masked.pop||0)} hab`:''}</span>
      </div>`; })() : "";
  // "Pas de données" : uniquement affichée si au moins une commune du périmètre est
  // dans ce cas (sinon la légende s'alourdirait pour rien sur les variables où
  // toutes les communes sont renseignées, ex. Population).
  // Motif hachuré sur la pastille (repeating-linear-gradient CSS), pas un aplat : même
  // logique visuelle que les hachures sur la carte (motifNoData()), pour que la légende
  // ne se lise pas comme "un gris de plus" à côté du "secret statistique".
  const noDataRow = (noData && noData.count>0) ? (()=>{ const on=active.has("N");
    return `<div class="legend-row${on?'':' off'}" onclick="toggleClasse('N')">
        <span class="lg-check">${on?'☑':'☐'}</span>
        <span class="swatch" style="background-color:${noData.color};background-image:repeating-linear-gradient(45deg, rgba(108,118,133,0.6) 0 2px, transparent 2px 6px)"></span>
        <span class="lg-lab">${noData.label}</span>
        <span class="lg-cnt">${noData.count.toLocaleString("fr-FR")}${pops?` · ${fmtPop(noData.pop||0)} hab`:''}</span>
      </div>`; })() : "";
  document.getElementById("legend").innerHTML =
    ramp.map((c,i)=>{ const on=active.has(i);
      return `<div class="legend-row${on?'':' off'}" onclick="toggleClasse(${i})">
        <span class="lg-check">${on?'☑':'☐'}</span>
        <span class="swatch" style="background:${c}"></span>
        <span class="lg-lab">${lab[i]}</span>
        <span class="lg-cnt">${(counts[i]||0).toLocaleString("fr-FR")}${pops?` · ${fmtPop(pops[i]||0)} hab`:''}</span>
      </div>`; }).join("") + maskedRow + noDataRow +
    (pops && popAnnee ? `<div style="font-size:10.5px;color:var(--muted);padding:6px 5px 0">Population municipale ${popAnnee}</div>` : "");
}
function legendeCat(){
  const {cats, pal, labels, counts, pops, popAnnee, active}=CLASSES;
  document.getElementById("legend").innerHTML =
    cats.map(c=>{ const on=active.has(c);
      return `<div class="legend-row${on?'':' off'}" onclick="toggleCat('${c}')">
        <span class="lg-check">${on?'☑':'☐'}</span>
        <span class="swatch" style="background:${pal[c]}"></span>
        <span class="lg-lab">${(labels&&labels[c])||c}</span>
        <span class="lg-cnt">${(counts[c]||0).toLocaleString("fr-FR")}${pops?` · ${fmtPop(pops[c]||0)} hab`:''}</span>
      </div>`; }).join("") +
    (pops && popAnnee ? `<div style="font-size:10.5px;color:var(--muted);padding:6px 5px 0">Population municipale ${popAnnee}</div>` : "");
}

// ============ MÉTA DU PANNEAU LÉGENDE FLOTTANT (sous-titre, échelle, pied) ============
function libelleTerritoire(){
  const dept=document.getElementById("sel-dept").value;
  const region=document.getElementById("sel-region").value;
  if(dept) return `${dept} — ${DEPTS[dept]||""}`;
  if(region) return region;
  return "France métropolitaine";
}
function majLegendMeta(kind, st){
  const sub=document.getElementById("lgp-sub");
  const scaleBox=document.getElementById("lgp-scale");
  const foot=document.getElementById("lgp-foot");
  if(!sub||!scaleBox||!foot) return;
  const v=document.getElementById("sel-var").value;
  const a=document.getElementById("sel-year").value;
  const territoire=libelleTerritoire();
  const methode = kind==="cat" ? "Répartition par catégorie"
    : (CLASSES && CLASSES.fixed) ? "Seuils fixes" : document.getElementById("sel-class").selectedOptions[0].textContent;
  sub.textContent = `${methode} · ${territoire} · Communes`;

  if(kind==="num" && st && CLASSES && CLASSES.ramp){
    const stops = CLASSES.ramp.map((c,i)=>`${c} ${(i/(CLASSES.ramp.length-1)*100).toFixed(0)}%`).join(", ");
    scaleBox.innerHTML =
      `<div class="lgp-scale-labels"><span>Min.<b>${fmtD(st.min)}</b></span>`+
      `<span>Médiane<b>${fmtD(st.med)}</b></span>`+
      `<span>Max.<b>${fmtD(st.max)}</b></span></div>`+
      `<div class="lgp-scale-bar" style="background:linear-gradient(90deg, ${stops})"></div>`;
  } else {
    scaleBox.innerHTML="";
  }

  const n = st ? st.n : 0;
  const etendue = st ? `${fmtD(st.min)} – ${fmtD(st.max)}` : "—";
  const meta = METADATA[v];
  foot.innerHTML =
    `<div class="lgp-foot-row"><span>Communes analysées</span><b>${n.toLocaleString("fr-FR")}</b></div>`+
    `<div class="lgp-foot-row"><span>Méthode</span><b>${methode}</b></div>`+
    `<div class="lgp-foot-row"><span>Année</span><b>${a}</b></div>`+
    (kind==="num" ? `<div class="lgp-foot-row"><span>Étendue des valeurs</span><b>${etendue}</b></div>` : "") +
    (meta ? `<button type="button" class="lgp-more" id="lgp-more-btn">En savoir plus</button>
    <div class="lgp-note" id="lgp-note">${ficheMethodo(v)}</div>` : "");
  const moreBtn=document.getElementById("lgp-more-btn");
  if(moreBtn) moreBtn.onclick=()=>document.getElementById("lgp-note").classList.toggle("show");
}

// ============ POPUP survol ============
function interactions(){
  const popup=new maplibregl.Popup({closeButton:false,closeOnClick:false});
  let hoveredId=null;
  map.on("mousemove","communes-fill",e=>{
    map.getCanvas().style.cursor="pointer";
    const f=e.features[0], code=f.id;
    const changed = code!==hoveredId;
    // surbrillance de la commune survolée
    if(changed){
      if(hoveredId!==null) map.setFeatureState({source:"communes",id:hoveredId},{hover:false});
      hoveredId=code;
      map.setFeatureState({source:"communes",id:hoveredId},{hover:true});
    }
    // commune déjà détaillée dans la fiche ouverte : on n'affiche pas de popup
    // redondante qui chevaucherait la fiche.
    if(ficheOuvertePour(code)){ popup.remove(); return; }
    // le popup suit la souris à chaque pixel, mais son contenu (innerHTML) n'a
    // besoin d'être reconstruit que quand on change de commune — sinon on
    // ré-écrit le DOM à chaque mousemove pour rien, ce qui saccade le survol.
    popup.setLngLat(e.lngLat);
    if(changed){
      const v=document.getElementById("sel-var").value, a=document.getElementById("sel-year").value;
      const cfg=CONFIG[v]||{};
      let val=(CURRENT[a]||{})[code];
      const nom=f.properties.NOM || f.properties.NOM_COM || code;
      let txt;
      if(val==null) txt="—";
      else if(cfg.labels && cfg.labels[val]) txt=cfg.labels[val];
      else txt=(typeof val==="number")?val.toLocaleString("fr-FR"):val;
      popup.setHTML(`<div class="pop-name">${nom} <span style="color:#9aa4b1;font-weight:500">(${code})</span></div>
                <div class="pop-val">${LIBELLES[v]||v} : ${txt}</div>`);
    }
    popup.addTo(map);
  });
  map.on("mouseleave","communes-fill",()=>{
    map.getCanvas().style.cursor="";
    if(hoveredId!==null) map.setFeatureState({source:"communes",id:hoveredId},{hover:false});
    hoveredId=null; popup.remove();
  });
  // clic -> fiche commune détaillée
  map.on("click","communes-fill",e=>{ ouvrirFicheCommune(e.features[0].id, e.features[0].properties); });
}

// La fiche commune (au clic) et les popups de survol donnent des infos sur une
// commune. Quand on survole la commune DÉJÀ ouverte dans la fiche, la popup se
// superpose à la fiche (chevauchement redondant) : on la supprime dans ce cas.
function ficheOuvertePour(code){
  const card=document.getElementById("commune-card");
  return !!(card && card.classList.contains("show") && card.dataset.code===String(code));
}

// ============ FICHE COMMUNE (au clic, style "control room") ============
function ouvrirFicheCommune(code, props){
  const card=document.getElementById("commune-card"); if(!card) return;
  card.dataset.code=String(code);   // mémorisé pour éviter le chevauchement popup ↔ fiche
  const v=document.getElementById("sel-var").value;
  const a=document.getElementById("sel-year").value;
  const cfg=CONFIG[v]||{};
  const nom=(props&&(props.NOM||props.NOM_COM))||code;
  const val=(CURRENT[a]||{})[code];

  // valeur + badge de classe
  let valTxt="—", badge="", badgeColor="#9aa4b1";
  if(val!=null){
    if(cfg.labels && cfg.labels[val]){ valTxt=cfg.labels[val]; }
    else valTxt=(typeof val==="number")?val.toLocaleString("fr-FR"):val;
    if(CLASSES){
      if(CLASSES.type==="num" && typeof val==="number"){
        const i=classIndex(val, CLASSES.breaks);
        badgeColor=CLASSES.ramp[i]||badgeColor;
        badge=["Très faible","Faible","Moyen","Élevé","Très élevé"][i]||"";
      } else if(CLASSES.type==="cat"){
        badgeColor=(CLASSES.pal&&CLASSES.pal[String(val)])||badgeColor;
        badge=(cfg.labels&&cfg.labels[String(val)])||String(val);
      }
    }
  }
  const unit=(LIBELLES[v]||"").match(/\(([^)]+)\)/);
  const uTxt=unit?unit[1]:"";

  // rang (percentile) parmi les communes affichées
  let rang="—";
  if(typeof val==="number"){
    const scope=scopeSet();
    const arr=valsScope(CURRENT[a]||{}, scope);
    if(arr.length){ const below=arr.filter(x=>x<val).length;
      rang=Math.round(100*below/arr.length)+" %"; }
  }

  // mini-évolution de CETTE commune (toutes années)
  const annees=(INDEX[v]&&INDEX[v].annees)||[];
  let spark="";
  if(annees.length>=2 && cfg.type!=="cat"){
    const series=annees.map(y=>{ const vv=(CURRENT[y]||{})[code]; return typeof vv==="number"?vv:null; });
    spark=`<div class="cc-spark-t">Évolution communale</div>`+miniSpark(annees, series, a, badgeColor);
  }

  card.innerHTML=`
    <div class="cc-head">
      <div><div class="cc-name">${nom}</div><div class="cc-code">${code}</div></div>
      <button class="cc-close" onclick="document.getElementById('commune-card').classList.remove('show')">✕</button>
    </div>
    ${badge?`<span class="cc-badge" style="background:${badgeColor}1f;color:${badgeColor};border-color:${badgeColor}55">${badge}</span>`:""}
    <div class="cc-var">${LIBELLES[v]||v}</div>
    <div class="cc-val">${valTxt}<span class="cc-unit">${uTxt}</span></div>
    <div class="cc-grid">
      <div><div class="cc-l">${String(a).includes("-")?"Période":"Année"}</div><div class="cc-n">${a}</div></div>
      <div><div class="cc-l">Rang (plus faible que)</div><div class="cc-n">${rang}</div></div>
    </div>
    ${spark}`;
  card.classList.add("show");
}

// La fiche commune ne se rafraîchit QUE sur un clic (ouvrirFicheCommune est appelée
// depuis les handlers de clic, jamais depuis dessiner()) : changer d'année via le
// sélecteur ou la mini-frise du tableau de bord laissait donc la fiche déjà ouverte
// figée sur l'ancienne année. Rafraîchi ici, appelé depuis dessiner().
// innerHTML étant réinjecté par ouvrirFicheCommune(), on préserve les blocs ajoutés
// par les modules établissements (CHU/CLCC, cancer) en les ré-attachant après coup.
function rafraichirFicheOuverte(){
  const card=document.getElementById("commune-card");
  if(!card || !card.classList.contains("show") || !card.dataset.code) return;
  const code=card.dataset.code;
  const extraChuClcc=document.getElementById("cc-etabs");
  const extraCancer=document.getElementById("cc-etabs-cancer");
  const nom=(typeof GEO_NOMS!=="undefined" && GEO_NOMS && GEO_NOMS[code]) || code;
  ouvrirFicheCommune(code, {NOM:nom});
  if(extraChuClcc) card.appendChild(extraChuClcc);
  if(extraCancer) card.appendChild(extraCancer);
}

function miniSpark(years, vals, current, color){
  const valid=vals.filter(x=>x!=null); if(!valid.length) return "";
  const mx=Math.max(...valid), mn=Math.min(...valid), W=248, H=54, n=years.length;
  const x=i=> n<2?W/2 : (i/(n-1))*(W-10)+5;
  const y=val=> (mx===mn)?H/2 : H-6-((val-mn)/(mx-mn))*(H-14);
  let pts=[], dots="", zones="";
  years.forEach((yr,i)=>{ const val=vals[i]; if(val==null) return;
    const px=x(i), py=y(val); pts.push(`${px},${py}`);
    const on=String(yr)===String(current);
    const lbl=(yr+" : "+fmtD(val)).replace(/'/g,"’");
    // le point visible ignore la souris ; une zone invisible bien plus large
    // (r=9) porte les évènements, pour ne pas exiger un survol au pixel près.
    dots+=`<circle cx="${px}" cy="${py}" r="${on?3.5:2}" fill="${on?color:'#9aa4b1'}" style="pointer-events:none"/>`;
    zones+=`<circle cx="${px}" cy="${py}" r="9" fill="transparent" style="cursor:pointer"
      onmouseenter="sparkTipShow(event,'${lbl}')" onmousemove="sparkTipMove(event)" onmouseleave="sparkTipHide()"></circle>`;
  });
  return `<svg class="cc-spark" viewBox="0 0 ${W} ${H}" width="100%" height="${H}">
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
    ${dots}${zones}</svg>`;
}

// Infobulle flottante des points de mini-courbe : un seul élément réutilisé,
// positionné en position:fixed sur les coordonnées écran du curseur.
let _sparkTipEl=null;
function sparkTipEl(){
  if(!_sparkTipEl){ _sparkTipEl=document.createElement("div");
    _sparkTipEl.className="spark-tip"; document.body.appendChild(_sparkTipEl); }
  return _sparkTipEl;
}
function sparkTipShow(e,label){
  const el=sparkTipEl();
  el.textContent=label;
  el.style.left=e.clientX+"px"; el.style.top=e.clientY+"px";
  el.classList.add("show");
}
function sparkTipMove(e){
  if(!_sparkTipEl) return;
  _sparkTipEl.style.left=e.clientX+"px"; _sparkTipEl.style.top=e.clientY+"px";
}
function sparkTipHide(){ if(_sparkTipEl) _sparkTipEl.classList.remove("show"); }

// ============ Redimensionnement du panneau ============
function initResizer(){
  const app=document.getElementById("app");
  const sidebar=document.getElementById("sidebar");
  app.style.position="relative";
  const rz=document.createElement("div");
  rz.id="sidebar-resizer";
  Object.assign(rz.style,{position:"absolute",top:"0",height:"100%",width:"8px",
    cursor:"col-resize",zIndex:"6",background:"transparent"});
  const place=()=>{ rz.style.left=(sidebar.getBoundingClientRect().width-4)+"px"; };
  app.appendChild(rz); place();
  let drag=false, pendingW=null, rafId=null;
  rz.onmouseenter=()=>{ rz.style.background="rgba(31,111,235,.18)"; };
  rz.onmouseleave=()=>{ if(!drag) rz.style.background="transparent"; };
  rz.addEventListener("mousedown",e=>{ drag=true; document.body.style.userSelect="none"; e.preventDefault(); });
  // Le déplacement pendant le drag ne pousse plus le resize de MapLibre (coûteux)
  // et la relecture de layout (getBoundingClientRect) à chaque pixel de souris :
  // on ne garde que la dernière largeur demandée et on l'applique une fois par frame.
  const applyWidth=()=>{
    rafId=null;
    if(pendingW==null) return;
    const w=pendingW; pendingW=null;
    sidebar.style.width=w+"px"; sidebar.style.minWidth=w+"px";
    rz.style.left=(w-4)+"px";
    if(window.map||map) map.resize();
  };
  window.addEventListener("mousemove",e=>{ if(!drag) return;
    pendingW=Math.min(Math.max(e.clientX,240),680);
    if(rafId==null) rafId=requestAnimationFrame(applyWidth);
  });
  window.addEventListener("mouseup",()=>{ if(drag){ drag=false; document.body.style.userSelect="";
    rz.style.background="transparent";
    if(rafId!=null){ cancelAnimationFrame(rafId); applyWidth(); }
    map.resize(); } });
}

// ============ Embellissements : flèche Nord + export PNG ============
function initEmbellissements(){
  const mapDiv=document.getElementById("map");

  // barre KPI (cartes de stats flottantes en bas de la carte)
  const kpi=document.createElement("div");
  kpi.id="kpibar";
  mapDiv.appendChild(kpi);

  // fiche commune (au clic) — masquée par défaut
  const card=document.createElement("div");
  card.id="commune-card";
  mapDiv.appendChild(card);

  // flèche Nord (en bas à gauche de la carte)
  const nord=document.createElement("div");
  nord.className="north-arrow";
  nord.innerHTML=`<svg viewBox="0 0 24 32" width="22" height="30">
    <polygon points="12,1 19,17 12,13 5,17" fill="#1a2330"/>
    <polygon points="12,1 12,13 5,17" fill="#5b6675"/>
    <text x="12" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#1a2330">N</text>
  </svg>`;
  mapDiv.appendChild(nord);

  // bouton export carte complète (habillage cartographique + légende + logos)
  const btn=document.createElement("button");
  btn.className="btn-export";
  btn.innerHTML=`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> <span>Exporter la carte</span>`;
  btn.onclick=()=>exporterCarteComplete(btn);
  mapDiv.appendChild(btn);
}

// ============ EXPORT CARTE COMPLÈTE (PNG habillé, prêt pour rapport/impression) ============
// Compose sur un canvas hors-écran : fond de carte (WebGL) + graticule + flèche Nord
// (orientée selon le bearing courant) + échelle graphique calculée + cadre + titre +
// légende (capturée depuis le panneau réel via html2canvas, donc toujours synchronisée
// avec ce qui est affiché : classes actives, cercles, chaleur, secret statistique...)
// + pied de page source/logos. Le tout est ensuite téléchargé en PNG haute résolution.
function chargerImage(src){
  return new Promise((resolve)=>{
    let fini=false;
    const term=(v)=>{ if(fini) return; fini=true; resolve(v); };
    const img=new Image();
    img.onload=()=>term(img);
    img.onerror=()=>term(null);   // logo manquant : on continue sans bloquer l'export
    img.src=src;
    setTimeout(()=>term(null), 5000);   // filet de sécurité : jamais bloqué sur une image qui ne répond pas
  });
}
// Arrondit une valeur (km ou m) au "chiffre rond" cartographique le plus proche en-dessous
// (1/2/5 × 10^n), comme une échelle graphique classique.
function valeurRondeEchelle(x){
  const exp=Math.floor(Math.log10(x));
  const base=Math.pow(10,exp);
  const f=x/base;
  const nice = f>=5 ? 5 : (f>=2 ? 2 : 1);
  return nice*base;
}
async function exporterCarteComplete(btn){
  if(btn.disabled) return;
  const label0=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span>Génération…</span>`;
  const legendPanel=document.getElementById("legend-panel");
  const wasCollapsed = legendPanel && legendPanel.classList.contains("collapsed");
  try{
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    if(wasCollapsed) legendPanel.classList.remove("collapsed");

    // 1) rendu carte fraîchement peint (buffer non conservé -> capture au vol).
    //    IMPORTANT : on attend l'événement "idle" (pas seulement "render") avant de lire
    //    les pixels. Juste après un long moment d'inactivité, le tout premier "render"
    //    qui suit triggerRepaint() peut ne pas avoir fini de composer toutes les couches
    //    (tuiles raster affichées mais couche vectorielle "communes-fill" encore absente) —
    //    "idle" garantit que la carte a fini de peindre toutes ses couches/sources.
    //    Mais "idle" peut, selon l'état de la carte (popup ouvert, tuile en cours, hover…),
    //    ne jamais se déclencher : un filet de sécurité (délai max) évite de rester bloqué
    //    indéfiniment sur "Génération…" (bug remonté : le bouton tournait sans jamais aboutir).
    // "idle" (ou le filet de sécurité) ne garantit que les SOURCES sont chargées —
    // pas que le buffer WebGL lu ensuite soit encore frais (preserveDrawingBuffer
    // désactivé : rien ne garantit qu'un toDataURL() hors du callback synchrone d'un
    // "render" retrouve les pixels du dernier paint). D'où la capture en 2 temps :
    // idle/timeout attend que tout soit chargé, PUIS un ultime triggerRepaint() dont
    // les pixels sont lus dans son propre callback "render", donc dans la même tâche
    // que le paint — seule lecture garantie non blanche/périmée.
    const dpr=window.devicePixelRatio||1;
    const mapDataUrl = await new Promise(res=>{
      let done=false;
      const captureFrais=()=>{
        if(done) return;
        map.once("render", ()=>{
          if(done) return;
          done=true;
          res(map.getCanvas().toDataURL("image/png"));
        });
        map.triggerRepaint();
      };
      const filet=setTimeout(captureFrais, 8000);
      map.once("idle", ()=>{ clearTimeout(filet); captureFrais(); });
      map.triggerRepaint();
    });
    const mc = await chargerImage(mapDataUrl);
    if(!mc) throw new Error("Capture de la carte impossible");
    const W=mc.width, H=mc.height;

    // 2) capture de la légende réelle (si html2canvas est disponible, avec délai max lui
    //    aussi : une capture DOM complexe ne doit jamais pouvoir bloquer tout l'export).
    //    Capturée à une résolution fixe élevée (indépendante du dpr de l'écran, souvent
    //    1 sur un moniteur standard) : le panneau ne fait que 280px de large à l'écran,
    //    illisible une fois posé à côté d'une carte de 1000+ px — cf. mise à l'échelle
    //    ci-dessous qui l'agrandit ensuite dans le composite en repartant de ces pixels
    //    haute résolution, plutôt que d'étirer un scan basse résolution (flou).
    //    "En savoir plus" (id lgp-more-btn) n'a aucun sens hors de l'appli interactive :
    //    exclu de la capture via ignoreElements.
    let legCanvas=null;
    if(window.html2canvas && legendPanel){
      try{
        legCanvas = await Promise.race([
          html2canvas(legendPanel,{
            scale:Math.max(dpr,2)*1.5, backgroundColor:"#ffffff", useCORS:true,
            ignoreElements:el=>el.id==="lgp-more-btn"
          }),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error("légende : délai dépassé")), 6000))
        ]);
      }catch(e){ legCanvas=null; }
    }

    // 3) logos (marque + partenaires), chargés en parallèle, tolérants aux échecs
    const [logoPrincipal, logoCLB, logoLyon1, logoShapemed] = await Promise.all(
      ["Logo.png","LOGO_INSTITUS/CEntrelb.png","LOGO_INSTITUS/lyon1.png","LOGO_INSTITUS/shapemed.png"].map(chargerImage)
    );
    const logos=[logoPrincipal, logoCLB, logoLyon1, logoShapemed].filter(Boolean);

    // 4) mise en page du composite
    const pad=26*dpr, titreH=76*dpr, piedH=100*dpr, gouttiere=20*dpr;
    // 420 (au lieu de 360) : le panneau ne fait que 280px de large à l'écran, capturé
    // maintenant en haute résolution (cf. ci-dessus) — l'agrandir un peu dans le composite
    // le rend lisible à côté d'une carte de 1000+ px, sans dominer la mise en page.
    const legW = legCanvas ? Math.min(legCanvas.width, 420*dpr) : 0;
    const legScale = legCanvas ? legW/legCanvas.width : 0;
    const legH = legCanvas ? legCanvas.height*legScale : 0;
    const zoneH = Math.max(H, legH);
    const totalW = Math.round(pad*2 + W + (legW? gouttiere+legW : 0));
    const totalH = Math.round(pad*2 + titreH + zoneH + piedH);

    const out=document.createElement("canvas");
    out.width=totalW; out.height=totalH;
    const ctx=out.getContext("2d");

    // papier
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,totalW,totalH);

    // titre
    const varLabel=(document.getElementById("display-var")||{}).textContent||"";
    const anLabel=(document.getElementById("display-year")||{}).textContent||"";
    const uniteLabel=(document.getElementById("display-unit")||{}).textContent||"";
    const territoire=typeof libelleTerritoire==="function" ? libelleTerritoire() : "France métropolitaine";
    ctx.fillStyle="#0d1b2a";
    ctx.font=`700 ${Math.round(23*dpr)}px "Space Grotesk","IBM Plex Sans",sans-serif`;
    ctx.textBaseline="alphabetic";
    ctx.fillText(`${varLabel}${anLabel? " — "+anLabel:""}${uniteLabel? " "+uniteLabel:""}`, pad, pad+26*dpr);
    ctx.fillStyle="#6d7f96";
    ctx.font=`600 ${Math.round(12.5*dpr)}px "IBM Plex Sans",sans-serif`;
    ctx.fillText(`${territoire} · Atlas Géo-Santé EEPATHO`, pad, pad+48*dpr);
    const maintenant=new Date();
    const dateStr=maintenant.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
    ctx.textAlign="right";
    ctx.fillText(`Généré le ${dateStr}`, totalW-pad, pad+48*dpr);
    ctx.textAlign="left";

    // zone carte
    const mapX=pad, mapY=pad+titreH, mapW_=W, mapH_=H;
    ctx.save();
    ctx.beginPath(); ctx.rect(mapX,mapY,mapW_,mapH_); ctx.clip();
    ctx.drawImage(mc, mapX, mapY, mapW_, mapH_);

    // graticule (méridiens/parallèles), tracé en suivant le bearing/pitch réels via project()
    try{
      const bounds=map.getBounds();
      const south=bounds.getSouth(), north=bounds.getNorth(), west=bounds.getWest(), east=bounds.getEast();
      const pas = valeurRondeEchelle(Math.max(north-south, east-west) / 4) || 1;
      const arrondiPas=(v,p)=>Math.round(v/p)*p;
      ctx.strokeStyle="rgba(13,27,42,0.16)"; ctx.lineWidth=Math.max(1,1*dpr);
      ctx.font=`600 ${Math.round(9.5*dpr)}px "IBM Plex Mono",monospace`;
      ctx.fillStyle="rgba(13,27,42,0.55)";
      const projPt=(lng,lat)=>{ const p=map.project([lng,lat]); return {x:mapX+p.x*dpr, y:mapY+p.y*dpr}; };
      for(let lat=arrondiPas(south,pas); lat<=north; lat+=pas){
        ctx.beginPath();
        for(let i=0;i<=20;i++){ const lng=west+(east-west)*i/20; const p=projPt(lng,lat);
          i===0? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); }
        ctx.stroke();
        const p0=projPt(west+ (east-west)*0.02, lat);
        ctx.fillText(`${lat.toFixed(pas<1?2:0)}°N`, p0.x+3*dpr, p0.y-3*dpr);
      }
      for(let lng=arrondiPas(west,pas); lng<=east; lng+=pas){
        ctx.beginPath();
        for(let i=0;i<=20;i++){ const lat=south+(north-south)*i/20; const p=projPt(lng,lat);
          i===0? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); }
        ctx.stroke();
        const p1=projPt(lng, north-(north-south)*0.02);
        const lonTxt=`${Math.abs(lng).toFixed(pas<1?2:0)}°${lng<0?"O":"E"}`;
        ctx.textAlign="left";
        ctx.fillText(lonTxt, p1.x+3*dpr, p1.y+11*dpr);
      }
    }catch(e){ /* graticule non bloquant */ }
    ctx.restore();

    // cadre net autour de la carte
    ctx.strokeStyle="#0d1b2a"; ctx.lineWidth=Math.max(1,1.6*dpr);
    ctx.strokeRect(mapX+ctx.lineWidth/2, mapY+ctx.lineWidth/2, mapW_-ctx.lineWidth, mapH_-ctx.lineWidth);

    // échelle graphique (bas gauche de la carte)
    try{
      const centre=map.getCenter(), zoom=map.getZoom();
      const mParPxCss = 156543.03392 * Math.cos(centre.lat*Math.PI/180) / Math.pow(2, zoom);
      const mParPxDevice = mParPxCss / dpr;
      const cibleKm = (mapW_*0.16*mParPxDevice)/1000;
      let niceKm=valeurRondeEchelle(Math.max(cibleKm,0.05));
      let unite="km", niceVal=niceKm;
      if(niceKm<1){ unite="m"; niceVal=valeurRondeEchelle(cibleKm*1000); }
      const barPx = unite==="km" ? (niceVal*1000)/mParPxDevice : niceVal/mParPxDevice;
      const bx=mapX+18*dpr, by=mapY+mapH_-26*dpr;
      ctx.fillStyle="rgba(255,255,255,0.86)";
      ctx.fillRect(bx-8*dpr, by-20*dpr, barPx+16*dpr, 34*dpr);
      ctx.strokeStyle="#0d1b2a"; ctx.lineWidth=Math.max(1,1.4*dpr);
      ctx.beginPath();
      ctx.moveTo(bx,by); ctx.lineTo(bx+barPx,by);
      ctx.moveTo(bx,by-6*dpr); ctx.lineTo(bx,by+6*dpr);
      ctx.moveTo(bx+barPx,by-6*dpr); ctx.lineTo(bx+barPx,by+6*dpr);
      ctx.moveTo(bx+barPx/2,by-4*dpr); ctx.lineTo(bx+barPx/2,by+4*dpr);
      ctx.stroke();
      ctx.fillStyle="#0d1b2a"; ctx.textAlign="center";
      ctx.font=`700 ${Math.round(10.5*dpr)}px "IBM Plex Mono",monospace`;
      ctx.fillText(`${niceVal} ${unite}`, bx+barPx/2, by-9*dpr);
      ctx.textAlign="left";
    }catch(e){ /* échelle non bloquante */ }

    // flèche Nord (haut droite de la carte), orientée selon le bearing courant
    try{
      const bearing=map.getBearing()||0;
      const cx=mapX+mapW_-42*dpr, cy=mapY+50*dpr, r=26*dpr;
      ctx.save();
      ctx.fillStyle="rgba(255,255,255,0.86)";
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#d7e0ec"; ctx.lineWidth=dpr; ctx.stroke();
      ctx.translate(cx,cy); ctx.rotate(-bearing*Math.PI/180);
      ctx.beginPath();
      ctx.moveTo(0,-16*dpr); ctx.lineTo(6*dpr,7*dpr); ctx.lineTo(0,3*dpr); ctx.closePath();
      ctx.fillStyle="#0d1b2a"; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0,-16*dpr); ctx.lineTo(-6*dpr,7*dpr); ctx.lineTo(0,3*dpr); ctx.closePath();
      ctx.fillStyle="#5b6675"; ctx.fill();
      ctx.restore();
      ctx.fillStyle="#0d1b2a"; ctx.textAlign="center";
      ctx.font=`700 ${Math.round(11*dpr)}px "IBM Plex Sans",sans-serif`;
      ctx.fillText("N", cx, cy+r+13*dpr);
      ctx.textAlign="left";
    }catch(e){ /* flèche non bloquante */ }

    // légende (capture réelle du panneau)
    if(legCanvas){
      const lx=mapX+mapW_+gouttiere, ly=mapY;
      ctx.save();
      ctx.shadowColor="rgba(13,27,42,0.18)"; ctx.shadowBlur=14*dpr; ctx.shadowOffsetY=4*dpr;
      ctx.fillStyle="#ffffff";
      ctx.fillRect(lx,ly,legW,legH);
      ctx.restore();
      ctx.drawImage(legCanvas, lx, ly, legW, legH);
      ctx.strokeStyle="#e4eaf2"; ctx.lineWidth=dpr;
      ctx.strokeRect(lx+dpr/2, ly+dpr/2, legW-dpr, legH-dpr);
    }

    // pied de page : séparateur + logos + mentions source
    const piedY=pad+titreH+zoneH+18*dpr;
    ctx.strokeStyle="#e4eaf2"; ctx.lineWidth=dpr;
    ctx.beginPath(); ctx.moveTo(pad,piedY); ctx.lineTo(totalW-pad,piedY); ctx.stroke();

    let lx=pad, logoH=34*dpr;
    logos.forEach(img=>{
      const w=img.width*(logoH/img.height);
      ctx.drawImage(img, lx, piedY+16*dpr, w, logoH);
      lx += w+22*dpr;
    });

    ctx.fillStyle="#3c4d63";
    ctx.font=`600 ${Math.round(10.5*dpr)}px "IBM Plex Sans",sans-serif`;
    ctx.textAlign="right";
    ctx.fillText("Fond de carte © CARTO · contributeurs © OpenStreetMap · Projection Web Mercator (EPSG:3857)", totalW-pad, piedY+30*dpr);
    ctx.fillText("Source des données : base EEPATHO — maille communale · Centre Léon Bérard / Université Claude Bernard Lyon 1", totalW-pad, piedY+46*dpr);
    ctx.textAlign="left";

    // 5) téléchargement
    const vv=(document.getElementById("sel-var")||{}).value||"carte";
    const an=(document.getElementById("sel-year")||{}).value||"";
    const horodatage=maintenant.toISOString().slice(0,10);
    out.toBlob(blob=>{
      if(!blob){ signalerErreur("Export impossible (restriction navigateur). Essayez une capture d'écran."); return; }
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.download=`EEPATHO_carte_${vv}_${an}_${horodatage}.png`; a.href=url; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
    }, "image/png");
  }catch(err){
    console.error("Export de la carte :", err);
    signalerErreur("Export impossible (restriction navigateur). Essayez une capture d'écran.");
  }finally{
    if(wasCollapsed && legendPanel) legendPanel.classList.add("collapsed");
    btn.disabled=false;
    btn.innerHTML=label0;
  }
}

// =====================================================================
//  ASSISTANT DE RECHERCHE (local, sans IA) — comprend une question en
//  français, lit les données et agit sur la carte.
// =====================================================================
let NOM_BY_CODE = {};   // noms normalisés (recherche)
let NOM_AFF = {};       // noms d'affichage (fiches, CSV)
let LAST_REGION = "", LAST_DEPT = "";
// Normalisation robuste : retire les accents, passe en minuscules, puis convertit
// les apostrophes (droites, typographiques, accent grave) ET les tirets/traits
// d'union en espaces, et compacte les espaces. Cons\u00e9quence : \u00ab c'est quoi \u00bb,
// \u00ab qu'est-ce que \u00bb, \u00ab es-tu \u00bb, \u00ab vas-tu \u00bb, \u00ab d'accord \u00bb, \u00ab Aix-en-Provence \u00bb,
// \u00ab Saint-\u00c9tienne \u00bb sont compris comme leurs formes espac\u00e9es \u2014 le chatbot tol\u00e8re
// la ponctuation courante et l'inversion fran\u00e7aise, ce qui le rend nettement plus
// \u00ab humain \u00bb. La conversion est appliqu\u00e9e des DEUX c\u00f4t\u00e9s (question ET noms de
// communes/r\u00e9gions index\u00e9s), donc les correspondances restent coh\u00e9rentes.
const norm = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[\u2019'`\u00b4\u02bc\u2010\u2011\u2012\u2013\u2014-]/g," ").replace(/\s+/g," ").trim();
const pick = a => a[Math.floor(Math.random()*a.length)];

// "faire une comparaison" a longtemps d\u00e9clench\u00e9 la fiche de la commune "Aire" (08004) :
// trouverCommune() testait q.includes(mot+" "), qui matche "aire " au milieu de "faire "
// sans qu'aucune fronti\u00e8re de mot ne soit v\u00e9rifi\u00e9e \u00e0 GAUCHE. motDansTexte() encadre le
// mot/la phrase de bornes non-alphanum\u00e9riques des DEUX c\u00f4t\u00e9s \u2014 un correctif g\u00e9n\u00e9rique,
// pas un cas particulier sur "aire", donc valable pour tout futur mot court ambigu
// (ex. r\u00e9gions/communes/synonymes courts se cachant dans un mot plus long).
function motDansTexte(q, mot){
  const m = norm(mot);
  if(!m) return false;
  const echappe = m.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return new RegExp("(^|[^a-z0-9])"+echappe+"($|[^a-z0-9])").test(" "+q+" ");
}

// ---- Tolérance aux fautes de frappe (distance de Levenshtein) ----
function levenshtein(a,b){
  if(a===b) return 0;
  const m=a.length, n=b.length;
  if(!m) return n; if(!n) return m;
  let prev=new Array(n+1); for(let j=0;j<=n;j++) prev[j]=j;
  for(let i=1;i<=m;i++){
    const cur=[i];
    for(let j=1;j<=n;j++){
      cur[j]=Math.min(
        prev[j]+1,
        cur[j-1]+1,
        prev[j-1]+(a[i-1]===b[j-1]?0:1)
      );
    }
    prev=cur;
  }
  return prev[n];
}
// tolérance proportionnelle à la longueur du mot (1 faute jusqu'à 7 lettres, 2 au-delà)
const tolerance = w => w.length<=7 ? 1 : 2;
// un token de la question est-il "assez proche" d'un mot cible ?
function motProche(qTokens, mot){
  const m=norm(mot); const tol=tolerance(m);
  return qTokens.some(t=> Math.abs(t.length-m.length)<=tol && levenshtein(t,m)<=tol);
}
// mots-clés -> variable (on prend les versions "moyenne" pour la pollution)
const SYNON = [
  [["arsenic"],"ARSENIC_MOY"], [["nitrate"],"NITRATES_MOY"], [["pesticide"],"PESTICIDES_MOY"],
  [["chlorure de vinyle","chlorure de vinyl","cvm","vinyle","monomere"],"CVM"],
  [["radon"],"RADON"],
  [["pm2","pm 2","particules fines","fines"],"PM25"], [["pm10","pm 10"],"PM10"],
  [["no2","dioxyde d azote","azote"],"NO2"], [["ozone","o3"],"O3"],
  [["revenu","salaire","niveau de vie","gagne","aise","riche","richesse"],"REV_MEDIAN"],
  [["quintile"],"FDEP_QUINTILE"], [["defavoris","pauvret","precarit","pauvre","precaire","misere","fdep"],"FDEP"],
  [["densite"],"DENSITE"],
  // --- population 20+ : AVANT l'entrée générique "population", sinon elle capterait
  //     « population 20 ans et plus » et renverrait la population municipale.
  //     Idem pour "part d hommes"/"parite", qui contiennent "hommes" : le plus
  //     spécifique doit être testé en premier (SYNON s'arrête au 1er match).
  [["part d homme","part des homme","part hommes","parite","sex ratio","sex-ratio",
    "ratio homme","rapport homme","masculinite","part masculine","desequilibre",
    "plus d hommes","plus de femmes","hommes ou femmes","hommes et femmes",
    "repartition par sexe","structure par sexe"],"PART_H_20P"],
  [["hommes de 20","homme de 20","effectif masculin","population masculine","masculin"],"POP_20P_H"],
  [["femmes de 20","femme de 20","effectif feminin","population feminine","feminin"],"POP_20P_F"],
  [["population 20","pop 20","20 ans et plus","20 ans ou plus","vingt ans et plus",
    "adulte","majeur","population adulte"],"POP_20P"],
  [["homme"],"POP_20P_H"], [["femme"],"POP_20P_F"],
  [["population","habitant"],"POPULATION"],
  [["apl","generaliste","medecin"],"APL_GENERALISTES"],
  [["distance chu","km chu"],"DIST_CHU_CLCC"],
  [["duree presc etablissement","duree prescripteur etablissement","temps prescripteur etablissement"],"DUREE_PRESC_ETAB"],
  [["distance presc etablissement","distance prescripteur etablissement","km prescripteur etablissement"],"DIST_PRESC_ETAB"],
  [["prescripteur etablissement","presc vers etablissement","etablissement de soins","vers etablissement"],"DUREE_PRESC_ETAB"],
  [["commune etablissement","commune vers etablissement","acces etablissement"],"DUREE_COMMUNE_ETAB"],
  [["distance commune etablissement","km commune etablissement"],"DIST_COMMUNE_ETAB"],
  [["nombre de prescripteur","nb de prescripteur","effectif de prescripteur","pole de prescripteur",
    "presence de prescripteur","carte des prescripteur","ou sont les prescripteur"],"PRESCRIPTEURS"],
  [["prescripteur"],"DUREE_PRESCRIPTEUR"],
  [["immigr"],"PART_IMMIGRES"], [["urbain","rural","type de commune"],"TYPE_COMMUNE"],
  // --- pathologie du foie EEPATHO : vocabulaire clinique courant (au-delà des libellés
  //     officiels déjà couverts par le repli #2 de trouverVariable). Les combinaisons
  //     « mixte + cause » doivent être testées AVANT la cause seule, sinon « cause mixte
  //     alcoolique » serait capté par l'entrée « alcool » (ETIO_ALCOOLIQUE) avant d'atteindre
  //     la bonne variable — même logique que "population 20+" testé avant "population". ---
  [["mixte alcool","mixte alcoolique","cause mixte alcool"],"ETIO_MIXTE_ALCOOLIQUE"],
  [["mixte metabolique","mixte metaboliques","cause mixte metabolique"],"ETIO_MIXTE_METABOLIQUE"],
  [["hepatite virale","hepatite b","hepatite c","vhb","vhc","virus de l hepatite","virale"],"ETIO_VIRALE"],
  [["alcool","alcoolisme","alcoolique","consommation d alcool"],"ETIO_ALCOOLIQUE"],
  [["steatose","nash","syndrome metabolique","diabete","obesite","metabolique"],"ETIO_METABOLIQUE"],
  [["auto immune","hepatite auto immune","auto immunite"],"ETIO_AUTO_IMMUNE"],
  [["vasculaire","budd chiari","thrombose"],"ETIO_VASCULAIRE"],
  [["cause inconnue","etiologie inconnue","indetermine","inexpliquee","sans cause connue"],"ETIO_INCONNUE"],
  [["mixte"],"ETIO_MIXTE_AUTRE"],
  [["nouveaux cas","nouveau cas","nouveaux patients","nouveaux malades"],"INCIDENCE"],
  // --- avant l'entrée générique "prevalence" : le vocabulaire "cluster"/"hotspot"
  //     doit renvoyer l'analyse spatiale Gi*, pas la simple carte de la prévalence.
  [["cas prevalents","prevalence","cas de maladie du foie","maladie chronique du foie",
    "maladie hepatique","cirrhose","patients atteints","carcinome hepatocellulaire","chc",
    "malades du foie","maladie du foie","cancer du foie","cancer hepatique"],"PREVALENCE"],
  // --- vocabulaire courant / familier (repli : catchés seulement si rien de plus précis) ---
  [["medecin traitant","docteur","toubib"],"APL_GENERALISTES"],
  [["dioxyde d azote","trafic","circulation","voiture"],"NO2"],
  [["pollution de l air","qualite de l air","air pollue","air respire"],"PM25"],
  [["qualite de l eau","eau du robinet","eau potable"],"NITRATES_MOY"]
];

function trouverVariable(q){
  // 1) synonymes explicites
  for(const [mots,key] of SYNON){
    if(INDEX[key] && mots.some(m=>q.includes(norm(m)))) return key;
  }
  // 2) repli : mots du libellé officiel de chaque variable présente
  let best=null, bestLen=0;
  for(const key in INDEX){
    const toks = norm(LIBELLES[key]||key).split(/[^a-z0-9]+/).filter(t=>t.length>3);
    for(const t of toks){ if(q.includes(t) && t.length>bestLen){ best=key; bestLen=t.length; } }
  }
  if(best) return best;
  // 3) repli flou (tolère 1-2 fautes de frappe) sur les mots-clés SYNON
  const qTokens = q.split(/[^a-z0-9]+/).filter(Boolean);
  for(const [mots,key] of SYNON){
    if(INDEX[key] && mots.some(m=> !m.includes(" ") && motProche(qTokens,m))) return key;
  }
  return null;
}
function trouverRegion(q){
  const qq=q.replace(/-/g," ");
  let best=null, bestLen=0;
  const stop=["alpes","cote","pays","loire","france","est"];
  for(const nom of Object.keys(REGIONS)){
    const phrase=norm(nom).replace(/-/g," ");
    // motDansTexte (bornes de mot des 2 côtés) plutôt que qq.includes(t) : sinon un mot
    // de la question contenant par hasard un token région (ex. "rencontre" contient
    // "centre") capterait la mauvaise région — même classe de bug que "faire"/"Aire".
    if(motDansTexte(qq,phrase) && phrase.length>bestLen){ best=nom; bestLen=phrase.length; continue; }
    for(const t of phrase.split(/\s+/)){
      if(t.length>4 && !stop.includes(t) && motDansTexte(qq,t) && t.length>bestLen){ best=nom; bestLen=t.length; }
    }
  }
  if(best) return best;
  // repli flou : tolère les fautes de frappe sur le nom de région
  const qTokens = qq.split(/\s+/).filter(Boolean);
  for(const nom of Object.keys(REGIONS)){
    for(const t of norm(nom).replace(/-/g," ").split(/\s+/)){
      if(t.length>4 && !stop.includes(t) && motProche(qTokens,t)) return nom;
    }
  }
  return null;
}
function trouverDept(q){
  // motDansTexte, pas q.includes(n) : "une heure" contient "eure" (département Eure) sans
  // frontière de mot — même classe de bug que "faire"/"Aire" plus haut sur les communes.
  for(const code in DEPTS){ const n=norm(DEPTS[code]); if(n.length>3 && motDansTexte(q,n)) return code; }
  const m=q.match(/\b(2a|2b|0?\d|1\d|9[0-5])\b/); // garde-fou léger
  return null;
}
// ---- Avertissement générique de couverture de donnée (ex: variable trouée sur une zone) ----
function totalCommunesScope(scope){
  if(!GEO || !GEO.features) return 0;
  let total=0;
  for(const f of GEO.features){
    const code=f.properties[CLE];
    if(!scope || scope.has((code||"").slice(0,2))) total++;
  }
  return total;
}
function avertissementCouverture(n, scope){
  const total=totalCommunesScope(scope);
  if(!total) return "";
  const ratio=n/total;
  if(ratio<0.15){
    const pct=Math.round(ratio*100);
    return `<br><br><span style="color:#c2410c">⚠️ Donnée disponible pour seulement <b>${pct}%</b> des communes de ce territoire — couverture partielle, à vérifier si non attendu.</span>`;
  }
  return "";
}
// ---- Export CSV local (aucune donnée envoyée à l'extérieur) ----
// Format FR : séparateur ";", décimale ",", BOM UTF-8 pour Excel.
// code_insee reste du texte -> à importer en "texte" dans Excel (zéros de tête, Corse 2A/2B).
function exporterCSV(lignes, nomFichier){
  const BOM="\uFEFF";
  const head="code_insee;commune;valeur;population";
  const corps=lignes.map(([c,n,v,p])=>
    `"${c}";"${String(n||"").replace(/"/g,'""')}";`+
    `${typeof v==="number"?String(v).replace(".",","):'"'+String(v).replace(/"/g,'""')+'"'};`+
    `${p!=null?Math.round(p):""}`).join("\n");
  const blob=new Blob([BOM+head+"\n"+corps],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=nomFichier;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function trouverCommune(q){
  let best=null, bestLen=0;
  for(const code in NOM_BY_CODE){ const n=NOM_BY_CODE[code]; if(n.length<=3) continue;
    if(motDansTexte(q,n)){
      if(n.length>bestLen){ best=code; bestLen=n.length; } } }
  if(best) return best;
  // repli flou : une commune bien orthographiée mais mal tapée
  const qTokens = q.split(/[^a-z0-9]+/).filter(t=>t.length>4);
  if(!qTokens.length) return null;
  for(const code in NOM_BY_CODE){
    const n=NOM_BY_CODE[code]; if(n.length<=4) continue;
    if(n.includes(" ")) continue; // noms composés : trop de faux positifs en flou, on les ignore ici
    if(motProche(qTokens,n)){ if(n.length>bestLen){ best=code; bestLen=n.length; } }
  }
  return best;
}

// =====================================================
// EEPATHO Assistant V2
// =====================================================

async function afficherHotspot(variable){

    document.getElementById("sel-var").value = variable;

    await chargerVariable(variable);

    // chargerVariable() peut échouer (réseau, session) : CLASSES reste alors celui de
    // la variable précédente, voire null au tout premier affichage. Sans ce garde-fou,
    // l'assistant plantait sur « les communes les plus défavorisées » et la bulle de
    // réponse restait bloquée sur les trois points de saisie.
    if(!CLASSES || CLASSES.type!=="num") return false;

    CLASSES.active = new Set([4]);

    applyPaint();

    renderLegend();

    return true;
}

function interpretMap(){

    const variable =
        document.getElementById("sel-var").value;

    const year =
        document.getElementById("sel-year").value;

    const data =
        (CURRENT && CURRENT[year]) || {};

    const st =
        statsOf(
            valsScope(data,null)
        );

    if(!st)
        return "Aucune donnée disponible.";

    return `
        <b>${LIBELLES[variable]}</b> (${year})

        <br><br>

        Médiane :
        <b>${fmtD(st.med)}</b>

        <br>

        Moyenne :
        <b>${fmtD(st.mean)}</b>

        <br>

        Minimum :
        ${fmtD(st.min)}

        <br>

        Maximum :
        ${fmtD(st.max)}

        <br><br>

        ${pick([
          "Cette carte met en évidence une distribution territoriale hétérogène de la variable étudiée.",
          "On observe des écarts marqués selon les territoires sur cette variable.",
          "La répartition varie sensiblement d'un territoire à l'autre."
        ])}
        ${interpreterStats(st)}
    `;
}


function analyseTerritoire(resultats){

    let forces = [];
    let risques = [];

    if(resultats.REV_MEDIAN){

        if(resultats.REV_MEDIAN > 25000){

            forces.push(
                "niveau de revenu supérieur à la moyenne nationale"
            );

        }else{

            risques.push(
                "niveau de revenu relativement faible"
            );
        }
    }

    if(resultats.FDEP){

        if(resultats.FDEP < 0){

            forces.push(
                "niveau de défavorisation limité"
            );

        }else{

            risques.push(
                "niveau de défavorisation notable"
            );
        }
    }



    // Charge de morbidité (Prévalence/Incidence des maladies chroniques du foie) :
    // jugée par rapport à la médiane nationale de la même année, pas à un seuil
    // fixe — un nombre de cas brut n'a de sens que comparé au reste du pays.
    if(resultats.PREVALENCE!=null && resultats.PREVALENCE_NAT!=null){

        if(resultats.PREVALENCE > resultats.PREVALENCE_NAT){

            risques.push(
                "prévalence des maladies chroniques du foie supérieure à la médiane nationale"
            );

        }else{

            forces.push(
                "prévalence des maladies chroniques du foie inférieure à la médiane nationale"
            );
        }
    }

    if(resultats.INCIDENCE!=null && resultats.INCIDENCE_NAT!=null){

        if(resultats.INCIDENCE > resultats.INCIDENCE_NAT){

            risques.push(
                "incidence des maladies chroniques du foie supérieure à la médiane nationale"
            );

        }else{

            forces.push(
                "incidence des maladies chroniques du foie inférieure à la médiane nationale"
            );
        }
    }

    let html = `
        <hr>
        <b>Synthèse EEPATHO</b>
        <br><br>
    `;

    if(forces.length){

        html += `<b>✅ Points forts</b><br>`;

        forces.forEach(f=>{
            html += `• ${f}<br>`;
        });

        html += `<br>`;
    }

    if(risques.length){

        html += `<b>⚠ Points de vigilance</b><br>`;

        risques.forEach(r=>{
            html += `• ${r}<br>`;
        });
    }

    return html;
}


async function profileTerritory(scope){

    const indicateurs = [
        "POPULATION",
        "REV_MEDIAN",
        "FDEP",
        "PART_IMMIGRES",
        "PREVALENCE",
        "INCIDENCE"
    ];

    let html = "";
    const resultats = {};

    // Séquentiel et non parallèle : on ne veut à aucun moment les 8 fichiers
    // (~28 Mo) simultanément en mémoire. anneeDeVariable() n'en retient que le
    // millésime utile, le reste part au ramasse-miettes entre deux tours.
    for(const v of indicateurs){

        if(!INDEX[v]) continue;

        const year =
            INDEX[v].annees[
                INDEX[v].annees.length - 1
            ];

        const data =
            await anneeDeVariable(v, year);

        if(!data) continue;

        const st =
            statsOf(
                valsScope(data,scope)
            );

        if(!st) continue;
        resultats[v] = st.med;

        // Repère national (même année) pour situer Prévalence/Incidence : un nombre
        // brut de cas ne veut rien dire seul, il faut le comparer à la médiane France.
        if(v==="PREVALENCE" || v==="INCIDENCE"){
            const stNat = statsOf(valsScope(data,null));
            if(stNat) resultats[v+"_NAT"] = stNat.med;
        }

        html += `
            <br>
            <b>${LIBELLES[v]}</b>

            <br>

            Médiane :
            ${fmtD(st.med)}
            <br>
        `;
    }

   if(!html)
       return "<br>Aucun indicateur disponible pour ce territoire.";

   html += analyseTerritoire(
    resultats
);

return html;
}

function compareRegionsText(region1,region2,variable){

    return `
        <b>Comparaison territoriale</b>

        <br><br>

        Région 1 :
        <b>${region1}</b>

        <br>

        Région 2 :
        <b>${region2}</b>

        <br><br>

        Variable analysée :

        <br>

        ${LIBELLES[variable]}

        <br><br>

        Consultez les indicateurs
        statistiques affichés sur la carte
        pour comparer les deux territoires.
    `;
}

function territoiresPrioritairesMessage(){

    return `
        <b>Territoires prioritaires EEPATHO</b>

        <br><br>

        Sont considérés comme prioritaires
        les territoires cumulant :

        <ul>
            <li>forte défavorisation sociale</li>
            <li>faible accessibilité aux soins</li>
            <li>offre spécialisée limitée</li>
        </ul>

        Utilisez les couches FDep
        et Durée d'accès CHU
        pour les identifier.
    `;
}



function interpreterStats(st){

    let txt = "";

    if(st.mean > st.med * 1.5){

        txt += `
        <br><br>

        La moyenne est nettement supérieure
        à la médiane.

        Cela suggère la présence de quelques
        communes aux valeurs très élevées.
        `;
    }

    if(st.max > st.med * 10){

        txt += `
        <br><br>

        Les disparités territoriales semblent
        particulièrement importantes.
        `;
    }

    return txt;
}

// Charge le millésime utile à la volée (anneeDeVariable) au lieu de compter sur un
// ALL_DATA préchargé qui n'existe plus : ces calculs renvoyaient systématiquement
// null depuis le passage au chargement à la demande si on les laissait tels quels.
async function calculMedianeTerritoire(variable, region){

    if(!INDEX[variable] || !REGIONS[region])
        return null;

    const year =
        INDEX[variable].annees[
            INDEX[variable].annees.length - 1
        ];

    const data =
        await anneeDeVariable(variable, year);

    if(!data)
        return null;

    const st =
        statsOf(
            valsScope(
                data,
                new Set(REGIONS[region])
            )
        );

    return st ? st.med : null;
}

// Pour les variables d'EFFECTIF (population, nombre de cas...), la MÉDIANE communale
// n'a pas de sens comme "valeur de la région" : elle donne la population/le nombre de cas
// d'une commune typique (quelques centaines/milliers), pas le total régional (millions) —
// c'est ce qui produisait des réponses du chatbot lues comme fausses (ex. "Population
// municipale Bretagne : 1 392,5" au lieu d'~3,3 M). calculSommeTerritoire() fait la somme
// des communes connues du périmètre à la place ; cf. SOMME_VARS dans comparerRegions().
async function calculSommeTerritoire(variable, region){

    if(!INDEX[variable] || !REGIONS[region])
        return null;

    const year =
        INDEX[variable].annees[
            INDEX[variable].annees.length - 1
        ];

    const data =
        await anneeDeVariable(variable, year);

    if(!data)
        return null;

    const arr =
        valsScope(
            data,
            new Set(REGIONS[region])
        );

    return arr.length ? arr.reduce((x,y)=>x+y,0) : null;
}

// Trouve jusqu'à 2 régions dans la question, dans l'ordre où elles apparaissent
function deuxRegions(q){
  const qq = q.replace(/-/g," ");
  const found = [];
  for(const nom of Object.keys(REGIONS)){
    const phrase = norm(nom).replace(/-/g," ");
    const idx = qq.indexOf(phrase);
    if(idx >= 0) found.push([idx, nom]);
  }
  found.sort((a,b)=>a[0]-b[0]);          // ordre d'apparition dans la phrase
  const uniq = [];
  for(const [,nom] of found){ if(!uniq.includes(nom)) uniq.push(nom); }
  return uniq.slice(0,2);
}

async function comparerRegions(regionA, regionB){

    const indicateurs = [
        "POPULATION",
        "REV_MEDIAN",
        "FDEP",
        "PREVALENCE",
        "INCIDENCE"
    ];

    // Variables d'EFFECTIF (comptage) : la région affiche leur SOMME (population totale,
    // total de cas), pas la médiane communale — cf. calculSommeTerritoire(). Les autres
    // (revenu, indice, durée, densité) restent des médianes : ce sont des indicateurs de
    // "commune typique", pas des quantités qui s'additionnent.
    const SOMME_VARS = new Set(["POPULATION","PREVALENCE","INCIDENCE"]);

    let html = `
        <b>Comparaison territoriale</b>

        <br><br>

        <b>${regionA}</b>
        vs
        <b>${regionB}</b>

        <br><br>
    `;

    for(const v of indicateurs){

        const calc = SOMME_VARS.has(v) ? calculSommeTerritoire : calculMedianeTerritoire;

        const a = await calc(v, regionA);
        const b = await calc(v, regionB);

        if(a==null || b==null)
            continue;

        // Prévalence/Incidence : somme des seules communes NON masquées (secret statistique
        // < 10 cas exclu, comme partout ailleurs dans l'appli) — donc un plancher, jamais le
        // vrai total régional. Précisé dans le libellé plutôt qu'un simple "(total)", qui
        // laisserait croire à un chiffre exhaustif.
        const suffixe = !SOMME_VARS.has(v) ? " (médiane communale)"
          : (v==="PREVALENCE"||v==="INCIDENCE") ? " (total, communes non masquées)"
          : " (total)";

        html += `
            <b>${LIBELLES[v]}${suffixe}</b>

            <br>

            ${regionA} :
            ${fmtD(a)}

            <br>

            ${regionB} :
            ${fmtD(b)}

            <br><br>
        `;
    }

    html += `<hr>`;

const revA =
    await calculMedianeTerritoire(
        "REV_MEDIAN",
        regionA
    );

const revB =
    await calculMedianeTerritoire(
        "REV_MEDIAN",
        regionB
    );

if(
    revA != null &&
    revB != null
){

    html += `<b>Conclusion</b><br><br>`;

    if(revA > revB){

        html += `
            ${regionA} présente
            un revenu médian plus élevé
            que ${regionB}.
        `;

    }else{

        html += `
            ${regionB} présente
            un revenu médian plus élevé
            que ${regionA}.
        `;
    }

    html += `<br><br>`;
}
// Score sur 3 critères. Un critère n'est compté que si la donnée existe pour LES DEUX
// régions : auparavant, une valeur manquante donnait `null > null` = faux, donc un point
// offert à la région B sans le moindre fondement — le « territoire le plus favorable »
// pouvait ainsi être désigné par une absence de donnée. Le dénominateur suit le nombre
// de critères réellement évalués.
let scoreA = 0;
let scoreB = 0;
let criteres = 0;

// `mieux` vaut -1 quand la valeur la PLUS BASSE est la plus favorable (défavorisation,
// temps d'accès), +1 quand c'est la plus haute (revenu).
const depart = [
    ["REV_MEDIAN",     +1],
    ["FDEP",           -1]
];

for(const [variable, mieux] of depart){

    // REV_MEDIAN vient d'être calculé juste au-dessus : on réutilise au lieu de
    // retélécharger le fichier une seconde fois.
    const va = variable==="REV_MEDIAN" ? revA : await calculMedianeTerritoire(variable, regionA);
    const vb = variable==="REV_MEDIAN" ? revB : await calculMedianeTerritoire(variable, regionB);

    if(va == null || vb == null || va === vb) continue;

    criteres++;
    if((va > vb ? +1 : -1) === mieux) scoreA++;
    else scoreB++;
}

if(criteres){

    const gagnante = scoreA > scoreB ? regionA : regionB;
    const score    = Math.max(scoreA, scoreB);

    html += `
        <hr>

        <b>🏆 Territoire le plus favorable</b>

        <br><br>

        ${gagnante}

        <br>

        Score :
        ${score} / ${criteres}
    `;

    if(criteres < depart.length)
        html += `<br><span style="font-size:11px;opacity:.75">Calculé sur ${criteres} critère${criteres>1?"s":""} sur ${depart.length} — les autres manquent de données comparables.</span>`;
}

return html;
}

// ---- Contour (silhouette) d'un ensemble de communes -----------------------------
// Le GeoJSON est simplifié commune par commune : les frontières mitoyennes n'ont PAS
// des coordonnées identiques, donc une dissolution par parité d'arêtes échoue (elle
// laisse le maillage communal, qui masque le choroplèthe). On rastérise donc la région
// (test point-dans-polygone sur une grille, avec index spatial), puis on extrait le
// contour inside/outside (marching squares), on chaîne les segments, on lisse (Chaikin)
// et on retire les micro-boucles parasites. 100% JS vanilla, aucune librairie.
const _OUTLINE_CACHE = {};   // cache par région (clé = préfixes triés) pour éviter le recalcul
function contourRegion(codesSet){
  if(!GEO || !GEO.features) return [];
  const cacheKey = [...codesSet].sort().join(",");
  if(_OUTLINE_CACHE[cacheKey]) return _OUTLINE_CACHE[cacheKey];

  // 1) polygones de la région + bbox globale
  const polys=[]; let MINX=1e9,MINY=1e9,MAXX=-1e9,MAXY=-1e9;
  const handle=(pc)=>{ let a=[1e9,1e9,-1e9,-1e9];
    for(const ring of pc) for(const p of ring){ if(p[0]<a[0])a[0]=p[0]; if(p[0]>a[2])a[2]=p[0]; if(p[1]<a[1])a[1]=p[1]; if(p[1]>a[3])a[3]=p[1]; }
    polys.push({coords:pc,bb:a});
    if(a[0]<MINX)MINX=a[0]; if(a[1]<MINY)MINY=a[1]; if(a[2]>MAXX)MAXX=a[2]; if(a[3]>MAXY)MAXY=a[3];
  };
  for(const f of GEO.features){
    const code=(f.properties[CLE]||"");
    if(!codesSet.has(code.slice(0,2))) continue;   // filtre par préfixe de département (chaînes INSEE)
    const g=f.geometry; if(!g) continue;
    if(g.type==="Polygon") handle(g.coordinates);
    else if(g.type==="MultiPolygon") g.coordinates.forEach(handle);
  }
  if(!polys.length){ _OUTLINE_CACHE[cacheKey]=[]; return []; }

  const W=MAXX-MINX, H=MAXY-MINY;
  const cell=Math.max(W,H)/380 || 0.01;          // ~résolution de la grille (bord long ≈ 380 cases)
  const nx=Math.ceil(W/cell)+2, ny=Math.ceil(H/cell)+2;

  // 2) index spatial grossier (buckets) pour accélérer le test point-dans-région
  const BK=64, bx=W/BK||1, by=H/BK||1;
  const buckets=Array.from({length:BK*BK},()=>[]);
  const bidx=(x,y)=>{ let i=Math.floor((x-MINX)/bx), j=Math.floor((y-MINY)/by);
    if(i<0)i=0; if(i>=BK)i=BK-1; if(j<0)j=0; if(j>=BK)j=BK-1; return j*BK+i; };
  polys.forEach((p,pi)=>{
    const i0=Math.max(0,Math.floor((p.bb[0]-MINX)/bx)), i1=Math.min(BK-1,Math.floor((p.bb[2]-MINX)/bx));
    const j0=Math.max(0,Math.floor((p.bb[1]-MINY)/by)), j1=Math.min(BK-1,Math.floor((p.bb[3]-MINY)/by));
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) buckets[j*BK+i].push(pi);
  });
  const inRing=(x,y,r)=>{ let ins=false;
    for(let i=0,j=r.length-1;i<r.length;j=i++){ const xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];
      if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins; }
    return ins; };
  const inPoly=(x,y,pc)=>{ if(!inRing(x,y,pc[0])) return false;
    for(let k=1;k<pc.length;k++){ if(inRing(x,y,pc[k])) return false; } return true; };  // trous
  const inReg=(x,y)=>{ const b=buckets[bidx(x,y)];
    for(const pi of b){ const bb=polys[pi].bb; if(x<bb[0]||x>bb[2]||y<bb[1]||y>bb[3]) continue;
      if(inPoly(x,y,polys[pi].coords)) return true; } return false; };

  // 3) grille inside + extraction des segments frontière (marching squares "cases")
  const inside=new Uint8Array(nx*ny);
  for(let j=0;j<ny;j++){ const y=MINY+(j-0.5)*cell;
    for(let i=0;i<nx;i++){ inside[j*nx+i]=inReg(MINX+(i-0.5)*cell, y)?1:0; } }
  const segs=[];
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const c=inside[j*nx+i];
    if(i+1<nx && c!==inside[j*nx+i+1]){ const x=MINX+i*cell+cell/2;
      segs.push([[x,MINY+(j-1)*cell+cell/2],[x,MINY+j*cell+cell/2]]); }
    if(j+1<ny && c!==inside[(j+1)*nx+i]){ const y=MINY+j*cell+cell/2;
      segs.push([[MINX+(i-1)*cell+cell/2,y],[MINX+i*cell+cell/2,y]]); }
  }

  // 4) chaînage des segments en polylignes
  const key=p=>Math.round((p[0]-MINX)/cell)+","+Math.round((p[1]-MINY)/cell);
  const nodes=new Map();
  for(const [a,b] of segs){ const ka=key(a),kb=key(b);
    if(!nodes.has(ka)) nodes.set(ka,{pt:a,adj:[]});
    if(!nodes.has(kb)) nodes.set(kb,{pt:b,adj:[]});
    nodes.get(ka).adj.push(kb); nodes.get(kb).adj.push(ka); }
  const eid=(k1,k2)=> k1<k2 ? k1+"#"+k2 : k2+"#"+k1;
  const used=new Set(); let lines=[];
  for(const [startK,node] of nodes){
    for(const nb of node.adj){
      if(used.has(eid(startK,nb))) continue;
      const line=[node.pt]; let prevK=startK, curK=nb;
      used.add(eid(prevK,curK)); line.push(nodes.get(curK).pt);
      while(true){
        const adj=nodes.get(curK).adj; let nextK=null;
        for(const cand of adj){ if(cand===prevK) continue; if(used.has(eid(curK,cand))) continue; nextK=cand; break; }
        if(nextK===null) break;
        used.add(eid(curK,nextK)); line.push(nodes.get(nextK).pt); prevK=curK; curK=nextK;
      }
      lines.push(line);
    }
  }

  // 5) filtre anti-parasites : on retire les micro-boucles (lacs/enclaves d'une case)
  const diagMin=cell*4;
  lines=lines.filter(l=>{ let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;
    for(const p of l){ if(p[0]<mnx)mnx=p[0]; if(p[0]>mxx)mxx=p[0]; if(p[1]<mny)mny=p[1]; if(p[1]>mxy)mxy=p[1]; }
    return Math.hypot(mxx-mnx,mxy-mny) >= diagMin; });

  // 6) lissage Chaikin (2 passes) — arrondit l'escalier de la grille
  const chaikin=(pts)=>{ if(pts.length<3) return pts;
    const out=[pts[0]];
    for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1];
      out.push([a[0]*0.75+b[0]*0.25, a[1]*0.75+b[1]*0.25]);
      out.push([a[0]*0.25+b[0]*0.75, a[1]*0.25+b[1]*0.75]); }
    out.push(pts[pts.length-1]); return out; };
  lines=lines.map(l=>chaikin(chaikin(l)));

  _OUTLINE_CACHE[cacheKey]=lines;
  return lines;   // tableau de polylignes = coordinates d'un MultiLineString
}

// Surbrillance des deux régions comparées : SILHOUETTE bleue (A) / orange (B) uniquement.
// On ne teinte plus chaque commune (ça masquait le choroplèthe) — on trace seulement
// le contour extérieur de chaque région, sur une source GeoJSON dédiée "compare-outline".
function surlignerComparaison(regionA, regionB){
  const codesA = new Set((REGIONS[regionA]||[]).map(String));
  const codesB = new Set((REGIONS[regionB]||[]).map(String));
  const fc = { type:"FeatureCollection", features:[
    { type:"Feature", properties:{cmp:"A"}, geometry:{ type:"MultiLineString", coordinates:contourRegion(codesA) } },
    { type:"Feature", properties:{cmp:"B"}, geometry:{ type:"MultiLineString", coordinates:contourRegion(codesB) } }
  ]};
  if(!map.getSource("compare-outline")) map.addSource("compare-outline",{ type:"geojson", data:fc });
  else map.getSource("compare-outline").setData(fc);

  const colorExpr = ["match",["get","cmp"], "A", CMP_COLOR_A, "B", CMP_COLOR_B, TRANSP];
  if(!map.getLayer("communes-compare")){
    // halo blanc discret dessous + trait de couleur net dessus, pour bien détacher la silhouette
    map.addLayer({ id:"communes-compare-halo", type:"line", source:"compare-outline",
      layout:{ "line-join":"round", "line-cap":"round" },
      paint:{ "line-color":"#ffffff", "line-width":5.5, "line-opacity":0.55 } });
    map.addLayer({ id:"communes-compare", type:"line", source:"compare-outline",
      layout:{ "line-join":"round", "line-cap":"round" },
      paint:{ "line-color":colorExpr, "line-width":3, "line-opacity":0.95,
        "line-opacity-transition":{duration:300} } });
  } else {
    map.setPaintProperty("communes-compare","line-color",colorExpr);
    map.setLayoutProperty("communes-compare","visibility","visible");
    map.setLayoutProperty("communes-compare-halo","visibility","visible");
    map.setPaintProperty("communes-compare","line-opacity",0.95);
  }
}
// Retour à la normale : masque la silhouette (on garde la source/les couches pour
// éviter de les recréer à chaque aller-retour).
function effacerComparaison(){
  if(map.getLayer("communes-compare")) map.setLayoutProperty("communes-compare","visibility","none");
  if(map.getLayer("communes-compare-halo")) map.setLayoutProperty("communes-compare-halo","visibility","none");
}

// Bandeau "Comparaison : RégionA ⇄ RégionB" sur la carte (avec rappel des couleurs)
function majBandeauComparaison(a, b){
  let el = document.getElementById("cmp-banner");
  if(!el){
    el = document.createElement("div");
    el.id = "cmp-banner";
    el.style.cssText =
      "position:absolute;top:64px;left:50%;transform:translateX(-50%);z-index:5;"+
      "background:rgba(20,32,48,.94);color:#fff;font-family:'Space Grotesk',sans-serif;"+
      "font-weight:600;font-size:13px;padding:7px 16px;border-radius:999px;"+
      "box-shadow:0 4px 16px rgba(15,25,40,.25);display:flex;align-items:center;gap:8px;cursor:pointer";
    el.title = "Cliquer pour quitter la comparaison";
    el.onclick = ()=>{ REGIONS_COMPAREES=[]; el.remove();
      document.getElementById("sel-region").value=""; remplirDepts(); appliquerFiltre(); };
    document.getElementById("map").appendChild(el);
  }
  const pastille = c => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;`+
    `background:${c};box-shadow:0 0 0 2px rgba(255,255,255,.35);flex:none"></span>`;
  el.innerHTML = `🔀 Comparaison : `+
    `<span style="display:inline-flex;align-items:center;gap:5px">${pastille(CMP_COLOR_A)}<b>${a}</b></span>`+
    `&nbsp;⇄&nbsp;`+
    `<span style="display:inline-flex;align-items:center;gap:5px">${pastille(CMP_COLOR_B)}<b>${b}</b></span>`+
    `&nbsp;<span style="opacity:.8">✕</span>`;
}

async function repondre(question){
  const q = norm(question);

  // --- réponses conversationnelles simples (n'agissent pas sur la carte) ---
  if(/^(bonjour|bonsoir|salut|coucou|hello|hey|yo|bonne journee)\b/.test(q) && q.length < 22){
    return pick([
      "Bonjour 👋 Posez-moi une question : « moyenne PM2,5 en Corse », « top 5 revenu en Bretagne », ou « compare Bretagne et Normandie ».",
      "Salut ! Je peux sortir des classements, des moyennes, comparer deux régions ou exporter un CSV. Essayez « nitrates > 40 en Occitanie ».",
      "Bonjour 🙂 Dites-moi une variable et un territoire, par exemple « arsenic à Clermont-Ferrand » ou « profil territorial du Rhône »."
    ]);
  }
  if(/\bmerci\b|\bmerciii?\b|\bnickel\b|c est parfait|tres bien merci/.test(q) && q.length < 26){
    return pick([
      "Avec plaisir ! 🙂 Une autre question ?",
      "De rien — je reste dispo pour un classement, une comparaison ou un export.",
      "Quand vous voulez 👍"
    ]);
  }
  if(/(^|\s)(aide|help|au secours)(\s|$)|comment ca marche|comment (t'|t )?utiliser|que (peux|sais)[- ]?tu (faire|dire)|a quoi (tu sers|ca sert)|quoi (te )?demander|quelles questions|liste des commandes/.test(q)){
    return `Je lis les données du projet et j'agis sur la carte. Quelques exemples :`+
      `<br><span class="bot-eg">moyenne PM2,5 en Corse</span>`+
      `<span class="bot-eg">top 10 arsenic en Bretagne</span>`+
      `<span class="bot-eg">nitrates &gt; 40 en Occitanie</span>`+
      `<span class="bot-eg">combien de communes en Normandie</span>`+
      `<span class="bot-eg">compare Bretagne et Normandie</span>`+
      `<span class="bot-eg">profil territorial du Rhône</span>`+
      `<span class="bot-eg">exporte le revenu en Corse</span>`+
      `<span class="bot-eg">c'est quoi le FDep ?</span>`+
      `<span class="bot-eg">montre le CHU le plus proche</span>`+
      `<span class="bot-eg">passe le fond en satellite</span>`+
      `<span class="bot-eg">top 10 part d'hommes en Corse</span>`+
      `<span class="bot-eg">population 20 ans et plus à Lyon</span>`+
      `<span class="bot-eg">comment afficher les cercles hommes / femmes ?</span>`+
      `<span class="bot-eg">prévalence des maladies du foie en Bretagne</span>`+
      `<span class="bot-eg">top 5 incidence en Occitanie</span>`+
      `<span class="bot-eg">étiologie virale à Marseille</span>`+
      `<span class="bot-eg">établissement cancer le plus proche</span>`+
      `<br>Je tolère les fautes de frappe et je garde en mémoire le dernier territoire (« et le revenu ? »).`;
  }

  // --- easter egg : créateur de l'application (norm() a déjà retiré les accents) ---
  if(/qui (a|as) (cree|creee|fait|concu|developpe|code|realise|imagine|pense|bati|construit|programme|fabrique)\b/.test(q)
     || /\b(createur|creatrice|auteur|autrice|concepteur|conceptrice|developpeur|developpeuse|proprietaire)\b/.test(q)
     || /qui est (derriere|a l origine|le (papa|createur|cerveau))|qui (l a|la) (faite?|creee?|codee?|developpee?)|c est qui qui a (fait|cree|code)/.test(q)){
    return pick([
      `👨‍💻 Cette application a été imaginée et développée par <b>Erwan N'Guessan</b>, le <b>Géomagicien</b> 🪄✨`,
      `Le cerveau derrière cet atlas, c'est <b>Erwan N'Guessan</b> — <b>Géomagicien</b> 🧠🗺️💙`,
      `🚀 Créateur de l'application : <b>Erwan N'Guessan</b>, alias le <b>Géomagicien</b> 🪄`
    ]);
  }

  // =====================================================
  // PETITES INTERACTIONS « HUMAINES » (small talk)
  // Un garde-fou évite d'intercepter une vraie question de données :
  // on ne déclenche ces réponses que si le message ne contient NI chiffre,
  // NI variable reconnue, NI mot-clé d'analyse. Ainsi « super arsenic en
  // Bretagne » part bien vers les stats, mais « super, merci ! » est traité
  // comme un compliment.
  const contientAnalyse = /\b(top|moyenne|moyen|mediane|median|compare|comparer|export|csv|telecharge|combien|classement|palmares|profil|resume|decris|interprete|hotspot|prioritaire|carte|fond|satellite|chu|clcc|cercle|bulle|rond|seuil|superieur|inferieur|plus de|moins de)\b/.test(q);
  const smalltalkSafe = !/\d/.test(q) && !contientAnalyse && !trouverVariable(q) && !trouverRegion(q);

  // --- qui es-tu / es-tu une IA ? (honnêteté + chaleur) ---
  if(smalltalkSafe && /\b(qui es tu|tu es qui|c est qui toi|presente toi|comment tu t appelles?|ton (petit )?nom|tu es (une |un )?(ia|robot|humain|machine|intelligence)|es tu (une |un )?(ia|robot|humain|machine|vraie personne|reel|reelle)|es tu vivant)\b/.test(q)){
    return pick([
      `Je suis l'<b>assistant EEPATHO</b> 🤖 — un guide local qui lit les données du projet et pilote la carte pour vous. Pas un humain, mais je fais de mon mieux pour être clair et utile ! Que voulez-vous explorer ?`,
      `Moi ? L'<b>assistant de recherche EEPATHO</b>. Je fonctionne <b>entièrement en local</b> (aucune donnée ne sort de votre navigateur) et je réponds sur toutes les variables de l'atlas — démographie, accès aux soins, environnement, mais aussi la prévalence, l'incidence et les étiologies des maladies chroniques du foie. Dites-moi une variable et un territoire 🙂`,
      `Un assistant, pas une personne — mais un assistant qui connaît bien l'atlas EEPATHO 🗺️. Je sais classer, comparer, résumer un territoire et exporter en CSV. On commence par quoi ?`
    ]);
  }

  // --- comment ça va ? ---
  if(smalltalkSafe && /\b(ca va|comment (vas|va) tu|tu vas bien|comment tu vas|la forme|ca roule|comment ca va)\b/.test(q)){
    return pick([
      `Au top, merci 🙂 Toujours prêt à fouiller les données. Et vous, sur quoi puis-je vous aider ?`,
      `Ça va très bien — mes 34 733 communes sont bien rangées 😄 Quelle variable regarde-t-on ?`,
      `En pleine forme ! Posez-moi une question : un classement, une moyenne, une comparaison de régions…`
    ]);
  }

  // --- au revoir ---
  if(smalltalkSafe && /\b(au revoir|a bientot|a plus|a tout a l heure|bye|ciao|bonne soiree|a la prochaine|bonne continuation)\b/.test(q)){
    return pick([
      `À bientôt 👋 Revenez quand vous voulez explorer l'atlas.`,
      `Bonne continuation ! Je reste ici si une donnée vous manque 🙂`,
      `À très vite 👋 — l'atlas ne bouge pas d'ici là.`
    ]);
  }

  // --- compliments ---
  if(smalltalkSafe && /\b(bravo|super|genial|geniale|excellent|excellente|parfait|magnifique|impressionnant|j adore|trop (bien|fort)|incroyable|wa?houi?|felicitation|tu es (fort|doue|intelligent|genial|le meilleur|top|utile|efficace)|bien joue|chapeau)\b/.test(q)){
    return pick([
      `Merci beaucoup ! 😊 Je continue : un classement, une comparaison ou un export vous ferait plaisir ?`,
      `Content que ça vous serve 🙌 On enchaîne sur quelle variable ?`,
      `C'est gentil 🙏 Dites-moi le prochain territoire à explorer.`
    ]);
  }

  // --- humour ---
  if(smalltalkSafe && /\b(blague|raconte (moi )?(une|quelque)|fais moi rire|drole|humour|joke|amuse moi)\b/.test(q)){
    return pick([
      `😄 Pourquoi la commune est-elle allée voir l'assistant ? Parce qu'elle se sentait un peu <i>isolée</i>… surtout côté accès au CHU ! Bon, je suis meilleur en statistiques qu'en blagues. On regarde une vraie donnée ?`,
      `😅 Deux cartographes se disputent : « Mes projections sont exactes ! » — « Les miennes aussi, mais dans une autre <i>projection</i>. » Voilà voilà. Une variable à cartographier ?`,
      `🙂 Mon humour est en couverture partielle, comme certaines variables. Mais mes classements, eux, sont fiables : essayez « top 5 arsenic en Bretagne » !`
    ]);
  }

  // --- réassurance : l'utilisateur est perdu ---
  if(smalltalkSafe && (/\b(perdu|perdue)\b|je (ne )?comprends? (rien|pas)|c est (trop )?complique|je (ne )?sais pas (quoi|comment|par ou)|par ou (je )?commence|aide moi a commencer|je debute/.test(q))){
    return `Pas d'inquiétude, c'est simple 🙂 Le plus souvent il suffit d'une <b>variable</b> + un <b>territoire</b>. Cliquez un exemple :`+
      `<div class="bot-chips" style="margin-top:8px">`+
      `<button class="bot-chip">Moyenne PM2,5 en Corse</button>`+
      `<button class="bot-chip">Top 5 revenu en Bretagne</button>`+
      `<button class="bot-chip">Profil territorial du Rhône</button>`+
      `<button class="bot-chip">Arsenic à Clermont-Ferrand</button>`+
      `</div><span class="bot-hint">Vous pouvez aussi écrire « aide » pour la liste complète de ce que je sais faire.</span>`;
  }

  // --- aide : établissements « traitement du cancer » (ScopeSanté) — testée AVANT le
  //     bloc CHU/CLCC générique juste en dessous, sinon « établissement cancer le plus
  //     proche » y tomberait (il contient aussi « établissement » + « plus proche »). ---
  if(/cancer/.test(q) && /(plus proche|proximite|a proximite|etablissement|hopital|traiteme?nt|chimiotherapie|radiotherapie|chirurgie|se soigner|soigner)/.test(q)){
    return `🎗️ <b>Établissements — traitement du cancer</b><br>`+
      `1. Dans le panneau de gauche, section <b>« Établissements — traitement du cancer »</b>, coche un ou plusieurs groupes : `+
      `<b>chimiothérapie</b>, <b>radiothérapie</b>, chirurgie du <b>sein</b>, du <b>colo-rectal</b> ou <b>gynécologique</b>.<br>`+
      `2. <b>Clique sur une commune</b> : je trace un trait pointillé (couleur du groupe) vers le plus proche établissement de chaque groupe coché, avec la distance à vol d'oiseau, ajoutée directement dans la fiche commune.<br>`+
      `<span class="bot-hint">Position approximative (centroïde de la commune du siège), issue de ScopeSanté — pas l'adresse exacte.</span>`;
  }

  // --- aide : établissements CHU / CLCC + traits de distance noirs (fonctionnalité ajoutée) ---
  if(/(plus proche|a proximite|proximite).*(chu|clcc|etablissement|hopital|hospit)/.test(q)
     || /(chu|clcc|etablissement|hopital|hospit).*(plus proche|a proximite)/.test(q)
     || /(comment|ou).*(afficher|voir|activer|trouver).*(chu|clcc|etablissement)/.test(q)
     || /(afficher|voir|activer|montre|montrer|affiche).*(les )?(chu|clcc|etablissements?)\b/.test(q)
     || /(trait|ligne|liseret|traits).*(noir|distance|chu|clcc)|(chu|clcc).*(trait|ligne)|trait de distance/.test(q)){
    return `🏥 <b>CHU & CLCC les plus proches</b><br>`+
      `1. Dans la <b>Légende</b> (panneau de gauche), coche <b>CHU</b> et/ou <b>CLCC</b> pour afficher les établissements.<br>`+
      `2. <b>Clique sur une commune</b> : je trace un trait noir vers le plus proche de chaque type et j'affiche la distance (vol d'oiseau + routière si disponible) dans la fiche.<br>`+
      `➡️ Trait <b>plein</b> = vers le <b>CHU</b> · trait <b>pointillé</b> = vers le <b>CLCC</b>.`;
  }

  // --- aide : cercles proportionnels hommes / femmes (fonctionnalité ajoutée) ---
  // Testé AVANT les intentions statistiques : « comment afficher les cercles » ne doit
  // pas partir en classement à cause du mot « plus » dans « 20 ans et plus ».
  // \b obligatoire : sans lui, "rond" capture ar-ROND-issement et détourne toute
  // question sur les arrondissements vers cette aide.
  if(/\b(cercles?|bulles?|ronds?|pastilles?)\b|symboles? proportionnels?/.test(q)
     || /(comment|ou|comment est ce que).*(afficher|voir|activer|masquer|enlever).*\b(cercles?|bulles?|ronds?)\b/.test(q)
     || /(hommes? et femmes?|hommes? ou femmes?|par sexe).*(carte|cercle|afficher|voir)/.test(q)){
    return `⚪ <b>Cercles « 20 ans et plus »</b><br>`+
      `1. Coche <b>« Afficher les cercles hommes / femmes »</b> dans le panneau de gauche.<br>`+
      `2. La <b>surface</b> du cercle est proportionnelle à la population de 20 ans et plus ; `+
      `sa <b>couleur</b> donne la part d'hommes : <b style="color:#a4133c">rose = femmes majoritaires</b>, `+
      `<b style="color:#1d4a87">bleu = hommes majoritaires</b>, beige = quasi-parité (49,5–50,5 %).<br>`+
      `3. Une <b>légende cochable</b> apparaît sous celle de la variable : clique une classe pour la masquer.<br>`+
      `4. <b>Survole un cercle</b> pour le détail hommes / femmes de la commune.<br>`+
      `➡️ En vue France seules les <b>500 plus grandes communes</b> sont dessinées ; le reste apparaît en <b>zoomant</b> (c'est voulu : 34 810 cercles d'un coup satureraient la carte).<br>`+
      `<span class="bot-hint">La variable choisie reste affichée en fond, volontairement estompée.</span>`;
  }

  // --- aide : fond de carte (satellite, OSM, etc.) ---
  if(/fond de (la )?carte|changer (le |de )?fond|mode satellite|vue satellite|passe(r)? (le fond )?en satellite|image satellite|fond satellite|openstreetmap|open street map|carte routiere|fond routier|changer la carte/.test(q)){
    return `🗺️ <b>Changer le fond de carte</b> : utilise le menu <b>« Fond de carte »</b> dans le panneau de gauche.<br>`+
      `Choix : <b>Clair</b>, <b>Sombre</b>, <b>Détaillé</b>, <b>Routes</b>, <b>OpenStreetMap</b> et <b>Satellite</b>. `+
      `Le choroplèthe des communes reste affiché par-dessus, quel que soit le fond choisi.`;
  }

  const intentTop = /(plus (eleve|fort|haut|forte|grande?|importantes?)|maximum|\bmaxi?\b|\btop\b|classement|palmares|records?|championne?s?|en tete|premieres?|pire|elevees?)/.test(q);
  const intentBas = /(plus (faible|bas|basse|petites?|rares?)|minimum|\bmini?\b|\bmoins\b|dernieres?|en queue|au plus bas|faibles?)/.test(q);
  const intentMoy = /(moyenne|moyen|en moyenne|typique)/.test(q);
  const intentMed = /(mediane|median|au milieu)/.test(q);
  const intentExport = /(\bexporte?r?\b|\bcsv\b|telecharge|extrai|\bexcel\b|tableur|sauvegarde|\bfichier\b|sors moi|donne moi la liste)/.test(q);
  const intentCombien = /(combien|nombre de communes|quantite|\bcompte\b|\bcompter\b)/.test(q);
  const nMatch = q.match(/\b(\d{1,2})\b/);
  const N = nMatch ? Math.min(Math.max(parseInt(nMatch[1]),1),15) : 5;
const intentResume =
    q.includes("decris") ||
    q.includes("décris") ||
    q.includes("profil") ||
    q.includes("resume") ||
    q.includes("résumé");

const intentInterpret =
    q.includes("interprete") ||
    q.includes("interprète");

const intentExplique =
    q.includes("explique") ||
    q.includes("c est quoi") ||
    q.includes("qu est ce que") ||
    q.includes("methodo") ||
    q.includes("méthodo") ||
    q.includes("source") ||
    q.includes("definition") ||
    q.includes("définition") ||
    q.includes("fiabilite") ||
    q.includes("fiabilité") ||
    q.includes("limite");

// "compare" seul ratait "comparaison"/"comparer"/"comparez"/"comparatif" (aucun ne
// contient la sous-chaîne exacte "compare") : le radical "compar" avec borne de mot à
// GAUCHE couvre toutes ces formes sans capter un mot qui contiendrait "compar" par hasard.
const intentCompare =
    /(^|[^a-z0-9])compar/.test(q);

const intentPriority =
    q.includes("territoire prioritaire") ||
    q.includes("territoires prioritaires") ||
    q.includes("communes prioritaires");
    const intentForces =
    q.includes("points forts") ||
    q.includes("forces");

const intentFaiblesses =
    q.includes("points faibles") ||
    q.includes("vigilance") ||
    q.includes("faiblesses");

const intentHotspotFdep =
    q.includes("plus defavorise") ||
    q.includes("plus défavorisé") ||
    q.includes("hotspot fdep");


// === COMPARAISON (priorité absolue : sort avant tout filtrage simple) ===
  if(intentCompare){
    const regs = deuxRegions(q);
    if(regs.length >= 2){
      const regionA = regs[0], regionB = regs[1];
      REGIONS_COMPAREES = [regionA, regionB];
      if(typeof majBandeauComparaison === "function") majBandeauComparaison(regionA, regionB);

      const codes = [...REGIONS[regionA], ...REGIONS[regionB]].map(String);
      const deptCode = ["slice", ["get", CLE], 0, 2];
      const filtre = ["in", deptCode, ["literal", codes]];
      map.setFilter("communes-fill", filtre);
      map.setFilter("communes-line", filtre);
      if(map.getLayer("communes-fill-nodata")) map.setFilter("communes-fill-nodata", filtre);
      surlignerComparaison(regionA, regionB);   // liseré bleu (A) / orange (B) sur la carte
      zoomSur(new Set(codes));
      majCompteur();
      // Ce chemin n'appelle pas dessiner() : sans ça les cercles resteraient sur
      // France entière alors que leur légende, elle, compterait déjà sur les deux
      // régions comparées. No-op si les cercles sont éteints.
      majAnneeCercles();

      const rappelCouleurs =
        `<div style="margin-bottom:8px;font-size:12px;color:var(--muted)">`+
        `<span style="color:${CMP_COLOR_A};font-weight:700">■</span> ${regionA} &nbsp;·&nbsp; `+
        `<span style="color:${CMP_COLOR_B};font-weight:700">■</span> ${regionB} — repérées par ces couleurs sur la carte.</div>`;
      return rappelCouleurs + await comparerRegions(regionA, regionB);
    }
    return `Pour comparer, nomme <b>deux régions</b>. Exemple : <b>compare Bretagne et Normandie</b>.`;
  }


  // 1) variable : si trouvée, on bascule l'appli dessus
  const varKey = trouverVariable(q);
  if(varKey && document.getElementById("sel-var").value!==varKey){
    document.getElementById("sel-var").value = varKey;
    await chargerVariable(varKey);
  }
  const v = document.getElementById("sel-var").value;

  // 2) territoire : chaque question est en principe INDÉPENDANTE
  //    région/dept mentionné -> on filtre ; rien mentionné -> retour France entière
  //    SAUF si la question démarre par une relance explicite ("et..","aussi..","pareil..")
  //    et qu'aucun territoire n'est cité : on reprend alors le dernier territoire utilisé.
  const region = trouverRegion(q);
  const dept = trouverDept(q);
  const relance = /^(et\b|aussi\b|pareil\b|idem\b|meme chose\b|toujours\b|et (pour|en|dans|la|le|les|au|aux)\b|la meme|meme question|et alors|ici\b)/.test(q);
  const rSel=document.getElementById("sel-region");
  const dSel=document.getElementById("sel-dept");
  if(region){
    rSel.value=region; remplirDepts();
    if(dept){ dSel.value=dept; }
    appliquerFiltre();
  } else if(dept){
    rSel.value=""; remplirDepts(); dSel.value=dept; appliquerFiltre();
  } else if(relance && (LAST_REGION||LAST_DEPT)){
    rSel.value=LAST_REGION; remplirDepts();
    if(LAST_DEPT){ dSel.value=LAST_DEPT; }
    appliquerFiltre();
  } else {
    rSel.value=""; remplirDepts(); appliquerFiltre();   // France entière
  }
  const scope = scopeSet();
  const curRegion=rSel.value, curDept=dSel.value;
  LAST_REGION = curRegion; LAST_DEPT = curDept;
  const lieu = curDept ? (DEPTS[curDept]||curDept) : (curRegion||"France entière");
  
// =====================================================
// PROFIL TERRITORIAL
// =====================================================

if(intentResume){

    return `
        <b>Profil territorial : ${lieu}</b>

        <br><br>

        ${await profileTerritory(scope)}
    `;
}

// =====================================================
// INTERPRÉTATION DE LA CARTE
// =====================================================

if(intentInterpret){

    return interpretMap();
}

// =====================================================
// FICHE MÉTHODO / SOURCE DE LA VARIABLE
// =====================================================

if(intentExplique){

    return ficheMethodo(v);
}

// =====================================================
// TERRITOIRES PRIORITAIRES EEPATHO
// =====================================================

if(intentPriority){

    return territoiresPrioritairesMessage();
}

// =====================================================
// HOTSPOT DÉFAVORISATION
// =====================================================

if(intentHotspotFdep){

    if(!await afficherHotspot("FDEP"))
        return "Je n'ai pas réussi à charger l'indice de défavorisation (FDep). Réessayez dans un instant.";

    return pick([
      "Les communes présentant les niveaux de défavorisation les plus élevés sont actuellement affichées.",
      "J'ai isolé sur la carte les communes les plus défavorisées.",
      "Voici, en carte, les zones cumulant le plus de défavorisation sociale."
    ]);
}

// =====================================================


// =====================================================
// COMPARAISON ENTRE DEUX RÉGIONS
// =====================================================


if(intentForces){

    return `
        Demandez :

        <br><br>

        Profil territorial Bretagne

        <br>

        Profil territorial Rhône

        <br>

        Profil territorial Corse

        <br><br>

        Les points forts sont calculés
        automatiquement dans la synthèse.
    `;
}

if(intentFaiblesses){

    return `
        Les points de vigilance apparaissent
        automatiquement dans la synthèse EEPATHO
        du territoire étudié.
    `;
}

  const a = document.getElementById("sel-year").value;
  const lib = LIBELLES[v]||v;
  const data = (CURRENT && CURRENT[a]) || {};
  if(!CURRENT)
    return "Les données ne sont pas encore chargées. Patientez un instant puis reposez votre question.";


  

  // 3) commune précise ?
  const intentStat = intentTop||intentBas||intentMoy||intentMed||intentExport||intentCombien;
  const commune = intentStat ? null : trouverCommune(q);
  if(commune){
    const val=data[commune];
    flyToCommune(commune);
    const props={}; props[CLE]=commune; props.NOM=NOM_BY_CODE[commune];
    ouvrirFicheCommune(commune, props);
    const txt = val==null ? "pas de donnée" : (typeof val==="number"?val.toLocaleString("fr-FR"):val);
    return `À <b>${NOM_BY_CODE[commune]}</b> (${commune}), ${lib} (${a}) : <b>${txt}</b>. J'ai zoomé et ouvert sa fiche.`;
  }

 // 4-pré) requête à seuil : "fdep > 0,8", "revenu inferieur a 15 000", "plus de 30 km"
  // IMPORTANT : testé AVANT le classement car "moins de X" contient "moins" (intentBas)
  const cfg=CONFIG[v]||{};
  const M_GT = q.match(/(?:superieure?s? a|>=?|plus de|au[- ]dela de|depassen?t?)\s*([\d]+(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/);
  const M_LT = q.match(/(?:inferieure?s? a|<=?|moins de|en dessous de)\s*([\d]+(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/);
  const seuilMatch = M_GT || M_LT;
  if(seuilMatch && cfg.type!=="cat"){
    const brut = seuilMatch[1].replace(/[ \u00a0]/g,"").replace(",",".");
    const seuil = parseFloat(brut);
    if(isFinite(seuil)){
      const sens = M_GT ? "gt" : "lt";
      const pop=popPourAnnee(a);
      const arr=[]; let popTot=0;
      for(const code in data){ const val=data[code]; if(typeof val!=="number") continue;
        if(scope && !scope.has(code.slice(0,2))) continue;
        if(sens==="gt" ? val>seuil : val<seuil){
          const p=pop.vals ? (pop.vals[code]||0) : null;
          arr.push([code,val,p]); if(p) popTot+=p; } }
      const opTxt = sens==="gt" ? "supérieur à" : "inférieur à";
      const seuilTxt = seuil.toLocaleString("fr-FR");
      if(!arr.length)
        return `Aucune commune avec <b>${lib}</b> ${opTxt} <b>${seuilTxt}</b> (${a}, ${lieu}).`;
      // tri : les plus extrêmes d'abord (desc si >, asc si <)
      arr.sort((x,y)=> sens==="gt" ? y[1]-x[1] : x[1]-y[1]);
      const popTxt = pop.vals ? ` · <b>${fmtPop(popTot)}</b> hab concernés (pop. ${pop.annee})` : "";
      if(intentExport){
        exporterCSV(arr.map(([c,val,p])=>[c, NOM_AFF[c]||NOM_BY_CODE[c]||"", val, p]),
          `EEPATHO_${v}_${a}_seuil.csv`);
        return `📄 CSV téléchargé : <b>${arr.length.toLocaleString("fr-FR")}</b> communes — ${lib} ${opTxt} ${seuilTxt} (${a}, ${lieu})${popTxt}.<span class="bot-hint">⚠️ Dans Excel : importer code_insee en texte (zéros de tête, Corse 2A/2B).</span>`;
      }
      const MAXAFF = 10;
      const liste = arr.slice(0,MAXAFF).map(([c,val,p],i)=>
        `<div class="bot-item" data-code="${c}">${i+1}. <b>${NOM_BY_CODE[c]||c}</b> — ${val.toLocaleString("fr-FR")}${p!=null?` · ${fmtPop(p)} hab`:""}</div>`).join("");
      const suite = arr.length>MAXAFF
        ? `<span class="bot-hint">…et ${(arr.length-MAXAFF).toLocaleString("fr-FR")} autres. Affine avec une région/département, ou dis « exporte » pour le CSV complet.</span>`
        : `<span class="bot-hint">Clique une commune pour zoomer.</span>`;
      const intro = pick([
        `<b>${arr.length.toLocaleString("fr-FR")}</b> communes ont ${lib} ${opTxt} ${seuilTxt}`,
        `J'en trouve <b>${arr.length.toLocaleString("fr-FR")}</b> avec ${lib} ${opTxt} ${seuilTxt}`,
        `${lib} ${opTxt} ${seuilTxt} : <b>${arr.length.toLocaleString("fr-FR")}</b> communes concernées`
      ]);
      const nDonnees = Object.keys(data).filter(c=>!scope||scope.has(c.slice(0,2))).length;
      return `${intro}${popTxt} (${a}, ${lieu}) :<div class="bot-list">${liste}</div>${suite}${avertissementCouverture(nDonnees, scope)}`;
    }
  }

  // 4-bis) dénombrement : "combien de communes …" -> N communes + population concernée
  if(intentCombien && !intentTop && !intentBas && !seuilMatch && !intentExport){
    const pop=popPourAnnee(a);
    let n=0, popTot=0;
    for(const code in data){ if(data[code]==null) continue;
      if(scope && !scope.has(code.slice(0,2))) continue;
      n++; if(pop.vals) popTot+=pop.vals[code]||0; }
    if(!n) return `Aucune commune ne dispose d'une valeur de <b>${lib}</b> (${a}, ${lieu}).`;
    const popTxt = pop.vals ? ` — soit <b>${fmtPop(popTot)}</b> habitants (pop. ${pop.annee})` : "";
    return pick([
      `En <b>${lieu}</b>, <b>${n.toLocaleString("fr-FR")}</b> communes sont renseignées pour ${lib} en ${a}${popTxt}.`,
      `Je compte <b>${n.toLocaleString("fr-FR")}</b> communes avec une valeur de ${lib} sur ${lieu} (${a})${popTxt}.`,
      `${lib} (${a}, ${lieu}) : <b>${n.toLocaleString("fr-FR")}</b> communes couvertes${popTxt}.`
    ]) + avertissementCouverture(n, scope);
  }

 // 4) classement (top / bas)
  if((intentTop||intentBas) && cfg.type!=="cat"){
    const pop=popPourAnnee(a);
    const arr=[];
    for(const code in data){ const val=data[code]; if(typeof val!=="number") continue;
      if(scope && !scope.has(code.slice(0,2))) continue;
      arr.push([code,val,pop.vals?(pop.vals[code]||0):null]); }
    if(!arr.length) return `Aucune donnée pour ${lib} sur ${lieu}.`;
    arr.sort((x,y)=> intentBas ? x[1]-y[1] : y[1]-x[1]);
    if(intentExport){
      exporterCSV(arr.map(([c,val,p])=>[c, NOM_AFF[c]||NOM_BY_CODE[c]||"", val, p]),
        `EEPATHO_${v}_${a}_classement.csv`);
      return `📄 CSV téléchargé : classement complet, <b>${arr.length.toLocaleString("fr-FR")}</b> communes (${lib}, ${a}, ${lieu}), tri ${intentBas?"croissant":"décroissant"}.<span class="bot-hint">⚠️ Dans Excel : importer code_insee en texte (zéros de tête, Corse 2A/2B).</span>`;
    }
    const liste=arr.slice(0,N).map(([c,val,p],i)=>
      `<div class="bot-item" data-code="${c}">${i+1}. <b>${NOM_BY_CODE[c]||c}</b> — ${val.toLocaleString("fr-FR")}${p!=null?` · ${fmtPop(p)} hab`:""}</div>`).join("");
    const tete = intentBas
      ? pick(["Les communes les plus faibles","En bas du classement","Les valeurs les plus basses"])
      : pick(["Les communes les plus élevées","En tête du classement","Les valeurs les plus fortes"]);
    return `${tete} pour <b>${lib}</b> (${a}, ${lieu}) :<div class="bot-list">${liste}</div><span class="bot-hint">Clique une commune pour zoomer.</span>${avertissementCouverture(arr.length, scope)}`;
  }

  // 4-ter) export CSV simple : "exporte les nitrates en bretagne" (sans seuil ni top)
  if(intentExport){
    const pop=popPourAnnee(a);
    const lignes=[];
    for(const code in data){ const val=data[code]; if(val==null) continue;
      if(scope && !scope.has(code.slice(0,2))) continue;
      lignes.push([code, NOM_AFF[code]||NOM_BY_CODE[code]||"", val, pop.vals?(pop.vals[code]||0):null]); }
    if(!lignes.length) return `Rien à exporter pour ${lib} (${a}, ${lieu}).`;
    lignes.sort((x,y)=> x[0]<y[0]?-1:1);
    exporterCSV(lignes, `EEPATHO_${v}_${a}.csv`);
    return `📄 CSV téléchargé : <b>${lignes.length.toLocaleString("fr-FR")}</b> communes (${lib}, ${a}, ${lieu}).<span class="bot-hint">⚠️ Dans Excel : importer code_insee en texte (zéros de tête, Corse 2A/2B).</span>`;
  }

  // 4-quater) REPLI INTELLIGENT : la question n'a déclenché AUCUN signal
  // (pas de variable reconnue, pas de territoire, pas d'intention, pas de
  // relance). Plutôt que de sortir par défaut les stats de la variable
  // courante (déroutant), on demande gentiment à reformuler et on propose des
  // pistes cliquables. On garde le comportement utile quand une variable OU une
  // intention OU un territoire est présent (on tombe alors dans les stats).
  const rienReconnu = !varKey && !region && !dept && !relance && !intentStat && !seuilMatch;
  if(rienReconnu){
    return pick([
      `Hmm, je ne suis pas sûr d'avoir bien saisi 🤔`,
      `Je n'ai pas tout compris, désolé 🙂`,
      `Reformulons ensemble — je veux bien vous aider !`
    ]) + ` Le plus simple : une <b>variable</b> + un <b>territoire</b>. Par exemple :`+
      `<div class="bot-chips" style="margin-top:8px">`+
      `<button class="bot-chip">Top 5 arsenic en Bretagne</button>`+
      `<button class="bot-chip">Moyenne PM2,5 en Corse</button>`+
      `<button class="bot-chip">Profil territorial du Rhône</button>`+
      `<button class="bot-chip">Compare Bretagne et Normandie</button>`+
      `</div><span class="bot-hint">Ou tapez « aide » pour voir tout ce que je sais faire.</span>`;
  }

  // Relances contextuelles proposées à la fin d'une réponse statistique :
  // reprennent le territoire courant pour rester cohérentes.
  const nomLieu = curDept ? (DEPTS[curDept]||"") : (curRegion||"");
  const enLieu  = nomLieu ? ` en ${nomLieu}` : "";
  const relancesStats =
    `<div class="bot-chips" style="margin-top:9px">`+
    `<button class="bot-chip">Top 5${enLieu}</button>`+
    `<button class="bot-chip">Les plus faibles${enLieu}</button>`+
    `<button class="bot-chip">Exporte${enLieu}</button>`+
    `</div>`;

  // 5) moyenne / médiane / résumé
  if(cfg.type==="cat"){
    const pop=popPourAnnee(a);
    const counts={}; let popTot=0;
    for(const code in data){ const val=data[code]; if(val==null) continue;
      if(scope && !scope.has(code.slice(0,2))) continue;
      counts[val]=(counts[val]||0)+1;
      if(pop.vals) popTot+=pop.vals[code]||0; }
    const tot=Object.values(counts).reduce((x,y)=>x+y,0)||1;
    const txt=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,n])=>{
      const lab=(cfg.labels&&cfg.labels[k])||k; return `${lab} : ${n.toLocaleString("fr-FR")} (${(100*n/tot).toFixed(0)} %)`; }).join(" · ");
    const popTxt = pop.vals ? ` · <b>${fmtPop(popTot)}</b> hab` : "";
    return `<b>${lib}</b> (${a}, ${lieu}) — <b>${tot.toLocaleString("fr-FR")}</b> communes${popTxt} :<br>${txt}.${avertissementCouverture(tot, scope)}`;
  }
  const st=statsOf(valsScope(data, scope));
  if(!st) return `Aucune donnée pour ${lib} sur ${lieu}.`;
  const intro = pick([
    `Voici ${lib} pour ${lieu}`,
    `Pour ${lib} sur ${lieu}`,
    `D'accord — ${lib} sur ${lieu}`,
    `${lib} (${lieu})`
  ]);
  const popStats=popPourAnnee(a); let popTotStats=0;
  if(popStats.vals){ for(const code in data){ if(data[code]==null) continue;
    if(scope && !scope.has(code.slice(0,2))) continue; popTotStats+=popStats.vals[code]||0; } }
  // met en avant la statistique demandée (moyenne si demandée, sinon médiane), sans perdre l'autre
  const lead  = intentMoy ? `moyenne <b>${fmtD(st.mean)}</b>` : `médiane <b>${fmtD(st.med)}</b>`;
  const autre = intentMoy ? `médiane ${fmtD(st.med)}`        : `moyenne ${fmtD(st.mean)}`;
  return `${intro} en ${a} :<br>${lead} · ${autre} · min ${fmtD(st.min)} · max ${fmtD(st.max)} · <b>${st.n.toLocaleString("fr-FR")}</b> communes${popStats.vals?` · <b>${fmtPop(popTotStats)}</b> hab`:''}.${avertissementCouverture(st.n, scope)}${relancesStats}`;
}

function flyToCommune(code){
  const f=GEO.features.find(ft=>(ft.properties[CLE]||"")===code); if(!f) return;
  let minX=180,minY=90,maxX=-180,maxY=-90;
  (function scan(c){ if(typeof c[0]==="number"){ if(c[0]<minX)minX=c[0]; if(c[0]>maxX)maxX=c[0]; if(c[1]<minY)minY=c[1]; if(c[1]>maxY)maxY=c[1]; } else c.forEach(scan); })(f.geometry.coordinates);
  if(minX<=maxX) map.fitBounds([[minX,minY],[maxX,maxY]],{padding:120,maxZoom:11,duration:800});
}

function initAssistant(){
  GEO.features.forEach(f=>{ const nm=f.properties.NOM||f.properties.NOM_COM||"";
    NOM_BY_CODE[f.properties[CLE]] = norm(nm); NOM_AFF[f.properties[CLE]] = nm; });
  const mapDiv=document.getElementById("map");

  const launch=document.createElement("button");
  launch.id="bot-launch"; launch.title="Assistant de recherche EEPATHO";
  launch.setAttribute("aria-label","Ouvrir l'assistant de recherche");
  // pastille « en ligne » + icône bulle de chat
  launch.innerHTML=`<span class="bot-dot" aria-hidden="true"></span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  mapDiv.appendChild(launch);

  const panel=document.createElement("div");
  panel.id="bot-panel";
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-label","Assistant de recherche EEPATHO");
  panel.innerHTML=`
    <div class="bot-head">
      <div class="bot-id">
        <span class="bot-ava" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10v2.5M19.5 10v2.5"/><path d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H12l-3.8 3.2V16H6.5A2.5 2.5 0 0 1 4 13.5v-6A2.5 2.5 0 0 1 6.5 5Z"/><circle cx="9.7" cy="10.3" r="1.05" fill="currentColor" stroke="none"/><circle cx="14.3" cy="10.3" r="1.05" fill="currentColor" stroke="none"/><path d="M9.3 13c1.1 1 4.3 1 5.4 0"/></svg></span>
        <span class="bot-titles"><b>Assistant EEPATHO</b><small><span class="bot-online"></span>en ligne · répond hors-ligne</small></span>
      </div>
      <button id="bot-close" aria-label="Fermer l'assistant">✕</button>
    </div>
    <div id="bot-msgs"></div>
    <div class="bot-input">
      <input id="bot-text" type="text" placeholder="Posez votre question…" autocomplete="off" aria-label="Votre question">
      <button id="bot-send" aria-label="Envoyer">➤</button>
    </div>`;
  mapDiv.appendChild(panel);

  const msgs=panel.querySelector("#bot-msgs");
  const input=panel.querySelector("#bot-text");
  const add=(html,who)=>{ const d=document.createElement("div"); d.className="bot-msg "+who; d.innerHTML=html; msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; };

  add(`Bonjour 👋 Je suis votre <b>assistant EEPATHO</b>. Je lis les données de l'atlas et je pilote la carte pour vous — classements, moyennes, comparaisons de régions, exports CSV, profils de territoire, prévalence/incidence et étiologies des maladies chroniques du foie…<br>
       Essayez par exemple :<br>
       <span class="bot-eg">« moyenne PM2,5 en Corse »</span>
       <span class="bot-eg">« top 5 revenu en Bretagne »</span>
       <span class="bot-eg">« arsenic à Clermont-Ferrand »</span>
       <span class="bot-eg">« montre le CHU le plus proche »</span>
       <span class="bot-eg">« prévalence des maladies du foie en Bretagne »</span>
       <br>💡 J'accepte le langage courant et les fautes de frappe. Tapez <b>« aide »</b> pour tout voir.`,"bot");

       const SUGGESTIONS = [
    "Top 5 arsenic en Bretagne",
    "Moyenne revenu en Corse",
    "Compare Bretagne et Normandie",
    "Montre le CHU le plus proche",
    "Prévalence des maladies du foie en Bretagne",
    "Étiologie virale à Marseille"
  ];
  const chips=document.createElement("div");
  chips.className="bot-chips";
  chips.innerHTML=SUGGESTIONS.map(s=>`<button class="bot-chip">${s}</button>`).join("");
  msgs.appendChild(chips);
  chips.addEventListener("click",e=>{ const b=e.target.closest(".bot-chip"); if(!b) return;
    input.value=b.textContent; lancer(b.textContent);
  });

  // indicateur "en train d'écrire" — injecté ici pour ne pas toucher style.css
  if(!document.getElementById("bot-typing-style")){
    const st=document.createElement("style"); st.id="bot-typing-style";
    st.textContent = `.bot-typing{display:inline-flex;gap:4px;padding:2px 0}
      .bot-typing span{width:6px;height:6px;border-radius:50%;background:var(--muted);
        animation:botTypingBlink 1.1s infinite ease-in-out}
      .bot-typing span:nth-child(2){animation-delay:.15s}
      .bot-typing span:nth-child(3){animation-delay:.3s}
      @keyframes botTypingBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}`;
    document.head.appendChild(st);
  }
  const TYPING = `<span class="bot-typing"><span></span><span></span><span></span></span>`;
  const attendre = ms => new Promise(r=>setTimeout(r,ms));

  const lancer=async (texte)=>{ const q=(texte!=null?texte:input.value).trim(); if(!q) return;
    add(q,"user"); input.value=""; add(TYPING,"bot");
    await attendre(280 + Math.random()*220); // délai naturel, évite l'effet "réponse instantanée robotique"
    try{ const rep=await repondre(q); msgs.lastChild.innerHTML=rep; }
    catch(err){ msgs.lastChild.innerHTML="Désolé, je n'ai pas compris. Essaie : « top 5 &lt;variable&gt; en &lt;région&gt; »."; }
    msgs.scrollTop=msgs.scrollHeight;
  };

  // ouverture/fermeture de l'assistant <-> légende flottante : jamais les deux
  // ouverts en même temps, pour éviter tout chevauchement visuel sur la carte.
  const fermerLegende=()=>{ const lp=document.getElementById("legend-panel"); if(lp) lp.classList.add("collapsed"); };
  const rouvrirLegende=()=>{ const lp=document.getElementById("legend-panel"); if(lp) lp.classList.remove("collapsed"); };

  launch.onclick=()=>{
    panel.classList.toggle("show");
    if(panel.classList.contains("show")){ input.focus(); fermerLegende(); }
    else rouvrirLegende();
  };
  panel.querySelector("#bot-close").onclick=()=>{ panel.classList.remove("show"); rouvrirLegende(); };
  panel.querySelector("#bot-send").onclick=()=>lancer();
  input.addEventListener("keydown",e=>{ if(e.key==="Enter") lancer(); });
  

  // clic sur une commune listée -> zoom + fiche
  msgs.addEventListener("click",e=>{ const it=e.target.closest(".bot-item"); if(!it) return;
    const code=it.dataset.code; flyToCommune(code);
    const props={}; props[CLE]=code; props.NOM=NOM_BY_CODE[code]; ouvrirFicheCommune(code,props);
  });

  // clic sur une puce suggérée À L'INTÉRIEUR d'une réponse (relances, repli,
  // réassurance…) -> relance la conversation avec ce texte.
  msgs.addEventListener("click",e=>{ const b=e.target.closest(".bot-chip"); if(!b) return;
    lancer(b.textContent);
  });
}/* =====================================================================
   MODULE ÉTABLISSEMENTS CHU / CLCC (autonome — à coller en FIN de app.js)
   - Affiche les 47 CHU/CLCC (data/ETABLISSEMENTS.json) en cercles colorés
   - Panneau latéral : cases Activer/Désactiver par type (icônes Flaticon)
   - Clic sur une commune : plus proche CHU et CLCC (vol d'oiseau, nom, km),
     lignes tracées sur la carte + valeurs routières PRÉCALCULÉES de la
   Aucune ressource réseau externe. Aucune modification du code existant.
   ===================================================================== */
(function(){
  const COL_CHU  = "#1f6feb";
  const COL_CLCC = "#b8336a";
  let ETABS = null;              // [{nom,type,lon,lat}]

  // ---- distance à vol d'oiseau (haversine, km) ----
  function havKm(lon1,lat1,lon2,lat2){
    const R=6371, r=Math.PI/180;
    const dLat=(lat2-lat1)*r, dLon=(lon2-lon1)*r;
    const s=Math.sin(dLat/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(s));
  }
  function plusProche(lon,lat,type){
    let best=null, bd=Infinity;
    for(const e of ETABS){ if(e.type!==type) continue;
      const d=havKm(lon,lat,e.lon,e.lat);
      if(d<bd){ bd=d; best=e; } }
    return best ? {etab:best, km:bd} : null;
  }

  // ---- marqueurs DOM "logo" (icônes Flaticon) : CHU = fi-sr-hospital-user, CLCC = fi-ts-hospital.
  // On utilise maplibregl.Marker (HTML) : rend nativement la police d'icônes, reste TOUJOURS
  // au-dessus de la carte (aucun souci de z-order) et survit aux changements de fond. ----
  const ICONE   = { CHU:"fi-sr-hospital-user", CLCC:"fi-ts-hospital" };
  const MARKERS = { CHU:[], CLCC:[] };
  const VISIBLE = { CHU:false, CLCC:false };   // DÉCOCHÉ au lancement (activation manuelle)
  let LIGNES=[];

  // style des marqueurs injecté une seule fois (évite de toucher style.css).
  // IMPORTANT fluidité : MapLibre positionne le marqueur via `transform` sur l'élément RACINE
  // (.etab-mk). On ne met donc AUCUNE transition dessus (sinon les logos "traînent" pendant le
  // déplacement de la carte). L'animation de survol est portée par l'enfant .badge.
  function injecterStyleMarkers(){
    if(document.getElementById("etab-mk-style")) return;
    const st=document.createElement("style"); st.id="etab-mk-style";
    st.textContent=`
      .etab-mk{cursor:pointer;will-change:transform}
      .etab-mk .badge{display:flex;align-items:center;justify-content:center;width:20px;height:20px;
        border-radius:50%;background:#fff;border:2px solid currentColor;
        box-shadow:0 0 0 1.5px rgba(255,255,255,.95), 0 1px 4px rgba(0,0,0,.5);
        transition:transform .12s ease}
      .etab-mk:hover .badge{transform:scale(1.25)}
      .etab-mk .badge i{font-size:11px;line-height:1;display:block}
      .etab-mk-chu{color:${COL_CHU}}
      .etab-mk-clcc{color:${COL_CLCC}}`;
    document.head.appendChild(st);
  }

  // crée les instances de marqueurs (NON attachées à la carte tant que la case n'est pas cochée :
  // au lancement, 0 marqueur suivi par MapLibre -> carte parfaitement fluide).
  function creerMarkers(){
    injecterStyleMarkers();
    ETABS.forEach(e=>{
      const el=document.createElement("div");
      el.className="etab-mk "+(e.type==="CHU"?"etab-mk-chu":"etab-mk-clcc");
      el.innerHTML=`<div class="badge"><i class="fi ${ICONE[e.type]||"fi-sr-marker-hospital"}"></i></div>`;
      el.title=e.nom;
      el.addEventListener("click",(ev)=>{
        ev.stopPropagation();
        new maplibregl.Popup({closeButton:true})
          .setLngLat([e.lon,e.lat])
          .setHTML(`<div class="pop-name">${e.nom}</div><div class="pop-val">${e.type}</div>`)
          .addTo(map);
      });
      const mk=new maplibregl.Marker({element:el, anchor:"center"}).setLngLat([e.lon,e.lat]);
      (MARKERS[e.type]||(MARKERS[e.type]=[])).push({mk, attached:false});   // pas de .addTo ici
    });
  }

  // couches des lignes de distance : halo blanc (lisibilité sur fonds clairs ET sombres) puis
  // DEUX traits NOIRS distincts — CHU = trait plein, CLCC = pointillés — filtrés par type.
  // (line-dasharray n'accepte pas d'expression data-driven : d'où deux couches séparées.)
  function ajouterCouchesLignes(){
    if(!map.getSource("etabs-lignes"))
      map.addSource("etabs-lignes",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
    if(!map.getLayer("etabs-lignes-halo"))
      map.addLayer({id:"etabs-lignes-halo",type:"line",source:"etabs-lignes",
        layout:{"line-cap":"round","line-join":"round"},
        paint:{"line-color":"#ffffff","line-width":5,"line-opacity":.85,"line-blur":.2,
               "line-width-transition":{duration:180},"line-opacity-transition":{duration:180}}});
    if(!map.getLayer("etabs-lignes-chu-l"))
      map.addLayer({id:"etabs-lignes-chu-l",type:"line",source:"etabs-lignes",
        filter:["==",["get","type"],"CHU"],
        layout:{"line-cap":"round","line-join":"round"},
        paint:{"line-color":"#0b0f14","line-width":4.4,"line-opacity":1}});
    if(!map.getLayer("etabs-lignes-clcc-l"))
      map.addLayer({id:"etabs-lignes-clcc-l",type:"line",source:"etabs-lignes",
        filter:["==",["get","type"],"CLCC"],
        layout:{"line-cap":"butt","line-join":"round"},
        paint:{"line-color":"#0b0f14","line-width":4,"line-dasharray":[2.6,1.4],"line-opacity":1}});
  }

  // affiche/masque un type en ATTACHANT/DÉTACHANT les marqueurs (MapLibre ne suit que le nécessaire)
  function basculer(type,on){
    VISIBLE[type]=on;
    (MARKERS[type]||[]).forEach(m=>{
      if(on && !m.attached){ m.mk.addTo(map); m.attached=true; }
      else if(!on && m.attached){ m.mk.remove(); m.attached=false; }
    });
    if(!on) effacerLignes(type);
  }
  function effacerLignes(type){
    const src=map.getSource("etabs-lignes");
    if(!type){ LIGNES=[]; if(src) src.setData({type:"FeatureCollection",features:[]}); return; }
    LIGNES=LIGNES.filter(f=>f.properties.type!==type);
    if(src) src.setData({type:"FeatureCollection",features:LIGNES});
  }

  // réinitialisation exposée (bouton "Réinitialiser") : décoche, détache les marqueurs, efface les lignes
  function reinitEtabs(){
    for(const type of ["CHU","CLCC"]){
      VISIBLE[type]=false;
      (MARKERS[type]||[]).forEach(m=>{ if(m.attached){ m.mk.remove(); m.attached=false; } });
      const el=document.getElementById(type==="CHU"?"tgl-chu":"tgl-clcc");
      if(el){ el.classList.add("off"); const c=el.querySelector(".lg-check"); if(c) c.textContent="☐"; }
    }
    effacerLignes();
  }
  window.__resetEtabs = reinitEtabs;

  // ---- panneau latéral : section avec cases à cocher (DÉCOCHÉES au départ) ----
  function ajouterPanneau(){
    if(document.getElementById("etabs-panel")) return;
    const sidebar=document.getElementById("sidebar");
    if(!sidebar) return;
    const grp=document.createElement("div");
    grp.className="group"; grp.id="etabs-panel";
    grp.innerHTML=`
      <div class="label">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>
        <span>Établissements</span>
      </div>
      <div class="legend-row off" id="tgl-chu">
        <span class="lg-check">☐</span>
        <span class="swatch" style="background:${COL_CHU};border-radius:50%"></span>
        <span class="lg-lab"><i class="fi ${ICONE.CHU}" style="color:${COL_CHU};margin-right:5px"></i>CHU</span>
        <span class="lg-cnt" id="cnt-chu"></span>
      </div>
      <div class="legend-row off" id="tgl-clcc">
        <span class="lg-check">☐</span>
        <span class="swatch" style="background:${COL_CLCC};border-radius:50%"></span>
        <span class="lg-lab"><i class="fi ${ICONE.CLCC}" style="color:${COL_CLCC};margin-right:5px"></i>CLCC</span>
        <span class="lg-cnt" id="cnt-clcc"></span>
      </div>
      <div class="etab-lines-legend" style="display:flex;gap:14px;align-items:center;margin:8px 2px 2px;font-size:11px;color:var(--muted)">
        <span style="display:inline-flex;align-items:center;gap:6px">
          <svg width="26" height="8" viewBox="0 0 26 8" aria-hidden="true"><line x1="1" y1="4" x2="25" y2="4" stroke="#0b0f14" stroke-width="2.6" stroke-linecap="round"/></svg>CHU
        </span>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <svg width="26" height="8" viewBox="0 0 26 8" aria-hidden="true"><line x1="1" y1="4" x2="25" y2="4" stroke="#0b0f14" stroke-width="2.6" stroke-dasharray="4 3"/></svg>CLCC
        </span>
      </div>
      <span class="bot-hint" style="display:block;margin-top:6px">Coche CHU / CLCC pour les afficher, puis clique une commune pour voir les plus proches. Le trait de distance est noir : <b>plein</b> vers le CHU, <b>pointillé</b> vers le CLCC.</span>`;
    sidebar.insertBefore(grp, sidebar.querySelector(".foot"));
    document.getElementById("cnt-chu").textContent = ETABS.filter(e=>e.type==="CHU").length;
    document.getElementById("cnt-clcc").textContent = ETABS.filter(e=>e.type==="CLCC").length;
    for(const [idEl,type] of [["tgl-chu","CHU"],["tgl-clcc","CLCC"]]){
      const el=document.getElementById(idEl);
      el.addEventListener("click",()=>{
        const on=!VISIBLE[type];
        el.classList.toggle("off",!on);
        el.querySelector(".lg-check").textContent = on ? "☑" : "☐";
        basculer(type,on);
      });
    }
  }

  const fmt1=n=>Number(n).toLocaleString("fr-FR",{maximumFractionDigits:1});

  // ---- clic commune : plus proches + lignes + injection dans la fiche ----
  function initClic(){
    map.on("click","communes-fill",async (e)=>{
      if(!ETABS) return;
      const lngLat=[e.lngLat.lng, e.lngLat.lat];
      const code=e.features && e.features[0] ? e.features[0].properties[CLE] : null;
      const pC=plusProche(lngLat[0],lngLat[1],"CHU");
      const pL=plusProche(lngLat[0],lngLat[1],"CLCC");
      // lignes pointillées vers les 2 plus proches (uniquement pour les types cochés/affichés)
      LIGNES=[];
      if(pC && VISIBLE.CHU) LIGNES.push({type:"Feature",properties:{col:COL_CHU,type:"CHU"},
        geometry:{type:"LineString",coordinates:[lngLat,[pC.etab.lon,pC.etab.lat]]}});
      if(pL && VISIBLE.CLCC) LIGNES.push({type:"Feature",properties:{col:COL_CLCC,type:"CLCC"},
        geometry:{type:"LineString",coordinates:[lngLat,[pL.etab.lon,pL.etab.lat]]}});
      const src=map.getSource("etabs-lignes"); if(src) src.setData({type:"FeatureCollection",features:LIGNES});
      // injection dans la fiche commune existante (après son rendu)
      setTimeout(()=>{
        try{
          const card=document.getElementById("commune-card");
          if(!card || !card.classList.contains("show")) return;
          let bloc=document.getElementById("cc-etabs");
          if(bloc) bloc.remove();
          bloc=document.createElement("div"); bloc.id="cc-etabs";
          bloc.style.cssText="margin-top:12px;padding-top:11px;border-top:1px solid var(--line);font-size:12px;line-height:1.55";
          let html=`<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:5px">CHU / CLCC les plus proches</div>`;
          if(pC) html+=`<div><span style="color:${COL_CHU};font-weight:700">●</span> <b>${pC.etab.nom}</b> — ${fmt1(pC.km)} km <span style="color:var(--muted)">(vol d'oiseau)</span></div>`;
          if(pL) html+=`<div><span style="color:${COL_CLCC};font-weight:700">●</span> <b>${pL.etab.nom}</b> — ${fmt1(pL.km)} km <span style="color:var(--muted)">(vol d'oiseau)</span></div>`;
          bloc.innerHTML=html;
          card.appendChild(bloc);
        }catch(err){ /* silencieux : la fiche existante reste intacte */ }
      },0);
    });
  }

  // ---- initialisation (n'interfère pas avec le map.on("load") existant) ----
  function init(){
    fetch("data/ETABLISSEMENTS.json").then(r=>r.json()).then(j=>{
      ETABS=j;
      creerMarkers();          // marqueurs DOM (toujours au-dessus de la carte), cachés au départ
      ajouterCouchesLignes();  // couche des lignes pointillées
      ajouterPanneau();
      initClic();
      // le fond de carte (setStyle) supprime les couches : on ré-injecte la couche de lignes
      // et on la remonte au-dessus des communes. Les marqueurs DOM, eux, restent intacts.
      map.on("styledata",()=>{ try{
        ajouterCouchesLignes();
        setTimeout(()=>{ ["etabs-lignes-halo","etabs-lignes-chu-l","etabs-lignes-clcc-l"].forEach(id=>{ if(map.getLayer(id)) map.moveLayer(id); }); }, 0);
      }catch(e){} });
    }).catch(e=>console.warn("Établissements non chargés:", e));
  }
  if(map && map.loaded && map.loaded()) init();
  else map.on("load", init);
})();

/* =====================================================================
   MODULE ÉTABLISSEMENTS — Traitement du cancer (ScopeSanté)
   - data/ETABLISSEMENTS_CANCER.json : 857 établissements ScopeSanté ayant au
     moins une activité cancer autorisée (chimiothérapie, radiothérapie) ou
     pratiquée (chirurgie du cancer du sein / colo-rectal / gynécologique).
   - Position approximative : ScopeSanté ne fournit pas de coordonnées, elle a
     été déduite commune par commune (nom de ville + département du code
     postal) — précision "centroïde communal", pas adresse exacte. Cf.
     data/PREVALENCE.json et son traitement du secret statistique pour le
     même principe de rigueur : rien n'est affiché au-delà de ce que la
     source permet d'établir.
   - Symboles distincts par groupe (forme + couleur), comme CHU/CLCC sont
     distingués par icône + couleur : un établissement pratiquant plusieurs
     activités porte un marqueur par groupe, légèrement décalés en pixels
     écran (pentagone fixe) pour rester tous cliquables sans se superposer.
   Aucune ressource réseau externe (SVG dessinés en ligne, pas de police
   d'icônes). Aucune modification du code existant.
   ===================================================================== */
(function(){
  // `color` = teinte du marqueur (doit rester lisible/vive en petit badge) ;
  // `ligne` = même teinte assombrie pour le trait de distance, qui doit trancher
  // sur la choroplèthe au lieu de s'y fondre (demande explicite : traits plus foncés) ;
  // `icone` = pictogramme Flaticon UIcons (mêmes feuilles CSS déjà chargées pour
  // CHU/CLCC — cf. <link uicons-*> dans index.html), même logique que ICONE
  // CHU/CLCC : glyphe + couleur, pas de police/police supplémentaire à charger.
  const GROUPES = {
    chimiotherapie:  {label:"Chimiothérapie",                       color:"#7b2cbf", ligne:"#4a0f8f", icone:"fi-rr-syringe"},
    radiotherapie:   {label:"Radiothérapie",                        color:"#e85d04", ligne:"#a83c00", icone:"fi-rr-radioactive"},
    chir_sein:       {label:"Chirurgie du cancer du sein",          color:"#e0218a", ligne:"#4f0035", icone:"fi-rr-ribbon"},
    chir_colorectal: {label:"Chirurgie du cancer colo-rectal",      color:"#2a9d8f", ligne:"#003a33", icone:"fi-rr-scalpel"},
    chir_gyneco:     {label:"Chirurgie des cancers gynécologiques", color:"#c99a06", ligne:"#4c3300", icone:"fi-rr-venus"}
  };
  const CLES = Object.keys(GROUPES);
  // décalage écran fixe (pentagone, en pixels) : distingue les groupes d'un
  // même établissement sans devoir recalculer quoi que ce soit au zoom
  // (Marker({offset}) de MapLibre est déjà exprimé en pixels écran constants).
  const OFFSET = {};
  CLES.forEach((k,i)=>{ const a=(-90 + i*72) * Math.PI/180, r=6;
    OFFSET[k] = [Math.round(r*Math.cos(a)), Math.round(r*Math.sin(a))]; });

  let ETABS = null;
  const MARKERS = {}, VISIBLE = {};
  CLES.forEach(k=>{ MARKERS[k]=[]; VISIBLE[k]=false; });

  function injecterStyle(){
    if(document.getElementById("etab-cancer-style")) return;
    const st=document.createElement("style"); st.id="etab-cancer-style";
    st.textContent=`
      .etab-mk-c{cursor:pointer;will-change:transform}
      .etab-mk-c .badge{display:flex;align-items:center;justify-content:center;width:20px;height:20px;
        border-radius:50%;background:#fff;border:2px solid currentColor;
        box-shadow:0 0 0 1.5px rgba(255,255,255,.95), 0 1px 4px rgba(0,0,0,.5);
        transition:transform .12s ease}
      .etab-mk-c:hover .badge{transform:scale(1.35)}
      .etab-mk-c .badge i{font-size:11px;line-height:1;display:block}`;
    document.head.appendChild(st);
  }

  function creerMarkers(){
    injecterStyle();
    ETABS.forEach(e=>{
      e.groupes.forEach(g=>{
        const spec=GROUPES[g]; if(!spec) return;
        const el=document.createElement("div");
        el.className="etab-mk-c"; el.style.color=spec.color;
        el.innerHTML=`<div class="badge"><i class="fi ${spec.icone}"></i></div>`;
        el.title=`${e.nom} — ${spec.label}`;
        el.addEventListener("click",(ev)=>{
          ev.stopPropagation();
          const activites=e.groupes.map(k=>(GROUPES[k]||{}).label||k).join(", ");
          new maplibregl.Popup({closeButton:true})
            .setLngLat([e.lon,e.lat])
            .setHTML(`<div class="pop-name">${e.nom}</div>
                      <div class="pop-val">${e.type} — ${e.ville}</div>
                      <div class="pop-val" style="margin-top:4px"><b>Activités cancer :</b> ${activites}</div>`)
            .addTo(map);
        });
        const mk=new maplibregl.Marker({element:el, anchor:"center", offset:OFFSET[g]}).setLngLat([e.lon,e.lat]);
        MARKERS[g].push({mk, attached:false});
      });
    });
  }

  function basculer(g,on){
    VISIBLE[g]=on;
    (MARKERS[g]||[]).forEach(m=>{
      if(on && !m.attached){ m.mk.addTo(map); m.attached=true; }
      else if(!on && m.attached){ m.mk.remove(); m.attached=false; }
    });
    if(!on) effacerLignes(g);
  }

  // ---- distance à vol d'oiseau (km) et plus proche établissement d'un groupe ----
  function havKm(lon1,lat1,lon2,lat2){
    const R=6371, r=Math.PI/180;
    const dLat=(lat2-lat1)*r, dLon=(lon2-lon1)*r;
    const s=Math.sin(dLat/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(s));
  }
  function plusProche(lon,lat,groupe){
    let best=null, bd=Infinity;
    ETABS.forEach(e=>{
      if(!e.groupes.includes(groupe)) return;
      const d=havKm(lon,lat,e.lon,e.lat);
      if(d<bd){ bd=d; best=e; }
    });
    return best ? {etab:best, km:bd} : null;
  }
  const fmt1=n=>Number(n).toLocaleString("fr-FR",{maximumFractionDigits:1});

  // ---- lignes de distance vers le plus proche établissement de chaque groupe
  //      COCHÉ (comme CHU/CLCC) : une couleur de trait par groupe, halo blanc
  //      pour la lisibilité sur fond clair ou sombre. ----
  let LIGNES=[];
  function ajouterCouchesLignes(){
    if(!map.getSource("etabs-cancer-lignes"))
      map.addSource("etabs-cancer-lignes",{type:"geojson",data:{type:"FeatureCollection",features:LIGNES}});
    if(!map.getLayer("etabs-cancer-lignes-halo"))
      map.addLayer({id:"etabs-cancer-lignes-halo",type:"line",source:"etabs-cancer-lignes",
        layout:{"line-cap":"round","line-join":"round"},
        paint:{"line-color":"#ffffff","line-width":4.5,"line-opacity":.85,"line-blur":.2,
               "line-width-transition":{duration:180},"line-opacity-transition":{duration:180}}});
    if(!map.getLayer("etabs-cancer-lignes-l"))
      map.addLayer({id:"etabs-cancer-lignes-l",type:"line",source:"etabs-cancer-lignes",
        layout:{"line-cap":"round","line-join":"round"},
        paint:{"line-color":["get","col"],"line-width":4.2,"line-dasharray":[2.8,1.6],"line-opacity":1}});
  }
  function effacerLignes(groupe){
    const src=map.getSource("etabs-cancer-lignes");
    if(!groupe){ LIGNES=[]; if(src) src.setData({type:"FeatureCollection",features:[]}); return; }
    LIGNES=LIGNES.filter(f=>f.properties.groupe!==groupe);
    if(src) src.setData({type:"FeatureCollection",features:LIGNES});
  }

  // ---- clic sur une commune : plus proche établissement de CHAQUE groupe coché,
  //      lignes tracées + injection dans la fiche commune déjà ouverte. ----
  function initClic(){
    map.on("click","communes-fill",(e)=>{
      if(!ETABS) return;
      const lngLat=[e.lngLat.lng, e.lngLat.lat];
      const actifs=CLES.filter(g=>VISIBLE[g]);
      const trouves={};
      LIGNES = actifs.map(g=>{
        const p=plusProche(lngLat[0],lngLat[1],g);
        if(p) trouves[g]=p;
        return p && {type:"Feature", properties:{col:GROUPES[g].ligne, groupe:g},
          geometry:{type:"LineString", coordinates:[lngLat,[p.etab.lon,p.etab.lat]]}};
      }).filter(Boolean);
      const src=map.getSource("etabs-cancer-lignes");
      if(src) src.setData({type:"FeatureCollection",features:LIGNES});
      if(!actifs.length) return;
      setTimeout(()=>{
        try{
          const card=document.getElementById("commune-card");
          if(!card || !card.classList.contains("show")) return;
          let bloc=document.getElementById("cc-etabs-cancer");
          if(bloc) bloc.remove();
          const lignesTxt=actifs.map(g=>{
            const p=trouves[g], spec=GROUPES[g];
            if(!p) return `<div style="color:var(--muted)"><span style="color:${spec.color};font-weight:700">●</span> ${spec.label} — aucun établissement</div>`;
            return `<div><span style="color:${spec.color};font-weight:700">●</span> <b>${p.etab.nom}</b> (${spec.label}) — ${fmt1(p.km)} km <span style="color:var(--muted)">(vol d'oiseau)</span></div>`;
          }).join("");
          bloc=document.createElement("div"); bloc.id="cc-etabs-cancer";
          bloc.style.cssText="margin-top:12px;padding-top:11px;border-top:1px solid var(--line);font-size:12px;line-height:1.55";
          bloc.innerHTML=`<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:5px">Établissements cancer les plus proches (groupes cochés)</div>${lignesTxt}`;
          card.appendChild(bloc);
        }catch(err){ /* silencieux : la fiche existante reste intacte */ }
      },0);
    });
  }

  function reinitEtabsCancer(){
    CLES.forEach(g=>{
      VISIBLE[g]=false;
      (MARKERS[g]||[]).forEach(m=>{ if(m.attached){ m.mk.remove(); m.attached=false; } });
      const el=document.getElementById("tgl-cancer-"+g);
      if(el){ el.classList.add("off"); const c=el.querySelector(".lg-check"); if(c) c.textContent="☐"; }
    });
    effacerLignes();
  }
  window.__resetEtabsCancer = reinitEtabsCancer;

  function ajouterPanneau(){
    if(document.getElementById("etabs-cancer-panel")) return;
    const sidebar=document.getElementById("sidebar");
    if(!sidebar) return;
    const compte={}; CLES.forEach(k=>compte[k]=0);
    ETABS.forEach(e=>e.groupes.forEach(g=>{ if(compte[g]!=null) compte[g]++; }));
    const grp=document.createElement("div");
    grp.className="group"; grp.id="etabs-cancer-panel";
    grp.innerHTML=`
      <div class="label">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z"/></svg>
        <span>Établissements — traitement du cancer</span>
      </div>
      ${CLES.map(g=>{
        const spec=GROUPES[g];
        return `<div class="legend-row off" id="tgl-cancer-${g}">
          <span class="lg-check">☐</span>
          <span class="swatch" style="background:${spec.color}"></span>
          <span class="lg-lab"><i class="fi ${spec.icone}" style="color:${spec.color};margin-right:5px"></i>${spec.label}</span>
          <span class="lg-cnt">${compte[g]}</span>
        </div>`;
      }).join("")}
      <span class="bot-hint" style="display:block;margin-top:6px">Coche un ou plusieurs groupes pour les afficher, puis clique une commune : le trait pointillé (couleur du groupe) relie au plus proche établissement de chaque groupe coché. Position approximative (centroïde de la commune du siège) — pas l'adresse exacte.</span>`;
    sidebar.insertBefore(grp, sidebar.querySelector(".foot"));
    CLES.forEach(g=>{
      const el=document.getElementById("tgl-cancer-"+g);
      el.addEventListener("click",()=>{
        const on=!VISIBLE[g];
        el.classList.toggle("off",!on);
        el.querySelector(".lg-check").textContent = on ? "☑" : "☐";
        basculer(g,on);
      });
    });
  }

  function init(){
    fetch("data/ETABLISSEMENTS_CANCER.json").then(r=>r.json()).then(j=>{
      ETABS=j;
      creerMarkers();
      ajouterCouchesLignes();
      ajouterPanneau();
      initClic();
      // le fond de carte (setStyle) supprime les couches GL : on ré-injecte la couche
      // de lignes (les marqueurs DOM, eux, survivent). Marqueurs déjà cochés = re-suivis
      // automatiquement par MapLibre, rien à refaire pour eux.
      map.on("styledata",()=>{ try{ ajouterCouchesLignes(); }catch(e){} });
    }).catch(e=>console.warn("Établissements cancer non chargés:", e));
  }
  if(map && map.loaded && map.loaded()) init();
  else map.on("load", init);
})();



/* =====================================================================
   MODULE COMPARAISON — superposition d'une 2e variable
   - Couche indépendante "communes-fill-b" sur la MÊME source "communes"
     (aucune géométrie supplémentaire chargée) : feature-state "valB",
     bien distinct de "val" (variable principale) — dessiner() ne nettoie
     plus que la clé "val" (cf. removeFeatureState({...}, "val") plus haut)
     pour ne jamais écraser "valB".
   - Réutilise les briques déjà existantes (RAMPS, CONFIG, getBreaks, et le
     cache borné assurerVariable()/ALL_DATA) plutôt que de dupliquer un
     second pipeline de données. La variable B est épinglée dans le cache,
     donc jamais évincée tant que la comparaison est affichée.
   - Sa propre classification (quantiles nationaux, non filtrés par région/
     département) : seul l'AFFICHAGE suit le filtre région/département,
     pas les seuils — simplification assumée, la variable B reste une
     couche de contexte superposable, pas un second tableau de bord complet.
   ===================================================================== */
(function(){
  let COMPARE_ON=false;
  let CLASSES_B=null;
  let PREV_VALB_CODES=new Set();   // même logique de nettoyage ciblé que PREV_VAL_CODES (cf. dessiner())

  function remplirAnneesB(v){
    const sel=document.getElementById("sel-year-b");
    if(!INDEX[v]) return;
    sel.innerHTML="";
    (INDEX[v].annees||[]).forEach(a=>{ const o=document.createElement("option"); o.value=a; o.textContent=a; sel.appendChild(o); });
    sel.value = INDEX[v].annees[INDEX[v].annees.length-1];
  }

  // Passe par le cache borné commun (assurerVariable) : l'ancienne version écrivait
  // dans ALL_DATA sans passer par patchPLM ni par la comptabilité du cache, ce qui
  // laissait Paris/Lyon/Marseille en blanc sur la couche B et rendait la variable
  // inévinçable. La variable B est épinglée par epinglerVariable().
  async function assurerDonnees(v){
    return assurerVariable(v);
  }

  function ajouterCoucheB(){
    if(map.getSource("communes") && !map.getLayer("communes-fill-b"))
      map.addLayer({ id:"communes-fill-b", type:"fill", source:"communes",
        paint:{ "fill-color":NODATA, "fill-opacity":0,
                "fill-opacity-transition":{duration:200} } }, "communes-hover");
  }

  const opaciteB=()=>(document.getElementById("sel-opacity-b").value||60)/100;

  async function dessinerB(){
    ajouterCoucheB();
    if(!map.getLayer("communes-fill-b")) return;
    if(!COMPARE_ON){ map.setPaintProperty("communes-fill-b","fill-opacity",0); return; }
    const v=document.getElementById("sel-var-b").value;
    const a=document.getElementById("sel-year-b").value;
    if(!v || !a) return;
    let data;
    try{ data=await assurerDonnees(v); }
    catch(err){
      if(err && err.statut===401) return;              // session expirée : déjà traitée
      console.error("Variable de comparaison indisponible :", v, err);
      signalerErreur(`La variable comparée « ${LIBELLES[v]||v} » n'a pas pu être chargée.`);
      map.setPaintProperty("communes-fill-b","fill-opacity",0);
      return;
    }
    if(!data) return;
    const vals=data[a]||{};
    const cfg=CONFIG[v]||{type:"seq",ramp:"reds"};

    const nouveauxCodesB=new Set();
    for(const code in vals){ if(vals[code]==null) continue;
      map.setFeatureState({source:"communes", id:code}, {valB:vals[code]}); nouveauxCodesB.add(code); }
    for(const code of PREV_VALB_CODES){ if(!nouveauxCodesB.has(code))
      map.setFeatureState({source:"communes", id:code}, {valB:null}); }
    PREV_VALB_CODES=nouveauxCodesB;

    let expr;
    if(cfg.type==="cat"){
      const present=new Set(Object.values(vals).filter(x=>x!=null).map(String));
      const cats = cfg.order ? cfg.order.filter(c=>present.has(c)) : [...present].sort();
      const pal = cfg.palette ? {...cfg.palette} : {...PALETTE_CAT};
      const base=["#1a9850","#fdbb84","#b30000","#2166ac","#762a83"];
      cats.forEach((c,i)=>{ if(!pal[c]) pal[c]=base[i%base.length]; });
      const m=["match",["feature-state","valB"]];
      cats.forEach(c=>m.push(c, pal[c]));
      m.push(NODATA);
      expr=m;
      CLASSES_B={type:"cat", cats, pal, labels:cfg.labels};
    } else {
      const arr=Object.values(vals).filter(x=>typeof x==="number");
      const ramp=RAMPS[cfg.ramp] || (cfg.type==="div" ? RAMPS.diverging : RAMPS.reds);
      let b = cfg.fixedBreaks ? [...cfg.fixedBreaks] : getBreaks(arr, "quantile", 5);
      b=[...new Set(b)].filter(x=>typeof x==="number"&&isFinite(x)).sort((x,y)=>x-y);
      const caseHead=["case",["==",["feature-state","valB"],null],NODATA];
      if(cfg.maskedValue!=null) caseHead.push(["==",["feature-state","valB"],cfg.maskedValue], cfg.maskedColor||"#9aa0a8");
      if(b.length<1){ expr=[...caseHead, ramp[0]]; }
      else{
        const step=["step",["feature-state","valB"], ramp[0]];
        b.forEach((seuil,i)=>step.push(seuil, ramp[i+1]));
        expr=[...caseHead, step];
      }
      CLASSES_B={type:"num", breaks:b, ramp, classLabels:cfg.classLabels,
        masked:cfg.maskedValue!=null?{color:cfg.maskedColor||"#9aa0a8", label:cfg.maskedLabel||"Secret statistique"}:null};
    }
    map.setPaintProperty("communes-fill-b","fill-color", expr);
    map.setPaintProperty("communes-fill-b","fill-opacity", opaciteB());
    legendeB(v);
  }

  function legendeB(v){
    const box=document.getElementById("legend-compare-b"); if(!box) return;
    if(!CLASSES_B){ box.innerHTML=""; return; }
    const titre=`<div style="font-size:10.5px;font-weight:600;color:var(--ink-2);margin-bottom:4px">${LIBELLES[v]||v}</div>`;
    let rows;
    if(CLASSES_B.type==="cat"){
      rows=CLASSES_B.cats.map(c=>
        `<div class="legend-row"><span class="swatch" style="background:${CLASSES_B.pal[c]}"></span><span class="lg-lab">${(CLASSES_B.labels&&CLASSES_B.labels[c])||c}</span></div>`
      ).join("");
    } else {
      const b=CLASSES_B.breaks, fmt=x=>Number(x).toLocaleString("fr-FR",{maximumFractionDigits:1});
      const lab=CLASSES_B.classLabels ||
        [`< ${fmt(b[0])}`,`${fmt(b[0])} – ${fmt(b[1])}`,`${fmt(b[1])} – ${fmt(b[2])}`,`${fmt(b[2])} – ${fmt(b[3])}`,`> ${fmt(b[3])}`];
      rows=CLASSES_B.ramp.map((c,i)=>
        `<div class="legend-row"><span class="swatch" style="background:${c}"></span><span class="lg-lab">${lab[i]||""}</span></div>`
      ).join("");
      if(CLASSES_B.masked) rows+=`<div class="legend-row"><span class="swatch" style="background:${CLASSES_B.masked.color}"></span><span class="lg-lab">${CLASSES_B.masked.label}</span></div>`;
    }
    box.innerHTML=titre+rows;
  }

  async function basculerCompare(actif){
    COMPARE_ON=!!actif;
    const ctl=document.getElementById("compare-var-controls");
    if(ctl) ctl.style.display=actif?"block":"none";
    // dessinerB() charge et rapporte lui-même ses erreurs : inutile de pré-charger ici
    // (l'ancien await non protégé laissait une promesse rejetée dans la console et la
    // couche B à moitié activée).
    if(actif) epinglerVariable(VAR_COURANTE);
    await dessinerB();
  }

  function reinitCompare(){
    COMPARE_ON=false;
    const chk=document.getElementById("chk-compare-var"); if(chk) chk.checked=false;
    const ctl=document.getElementById("compare-var-controls"); if(ctl) ctl.style.display="none";
    if(map.getLayer("communes-fill-b")) map.setPaintProperty("communes-fill-b","fill-opacity",0);
  }
  window.__resetCompareVar = reinitCompare;

  function init(){
    remplirMenuVariables("sel-var-b");
    const selB=document.getElementById("sel-var-b");
    remplirAnneesB(selB.value);
    selB.onchange=()=>{ epinglerVariable(VAR_COURANTE); remplirAnneesB(selB.value); dessinerB(); };
    document.getElementById("sel-year-b").onchange=dessinerB;
    document.getElementById("chk-compare-var").onchange=e=>basculerCompare(e.target.checked);
    document.getElementById("sel-opacity-b").oninput=e=>{
      document.getElementById("compare-opacity-val").textContent=e.target.value+" %";
      if(map.getLayer("communes-fill-b") && COMPARE_ON) map.setPaintProperty("communes-fill-b","fill-opacity", opaciteB());
    };
    // le fond de carte (setStyle) détruit toutes les couches GL : on ré-injecte
    // la nôtre si la comparaison est active (feature-state "valB" déjà posé, pas
    // besoin de le recalculer — seule la couche de peinture doit être recréée).
    map.on("styledata",()=>{ try{ if(COMPARE_ON){ ajouterCoucheB(); dessinerB(); } }catch(e){} });
  }

  // INDEX est rempli de façon asynchrone par le handler principal de map.on("load") ;
  // ce module a sa propre écoute de "load" (ordre d'inscription des handlers), donc
  // pas de garantie qu'INDEX soit déjà prêt — on attend simplement qu'il le soit.
  function attendreIndex(){
    if(Object.keys(INDEX).length) init();
    else setTimeout(attendreIndex, 200);
  }
  if(map && map.loaded && map.loaded()) attendreIndex();
  else map.on("load", ()=>setTimeout(attendreIndex, 300));
})();
