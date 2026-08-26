import { escapeHtml } from "../editable.js";

// Briques partagées par tous les gabarits du système "chapitrage" (01
// Constat, 02 Ingénieries, 03 Préconisations — handoff
// design_handoff_slide_patrimoine + slides assurance vie). Un seul
// endroit pour le rail d'en-tête et le rail d'étapes : les futurs
// chapitres (PER, SCPI) les réutilisent tels quels, rien à dupliquer.

export function formatPct(v) {
  return `${v.toFixed(1).replace(".", ",")} %`;
}

// Rail d'en-tête (logo, séparateur, 01/02/03, client) — identique sur
// toutes les slides d'un chapitre, seule l'entrée active change.
// S'adapte au fond de la slide via --chap-ink-rgb (encre par défaut,
// papier sur fond encre — voir chapitre.css). Pas de date affichée : le
// client est ce qui identifie la slide en RDV, la date de mise à jour du
// contenu n'a pas sa place dans ce rail.
export function renderChapRail({ client, chapitres, chapitreActif }) {
  const activeIndex = chapitreActif - 1;
  const items = (chapitres || [])
    .map((ch, i) => {
      const active = i === activeIndex;
      return `
        <span class="chap-nav__item${active ? " chap-nav__item--active" : ""}">
          <span class="chap-nav__num">${escapeHtml(ch.numero)}</span>
          <span class="chap-nav__label">${escapeHtml(ch.libelle)}</span>
        </span>
      `;
    })
    .join("");

  const meta = client || "";

  return `
    <header class="chap-rail">
      <div class="chap-rail__left">
        <img class="chap-logo" src="assets/logo-vk-or.png" alt="Victor Kieny">
        <span class="chap-logo-sep"></span>
        <div class="chap-nav">${items}</div>
      </div>
      ${meta ? `<span class="chap-meta">${meta}</span>` : ""}
    </header>
  `;
}

