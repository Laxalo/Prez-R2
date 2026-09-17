#!/bin/bash
# Raccourci d'ouverture : demande le nom du client puis délègue à
# "Template slides.command" (même mécanisme, mêmes règles — voir
# son en-tête). Se positionne toujours sur son propre emplacement, comme
# l'autre script, pour fonctionner aussi via un alias Finder sur le
# Bureau.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

source scripts/pick_client.sh
CLIENT="$(pick_client "Nom du client (Entrée seul = _demo)")"
CLIENT="${CLIENT:-_demo}"

exec "./Template slides.command" "$CLIENT"
