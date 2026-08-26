import { euro, escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes } from "./_chapitre.js";

// Gabarit "Épargne dormante" (handoff slides assurance vie,
// GABARITS.md #3) — chronologie à n colonnes, barre proportionnelle en
// encre dégressive. Hauteurs et opacités dérivées des montants, jamais
// saisies en dur (même principe que la règle de répartition Constat).

const BAR_REF_HEIGHT_CQW = 15.3125; // 196px à 1280 de large, pour le 1er montant
const OPACITY_START = 0.8;
const OPACITY_END = 0.26;

function colHtml(h, i, n, firstMontant, { visible, entering }) {
  if (!visible) return `<div class="epargne-dormante__col--empty"></div>`;

  const height = (h.montant / firstMontant) * BAR_REF_HEIGHT_CQW;
  const opacity = n > 1 ? OPACITY_START - (i * (OPACITY_START - OPACITY_END)) / (n - 1) : OPACITY_START;
  const cls = "epargne-dormante__col" + (entering ? " is-entering" : "");

  return `
    <div class="${cls}"${entering ? " data-reveal" : ""}>
      <span class="epargne-dormante__value">${euro.format(h.montant)}</span>
      <span class="epargne-dormante__bar" style="height:${height}cqw;opacity:${opacity.toFixed(2)}"></span>
      <span class="epargne-dormante__label">${escapeHtml(h.label)}</span>
    </div>
  `;
}

// Révélation progressive cumulative (un horizon de plus par état) : la
// grille réserve toujours ses n colonnes, comme le gabarit "Annonce à
// règles" (voir chapitre-regles.js) — pas de recalcul de mise en page à
// chaque étape.
export function render(slide, opts = {}) {
  const horizons = slide.horizons || [];
  const firstMontant = horizons[0]?.montant || 1;
  const visibleCount = Math.min(Math.max((opts.stateIndex ?? 0) + 1, 1), horizons.length);
  const animate = !!opts.animate;

  return `
    <div class="epargne-dormante">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="epargne-dormante__intro">
        <h1 class="chap-title epargne-dormante__title">${escapeHtml(slide.titre)}</h1>
      </div>

      ${slide.diagrammeIntro ? `<p class="epargne-dormante__diagram-intro">${escapeHtml(slide.diagrammeIntro)}</p>` : ""}

      <div class="epargne-dormante__grid" style="grid-template-columns:repeat(${horizons.length},1fr)">
        ${horizons
          .map((h, i) =>
            colHtml(h, i, horizons.length, firstMontant, {
              visible: i < visibleCount,
              entering: animate && i === visibleCount - 1,
            })
          )
          .join("")}
      </div>

      ${slide.hypothese ? `<p class="epargne-dormante__note">${escapeHtml(slide.hypothese)}</p>` : ""}
    </div>
  `;
}
