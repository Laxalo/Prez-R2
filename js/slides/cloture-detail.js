import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Clôture" : dernière slide du RDV, fond encre à la manière de
// "Constat" (même rail, même bloc titre+filet or) — un bookend visuel du
// début et de la fin de la présentation. Registre des préconisations
// retenues en liste EMPILÉE (une ligne par préconisation, chacune avec
// 2 puces rendement/fiscalité/ingénierie, filet horizontal entre
// chacune) plutôt qu'en colonnes — le texte ne tiendrait pas sur un
// tiers de largeur. Révélation progressive cumulative en
// (2 + N préconisations) états (opts.stateIndex direct, même mécanisme
// que "Les atouts") : état 1 = titre + budget (arrivée) ; états 2..N+1 =
// une préconisation à la fois ; dernier état = la conclusion "à terme".
export function render(slide, opts = {}) {
  const preco = slide.preconisations || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), preco.length + 1);
  const animate = !!opts.animate;

  const visibleCount = Math.min(Math.max(stateIndex, 0), preco.length);
  const showATerme = stateIndex >= preco.length + 1;
  const aTermeEntering = animate && stateIndex === preco.length + 1;

  // Toujours rendues, même avant leur état d'apparition (voir
  // --invisible) : la liste garde sa hauteur pleine dès le premier état,
  // seule l'opacité de chaque ligne change — sinon la liste grandit à
  // chaque clic et redéplace le bloc "à terme" sous elle (même bug que
  // celui corrigé sur le sous-titre de "Investir en financement").
  const rows = preco
    .map((p, i) => {
      const visible = i < visibleCount;
      const entering = animate && stateIndex === i + 1;
      const last = i === preco.length - 1;
      const bullets = (p.bullets || [])
        .map(
          (b) => `
          <div class="cloture-d__bullet">
            <span class="cloture-d__bullet-dash"></span>
            <span class="cloture-d__bullet-text">${escapeHtml(b)}</span>
          </div>
        `
        )
        .join("");
      return `
        <div class="cloture-d__row${last ? " cloture-d__row--last" : ""}${visible ? "" : " cloture-d__row--invisible"}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          <div class="cloture-d__row-head">
            <span class="cloture-d__row-nom">${escapeHtml(p.nom)}</span>
            <span class="cloture-d__row-montant">${escapeHtml(p.montant)}</span>
          </div>
          <div class="cloture-d__bullets">${bullets}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="cloture">
      ${renderChapRail(slide)}

      <div class="cloture__intro">
        <h1 class="chap-title cloture__title">${escapeHtml(slide.titre)}</h1>
        <span class="cloture__rule"></span>
        <div class="cloture__budget">${(slide.budget || []).map((line) => `<p class="cloture__budget-line">${escapeHtml(line)}</p>`).join("")}</div>
      </div>

      <div class="cloture-d__list">
        ${rows}
      </div>

      <div class="cloture__aterme${!showATerme ? " cloture__aterme--invisible" : ""}${aTermeEntering ? " is-entering" : ""}"${aTermeEntering ? " data-reveal" : ""}>
        <span class="cloture__aterme-label">${escapeHtml(slide.aTerme.label)}</span>
        <p class="cloture__aterme-text">${escapeHtml(slide.aTerme.texte)}</p>
      </div>
    </div>
  `;
}
