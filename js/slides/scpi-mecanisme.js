import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Comment ça marche" (chapitre SCPI, import Claude Design
// "Gabarits chapitre SCPI") — révélation progressive cumulative à 6
// états (opts.stateIndex direct, même mécanisme que "Les atouts") :
// état 1 = un seul investisseur (pictogramme seul, pas encore dans une
// case) ET la SCPI ; état 2 = la flèche investisseur<->SCPI apparaît,
// portée par le pictogramme + libellé "Souscription de part" — état
// PRÉALABLE et transitoire, pas cumulatif comme le reste (voir
// showSouscriptionLabel), l'investisseur n'est toujours pas dans une
// case ; état 3 = l'investisseur rejoint le cercle des associés
// (plusieurs silhouettes réparties en cercle) qui remplace
// définitivement le pictogramme seul, le titre "Associé" apparaît, ET
// ce même pictogramme + libellé "Souscription de part" cèdent la place
// à "Copropriétaire" sur la même flèche (déjà affichée, elle ne rejoue
// pas son entrée) — les DEUX EN MÊME TEMPS (un seul clic, pas deux
// états séparés comme dans une version antérieure) : rejoindre le
// cercle des associés ET devenir copropriétaire sont la même bascule,
// pas deux moments distincts ; état 4 = + la flèche "distribution de
// revenus" ; état 5 = + la société de gestion (et sa flèche "gestion
// clé en main") ; état 6 = + l'AMF (et ses deux liaisons pointillées).
// Chaque flux n'apparaît qu'entre deux cases déjà affichées — jamais
// une flèche vers une case encore invisible.
// Géométrie reprise telle quelle du handoff (px à 1280 de large,
// convertis en cqw — voir chapitre.css en tête de fichier), pas
// réinventée, sauf la hauteur des cases (voir BOX_TOP_SHIFT_CQW) pour
// loger les pictogrammes au-dessus de chaque flèche.

// Pictogrammes fournis tels quels par le client (Claude Design,
// assets/icons/{bureau,commerce,hotel,sante}.svg) — viewBox, paths/
// rects/lines et stroke-width repris EXACTEMENT du fichier source, rien
// redessiné ni réinterprété. Chaque icône garde son propre viewBox (pas
// la grille 24×24 partagée de _chapitre.js/ICONS, à laquelle ces tracés
// ne sont pas destinés) ; seule la couleur d'origine (#33312c, figée
// dans les fichiers exportés) est remplacée par la variable d'encre du
// thème, pour suivre --chap-ink-rgb comme le reste du deck (encre sur
// papier, papier sur encre) plutôt que de rester figée si ce gabarit
// est un jour réutilisé sur fond encre.
const ACTIF_ICONS_RAW = {
  bureaux: {
    viewBox: "6.5 12.5 63 57",
    strokeWidth: 2.08,
    markup: `
      <rect x="8" y="34" width="16" height="34"></rect>
      <rect x="26" y="14" width="22" height="54"></rect>
      <rect x="50" y="26" width="18" height="42"></rect>
      <line x1="12" y1="42" x2="16" y2="42"></line><line x1="12" y1="50" x2="16" y2="50"></line><line x1="12" y1="58" x2="16" y2="58"></line>
      <line x1="31" y1="22" x2="35" y2="22"></line><line x1="39" y1="22" x2="43" y2="22"></line>
      <line x1="31" y1="30" x2="35" y2="30"></line><line x1="39" y1="30" x2="43" y2="30"></line>
      <line x1="31" y1="38" x2="35" y2="38"></line><line x1="39" y1="38" x2="43" y2="38"></line>
      <line x1="31" y1="46" x2="35" y2="46"></line><line x1="39" y1="46" x2="43" y2="46"></line>
      <line x1="54" y1="33" x2="58" y2="33"></line><line x1="62" y1="33" x2="64" y2="33"></line>
      <line x1="54" y1="41" x2="58" y2="41"></line><line x1="62" y1="41" x2="64" y2="41"></line>
      <line x1="54" y1="49" x2="58" y2="49"></line><line x1="62" y1="49" x2="64" y2="49"></line>
    `,
  },
  commerces: {
    viewBox: "10.5 8.5 51 59",
    strokeWidth: 2.15,
    markup: `
      <path d="M12 24 L16 10 H56 L60 24 Z"></path>
      <line x1="12" y1="24" x2="60" y2="24"></line>
      <line x1="20" y1="24" x2="18" y2="18"></line><line x1="28" y1="24" x2="27" y2="16"></line><line x1="36" y1="24" x2="36" y2="16"></line>
      <line x1="44" y1="24" x2="45" y2="16"></line><line x1="52" y1="24" x2="54" y2="18"></line>
      <rect x="16" y="24" width="40" height="42"></rect>
      <rect x="30" y="46" width="12" height="20"></rect>
      <rect x="20" y="32" width="9" height="9"></rect>
      <rect x="43" y="32" width="9" height="9"></rect>
    `,
  },
  hotellerie: {
    viewBox: "12.5 4.5 51 81",
    strokeWidth: 3,
    markup: `
      <rect x="22" y="6" width="32" height="12"></rect>
      <text x="38" y="15" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="7" font-weight="700" fill="rgb(var(--chap-ink-rgb))" stroke="none">HOTEL</text>
      <rect x="14" y="18" width="48" height="66"></rect>
      <rect x="21" y="28" width="8" height="11"></rect><rect x="34" y="28" width="8" height="11"></rect><rect x="47" y="28" width="8" height="11"></rect>
      <rect x="21" y="46" width="8" height="11"></rect><rect x="34" y="46" width="8" height="11"></rect><rect x="47" y="46" width="8" height="11"></rect>
      <rect x="21" y="64" width="8" height="11"></rect><rect x="34" y="64" width="8" height="11"></rect><rect x="47" y="64" width="8" height="11"></rect>
    `,
  },
  sante: {
    viewBox: "2.5 10.5 71 59",
    strokeWidth: 2.3,
    markup: `
      <rect x="22" y="12" width="32" height="56"></rect>
      <path d="M34 18 H42 V24 H48 V32 H42 V38 H34 V32 H28 V24 H34 Z"></path>
      <rect x="27" y="44" width="8" height="9"></rect>
      <rect x="41" y="44" width="8" height="9"></rect>
      <rect x="32" y="58" width="12" height="10"></rect>
      <rect x="4" y="26" width="18" height="42"></rect>
      <rect x="54" y="26" width="18" height="42"></rect>
      <rect x="10" y="33" width="6" height="8"></rect><rect x="10" y="45" width="6" height="8"></rect><rect x="10" y="57" width="6" height="8"></rect>
      <rect x="60" y="33" width="6" height="8"></rect><rect x="60" y="45" width="6" height="8"></rect><rect x="60" y="57" width="6" height="8"></rect>
    `,
  },
};

