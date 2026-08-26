// Utilitaires partagés par toute slide de type "calculator" : des montants
// modifiables en direct (inputs) dont dérivent des totaux/graphiques/badges
// (formules), recalculés à chaque saisie. À utiliser uniquement pour les
// slides où l'on manipule des scénarios/chiffres en RDV — pas pour les
// slides explicatives ou de comparaison qualitative.

export const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function parseAmount(raw) {
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}
