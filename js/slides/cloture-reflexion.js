import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Clôture — réflexion" : duplicata de "Clôture" (cloture-detail.js,
// voir son en-tête) — même habillage, même registre empilé, mais
// affichée AVANT elle dans le RDV : on pose la question de l'effort
// d'épargne avant de proposer un montant, plutôt que d'ancrer le client
// sur un chiffre. La seule différence de fond est donc l'absence de
// chiffres : le montant de chaque préconisation (cloture-d__row-montant,
// Bodoni + or — réservé aux VALEURS, voir charte) devient une question
// courte (cloture-d__row-question, Avenir + or — occupe la même place
// qu'un montant, reste en or même sans être une donnée chiffrée), et
// la phrase de budget devient elle aussi une
// question ouverte. Bullets et "à terme" restent inchangés (déjà
// qualitatifs, aucun chiffre à retirer). Révélation en (3 + N
// préconisations) états : état 1 = titre + budget ; états 2..N+1 = une
// préconisation à la fois (nom + puces, questions encore masquées) ;
// état N+2 = les questions de toutes les préconisations apparaissent
// ensemble, une fois les N blocs déjà visibles ; état N+3 = "à terme".
export function render(slide, opts = {}) {
  const preco = slide.preconisations || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), preco.length + 2);
  const animate = !!opts.animate;

  const visibleCount = Math.min(Math.max(stateIndex, 0), preco.length);
  const questionsState = preco.length + 1;
  const showQuestions = stateIndex >= questionsState;
  const questionsEntering = animate && stateIndex === questionsState;
  const showATerme = stateIndex >= preco.length + 2;
  const aTermeEntering = animate && stateIndex === preco.length + 2;

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
      // Une ou deux questions selon la préconisation (versement initial
      // ET programmé pour assurance-vie/SCPI en direct, une seule pour
      // le financement — pas de versement initial là) : toujours un
      // tableau, empilées à droite plutôt qu'un champ singulier qui
      // forcerait à choisir laquelle garder.
      const questions = (p.questions || [])
        .map((q) => `<span class="cloture-d__row-question">${escapeHtml(q)}</span>`)
        .join("");
      const questionsCls =
        "cloture-d__row-questions" +
        (!showQuestions ? " cloture-d__row-questions--invisible" : "") +
        (questionsEntering ? " is-entering" : "");
      return `
        <div class="cloture-d__row${last ? " cloture-d__row--last" : ""}${visible ? "" : " cloture-d__row--invisible"}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          <div class="cloture-d__row-head">
            <span class="cloture-d__row-nom">${escapeHtml(p.nom)}</span>
            <div class="${questionsCls}"${questionsEntering ? " data-reveal" : ""}>${questions}</div>
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
