// Poignées de redimensionnement entre panneaux du poste présentateur :
// glisser une poignée pilote une variable CSS (largeur/hauteur d'un
// panneau voisin), mémorisée par le navigateur pour les prochaines
// sessions. Double-clic sur une poignée : revient à la taille par défaut.

const STORAGE_PREFIX = "prez-r2-layout-";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// handle : l'élément .splitter à glisser.
// axis : "x" (largeur, glissement horizontal) ou "y" (hauteur, glissement vertical).
// cssVar : variable CSS (sur <html>) qui porte la taille du panneau.
// sign : +1 si glisser vers le bas/la droite doit agrandir le panneau, -1 sinon.
export function initSplitter({ handle, axis, cssVar, min, max, sign, defaultValue }) {
  if (!handle) return;

  const root = document.documentElement;
  const storageKey = STORAGE_PREFIX + cssVar;

  const stored = Number(localStorage.getItem(storageKey));
  const initial = Number.isFinite(stored) && stored > 0 ? clamp(stored, min, max) : defaultValue;
  root.style.setProperty(cssVar, `${initial}px`);

  function currentSize() {
    return parseFloat(getComputedStyle(root).getPropertyValue(cssVar)) || defaultValue;
  }

  let dragging = false;
  let startPos = 0;
  let startSize = 0;

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    startPos = axis === "x" ? e.clientX : e.clientY;
    startSize = currentSize();
    handle.setPointerCapture(e.pointerId);
    handle.classList.add("is-active");
    document.body.classList.add(axis === "x" ? "is-resizing-x" : "is-resizing-y");
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const pos = axis === "x" ? e.clientX : e.clientY;
    const delta = (pos - startPos) * sign;
    root.style.setProperty(cssVar, `${clamp(startSize + delta, min, max)}px`);
  });

  function stopDragging() {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("is-active");
    document.body.classList.remove("is-resizing-x", "is-resizing-y");
    localStorage.setItem(storageKey, String(currentSize()));
  }

  handle.addEventListener("pointerup", stopDragging);
  handle.addEventListener("pointercancel", stopDragging);

  handle.addEventListener("dblclick", () => {
    root.style.setProperty(cssVar, `${defaultValue}px`);
    localStorage.setItem(storageKey, String(defaultValue));
  });

  // Accessibilité clavier : flèches pour ajuster la poignée sélectionnée.
  handle.addEventListener("keydown", (e) => {
    const step = 16;
    let delta = 0;
    if (axis === "x" && e.key === "ArrowLeft") delta = -step;
    else if (axis === "x" && e.key === "ArrowRight") delta = step;
    else if (axis === "y" && e.key === "ArrowUp") delta = -step;
    else if (axis === "y" && e.key === "ArrowDown") delta = step;
    else return;

    e.preventDefault();
    const size = clamp(currentSize() + delta * sign, min, max);
    root.style.setProperty(cssVar, `${size}px`);
    localStorage.setItem(storageKey, String(size));
  });
}