// Rail d'étapes imbriqué (RailEtapes.dc.html) : composant paramétrique,
// indépendant du contenu — nombre d'étapes et libellés variables.
// active (1-based) : étape en cours. Vu / en cours / à venir sont
// dérivés de l'index, pas saisis.
export function renderRailEtapes(etapes, active) {
  const items = (etapes || [])
    .map((libelle, i) => {
      const n = i + 1;
      const state = n < active ? "past" : n === active ? "now" : "next";
      return `
        <div class="rail-step rail-step--${state}">
          <div class="rail-step__track"></div>
          <div class="rail-step__row">
            <span class="rail-step__num">${n}</span>
            <span class="rail-step__label">${escapeHtml(libelle)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="rail-etapes" style="grid-template-columns:repeat(${(etapes || []).length},1fr)">
      ${items}
    </div>
  `;
}

// Bibliothèque d'icônes fixes (structure du gabarit "Composition du
// contrat" — trait 1,4px sur grille 24×24, jamais de contenu client).
export const ICONS = {
  bouclier: '<path d="M12 2.8 L20 5.8 V12 C20 16.8 16.4 19.9 12 21.2 C7.6 19.9 4 16.8 4 12 V5.8 Z"/>',
  cliquet: '<path d="M3 20 H7.5 V15.5 H12 V11 H16.5 V6.5 H21"/><path d="M3 20 V4"/>',
  plafond: '<path d="M3 5.5 H21" stroke-dasharray="2.4 3"/><path d="M3 19 C9 19 11.5 11 21 10.5"/>',
  formes: '<circle cx="4.6" cy="12" r="3.1"/><rect x="8.8" y="8.9" width="6.2" height="6.2"/><path d="M19.9 8.9 L23 15.1 H16.8 Z"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12 H20.6"/><ellipse cx="12" cy="12" rx="4" ry="8.6"/>',
  risque: '<path d="M3 15.5 L7 8.5 L11 16.5 L15 7 L19 13 L21.5 9.5"/>',
  // Cadenas déverrouillé — évoque l'épargne disponible ("Pourquoi
  // l'assurance vie"). Anse détachée d'un seul côté (asymétrique) :
  // c'est précisément ce qui distingue "déverrouillé" de "verrouillé",
  // pas une forme différente, un simple cadenas fermé aurait dit le
  // contraire de ce qu'on illustre. L'anse porte sa propre classe : sur
  // la slide "Pourquoi l'assurance vie", elle pivote depuis une position
  // fermée à l'apparition du pictogramme (voir .chap-regles__picto
  // --unlocking dans chapitre.css) — le cadenas s'ouvre visuellement, il
  // n'est pas juste dessiné déjà ouvert.
  disponibilite:
    '<rect x="3" y="11" width="18" height="11" rx="2"/><path class="chap-icon__shackle" d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  // Case cochée — repère de liste pour une slide récap point par point
  // (synthèse de chapitre) : une case, jamais un rond ni un tiret, pour
  // dire "acquis" plutôt que "à suivre". Bicolore à dessein (contour
  // bleu, coche dorée) : chaque élément porte son propre stroke, qui
  // prime sur la couleur passée à iconSvg().
  coche:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="var(--bleu)"/><path d="M7.3 12.3 L10.4 15.4 L16.7 8.8" stroke="var(--or)"/>',
  // Silhouette simple (tête + épaules) — un bénéficiaire, dans
  // l'animation de donation ("Transmission").
  enfant: '<circle cx="12" cy="7.6" r="3.5"/><path d="M4.6 21c0-4.1 3.3-7.4 7.4-7.4s7.4 3.3 7.4 7.4"/>',
  // Même silhouette qu'"enfant", seule pour une personne — devant un
  // montant "personne seule" ("Fiscalité des rachats").
  personne: '<circle cx="12" cy="7.6" r="3.5"/><path d="M4.6 21c0-4.1 3.3-7.4 7.4-7.4s7.4 3.3 7.4 7.4"/>',
  // Deux silhouettes rapprochées (têtes + épaules qui se chevauchent
  // légèrement) — un couple, devant un montant "couple" ("Fiscalité des
  // rachats").
  couple:
    '<circle cx="8" cy="8" r="2.6"/><path d="M2.8 20.5c0-3 2.3-5.4 5.2-5.4s5.2 2.4 5.2 5.4"/><circle cx="16" cy="8" r="2.6"/><path d="M10.8 20.5c0-3 2.3-5.4 5.2-5.4s5.2 2.4 5.2 5.4"/>',
  // Une silhouette au premier plan devant deux autres, en retrait de
  // part et d'autre — l'investisseur d'un schéma ("Comment ça marche")
  // n'est pas seul, il co-investit avec d'autres associés. Les deux
  // silhouettes arrière n'ont qu'une épaule dessinée (celle visible,
  // qui dépasse derrière la figure du premier plan) : suggérer un
  // groupe, pas doubler le "couple" ci-dessus.
  groupe:
    '<circle cx="4.6" cy="8" r="2.3"/><path d="M0.8 19.5c0-3 1.7-5.4 3.8-5.4"/><circle cx="19.4" cy="8" r="2.3"/><path d="M23.2 19.5c0-3-1.7-5.4-3.8-5.4"/><circle cx="12" cy="8.6" r="3.5"/><path d="M4.6 21.5c0-4.1 3.3-7.4 7.4-7.4s7.4 3.3 7.4 7.4"/>',
  // Pile de pièces — le capital transmis, au-dessus du repère "Capital
  // transmis" ("Transmission") : un empilement simple (une ellipse
  // dessus, deux tranches en dessous), pas un symbole monétaire.
  capital:
    '<ellipse cx="12" cy="5.6" rx="7.4" ry="2.4"/><path d="M4.6 5.6v5.6c0 1.3 3.3 2.4 7.4 2.4s7.4-1.1 7.4-2.4V5.6"/><path d="M4.6 11.2v6.2c0 1.3 3.3 2.4 7.4 2.4s7.4-1.1 7.4-2.4v-6.2"/>',
  // Clé — la société de gestion ("Comment ça marche") : c'est elle qui
  // détient les clés du parc au quotidien (achat, location, travaux),
  // par opposition à l'investisseur ("personne", associé propriétaire)
  // sur le même schéma.
  cle: '<circle cx="7" cy="12" r="3.6"/><path d="M10.4 12H20M15.5 12V15.5M19 12V15"/>',
  // Sablier — le délai de jouissance ("Délais, versements et
  // liquidité") : le temps qui s'écoule entre la souscription et les
  // premiers revenus, pas une horloge (qui dirait plutôt une heure
  // précise qu'une durée d'attente).
  sablier: '<path d="M6.5 3H17.5M6.5 21H17.5M7.5 3C7.5 7.5 12 9.5 12 12C12 14.5 7.5 16.5 7.5 21M16.5 3C16.5 7.5 12 9.5 12 12C12 14.5 16.5 16.5 16.5 21"/>',
  // Flèche circulaire — le versement trimestriel des loyers : un
  // paiement qui se répète à intervalle régulier, pas un montant unique
  // (voir "capital", la pile de pièces, réservée à un versement ponctuel).
  cycle: '<path d="M4.5 12a7.5 7.5 0 0 1 12.7-5.4M19.5 12a7.5 7.5 0 0 1-12.7 5.4"/><path d="M17.5 3.5V7H14M6.5 20.5V17H10"/>',
  // Deux flèches opposées — la liquidité des parts (revente via le
  // marché secondaire) : un échange, pas un flux à sens unique comme
  // les flèches du schéma "Comment ça marche".
  echange: '<path d="M4 8H17M17 8L13.5 4.5M17 8L13.5 11.5"/><path d="M20 16H7M7 16L10.5 12.5M7 16L10.5 19.5"/>',
  // Les 4 classes d'actifs de la SCPI ("Comment ça marche") ne sont plus
  // ici : ce sont désormais les pictogrammes fournis tels quels par le
  // client (assets/icons/*.svg, dessinés dans Claude Design), chacun
  // avec son propre viewBox — voir ACTIF_ICONS_RAW dans
  // scpi-mecanisme.js, pas la grille 24×24 partagée de ce fichier.
  // Les 4 atouts SCPI ("Les atouts") — fournis tels quels par le client
  // (assets/icons/picto-*.svg, Claude Design), repris ici tel quel car
  // déjà sur la grille 24×24 partagée (contrairement aux icônes
  // d'actifs ci-dessus) : un seul endroit pour tous les pictos qui la
  // suivent, pas une exception de plus.
  "rendement-locatif": '<polyline points="3,17 9,11 13,15 21,7"/><polyline points="15,7 21,7 21,13"/>',
  "risque-maitrise":
    '<path d="M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z"/><polyline points="8.5,12 11,14.5 15.5,9.5"/>',
  // Point central plein (fill="currentColor") : seule icône du registre
  // à mélanger trait et remplissage — voir style="color" posé par
  // iconSvg() pour que currentColor suive la même couleur que le trait.
  "placement-sur-mesure": '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  "gestion-cle-en-main":
    '<circle cx="8" cy="8.5" r="3.3"/><line x1="10.3" y1="10.8" x2="20.5" y2="21"/><line x1="15.8" y1="16.3" x2="18.3" y2="13.8"/><line x1="18" y1="18.5" x2="20.5" y2="16"/>',
};

export function iconSvg(name, color, size = 38) {
  const path = ICONS[name];
  if (!path) return "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" stroke="${color}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color:${color}" class="chap-icon">${path}</svg>`;
}
