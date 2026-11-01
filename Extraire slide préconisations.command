#!/bin/bash
# Raccourci d'export PDF : demande le nom du client puis la slide de
# clôture à extraire (avant-dernière = cloture-reflexion, questions
# ouvertes ; dernière = cloture-detail, montants finalisés — voir SKILL
# "recap-slide-pdf") en PDF vectoriel, et le range dans son dossier
# client (PRO/METIER/Clients/<Nom Prénom>/) si on le retrouve, sinon à
# côté de ce script. Se positionne toujours sur son propre emplacement
# (comme les autres scripts) pour fonctionner via un alias Finder sur
# le Bureau — jamais une copie, sinon il ne retrouve pas le projet.
#
# Purement mécanique (pas de Claude Code ici) : export_pdf.py fait tout
# le travail de rendu, ce script ne fait qu'orchestrer l'environnement
# et ranger le résultat.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

source scripts/pick_client.sh
CLIENT="$(pick_client "Nom du client")"
if [ -z "$CLIENT" ]; then
  echo "Nom de client requis."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

CLIENT_FILE="data/clients/${CLIENT}.json"
if [ ! -f "$CLIENT_FILE" ]; then
  echo "Aucun fichier $CLIENT_FILE trouvé."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

echo ""
echo "Quelle slide extraire ?"
echo "  1) Avant-dernière — questions ouvertes (cloture-reflexion)"
echo "  2) Dernière — montants finalisés (cloture-detail)"
read -r -p "Choix [1/2] (défaut : 1) : " SLIDE_CHOICE
case "$SLIDE_CHOICE" in
  2)
    SLIDE_REF="derniere"
    SUFFIXE=" (chiffré)"
    ;;
  *)
    SLIDE_REF="avant-derniere"
    SUFFIXE=""
    ;;
esac

# Playwright vit dans un .venv local (gitignored) — recréé si absent ou
# cassé (chemin absolu périmé après un déplacement/sync iCloud).
if [ ! -d .venv ] || ! .venv/bin/pip show playwright >/dev/null 2>&1; then
  echo "Préparation de l'environnement d'export (première fois ou après déplacement du dossier)..."
  rm -rf .venv
  python3 -m venv .venv
  .venv/bin/pip install -q playwright
  .venv/bin/python3 -m playwright install chromium
fi

TMP_PDF="/tmp/prezr2_cloture_${CLIENT}_$$.pdf"

echo ""
echo "Export en cours..."
if ! .venv/bin/python3 scripts/export_pdf.py "$CLIENT" "$SLIDE_REF" --out "$TMP_PDF"; then
  echo "Échec de l'export."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

# Cherche le dossier client (PRO/METIER/Clients/<Nom Prénom>/) par
# correspondance de mots avec meta.client du JSON (ex. "Prénom Nom" ->
# dossier "Nom Prénom") — accents et casse ignorés, ordre des mots
# indifférent. Si rien ne correspond, le PDF reste à côté de ce script.
CLIENTS_ROOT="$DIR/../Clients"
DEST_DIR="$(python3 - "$CLIENT_FILE" "$CLIENTS_ROOT" <<'PYEOF'
import json, sys, unicodedata
from pathlib import Path

client_file, clients_root = sys.argv[1], Path(sys.argv[2])

def norm_words(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return set(w for w in s.replace("-", " ").split() if w)

try:
    meta_client = json.load(open(client_file)).get("meta", {}).get("client", "")
except Exception:
    meta_client = ""

target = norm_words(meta_client)
if target and clients_root.is_dir():
    for d in clients_root.iterdir():
        if d.is_dir() and norm_words(d.name) == target:
            print(d)
            break
PYEOF
)"

TITRE="Préconisations patrimoniales${SUFFIXE}"
if [ -n "$DEST_DIR" ] && [ -d "$DEST_DIR" ]; then
  FINAL="$DEST_DIR/${TITRE}.pdf"
else
  FINAL="$DIR/${TITRE} - ${CLIENT}.pdf"
  echo "Dossier client introuvable dans PRO/METIER/Clients/ — PDF laissé à côté de ce script."
fi

mv "$TMP_PDF" "$FINAL"
open "$FINAL"

echo ""
echo "PDF créé : $FINAL"
sleep 1
exit 0
