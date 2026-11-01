import { escapeHtml } from "../editable.js";
import { renderChapRail, renderATerme, isATermeList, isATermeLigne, renderStatut } from "./_chapitre.js";

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
// qualitatifs, aucun chiffre à retirer). Révélation LIGNE PAR LIGNE (pas
// un état par préconisation) : un clic = une ligne — le nom, son
// éventuelle question, puis chaque puce et son éventuelle question,
// préconisation après préconisation ; dernier état = "à terme". Le
// nombre d'états dépend donc du détail (puces/questions) de chaque
// préconisation, pas seulement de leur nombre — voir precoMeta ci-dessous,
// qui numérote chaque ligne dans l'ordre de lecture.
export function render(slide, opts = {}) {
  const preco = slide.preconisations || [];
  const animate = !!opts.animate;

  // Une ou deux questions selon la préconisation (versement initial ET
  // programmé pour assurance-vie/SCPI en direct, une seule pour le
  // financement — pas de versement initial là). La 1ère question se pose
  // à côté du nom, comme un montant l'aurait fait ; les suivantes se
  // posent chacune à côté d'une puce (dans l'ordre) — ceci ne détermine
  // que l'EMPLACEMENT visuel, pas l'ordre d'apparition (voir plus bas). Un
  // éventuel surplus de questions (au-delà du nombre de puces) s'empile
  // sur la dernière puce plutôt que d'être perdu.
  //
  // Une puce peut porter insertsAfter: [{type:"budget", index}, ...] ou
  // {type:"headQuestion", preco} — cas d'usage ponctuel (ex.
  // client-B.json) où une ligne de budget et/ou la 1ère question
  // d'une préconisation (potentiellement une AUTRE, ou celle-ci) doivent
  // être révélées à des clics dédiés, juste après cette puce, plutôt
  // qu'à leur tour naturel. Chaque entrée d'insertsAfter RÉSERVE son
  // propre état (cursor++), dans l'ordre du tableau — jamais de collision
  // avec un autre élément (contrairement à un simple recalcul de
  // position "bulletState + offset", qui pouvait tomber sur un état déjà
  // pris par un élément voisin). Un preco dont la 1ère question est ainsi
  // différée n'obtient PAS de créneau à son tour naturel (voir
  // delayedHeadQPrecos) — son état final est résolu une fois toutes les
  // insertions traitées.
  const delayedHeadQPrecos = new Set();
  preco.forEach((p) => {
    (p.bullets || []).forEach((b) => {
      if (b && typeof b === "object" && Array.isArray(b.insertsAfter)) {
        b.insertsAfter.forEach((ins) => {
          if (ins.type === "headQuestion") delayedHeadQPrecos.add(ins.preco);
        });
      }
    });
  });

  let cursor = 1; // état 0 = titre + budget
  const budgetTargets = {}; // index de slide.budget[] -> état réservé
  const headQStateByPreco = {}; // index de préconisation -> état réservé

  const precoMeta = preco.map((p, pi) => {
    const bulletsArr = p.bullets || [];
    // p.statut (voir renderStatut, _chapitre.js) marque une
    // préconisation déjà mise en place : pas de question à poser en
    // RDV pour elle, un badge "Déjà en place" prend la place du nom→puce
    // habituel — les questions éventuelles du JSON sont ignorées plutôt
    // que de réserver des états qui ne s'afficheraient jamais.
    const questions = p.statut ? [] : (p.questions || []);
    const headQuestions = questions.slice(0, 1);
    const bulletQuestions = questions.slice(1);

    // Emplacement de chaque question (à côté du nom ou d'une puce donnée)
    // déterminé ici, mais son ÉTAT D'APPARITION est assigné plus bas —
    // toujours après la dernière puce de CE bloc, jamais mélangé aux
    // puces encore en cours de révélation.
    const bulletQuestionsByIndex = bulletsArr.map((_, bi) => {
      const isLastBullet = bi === bulletsArr.length - 1;
      return isLastBullet ? bulletQuestions.slice(bi) : bulletQuestions.slice(bi, bi + 1);
    });

    const nomState = cursor++;
    const bulletStates = bulletsArr.map((b) => {
      const state = cursor++;
      if (b && typeof b === "object" && Array.isArray(b.insertsAfter)) {
        b.insertsAfter.forEach((ins) => {
          if (ins.type === "budget") budgetTargets[ins.index] = cursor++;
          else if (ins.type === "headQuestion") headQStateByPreco[ins.preco] = cursor++;
        });
      }
      return state;
    });

    const headQuestionEntry = headQuestions[0];
    const headQTexte = headQuestionEntry == null ? null : typeof headQuestionEntry === "string" ? headQuestionEntry : headQuestionEntry.texte;
    const headQState = headQTexte == null ? null : delayedHeadQPrecos.has(pi) ? null /* résolu après coup */ : cursor++;

    const bulletQStatesByIndex = bulletQuestionsByIndex.map((qs) => qs.map((q) => ({ texte: q, state: cursor++ })));

    // Une puce est en général une simple chaîne. Elle peut aussi être un
    // objet { texte, accent, insertsAfter } — cas d'usage ponctuel (ex.
    // client-B.json) où une puce précise doit se distinguer (accent
    // "or") du reste, comme la ligne de budget ci-dessus.
    const bulletEntries = bulletsArr.map((b, bi) => ({
      texte: typeof b === "string" ? b : b.texte,
      accent: typeof b === "string" ? null : b.accent,
      bulletState: bulletStates[bi],
      qEntries: bulletQStatesByIndex[bi],
    }));

    return { p, nomState, headQuestion: headQTexte, headQState, bulletEntries };
  });
  // Résout les questions différées (headQState réservé au point
  // d'insertion, voir insertsAfter ci-dessus).
  precoMeta.forEach((meta, pi) => {
    if (delayedHeadQPrecos.has(pi)) meta.headQState = headQStateByPreco[pi];
  });
  const aTermeState = cursor;

  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), aTermeState);
  const showATerme = stateIndex >= aTermeState;
  const aTermeEntering = animate && stateIndex === aTermeState;

  // Une ligne de budget (slide.budget[]) est en général une simple
  // chaîne, affichée telle quelle dès l'état 0 (comportement inchangé
  // pour tous les clients existants). Elle peut aussi être un objet
  // { texte, accent } dont la révélation est différée via insertsAfter
  // sur une puce (voir plus haut, budgetTargets) — cas d'usage ponctuel
  // (ex. client-B.json) où une ligne doit se distinguer (accent
  // "or") et n'apparaître qu'après une puce précise, plutôt qu'avec le
  // reste de l'intro. Toujours rendue dans le flux (même principe
  // --invisible qu'ailleurs sur cette slide) : ne redéplace jamais le
  // filet or sous elle.
  const budgetLineHtml = (entry, index) => {
    if (typeof entry === "string") {
      return `<p class="cloture__budget-line">${escapeHtml(entry)}</p>`;
    }
    const target = budgetTargets[index] ?? null;
    const visible = target == null || stateIndex >= target;
    const entering = target != null && animate && stateIndex === target;
    const accentCls = entry.accent ? ` cloture__budget-line--${entry.accent}` : "";
    return `<p class="cloture__budget-line${accentCls}${!visible ? " cloture__budget-line--invisible" : ""}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>${escapeHtml(entry.texte)}</p>`;
  };

  // Une question (span) est toujours rendue dans son conteneur, même
  // avant son état d'apparition (même principe que --invisible ailleurs
  // sur cette slide) : réserve sa place, seule l'opacité change.
  const renderQuestionSpan = (texte, state) => {
    const visible = stateIndex >= state;
    const entering = animate && stateIndex === state;
    return `<span class="cloture-d__row-question${!visible ? " cloture-d__row-question--invisible" : ""}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>${escapeHtml(texte)}</span>`;
  };

  // Toujours rendues, même avant leur état d'apparition (voir
  // --invisible) : la liste garde sa hauteur pleine dès le premier état,
  // seule l'opacité de chaque ligne change — sinon la liste grandit à
  // chaque clic et redéplace le bloc "à terme" sous elle (même bug que
  // celui corrigé sur le sous-titre de "Investir en financement").
  const rows = precoMeta
    .map(({ p, nomState, headQuestion, headQState, bulletEntries }, i) => {
      const rowVisible = stateIndex >= nomState;
      const rowEntering = animate && stateIndex === nomState;
      const last = i === preco.length - 1;
      // La variante --ligne de "à terme" (voir isATermeLigne() dans
      // _chapitre.js) dessine son propre séparateur (border-top de
      // .cloture__aterme--ligne) juste après ce bloc : la dernière ligne
      // garde alors le même espacement que les autres (pas de
      // .cloture-d__row--last, qui aplatirait ce padding), sans dupliquer
      // le trait (--last-ligne coupe juste son propre border-bottom).
      const lastLigne = last && isATermeLigne(slide.aTerme);

      const headQHtml = p.statut
        ? renderStatut(p.statut)
        : headQuestion
        ? `<div class="cloture-d__row-questions">${renderQuestionSpan(headQuestion, headQState)}</div>`
        : "";

      const bullets = bulletEntries
        .map(({ texte, accent, bulletState, qEntries }) => {
          const bulletVisible = stateIndex >= bulletState;
          const bulletEntering = animate && stateIndex === bulletState;
          const qHtml = qEntries.length
            ? `<div class="cloture-d__row-questions">${qEntries.map((q) => renderQuestionSpan(q.texte, q.state)).join("")}</div>`
            : "";
          const textCls = "cloture-d__bullet-text" + (accent ? ` cloture-d__bullet-text--${accent}` : "");
          return `
          <div class="cloture-d__bullet${qHtml ? " cloture-d__bullet--with-question" : ""}${!bulletVisible ? " cloture-d__bullet--invisible" : ""}${bulletEntering ? " is-entering" : ""}"${bulletEntering ? " data-reveal" : ""}>
            <span class="cloture-d__bullet-content">
              <span class="cloture-d__bullet-dash"></span>
              <span class="${textCls}">${escapeHtml(texte)}</span>
            </span>
            ${qHtml}
          </div>
        `;
        })
        .join("");
      return `
        <div class="cloture-d__row${last && !lastLigne ? " cloture-d__row--last" : ""}${lastLigne ? " cloture-d__row--last-ligne" : ""}${rowVisible ? "" : " cloture-d__row--invisible"}${rowEntering ? " is-entering" : ""}"${rowEntering ? " data-reveal" : ""}>
          <div class="cloture-d__row-head">
            <span class="cloture-d__row-nom${p.statut ? " cloture-d__row-nom--statut" : ""}">${escapeHtml(p.nom)}</span>
            ${headQHtml}
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
        <div class="cloture__budget">${(slide.budget || []).map((entry, i) => budgetLineHtml(entry, i)).join("")}</div>
        <span class="cloture__rule"></span>
      </div>

      <div class="cloture-d__list">
        ${rows}
      </div>

      <div class="cloture__aterme${isATermeList(slide.aTerme) ? " cloture__aterme--list" : ""}${isATermeLigne(slide.aTerme) ? " cloture__aterme--ligne" : ""}${!showATerme ? " cloture__aterme--invisible" : ""}${aTermeEntering ? " is-entering" : ""}"${aTermeEntering ? " data-reveal" : ""}>
        <span class="cloture__aterme-label">${escapeHtml(slide.aTerme.label)}</span>
        ${renderATerme(slide.aTerme)}
      </div>
    </div>
  `;
}
