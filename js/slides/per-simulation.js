import { euro, escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes, iconSvg } from "./_chapitre.js";

// Gabarit "Plan d'investissement" (chapitre PER) — reprend, dans le
// vocabulaire visuel du système "chapitrage" (repris de "Investir en
// financement", scpi-financement.js), une slide client existante d'un
// tout autre style (bandeau gris + accolade + bandes pastel pleine
// largeur) : même contenu (un versement mensuel se décompose en effort
// réel, économie d'impôt et rendement, les trois empilés forment le
// capital retraite), mais racontée comme une seule colonne empilée qui
// se construit brique par brique — pas une accolade + trois bandes
// pastel, un dispositif que ce système n'utilise nulle part ailleurs.
//
// Révélation progressive à 9 états (opts.stateIndex direct, comme
// transmission.js) — les trois rectangles empilés (leur icône/libellé/
// montant mensuel-annuel) et les trois bandes colorées de la colonne
// "capital retraite" (leur montant total) sont volontairement racontés
// en deux temps séparés, pas ensemble comme avant :
//   état 1 : rien que le titre — aucun rectangle.
//   état 2 : le rectangle "versement" apparaît, seul.
//   état 3 : la colonne "capital retraite" vide (son contour) et l'axe
//   des abscisses apparaissent — colonne toujours vide (aucune bande),
//   aucun des trois rectangles empilés pour l'instant.
//   état 4 : le rectangle "Effort d'épargne" se déploie de bas en haut
//   (voir effortBox) — la bande bleue et son montant ("50 400 €")
//   n'apparaissent pas encore.
//   état 5 : le rectangle "Économie d'impôt" se déploie de bas en haut
//   (voir economieBox), même principe — la bande verte n'apparaît pas
//   encore.
//   état 6 : le rectangle "Rendement au sein du PER" se déploie de bas
//   en haut (voir rendementBox) — la bande dorée n'apparaît pas encore.
//   état 7 : la bande bleue ("50 400 €") monte dans la colonne, depuis 0
//   (voir effortBar plus bas).
//   état 8 : la bande verte ("21 600 €") vient s'empiler par-dessus
//   (voir economieBar).
//   état 9 : la bande dorée ("28 000 €") referme la colonne par le haut
//   (voir rendementBar) ; le capital retraite total apparaît au-dessus.
const STATE_COUNT = 9;

// Hauteur de la colonne (cqw) — même ordre de grandeur que la colonne
// de "Investir en financement" (LEVIER_BAR_MAX_CQW ≈ 20cqw dans
// scpi-financement.js), cette slide n'ayant qu'une seule colonne à
// loger (pas deux côte à côte) plutôt qu'un diagramme entier.
const BAR_MAX_CQW = 26;
const BAR_WIDTH_CQW = 13;

