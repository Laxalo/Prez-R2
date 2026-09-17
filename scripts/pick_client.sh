#!/bin/bash
# Fonction commune aux 4 scripts .command qui demandent un nom de
# client (Template slides, Slides R2-3 clients, Prépa R2-3, Extraire
# slide préconisations) : affiche les 9 clients les plus récents (par
# date de modification de data/clients/<nom>.json, le plus récent en
# position 1) pour taper un chiffre plutôt que retaper le nom en
# entier. Un client plus ancien (hors liste) ou un nouveau client se
# tape toujours en toutes lettres — la fonction ne force rien, elle
# se contente de traduire un chiffre 1-9 en nom si la liste en contient
# un à cette position.
#
# À sourcer (jamais exécuter seul) depuis un script déjà positionné sur
# la racine du projet (voir DIR="$(cd "$(dirname "$0")" && pwd)" en
# tête des autres scripts) : ls data/clients/*.json est relatif au
# répertoire courant.
#
# Usage : CLIENT="$(pick_client "Nom du client")"
# L'argument est le libellé affiché devant le prompt de saisie (permet
# à chaque script de préciser son contexte). Retourne (sur stdout,
# capturable) : le nom résolu si l'entrée est un chiffre 1-9 pointant
# sur un client de la liste, sinon l'entrée telle quelle (nom tapé, ou
# chaîne vide si Entrée seul — au script appelant de décider quoi en
# faire, ex. défaut _demo ou erreur "nom requis").
pick_client() {
  local label="${1:-Nom du client}"
  local -a recents=()
  local f name

  while IFS= read -r f; do
    name="$(basename "$f" .json)"
    [ "$name" = "_demo" ] && continue
    recents+=("$name")
    [ "${#recents[@]}" -ge 9 ] && break
  done < <(ls -t data/clients/*.json 2>/dev/null)

  if [ "${#recents[@]}" -gt 0 ]; then
    echo "Clients récents (1 = le plus récent) :" >&2
    local i=1
    for name in "${recents[@]}"; do
      printf "  %d) %s\n" "$i" "$name" >&2
      i=$((i + 1))
    done
    echo "  Client plus ancien ou nouveau client : tape son nom directement." >&2
    echo "" >&2
  fi

  local input
  read -r -p "$label : " input

  if [[ "$input" =~ ^[1-9]$ ]] && [ "$input" -le "${#recents[@]}" ]; then
    local resolved="${recents[$((input - 1))]}"
    echo "→ Client : $resolved" >&2
    echo "$resolved"
  else
    echo "$input"
  fi
}
