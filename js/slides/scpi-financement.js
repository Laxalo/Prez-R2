import { euro, escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Investir en financement" (chapitre SCPI) — UNE SEULE slide en
// révélation progressive à 6 états (opts.stateIndex direct, pas de
// morphing entre couches), qui raconte le mécanisme du levier de crédit
// dans l'ordre :
//   1. la mensualité de financement brute, colonne pleine (encre) ;
//   2. les revenus SCPI montent depuis le bas de la colonne et absorbent
//      une partie de la mensualité : il ne reste que l'effort net à la
//      charge de l'investisseur ;
//   3. l'axe se compresse au premier tiers (la colonne + son repère de
//      durée glissent vers la gauche) pour laisser la place au bilan ;
//   4. le bilan : effort réel cumulé sur toute la durée, en regard du
//      patrimoine immobilier détenu ;
//   5. l'effet de levier (gain en euros et en %), toujours dérivé des
//      montants ci-dessus, jamais saisi en dur ;
//   6. les revenus SCPI se poursuivent à vie une fois le financement
//      soldé — même montant (v.revM) qu'aux états 2-3, mais calculé sur
//      les 85 000 € de patrimoine désormais détenus en pleine propriété,
//      plus sur l'effort de 40 500 € qui n'a plus cours.
//
// Colonne "mensualité" (état 1, pleine hauteur) : effort d'épargne net
// (encre) qui se rétracte, revenus SCPI (or) qui montent depuis le bas
// — hauteurs proportionnelles au ratio revenu/mensualité, jamais saisies
// en dur (même principe que les répartitions dérivées, charte
// CLAUDE.md). La somme des deux hauteurs reste constante à chaque
// instant de la transition (même durée/easing, deltas opposés) : jamais
// de trou ni de chevauchement pendant l'animation.
// Même hauteur que les colonnes du diagramme de levier
// (LEVIER_BAR_MAX_CQW) : une seule échelle de "colonne" sur toute la
// slide, pas une par visualisation. AXIS_TOP_CQW doit rester égal à la
// valeur posée dans chapitre.css (.scpi-financement__axis, top) : la
// colonne repose sur l'axe, son top se déduit de sa hauteur plutôt que
// d'être saisi en dur en plus (jamais désynchronisé si l'une des deux
// valeurs change).
const AXIS_TOP_CQW = 25.9375;
const BAR_HEIGHT_CQW = 19.75;
const BAR_TOP_CQW = AXIS_TOP_CQW - BAR_HEIGHT_CQW;

// État 1 : la colonne se construit visuellement mois après mois plutôt
// que d'apparaître comme un bloc plein — un segment par année de
// financement (slide.dureeAnnees, jamais un nombre saisi en dur),
// balayés de gauche à droite via animation-delay (CSS pur, voir
// chapitre.css .scpi-financement__bar-segment : indépendant d'opts.
// animate, pour rejouer à chaque fois qu'on arrive/revient sur cet
// état, y compris à l'ouverture de la slide). Distinct du mécanisme
// data-reveal (transition JS d'un état à l'autre) utilisé partout
// ailleurs sur cette slide.
const SEGMENT_STEP_MS = 16;

// Largeur utile de la scène (cqw) : .scpi-financement__stage fait
// 100% de .scpi-financement, elle-même en retrait du padding horizontal
// de la scène (4.84375cqw de chaque côté) — 100 - 2×4.84375.
const STAGE_W = 90.3125;
const THIRD_W = STAGE_W / 3;

// Le diagramme de levier (état 5) n'a plus de bloc central à côtoyer
// (le bilan chiffré, redondant avec la phrase d'hypothèse, a été
// retiré) : il dispose de tout l'espace entre la colonne rétractée et
// le bord de la scène. LEVIER_LEFT lui laisse une marge à gauche assez
// large pour que les légendes d'ordonnées (des phrases complètes, pas
// juste un montant, voir levierHtml) aient la place de déborder vers la
// gauche de leur axe sans jamais chevaucher la flèche de l'axe
// principal (celui-ci s'arrête à AXIS_END_CQW, mais son repère visuel —
// pointe de flèche — dépasse encore un peu au-delà).
const LEVIER_LEFT = 50.5625;

// L'axe s'arrête juste après la colonne rétractée (voir
// .scpi-financement__axis, largeur posée en style inline) plutôt que de
// courir sous tout le diagramme de levier — laisse le maximum de place
// à ce dernier, qui n'a de toute façon plus besoin de rester au-dessus
// d'une ligne visible.
const AXIS_END_CQW = THIRD_W + 4;

// 8 états — le sous-titre est désormais fixe (slide.sousTitre, toujours
// affiché sous le titre, même registre que les autres gabarits du
// deck) plutôt qu'une phrase révélée à partir d'un état donné : elle ne
// variait de toute façon plus d'un état à l'autre une fois apparue.
// États 5-7 : le diagramme de levier se raconte en trois temps (voir
// showGold/showAnnotation plus bas) — le bleu (effort réel, même
// hauteur des deux côtés), puis le doré (le patrimoine atteint en plus
// grâce au levier), puis l'annotation qui chiffre cet écart. État 8 :
// "Puis, à vie" (showViager plus bas) — indépendant du graphe, une
// conclusion à part plutôt qu'accrochée au dernier de ses trois temps.
const STATE_COUNT = 8;

function values(slide) {
  const financementMensuel = slide.financementMensuel;
  const revenuMensuel = slide.revenuMensuel;
  const effort = financementMensuel - revenuMensuel;
  const duree = slide.dureeAnnees;
  const effortTotal = effort * duree * 12;
  const capitalCible = slide.capitalCible;
  // Patrimoine que le même effort d'épargne réel aurait constitué SANS
  // financement, réinvestissement des loyers et fiscalité inclus (calcul
  // fourni, pas dérivé ici) — la vraie base de comparaison pour l'effet
  // de levier, plus élevée que la simple somme de l'effort versé
  // (effortTotal, qui reste affiché comme repère intermédiaire sur
  // l'axe, voir scpi-financement__levier-axis-label--bleu).
  const patrimoineReinvesti = slide.patrimoineReinvesti;
  const levier = capitalCible - patrimoineReinvesti;
  const levierPct = (levier / patrimoineReinvesti) * 100;
  const hRev = (BAR_HEIGHT_CQW * revenuMensuel) / financementMensuel;
  const hEff = BAR_HEIGHT_CQW - hRev;
  return {
    duree,
    capitalRaw: capitalCible,
    effortTotalRaw: effortTotal,
    patrimoineReinvestiRaw: patrimoineReinvesti,
    capital: euro.format(capitalCible),
    finM: `${euro.format(financementMensuel)}/mois`,
    revM: `${euro.format(revenuMensuel)}/mois`,
    effM: `${euro.format(effort)}/mois`,
    effortTotal: euro.format(effortTotal),
    patrimoineReinvesti: euro.format(patrimoineReinvesti),
    levier: `+${euro.format(levier)}`,
    // Arrondi à l'entier : la statistique à droite des bâtons est une
    // accroche visuelle (+110 %), pas une donnée de précision.
    levierPctRounded: `+${Math.round(levierPct)} %`,
    td: slide.tauxDistribution,
    tf: slide.tauxFinancement,
    hEff,
    hRev,
  };
}

// Diagramme de l'effet de levier (état 5) : deux colonnes à l'échelle
// l'une de l'autre (pas juste deux hauteurs arbitraires) — "Patrimoine
// détenu" est toujours la plus grande, sa base (jusqu'à la hauteur de
// "Effort réel") reste au ton neutre, seul l'écart au sommet passe en
// or : c'est cet écart, pas la colonne entière, qui EST l'effet de
// levier. Descend jusqu'au niveau de l'axe (AXIS_TOP_CQW) — l'axe
// s'arrête désormais avant le diagramme (voir AXIS_END_CQW), le
// diagramme n'a plus besoin de rester au-dessus d'une ligne visible ;
// marge réservée pour les légendes ("Sans/Avec financement") sous les
// colonnes.
const LEVIER_TOP_CQW = 1.5; // top de .scpi-financement__levier, voir chapitre.css
// Titre au-dessus du diagramme ("À effort d'épargne équivalent (...)")
// : réserve une bande fixe au-dessus de la rangée axe+colonnes plutôt
// que de laisser le titre pousser le reste par le flux — LEVIER_ROW_TOP
// (et donc LEVIER_BAR_MAX_CQW, dérivée) doit rester synchronisée avec
// la hauteur de ligne réelle de .scpi-financement__levier-title
// (1.09375cqw × line-height 1.2 = 1.3125cqw) et le gap qui l'en sépare
// (voir .scpi-financement__levier en CSS). Ce gap doit aussi couvrir la
// moitié de la hauteur du premier repère d'ordonnée ("Patrimoine
// immobilier détenu"), qui déborde au-dessus du haut de la rangée —
// centré dessus via translateY(50%), voir .scpi-financement__levier-
// axis-label.
const LEVIER_TITLE_H_CQW = 1.875;
const LEVIER_TITLE_GAP_CQW = 4.5;
const LEVIER_ROW_TOP_CQW = LEVIER_TOP_CQW + LEVIER_TITLE_H_CQW + LEVIER_TITLE_GAP_CQW;
const LEVIER_BAR_MAX_CQW = AXIS_TOP_CQW - LEVIER_ROW_TOP_CQW; // hauteur de la colonne "Patrimoine détenu" — même bas que la colonne de gauche

function barSegmentsHtml(count, label) {
  const segments = Array.from(
    { length: count },
    (_, i) => `<span class="scpi-financement__bar-segment" style="animation-delay:${i * SEGMENT_STEP_MS}ms"></span>`
  ).join("");
  return `
    <div class="scpi-financement__bar-segments">
      ${segments}
      <span class="scpi-financement__bar-label scpi-financement__bar-label--overlay">${escapeHtml(label)}</span>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const v = values(slide);

  // État 2 (index 1) : les revenus SCPI montent depuis le bas, l'effort
  // se rétracte d'autant — voir en-tête de fichier.
  const revenuGrowing = animate && stateIndex === 1;
  const revenuHeight = stateIndex >= 1 ? v.hRev : 0;
  const effortHeight = stateIndex >= 1 ? v.hEff : BAR_HEIGHT_CQW;
  const effortLabel = stateIndex >= 1 ? `Effort d'épargne net · ${v.effM}` : `Mensualité de financement · ${v.finM}`;

  // État 3 (index 2) : la colonne (largeur) et son repère de durée
  // glissent du plein axe au premier tiers.
  const axisShrinking = animate && stateIndex === 2;
  const barWidth = stateIndex >= 2 ? THIRD_W : STAGE_W;
  const tickLeft = stateIndex >= 2 ? THIRD_W : STAGE_W;

  const barAttrs = axisShrinking ? ` data-reveal data-reveal-width="${THIRD_W}cqw"` : "";
  const barStyle = axisShrinking ? `width:${STAGE_W}cqw` : `width:${barWidth}cqw`;
  const tickAttrs = axisShrinking ? ` data-reveal data-reveal-left="${THIRD_W}cqw"` : "";
  const tickStyle = axisShrinking ? `left:${STAGE_W}cqw` : `left:${tickLeft}cqw`;

  // La ligne d'axe s'arrête juste après le bloc central une fois la
  // colonne rétractée (même transition que barWidth/tickLeft
  // ci-dessus) — avant l'état 3, le repère "25 ans" est encore au bout
  // du plein axe (STAGE_W), la raccourcir plus tôt le laisserait flotter
  // sans ligne sous lui.
  const axisWidth = stateIndex >= 2 ? AXIS_END_CQW : STAGE_W;
  const axisAttrs = axisShrinking ? ` data-reveal data-reveal-width="${AXIS_END_CQW}cqw"` : "";
  const axisStyle = axisShrinking ? `width:${STAGE_W}cqw` : `width:${axisWidth}cqw`;

  // Patrimoine cible (85 000 €, v.capital — jamais saisi en dur) :
  // affiché dès l'état 1, au-dessus de la colonne. Centré sur la colonne
  // elle-même (barWidth/2), pas sur la scène : suit donc la même
  // transition que le repère de durée (tickAttrs/tickStyle ci-dessus)
  // quand la colonne se rétracte au tiers à l'état 3 — aux états 1-2 la
  // colonne occupe toute la largeur, donc ce centrage coïncide déjà avec
  // le centrage sur la scène, sans cas particulier à coder.
  const capitalLeft = stateIndex >= 2 ? THIRD_W / 2 : STAGE_W / 2;
  const capitalAttrs = axisShrinking ? ` data-reveal data-reveal-left="${THIRD_W / 2}cqw"` : "";
  const capitalStyle = axisShrinking ? `left:${STAGE_W / 2}cqw` : `left:${capitalLeft}cqw`;

  const effortAttrs = revenuGrowing ? ` data-reveal data-reveal-height="${v.hEff}cqw"` : "";
  const effortStyle = revenuGrowing ? `height:${BAR_HEIGHT_CQW}cqw` : `height:${effortHeight}cqw`;
  const revenuAttrs = revenuGrowing ? ` data-reveal data-reveal-height="${v.hRev}cqw"` : "";
  const revenuStyle = revenuGrowing ? `height:0cqw` : `height:${revenuHeight}cqw`;

  // État 5 (index 4) : effet de levier. Axe des ordonnées à gauche des
  // deux colonnes ("Sans financement" / "Avec financement"), effet de
  // levier (+montant, +%) à droite. Colonnes à l'échelle l'une de
  // l'autre, et désormais de la MÊME couleur (bleu) : les deux
  // représentent le même effort d'épargne réel — seul l'écart au sommet
  // de "Avec financement" (en or) EST le levier — montants toujours
  // dérivés (jamais saisis en dur — charte CLAUDE.md). Les repères
  // d'ordonnées ne portent plus le montant (déplacé au-dessus de chaque
  // colonne, voir scpi-financement__levier-bar-value, qui suit sa
  // hauteur dynamique sans recalcul) mais ce qu'il représente — coloré
  // pour rattacher chaque phrase à sa colonne (bleu/or, mêmes couleurs
  // que les barres).
  const showLevier = stateIndex >= 4;
  const levierEntering = animate && stateIndex === 4;
  const patrimoineBarH = LEVIER_BAR_MAX_CQW;
  // Hauteur réelle des colonnes bleues : basée sur le patrimoine
  // reconstitué avec réinvestissement des loyers (v.patrimoineReinvestiRaw),
  // pas la simple somme de l'effort versé. effortBarH sert de démarcation
  // visuelle DANS les colonnes elles-mêmes (voir markerHtml et le
  // bleu/or de la colonne "Avec financement" plus bas), plus seulement à
  // positionner le repère "Effort d'épargne réel" sur l'axe.
  const effortBarH = LEVIER_BAR_MAX_CQW * (v.effortTotalRaw / v.capitalRaw);
  const reinvestiBarH = LEVIER_BAR_MAX_CQW * (v.patrimoineReinvestiRaw / v.capitalRaw);

  // Trois temps, un par colonne puis l'écart entre les deux — pas un
  // double mouvement simultané, pour que chaque clic raconte UNE seule
  // idée : état 5 (index 4) : les deux colonnes n'apparaissent qu'à
  // hauteur de l'effort d'épargne réel (effortBarH) — même repère que la
  // ligne pointillée (markerHtml), aucune des deux ne dépasse encore, le
  // "même effort des deux côtés" est donc littéralement la même hauteur.
  // État 6 (index 5) : SEULE "Sans financement" grandit, jusqu'au
  // patrimoine reconstitué par réinvestissement (reinvestiBarH,
  // 57 695 €) — son montant n'apparaît qu'à cet instant, pas avant (il
  // n'aurait pas eu de sens tant que la colonne ne l'atteignait pas).
  // État 7 (index 6) : SEULE "Avec financement" grandit à son tour,
  // jusqu'au patrimoine total (patrimoineBarH, 85 000 €) en UN seul
  // mouvement (pas deux) — gain de réinvestissement et effet de levier
  // se lisent ensemble, comme un seul saut au-delà de l'effort réel
  // (voir gapHtml plus bas, qui ne grandit donc plus qu'à cet état).
  // L'annotation "Effet de levier" apparaît au même instant (même
  // déclencheur, showGold/goldEntering) : un repère de plus une fois le
  // montant final en place, pas ce qui fait apparaître le rectangle doré.
  const showLeftGrown = stateIndex >= 5;
  const leftGrowEntering = animate && stateIndex === 5;
  const showGold = stateIndex >= 6;
  const goldEntering = animate && stateIndex === 6;

  let effortBarAttrs, effortBarStyle;
  if (levierEntering) {
    effortBarAttrs = ` data-reveal data-reveal-height="${effortBarH}cqw"`;
    effortBarStyle = `height:0cqw`;
  } else if (leftGrowEntering) {
    effortBarAttrs = ` data-reveal data-reveal-height="${reinvestiBarH}cqw"`;
    effortBarStyle = `height:${effortBarH}cqw`;
  } else {
    effortBarAttrs = "";
    effortBarStyle = `height:${showLeftGrown ? reinvestiBarH : effortBarH}cqw`;
  }

  const leftValue = showLeftGrown
    ? `<span class="scpi-financement__levier-bar-value${leftGrowEntering ? " is-entering" : ""}"${leftGrowEntering ? " data-reveal" : ""}>${v.patrimoineReinvesti}</span>`
    : "";

  let patrimoineBarAttrs, patrimoineBarStyle;
  if (levierEntering) {
    patrimoineBarAttrs = ` data-reveal data-reveal-height="${effortBarH}cqw"`;
    patrimoineBarStyle = `height:0cqw`;
  } else if (goldEntering) {
    patrimoineBarAttrs = ` data-reveal data-reveal-height="${patrimoineBarH}cqw"`;
    patrimoineBarStyle = `height:${effortBarH}cqw`;
  } else {
    patrimoineBarAttrs = "";
    patrimoineBarStyle = `height:${showGold ? patrimoineBarH : effortBarH}cqw`;
  }

  const goldAxisLabel = showGold
    ? `<span class="scpi-financement__levier-axis-label scpi-financement__levier-axis-label--desc scpi-financement__levier-axis-label--or${goldEntering ? " is-entering" : ""}"${goldEntering ? " data-reveal" : ""} style="bottom:${patrimoineBarH}cqw">Patrimoine immobilier constitué par effet de levier</span>`
    : "";

  const goldValue = showGold
    ? `<span class="scpi-financement__levier-bar-value${goldEntering ? " is-entering" : ""}"${goldEntering ? " data-reveal" : ""}>${v.capital}</span>`
    : "";

  const showAnnotation = showGold;
  const annotationEntering = goldEntering;
  const annotationHtml = showAnnotation
    ? `
      <div class="scpi-financement__levier-annotation${annotationEntering ? " is-entering" : ""}"${annotationEntering ? " data-reveal" : ""}>
        <span class="scpi-financement__levier-arrow">
          <span class="scpi-financement__levier-arrow-head scpi-financement__levier-arrow-head--up"></span>
          <span class="scpi-financement__levier-arrow-line"></span>
          <span class="scpi-financement__levier-arrow-head scpi-financement__levier-arrow-head--down"></span>
        </span>
        <div class="scpi-financement__levier-text">
          <span class="scpi-financement__levier-kicker">Effet de levier</span>
          <span class="scpi-financement__levier-value">${v.levier}</span>
          <span class="scpi-financement__levier-pct">${v.levierPctRounded}</span>
        </div>
      </div>
    `
    : "";

  // Écart doré de la colonne "Avec financement" : tout ce qui dépasse
  // l'effort d'épargne réel (effortBarH) une fois cette colonne montée à
  // patrimoineBarH, en un seul mouvement (voir patrimoineBarAttrs/Style
  // ci-dessus, qui grandit désormais directement de effortBarH à
  // patrimoineBarH à l'état 7, plus en deux temps). N'existe donc plus
  // qu'à partir de cet état — avant, cette colonne est identique à
  // "Sans financement" à effortBarH, entièrement bleue (background de
  // .scpi-financement__levier-bar--patrimoine). .scpi-financement__
  // levier-bar-gap (top:0, hauteur posée en style inline) occupe le HAUT
  // de la colonne, le bleu du fond reste visible en dessous jusqu'à
  // effortBarH.
  const goldGapFinalH = patrimoineBarH - effortBarH;
  const gapAttrs = goldEntering ? ` data-reveal data-reveal-height="${goldGapFinalH}cqw"` : "";
  const gapStyle = `height:${goldEntering ? 0 : goldGapFinalH}cqw`;
  const gapHtml = showGold
    ? `
      <div class="scpi-financement__levier-bar-gap"${gapAttrs} style="${gapStyle}">
        ${annotationHtml}
      </div>
    `
    : "";

  // Ligne pointillée : démarcation entre l'effort d'épargne réel
  // (effortBarH) et le patrimoine immobilier constitué par réinvestissement
  // des loyers, sur les DEUX colonnes — même effort réel des deux côtés,
  // donc même hauteur de repère. Dans .scpi-financement__levier-bar-wrap
  // (hauteur fixe, LEVIER_BAR_MAX_CQW), pas dans la barre elle-même
  // (hauteur animée) : reste au bon niveau pendant la croissance des
  // colonnes plutôt que de suivre leur animation.
  const markerHtml = showLevier ? `<span class="scpi-financement__levier-bar-marker" style="bottom:${effortBarH}cqw"></span>` : "";

  const levierHtml = showLevier
    ? `
      <div class="scpi-financement__levier${levierEntering ? " is-entering" : ""}"${levierEntering ? " data-reveal" : ""} style="left:${LEVIER_LEFT}cqw">
        <span class="scpi-financement__levier-title">À effort d'épargne équivalent (${v.effM}) :</span>
        <div class="scpi-financement__levier-row">
          <div class="scpi-financement__levier-axis" style="height:${LEVIER_BAR_MAX_CQW}cqw">
            ${goldAxisLabel}
            <span class="scpi-financement__levier-axis-label scpi-financement__levier-axis-label--desc scpi-financement__levier-axis-label--bleu" style="bottom:${reinvestiBarH}cqw">Patrimoine immobilier constitué<br>par réinvestissement des loyers</span>
            <span class="scpi-financement__levier-axis-label scpi-financement__levier-axis-label--desc scpi-financement__levier-axis-label--bleu" style="bottom:${effortBarH}cqw">Effort d'épargne réel</span>
            <span class="scpi-financement__levier-axis-label" style="bottom:0">0 €</span>
          </div>
          <div class="scpi-financement__levier-diagram">
            <div class="scpi-financement__levier-col">
              <div class="scpi-financement__levier-bar-wrap" style="height:${LEVIER_BAR_MAX_CQW}cqw">
                <div class="scpi-financement__levier-bar scpi-financement__levier-bar--effort"${effortBarAttrs} style="${effortBarStyle}">
                  ${leftValue}
                </div>
                ${markerHtml}
              </div>
              <span class="scpi-financement__levier-caption">Sans financement</span>
            </div>
            <div class="scpi-financement__levier-col">
              <div class="scpi-financement__levier-bar-wrap" style="height:${LEVIER_BAR_MAX_CQW}cqw">
                <div class="scpi-financement__levier-bar scpi-financement__levier-bar--patrimoine"${patrimoineBarAttrs} style="${patrimoineBarStyle}">
                  ${goldValue}
                  ${gapHtml}
                </div>
                ${markerHtml}
              </div>
              <span class="scpi-financement__levier-caption">Avec financement</span>
            </div>
          </div>
        </div>
      </div>
    `
    : "";

  // État 8 (index 7) : les revenus se poursuivent à vie une fois le
  // financement soldé — même montant qu'aux états 2-3 (v.revM), mais
  // affiché comme un repère de durée qui prolonge l'axe au-delà de
  // "25 ans", pas un nouveau calcul. Kicker + grande valeur (même
  // vocabulaire que le bilan/l'effet de levier) plutôt qu'une légende
  // discrète : c'est la conclusion de la slide, elle doit se voir. À
  // côté de la pointe de flèche (AXIS_END_CQW + petite marge), au même
  // niveau vertical qu'elle (voir top/transform en CSS) plutôt que
  // dessous — se lit comme un repère qui prolonge la ligne, pas comme
  // une légende d'axe. Note explicative sous la valeur : rend le lien
  // avec le patrimoine (v.capital, dérivé, jamais saisi en dur) explicite
  // plutôt que de le laisser implicite via l'axe. Dernier état, à part
  // du diagramme de levier (bleu état 5, doré état 6, annotation état
  // 7) : une conclusion propre, pas accrochée au dernier temps du
  // graphe.
  const showViager = stateIndex >= 7;
  const viagerEntering = animate && stateIndex === 7;
  const viagerHtml = showViager
    ? `
      <div class="scpi-financement__viager${viagerEntering ? " is-entering" : ""}"${viagerEntering ? " data-reveal" : ""} style="left:${AXIS_END_CQW + 1.5}cqw">
        <span class="scpi-financement__viager-kicker">Puis, à vie</span>
        <span class="scpi-financement__viager-value">${v.revM}</span>
        <p class="scpi-financement__viager-note">Les loyers continuent d'être versés, base ${v.capital}</p>
      </div>
    `
    : "";

  return `
    <div class="scpi-financement">
      ${renderChapRail(slide)}

      <div class="scpi-financement__intro">
        <h1 class="chap-title scpi-financement__title">${escapeHtml(slide.titre)}</h1>
        <p class="scpi-financement__sub">${escapeHtml(slide.sousTitre)}</p>
      </div>

      <div class="scpi-financement__stage">
        <div class="scpi-financement__capital-cible"${capitalAttrs} style="${capitalStyle}">
          <span class="scpi-financement__capital-cible-value">${v.capital}</span>
        </div>
        ${
          stateIndex === 0
            ? `<div class="scpi-financement__bar" style="left:0;top:${BAR_TOP_CQW}cqw;height:${BAR_HEIGHT_CQW}cqw;width:${STAGE_W}cqw">${barSegmentsHtml(v.duree, effortLabel)}</div>`
            : `
        <div class="scpi-financement__bar"${barAttrs} style="left:0;top:${BAR_TOP_CQW}cqw;height:${BAR_HEIGHT_CQW}cqw;${barStyle}">
          <div class="scpi-financement__bar-effort"${effortAttrs} style="${effortStyle}">
            <span class="scpi-financement__bar-label">${escapeHtml(effortLabel)}</span>
          </div>
          <div class="scpi-financement__bar-revenu"${revenuAttrs} style="${revenuStyle}">
            <span class="scpi-financement__bar-label scpi-financement__bar-label--ink">Revenus SCPI · ${v.revM}</span>
          </div>
        </div>
        `
        }

        ${levierHtml}

        <div class="scpi-financement__axis"${axisAttrs} style="${axisStyle}">
          <span class="scpi-financement__axis-arrow"></span>
        </div>
        <div class="scpi-financement__tick" style="left:0"></div>
        <div class="scpi-financement__tick"${tickAttrs} style="${tickStyle}"></div>
        <span class="scpi-financement__axis-label" style="left:0">Aujourd'hui</span>
        <span class="scpi-financement__axis-label scpi-financement__axis-label--center"${tickAttrs} style="${tickStyle}">${v.duree} ans</span>
        ${viagerHtml}
      </div>

      <p class="scpi-financement__footnote">Hypothèses · taux de distribution SCPI ${escapeHtml(v.td)}/an hors revalorisation · taux de financement ${escapeHtml(v.tf)} assurance incluse · montants moyens sur les ${v.duree} premières années · données brutes de fiscalité et de prélèvements sociaux · fiscalité avant réinvestissement prise en compte (TMI 30 % + PS 17,2 %).</p>
    </div>
  `;
}
