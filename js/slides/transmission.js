import { euro, escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Transmission" (handoff slides assurance vie, GABARITS.md #7)
// — deux colonnes séparées d'un filet vertical (même esprit que le
// gabarit "Deux poches") : à gauche le principe (clause bénéficiaire +
// bouclier), à droite une donation concrète illustrée (152 500 € par
// bénéficiaire, exonérés) puis les conditions "après 70 ans".
//
// Révélation progressive en 4 états : état 1 = titre/sous-titre seuls
// (arrivée sur la slide, jamais animée) ; état 2 = + clause bénéficiaire
// (colonne gauche) ; état 3 = + versements avant 70 ans (mini-titre et
// donation à droite, qui descend depuis un repère commun "Capital
// transmis" vers chaque bénéficiaire, en cascade — un léger délai par
// branche, voir CSS) ; état 4 = + versements après 70 ans. Chaque bloc
// reste dans le flux dès l'état 1 (juste invisible, voir --invisible) :
// la grille garde toujours sa hauteur pleine, rien ne bouge quand un
// bloc apparaît.

// 4e branche : un "..." plutôt qu'un 4e bénéficiaire chiffré, pour dire
// "le nombre de bénéficiaires n'est pas limité à 3" — un repère, pas un
// exemple de plus. TREE_X à 4 positions égales, pas 3 : le rail doit
// s'étendre jusqu'à la dernière branche, pas s'arrêter à l'avant-
// dernière. Centres recalculés pour un espacement à 1cqw entre colonnes
// (voir column-gap sur .transmission__branches, conteneur ~24,39cqw de
// large à 4 colonnes) — sans ce recalcul les branches (alignées sur la
// grille en dessous) se décaleraient des traits verticaux de l'arbre
// (dessinés, eux, sur ce viewBox 0-300 fixe). TREE_LEN_H dérive du
// premier/dernier centre plutôt qu'une valeur séparée, pour ne jamais
// désynchroniser la longueur du rail (stroke-dasharray) de ces centres.
const TREE_X = [32.887, 110.962, 189.038, 267.113];
const TREE_LEN_H = TREE_X[TREE_X.length - 1] - TREE_X[0];
const TREE_LEN_V = 60; // 70 - 10

function treeHtml(entering) {
  const railAttrs = entering
    ? ` data-reveal data-reveal-dashoffset="0" style="stroke-dashoffset:${TREE_LEN_H}"`
    : "";
  const branches = TREE_X.map((x, i) => {
    const attrs = entering
      ? ` data-reveal data-reveal-dashoffset="0" style="stroke-dashoffset:${TREE_LEN_V};--branch-index:${i}"`
      : "";
    return `<path class="transmission__tree-branch" d="M${x},10 L${x},70" stroke-dasharray="${TREE_LEN_V}"${attrs}/>`;
  }).join("");

  const railStart = TREE_X[0];
  const railEnd = TREE_X[TREE_X.length - 1];

  return `
    <svg class="transmission__tree" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true">
      <path class="transmission__tree-rail" d="M${railStart},10 L${railEnd},10" stroke-dasharray="${TREE_LEN_H}"${railAttrs}/>
      ${branches}
    </svg>
  `;
}

function beneficiaireHtml(montant) {
  return `
    <div class="transmission__branch">
      ${iconSvg("enfant", "var(--or)", 40)}
      <span class="transmission__branch-montant">${euro.format(montant)}</span>
    </div>
  `;
}

// 4e branche : un "..." à la place d'un 4e bénéficiaire chiffré — dit
// "et ainsi de suite", pas "en voici un 4e exemple". Même gabarit visuel
// que les branches chiffrées (un repère en haut, un texte en dessous),
// pour rester sur la même ligne, mais sans montant ni icône de personne.
function etcBranchHtml() {
  return `
    <div class="transmission__branch">
      <span class="transmission__branch-etc-spacer" aria-hidden="true"></span>
      <span class="transmission__branch-etc">…</span>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const c = slide.clause;
  const d = slide.donation;
  const a = slide.apres70;
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 3);
  const animate = !!opts.animate;

  const showClause = stateIndex >= 1;
  const clauseEntering = animate && stateIndex === 1;
  const showDonation = stateIndex >= 2;
  const donationEntering = animate && stateIndex === 2;
  const showApres70 = stateIndex >= 3;
  const apres70Entering = animate && stateIndex === 3;

  return `
    <div class="transmission">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="transmission__intro">
        <h1 class="chap-title transmission__title">${escapeHtml(slide.titre)}</h1>
        <p class="transmission__sub">${escapeHtml(slide.sousTitre)}</p>
      </div>

      <div class="transmission__body">
        <div class="transmission__grid">
          <div class="transmission__col${showClause ? "" : " transmission__col--invisible"}${clauseEntering ? " is-entering" : ""}"${clauseEntering ? " data-reveal" : ""}>
            ${iconSvg("bouclier", "rgba(var(--chap-ink-rgb),.8)", 72)}
            <span class="transmission__clause-label">${escapeHtml(c.label)}</span>
            <p class="transmission__clause-text">${escapeHtml(c.texte)}</p>
          </div>

          <div class="transmission__divider"></div>

          <div class="transmission__col transmission__col--droite">
            <div class="transmission__block${showDonation ? "" : " transmission__block--invisible"}${donationEntering ? " is-entering" : ""}"${donationEntering ? " data-reveal" : ""}>
              <span class="transmission__section-title">${escapeHtml(d.label)}</span>
              <div class="transmission__donation">
                <div class="transmission__source">
                  ${iconSvg("capital", "var(--or)", 36)}
                  <span class="transmission__source-label">Capital transmis</span>
                  ${treeHtml(donationEntering)}
                </div>
                <div class="transmission__branches" style="grid-template-columns:repeat(${d.beneficiaires.length + 1},1fr)">
                  ${d.beneficiaires.map(() => beneficiaireHtml(d.montant)).join("")}${etcBranchHtml()}
                </div>
                <p class="transmission__donation-note">${escapeHtml(d.note)}</p>
              </div>
            </div>

            <div class="transmission__block${showApres70 ? "" : " transmission__block--invisible"}${apres70Entering ? " is-entering" : ""}"${apres70Entering ? " data-reveal" : ""}>
              <span class="transmission__section-title transmission__section-title--apres70">${escapeHtml(a.label)}</span>
              <div class="transmission__footer-bullets">
                ${(a.bullets || [])
                  .map(
                    (b) => `
                  <div class="transmission__footer-bullet">
                    <span class="transmission__footer-bullet-dash"></span>
                    <span class="transmission__footer-bullet-text">${escapeHtml(b)}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
