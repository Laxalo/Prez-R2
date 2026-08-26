import { cloneDeep } from "./editable.js";
import { loadDeck, renderers, mountStage, stepForward, stepBackward } from "./deck.js";

// index.html : aperçu solo de tout le deck (défilement, scroll-snap),
// pour construire/tester les slides. Chaque slide reste éditable
// (calculator) indépendamment des autres — pas de synchronisation avec
// un autre écran ici, voir presenter.html / audience.html pour le mode
// deux écrans utilisé en RDV.
//
// Révélation progressive (slide.states, voir js/deck.js) : la flèche
// droite/bas ou un clic sur la scène déroule d'abord les états internes
// de la slide affichée, avant de passer à la suivante (scroll) — même
// mécanisme partagé (stepForward/stepBackward) que presenter.html et
// audience.html, pas de logique dupliquée. Aucune slide masquée ici
// (pas de toggle "Masquer" en aperçu solo, contrairement au poste
// présentateur).
const hidden = new Set();

async function loadDeckIntoPage() {
  const deck = await loadDeck();

  document.title = deck.meta.title;

  const deckEl = document.getElementById("deck");
  const navEl = document.getElementById("navDots");

  const pristineById = new Map(deck.slides.map((s) => [s.id, cloneDeep(s)]));
  const stateIndexBySlide = deck.slides.map(() => 0);
  const sections = [];

  function renderSlideContent(index, { animate = false } = {}) {
    const slideData = deck.slides[index];
    const renderer = renderers[slideData.type];
    const section = sections[index];
    if (!renderer || !section) return;

    mountStage(section, slideData, { stateIndex: stateIndexBySlide[index], animate });

    if (renderer.setup) {
      const content = section.querySelector(".slide__content");
      renderer.setup(content, slideData, pristineById.get(slideData.id), () => {});
    }
  }

  deck.slides.forEach((slideData, index) => {
    const renderer = renderers[slideData.type];
    if (!renderer) {
      console.warn(`Aucun renderer pour le type de slide "${slideData.type}"`);
      sections.push(null);
      return;
    }

    const section = document.createElement("section");
    section.className = `slide slide--${slideData.type}`;
    section.id = `slide-${slideData.id}`;
    deckEl.appendChild(section);
    sections.push(section);
    renderSlideContent(index);

    const dot = document.createElement("a");
    dot.href = `#slide-${slideData.id}`;
    dot.setAttribute("aria-label", slideData.title || slideData.titre || slideData.id);
    navEl.appendChild(dot);
  });

  setupNavigation({ deckEl, navEl, deck, sections, stateIndexBySlide, renderSlideContent });
}

function setupNavigation({ deckEl, navEl, deck, sections, stateIndexBySlide, renderSlideContent }) {
  const dotEls = Array.from(navEl.querySelectorAll("a"));
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = sections.indexOf(entry.target);
          dotEls.forEach((d, i) => d.classList.toggle("is-active", i === index));
        }
      });
    },
    { root: deckEl, threshold: 0.6 }
  );
  sections.forEach((el) => el && observer.observe(el));

  function currentIndex() {
    return sections.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= -10 && r.top < window.innerHeight / 2;
    });
  }

  // Avance/recule d'un cran depuis la slide `fromIndex` : état suivant/
  // précédent si elle en a, sinon slide voisine (scroll). Un changement
  // d'état seul redessine juste cette slide, sans scroller.
  function step(fromIndex, direction) {
    const pos = { slideIndex: fromIndex, stateIndex: stateIndexBySlide[fromIndex] };
    const next = direction === 1 ? stepForward(deck.slides, hidden, pos) : stepBackward(deck.slides, hidden, pos);
    if (!next) return;

    const slideChanged = next.slideIndex !== fromIndex;
    stateIndexBySlide[next.slideIndex] = next.stateIndex;
    // N'anime que le passage d'un état à l'autre au sein de la même
    // slide — un changement de slide a déjà le défilement comme signal
    // de transition, pas besoin d'un fondu en plus à l'arrivée.
    renderSlideContent(next.slideIndex, { animate: !slideChanged });
    if (slideChanged) {
      sections[next.slideIndex].scrollIntoView({ behavior: "smooth" });
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.target.isContentEditable || e.target.tagName === "INPUT") return;

    const idx = currentIndex();
    if (idx < 0) return;

    if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
      step(idx, 1);
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      step(idx, -1);
    }
  });

  // Clic sur la scène (hors contrôles interactifs des slides
  // "calculator" : inputs, boutons, texte éditable) : avance d'un cran,
  // comme la flèche droite.
  deckEl.addEventListener("click", (e) => {
    if (e.target.closest('input, button, a, [contenteditable="true"]')) return;
    const stage = e.target.closest(".slide__stage");
    if (!stage) return;
    const idx = sections.indexOf(stage.closest(".slide"));
    if (idx < 0) return;
    step(idx, 1);
  });
}

loadDeckIntoPage();
