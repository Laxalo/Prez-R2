import { escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Les atouts" (chapitre SCPI, import Claude Design "Atouts -
// Design final") — PARAMÉTRIQUE : nombre d'atouts (2 à 4) et de puces
// par atout tous dérivés de deck.json (slide.atouts), rien saisi en
// dur. Révélation progressive à un état par PUCE (pas juste par atout) :
// chaque clic ajoute une puce ; une fois toutes les puces d'un atout
// affichées, le clic suivant passe au premier tiret de l'atout suivant
// (voir buildStates) — le stepper de gauche marque l'atout actif en or,
// le panneau de droite affiche son titre doré + ses puces.
//
// Colonne de gauche à largeur fixe (voir .atouts__side), reliée par un
// filet vertical continu derrière les cercles — un cercle plein or (+
// icône papier) pour l'atout actif, un cercle contour encre atténuée (+
// icône encre atténuée) pour les autres. Colonne de droite : contenu
// centré verticalement (justify-content:center) dans une hauteur FIXE
// (.atouts__stage min-height, calée sur l'atout qui a le plus de
// puces) — jamais de vide disproportionné ni de saut de mise en page
// d'un atout à l'autre, quel que soit leur nombre de puces.
function stepperItemHtml(atout, active) {
  const cls = "atouts__step" + (active ? " atouts__step--active" : "");
  const iconColor = active ? "var(--papier)" : "rgba(var(--chap-ink-rgb),.4)";
  return `
    <div class="${cls}">
      <span class="atouts__step-circle">${iconSvg(atout.icon, iconColor, 26)}</span>
      <span class="atouts__step-label">${escapeHtml(atout.label)}</span>
    </div>
  `;
}

// Un état par puce PLUS un état d'arrivée sans puce, toutes atouts
// confondus : {atoutIndex, visibleCount} où visibleCount va de 0
// (bascule du stepper + titre de l'atout, aucun tiret encore affiché —
// le premier tiret attend son propre clic, comme tous les autres) au
// nombre total de puces de l'atout. Dérivé de slide.atouts à chaque
// rendu — jamais une liste d'états saisie en dur dans deck.json, qui
// n'a qu'à porter le bon NOMBRE d'entrées (voir "states" dans
// deck.json : (nb de puces + 1) par atout).
function buildStates(atouts) {
  const states = [];
  atouts.forEach((a, atoutIndex) => {
    const n = (a.bullets || []).length;
    for (let visibleCount = 0; visibleCount <= n; visibleCount++) {
      states.push({ atoutIndex, visibleCount });
    }
  });
  return states;
}

export function render(slide, opts = {}) {
  const atouts = slide.atouts || [];
  const animate = !!opts.animate;
  const flatStates = buildStates(atouts);
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), Math.max(flatStates.length - 1, 0));
  const current = flatStates[stateIndex] || { atoutIndex: 0, visibleCount: 0 };
  const activeIndex = current.atoutIndex;
  const visibleCount = current.visibleCount;
  const atout = atouts[activeIndex] || {};

  // Arrivée sur cet atout (visibleCount===0, aucun tiret encore
  // affiché) : le panneau entier (titre doré + liste) rentre avec un
  // fondu — c'est le changement d'atout. États suivants (visibleCount>0,
  // même atout) : seule LA puce qui vient d'apparaître a sa propre
  // entrée, le reste du panneau reste en place (pas de refondu à chaque
  // tiret).
  const atoutEntering = animate && visibleCount === 0;

  const stepper = atouts.map((a, i) => stepperItemHtml(a, i === activeIndex)).join("");

  // Toutes les puces de l'atout actif sont TOUJOURS rendues (--invisible
  // au-delà de visibleCount, jamais absentes) : la liste garde sa
  // hauteur pleine dès le premier tiret, sinon le panneau (centré via
  // justify-content:center) sauterait de position à chaque clic — même
  // principe que .cloture-d__row--invisible.
  const bullets = (atout.bullets || [])
    .map((b, i) => {
      const shown = i < visibleCount;
      const entering = animate && i === visibleCount - 1;
      const cls = "atouts__bullet" + (shown ? "" : " atouts__bullet--invisible") + (entering ? " is-entering" : "");
      return `
      <div class="${cls}"${entering ? " data-reveal" : ""}>
        <span class="atouts__bullet-dash">—</span>
        <span class="atouts__bullet-text">${escapeHtml(b)}</span>
      </div>
    `;
    })
    .join("");

  return `
    <div class="atouts">
      ${renderChapRail(slide)}
      ${slide.railEtapes ? renderRailEtapes(slide.railEtapes, slide.railActive) : ""}

      <div class="atouts__intro">
        <h1 class="chap-title atouts__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="atouts__stage">
        <div class="atouts__side">
          <span class="atouts__side-line"></span>
          ${stepper}
        </div>
        <div class="atouts__content${atoutEntering ? " is-entering" : ""}"${atoutEntering ? " data-reveal" : ""}>
          <span class="atouts__kicker">${escapeHtml((atout.label || "").toUpperCase())}</span>
          <div class="atouts__bullets">${bullets}</div>
        </div>
      </div>
    </div>
  `;
}
