import { euro, escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Fiscalité des rachats" (handoff slides assurance vie,
// GABARITS.md #6) — schéma capital/intérêts à 6 états (révélation
// progressive, voir js/deck.js stepForward/stepBackward). Géométrie SVG
// fixe (200×200, viewBox identique) : reprise telle quelle de la
// référence pour ce contenu d'exemple. Code couleur constant : encre =
// capital (jamais imposé), vert = non imposé, rouge = imposé (aligné sur
// "Valoriser son épargne" — l'impôt y est rouge, même code partout),
// neutre = pas encore de question fiscale posée. La clé "bleu" ci-
// dessous porte la couleur rouge : gardée pour ne pas devoir toucher
// deck.json (dot:"bleu"), qui reste le nom du repère, pas la couleur
// rendue.

const DOT_COLOR = {
  encre: "var(--encre)",
  neutre: "rgba(var(--encre-rgb),.26)",
  bleu: "var(--rouge)",
  vert: "var(--vert)",
};

// Rayon du disque de capital et rayon (au centre du trait) de l'anneau
// des intérêts, choisis pour que le bord intérieur de l'anneau
// (RING_R - 12) tombe exactement sur le bord du capital (52) — aucun
// espace entre les deux, quel que soit l'état.
const CAPITAL_R = 52;
const RING_R = 64;
const RING_WIDTH = 24;
const RING_CIRC = 2 * Math.PI * RING_R;

const CAPITAL_CIRCLE = `<circle cx="100" cy="100" r="${CAPITAL_R}" fill="var(--encre)"/>`;

// Secteur de 70° extrait du disque de capital (bissectrice à -45°, entre
// -10° et -80°) — coordonnées à CAPITAL_R, partagées par la portion
// "majoritaire" (le disque moins le coin) et le coin lui-même.
const CAPITAL_MAJORITY = `<path d="M 100 100 L 151.21 90.97 A ${CAPITAL_R} ${CAPITAL_R} 0 1 1 109.03 48.79 Z" fill="var(--encre)"/>`;
const CAPITAL_COIN = `<path d="M 100 100 L 109.03 48.79 A ${CAPITAL_R} ${CAPITAL_R} 0 0 1 151.21 90.97 Z" fill="var(--encre)"/>`;

// Même secteur, à l'anneau des intérêts (RING_R ± RING_WIDTH/2 = 76/52 —
// bord intérieur à 52, flush avec le capital, cf. RING_R ci-dessus).
const INTERETS_MAJORITY = `<path d="M 174.85 86.81 A 76 76 0 1 1 113.19 25.15 L 109.03 48.79 A 52 52 0 1 0 151.21 90.97 Z" fill="var(--vert)"/>`;

// Le coin des intérêts est rendu comme un arc épais (trait de largeur
// RING_WIDTH sur le cercle central RING_R, entre -80° et -10°) plutôt
// qu'un secteur d'anneau rempli : géométriquement identique (les
// extrémités "butt" d'un arc tombent exactement sur le rayon, comme les
// bords droits du secteur), mais ça permet d'animer son remplissage en
// rotation via stroke-dashoffset — même technique que couronneRingsHtml
// — pour l'effet "la couleur verte vient recouvrir le bleu" (état 7).
const COIN_ARC_PATH = `M 111.11 36.97 A ${RING_R} ${RING_R} 0 0 1 163.03 88.89`;
const COIN_ARC_LEN = RING_R * ((70 * Math.PI) / 180);
function interetsCoinArcHtml(color, sweepEntering) {
  const dashAttrs = sweepEntering
    ? ` data-reveal data-reveal-dashoffset="0" style="stroke-dashoffset:${COIN_ARC_LEN.toFixed(2)}"`
    : "";
  return `<path d="${COIN_ARC_PATH}" fill="none" stroke="${color}" stroke-width="${RING_WIDTH}" stroke-linecap="butt" stroke-dasharray="${COIN_ARC_LEN.toFixed(2)}"${dashAttrs}/>`;
}

// Le coin (capital + intérêts) est toujours affiché translaté sur sa
// bissectrice (9.90,-9.90 — détaché du disque). detaching=true anime ce
// décalage depuis 0 (voir data-reveal-transform, js/reveal.js) : effet
// "part qui se détache", joué une seule fois (à l'apparition du coin,
// bleu) — au passage bleu -> vert le coin ne bouge plus, il reste figé à
// sa position détachée (voir render : seule sa couleur change, via
// interetsCoinArcHtml).
function coinGroupAttrs(detaching) {
  if (!detaching) return ` style="transform:translate(9.9px,-9.9px)"`;
  return ` class="fiscalite-rachats__coin" data-reveal data-reveal-transform="translate(9.9px,-9.9px)" style="transform:translate(0,0)"`;
}

const COURONNE_ORDER = ["couronne-neutre", "couronne-bleu", "couronne-or"];
const COURONNE_COLOR = {
  "couronne-neutre": "rgba(var(--encre-rgb),.26)",
  "couronne-bleu": "var(--rouge)",
  "couronne-or": "var(--vert)",
};

// Anneaux empilés du plus ancien au plus récent : chaque couleur déjà
// posée reste un cercle plein statique, le dernier (sweepEntering) se
// déploie par-dessus dans le sens horaire (stroke-dashoffset, voir
// js/reveal.js) — l'effet "un disque de couleur qui recouvre le
// précédent" demandé pour bleu (on ajoute l'impôt) et vert (on l'efface),
// plutôt qu'un agrandissement générique qui ne dit rien de ce sens-là.
// Le tout premier anneau (neutre) n'a rien à recouvrir : il grandit
// depuis le centre comme le capital, via le <g> englobant (voir render).
function couronneRingsHtml(svgKey, sweepEntering) {
  const idx = COURONNE_ORDER.indexOf(svgKey);
  let html = "";
  for (let i = 0; i <= idx; i++) {
    const color = COURONNE_COLOR[COURONNE_ORDER[i]];
    const isTop = i === idx;
    if (isTop && sweepEntering && i > 0) {
      html += `<circle cx="100" cy="100" r="${RING_R}" fill="none" stroke="${color}" stroke-width="${RING_WIDTH}" stroke-dasharray="${RING_CIRC.toFixed(2)}" data-reveal data-reveal-dashoffset="0" style="stroke-dashoffset:${RING_CIRC.toFixed(2)}"/>`;
    } else {
      html += `<circle cx="100" cy="100" r="${RING_R}" fill="none" stroke="${color}" stroke-width="${RING_WIDTH}"/>`;
    }
  }
  return html;
}

function legendEntryHtml(entry) {
  const dot = DOT_COLOR[entry.dot] || DOT_COLOR.encre;
  const opacity = entry.muted ? 0.5 : 0.75;
  return `
    <div class="fiscalite-rachats__entry">
      <span class="fiscalite-rachats__dot" style="background:${dot}"></span>
      <span class="fiscalite-rachats__entry-text" style="color:rgba(var(--chap-ink-rgb),${opacity})">${escapeHtml(entry.texte)}</span>
    </div>
  `;
}

function avant8Html(bloc) {
  if (!bloc) return "";
  // Une seule ligne "LABEL : texte" — lignes n'a plus qu'une entrée
  // depuis la simplification du contenu, jointes ici au cas où une
  // future donnée en porterait plusieurs (pas une puce par ligne).
  const texte = (bloc.lignes || []).join(" · ");
  return `
    <div class="rachat-avant8">
      <span class="rachat-line__label">${escapeHtml(bloc.label)} :</span>
      <span class="rachat-line__text">${escapeHtml(texte)}</span>
    </div>
  `;
}

function apres8Html(bloc) {
  if (!bloc) return "";
  const [firstLigne, ...restLignes] = bloc.lignes || [];
  const montants = (bloc.montants || [])
    .map(
      (m) => `
      <div class="rachat-apres8__amount">
        ${iconSvg(m.icon, "rgba(var(--chap-ink-rgb),.6)", 34)}
        <div class="rachat-apres8__amount-text">
          <span class="rachat-apres8__value">${euro.format(m.valeur)}</span>
          <span class="rachat-apres8__who">${escapeHtml(m.who)}</span>
        </div>
      </div>
    `
    )
    .join("");
  // Grille à 2 colonnes (label, puis contenu) plutôt qu'un .rachat-line
  // en flex-row : la 1re ligne suit le label sur la même rangée, les
  // suivantes ET les montants s'alignent tous sous le DÉBUT de la
  // phrase (colonne 2), pas sous le label (voir .rachat-apres8) — même
  // style de texte pour les lignes suivantes, pas de second label.
  const restLignesHtml = restLignes.map((l) => `<p class="rachat-line__text">${escapeHtml(l)}</p>`).join("");

  return `
    <div class="rachat-apres8">
      <span class="rachat-line__label">${escapeHtml(bloc.label)} :</span>
      <span class="rachat-line__text">${escapeHtml(firstLigne)}</span>
      ${restLignesHtml}
      <div class="rachat-apres8__amounts">${montants}</div>
    </div>
  `;
}

// Groupe qui grandit depuis un point au centre du viewBox (200x200,
// centre 100,100) jusqu'à sa taille pleine — scale(0) -> scale(1), voir
// js/reveal.js data-reveal-transform. Sans rebond : cubic-bezier(0.4,0,
// 0.2,1) n'a pas de dépassement, voir --chap-ease-move dans theme.css.
// Réservé aux deux seules apparitions d'une forme neuve (rien à
// recouvrir/détacher avant elle) : le capital et le premier anneau
// (neutre, ralenti — voir sa propre durée en CSS). Les coins n'y
// recourent plus (voir coinGroupAttrs, effet "détache" à la place).
function scaleGroupHtml(markup, cls, entering) {
  const attrs = entering ? ` data-reveal data-reveal-transform="scale(1)" style="transform:scale(0)"` : "";
  return `<g class="${cls}"${entering ? " data-reveal" : ""}${attrs}>${markup}</g>`;
}

// Révélation progressive en (1 + N) états : état 1 = rien (arrivée sur
// la slide, jamais animée) ; état 2 = le capital apparaît seul, lentement
// et sans rebond ; états 3..N+1 = un état de slide.states à la fois — le
// capital ne bouge plus une fois posé (pas de data-reveal une fois
// révélé, même si sa géométrie change entre couronne et coin), seuls les
// intérêts (couronne/coin) rejouent l'animation à chaque changement, et
// chacun avec l'effet qui dit ce qu'il représente (voir
// couronneRingsHtml et coinGroupAttrs) plutôt qu'un agrandissement
// générique unique.
//
// slide.states porte les N états de CONTENU (indexés par contentIndex =
// stateIndex - 1, décalé par le nouvel état 1 vide) ; deck.js déduit le
// nombre total d'états de slide.states.length, donc ce tableau porte un
// {} supplémentaire à la fin (jamais lu par contentIndex, qui reste 0..
// N-1) rien que pour que stateCount() compte bien 1+N états au total.
export function render(slide, opts = {}) {
  const states = slide.states || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), states.length);
  const animate = !!opts.animate;

  const contentIndex = stateIndex - 1;
  const state = contentIndex >= 0 ? states[contentIndex] || {} : null;
  const svgKey = state?.svg;

  const capitalEntering = animate && stateIndex === 1;

  let capitalInner = "";
  let interetsInner = "";
  let interetsGroupEntering = false;

  if (svgKey === "capital-seul") {
    capitalInner = CAPITAL_CIRCLE;
  } else if (svgKey && COURONNE_ORDER.includes(svgKey)) {
    capitalInner = CAPITAL_CIRCLE;
    const isFirstRing = svgKey === "couronne-neutre";
    interetsGroupEntering = animate && isFirstRing; // le tout premier anneau grandit depuis le centre, via le <g>
    const sweepEntering = animate && !isFirstRing; // bleu/or : le disque du dessus se déploie par-dessus
    interetsInner = couronneRingsHtml(svgKey, sweepEntering);
  } else if (svgKey === "coin-bleu") {
    // Apparition du coin : capital et intérêts glissent ensemble jusqu'à
    // leur position détachée (voir coinGroupAttrs) — la portion
    // majoritaire, elle, ne bouge jamais.
    const detaching = animate;
    capitalInner = CAPITAL_MAJORITY + `<g${coinGroupAttrs(detaching)}>${CAPITAL_COIN}</g>`;
    interetsInner = INTERETS_MAJORITY + `<g${coinGroupAttrs(detaching)}>${interetsCoinArcHtml("var(--rouge)", false)}</g>`;
  } else if (svgKey === "coin-or") {
    // Passage bleu -> vert : le coin ne bouge plus (déjà détaché à
    // l'état précédent, voir coinGroupAttrs(false) — les deux groupes
    // restent statiques à leur position). Seule sa couleur change, et
    // seulement côté intérêts (le capital reste encre, inchangé) : le
    // vert (même couleur que la portion majoritaire — l'abattement
    // n'est plus distingué d'un simple "non imposé", même code partout)
    // se déploie en rotation par-dessus le bleu, même technique que les
    // anneaux (voir couronneRingsHtml) appliquée à ce petit arc. Clé
    // "coin-or" gardée telle quelle (comme "bleu" plus haut porte le
    // rouge) : c'est le nom de l'état, pas la couleur rendue.
    capitalInner = CAPITAL_MAJORITY + `<g${coinGroupAttrs(false)}>${CAPITAL_COIN}</g>`;
    interetsInner =
      INTERETS_MAJORITY +
      `<g${coinGroupAttrs(false)}>${interetsCoinArcHtml("var(--rouge)", false)}${interetsCoinArcHtml("var(--vert)", animate)}</g>`;
  }

  // Le bloc des règles fiscales est toujours rendu, même vide : sinon sa
  // présence/absence déplace verticalement le disque au-dessus (voir
  // .fiscalite-rachats__rules en CSS pour la hauteur réservée).
  const rules = `
    <div class="fiscalite-rachats__rules">
      ${avant8Html(state?.avant8)}
      ${apres8Html(state?.apres8)}
    </div>
  `;

  return `
    <div class="fiscalite-rachats">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="fiscalite-rachats__intro">
        <h1 class="chap-title fiscalite-rachats__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="fiscalite-rachats__stage">
        <svg class="fiscalite-rachats__svg" viewBox="0 0 200 200" role="img" aria-label="Capital et intérêts">
          ${scaleGroupHtml(capitalInner, "fiscalite-rachats__capital", capitalEntering)}
          ${scaleGroupHtml(interetsInner, "fiscalite-rachats__interets", interetsGroupEntering)}
        </svg>
        <div class="fiscalite-rachats__legend">
          ${(state?.legend || []).map(legendEntryHtml).join("")}
        </div>
      </div>

      ${rules}
    </div>
  `;
}
