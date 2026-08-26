// Anime les éléments qui viennent d'apparaître dans une révélation
// progressive (voir js/deck.js stepForward/stepBackward). Le rendu d'une
// slide remplace tout son HTML à chaque changement d'état (pas de patch
// DOM ciblé) : une transition CSS ne peut donc pas se déclencher toute
// seule (l'élément "avant" n'existe plus, il n'y a rien dont partir). La
// solution : le renderer marque les éléments neufs avec l'attribut
// data-reveal (état de départ posé dans le HTML lui-même, via la classe
// .is-entering — voir chapitre.css), puis playReveal() retire cette
// classe une fois l'élément posé dans le DOM, ce qui déclenche la
// transition CSS vers l'état normal. Le double requestAnimationFrame
// garantit que le navigateur a bien peint l'état de départ avant qu'on
// ne le change (sinon le navigateur peut fusionner les deux états et ne
// jamais jouer la transition).
//
// data-reveal-height (optionnel) : pour un mouvement de valeur plutôt
// qu'un simple fondu (ex. le niveau d'une cuve qui descend) — la valeur
// de départ est posée en style inline, data-reveal-height porte la
// valeur cible ; playReveal() l'applique au même moment qu'elle retire
// .is-entering, sur le même tick.
//
// data-reveal-width / data-reveal-left (optionnels) : même principe que
// data-reveal-height, pour un mouvement horizontal (ex. une colonne qui
// se rétracte, un repère qui glisse le long d'un axe — "Investir en
// financement").
//
// data-reveal-transform (optionnel) : même principe pour un mouvement de
// transform plutôt qu'un fondu générique (ex. une barre qui se remplit
// en largeur, scaleX(0) -> scaleX(1)) — indépendant de .is-entering, qui
// porte son propre transform (scale uniforme) pour le fondu générique.
//
// data-reveal-dashoffset (optionnel) : pour un anneau (cercle au trait)
// qui se déploie dans le sens horaire, façon "wipe" d'horloge — la valeur
// de départ (stroke-dashoffset = circonférence, trait invisible) est
// posée en style inline, data-reveal-dashoffset porte la valeur cible (0,
// trait plein) ; un cercle SVG se trace depuis 3h dans le sens horaire,
// d'où l'effet.
//
// data-reveal-bg (optionnel) : pour un changement de couleur de fond
// plutôt qu'un fondu générique (ex. un gris qui devient vert) — la
// couleur de départ est posée en style inline (background), data-reveal-
// bg porte la couleur cible ; nécessite une transition CSS sur
// background-color côté règle (le fondu générique ne la couvre pas).
export function playReveal(container) {
  const els = container.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    els.forEach((el) => {
      el.classList.remove("is-entering");
      if (el.dataset.revealHeight) el.style.height = el.dataset.revealHeight;
      if (el.dataset.revealWidth) el.style.width = el.dataset.revealWidth;
      if (el.dataset.revealLeft) el.style.left = el.dataset.revealLeft;
      if (el.dataset.revealTransform) el.style.transform = el.dataset.revealTransform;
      if (el.dataset.revealDashoffset) el.style.strokeDashoffset = el.dataset.revealDashoffset;
      if (el.dataset.revealBg) el.style.background = el.dataset.revealBg;
    });
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      els.forEach((el) => {
        el.classList.remove("is-entering");
        if (el.dataset.revealHeight) el.style.height = el.dataset.revealHeight;
        if (el.dataset.revealWidth) el.style.width = el.dataset.revealWidth;
        if (el.dataset.revealLeft) el.style.left = el.dataset.revealLeft;
        if (el.dataset.revealTransform) el.style.transform = el.dataset.revealTransform;
        if (el.dataset.revealDashoffset) el.style.strokeDashoffset = el.dataset.revealDashoffset;
        if (el.dataset.revealBg) el.style.background = el.dataset.revealBg;
      });
    });
  });
}
