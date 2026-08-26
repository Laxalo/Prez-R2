import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit générique "Titre de section" (handoff slides assurance vie,
// GABARITS.md #1) — réutilisable pour PER, SCPI, immobilier. Pas de rail
// d'étapes : la séquence du chapitre n'est pas encore annoncée.

export function render(slide) {
  return `
    <div class="section-title">
      ${renderChapRail(slide)}
      <div class="section-title__body">
        <span class="section-title__rule"></span>
        <h1 class="chap-title section-title__title">${escapeHtml(slide.titre)}</h1>
        <p class="section-title__sub">${escapeHtml(slide.sousTitre)}</p>
      </div>
    </div>
  `;
}
