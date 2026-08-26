import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Annonce à règles" (handoff slides assurance vie,
// GABARITS.md #2) — fixe pour tout chapitre à règles (rendement/
// fiscalité/transmission...), seuls les libellés et phrases teaser
// changent. Nombre de règles variable via la grille, comme le rail
// d'étapes qu'elle annonce.
//
// Révélation progressive cumulative en (2 + N règles) états : état 1 =
// titre seul (pas de sous-titre, pas de halo, pas de pictogramme) ;
// état 2 = + pictogramme (qui s'ouvre visuellement, voir --unlocking
// dans chapitre.css) et un halo temporaire (pulse, pas un accent
// permanent) sur le mot-clé du titre, PUIS le sous-titre une fois le
// cadenas effectivement ouvert (délai CSS calé sur la durée de son
// animation, pas un état supplémentaire) ; états 3..N+2 = + une règle à
// la fois. La grille réserve toujours ses N colonnes ET sa hauteur
// pleine (min-height, voir CSS) dès l'état 1 : le pictogramme, centré
// dans l'espace restant, ne doit pas changer de hauteur entre l'état où
// la grille est vide et celui où elle est pleine.

function titleWithHalo(titre, haloWord, pulse) {
  if (!haloWord) return escapeHtml(titre);
  const idx = titre.indexOf(haloWord);
  if (idx < 0) return escapeHtml(titre);
  const before = titre.slice(0, idx);
  const after = titre.slice(idx + haloWord.length);
  const cls = "chap-regles__halo" + (pulse ? " chap-regles__halo--pulse" : "");
  return `${escapeHtml(before)}<span class="${cls}">${escapeHtml(haloWord)}</span>${escapeHtml(after)}`;
}

function regleHtml(regle, { visible, entering }) {
  if (!visible) return `<div class="chap-regle--empty"></div>`;
  const cls = "chap-regle" + (entering ? " is-entering" : "");
  // La barre dorée se remplit de gauche à droite à l'apparition (voir
  // js/reveal.js data-reveal-transform) — attire l'œil sur la règle qui
  // vient d'apparaître, indépendamment du fondu du bloc entier.
  const fillAttrs = entering ? ` data-reveal data-reveal-transform="scaleX(1)" style="transform:scaleX(0)"` : "";
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""}>
      <span class="chap-regle__fill"${fillAttrs}></span>
      <div class="chap-regle__head">
        <span class="chap-regle__num">${escapeHtml(regle.numero)}</span>
        <span class="chap-regle__label">${escapeHtml(regle.label)}</span>
      </div>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const regles = slide.regles || [];
  const stateIndex = Math.max(opts.stateIndex ?? 0, 0);
  const animate = !!opts.animate;

  const showPicto = stateIndex >= 1;
  const pictoEntering = animate && stateIndex === 1;
  const pictoCls =
    "chap-regles__picto" +
    (!showPicto ? " chap-regles__picto--invisible" : "") +
    (pictoEntering ? " is-entering chap-regles__picto--unlocking" : "");

  // Le sous-titre apparaît au même état que le pictogramme, mais avec un
  // délai CSS (voir .chap-regles__lead[data-reveal] dans chapitre.css)
  // calé sur la durée de l'animation d'ouverture du cadenas : il ne
  // s'affiche qu'une fois le cadenas effectivement ouvert, pas en même
  // temps qu'il commence à s'ouvrir.
  const showLead = stateIndex >= 1;
  const leadEntering = pictoEntering;
  const leadCls =
    "chap-regles__lead" + (!showLead ? " chap-regles__lead--invisible" : "") + (leadEntering ? " is-entering" : "");

  // Les règles viennent après le pictogramme (états 3+, soit stateIndex
  // 2+) : décalé d'un cran par rapport à stateIndex.
  const visibleCount = Math.min(Math.max(stateIndex - 1, 0), regles.length);

  return `
    <div class="chap-regles">
      ${renderChapRail(slide)}

      <div class="chap-regles__intro">
        <p class="chap-regles__kicker">${escapeHtml(slide.kicker)}</p>
        <span class="chap-regles__rule"></span>
        <h1 class="chap-title chap-regles__title">${titleWithHalo(slide.titre, slide.titreHalo, pictoEntering)}</h1>
        <p class="${leadCls}"${leadEntering ? " data-reveal" : ""}>${escapeHtml(slide.lead)}</p>
      </div>

      <div class="${pictoCls}"${pictoEntering ? " data-reveal" : ""}>
        ${iconSvg(slide.picto || "disponibilite", "var(--or)", 96)}
      </div>

      <div class="chap-regles__grid" style="grid-template-columns:repeat(${regles.length},1fr)">
        ${regles
          .map((regle, i) =>
            regleHtml(regle, {
              visible: i < visibleCount,
              entering: animate && i === visibleCount - 1,
            })
          )
          .join("")}
      </div>
    </div>
  `;
}
