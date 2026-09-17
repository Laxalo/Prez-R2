import { escapeHtml } from "../editable.js";
import { renderChapRail, formatPct } from "./_chapitre.js";

// Gabarit "Comment se constituer du patrimoine immobilier ?" — slide 1/3
// du chapitre pédagogique fixe "Les leviers d'un financement long"
// (argumentaire immobilier locatif, contenu et déroulé d'états validés
// avec Victor). Raconte le mécanisme fiscal : les revenus fonciers
// déclenchent l'impôt (colonnes "Revenus"/"Impôts"), mais les charges
// déductibles (intérêts d'emprunt + ADE) viennent en réduire l'assiette
// imposable — d'où la 3e colonne, insérée entre les deux (elle diminue
// visuellement l'écart entre "ce qui est perçu" et "ce qui est taxé").
//
// 9 états, cumulatifs (chaque état ajoute un élément au précédent) :
//   1. "Vos Revenus" (colonne Revenus, repère bas)
//   2. "Vos impôts" (colonne Impôts, repère bas) — réaction au 1
//   3. "Revenus fonciers" (colonne Revenus, repère haut)
//   4. "Impôts (RF)" + taux (colonne Impôts, repère haut, pas encore barré)
//   5. 3e colonne "Charges déductibles" (en-tête + case vide)
//   6. "Intérêts d'emprunt + ADE" dans cette case
//   7. ligne pointillée : niveau de revenus absorbé par les charges
//   8. portion sous la ligne, dans "Revenus fonciers", mise en évidence
//   9. "Impôts (RF)" barré — conséquence de l'état 8
//
// Diagramme final (état 9) réutilisé identique par financement-synthese.js
// (slide 3) : voir renderDiagramme() ci-dessous, exportée plutôt que
// dupliquée entre les deux fichiers.
export const STATE_COUNT = 9;

// 3 colonnes de largeur égale sur la même scène que le reste du deck
// (STAGE_W = 100 - 2×4.84375, padding horizontal de .financement-
// fiscalite, voir css/chapitre.css) — Revenus | Charges déductibles |
// Impôts : la colonne des charges s'intercale entre les deux qu'elle
// relie (ligne pointillée état 7), plutôt qu'en bout de rang.
const STAGE_W = 90.3125;
const COL_GAP = 3;
const COL_W = (STAGE_W - 2 * COL_GAP) / 3;
const COL_LEFT = [0, COL_W + COL_GAP, 2 * (COL_W + COL_GAP)];
const BOX_W = 14.0625;

// Hauteurs illustratives (mécanisme pédagogique fixe, aucun montant
// client en jeu ici — seuls slide.tmi/slide.ps sont paramétrables) :
// le repère "Revenus fonciers" est le plus haut des trois, "Impôts (RF)"
// à hauteur comparable, "Intérêts d'emprunt + ADE" plus bas — la ligne
// pointillée (état 7) tombe donc À L'INTÉRIEUR du repère "Revenus
// fonciers", ce que raconte l'état 8.
// Cylindres 3D (demande explicite de Victor, déroge à la charte "pas de
// volume/dégradé" du reste du deck pour cette slide) : la colonne
// Revenus est visuellement 2,5× plus "grosse" que la colonne Impôts
// (réglage arbitraire, demandé tel quel — aucun montant réel ne motive
// ce ratio) — appliqué en surface (largeur ET hauteur × RATIO_SURFACE,
// racine carrée de 2,5, pour que l'AIRE du cylindre, pas juste sa
// hauteur, soit 2,5× plus grande) à chaque paire revenus/impôts.
const RATIO = 2.5;
const RATIO_SURFACE = Math.sqrt(RATIO);

const BASE_CYL_W = 6.09375;
const BASE_CYL_H = 3.046875;
const GAP = 0.859375;
const H_REVENUS = 9.375;
const H_IMPOTS = 9.375;
const H_CHARGES = 5.703125;
// STACK_H doit couvrir le plus haut empilement possible : côté Revenus,
// cylindre de base agrandi (×RATIO_SURFACE) + le repère du haut.
const BASE_H = BASE_CYL_H * RATIO_SURFACE;
const STACK_H = BASE_H + GAP + Math.max(H_REVENUS, H_IMPOTS);

