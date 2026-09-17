#!/bin/bash
# Raccourci unique de préparation client : demande le nom du client,
# puis si on prépare le R2 (personnaliser l'ensemble des slides,
# nouveau client) ou le R3 (finaliser uniquement les montants de la
# dernière slide, post-RDV). Copie le prompt correspondant dans le
# presse-papiers, puis ouvre Claude Code. Se positionne toujours sur
# son propre emplacement (comme les autres scripts) pour fonctionner
# via un alias Finder sur le Bureau — jamais une copie, sinon il ne
# retrouve pas le projet.
#
# IMPORTANT sur le "exec" final : une fois qu'un script .command se
# termine, la fenêtre Terminal ne redevient PAS un prompt utilisable —
# le shell qui l'exécutait s'arrête (fenêtre fermée ou figée sur
# "process completed" selon les réglages). `exec claude` REMPLACE ce
# shell par Claude Code lui-même : la fenêtre reste donc vivante tant
# que Claude Code tourne, exactement comme si tu avais tapé `claude`
# à la main. Ne jamais retirer ce `exec`.
#
# IMPORTANT sur la construction du prompt : macOS gèle /bin/bash à la
# version 3.2 (licence) — cette vieille version a un bug connu avec un
# heredoc (<<EOF) imbriqué directement dans une substitution de
# commande (VAR=$(cat <<EOF ... EOF)) dès que le texte contient des
# apostrophes/guillemets dans certaines combinaisons. D'où l'écriture
# du prompt dans un fichier temporaire d'abord, relu ensuite dans une
# variable en une étape séparée — ne jamais revenir à la forme imbriquée.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

if ! command -v claude >/dev/null 2>&1; then
  echo "Commande 'claude' introuvable dans le PATH."
  echo "Vérifie l'installation de Claude Code, puis réessaie."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

source scripts/pick_client.sh
CLIENT="$(pick_client "Nom du client")"
if [ -z "$CLIENT" ]; then
  echo "Nom de client requis."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

echo ""
echo "R2 = personnaliser l'ensemble des slides (nouveau client, ou refonte complète)"
echo "R3 = finaliser uniquement les montants de la dernière slide (post-RDV)"
MODE=""
while [ -z "$MODE" ]; do
  read -r -p "R2 ou R3 ? : " INPUT
  case "$INPUT" in
    2|r2|R2) MODE=2 ;;
    3|r3|R3) MODE=3 ;;
    *) echo "Réponds par 2 (ou R2) / 3 (ou R3)." ;;
  esac
done

PROMPT_FILE="/tmp/prezr2_prompt_$$.txt"

if [ "$MODE" = "2" ]; then
  if [ -f "data/clients/${CLIENT}.json" ]; then
    echo ""
    echo "Attention : data/clients/${CLIENT}.json existe déjà — il sera repersonnalisé selon tes réponses."
  fi
  cat > "$PROMPT_FILE" <<PROMPT_EOF
Nouveau client : ${CLIENT}. Interviewe-moi selon la section "Procédure
d'entretien client" de CLAUDE.md, une question à la fois (attends ma
réponse avant de poser la suivante, ne saute aucun bloc). Une fois
toutes les réponses obtenues, crée data/clients/${CLIENT}.json (copie
de data/clients/_demo.json, personnalisée avec mes réponses) —
uniquement ce fichier, ne touche à aucun autre fichier du projet.
Applique les règles impératives de CLAUDE.md sans me les redemander.
Une fois le fichier écrit, lance ./"Template slides.command" ${CLIENT}
pour ouvrir automatiquement la présentation.
PROMPT_EOF
else
  if [ ! -f "data/clients/${CLIENT}.json" ]; then
    echo ""
    echo "Aucun fichier data/clients/${CLIENT}.json trouvé — crée-le d'abord avec R2."
    read -r -p "Appuyez sur Entrée pour fermer..." _
    exit 1
  fi
  cat > "$PROMPT_FILE" <<PROMPT_EOF
Finalisation post-RDV pour ${CLIENT}. Dans data/clients/${CLIENT}.json,
uniquement ce fichier : recopie tel quel le titre, le budget et le
aTerme, ainsi que le nom et les bullets de chaque préconisation, de la
slide cloture-reflexion vers la slide cloture-detail (copie exacte —
sécurité, ils sont normalement déjà identiques).

Puis, pour chaque préconisation de cloture-reflexion, pose-moi une à
une, dans l'ordre, chaque question de son tableau questions[], telle
qu'elle est écrite. J'y réponds avec un montant. Une fois toutes les
questions d'une préconisation répondues, propose-moi la formulation du
champ montant correspondant sur cloture-detail (par exemple "500
€/mois", ou "500 €/mois + 3 000 € en versement initial" s'il y a deux
réponses) avant de l'écrire — je valide ou je corrige.

Ne modifie ni les questions[] de cloture-reflexion, ni aucun autre
fichier du projet. Une fois le fichier mis à jour, lance
./"Template slides.command" ${CLIENT} pour ouvrir automatiquement la
présentation.
PROMPT_EOF
fi

PROMPT="$(cat "$PROMPT_FILE")"
rm -f "$PROMPT_FILE"

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$PROMPT" | pbcopy
  echo ""
  echo "Prompt copié dans le presse-papiers."
  echo "Une fois Claude Code ouvert : Cmd+V puis Entrée."
else
  echo ""
  echo "pbcopy introuvable — copie ce prompt à la main :"
  echo "---"
  echo "$PROMPT"
  echo "---"
fi

sleep 1
if [ "$MODE" = "2" ]; then
  # R2 : personnalisation complète (contenu financier, règles à
  # respecter) — on garde le modèle par défaut, la qualité prime ici.
  exec claude
else
  # R3 : tâche mécanique (poser quelques questions, recopier des
  # champs texte) — Sonnet en effort réduit (Haiku s'est montré trop
  # imprécis sur ces formulations, voir CLAUDE.md).
  exec claude --model sonnet --effort low
fi
