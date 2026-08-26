import { euro, escapeHtml } from "../editable.js";
import { formatPct, renderChapRail } from "./_chapitre.js";

// Gabarit "Constat" (handoff design_handoff_slide_patrimoine). Slide de
// pure présentation — pas de calculator, pas de setup : les données
// viennent de deck.json ("contenus fictifs en attente des vrais
// chiffres", cf. README du handoff), rien n'est codé en dur ici.

const SUPPORT_PALETTE = ["var(--or)", "var(--or-clair)", "var(--bleu)", "var(--bleu-clair)", "var(--gris-papier)"];

const KPI_ACCENT = { or: "var(--or-clair)", bleu: "var(--bleu-clair)" };

// Les parts sont dérivées des montants, jamais saisies (correction du
// point signalé par le handoff : la référence figeait des pourcentages
// en dur qui ne sommaient pas à 100 %). L'arrondi (1 décimale, écart
// absorbé par le plus petit montant pour que la somme fasse exactement
// 100,0 %) reste calculé par montant décroissant, indépendamment de
// l'ORDRE D'AFFICHAGE : celui-ci suit désormais la liquidité (le plus
// disponible en premier), c'est-à-dire l'ordre de slide.supports tel que
// posé dans deck.json — pas re-trié ici. La couleur suit ce même ordre
// d'affichage, pour un dégradé cohérent de gauche à droite sur la barre.
function computeShares(supports) {
  const total = supports.reduce((sum, s) => sum + s.montant, 0);
  const byMontantDesc = [...supports].sort((a, b) => b.montant - a.montant);
  const rounded = byMontantDesc.map((s) => Math.round((s.montant / total) * 1000) / 10);

  const sumExceptLast = rounded.slice(0, -1).reduce((a, b) => a + b, 0);
  rounded[rounded.length - 1] = Math.round((100 - sumExceptLast) * 10) / 10;
  const pctByNom = new Map(byMontantDesc.map((s, i) => [s.nom, rounded[i]]));

  return supports.map((s, i) => ({
    ...s,
    pct: pctByNom.get(s.nom),
    couleur: SUPPORT_PALETTE[i] || SUPPORT_PALETTE[SUPPORT_PALETTE.length - 1],
  }));
}

function kpiHtml(kpi, { visible, entering }) {
  if (!visible) return `<div class="constat__kpi--empty"></div>`;
  const color = KPI_ACCENT[kpi.accent] || KPI_ACCENT.or;
  const cls = "constat__kpi" + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""}>
      <span class="constat__kpi-label" style="color:${color}">${escapeHtml(kpi.label)}</span>
      <span class="constat__kpi-value">${escapeHtml(kpi.valeur)}</span>
      <span class="constat__kpi-note">${escapeHtml(kpi.note)}</span>
    </div>
  `;
}

// Le repère entre deux KPI n'apparaît qu'une fois le KPI suivant révélé
// (pas de trait flottant à côté d'une case encore vide).
function kpiRuleHtml(visible) {
  return `<span class="constat__kpi-rule${visible ? "" : " constat__kpi-rule--hidden"}"></span>`;
}

function supportHtml(s, { visible, entering }) {
  if (!visible) return `<div class="constat__support--empty"></div>`;
  const cls = "constat__support" + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""} style="border-top-color:${s.couleur}">
      <span class="constat__support-nom">${escapeHtml(s.nom)}</span>
      <span class="constat__support-montant">${euro.format(s.montant)}</span>
      <span class="constat__support-meta">${formatPct(s.pct)} · ${escapeHtml(s.horizon)}</span>
    </div>
  `;
}

// La barre déroule de gauche à droite au moment où sa classe d'actif
// apparaît (scaleX depuis la gauche, voir js/reveal.js
// data-reveal-transform) — chaque segment garde sa largeur réservée
// (style width, en %) dans le flex de .constat__bar, seul son rendu
// visuel grandit : les segments suivants ne bougent pas quand celui-ci
// s'anime.
function barSegmentHtml(s, { visible, entering }) {
  if (!visible) return `<span style="width:${s.pct}%"></span>`;
  const fillAttrs = entering ? ` data-reveal data-reveal-transform="scaleX(1)" style="width:${s.pct}%;background:${s.couleur};transform-origin:left;transform:scaleX(0)"` : ` style="width:${s.pct}%;background:${s.couleur}"`;
  return `<span${fillAttrs}></span>`;
}

