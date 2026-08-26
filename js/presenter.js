import { cloneDeep } from "./editable.js";
import {
  loadDeck,
  renderers,
  mountStage,
  renderStageHtml,
  renderPreviewHtml,
  stateCount,
  clampStateIndex,
  stepForward,
  stepBackward,
} from "./deck.js";
import { CHANNEL_NAME, MSG_GOTO, MSG_REQUEST_STATE, MSG_POINTER } from "./channel.js";
import { initSplitter } from "./splitter.js";

const NOTES_KEY = "prez-r2-notes";
const POSITION_KEY = "prez-r2-position";

const channel = new BroadcastChannel(CHANNEL_NAME);

const currentEl = document.getElementById("presenterCurrent");
const nextEl = document.getElementById("presenterNext");
const thumbsEl = document.getElementById("presenterThumbs");
const notesEl = document.getElementById("presenterNotes");
const titleEl = document.getElementById("presenterTitle");
const positionEl = document.getElementById("presenterPosition");
const openAudienceBtn = document.getElementById("openAudience");
const navPrevBtn = document.getElementById("navPrev");
const navNextBtn = document.getElementById("navNext");
const clockEl = document.getElementById("presenterClock");
const elapsedEl = document.getElementById("presenterElapsed");
const pointerDotEl = document.getElementById("presenterPointerDot");

let deck = null;
let pristineById = null;
let currentIndex = 0;
// Position dans la révélation progressive de la slide courante (voir
// js/deck.js stepForward/stepBackward) — 0 pour une slide sans états.
let stateIndex = 0;
const hidden = new Set();
let notes = loadNotes();
let audienceWindow = null;

