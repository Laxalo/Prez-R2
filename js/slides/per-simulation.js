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
// Révélation progressive à 4 états (opts.stateIndex direct, comme
// transmission.js) :
//   état 1 : la phrase d'hypothèse + la colonne vide (son contour)
//   apparaissent.
//   état 2 : l'effort d'épargne réel (le socle, ce qui reste à la
//   charge de l'investisseur une fois l'économie d'impôt déduite) monte
//   dans la colonne, depuis 0.
//   état 3 : l'économie d'impôt vient s'empiler par-dessus.
//   état 4 : le rendement obtenu au sein du PER referme la colonne par
//   le haut ; le capital retraite total apparaît au-dessus.
const STATE_COUNT = 4;

// Hauteur de la colonne (cqw) — même ordre de grandeur que la colonne
// de "Investir en financement" (LEVIER_BAR_MAX_CQW ≈ 20cqw dans
// scpi-financement.js), cette slide n'ayant qu'une seule colonne à
// loger (pas deux côte à côte) plutôt qu'un diagramme entier.
const BAR_MAX_CQW = 20;
const BAR_WIDTH_CQW = 10.3125;

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
    hEffort,
    hEconomie,
    hRendement,
  };
}

// Un repère de la colonne (icône + libellé + montant), centré sur le
// milieu de la bande qu'il commente — même technique que le repère
// "Versé" de cuveHtml (impact-fiscal.js) : bottom au milieu de la
// portion déjà remplie, translateY(50%) en CSS.
function repereHtml({ icon, color, label, montant, bottom, shown, entering }) {
  const cls = "per-simulation__repere" + (shown ? "" : " per-simulation__repere--invisible") + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""} style="bottom:${bottom}cqw">
      ${iconSvg(icon, color, 26)}
      <div class="per-simulation__repere-text">
        <span class="per-simulation__repere-label" style="color:${color}">${escapeHtml(label)}</span>
        ${montant ? `<span class="per-simulation__repere-montant">${montant}</span>` : ""}
      </div>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const v = values(slide);

  const frameEntering = animate && stateIndex === 0;

  const showEffort = stateIndex >= 1;
  const effortEntering = animate && stateIndex === 1;
  const showEconomie = stateIndex >= 2;
  const economieEntering = animate && stateIndex === 2;
  const showRendement = stateIndex >= 3;
  const rendementEntering = animate && stateIndex === 3;

  const effortAttrs = effortEntering ? ` data-reveal data-reveal-height="${v.hEffort}cqw"` : "";
  const effortStyle = `height:${effortEntering ? 0 : showEffort ? v.hEffort : 0}cqw`;

  const economieAttrs = economieEntering ? ` data-reveal data-reveal-height="${v.hEconomie}cqw"` : "";
  const economieStyle = `height:${economieEntering ? 0 : showEconomie ? v.hEconomie : 0}cqw`;

  const rendementAttrs = rendementEntering ? ` data-reveal data-reveal-height="${v.hRendement}cqw"` : "";
  const rendementStyle = `height:${rendementEntering ? 0 : showRendement ? v.hRendement : 0}cqw`;

  const effortRepere = repereHtml({
    icon: "capital",
    color: "var(--bleu)",
    label: "Effort d'épargne",
    montant: `${v.effortMensuel} / mois · ${v.effortAnnuel} / an`,
    bottom: v.hEffort / 2,
    shown: showEffort,
    entering: effortEntering,
  });
  const economieRepere = repereHtml({
    icon: "economie-impot",
    color: "var(--vert)",
    label: "Économie d'impôt",
    montant: `${v.economieMensuelle} / mois · ${v.economieAnnuelle} / an`,
    bottom: v.hEffort + v.hEconomie / 2,
    shown: showEconomie,
    entering: economieEntering,
  });
  const rendementRepere = repereHtml({
    icon: "rendement-locatif",
    color: "var(--or)",
    label: "Rendement au sein du PER",
    montant: "",
    bottom: v.hEffort + v.hEconomie + v.hRendement / 2,
    shown: showRendement,
    entering: rendementEntering,
  });

  // Le capital total ne peut s'afficher qu'une fois la colonne pleine
  // (état 4) — ancré sur le sommet réel de la colonne (bottom:100% de
  // la bande "rendement", elle-même dynamique) plutôt qu'une position
  // fixe, donc jamais désynchronisé si les proportions changent.
  const capitalValue = showRendement
    ? `<span class="per-simulation__capital-value${rendementEntering ? " is-entering" : ""}"${rendementEntering ? " data-reveal" : ""}>${v.capitalCible}</span>`
    : "";

  const frameCls = "per-simulation__bar-wrap" + (frameEntering ? " is-entering" : "");

  return `
    <div class="per-simulation">
      ${renderChapRail(slide)}
      ${slide.railEtapes ? renderRailEtapes(slide.railEtapes, slide.railActive) : ""}

      <div class="per-simulation__intro">
        <h1 class="chap-title per-simulation__title">${escapeHtml(slide.titre)}</h1>
        <p class="per-simulation__sub">${escapeHtml(slide.sousTitre)}</p>
      </div>

      <div class="per-simulation__stage">
        <p class="per-simulation__lead${frameEntering ? " is-entering" : ""}"${frameEntering ? " data-reveal" : ""}>
          Pour un versement de <strong>${v.versementMensuel} / mois</strong> (${v.versementAnnuel} / an), pendant ${v.dureeAnnees} ans&nbsp;:
        </p>

        <div class="per-simulation__column">
          <div class="per-simulation__bar-col">
            ${capitalValue}
            <div class="${frameCls}"${frameEntering ? " data-reveal" : ""} style="width:${BAR_WIDTH_CQW}cqw;height:${BAR_MAX_CQW}cqw">
              <span class="per-simulation__bar per-simulation__bar--rendement"${rendementAttrs} style="${rendementStyle}"></span>
              <span class="per-simulation__bar per-simulation__bar--economie"${economieAttrs} style="${economieStyle}"></span>
              <span class="per-simulation__bar per-simulation__bar--effort"${effortAttrs} style="${effortStyle}"></span>
            </div>
            <span class="per-simulation__bar-caption">Capital retraite · PER</span>
          </div>

          <div class="per-simulation__reperes" style="height:${BAR_MAX_CQW}cqw">
            ${effortRepere}
            ${economieRepere}
            ${rendementRepere}
          </div>
        </div>
      </div>

      <p class="per-simulation__footnote">Illustration non contractuelle · hypothèses : tranche marginale d'imposition ${v.tmiPct} % · rendement au sein du PER ${String(v.rendementAnnuelPct).replace(".", ",")} %/an · hors frais et fiscalité de sortie.</p>
    </div>
  `;
}
