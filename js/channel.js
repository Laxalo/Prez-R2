// Canal de communication entre le poste présentateur (maître) et l'écran
// auditoire (passif), via BroadcastChannel — fonctionne entre onglets/
// fenêtres du même navigateur sur la même machine (ex. présentateur sur
// l'écran laptop, auditoire déplacé sur l'écran externe/second moniteur).
export const CHANNEL_NAME = "prez-r2-presenter";

// Présentateur -> auditoire : affiche cette slide (données à jour),
// à l'état interne { data, stateIndex } indiqué (révélation progressive
// — voir js/deck.js stepForward/stepBackward).
export const MSG_GOTO = "goto";

// Auditoire -> présentateur, à l'ouverture/rechargement : "renvoie-moi
// l'état courant" (resynchronisation).
export const MSG_REQUEST_STATE = "request-state";

// Présentateur -> auditoire : pointeur laser. { visible:true, x, y } avec
// x/y normalisés (0..1) dans le repère de .slide__stage — pas de pixels
// bruts, les deux écrans n'ont pas forcément la même taille de scène.
// { visible:false } quand la souris quitte la zone de prévisualisation ou
// que le pointeur est désactivé (touche L).
export const MSG_POINTER = "pointer";
