#!/bin/bash
# Raccourci pour ouvrir Claude Code directement dans le projet, en vue
# de modifier le moteur général (js/, css/, index.html...) plutôt que
# le contenu d'un client précis. Pas de prompt pré-rempli : à utiliser
# quand tu sais déjà ce que tu veux changer et que tu vas le décrire
# toi-même une fois Claude Code ouvert.
#
# Se positionne toujours sur son propre emplacement (comme les autres
# scripts) pour fonctionner via un alias Finder sur le Bureau — jamais
# une copie, sinon il ne retrouve pas le projet.
#
# IMPORTANT sur le "exec" final : une fois qu'un script .command se
# termine, la fenêtre Terminal ne redevient PAS un prompt utilisable —
# le shell qui l'exécutait s'arrête. `exec claude` REMPLACE ce shell
# par Claude Code lui-même : la fenêtre reste donc vivante tant que
# Claude Code tourne, exactement comme si tu avais tapé `claude` à la
# main. Ne jamais retirer ce `exec`.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

if ! command -v claude >/dev/null 2>&1; then
  echo "Commande 'claude' introuvable dans le PATH."
  echo "Vérifie l'installation de Claude Code, puis réessaie."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

exec claude
