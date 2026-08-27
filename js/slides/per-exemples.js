import { escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes } from "./_chapitre.js";

// Gabarit "Exemples chiffrés" (chapitre PER) — deux tableaux de
// données fournies par le simulateur de Victor (jamais recalculées ici,
// charte CLAUDE.md Règle 4) : un jeu de colonnes par tableau
// (slide.tableaux[].colonnes), chaque colonne portant son libellé, sa
// valeur, une note optionnelle sous le libellé (ex. l'hypothèse "base
// 2025 hors augmentation rem 2026") et un accent de couleur optionnel
// (ex. le gain fiscal en vert).
//
// Révélation progressive une case à la fois, toutes tables confondues
// (état 1 = première colonne du premier tableau, dernier état = dernière
// colonne du dernier tableau) — un état par colonne au total (voir
// totalCols dans render, dérivé de slide.tableaux, jamais saisi en dur).
// Chaque colonne reste dans le flux dès qu'elle existe dans le DOM
// (juste invisible, voir --invisible) : la largeur des tableaux ne
// bouge jamais pendant la révélation.
//
// slide.resultat (optionnel) : une conclusion chiffrée sous les
// tableaux (ex. "Rentabilité instantanée · +45 %"), révélée dans un
// état après la dernière case — pas une case de tableau parmi d'autres
// (voir .per-exemples__resultat).
//
// col.encadreBleu (optionnel, sur une ou plusieurs colonnes) : épaissit
// le contour de cette colonne en bleu, dans son propre état, cumulatif
// — un encadré révélé le reste aux états suivants, comme le reste de la
// slide. Accompagné d'une note bleue, à choisir selon la place
// disponible autour du tableau :
//   col.noteBas : sous le tableau qui contient la colonne (pleine
//   largeur) — pour un tableau qui occupe toute la largeur de la scène.
//   col.noteDroite : à droite de la colonne, dans l'espace laissé libre
//   par un tableau plus étroit que maxCols (ex. le premier tableau, à 3
//   colonnes sur une scène calée sur 4 — voir tableauHtml) — pour ne
//   pas repousser le tableau suivant.
// Plusieurs colonnes encadrées sur la slide se révèlent dans l'ordre de
// col.encadreOrdre (1, 2, ...) plutôt que l'ordre de slide.tableaux :
// l'ordre de narration n'est pas forcément l'ordre d'affichage des
// tableaux.

const ACCENT_VARS = {
  or: "var(--or)",
  bleu: "var(--bleu)",
  vert: "var(--vert)",
  rouge: "var(--rouge)",
};