// Pointeur laser (touche L) — voir setupPointer(). pointerEnabled : mode
// activé/désactivé (persiste tant qu'on ne rappuie pas sur L, y compris
// hors survol). pointerVisible : le point est actuellement affiché (mode
// activé ET souris au-dessus de la scène) — distinction nécessaire pour
// ne pas re-broadcaster un "visible:false" à chaque mousemove hors scène.
let pointerEnabled = false;
let pointerVisible = false;

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// Position courante (slide + état de révélation progressive) : un
// rafraîchissement de la page reprend là où le présentateur était,
// plutôt que de revenir en dur sur la première slide.
function loadPosition() {
  try {
    const parsed = JSON.parse(localStorage.getItem(POSITION_KEY));
    if (!parsed || typeof parsed.currentIndex !== "number" || typeof parsed.stateIndex !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePosition() {
  localStorage.setItem(POSITION_KEY, JSON.stringify({ currentIndex, stateIndex }));
}

function currentSlide() {
  return deck.slides[currentIndex];
}

function nextVisibleSlide() {
  for (let i = currentIndex + 1; i < deck.slides.length; i++) {
    if (!hidden.has(deck.slides[i].id)) return deck.slides[i];
  }
  return null;
}

function broadcastCurrent(animate = false) {
  const slide = currentSlide();
  // Une slide masquée reste modifiable par le présentateur mais n'est
  // jamais poussée vers l'auditoire.
  if (hidden.has(slide.id)) return;
  channel.postMessage({ type: MSG_GOTO, data: cloneDeep(slide), stateIndex, animate });
}

function renderCurrent(animate = false) {
  const slide = currentSlide();
  const renderer = renderers[slide.type];
  if (!renderer) return;

  // Le contenu sous le pointeur change : sa position n'a plus de sens
  // tant qu'un nouveau mousemove ne l'a pas recalculée.
  hidePointer();

  mountStage(currentEl, slide, { stateIndex, animate });

  if (renderer.setup) {
    const content = currentEl.querySelector(".slide__content");
    renderer.setup(content, slide, pristineById.get(slide.id), () => broadcastCurrent());
  }

  const n = stateCount(slide);
  const etatSuffix = n > 1 ? ` · état ${stateIndex + 1}/${n}` : "";
  titleEl.textContent = `${slide.title || slide.titre || slide.id} — ${currentIndex + 1}/${deck.slides.length}${etatSuffix}`;
  positionEl.innerHTML = `Slide <strong>${currentIndex + 1}</strong>/${deck.slides.length} · état <strong>${stateIndex + 1}</strong>/${n} · id : <strong>${slide.id}</strong>`;
  notesEl.value = notes[slide.id] || "";
}

function renderNext() {
  const slide = nextVisibleSlide();
  // .presenter-preview (voir presenter.css) adapte .slide__stage à la
  // largeur ET à la hauteur réellement disponibles (container query
  // cqw/cqh), donc un rendu direct — pas besoin du transform:scale des
  // miniatures (renderPreviewHtml), réservé aux très petites
  // tailles où les planchers de police en rem entreraient en jeu.
  // Toujours au premier état : c'est un aperçu de ce qui vient, pas de
  // là où on s'était arrêté la dernière fois sur cette slide.
  nextEl.innerHTML = slide ? renderStageHtml(slide, { readonly: true, stateIndex: 0 }) : "";
}

function renderThumbs() {
  thumbsEl.innerHTML = "";

  deck.slides.forEach((slide, i) => {
    const isHidden = hidden.has(slide.id);

    const item = document.createElement("div");
    item.className = "presenter-thumb" + (i === currentIndex ? " is-current" : "") + (isHidden ? " is-hidden" : "");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "presenter-thumb__preview";
    btn.innerHTML = renderPreviewHtml(slide);
    btn.addEventListener("click", () => goTo(i));

    const footer = document.createElement("div");
    footer.className = "presenter-thumb__footer";

    const label = document.createElement("span");
    label.className = "presenter-thumb__label";
    label.textContent = slide.title || slide.titre || slide.id;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "presenter-thumb__toggle";
    toggle.textContent = isHidden ? "Afficher" : "Masquer";
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (hidden.has(slide.id)) hidden.delete(slide.id);
      else hidden.add(slide.id);
      renderThumbs();
      renderNext();
      if (i === currentIndex) broadcastCurrent();
    });

    footer.append(label, toggle);
    item.append(btn, footer);
    thumbsEl.appendChild(item);
  });
}

// Partagé par goTo() et la restauration de position au lancement (voir
// init()) : seule cette dernière a besoin d'un stateIndex autre que 0.
function goToState(index, targetStateIndex) {
  currentIndex = index;
  stateIndex = targetStateIndex;
  renderCurrent();
  renderNext();
  renderThumbs();
  broadcastCurrent();
  savePosition();
}

// Saut direct à une slide (miniature) : toujours à son premier état — on
// ne reprend pas où on s'était arrêté la dernière fois sur CETTE slide
// (contrairement à la restauration de position au lancement, qui elle
// reprend l'état exact).
function goTo(index) {
  goToState(index, 0);
}

// Avance : état suivant de la slide courante si elle a des états
// restants (voir js/deck.js), sinon slide visible suivante. Un
// changement d'état seul ne redessine ni les miniatures ni l'aperçu
// suivant — inchangés tant qu'on reste sur la même slide. Seul un
// changement d'état AU SEIN de la même slide joue l'animation de
// révélation (voir js/reveal.js) : un changement de slide a déjà le
// bandeau de miniatures/l'aperçu suivant comme signal, pas besoin d'un
// fondu de plus à l'arrivée.
function goNext() {
  const next = stepForward(deck.slides, hidden, { slideIndex: currentIndex, stateIndex });
  if (!next) return;

  const slideChanged = next.slideIndex !== currentIndex;
  currentIndex = next.slideIndex;
  stateIndex = next.stateIndex;
  renderCurrent(!slideChanged);
  if (slideChanged) {
    renderNext();
    renderThumbs();
  }
  broadcastCurrent(!slideChanged);
  savePosition();
}

function goPrev() {
  const prev = stepBackward(deck.slides, hidden, { slideIndex: currentIndex, stateIndex });
  if (!prev) return;

  const slideChanged = prev.slideIndex !== currentIndex;
  currentIndex = prev.slideIndex;
  stateIndex = prev.stateIndex;
  renderCurrent(!slideChanged);
  if (slideChanged) {
    renderNext();
    renderThumbs();
  }
  broadcastCurrent(!slideChanged);
  savePosition();
}

function setupKeyboard() {
  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;

    if (["ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
      goNext();
    } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      goPrev();
    } else if (e.key.toLowerCase() === "l") {
      e.preventDefault();
      togglePointer();
    }
  });
}

// Boutons ‹ › (toolbar) + tap direct sur la scène courante — même geste
// que le clic sur la scène en aperçu solo (voir js/app.js) : nécessaire
// sur un poste consulté au doigt (mobile), sans clavier. Garde identique
// à app.js : ignore un clic sur un contrôle interactif d'une slide
// "calculator" (input/bouton/lien/texte éditable), pour ne pas avancer
// par-dessus une saisie.
function setupNav() {
  navPrevBtn.addEventListener("click", goPrev);
  navNextBtn.addEventListener("click", goNext);

  currentEl.addEventListener("click", (e) => {
    if (e.target.closest('input, button, a, [contenteditable="true"]')) return;
    goNext();
  });
}

function setupNotes() {
  notesEl.addEventListener("input", () => {
    const slide = currentSlide();
    notes[slide.id] = notesEl.value;
    saveNotes();
  });
}

// Horloge murale + chrono écoulé depuis l'ouverture de la page, côte à
// côte dans l'en-tête (voir presenter.html / presenter.css). Un seul
// setInterval, aucune dépendance externe.
function setupTimer() {
  const startedAt = Date.now();

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    const now = new Date();
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    elapsedEl.textContent = `${pad(Math.floor(elapsedSec / 60))}:${pad(elapsedSec % 60)}`;
  }

  tick();
  setInterval(tick, 1000);
}

