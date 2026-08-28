import { escapeHtml } from "../editable.js";
import { renderChapRail, renderATerme, isATermeList } from "./_chapitre.js";

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
      // Une ou deux questions selon la préconisation (versement initial
      // ET programmé pour assurance-vie/SCPI en direct, une seule pour
      // le financement — pas de versement initial là). La 1ère question
      // se pose à côté du nom, comme un montant l'aurait fait ; les
      // suivantes se posent chacune à côté d'une puce (dans l'ordre),
      // pour ne jamais laisser l'en-tête de ligne pousser tout le bloc
      // de puces vers le bas (deux questions empilées dans l'en-tête
      // créaient un blanc entre le nom et la 1ère puce). Un éventuel
      // surplus de questions (au-delà du nombre de puces) s'empile sur
      // la dernière puce plutôt que d'être perdu.
      const bulletsArr = p.bullets || [];
      const questions = p.questions || [];
      const headQuestions = questions.slice(0, 1);
      const bulletQuestions = questions.slice(1);
      const questionsCls =
        "cloture-d__row-questions" +
        (!showQuestions ? " cloture-d__row-questions--invisible" : "") +
        (questionsEntering ? " is-entering" : "");
      const renderQuestions = (qs) =>
        qs.length
          ? `<div class="${questionsCls}"${questionsEntering ? " data-reveal" : ""}>${qs
              .map((q) => `<span class="cloture-d__row-question">${escapeHtml(q)}</span>`)
              .join("")}</div>`
          : "";
      const bullets = bulletsArr
        .map((b, bi) => {
          const isLastBullet = bi === bulletsArr.length - 1;
          const qs = isLastBullet ? bulletQuestions.slice(bi) : bulletQuestions.slice(bi, bi + 1);
          const qHtml = renderQuestions(qs);
          return `
          <div class="cloture-d__bullet${qHtml ? " cloture-d__bullet--with-question" : ""}">
            <span class="cloture-d__bullet-content">
              <span class="cloture-d__bullet-dash"></span>
              <span class="cloture-d__bullet-text">${escapeHtml(b)}</span>
            </span>
            ${qHtml}
          </div>
        `;
        })
        .join("");
      return `
        <div class="cloture-d__row${last ? " cloture-d__row--last" : ""}${visible ? "" : " cloture-d__row--invisible"}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          <div class="cloture-d__row-head">
            <span class="cloture-d__row-nom">${escapeHtml(p.nom)}</span>
            ${renderQuestions(headQuestions)}
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

      <div class="cloture__aterme${isATermeList(slide.aTerme) ? " cloture__aterme--list" : ""}${!showATerme ? " cloture__aterme--invisible" : ""}${aTermeEntering ? " is-entering" : ""}"${aTermeEntering ? " data-reveal" : ""}>
        <span class="cloture__aterme-label">${escapeHtml(slide.aTerme.label)}</span>
        ${renderATerme(slide.aTerme)}
      </div>
    </div>
  `;
}