function colonneHtml(col, { visible, entering, encadreVisible, encadreEntering }) {
  const color = ACCENT_VARS[col.accent];
  const cls =
    "per-exemples__col" +
    (col.shade ? " per-exemples__col--shade" : "") +
    (col.gold ? " per-exemples__col--gold" : "") +
    (col.encadreBleu && encadreVisible ? " per-exemples__col--encadre" : "") +
    (col.encadreBleu && encadreEntering ? " is-entering" : "") +
    (visible ? "" : " per-exemples__col--invisible") +
    (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering || (col.encadreBleu && encadreEntering) ? " data-reveal" : ""}>
      <div class="per-exemples__col-head">
        <span class="per-exemples__col-label">${escapeHtml(col.label)}</span>
        ${col.note ? `<span class="per-exemples__col-note">${escapeHtml(col.note)}</span>` : ""}
      </div>
      <span class="per-exemples__col-valeur"${color ? ` style="color:${color}"` : ""}>${escapeHtml(col.valeur)}</span>
    </div>
  `;
}

function noteHtml(text, cls, { visible, entering }) {
  const fullCls = cls + (visible ? "" : ` ${cls}--invisible`) + (entering ? " is-entering" : "");
  return `<p class="${fullCls}"${entering ? " data-reveal" : ""}>${escapeHtml(text)}</p>`;
}

// Largeur de chaque tableau proportionnelle à son nombre de colonnes
// sur le plus grand tableau de la slide (maxCols) — pas 100% chacun :
// c'est ce qui fait coïncider les frontières de colonnes d'un tableau à
// l'autre (chaque colonne vaut toujours 1/maxCols de la largeur de la
// scène, qu'elle appartienne à un tableau de 3 ou de 4 colonnes),
// plutôt que de recalculer une largeur de colonne propre à chaque
// tableau (repeat(N,1fr) sur 100%), qui désaligne les tableaux dès
// qu'ils n'ont pas le même nombre de colonnes.
//
// firstColIndex : index global (toutes tables confondues) de la
// première colonne de ce tableau — permet de dériver visible/entering
// par colonne à partir du seul stateIndex global, sans état propre à
// chaque tableau. encadreStateByCol : Map(col -> état) pour les
// colonnes marquées encadreBleu, une entrée par colonne concernée sur
// toute la slide.
function tableauHtml(tableau, maxCols, firstColIndex, stateIndex, animate, encadreStateByCol) {
  const cols = tableau.colonnes || [];
  const widthPct = (cols.length / maxCols) * 100;
  // Le contour du tableau (bordure + coins arrondis) n'apparaît qu'une
  // fois sa dernière case révélée — sinon il dessinerait d'avance la
  // forme complète du tableau (cases encore invisibles comprises), ce
  // qui trahit le nombre de cases avant qu'elles n'apparaissent une à
  // une (voir .per-exemples__table--building).
  const complete = stateIndex >= firstColIndex + cols.length - 1;

  function encadreOpts(col) {
    const state = encadreStateByCol.get(col);
    return {
      visible: state != null && stateIndex >= state,
      entering: animate && state != null && stateIndex === state,
    };
  }

  const colsHtml = cols
    .map((col, i) => {
      const globalIndex = firstColIndex + i;
      const { visible: encadreVisible, entering: encadreEntering } = encadreOpts(col);
      return colonneHtml(col, {
        visible: globalIndex <= stateIndex,
        entering: animate && globalIndex === stateIndex,
        encadreVisible,
        encadreEntering,
      });
    })
    .join("");

  const notesBasHtml = cols
    .filter((c) => c.noteBas)
    .map((c) => noteHtml(c.noteBas, "per-exemples__note-bas", encadreOpts(c)))
    .join("");

  const noteDroiteCol = cols.find((c) => c.noteDroite);

  const tableCls = "per-exemples__table" + (complete ? "" : " per-exemples__table--building");
  const tableCol = `
    <div class="per-exemples__table-col">
      <div class="${tableCls}" style="grid-template-columns:repeat(${cols.length},1fr)">
        ${colsHtml}
      </div>
      ${notesBasHtml}
    </div>
  `;

  if (noteDroiteCol) {
    const asideHtml = noteHtml(noteDroiteCol.noteDroite, "per-exemples__note-droite", encadreOpts(noteDroiteCol));
    return `
      <div class="per-exemples__table-wrap per-exemples__table-wrap--row" style="width:100%">
        <div style="width:${widthPct}%">${tableCol}</div>
        <div class="per-exemples__table-aside" style="width:${100 - widthPct}%">${asideHtml}</div>
      </div>
    `;
  }

  return `<div class="per-exemples__table-wrap" style="width:${widthPct}%">${tableCol}</div>`;
}

function resultatHtml(resultat, { visible, entering }) {
  const cls = "per-exemples__resultat" + (visible ? "" : " per-exemples__resultat--invisible") + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""}>
      <span class="per-exemples__resultat-label">${escapeHtml(resultat.label)}</span>
      <span class="per-exemples__resultat-valeur">${escapeHtml(resultat.valeur)}</span>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const tableaux = slide.tableaux || [];
  const maxCols = Math.max(1, ...tableaux.map((t) => (t.colonnes || []).length));
  const totalCols = tableaux.reduce((sum, t) => sum + (t.colonnes || []).length, 0);
  const hasResultat = !!slide.resultat;

  const encadreCols = [];
  tableaux.forEach((t) => (t.colonnes || []).forEach((c) => c.encadreBleu && encadreCols.push(c)));
  encadreCols.sort((a, b) => (a.encadreOrdre ?? Infinity) - (b.encadreOrdre ?? Infinity));
  const encadreBaseState = totalCols + (hasResultat ? 1 : 0);
  const encadreStateByCol = new Map(encadreCols.map((c, i) => [c, encadreBaseState + i]));

  const stateCount = encadreBaseState + encadreCols.length;
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), Math.max(stateCount - 1, 0));
  const animate = !!opts.animate;

  let runningIndex = 0;
  const tablesHtml = tableaux
    .map((t) => {
      const html = tableauHtml(t, maxCols, runningIndex, stateIndex, animate, encadreStateByCol);
      runningIndex += (t.colonnes || []).length;
      return html;
    })
    .join("");

  const resultatHtmlStr = hasResultat
    ? resultatHtml(slide.resultat, {
        visible: stateIndex >= totalCols,
        entering: animate && stateIndex === totalCols,
      })
    : "";

  return `
    <div class="per-exemples">
      ${renderChapRail(slide)}
      ${slide.railEtapes ? renderRailEtapes(slide.railEtapes, slide.railActive) : ""}

      <div class="per-exemples__intro">
        <h1 class="chap-title per-exemples__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="per-exemples__stage">
        ${tablesHtml}
        ${resultatHtmlStr}
      </div>

      ${slide.notePied ? `<p class="per-exemples__footnote">${escapeHtml(slide.notePied)}</p>` : ""}
    </div>
  `;
}
