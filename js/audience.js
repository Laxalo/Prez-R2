import { mountStage } from "./deck.js";
import { CHANNEL_NAME, MSG_GOTO, MSG_REQUEST_STATE, MSG_POINTER } from "./channel.js";

const stage = document.getElementById("stage");
const pointerDotEl = document.getElementById("audiencePointerDot");
const channel = new BroadcastChannel(CHANNEL_NAME);

function showSlide(slideData, stateIndex, animate) {
  if (slideData.title) document.title = slideData.title;
  mountStage(stage, slideData, { readonly: true, stateIndex, animate });
  // La position du pointeur ne correspond plus forcément au nouveau
  // contenu : on le masque plutôt que de le laisser à un endroit obsolète
  // jusqu'au prochain mousemove côté présentateur (voir presenter.js).
  hidePointer();
}

function hidePointer() {
  pointerDotEl.classList.remove("is-visible");
}

// x/y normalisés (0..1) dans le repère de .slide__stage — voir
// js/channel.js MSG_POINTER. Reconverti en pixels écran à partir de la
// scène RÉELLEMENT affichée ici, potentiellement de taille différente de
// celle du poste présentateur.
function showPointer(x, y) {
  const stageEl = stage.querySelector(".slide__stage");
  if (!stageEl) return;
  const rect = stageEl.getBoundingClientRect();
  pointerDotEl.style.left = `${rect.left + x * rect.width}px`;
  pointerDotEl.style.top = `${rect.top + y * rect.height}px`;
  pointerDotEl.classList.add("is-visible");
}

channel.onmessage = (event) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === MSG_GOTO) {
    // La même animation que sur le poste présentateur (voir js/reveal.js) :
    // l'auditoire reste synchronisé, y compris sur ce détail.
    showSlide(msg.data, msg.stateIndex ?? 0, msg.animate ?? false);
  } else if (msg.type === MSG_POINTER) {
    if (msg.visible) showPointer(msg.x, msg.y);
    else hidePointer();
  }
};

// Resynchronisation si l'auditoire s'ouvre/se recharge après le
// présentateur : demande l'état courant plutôt que d'attendre en silence.
channel.postMessage({ type: MSG_REQUEST_STATE });
