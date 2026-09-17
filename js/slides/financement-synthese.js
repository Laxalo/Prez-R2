import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";
import { renderDiagramme } from "./financement-fiscalite.js";
import { renderIntro, renderListe } from "./financement-duree.js";

// Gabarit "Comment se constituer du patrimoine immobilier ?" — slide 3/3
// du chapitre pédagogique fixe "Les leviers d'un financement long" —
// l'avantage fiscal : reprend tel quel le diagramme final de la slide 1
// (financement-fiscalite.js, état 9 — voir renderDiagramme(), exportée
// pour être réutilisée ici plutôt que reconstruite) et la même intro
// (icône + montant, liste des 3 bénéfices) que la slide 2, "3) Avantage
// fiscal" actif.
//
// 2 états :
//   1. icône + montant, liste (avantage fiscal actif), diagramme complet
//   2. deux flèches — impôts qui reculent, charges déductibles qui montent
export const STATE_COUNT = 2;

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const showFleches = stateIndex >= 1;
  const flechesEntering = animate && stateIndex === 1;

  const diagramme = renderDiagramme(slide, {
    showRevenus: true,
    showImpots: true,
    showRevenusFonciers: true,
    showImpotsRF: true,
    showCharges: true,
    showInterets: true,
    showLigne: true,
    showHachure: true,
    showBarre: true,
  });

  return `
    <div class="financement-synthese">
      ${renderChapRail(slide)}

      <div class="financement-synthese__intro">
        <h1 class="chap-title financement-synthese__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="fd__row">
        ${renderIntro(slide)}
        <div class="fd__liste-wrap">${renderListe(2)}</div>
      </div>

      <div class="fs__diagram-wrap">
        ${diagramme}
        ${
          showFleches
            ? `
              <span class="fs__fleche fs__fleche--bas${flechesEntering ? " is-entering" : ""}"${flechesEntering ? " data-reveal" : ""} style="left:${FF_COL_IMPOTS_CENTER}cqw">
                <svg width="100%" height="100%" viewBox="0 0 20 40" preserveAspectRatio="none"><path d="M10 2v28M2 24 L10 34 L18 24" fill="none" stroke="var(--bleu)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="fs__fleche fs__fleche--haut${flechesEntering ? " is-entering" : ""}"${flechesEntering ? " data-reveal" : ""} style="left:${FF_COL_CHARGES_CENTER}cqw">
                <svg width="100%" height="100%" viewBox="0 0 20 40" preserveAspectRatio="none"><path d="M10 38V10M2 16 L10 6 L18 16" fill="none" stroke="var(--or)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            `
            : ""
        }
      </div>
    </div>
  `;
}

// Centres des colonnes "Charges déductibles" (2e) et "Impôts" (3e) du
// diagramme réutilisé — mêmes constantes géométriques que
// financement-fiscalite.js (STAGE_W/COL_GAP/COL_W), dupliquées ici
// plutôt qu'importées : ce ne sont que deux nombres, l'exporter en plus
// de renderDiagramme() ajouterait une dépendance pour un gain minime.
const FF_STAGE_W = 90.3125;
const FF_COL_GAP = 3;
const FF_COL_W = (FF_STAGE_W - 2 * FF_COL_GAP) / 3;
const FF_COL_CHARGES_CENTER = FF_COL_W + FF_COL_GAP + FF_COL_W / 2;
const FF_COL_IMPOTS_CENTER = 2 * (FF_COL_W + FF_COL_GAP) + FF_COL_W / 2;