// Pointeur laser (touche L, voir setupKeyboard) — répliqué en temps réel
// sur l'auditoire via BroadcastChannel (voir js/channel.js MSG_POINTER,
// js/audience.js). Ne réagit qu'au survol de la scène courante
// (#presenterCurrent), jamais à l'aperçu suivant ni aux miniatures.
function hidePointer() {
  if (!pointerVisible) return;
  pointerVisible = false;
  pointerDotEl.classList.remove("is-visible");
  channel.postMessage({ type: MSG_POINTER, visible: false });
}

function togglePointer() {
  pointerEnabled = !pointerEnabled;
  currentEl.classList.toggle("is-pointer-active", pointerEnabled);
  if (!pointerEnabled) hidePointer();
}

function setupPointer() {
  currentEl.addEventListener("mousemove", (e) => {
    if (!pointerEnabled) return;

    // Coordonnées normalisées (0..1) dans le repère de .slide__stage, pas
    // de #presenterCurrent : ce panneau peut être plus grand que la scène
    // 16:9 qu'il contient (lettrage), voir .presenter-preview en CSS.
    const stageEl = currentEl.querySelector(".slide__stage");
    if (!stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (x < 0 || x > 1 || y < 0 || y > 1) {
      // Dans le panneau mais hors de la scène elle-même (marge de
      // lettrage) : traité comme une sortie de zone.
      hidePointer();
      return;
    }

    pointerVisible = true;
    pointerDotEl.style.left = `${e.clientX}px`;
    pointerDotEl.style.top = `${e.clientY}px`;
    pointerDotEl.classList.add("is-visible");
    channel.postMessage({ type: MSG_POINTER, visible: true, x, y });
  });

  currentEl.addEventListener("mouseleave", () => hidePointer());
}

// Vraie fenêtre popup (pas un onglet) : ni barre d'adresse, ni barre de
// favoris, ni onglets visibles — pour pouvoir la partager/projeter en
// RDV sans exposer la navigation du présentateur.
function openAudienceWindow() {
  const width = 1280;
  const height = 800;
  const left = Math.round((screen.width - width) / 2);
  const top = Math.round((screen.height - height) / 2);

  const features = [
    "popup=yes",
    "toolbar=no",
    "location=no",
    "menubar=no",
    "status=no",
    "resizable=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${Math.max(0, left)}`,
    `top=${Math.max(0, top)}`,
  ].join(",");

  return window.open("audience.html", "prez-r2-audience", features);
}

function setupAudienceWindow() {
  openAudienceBtn.addEventListener("click", () => {
    if (audienceWindow && !audienceWindow.closed) {
      audienceWindow.focus();
      return;
    }
    audienceWindow = openAudienceWindow();
    openAudienceBtn.textContent = "Écran auditoire ouvert";
    openAudienceBtn.classList.add("is-active");
  });
}

function setupSplitters() {
  initSplitter({
    handle: document.getElementById("splitterSidebar"),
    axis: "x",
    cssVar: "--sidebar-width",
    min: 260,
    max: 480,
    sign: -1,
    defaultValue: 340,
  });

  initSplitter({
    handle: document.getElementById("splitterNext"),
    axis: "y",
    cssVar: "--next-height",
    min: 110,
    max: 420,
    sign: 1,
    defaultValue: 200,
  });

  initSplitter({
    handle: document.getElementById("splitterThumbs"),
    axis: "y",
    cssVar: "--thumbs-height",
    min: 90,
    max: 260,
    sign: -1,
    defaultValue: 150,
  });
}

function setupChannel() {
  // Resynchronise l'auditoire s'il s'ouvre/se recharge après le
  // présentateur (voir audience.js).
  channel.onmessage = (event) => {
    if (event.data?.type === MSG_REQUEST_STATE) broadcastCurrent();
  };
}

async function init() {
  deck = await loadDeck();
  pristineById = new Map(deck.slides.map((s) => [s.id, cloneDeep(s)]));

  setupKeyboard();
  setupNav();
  setupNotes();
  setupTimer();
  setupPointer();
  setupAudienceWindow();
  setupSplitters();
  setupChannel();

  // Reprend la position laissée avant un rafraîchissement plutôt que de
  // revenir en dur sur la première slide — avec vérification de borne :
  // si le deck a changé entretemps (slide supprimée/réordonnée) et que
  // l'index stocké n'existe plus, on retombe sur 0 sans planter.
  const saved = loadPosition();
  let restoredIndex = 0;
  let restoredState = 0;
  if (saved && saved.currentIndex >= 0 && saved.currentIndex < deck.slides.length) {
    restoredIndex = saved.currentIndex;
    restoredState = clampStateIndex(deck.slides[restoredIndex], saved.stateIndex);
  }

  goToState(restoredIndex, restoredState);
}

init();
