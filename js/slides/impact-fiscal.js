import { euro, escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Impact fiscal" (handoff slides assurance vie, GABARITS.md #5)
// — deux cuves. Révélation progressive en 12 états (voir js/deck.js
// stepForward/stepBackward) :
//   états 1-6 : mécanisme purement illustratif (voir introRender) — un
//   capital identique, des intérêts qui montent pareil des deux côtés,
//   puis une partie de ceux de l'épargne bancaire qui s'échappe vers la
//   flat tax, puis ce qu'il en reste (jamais imposé) qui passe du gris au
//   vert (rien de tout ça côté assurance vie, mais un bouclier apparaît
//   pour le MONTRER plutôt que de laisser deviner une absence). Cuves
//   aussi hautes que celles du graphique chiffré (états 10-12) — seul le
//   remplissage est illustratif, pas la taille.
//   état 7 : un clic de pause, le mécanisme reste figé sur son dernier
//   visuel, rien de nouveau.
//   état 8 : la phrase d'hypothèse apparaît SEULE — rien d'autre à
//   l'écran (les cuves du graphique n'existent pas encore dans le DOM).
//   état 9 : second clic de pause — la phrase reste seule, les cuves
//   n'existent toujours pas (remonté : elles apparaissaient un cran trop
//   tôt, avant même ce second clic).
//   état 10 : les cuves apparaissent et se remplissent depuis 0
//   jusqu'au niveau du capital versé (repère "Versé", voir cuveHtml
//   stage 0) — remplissage partiel, pas encore le total.
//   état 11 : les cuves continuent de se remplir du niveau "Versé"
//   jusqu'en haut ; le total apparaît une fois pleines (stage 1) —
//   "avant impôt", les deux cuves valent alors la même chose.
//   état 12 : la cuve bancaire redescend à sa vraie valeur (flat tax
//   payée en cours de route) et l'écart apparaît en même temps, à
//   gauche de cette cuve — "après impôt" (stage 2).
const CUVE_HEIGHT_CQW = 21.09375; // 270px à 1280 de large

// ---------- États 1-4 : mécanisme illustratif ----------

// Capital + intérêts = ~CUVE_HEIGHT_CQW (aussi haut que les cuves
// chiffrées, état 7+) — mêmes proportions qu'avant (2/3 capital, 1/3
// intérêts), juste mises à l'échelle.
const INTRO_CAPITAL_H = 14; // cqw, hauteur de capital (identique, fixe)
const INTRO_INTEREST_H = 7.1; // cqw, intérêts qui montent (état 2)
const INTRO_ESCAPE_H = 3.6; // cqw, portion des intérêts qui s'échappe (bancaire, état 3)
const INTRO_KEPT_H = INTRO_INTEREST_H - INTRO_ESCAPE_H;

// Remplissage capital+intérêts d'une cuve illustrative. escaping=true
// (bancaire) : à l'état 3, un rectangle rouge se déploie de haut en bas
// par-dessus les intérêts pour montrer la portion partie en impôt (voir
// erasedZone). escaping=false (assurance vie) : les intérêts restent à
// INTEREST_H, un bouclier apparaît au-dessus à l'état 4 pour dire
// explicitement "rien ne s'échappe ici" plutôt que de ne rien montrer.
function introCuveHtml({ fillColor, label, escaping, introState, animate }) {
  const interestShown = introState >= 1;
  const interestEntering = animate && introState === 1;
  const escapeShown = escaping && introState >= 2;
  const escapeEntering = animate && escaping && introState === 2;
  const protectShown = !escaping && introState >= 4;
  const protectEntering = animate && !escaping && introState === 4;

  // Une fois la portion imposée couverte de rouge (bancaire, état 3) ou
  // le bouclier posé (assurance vie, état 5, après — pas à la place),
  // ce qui reste de gris passe au vert au clic suivant — jamais imposé,
  // donc jamais rouge, mais on le montre explicitement plutôt que de
  // laisser le gris tel quel jusqu'à la fin.
  const greenAt = escaping ? 3 : 5;
  const greenShown = introState >= greenAt;
  const greenEntering = animate && introState === greenAt;

  // Le gris ne rétrécit jamais côté bancaire (voir erasedZone plus bas :
  // c'est un rectangle rouge par-dessus qui couvre la portion imposée,
  // pas un rétrécissement — jamais de vide en dessous). Sa couleur, en
  // revanche, passe du gris au vert à greenAt (voir greenEntering) — côté
  // bancaire le vert ne se voit que sur le KEPT_H non recouvert par le
  // rouge, le reste est de toute façon caché dessous ; côté assurance
  // vie, c'est toute la bande qui verdit.
  const posStyle = `bottom:${INTRO_CAPITAL_H}cqw;`;
  const greyBg = "rgba(var(--chap-ink-rgb),.16)";
  let interestAttrs;
  if (interestEntering) {
    interestAttrs = ` data-reveal data-reveal-height="${INTRO_INTEREST_H}cqw" style="${posStyle}height:0cqw;background:${greyBg}"`;
  } else if (greenEntering) {
    interestAttrs = ` data-reveal data-reveal-bg="var(--vert)" style="${posStyle}height:${INTRO_INTEREST_H}cqw;background:${greyBg}"`;
  } else {
    const bg = greenShown ? "var(--vert)" : greyBg;
    interestAttrs = ` style="${posStyle}height:${interestShown ? INTRO_INTEREST_H : 0}cqw;background:${bg}"`;
  }

  // Zone effacée : un rectangle rouge, PAR-DESSUS le gris (plus bas dans
  // le HTML, voir le retour), se déploie de haut en bas (scaleY depuis
  // le haut, voir js/reveal.js data-reveal-transform) pour recouvrir la
  // portion d'intérêts partie en impôt — il recouvre bien le gris
  // pendant qu'il se déploie, jamais du vide (le gris ne rétrécit plus,
  // voir interestAttrs plus haut).
  const erasedPos = `bottom:${INTRO_CAPITAL_H + INTRO_KEPT_H}cqw;height:${INTRO_ESCAPE_H}cqw;`;
  const erasedZone = escapeShown
    ? escapeEntering
      ? `<span class="cuve__erased" data-reveal data-reveal-transform="scaleY(1)" style="${erasedPos}transform:scaleY(0)"></span>`
      : `<span class="cuve__erased" style="${erasedPos}transform:scaleY(1)"></span>`
    : "";

  // Le bouclier se pose au milieu de la zone grise (intérêts), pas
  // au-dessus : centré verticalement sur son point médian (bottom au
  // centre de la bande + translateY(50%) en CSS, voir .cuve__shield).
  // Doré à son apparition sur fond gris (état 5) — porte l'info clé
  // (rien n'est jamais imposé) ; une fois le fond vert (état 6, voir
  // greenShown), couleur du fond de LA SLIDE (papier, pas celui de la
  // cuve) — se détache du vert plutôt que de s'y fondre.
  const shield = protectShown
    ? `<div class="cuve__shield" style="bottom:${INTRO_CAPITAL_H + INTRO_INTEREST_H / 2}cqw"><span class="cuve__shield-inner${protectEntering ? " is-entering" : ""}"${protectEntering ? " data-reveal" : ""}>${iconSvg("bouclier", greenShown ? "var(--papier)" : "var(--or)", 40)}</span></div>`
    : "";

  // Toujours rendu dès l'état 1 (juste invisible, voir --invisible),
  // pas seulement à partir de son état d'apparition : l'opacité change
  // seule, jamais la présence dans le DOM (même raison qu'avant leur
  // passage en absolute — éviter tout saut à l'apparition). Positionnés
  // à côté du rectangle qu'ils commentent (enfants de .cuve, elle-même
  // position:relative — même ancre que .cuve__shield/.cuve__erased),
  // pas sous la colonne : rouge à gauche de la zone effacée (bancaire,
  // right:100%), vert à droite de la bande d'intérêts (assurance vie,
  // left:100%) — la marge extérieure de la grille (~28cqw de chaque
  // côté) laisse largement la place, jamais assez étroite pour
  // chevaucher l'autre cuve. Centrés verticalement sur leur rectangle
  // (bottom au point médian + translateY(50%), même technique que
  // .cuve__shield).
  const flatTaxBadge = escaping
    ? `<span class="cuve-col__badge cuve-col__badge--rouge cuve-col__badge--left${escapeShown ? "" : " cuve-col__badge--invisible"}${escapeEntering ? " is-entering" : ""}"${escapeEntering ? " data-reveal" : ""} style="bottom:${INTRO_CAPITAL_H + INTRO_KEPT_H + INTRO_ESCAPE_H / 2}cqw">→ Flat tax 30 %</span>`
    : "";
  const protectBadge = !escaping
    ? `<span class="cuve-col__badge cuve-col__badge--vert cuve-col__badge--right${protectShown ? "" : " cuve-col__badge--invisible"}${protectEntering ? " is-entering" : ""}"${protectEntering ? " data-reveal" : ""} style="bottom:${INTRO_CAPITAL_H + INTRO_INTEREST_H / 2}cqw">Aucun prélèvement</span>`
    : "";

  // Tremblement (état 5, assurance vie) : dit "on essaie de la faire
  // baisser, elle ne bouge pas" par le geste — animation CSS courte
  // jouée une fois à l'insertion (pas le mécanisme data-reveal, pensé
  // pour des transitions, pas des allers-retours), donc posée
  // directement au premier rendu où protectEntering est vrai.
  const cuveCls = "cuve cuve--no-border" + (protectEntering ? " cuve--shake" : "");

  return `
    <div class="cuve-col">
      <div class="${cuveCls}">
        <span class="cuve__fill" style="height:${INTRO_CAPITAL_H}cqw;background:${fillColor}"></span>
        <span class="cuve__interest-fill"${interestAttrs}></span>
        ${erasedZone}
        ${shield}
        ${flatTaxBadge}${protectBadge}
      </div>
      <div class="cuve-col__foot">
        <span class="cuve-col__label">${escapeHtml(label)}</span>
      </div>
    </div>
  `;
}

function introRender(slide, introState, animate) {
  return `
    <div class="impact-fiscal__intro-grid">
      ${introCuveHtml({ fillColor: "var(--bleu)", label: "Épargne bancaire", escaping: true, introState, animate })}
      ${introCuveHtml({ fillColor: "var(--or)", label: "Assurance vie", escaping: false, introState, animate })}
    </div>
  `;
}

// ---------- États 9-11 : graphique chiffré ----------

// stage 0 (état 9) : remplissage depuis 0 jusqu'au repère "Versé"
// seulement. stage 1 (état 10) : le remplissage continue du repère
// jusqu'en haut (montant = refMontant à ce stade, donc hauteur pleine) ;
// le total apparaît, avec un délai calé sur la durée de CE remplissage
// (pas du premier). stage 2 (état 11) : comportement final — la cuve
// bancaire redescend à sa vraie valeur (montant < refMontant), l'écart
// apparaît (voir overlay, positionné à gauche de la cuve elle-même,
// jamais dans le flux de la grille — remonté : les deux cuves doivent
// rester centrées, écart affiché ou non).
function cuveHtml({ montant, verse, refMontant, fillColor, label, desc, showReleased, releasedFrom, stage, animateNow, overlay }) {
  const verseBottom = (verse / refMontant) * CUVE_HEIGHT_CQW;
  const fillHeight = (montant / refMontant) * CUVE_HEIGHT_CQW;

  let fillStartHeight, fillAttrs, growCls;
  if (stage === 0) {
    fillStartHeight = animateNow ? 0 : verseBottom;
    fillAttrs = animateNow ? ` data-reveal data-reveal-height="${verseBottom}cqw"` : "";
    growCls = animateNow ? " cuve__fill--grow" : "";
  } else if (stage === 1) {
    fillStartHeight = animateNow ? verseBottom : fillHeight;
    fillAttrs = animateNow ? ` data-reveal data-reveal-height="${fillHeight}cqw"` : "";
    growCls = animateNow ? " cuve__fill--grow" : "";
  } else {
    // stage 2 : la cuve bancaire redescend d'une pleine cuve (stage 1)
    // vers sa vraie hauteur — jamais de cuve__fill--grow ici, c'est une
    // redescente, pas un remplissage.
    fillStartHeight = animateNow ? CUVE_HEIGHT_CQW : fillHeight;
    fillAttrs = animateNow ? ` data-reveal data-reveal-height="${fillHeight}cqw"` : "";
    growCls = "";
  }

  const released =
    showReleased && releasedFrom > fillHeight
      ? `<span class="cuve__released${animateNow ? " is-entering" : ""}"${animateNow ? " data-reveal" : ""} style="bottom:${fillHeight}cqw;height:${releasedFrom - fillHeight}cqw"></span>`
      : "";

  // Repère "Versé" : apparaît une fois que le remplissage l'atteint
  // (fin du stage 0, état 10, même délai que sa propre animation de
  // montée, voir .cuve__verse--delayed en CSS) — jamais avant, jamais en
  // même temps que la montée du niveau. Le libellé est centré (horizon-
  // talement sur la cuve, verticalement sur son point médian, voir
  // .cuve__verse-label) DANS la portion remplie (0 à verseBottom) plutôt
  // que juste sous le repère : à ce stade précis le remplissage
  // s'arrête pile à ce niveau, donc tout ce qui est en dessous EST la
  // zone colorée — un texte en papier (clair) y reste lisible partout.
  const verseEntering = stage === 0 && animateNow;
  const verseCls = verseEntering ? " is-entering" : "";
  const verseAttrs = verseEntering ? " data-reveal" : "";

  // Total : caché tant que la cuve n'est pas montée jusqu'en haut
  // (réservé dès le stage 0 — voir --invisible — pour ne jamais décaler
  // la mise en page à son apparition), révélé au stage 1 avec un délai
  // calé sur la durée de CE remplissage-là.
  const valueShown = stage >= 1;
  const valueEntering = stage === 1 && animateNow;
  const valueCls =
    "cuve-col__value cuve-col__value--delayed" +
    (valueShown ? "" : " cuve-col__value--invisible") +
    (valueEntering ? " is-entering" : "");
  const valueAttrs = valueEntering ? " data-reveal" : "";

  return `
    <div class="cuve-col">
      <span class="${valueCls}"${valueAttrs}>${euro.format(Math.round(montant))}</span>
      <div class="cuve">
        ${released}
        ${overlay || ""}
        <span class="cuve__fill${growCls}"${fillAttrs} style="height:${fillStartHeight}cqw;background:${fillColor}"></span>
        <span class="cuve__verse-line cuve__verse--delayed${verseCls}"${verseAttrs} style="bottom:${verseBottom}cqw"></span>
        <span class="cuve__verse-label cuve__verse--delayed${verseCls}"${verseAttrs} style="bottom:${verseBottom / 2}cqw">Versé · ${euro.format(verse)}</span>
      </div>
      <div class="cuve-col__foot">
        <span class="cuve-col__label">${escapeHtml(label)}</span>
        <p class="cuve-col__desc">${escapeHtml(desc)}</p>
      </div>
    </div>
  `;
}

function chiffresRender(slide, chiffresState, animate) {
  const stage = chiffresState; // 0, 1 ou 2 (états 9-11, voir render())
  const stage2 = stage >= 2; // état 11 : la cuve bancaire descend, l'écart apparaît
  const refMontant = slide.assuranceVie;
  const bancaireMontant = stage2 ? slide.bancaire : slide.assuranceVie;

  // Centré (voir transform:translateY(50%) en CSS) sur le vide laissé
  // au-dessus du remplissage bancaire une fois redescendu (stage 2) —
  // le même repère visuel que .cuve__released, calculé ici avec la même
  // formule (voir cuveHtml) puisque ce panneau est construit avant
  // l'appel qui produit ce vide.
  const bancaireFillHeight = (slide.bancaire / refMontant) * CUVE_HEIGHT_CQW;
  const ecartCenter = (bancaireFillHeight + CUVE_HEIGHT_CQW) / 2;

  const ecart = stage2
    ? `
      <div class="impact-fiscal__ecart${animate ? " is-entering" : ""}"${animate ? " data-reveal" : ""} style="bottom:${ecartCenter}cqw">
        <span class="impact-fiscal__ecart-label">Écart à ${escapeHtml(slide.horizonLabel)}</span>
        <span class="impact-fiscal__ecart-value">− ${euro.format(slide.ecart)}</span>
      </div>`
    : "";

  const bancaire = cuveHtml({
    montant: bancaireMontant,
    verse: slide.verse,
    refMontant,
    fillColor: "var(--bleu)",
    label: "Épargne bancaire",
    desc: "La flat tax de 30 % est prélevée sur les gains chaque année.",
    showReleased: stage2,
    releasedFrom: CUVE_HEIGHT_CQW,
    stage,
    animateNow: animate,
    overlay: ecart,
  });

  // La cuve dorée monte de concert avec la bancaire aux stages 0-1
  // (même valeur de référence tant que l'écart fiscal n'est pas encore
  // révélé), mais ne redescend jamais au stage 2 — elle reste fixe.
  const assuranceVie = cuveHtml({
    montant: slide.assuranceVie,
    verse: slide.verse,
    refMontant,
    fillColor: "var(--or)",
    label: "Assurance vie",
    desc: "Aucun prélèvement tant qu’il n’y a pas de rachat.",
    showReleased: false,
    releasedFrom: 0,
    stage,
    animateNow: stage2 ? false : animate,
  });

  // Entrée du bloc (état 10, arrivée sur ce graphique après les deux
  // clics d'hypothèse seule, états 8-9) : un fondu sur l'ensemble, pas
  // un remplacement sec — les cuves n'existent pas du tout dans le DOM
  // avant cet état.
  const gridEntering = animate && stage === 0;

  return `
    <div class="impact-fiscal__grid${gridEntering ? " is-entering" : ""}"${gridEntering ? " data-reveal" : ""}>
      ${bancaire}
      ${assuranceVie}
    </div>
  `;
}

// États 1-6 : mécanisme (sans l'hypothèse, voir showHyp). État 7 : clic
// de pause, le mécanisme reste figé sur son dernier visuel, rien
// n'apparaît encore. État 8 : l'hypothèse apparaît SEULE (les cuves du
// graphique n'existent pas encore). État 9 : second clic de pause — la
// phrase d'hypothèse reste seule à l'écran, les cuves n'existent
// toujours pas dans le DOM (remonté : elles apparaissaient un cran trop
// tôt). États 10-12 : le graphique chiffré (voir chiffresRender) —
// remplissage en deux temps puis écart final.
export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 11);
  const animate = !!opts.animate;

  const showHyp = stateIndex >= 7;
  const hypEntering = animate && stateIndex === 7;

  let body;
  if (stateIndex <= 6) {
    const introState = Math.min(stateIndex, 5);
    const introAnimate = animate && stateIndex <= 5; // le clic de pause (état 7) ne rejoue pas le mécanisme
    body = introRender(slide, introState, introAnimate);
  } else if (stateIndex <= 8) {
    body = ""; // l'hypothèse seule, rien d'autre à l'écran (états 8 et 9)
  } else {
    body = chiffresRender(slide, stateIndex - 9, animate);
  }

  const leadCls = "impact-fiscal__lead" + (showHyp ? "" : " impact-fiscal__lead--invisible") + (hypEntering ? " is-entering" : "");

  return `
    <div class="impact-fiscal">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="impact-fiscal__intro">
        <h1 class="chap-title impact-fiscal__title">${escapeHtml(slide.titre)}</h1>
        <p class="${leadCls}"${hypEntering ? " data-reveal" : ""}>${escapeHtml(slide.hypothese)}</p>
      </div>

      ${body}
    </div>
  `;
}
