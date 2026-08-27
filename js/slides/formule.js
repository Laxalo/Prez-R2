import { escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Formule" — un principe abstrait (trois opérandes reliés par
// × et =, sans valeurs, encadré) puis un exemple chiffré du même schéma
// (encadré aussi, avec icône). Générique, pas un gabarit à usage
// unique : pensé pour toute mécanique qui se raconte comme une équation
// à trois cases (première utilisation : "Comment ça marche ?" du PER,
// l'économie d'impôt à chaque versement).
//
// Révélation progressive en 7 états, un par élément de l'équation
// plutôt que par bloc entier (titre non animé, toujours visible dès
// l'arrivée sur la slide — voir formule__intro) :
//   état 1 (index 0) : premier opérande du principe seul (ex. "Montant
//   de votre versement") — déjà visible à l'arrivée sur la slide, pas
//   de clic dédié.
//   état 2 : + opérateur "×" et deuxième opérande du principe.
//   état 3 : + opérateur "=" et résultat du principe — le principe est
//   au complet.
//   état 4 : + le cadre "Exemple" (kicker + bordure), encore vide —
//   structure seule, aucun opérande chiffré.
//   état 5 : + premier opérande de l'exemple (icône + valeur + note).
//   état 6 : + opérateur "×" et deuxième opérande de l'exemple.
//   état 7 : + opérateur "=" et résultat de l'exemple.
// Chaque opérande/opérateur reste dans le flux dès qu'il existe dans le
// DOM (juste invisible, voir --invisible) : la largeur fixe des cases
// (formule__operande) et la largeur intrinsèque des opérateurs évitent
// tout redimensionnement du cadre pendant la révélation.
const STATE_COUNT = 7;

// Même principe que titleWithHalo (chapitre-regles.js) mais sans pulse
// (halo statique, pas une ouverture de cadenas à accompagner) : gardé
// local plutôt que partagé, ce gabarit n'a pas besoin de l'animation.
function titleWithHalo(titre, haloWord) {
  if (!haloWord) return escapeHtml(titre);
  const idx = titre.indexOf(haloWord);
  if (idx < 0) return escapeHtml(titre);
  const before = titre.slice(0, idx);
  const after = titre.slice(idx + haloWord.length);
  return `${escapeHtml(before)}<span class="formule__halo">${escapeHtml(haloWord)}</span>${escapeHtml(after)}`;
}

function toggle(base, visible, entering) {
  return base + (visible ? "" : ` ${base}--invisible`) + (entering ? " is-entering" : "");
}

function operatorHtml(symbol, { visible, entering }) {
  const cls = toggle("formule__operator", visible, entering);
  return `<span class="${cls}"${entering ? " data-reveal" : ""}>${symbol}</span>`;
}

function operandeHtml(label, { cls = "", visible, entering }) {
  const fullCls = toggle("formule__operande", visible, entering) + cls;
  return `
    <div class="${fullCls}"${entering ? " data-reveal" : ""}>
      <span class="formule__operande-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function operandeExempleHtml({ icon, valeur, note, cls = "", visible, entering }) {
  const fullCls = toggle("formule__operande", visible, entering) + cls;
  return `
    <div class="${fullCls}"${entering ? " data-reveal" : ""}>
      ${icon ? iconSvg(icon, "var(--or)", 40) : ""}
      <span class="formule__operande-valeur">${escapeHtml(valeur)}</span>
      ${note ? `<span class="formule__operande-note">${escapeHtml(note)}</span>` : ""}
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const p = slide.principe || {};
  const e = slide.exemple || {};

  const showPrincipeB = stateIndex >= 1;
  const principeBEntering = animate && stateIndex === 1;
  const showPrincipeResultat = stateIndex >= 2;
  const principeResultatEntering = animate && stateIndex === 2;

  const showExempleFrame = stateIndex >= 3;
  const exempleFrameEntering = animate && stateIndex === 3;
  const showExempleA = stateIndex >= 4;
  const exempleAEntering = animate && stateIndex === 4;
  const showExempleB = stateIndex >= 5;
  const exempleBEntering = animate && stateIndex === 5;
  const showExempleResultat = stateIndex >= 6;
  const exempleResultatEntering = animate && stateIndex === 6;

  return `
    <div class="formule">
      ${renderChapRail(slide)}
      ${slide.railEtapes ? renderRailEtapes(slide.railEtapes, slide.railActive) : ""}

      <div class="formule__intro">
        <p class="formule__kicker">${escapeHtml(slide.kicker)}</p>
        <span class="formule__rule"></span>
        <h1 class="chap-title formule__title">${titleWithHalo(slide.titre, slide.titreHalo)}</h1>
      </div>

      <div class="formule__body">
        <div class="formule__section formule__principe">
          <div class="formule__frame">
            <div class="formule__row">
              ${operandeHtml(p.a, { visible: true, entering: false })}
              ${operatorHtml("×", { visible: showPrincipeB, entering: principeBEntering })}
              ${operandeHtml(p.b, { visible: showPrincipeB, entering: principeBEntering })}
              ${operatorHtml("=", { visible: showPrincipeResultat, entering: principeResultatEntering })}
              ${operandeHtml(p.resultat, { cls: " formule__operande--resultat", visible: showPrincipeResultat, entering: principeResultatEntering })}
            </div>
          </div>
        </div>

        <div class="formule__section formule__exemple${showExempleFrame ? "" : " formule__section--invisible"}${exempleFrameEntering ? " is-entering" : ""}"${exempleFrameEntering ? " data-reveal" : ""}>
          <div class="formule__frame">
            <span class="formule__exemple-kicker">Exemple</span>
            <div class="formule__row">
              ${operandeExempleHtml({ icon: e.icon, valeur: e.aValeur, note: e.aNote, visible: showExempleA, entering: exempleAEntering })}
              ${operatorHtml("×", { visible: showExempleB, entering: exempleBEntering })}
              ${operandeExempleHtml({ valeur: e.bValeur, visible: showExempleB, entering: exempleBEntering })}
              ${operatorHtml("=", { visible: showExempleResultat, entering: exempleResultatEntering })}
              ${operandeExempleHtml({ valeur: e.resultatValeur, note: e.resultatNote, cls: " formule__operande--resultat", visible: showExempleResultat, entering: exempleResultatEntering })}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