function objectifsHtml(objectifs, { visible, entering }) {
  if (!objectifs || !objectifs.length) return "";
  const cls =
    "constat__objectifs" + (!visible ? " constat__objectifs--invisible" : "") + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""}>
      <span class="constat__objectifs-label">Objectifs</span>
      <ul class="constat__objectifs-list">
        ${objectifs.map((o) => `<li class="constat__objectif">${escapeHtml(o)}</li>`).join("")}
      </ul>
    </div>
  `;
}

// Révélation progressive cumulative en (5 + N supports) états : état 1 =
// titre seul (arrivée sur la slide, jamais animée — voir js/reveal.js) ;
// états 2..N+1 = une classe d'actif à la fois (segment de barre qui
// déroule de gauche à droite + colonne de registre, au clic, au rythme
// du présentateur) ; état N+2 = + objectifs — APRÈS le diagramme en
// longueur (pas avant, comme dans une version antérieure) : le constat
// chiffré précède la liste d'objectifs qu'il justifie, plutôt que
// l'inverse ; les 3 derniers états = les 3 KPI un par un (leur point de
// départ, N+3, ne change pas : objectifs et classes d'actif occupent
// toujours le même nombre total d'états avant eux, seul l'ordre entre
// les deux s'inverse). Objectifs et enveloppes restent dans le flux dès
// l'état 1 (juste invisibles, voir --invisible) et la grille de KPI
// garde toujours ses 5 emplacements (3 KPI + 2 repères) : pas de
// recalcul de mise en page quand un bloc apparaît.
export function render(slide, opts = {}) {
  const shares = computeShares(slide.supports);
  // Au-delà de 5 supports, resserrer l'espacement des colonnes (README).
  const registreGap = shares.length > 5 ? "1.25cqw" : "2.03125cqw";

  const kpis = slide.kpis;
  const stateIndex = Math.max(opts.stateIndex ?? 0, 0);
  const animate = !!opts.animate;

  // Objectifs après le diagramme en longueur (état N+2, stateIndex
  // shares.length+1) — plus avant lui : le constat chiffré (les classes
  // d'actif) précède la liste d'objectifs qu'il justifie.
  const showObjectifs = stateIndex >= shares.length + 1;
  const objectifsEntering = animate && stateIndex === shares.length + 1;

  // Une classe d'actif à la fois, états 2..N+1 (stateIndex 1..N).
  // entering se recalcule via stateIndex === i + 1, pas via "i est le
  // dernier actif visible" : ce dernier reste vrai à tous les états
  // suivants une fois visibleAssetCount saturé à shares.length (objectifs
  // puis les 3 états de KPI, ensuite) et faisait donc rejouer l'entrée du
  // dernier actif (le PEA) à chaque clic suivant — bug remonté.
  const visibleAssetCount = Math.min(Math.max(stateIndex, 0), shares.length);
  const showEnveloppes = visibleAssetCount >= 1;
  const enveloppesCls = "constat__enveloppes" + (!showEnveloppes ? " constat__enveloppes--invisible" : "");

  // Les 3 KPI viennent après toutes les classes d'actif ET les
  // objectifs — leur point de départ (shares.length + 1) ne change pas
  // par rapport à l'ordre précédent : objectifs et classes d'actif
  // occupent toujours le même nombre total d'états avant eux (1 +
  // shares.length), seul l'ordre entre les deux s'est inversé.
  const visibleKpiCount = Math.min(Math.max(stateIndex - 1 - shares.length, 0), kpis.length);

  return `
    <div class="constat">
      ${renderChapRail(slide)}

      <div class="constat__title-block">
        <h1 class="constat__title">${escapeHtml(slide.titre)}</h1>
        <span class="constat__rule"></span>
      </div>

      <div class="constat__kpis">
        ${kpiHtml(kpis[0], { visible: visibleKpiCount >= 1, entering: animate && stateIndex === shares.length + 2 })}
        ${kpiRuleHtml(visibleKpiCount >= 2)}
        ${kpiHtml(kpis[1], { visible: visibleKpiCount >= 2, entering: animate && stateIndex === shares.length + 3 })}
        ${kpiRuleHtml(visibleKpiCount >= 3)}
        ${kpiHtml(kpis[2], { visible: visibleKpiCount >= 3, entering: animate && stateIndex === shares.length + 4 })}
      </div>

      <div class="${enveloppesCls}">
        <div class="constat__bar">
          ${shares
            .map((s, i) => barSegmentHtml(s, { visible: i < visibleAssetCount, entering: animate && stateIndex === i + 1 }))
            .join("")}
        </div>

        <div class="constat__registre" style="grid-template-columns:repeat(${shares.length},1fr);--registre-gap:${registreGap}">
          ${shares
            .map((s, i) => supportHtml(s, { visible: i < visibleAssetCount, entering: animate && stateIndex === i + 1 }))
            .join("")}
        </div>
      </div>

      ${objectifsHtml(slide.objectifs, { visible: showObjectifs, entering: objectifsEntering })}
    </div>
  `;
}