function actifIconSvg(key) {
  const icon = ACTIF_ICONS_RAW[key];
  if (!icon) return "";
  return `<svg class="chap-icon" viewBox="${icon.viewBox}" fill="none" stroke="rgb(var(--chap-ink-rgb))" stroke-width="${icon.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${icon.markup}</svg>`;
}

// pngIcon (fourni tel quel par le client, assets/icons/*.png — même
// registre que les pictogrammes de flèche, voir arrowAnnotationHtml)
// remplace icon (SVG trait fin de _chapitre.js) quand la case porte son
// propre logo plutôt qu'une icône de repère à côté du titre : le logo
// se place alors AU-DESSUS du titre (tête empilée verticalement,
// .scpi-mecanisme__box-head--stacked) au lieu d'à sa gauche.
function boxHtml({ left, top, width, height, cls, icon, pngIcon, pngHeight, titre, texte, extra, entering }) {
  const boxCls = "scpi-mecanisme__box" + (cls ? " " + cls : "") + (entering ? " is-entering" : "");
  const headCls = "scpi-mecanisme__box-head" + (pngIcon ? " scpi-mecanisme__box-head--stacked" : "");
  const headIcon = pngIcon
    ? `<img class="scpi-mecanisme__box-png" src="assets/icons/${encodeURIComponent(pngIcon)}" alt="" style="height:${pngHeight}cqw" />`
    : icon
    ? iconSvg(icon, "rgba(var(--chap-ink-rgb),.65)")
    : "";
  return `
    <div class="${boxCls}"${entering ? " data-reveal" : ""} style="left:${left}cqw;top:${top}cqw;width:${width}cqw;height:${height}cqw">
      <span class="${headCls}">
        ${headIcon}
        <span class="scpi-mecanisme__box-titre">${escapeHtml(titre)}</span>
      </span>
      ${texte ? `<p class="scpi-mecanisme__box-texte">${escapeHtml(texte)}</p>` : ""}
      ${extra || ""}
    </div>
  `;
}

