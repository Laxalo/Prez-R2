import { escapeHtml } from "../editable.js";
import { renderChapRail, renderATerme, isATermeList, isATermeLigne, renderStatut } from "./_chapitre.js";

// Gabarit "Clôture" : dernière slide du RDV, fond encre à la manière de
// "Constat" (même rail, même bloc titre+filet or) — un bookend visuel du
// début et de la fin de la présentation. Registre des préconisations
// retenues en liste EMPILÉE (une ligne par préconisation, chacune avec
// 2 puces rendement/fiscalité/ingénierie, filet horizontal entre
// chacune) plutôt qu'en colonnes — le texte ne tiendrait pas sur un
// tiers de largeur. Révélation LIGNE PAR LIGNE (pas un état par
// préconisation) : un clic = une ligne — le nom (+ montant, même ligne),
// puis chaque puce, préconisation après préconisation ; dernier état =
// "à terme". Le nombre d'états dépend donc du nombre de puces de chaque
// préconisation, pas seulement de leur nombre — voir precoMeta ci-dessous.
// Racine marquée .cloture--detail (voir css/chapitre.css). Un montant simple
// reste à côté du nom (cloture-d__row-montant, Bodoni). Quand la
// préconisation a versement initial ET programmé, on reprend EXACTEMENT le
// mécanisme de cloture-reflexion.js plutôt que d'empiler les deux lignes
// dans l'en-tête : "programmé" à côté du nom (comme une question), "initial"
// accroché à la PREMIÈRE puce (cloture-d__bullet--with-question + translateY,
// voir css/chapitre.css — c'est là, pas sur la dernière, que
// cloture-reflexion.js pose sa 2e question quand il n'y en a qu'une en trop
// par rapport aux puces, cas le plus courant) — sinon le bloc de 2 lignes,
// aligné par le bas (flex-end) sur le nom, déborde vers le haut et écrase
// l'espace au-dessus de la ligne (visible en comparant aux positions de
// cloture-reflexion.js).
export function render(slide, opts = {}) {
  const preco = slide.preconisations || [];
  const animate = !!opts.animate;

  let cursor = 1; // état 0 = titre + budget
  const precoMeta = preco.map((p) => {
    const bulletsArr = p.bullets || [];
    const nomState = cursor++;
    // Une puce est en général une simple chaîne. Elle peut aussi être un
    // objet { texte, accent } — cas d'usage ponctuel (ex.
    // gaelle-pigot.json), voir cloture-reflexion.js (même mécanisme).
    const bulletEntries = bulletsArr.map((b) => ({
      texte: typeof b === "string" ? b : b.texte,
      accent: typeof b === "string" ? null : b.accent,
      bulletState: cursor++,
    }));
    return { p, nomState, bulletEntries };
  });
  const aTermeState = cursor;

  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), aTermeState);
  const showATerme = stateIndex >= aTermeState;
  const aTermeEntering = animate && stateIndex === aTermeState;

  // Une ligne de budget (slide.budget[]) est en général une simple
  // chaîne, affichée telle quelle dès l'état 0 (comportement inchangé
  // pour tous les clients existants). Elle peut aussi être un objet
  // { texte, accent, revealAfter: { preco, bullet, offset } } — cas
  // d'usage ponctuel (ex. gaelle-pigot.json), voir cloture-reflexion.js
  // (même mécanisme, dupliqué ici). offset (défaut 0) décale la
  // révélation de N clics après cette puce.
  // p.montant est en général une simple chaîne ("500 €/mois"), rendue
  // sur une ligne (cloture-d__row-montant, Bodoni + or — réservé aux
  // valeurs chiffrées), à côté du nom, visible dès l'apparition de la
  // ligne (même état que le nom, comme le reste de l'en-tête). p.montant
  // peut aussi être un objet — { texte } pour un montant pas encore
  // chiffré ("à définir", même style Avenir que les questions de
  // cloture-reflexion.js), ou { programme, initial } quand la
  // préconisation a versement initial ET programmé : "programme" reste
  // à côté du nom (headLineHtml, visible dès la ligne), "initial" est
  // accroché à la DERNIÈRE puce (voir bulletMontantTexte plus bas, même
  // mécanisme que cloture-reflexion.js), pas empilé dans l'en-tête.
  // montant.revealAfter: { preco, bullet, offset } — cas d'usage ponctuel
  // (ex. gaelle-pigot.json) où la mention "programme"/"texte" de l'en-tête
  // ne doit apparaître qu'après une puce précise (éventuellement d'une
  // AUTRE préconisation), plutôt qu'en même temps que le nom — même
  // mécanisme que budgetLineHtml ci-dessous, réutilise un état déjà
  // réservé (bulletState + offset), n'en consomme pas de nouveau.
  const headLineHtml = (montant) => {
    if (montant && typeof montant === "object") {
      const texte = montant.texte || (montant.programme ? `Versement programmé : ${montant.programme}/mois` : null);
      if (!texte) return "";
      const target = montant.revealAfter
        ? precoMeta[montant.revealAfter.preco]?.bulletEntries[montant.revealAfter.bullet]?.bulletState + (montant.revealAfter.offset || 0)
        : null;
      const visible = target == null || stateIndex >= target;
      const entering = target != null && animate && stateIndex === target;
      return `<span class="cloture-d__row-question${!visible ? " cloture-d__row-question--invisible" : ""}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>${escapeHtml(texte)}</span>`;
    }
    return `<span class="cloture-d__row-montant">${escapeHtml(montant)}</span>`;
  };

  // Ligne "Versement initial" accrochée à la 1ère puce, exactement comme
  // une bulletQuestion de cloture-reflexion.js (même classes CSS, même
  // translateY) — jamais empilée dans l'en-tête avec "programme".
  const bulletMontantTexte = (montant) => (montant && typeof montant === "object" && montant.initial ? `Versement initial : ${montant.initial}` : null);

  const budgetLineHtml = (entry) => {
    if (typeof entry === "string") {
      return `<p class="cloture__budget-line">${escapeHtml(entry)}</p>`;
    }
    const target = entry.revealAfter
      ? precoMeta[entry.revealAfter.preco]?.bulletEntries[entry.revealAfter.bullet]?.bulletState + (entry.revealAfter.offset || 0)
      : null;
    const visible = target == null || stateIndex >= target;
    const entering = target != null && animate && stateIndex === target;
    const accentCls = entry.accent ? ` cloture__budget-line--${entry.accent}` : "";
    return `<p class="cloture__budget-line${accentCls}${!visible ? " cloture__budget-line--invisible" : ""}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>${escapeHtml(entry.texte)}</p>`;
  };

  // Toujours rendues, même avant leur état d'apparition (voir
  // --invisible) : la liste garde sa hauteur pleine dès le premier état,
  // seule l'opacité de chaque ligne change — sinon la liste grandit à
  // chaque clic et redéplace le bloc "à terme" sous elle (même bug que
  // celui corrigé sur le sous-titre de "Investir en financement").
  const rows = precoMeta
    .map(({ p, nomState, bulletEntries }, i) => {
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
      const initialTexte = p.statut ? null : bulletMontantTexte(p.montant);
      const bullets = bulletEntries
        .map(({ texte, accent, bulletState }, bi) => {
          const bulletVisible = stateIndex >= bulletState;
          const bulletEntering = animate && stateIndex === bulletState;
          const textCls = "cloture-d__bullet-text" + (accent ? ` cloture-d__bullet-text--${accent}` : "");
          const qHtml = bi === 0 && initialTexte
            ? `<div class="cloture-d__row-questions"><span class="cloture-d__row-question">${escapeHtml(initialTexte)}</span></div>`
            : "";
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
            ${p.statut ? renderStatut(p.statut) : headLineHtml(p.montant)}
          </div>
          <div class="cloture-d__bullets">${bullets}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="cloture cloture--detail">
      ${renderChapRail(slide)}

      <div class="cloture__intro">
        <h1 class="chap-title cloture__title">${escapeHtml(slide.titre)}</h1>
        <div class="cloture__budget">${(slide.budget || []).map(budgetLineHtml).join("")}</div>
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