// Un seul gradient de "modelé" par cylindre (id dérivé du rôle, pas de
// génération aléatoire — markup statique, jamais deux cylindres du même
// rôle sur une même slide). Superposé au-dessus du aplat de couleur du
// corps (fill uni, currentColor via `color`) : clair à gauche, sombre à
// droite — donne le volume sans dépendre d'une nuance --or-fonce/--bleu-
// fonce qui n'existe pas dans la palette du thème.
function cylinderSvg({ id, width, height, color, outlineOnly = false }) {
  const ry = height * 0.22;
  const rx = width / 2;
  const cx = width / 2;
  const bodyTop = ry;
  const bodyH = height - 2 * ry;

  if (outlineOnly) {
    return `
      <svg class="ff__cyl" width="${width}cqw" height="${height}cqw" viewBox="0 0 ${width} ${height}">
        <rect x="0.5" y="${bodyTop}" width="${width - 1}" height="${bodyH}" stroke="rgba(var(--chap-ink-rgb),.4)" stroke-width="0.6" stroke-dasharray="2 2" fill="none"/>
        <ellipse cx="${cx}" cy="${bodyTop}" rx="${rx - 0.5}" ry="${ry}" stroke="rgba(var(--chap-ink-rgb),.4)" stroke-width="0.6" stroke-dasharray="2 2" fill="none"/>
        <ellipse cx="${cx}" cy="${height - ry}" rx="${rx - 0.5}" ry="${ry}" stroke="rgba(var(--chap-ink-rgb),.4)" stroke-width="0.6" stroke-dasharray="2 2" fill="none"/>
      </svg>
    `;
  }

  return `
    <svg class="ff__cyl" width="${width}cqw" height="${height}cqw" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--papier)" stop-opacity="0.35"/>
          <stop offset="45%" stop-color="var(--papier)" stop-opacity="0"/>
          <stop offset="100%" stop-color="var(--encre)" stop-opacity="0.3"/>
        </linearGradient>
      </defs>
      <ellipse cx="${cx}" cy="${height - ry}" rx="${rx}" ry="${ry}" fill="${color}"/>
      <ellipse cx="${cx}" cy="${height - ry}" rx="${rx}" ry="${ry}" fill="var(--encre)" opacity="0.22"/>
      <rect x="0" y="${bodyTop}" width="${width}" height="${bodyH}" fill="${color}"/>
      <rect x="0" y="${bodyTop}" width="${width}" height="${bodyH}" fill="url(#${id})"/>
      <ellipse cx="${cx}" cy="${bodyTop}" rx="${rx}" ry="${ry}" fill="${color}"/>
      <ellipse cx="${cx}" cy="${bodyTop}" rx="${rx}" ry="${ry}" fill="var(--papier)" opacity="0.16"/>
    </svg>
  `;
}

// Repère bas (fixe) : cylindre + légende SOUS le cylindre (jamais du
// texte peint sur la surface 3D — c'est précisément ce qui rendait
// "REVENUS FONCIERS" illisible sur la 1ère tentative, voir le retour de
// Victor). Légende encre sur papier, contraste garanti quel que soit le
// dégradé/hachure appliqué au cylindre lui-même.
function baseHtml(label, { entering, width, height, color, id } = {}) {
  return `
    <div class="ff__base-wrap${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
      ${cylinderSvg({ id, width, height, color })}
      <span class="ff__base-label">${escapeHtml(label)}</span>
    </div>
  `;
}