function flowLabelHtml(left, top, width, texte, accent, entering) {
  const cls = "scpi-mecanisme__flow" + (accent ? ` scpi-mecanisme__flow--${accent}` : "") + (entering ? " is-entering" : "");
  return `<div class="${cls}"${entering ? " data-reveal" : ""} style="left:${left}cqw;top:${top}cqw;width:${width}cqw">${escapeHtml(texte)}</div>`;
}

function lineGroupHtml(entering, markup) {
  const cls = entering ? " is-entering" : "";
  return `<g class="scpi-mecanisme__lines-group${cls}"${entering ? " data-reveal" : ""}>${markup}</g>`;
}

// Géométrie des trois cases du socle (investisseur / SCPI / société de
// gestion) — nommée plutôt que saisie en dur à chaque appel de
// boxHtml(), pour que les flèches (plus bas) se calent dessus sans se
// désynchroniser si une case bouge. cqw ⇔ px du viewBox (0-1156, voir
// le <svg> du render) : 1cqw = 12.8px, même échelle que le reste du
// fichier.
const CQW_PX = 12.8;
const INVESTISSEUR_LEFT = 0;
const INVESTISSEUR_WIDTH = 21.25;
const SCPI_LEFT = 36.875;
const SCPI_WIDTH = 16.5625;
const GESTION_LEFT = 69.0625;
const STAGE_CENTER = 45.15625; // milieu de la scène (90.3125cqw de large) — axe de la case SCPI et de la case AMF
// Logo client (assets/icons/société de gestion.png) au-dessus du titre
// de cette case — plus grand que les pictogrammes 1.875cqw habituels du
// box-head, il porte seul l'identification de la case (voir boxHtml).
const GESTION_LOGO_HEIGHT_CQW = 4;
// Mesurée sur le titre réellement rendu ("Société de gestion", ~14,3cqw
// à 1.71875cqw de police + 3,125cqw de padding gauche/droite hérité de
// .scpi-mecanisme__box, voir boxHtml) plutôt que recopiée de la largeur
// de l'ancienne case "L'investisseur" (21,25cqw, bien trop large pour ce
// contenu) : ne laisse plus qu'une légère respiration de chaque côté du
// titre, au lieu du grand vide gauche/droite précédent. GESTION_LEFT ne
// bouge pas (la flèche s'y raccroche par son bord gauche, indépendant de
// la largeur de la case).
const GESTION_WIDTH_CQW = 18.5;

// Cases relevées de BOX_TOP_SHIFT_CQW par rapport au handoff d'origine
// (top 13.125cqw / hauteur 12.1875cqw pour investisseur et gestion) :
// libère de la place au-dessus des flèches investisseur<->SCPI et
// SCPI<->gestion pour un pictogramme par flèche (voir plus bas) sans
// bouger le bas des cases (top diminue, hauteur augmente d'autant :
// top+hauteur, donc le bas, ne change pas).
const BOX_TOP_SHIFT_CQW = 3.5;
// Abaisse les 3 cases du socle (associé/cercle, SCPI, société de
// gestion) — et, avec elles, les flèches et pictogrammes de flèche, qui
// se règlent tous sur BOX_TOP_CQW ou sur les constantes *_ARROW_Y_PX
// (décalées d'autant plus bas via ARROW_ROW_LOWER_CQW * CQW_PX, voir
// plus bas) — pour dégager plus d'espace entre elles et la case AMF
// au-dessus (qui ne bouge pas, top:0).
const ARROW_ROW_LOWER_CQW = 3;
const BOX_TOP_CQW = 13.125 - BOX_TOP_SHIFT_CQW + ARROW_ROW_LOWER_CQW;
const CENTER_BOX_HEIGHT_CQW = 12.1875 + BOX_TOP_SHIFT_CQW;
// Ajustée au contenu (titre + registre d'icônes, voir .scpi-mecanisme__
// box--vehicule en CSS, justify-content:center sans padding vertical) —
// pas héritée du handoff (16.25cqw + BOX_TOP_SHIFT_CQW) qui laissait un
// grand vide au-dessus du titre et sous les icônes, la case n'ayant
// jamais eu besoin de cette hauteur. Ne touche pas à l'écart interne
// titre<->icônes (gap de .scpi-mecanisme__box + padding-top de .scpi-
// mecanisme__actifs), seulement au surplus au-dessus/en dessous du bloc.
const SCPI_HEIGHT_CQW = 13.75;
const BOX_TOP_PX = BOX_TOP_CQW * CQW_PX;

