import { euro, escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Comment se constituer du patrimoine immobilier ?" — slide 2/3
// du chapitre pédagogique fixe "Les leviers d'un financement long".
// Raconte, sur un même montant emprunté (slide.montantExemple), l'écart
// entre un crédit court (mensualité plus haute, durée plus courte) et un
// crédit long (mensualité plus basse, durée plus longue) : d'abord
// l'avantage financier (l'écart de mensualité peut être réinvesti),
// puis l'avantage patrimonial (en cas de décès, l'ADE solde le capital
// restant dû — bien plus élevé sur le crédit long, donc protection bien
// supérieure pour une mensualité plus faible), enfin l'avantage fiscal
// (voir financement-synthese.js, slide 3, mêmes liste + montant).
//
// 11 états, cumulatifs :
//   1. icône tirelire + montant exemple
//   2. liste des 3 bénéfices, "1) Avantage financier" actif
//   3. colonne "crédit court" (durée/mensualité)
//   4. colonne "crédit long" (durée/mensualité, plus basse)
//   5. texte "Réduction capacité d'épargne" (écart de mensualité)
//   6. accolade + bulle "Investissement complémentaire"
//   7. bulle +"Épargne de sécurité" + flèche vers le repère de durée courte
//   8. "2) Avantage patrimonial" actif (rien d'autre ne change)
//   9. repère pointillé "12 ans" (hypothèse de décès)
//   10. hachure du capital restant dû, crédit court (faible)
//   11. hachure du capital restant dû, crédit long (important)
export const STATE_COUNT = 11;

export const BENEFICES = ["Avantage financier", "Avantage patrimonial", "Avantage fiscal"];

export function renderIntro(slide, { entering } = {}) {
  return `
    <div class="fd__intro${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
      <span class="fd__intro-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--or)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4c-4.5 0-7.5 2.9-7.5 6.2 0 1.5.6 2.6 1.7 3.6L5.5 16h2.1l.7-1.1c.9.3 1.8.5 2.9.6V18h2.6v-2.5c3.4-.5 5.7-2.6 5.7-5.3 0-.5-.1-1-.2-1.4h1.6l.6-2.2h-2.9C17.6 5.1 15.1 4 12 4Z"/>
          <circle cx="15.2" cy="9" r="0.6" fill="var(--or)" stroke="none"/>
          <path d="M9.5 6.3 8 4.3"/>
        </svg>
      </span>
      <span class="fd__intro-text">Ex. : ${euro.format(slide.montantExemple)}</span>
    </div>
  `;
}

export function renderListe(activeIndex) {
  const items = BENEFICES.map((label, i) => {
    const active = i === activeIndex;
    return `
      <li class="fd__liste-item${active ? " fd__liste-item--active" : ""}">
        <span class="fd__liste-num">${i + 1})</span>
        <span class="fd__liste-label">${escapeHtml(label)}</span>
      </li>
    `;
  }).join("");
  return `<ul class="fd__liste">${items}</ul>`;
}

// Échelle commune du graphe : largeur = durée (années), hauteur = mensualité
// — jamais de valeur saisie en dur, toujours dérivée des champs slide.*.
const AXIS_W = 58;
const BAR_MAX_H = 10.15625;

function scale(slide) {
  const dureeMax = Math.max(slide.dureeCourteAnnees, slide.dureeLongueAnnees);
  const mensualiteMax = Math.max(slide.mensualiteCourte, slide.mensualiteLongue);
  const xFor = (annees) => (AXIS_W * annees) / dureeMax;
  const hFor = (mensualite) => (BAR_MAX_H * mensualite) / mensualiteMax;
  return {
    dureeMax,
    xCourt: xFor(slide.dureeCourteAnnees),
    xLong: xFor(slide.dureeLongueAnnees),
    xDeces: xFor(slide.anneeDeces),
    hCourt: hFor(slide.mensualiteCourte),
    hLong: hFor(slide.mensualiteLongue),
    ecart: slide.mensualiteCourte - slide.mensualiteLongue,
  };
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const s = (n) => stateIndex >= n - 1; // "visible à partir de l'état n (1-based)"
  const entering = (n) => animate && stateIndex === n - 1;
  const sc = scale(slide);

  const activeBenefice = s(8) ? 1 : 0;

  const courtBar = s(3)
    ? `
      <div class="fd__bar fd__bar--court${entering(3) ? " is-entering" : ""}"${entering(3) ? " data-reveal" : ""} style="width:${sc.xCourt}cqw;height:${sc.hCourt}cqw">
        ${
          s(10)
            ? `<div class="fd__hachure" style="left:${sc.xDeces}cqw;right:0"></div>`
            : ""
        }
        <span class="fd__bar-label">${slide.dureeCourteAnnees} ans<br>Mensualité : ${euro.format(slide.mensualiteCourte)}</span>
      </div>
    `
    : "";

  const longBar = s(4)
    ? `
      <div class="fd__bar fd__bar--long${entering(4) ? " is-entering" : ""}"${entering(4) ? " data-reveal" : ""} style="width:${sc.xLong}cqw;height:${sc.hLong}cqw">
        ${
          s(11)
            ? `<div class="fd__hachure" style="left:${sc.xDeces}cqw;right:0"></div>`
            : ""
        }
        <span class="fd__bar-label">${slide.dureeLongueAnnees} ans<br>Mensualité : ${euro.format(slide.mensualiteLongue)}</span>
      </div>
    `
    : "";

  const ecartHtml = s(5)
    ? `
      <div class="fd__ecart${entering(5) ? " is-entering" : ""}"${entering(5) ? " data-reveal" : ""} style="left:${sc.xCourt / 2}cqw;bottom:${sc.hCourt + 0.46875}cqw">
        <span class="fd__ecart-kicker">Réduction capacité d'épargne</span>
        <span class="fd__ecart-value">${euro.format(sc.ecart)}/mois</span>
      </div>
    `
    : "";

  const accoladeHtml = s(6)
    ? `
      <div class="fd__accolade${entering(6) ? " is-entering" : ""}"${entering(6) ? " data-reveal" : ""} style="left:${sc.xCourt}cqw;bottom:${sc.hLong}cqw;height:${sc.hCourt - sc.hLong}cqw"></div>
    `
    : "";

  const bulleHtml = s(6)
    ? `
      <div class="fd__bulle${entering(6) ? " is-entering" : ""}"${entering(6) ? " data-reveal" : ""} style="left:${sc.xCourt + 3}cqw;bottom:${sc.hLong + (sc.hCourt - sc.hLong) / 2}cqw">
        <span class="fd__bulle-item">Investissement complémentaire</span>
        ${
          s(7)
            ? `<span class="fd__bulle-item${entering(7) ? " is-entering" : ""}"${entering(7) ? " data-reveal" : ""}>Épargne de sécurité</span>`
            : ""
        }
      </div>
    `
    : "";

  const flecheHtml = s(7)
    ? `
      <svg class="fd__fleche${entering(7) ? " is-entering" : ""}"${entering(7) ? " data-reveal" : ""} style="left:${sc.xCourt + 3}cqw;bottom:${sc.hLong}cqw;width:2cqw;height:${sc.hLong}cqw" viewBox="0 0 20 100" preserveAspectRatio="none">
        <path d="M18 2 C5 20 2 60 2 96" fill="none" stroke="var(--bleu)" stroke-width="2" stroke-linecap="round"/>
        <path d="M2 96 L-2.5 88 M2 96 L7 90" fill="none" stroke="var(--bleu)" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
    : "";

  const anneeDecesHtml = s(9)
    ? `
      <div class="fd__deces${entering(9) ? " is-entering" : ""}"${entering(9) ? " data-reveal" : ""} style="left:${sc.xDeces}cqw">
        <span class="fd__deces-line"></span>
        <span class="fd__deces-marker"></span>
        <span class="fd__deces-label">${slide.anneeDeces} ans</span>
      </div>
    `
    : "";

  return `
    <div class="financement-duree">
      ${renderChapRail(slide)}

      <div class="financement-duree__intro">
        <h1 class="chap-title financement-duree__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="fd__row">
        ${renderIntro(slide, { entering: entering(1) })}
        ${s(2) ? renderListeWrap(activeBenefice, entering(2)) : ""}
      </div>

      <div class="fd__stage">
        <div class="fd__graph" style="height:${BAR_MAX_H}cqw">
          ${longBar}
          ${courtBar}
          ${ecartHtml}
          ${accoladeHtml}
          ${bulleHtml}
          ${flecheHtml}
          ${anneeDecesHtml}
        </div>
        <div class="fd__axis" style="top:${BAR_MAX_H}cqw;width:${AXIS_W}cqw">
          <span class="fd__axis-arrow"></span>
        </div>
        <span class="fd__axis-label" style="top:${BAR_MAX_H + 0.859375}cqw;left:0">Aujourd'hui</span>
        ${s(3) ? `<span class="fd__axis-label" style="top:${BAR_MAX_H + 0.859375}cqw;left:${sc.xCourt}cqw;transform:translateX(-50%)">${slide.dureeCourteAnnees} ans</span>` : ""}
        ${s(4) ? `<span class="fd__axis-label" style="top:${BAR_MAX_H + 0.859375}cqw;left:${sc.xLong}cqw;transform:translateX(-50%)">${slide.dureeLongueAnnees} ans</span>` : ""}
      </div>
    </div>
  `;
}

function renderListeWrap(activeIndex, entering) {
  return `<div class="fd__liste-wrap${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>${renderListe(activeIndex)}</div>`;
}