// Diagramme complet (colonnes + ligne + hachure + barré), piloté par des
// booléens plutôt que par un stateIndex propre à cette fonction — permet
// à financement-synthese.js de demander directement l'état final (tous
// à true) sans repasser par la logique de révélation de cette slide.
export function renderDiagramme(slide, flags = {}) {
  const {
    showRevenus = true,
    showImpots = true,
    showRevenusFonciers = true,
    showImpotsRF = true,
    showCharges = true,
    showInterets = true,
    showLigne = true,
    showHachure = true,
    showBarre = true,
    animate = false,
    entering = {},
  } = flags;

  const taux = formatPct(slide.tmi + slide.ps);
  const detailTaux = `TMI ${formatPct(slide.tmi)} + PS ${formatPct(slide.ps)}`;

  const revenusFonciersBox = showRevenusFonciers
    ? `
      <div class="ff__box ff__box--revenus${entering.revenusFonciers ? " is-entering" : ""}"${entering.revenusFonciers ? " data-reveal" : ""} style="height:${H_REVENUS}cqw">
        <span class="ff__box-label">Revenus fonciers</span>
        ${
          showHachure
            ? `<div class="ff__hachure${entering.hachure ? " is-entering" : ""}"${entering.hachure ? " data-reveal" : ""} style="height:${H_CHARGES}cqw"></div>`
            : ""
        }
      </div>
    `
    : "";

  const impotsRFBox = showImpotsRF
    ? `
      <div class="ff__box ff__box--impots${showBarre ? " ff__box--barre" : ""}${entering.impotsRF ? " is-entering" : ""}"${entering.impotsRF ? " data-reveal" : ""} style="height:${H_IMPOTS}cqw">
        <span class="ff__box-label">Impôts (RF)</span>
        <span class="ff__box-taux">${taux}<br><span class="ff__box-taux-detail">${detailTaux}</span></span>
        ${showBarre ? `<span class="ff__box-strike${entering.barre ? " is-entering" : ""}"${entering.barre ? " data-reveal" : ""}></span>` : ""}
      </div>
    `
    : "";

  const chargesCase = showCharges
    ? `
      <div class="ff__box ff__box--charges${showInterets ? " ff__box--filled" : ""}" style="height:${H_CHARGES}cqw">
        ${showInterets ? `<span class="ff__box-label${entering.interets ? " is-entering" : ""}"${entering.interets ? " data-reveal" : ""}>Intérêts d'emprunt<br>+ ADE</span>` : ""}
      </div>
    `
    : "";

  const ligneHtml = showLigne
    ? `<span class="ff__ligne${entering.ligne ? " is-entering" : ""}"${entering.ligne ? " data-reveal" : ""} style="left:${COL_LEFT[0] + COL_W / 2}cqw;width:${COL_LEFT[1] + COL_W / 2 - (COL_LEFT[0] + COL_W / 2)}cqw;bottom:${BASE_H + GAP + H_CHARGES}cqw"></span>`
    : "";

  return `
    <div class="ff__stage">
      <div class="ff__col" style="left:${COL_LEFT[0]}cqw;width:${COL_W}cqw">
        <div class="ff__col-header"></div>
        <div class="ff__col-stack" style="height:${STACK_H}cqw">
          ${revenusFonciersBox}
          ${
            showRevenus
              ? baseHtml("Vos Revenus", {
                  entering: entering.revenus,
                  width: BASE_CYL_W * RATIO_SURFACE,
                  height: BASE_CYL_H * RATIO_SURFACE,
                  color: "var(--or)",
                  id: "ff-cyl-revenus-base",
                })
              : ""
          }
        </div>
      </div>
      <div class="ff__col" style="left:${COL_LEFT[1]}cqw;width:${COL_W}cqw">
        <div class="ff__col-header">
          ${showCharges ? `<span class="ff__col-title${entering.charges ? " is-entering" : ""}"${entering.charges ? " data-reveal" : ""}>Charges déductibles</span>` : ""}
        </div>
        <div class="ff__col-stack" style="height:${STACK_H}cqw">
          ${chargesCase}
          <span class="ff__base-wrap ff__base-wrap--spacer" style="height:${BASE_CYL_H}cqw"></span>
        </div>
      </div>
      <div class="ff__col" style="left:${COL_LEFT[2]}cqw;width:${COL_W}cqw">
        <div class="ff__col-header"></div>
        <div class="ff__col-stack" style="height:${STACK_H}cqw">
          ${impotsRFBox}
          ${
            showImpots
              ? baseHtml("Vos impôts", {
                  entering: entering.impots,
                  width: BASE_CYL_W,
                  height: BASE_CYL_H,
                  color: "var(--bleu)",
                  id: "ff-cyl-impots-base",
                })
              : ""
          }
        </div>
      </div>
      ${ligneHtml}
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), STATE_COUNT - 1);
  const animate = !!opts.animate;
  const s = (n) => stateIndex >= n - 1; // "visible à partir de l'état n (1-based)"
  const entering = (n) => animate && stateIndex === n - 1;

  const diagramme = renderDiagramme(slide, {
    showRevenus: s(1),
    showImpots: s(2),
    showRevenusFonciers: s(3),
    showImpotsRF: s(4),
    showCharges: s(5),
    showInterets: s(6),
    showLigne: s(7),
    showHachure: s(8),
    showBarre: s(9),
    entering: {
      revenus: entering(1),
      impots: entering(2),
      revenusFonciers: entering(3),
      impotsRF: entering(4),
      charges: entering(5),
      interets: entering(6),
      ligne: entering(7),
      hachure: entering(8),
      barre: entering(9),
    },
  });

  return `
    <div class="financement-fiscalite">
      ${renderChapRail(slide)}

      <div class="financement-fiscalite__intro">
        <h1 class="chap-title financement-fiscalite__title">${escapeHtml(slide.titre)}</h1>
      </div>

      ${diagramme}
    </div>
  `;
}