// Un pictogramme + libellé par flèche (voir arrowAnnotationHtml) :
// même largeur/hauteur d'icône pour les quatre flèches du schéma,
// centrés sur le MILIEU RÉEL de la flèche qu'ils annotent (milieu du
// vide entre les deux cases — ARROW_GAP_PX est symétrique aux deux
// extrémités, il s'annule dans ce calcul), pas sur les left hérités du
// handoff (ex ancien flowLabelHtml(21.25, ...) pour "Copropriétaire" :
// ~30px d'écart avec le vrai milieu de la flèche, imperceptible sur du
// texte seul mais très visible avec un pictogramme). Même écart
// pictogramme<->flèche que flèche<->texte (GAP_CQW), des deux côtés de
// chaque flèche.
const FLOW_LABEL_WIDTH_CQW = 11.015625;
const ICON_HEIGHT_CQW = 3.125;
// "Distribution de revenus" seul à sa propre taille (voir
// distributionHtml) : plus grand que les trois autres pictogrammes de
// flèche, pour égaler visuellement copropriétaire.png (dont le cadrage
// interne le remplit davantage que revenus.png à hauteur de case
// identique). Rendu en masque CSS (pas <img>) pour le teinter en doré
// — voir arrowAnnotationHtml — donc pas de largeur intrinsèque
// auto-déduite : DISTRIBUTION_ICON_ASPECT (largeur/hauteur du PNG
// source, 160×196) la fournit explicitement.
const DISTRIBUTION_ICON_HEIGHT_CQW = 3.35;
const DISTRIBUTION_ICON_ASPECT = 160 / 196;
const GAP_CQW = 1.171875;
const INVEST_SCPI_ARROW_CENTER_CQW = (INVESTISSEUR_LEFT + INVESTISSEUR_WIDTH + SCPI_LEFT) / 2;
const GESTION_ARROW_CENTER_CQW = (SCPI_LEFT + SCPI_WIDTH + GESTION_LEFT) / 2;

// Ordonnées des trois flèches horizontales (viewBox 0-1156×392) —
// espacées pour loger un pictogramme au-dessus ET un texte en dessous
// de CHACUNE sans chevaucher la flèche voisine (investisseur<->SCPI et
// distribution partagent le même couloir x, l'une au-dessus de
// l'autre) : voir arrowAnnotationHtml plus bas pour le calcul des
// positions à partir de ces trois valeurs.
// Relevée (était 185) pour laisser la place au pictogramme "Distribution
// de revenus" agrandi (voir DISTRIBUTION_ICON_HEIGHT_CQW), qui empiète
// depuis le bas dans le même couloir x que le texte "Copropriétaire" /
// "Souscription de part" sous cette flèche — sans ce relèvement les deux
// se chevauchaient déjà de justesse à l'ancienne taille du pictogramme.
// + ARROW_ROW_LOWER_CQW converti en px : les trois flèches suivent
// l'abaissement des cases (BOX_TOP_CQW), sinon elles resteraient à leur
// ancienne hauteur pendant que les cases (et les pictogrammes qui s'y
// centrent, voir investisseurSoloHtml) descendent sous elles.
const ARROW_ROW_LOWER_PX = ARROW_ROW_LOWER_CQW * CQW_PX;
const INVEST_SCPI_ARROW_Y_PX = 155 + ARROW_ROW_LOWER_PX;
const DISTRIBUTION_ARROW_Y_PX = 275 + ARROW_ROW_LOWER_PX;
const GESTION_ARROW_Y_PX = 246 + ARROW_ROW_LOWER_PX;

