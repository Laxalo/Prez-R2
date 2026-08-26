import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Délais, versements et liquidité" (chapitre SCPI) — trois
// repères pratiques de la vie d'une part, en révélation progressive
// cumulative à 3 états (souscription -> détention -> revente, même
// mécanisme que "Comment ça marche"). Trois cases toujours réservées
// dans la mise en page (placeholder vide tant que non révélées, comme
// les règles de chap-regles.js) : la rangée ne change jamais de largeur
// au fil des états, seul le contenu apparaît.
const CASES = [
  {
    icon: "sablier",
    kicker: "À la souscription",
    titre: "6 mois de délai de jouissance",
  },
  {
    icon: "cycle",
    kicker: "En cours de détention",
    titre: "Versement trimestriel",
  },
  {
    icon: "echange",
    kicker: "À la revente",
    titre: "Liquidité des parts",
  },
];

function boxHtml(item, { visible, entering }) {
  if (!visible) return `<div class="scpi-cadence__box scpi-cadence__box--empty"></div>`;
  const cls = "scpi-cadence__box" + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""}>
      <span class="scpi-cadence__kicker">${escapeHtml(item.kicker)}</span>
      <span class="scpi-cadence__box-head">
        ${iconSvg(item.icon, "rgba(var(--chap-ink-rgb),.65)")}
        <span class="scpi-cadence__titre">${escapeHtml(item.titre)}</span>
      </span>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), CASES.length - 1);
  const animate = !!opts.animate;
  const visibleCount = stateIndex + 1;

  return `
    <div class="scpi-cadence">
      ${renderChapRail(slide)}

      <div class="scpi-cadence__intro">
        <h1 class="chap-title scpi-cadence__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="scpi-cadence__stage">
        ${CASES.map((item, i) => boxHtml(item, { visible: i < visibleCount, entering: animate && i === visibleCount - 1 })).join("")}
      </div>
    </div>
  `;
}