// Tous les montants dérivés d'un seul jeu d'entrées (slide.versementMensuel,
// slide.tmiPct, slide.dureeAnnees) — jamais saisis en dur — SAUF le
// rendement, qui suppose une capitalisation dans le temps (taux
// composé mensuel) : comme le patrimoine reconstitué par réinvestissement
// dans scpi-financement.js (patrimoineReinvesti), c'est un calcul fourni
// par le client (slide.rendementTotal), pas recalculé ici.
function values(slide) {
  const versementMensuel = slide.versementMensuel;
  const dureeAnnees = slide.dureeAnnees;
  const tmiPct = slide.tmiPct;
  const rendementTotal = slide.rendementTotal;

  const economieMensuelle = versementMensuel * (tmiPct / 100);
  const effortMensuel = versementMensuel - economieMensuelle;
  const economieTotale = economieMensuelle * 12 * dureeAnnees;
  const effortTotal = effortMensuel * 12 * dureeAnnees;
  const capitalCible = rendementTotal + economieTotale + effortTotal;

  const hEffort = (BAR_MAX_CQW * effortTotal) / capitalCible;
  const hEconomie = (BAR_MAX_CQW * economieTotale) / capitalCible;
  const hRendement = BAR_MAX_CQW - hEffort - hEconomie;

  return {
    dureeAnnees,
    tmiPct,
    rendementAnnuelPct: slide.rendementAnnuelPct,
    versementMensuel: euro.format(versementMensuel),
    versementAnnuel: euro.format(versementMensuel * 12),
    effortMensuel: euro.format(Math.round(effortMensuel)),
    effortAnnuel: euro.format(Math.round(effortTotal / dureeAnnees)),
    economieMensuelle: euro.format(Math.round(economieMensuelle)),
    economieAnnuelle: euro.format(Math.round(economieTotale / dureeAnnees)),
    capitalCible: euro.format(Math.round(capitalCible)),
    effortTotal: euro.format(Math.round(effortTotal)),
    economieTotale: euro.format(Math.round(economieTotale)),
    rendementTotal: euro.format(Math.round(rendementTotal)),
    hEffort,
    hEconomie,
    hRendement,
  };
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const v = values(slide);

  const showVersement = stateIndex >= 1;
  const versementEntering = animate && stateIndex === 1;

  const showCapitalFrame = stateIndex >= 2;
  const frameEntering = animate && stateIndex === 2;

  // Rectangles empilés (icône/libellé/montant mensuel-annuel) : états 4-6.
  const showEffortBox = stateIndex >= 3;
  const effortBoxEntering = animate && stateIndex === 3;
  const showEconomieBox = stateIndex >= 4;
  const economieBoxEntering = animate && stateIndex === 4;
  const showRendementBox = stateIndex >= 5;
  const rendementBoxEntering = animate && stateIndex === 5;

  // Bandes colorées de la colonne "capital retraite" (montant total) :
  // états 7-9, après les trois rectangles plutôt qu'en même temps.
  const showEffort = stateIndex >= 6;
  const effortEntering = animate && stateIndex === 6;
  const showEconomie = stateIndex >= 7;
  const economieEntering = animate && stateIndex === 7;
  const showRendement = stateIndex >= 8;
  const rendementEntering = animate && stateIndex === 8;

  const effortAttrs = effortEntering ? ` data-reveal data-reveal-height="${v.hEffort}cqw"` : "";
  const effortStyle = `height:${effortEntering ? 0 : showEffort ? v.hEffort : 0}cqw`;

  const economieAttrs = economieEntering ? ` data-reveal data-reveal-height="${v.hEconomie}cqw"` : "";
  const economieStyle = `height:${economieEntering ? 0 : showEconomie ? v.hEconomie : 0}cqw`;

  const rendementAttrs = rendementEntering ? ` data-reveal data-reveal-height="${v.hRendement}cqw"` : "";
  const rendementStyle = `height:${rendementEntering ? 0 : showRendement ? v.hRendement : 0}cqw`;

  // Le capital total ne peut s'afficher qu'une fois la colonne pleine
  // (état 9) — ancré sur le sommet réel de la colonne (bottom:100% de
  // la bande "rendement", elle-même dynamique) plutôt qu'une position
  // fixe, donc jamais désynchronisé si les proportions changent.
  const capitalValue = showRendement
    ? `<span class="per-simulation__capital-value${rendementEntering ? " is-entering" : ""}"${rendementEntering ? " data-reveal" : ""}>${v.capitalCible}</span>`
    : "";

  const frameCls = "per-simulation__bar-wrap" + (frameEntering ? " is-entering" : "");

  // Fondu générique (is-entering) pour le texte de la légende, sur le
  // même état que le trait/la flèche (voir axisFill plus bas) — pas de
  // graduations année par année, une seule légende centrée sous l'axe.
  const axisCaption = `<span class="per-simulation__axis-caption${frameEntering ? " is-entering" : ""}"${frameEntering ? " data-reveal" : ""}>Versements effectués pendant ${v.dureeAnnees} ans</span>`;

  // Trait + flèche façon "déroulé" de gauche à droite (même principe que
  // les bandes de la colonne "capital retraite", qui se remplissent par
  // data-reveal-height, mais ici en largeur) : .axis-fill part de 0 et
  // grandit jusqu'à la largeur cible (calc(100% - largeur de la flèche),
  // seule sa propre pointe ::after suit son bord droit — donc la flèche
  // avance avec le trait plutôt que de rester plaquée à l'arrivée. */
  const axisFillWidth = "calc(100% - 0.78125cqw)";
  const axisFill = `<span class="per-simulation__axis-fill"${frameEntering ? ` data-reveal data-reveal-width="${axisFillWidth}"` : ""} style="width:${frameEntering ? "0" : axisFillWidth}"></span>`;

  // Emplacement vide de la même largeur ET hauteur (BAR_MAX_CQW, pas
  // juste la largeur) que la colonne "capital retraite" tant qu'elle
  // n'existe pas encore (état 2, avant capitalFrame). La hauteur compte
  // autant que la largeur : .rects-row (align-items:flex-end) prend pour
  // hauteur de ligne le plus grand de ses enfants — sans ce faux-frais
  // aussi haut que la vraie colonne, la ligne serait plus basse à l'état
  // 2 (rectangle "versement" seul, plus petit que BAR_MAX_CQW) qu'à
  // l'état 3, et le rectangle "versement" (aligné en bas) remonterait
  // d'autant en changeant d'état au lieu de rester à sa position finale.
  const capitalPlaceholder = showCapitalFrame
    ? ""
    : `<div class="per-simulation__bar-col" style="width:${BAR_WIDTH_CQW}cqw;height:${BAR_MAX_CQW}cqw"></div>`;

  // Rectangle "Effort d'épargne" : apparaît à part, à l'état 4
  // (showEffortBox), pas avec le reste de capitalFrame à l'état 3, et
  // pas non plus avec la bande bleue (états 4-6 = les rectangles, états
  // 7-9 = les bandes, volontairement séparés) — même effet déployant de
  // bas en haut que les bandes (data-reveal-height 0 -> v.hEffort ;
  // bottom:0 posé en CSS, overflow:hidden partagé par les trois
  // rectangles empilés, donc le contenu se découvre par le bas au lieu
  // d'un simple fondu).
  const effortHeight = `${v.hEffort}cqw`;
  const effortBoxAttrs = effortBoxEntering ? ` data-reveal data-reveal-height="${effortHeight}"` : "";
  const effortBoxStyle = `height:${effortBoxEntering ? 0 : effortHeight}`;

  const effortBox = showEffortBox
    ? `
      <div class="per-simulation__effort-box"${effortBoxAttrs} style="left:${BAR_WIDTH_CQW}cqw;right:${BAR_WIDTH_CQW}cqw;${effortBoxStyle}">
        ${iconSvg("capital", "var(--bleu)", 36)}
        <span class="per-simulation__effort-label">Effort d'épargne</span>
        <span class="per-simulation__effort-montant">
          <span class="per-simulation__montant-mois">${v.effortMensuel} / mois</span>
          <span class="per-simulation__montant-an">(${v.effortAnnuel} / an)</span>
        </span>
      </div>
    `
    : "";

  // Rectangle "Économie d'impôt" : même traitement que effortBox
  // ci-dessus, mais à l'état 5 (showEconomieBox).
  const economieHeight = `${v.hEconomie}cqw`;
  const economieBoxAttrs = economieBoxEntering ? ` data-reveal data-reveal-height="${economieHeight}"` : "";
  const economieBoxStyle = `height:${economieBoxEntering ? 0 : economieHeight}`;

  const economieBox = showEconomieBox
    ? `
      <div class="per-simulation__economie-box"${economieBoxAttrs} style="left:${BAR_WIDTH_CQW}cqw;right:${BAR_WIDTH_CQW}cqw;bottom:${v.hEffort}cqw;${economieBoxStyle}">
        ${iconSvg("economie-impot", "var(--vert)", 36)}
        <span class="per-simulation__economie-label">Économie d'impôt</span>
        <span class="per-simulation__economie-montant">
          <span class="per-simulation__montant-mois">${v.economieMensuelle} / mois</span>
          <span class="per-simulation__montant-an">(${v.economieAnnuelle} / an)</span>
        </span>
      </div>
    `
    : "";

  // Rectangle "Rendement au sein du PER" : même traitement que
  // effortBox/economieBox, à l'état 6 (showRendementBox).
  const rendementHeight = `${v.hRendement}cqw`;
  const rendementBoxAttrs = rendementBoxEntering ? ` data-reveal data-reveal-height="${rendementHeight}"` : "";
  const rendementBoxStyle = `height:${rendementBoxEntering ? 0 : rendementHeight}`;

  const rendementBox = showRendementBox
    ? `
      <div class="per-simulation__rendement-box"${rendementBoxAttrs} style="left:${BAR_WIDTH_CQW}cqw;right:${BAR_WIDTH_CQW}cqw;bottom:${v.hEffort + v.hEconomie}cqw;${rendementBoxStyle}">
        ${iconSvg("rendement-locatif", "var(--or)", 36)}
        <span class="per-simulation__rendement-label">Rendement au sein du PER</span>
      </div>
    `
    : "";

  // Colonne "capital retraite" + axe : tout ce bloc n'existe pas avant
  // l'état 3 (showCapitalFrame), pas seulement masqué — même logique que
  // le rectangle "versement" plus bas, pour que rien ne subsiste
  // visuellement aux états précédents.
  const capitalFrame = showCapitalFrame
    ? `
      <div class="per-simulation__bar-col">
        ${capitalValue}
        <div class="${frameCls}"${frameEntering ? " data-reveal" : ""} style="width:${BAR_WIDTH_CQW}cqw;height:${BAR_MAX_CQW}cqw">
          <span class="per-simulation__bar per-simulation__bar--rendement"${rendementAttrs} style="${rendementStyle}">
            <span class="per-simulation__bar-value">${v.rendementTotal}</span>
          </span>
          <span class="per-simulation__bar per-simulation__bar--economie"${economieAttrs} style="${economieStyle}">
            <span class="per-simulation__bar-value">${v.economieTotale}</span>
          </span>
          <span class="per-simulation__bar per-simulation__bar--effort"${effortAttrs} style="${effortStyle}">
            <span class="per-simulation__bar-value">${v.effortTotal}</span>
          </span>
        </div>
      </div>

      ${effortBox}

      ${economieBox}

      ${rendementBox}

      <span class="per-simulation__axis-line" style="left:${BAR_WIDTH_CQW}cqw;right:${BAR_WIDTH_CQW}cqw">
        ${axisFill}
        ${axisCaption}
      </span>
    `
    : "";

  return `
    <div class="per-simulation">
      ${renderChapRail(slide)}
      ${slide.railEtapes ? renderRailEtapes(slide.railEtapes, slide.railActive) : ""}

      <div class="per-simulation__intro">
        <h1 class="chap-title per-simulation__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="per-simulation__stage">
        ${
          showVersement
            ? `
        <div class="per-simulation__boxes">
          <div class="per-simulation__rects-row">
            <div class="per-simulation__bar-col">
              <div class="per-simulation__input-box"${versementEntering ? " data-reveal" : ""} style="width:${BAR_WIDTH_CQW}cqw;height:${v.hEffort + v.hEconomie}cqw">
                <span class="per-simulation__input-text">
                  <span class="per-simulation__montant-mois">${v.versementMensuel} / mois</span><br>
                  <span class="per-simulation__montant-an">(${v.versementAnnuel} / an)</span>
                </span>
              </div>
            </div>

            ${capitalPlaceholder}

            ${capitalFrame}
          </div>

          <!-- Span "PER" toujours présent (même largeur), juste visibility:hidden
               avant l'état 3 — même raison que capitalPlaceholder plus haut :
               .captions-row, en flex, se réduirait à la largeur du seul span
               "Versement" et se retrouverait centrée par .boxes au milieu de
               tout le diagramme plutôt qu'alignée avec le rectangle réel. -->
          <div class="per-simulation__captions-row">
            <span class="per-simulation__bar-caption" style="width:${BAR_WIDTH_CQW}cqw">Versement</span>
            <span class="per-simulation__bar-caption" style="width:${BAR_WIDTH_CQW}cqw${showCapitalFrame ? "" : ";visibility:hidden"}">${showCapitalFrame ? "PER" : ""}</span>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <p class="per-simulation__footnote">Illustration non contractuelle · hypothèses : tranche marginale d'imposition ${v.tmiPct} % · rendement au sein du PER ${String(v.rendementAnnuelPct).replace(".", ",")} %/an · hors frais et fiscalité de sortie.</p>
    </div>
  `;
}