// Pictogramme + libellé centrés sur une flèche horizontale : pictogramme
// à GAP_CQW au-dessus, texte à GAP_CQW en dessous, tous deux centrés sur
// centerXCqw (voir INVEST_SCPI_ARROW_CENTER_CQW / GESTION_ARROW_CENTER_CQW) —
// une seule fonction pour les quatre flèches du schéma plutôt que des
// positions saisies séparément à chaque appel (bug de désynchronisation
// déjà rencontré ailleurs dans ce fichier).
// maskColor + iconAspect (optionnels) : rendent le pictogramme via un
// masque CSS teinté plutôt qu'un <img> brut — seul moyen de recolorer un
// PNG client en aplat (voir "revenus.png"/DISTRIBUTION_ICON_HEIGHT_CQW)
// sans en refaire l'asset. Un masque n'a pas de largeur intrinsèque
// auto-déduite comme <img> (height:auto), d'où iconAspect (largeur/
// hauteur du PNG source) fourni explicitement par l'appelant.
function arrowAnnotationHtml({ png, arrowYPx, centerXCqw, text, textColorClass, entering, iconHeightCqw = ICON_HEIGHT_CQW, maskColor, iconAspect = 1 }) {
  const arrowYCqw = arrowYPx / CQW_PX;
  const leftCqw = centerXCqw - FLOW_LABEL_WIDTH_CQW / 2;
  const iconTopCqw = arrowYCqw - GAP_CQW - iconHeightCqw;
  const textTopCqw = arrowYCqw + GAP_CQW;
  const src = png ? `assets/icons/${encodeURIComponent(png)}` : "";
  const iconInner = maskColor
    ? `<span class="scpi-mecanisme__flow-icon-mask" style="width:${iconHeightCqw * iconAspect}cqw;height:${iconHeightCqw}cqw;background-color:${maskColor};-webkit-mask-image:url('${src}');mask-image:url('${src}')"></span>`
    : `<img src="${src}" alt="" style="height:${iconHeightCqw}cqw" />`;
  const iconHtml = png
    ? `<div class="scpi-mecanisme__flow-icon${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""} style="left:${leftCqw}cqw;width:${FLOW_LABEL_WIDTH_CQW}cqw;top:${iconTopCqw}cqw">${iconInner}</div>`
    : "";
  const textHtml = flowLabelHtml(leftCqw, textTopCqw, FLOW_LABEL_WIDTH_CQW, text, textColorClass, entering);
  return iconHtml + textHtml;
}

// Cercle des associés (état 3+) : remplace définitivement le
// pictogramme "personne" seul (état 1-2, voir investisseurSoloHtml) —
// plusieurs silhouettes réparties à intervalles réguliers sur un
// anneau (calculées, pas positionnées à la main une à une), dans un
// cadre circulaire plutôt que la case rectangulaire des autres
// intervenants : elle représente un collectif d'associés, pas un
// intervenant unique. Même position/largeur que l'ancienne case
// "L'investisseur" (les flèches s'y raccrochent sans changement).
const CIRCLE_D_CQW = 12.5;
const CIRCLE_PERSON_SIZE_CQW = 1.6;
const CIRCLE_PERSON_COUNT = 8;
const CIRCLE_PERSON_RING_RADIUS_CQW = CIRCLE_D_CQW / 2 - CIRCLE_PERSON_SIZE_CQW / 2 - 0.3;
// Le pictogramme de l'investisseur (celui qui était seul aux états 1-2)
// reste visible au centre de l'anneau, plus grand que les silhouettes
// des autres associés réparties sur le cercle : il ne devient pas un
// point du cercle parmi d'autres, il EST le centre, pour montrer qu'il
// en fait désormais partie sans se fondre dans le collectif. Même
// taille que le pictogramme seul des états 1-2 (SOLO_ICON_SIZE_CQW) —
// c'est le même personnage, il ne rétrécit pas en devenant associé.
const SOLO_ICON_SIZE_CQW = 5;
const CENTER_PERSON_SIZE_CQW = SOLO_ICON_SIZE_CQW;

