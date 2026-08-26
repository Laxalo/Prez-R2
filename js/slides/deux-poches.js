import { escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Deux poches dans un même contrat" (handoff slides assurance
// vie, GABARITS.md #4) — deux colonnes séparées d'un filet vertical,
// icônes fixes (structure du gabarit), textes pilotés par deck.json.
// Aucune quantification (pas de curseur chiffré) : la répartition se dit
// par une phrase ("En pratique").

function itemHtml(item, color) {
  return `
    <div class="deux-poches__item">
      ${iconSvg(item.icon, color)}
      <span class="deux-poches__item-text">${escapeHtml(item.texte)}</span>
    </div>
  `;
}

function colBody(col) {
  const isAccent = col.couleur === "bleu";
  const iconColor = isAccent ? "var(--bleu)" : `rgba(var(--chap-ink-rgb),.8)`;
  const tagStyle = isAccent ? `style="color:var(--bleu)"` : `style="color:rgba(var(--chap-ink-rgb),.5)"`;

  return `
    <div class="deux-poches__head">
      <span class="deux-poches__name">${escapeHtml(col.nom)}</span>
      <span class="deux-poches__tag" ${tagStyle}>${escapeHtml(col.tag)}</span>
    </div>
    ${(col.items || []).map((item) => itemHtml(item, iconColor)).join("")}
  `;
}

// Colonne toujours rendue avec son vrai contenu (jamais un placeholder
// vide) même avant sa révélation : seule l'opacité change (voir
// --invisible). Sinon sa hauteur réelle, une fois révélée, diffère de
// son placeholder vide, ce qui fait bouger .deux-poches__grid — centrée
// par margin:auto — et donc la colonne déjà affichée à côté (bug
// remonté : "fonds en euros" remontait quand "unités de compte"
// apparaissait).
function colHtml(col, { visible, entering }) {
  const cls = "deux-poches__col" + (!visible ? " deux-poches__col--invisible" : "") + (entering ? " is-entering" : "");
  return `<div class="${cls}"${entering ? " data-reveal" : ""}>${colBody(col)}</div>`;
}

// Révélation progressive en 4 états : état 1 = titre seul (arrivée sur
// la slide, jamais animée) ; état 2 = + Fonds en euros ; état 3 = +
// Unités de compte ; état 4 = + "En pratique", à la demande, une fois
// les deux poches déjà visibles (pas group avec la 2e poche). La grille
// reste à 2 colonnes dès l'état 1 (poches en placeholder vide) pour
// qu'aucune ne change de position/largeur en cours de route.
export function render(slide, opts = {}) {
  const [gauche, droite] = slide.colonnes || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 3);
  const animate = !!opts.animate;

  const showGauche = stateIndex >= 1;
  const gaucheEntering = animate && stateIndex === 1;
  const showDroite = stateIndex >= 2;
  const droiteEntering = animate && stateIndex === 2;
  const showPratique = stateIndex >= 3;
  const pratiqueEntering = animate && stateIndex === 3;

  return `
    <div class="deux-poches">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="deux-poches__intro">
        <h1 class="chap-title deux-poches__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="deux-poches__grid">
        ${colHtml(gauche, { visible: showGauche, entering: gaucheEntering })}
        <div class="deux-poches__divider${showDroite ? "" : " deux-poches__divider--hidden"}"></div>
        ${colHtml(droite, { visible: showDroite, entering: droiteEntering })}
      </div>

      <div class="deux-poches__practice${showPratique ? "" : " deux-poches__practice--invisible"}${pratiqueEntering ? " is-entering" : ""}"${pratiqueEntering ? " data-reveal" : ""}>
        <span class="deux-poches__practice-label">${escapeHtml(slide.pratique.label)}</span>
        <span class="deux-poches__practice-sep"></span>
        <p class="deux-poches__practice-text">${escapeHtml(slide.pratique.texte)}</p>
      </div>
    </div>
  `;
}