// États 1-2 : le pictogramme seul n'est plus centré sur la hauteur de
// l'ancienne case "L'investisseur" (BOX_TOP_CQW/CENTER_BOX_HEIGHT_CQW,
// pensée pour une case, pas pour lui) mais sur l'ordonnée réelle de la
// flèche investisseur<->SCPI (INVEST_SCPI_ARROW_Y_PX) qu'il porte à
// l'état 2 — la flèche doit traverser le pictogramme en son centre, pas
// plus bas.
function investisseurSoloHtml(entering) {
  const cls = "scpi-mecanisme__solo" + (entering ? " is-entering" : "");
  const topCqw = INVEST_SCPI_ARROW_Y_PX / CQW_PX - SOLO_ICON_SIZE_CQW / 2;
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""} style="left:${INVESTISSEUR_LEFT}cqw;top:${topCqw}cqw;width:${INVESTISSEUR_WIDTH}cqw;height:${SOLO_ICON_SIZE_CQW}cqw">
      ${iconSvg("personne", "rgb(var(--chap-ink-rgb))")}
    </div>
  `;
}

function associeCercleHtml(entering) {
  const ringPersons = Array.from({ length: CIRCLE_PERSON_COUNT }, (_, i) => {
    const angle = (2 * Math.PI * i) / CIRCLE_PERSON_COUNT - Math.PI / 2;
    const dx = CIRCLE_PERSON_RING_RADIUS_CQW * Math.cos(angle);
    const dy = CIRCLE_PERSON_RING_RADIUS_CQW * Math.sin(angle);
    return `<span class="scpi-mecanisme__cercle-personne" style="transform:translate(calc(-50% + ${dx}cqw), calc(-50% + ${dy}cqw))">${iconSvg(
      "personne",
      "rgba(var(--chap-ink-rgb),.65)"
    )}</span>`;
  }).join("");
  // Le sien (voir CENTER_PERSON_SIZE_CQW) : dx/dy nuls, il n'est pas sur
  // l'anneau comme les autres mais bien au centre du cercle qu'ils
  // forment. Encre pleine (pas l'opacité .65 des autres associés) :
  // c'est LUI qu'on suit depuis le début du schéma, il doit rester le
  // point le plus lisible du cercle.
  const centerPerson = `<span class="scpi-mecanisme__cercle-personne scpi-mecanisme__cercle-personne--centre" style="transform:translate(-50%, -50%)">${iconSvg(
    "personne",
    "rgb(var(--chap-ink-rgb))"
  )}</span>`;
  const cls = "scpi-mecanisme__cercle" + (entering ? " is-entering" : "");
  return `
    <div class="${cls}"${entering ? " data-reveal" : ""} style="left:${INVESTISSEUR_LEFT}cqw;top:${BOX_TOP_CQW}cqw;width:${INVESTISSEUR_WIDTH}cqw;height:${CENTER_BOX_HEIGHT_CQW}cqw">
      <span class="scpi-mecanisme__cercle-ring" style="width:${CIRCLE_D_CQW}cqw;height:${CIRCLE_D_CQW}cqw">${ringPersons}${centerPerson}</span>
      <span class="scpi-mecanisme__cercle-titre" style="width:${CIRCLE_D_CQW}cqw">Associé</span>
    </div>
  `;
}

// Distance standard entre l'extrémité d'une flèche et le bord de la
// case qu'elle touche — mesurée à l'origine sur l'écart case
// "L'investisseur" <-> flèches (16px), puis appliquée à CHAQUE
// extrémité de CHAQUE flèche (les deux côtés de souscription/
// distribution, les deux côtés de gestion) : aucune flèche n'entre
// dans une case, et l'espacement se lit comme un choix, pas un hasard
// de géométrie.
const ARROW_GAP_PX = 1.25 * CQW_PX;

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 5);
  const animate = !!opts.animate;

  // Un pictogramme par classe d'actifs plutôt qu'une puce de texte —
  // clé dérivée du mot lui-même (accents/casse neutralisés), pas une
  // liste positionnelle : si demain "actifs" change dans deck.json, un
  // mot non couvert perd juste son icône plutôt que de désynchroniser
  // tout le rang.
  const actifsHtml = (slide.actifs || [])
    .map((a) => {
      const key = a
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return `
        <div class="scpi-mecanisme__actif">
          ${actifIconSvg(key)}
        </div>
      `;
    })
    .join("");

  // État 2 (index 1) : la flèche investisseur<->SCPI apparaît, portée
  // par le pictogramme "Souscription de part" et son libellé — un état
  // PRÉALABLE et transitoire (showSouscriptionLabel n'est vrai qu'à cet
  // état précis, pas cumulatif comme le reste du schéma) : à l'état 3,
  // ce même pictogramme et ce même libellé cèdent la place au libellé
  // "Copropriétaire" d'origine, sur la même flèche (déjà affichée, elle
  // ne rejoue pas son entrée) — EN MÊME TEMPS que l'investisseur
  // (pictogramme seul jusque-là, jamais dans une case) rejoint le
  // cercle des associés, qui remplace définitivement ce pictogramme :
  // showAssocie et showCopro partagent désormais le même seuil (un seul
  // clic, pas deux états séparés).
  const showInvestScpiArrow = stateIndex >= 1;
  const investScpiArrowEntering = animate && stateIndex === 1;
  const showSouscriptionLabel = stateIndex === 1;
  const showAssocie = stateIndex >= 2;
  const showCopro = stateIndex >= 2;
  const showDistribution = stateIndex >= 3;
  const showGestion = stateIndex >= 4;
  const showAmf = stateIndex >= 5;

  const socleEntering = animate && stateIndex === 0;
  const souscriptionEntering = animate && stateIndex === 1;
  const associeEntering = animate && stateIndex === 2;
  const coproEntering = animate && stateIndex === 2;
  const distributionEntering = animate && stateIndex === 3;
  const gestionEntering = animate && stateIndex === 4;
  const amfEntering = animate && stateIndex === 5;

  const investisseurSlot = showAssocie ? associeCercleHtml(associeEntering) : investisseurSoloHtml(socleEntering);

  const scpiBox = boxHtml({
    left: SCPI_LEFT,
    top: BOX_TOP_CQW,
    width: SCPI_WIDTH,
    height: SCPI_HEIGHT_CQW,
    cls: "scpi-mecanisme__box--vehicule",
    titre: "SCPI",
    extra: `<div class="scpi-mecanisme__actifs">${actifsHtml}</div>`,
    entering: socleEntering,
  });

  // Même hauteur que la case SCPI (SCPI_HEIGHT_CQW), pas
  // CENTER_BOX_HEIGHT_CQW (celle de l'ancienne case "L'investisseur",
  // bien plus haute que son propre contenu logo+titre) : les deux cases
  // "conteneur" du schéma restent visuellement alignées, sans le grand
  // vide qu'une hauteur héritée de l'investisseur y aurait laissé.
  const gestionBox = showGestion
    ? boxHtml({
        left: GESTION_LEFT,
        top: BOX_TOP_CQW,
        width: GESTION_WIDTH_CQW,
        height: SCPI_HEIGHT_CQW,
        cls: "scpi-mecanisme__box--center",
        pngIcon: "société de gestion.png",
        pngHeight: GESTION_LOGO_HEIGHT_CQW,
        titre: "Société de gestion",
        entering: gestionEntering,
      })
    : "";

  // Largeur réduite au strict nécessaire pour "Autorité des marchés
  // financiers" (plus long que "AMF" + pictogramme) — l'ancienne
  // largeur (23,4375cqw) laissait ~21px de vide après le texte. Centrée
  // sur le même axe que la case SCPI (45,15625cqw, milieu de la scène),
  // pas sur une valeur saisie à part qui s'en désynchroniserait si la
  // scène changeait de largeur.
  const AMF_WIDTH = 18.75;
  const amfBox = showAmf
    ? boxHtml({
        left: STAGE_CENTER - AMF_WIDTH / 2,
        top: 0,
        width: AMF_WIDTH,
        height: 5.625,
        cls: "scpi-mecanisme__box--amf",
        icon: "bouclier",
        titre: "AMF",
        texte: "Autorité des marchés financiers",
        entering: amfEntering,
      })
    : "";

  // Pictogramme client (assets/icons/agrément.png, déjà détouré — pas de
  // retrait de fond à faire dessus, contrairement à société de
  // gestion.png) accolé au repère, pas dans la case AMF elle-même : il
  // annote la LIAISON (agrément + contrôle), pas l'autorité.
  const amfNote = showAmf
    ? `<span class="scpi-mecanisme__amf-note${amfEntering ? " is-entering" : ""}"${amfEntering ? " data-reveal" : ""} style="left:46.25cqw;top:6.5625cqw"><img class="scpi-mecanisme__amf-note-icon" src="assets/icons/${encodeURIComponent(
        "agrément.png"
      )}" alt="" />Agrément et contrôle</span>`
    : "";

  // Pictogrammes fournis tels quels par le client (assets/icons/*.png,
  // PNG pleins) — repris sans retouche à part le retrait du fond blanc
  // (fait une fois en amont sur chaque fichier), malgré l'écart avec le
  // reste du registre trait fin de ce fichier (voir CLAUDE.md sur le
  // remplissage plein) : demande explicite du client.
  const souscriptionHtml = showSouscriptionLabel
    ? arrowAnnotationHtml({
        png: "souscription de part.png",
        arrowYPx: INVEST_SCPI_ARROW_Y_PX,
        centerXCqw: INVEST_SCPI_ARROW_CENTER_CQW,
        text: "Souscription de part",
        textColorClass: "noir",
        entering: souscriptionEntering,
      })
    : "";
  const coproHtml = showCopro
    ? arrowAnnotationHtml({
        png: "copropriétaire.png",
        arrowYPx: INVEST_SCPI_ARROW_Y_PX,
        centerXCqw: INVEST_SCPI_ARROW_CENTER_CQW,
        text: "Copropriétaire",
        textColorClass: "noir",
        entering: coproEntering,
      })
    : "";
  const distributionHtml = showDistribution
    ? arrowAnnotationHtml({
        png: "revenus.png",
        arrowYPx: DISTRIBUTION_ARROW_Y_PX,
        centerXCqw: INVEST_SCPI_ARROW_CENTER_CQW,
        text: "Distribution de revenus",
        textColorClass: "or",
        entering: distributionEntering,
        iconHeightCqw: DISTRIBUTION_ICON_HEIGHT_CQW,
        iconAspect: DISTRIBUTION_ICON_ASPECT,
        maskColor: "var(--or)",
      })
    : "";
  const gestionHtml = showGestion
    ? arrowAnnotationHtml({
        png: "clé en main.png",
        arrowYPx: GESTION_ARROW_Y_PX,
        centerXCqw: GESTION_ARROW_CENTER_CQW,
        text: "Gestion clé en main",
        textColorClass: "noir",
        entering: gestionEntering,
      })
    : "";

  // Chaque extrémité de flèche s'arrête à ARROW_GAP_PX du bord de la
  // case qu'elle touche — jamais à l'intérieur, jamais flottant à une
  // distance différente d'une flèche à l'autre (voir ARROW_GAP_PX plus
  // haut).
  const investisseurRightPx = (INVESTISSEUR_LEFT + INVESTISSEUR_WIDTH) * CQW_PX;
  const scpiLeftPx = SCPI_LEFT * CQW_PX;
  const scpiRightPx = (SCPI_LEFT + SCPI_WIDTH) * CQW_PX;
  const gestionLeftPx = GESTION_LEFT * CQW_PX;

  const investScpiArrow = showInvestScpiArrow
    ? lineGroupHtml(
        investScpiArrowEntering,
        `<line x1="${investisseurRightPx + ARROW_GAP_PX}" y1="${INVEST_SCPI_ARROW_Y_PX}" x2="${scpiLeftPx - ARROW_GAP_PX}" y2="${INVEST_SCPI_ARROW_Y_PX}" stroke="rgb(var(--chap-ink-rgb))" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>`
      )
    : "";

  const distributionArrow = showDistribution
    ? lineGroupHtml(
        distributionEntering,
        `<line x1="${scpiLeftPx - ARROW_GAP_PX}" y1="${DISTRIBUTION_ARROW_Y_PX}" x2="${investisseurRightPx + ARROW_GAP_PX}" y2="${DISTRIBUTION_ARROW_Y_PX}" stroke="var(--or)" stroke-width="1.2" marker-end="url(#scpi-ar-g)"/>`
      )
    : "";

  const gestionArrow = showGestion
    ? lineGroupHtml(
        gestionEntering,
        `<line x1="${gestionLeftPx - ARROW_GAP_PX}" y1="${GESTION_ARROW_Y_PX}" x2="${scpiRightPx + ARROW_GAP_PX}" y2="${GESTION_ARROW_Y_PX}" stroke="rgb(var(--chap-ink-rgb))" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>`
      )
    : "";

  const amfLines = showAmf
    ? lineGroupHtml(
        amfEntering,
        `<path d="M578,72 V${BOX_TOP_PX}" fill="none" stroke="rgb(var(--chap-ink-rgb))" stroke-width="1" stroke-dasharray="2 5"/>
         <path d="M578,112 H1020 V${BOX_TOP_PX}" fill="none" stroke="rgb(var(--chap-ink-rgb))" stroke-width="1" stroke-dasharray="2 5"/>`
      )
    : "";

  return `
    <div class="scpi-mecanisme">
      ${renderChapRail(slide)}

      <div class="scpi-mecanisme__intro">
        <h1 class="chap-title scpi-mecanisme__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="scpi-mecanisme__stage">
        <svg class="scpi-mecanisme__lines" viewBox="0 0 1156 392" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="scpi-ar-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="rgb(var(--chap-ink-rgb))"/></marker>
            <marker id="scpi-ar-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="var(--or)"/></marker>
          </defs>
          ${amfLines}
          ${investScpiArrow}
          ${distributionArrow}
          ${gestionArrow}
        </svg>

        ${amfBox}
        ${amfNote}

        ${investisseurSlot}
        ${scpiBox}
        ${gestionBox}

        ${souscriptionHtml}
        ${coproHtml}
        ${distributionHtml}
        ${gestionHtml}
      </div>
    </div>
  `;
}
