#!/bin/bash
# Lance la présentation : démarre un serveur local et ouvre le poste
# présentateur dans le navigateur par défaut. Le script se positionne
# toujours sur son propre emplacement, calculé au moment de l'exécution
# (double-clic possible sans dépendre du répertoire courant).
#
# Argument optionnel : nom du client (ex. "./Lancer la présentation.command
# dupont" pour data/clients/dupont.json). Sans argument, utilise
# data/clients/_demo.json — le gabarit de référence pour tout nouveau
# client, à ne jamais supprimer ni renommer. Dans les deux cas, le
# fichier choisi est copié vers data/deck.json avant de démarrer le
# serveur, pour que l'appli (qui ne lit que data/deck.json, voir
# js/deck.js) serve toujours le bon client sans rien savoir de ce
# mécanisme.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

CLIENT="${1:-_demo}"
CLIENT_FILE="data/clients/$CLIENT.json"

if [ ! -f "$CLIENT_FILE" ]; then
  echo "Aucun client « $CLIENT » : fichier introuvable ($CLIENT_FILE)."
  echo ""
  echo "Clients disponibles :"
  found=0
  for f in data/clients/*.json; do
    [ -f "$f" ] || continue
    found=1
    name="$(basename "$f" .json)"
    echo "  - $name"
  done
  [ "$found" -eq 0 ] && echo "  (aucun — le dossier data/clients/ est vide)"
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

cp "$CLIENT_FILE" data/deck.json

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 est introuvable sur cette machine."
  echo "Installez-le, ou lancez le serveur local autrement, puis réessayez."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

# Choisit un port libre à partir de 8734 : plusieurs présentations
# (clients différents, ou plusieurs onglets de test) peuvent tourner en
# même temps sur la même machine, chacune avec son propre serveur.
PORT=8734
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

python3 -c "
import http.server, sys
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
http.server.test(HandlerClass=Handler, port=int(sys.argv[1]))
" "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!

# Attend que le serveur réponde avant d'ouvrir le navigateur (jusqu'à ~5s).
for _ in $(seq 1 50); do
  curl -s -o /dev/null "http://localhost:$PORT/index.html" && break
  sleep 0.1
done

URL="http://localhost:$PORT/presenter.html"
open "$URL"

echo ""
echo "Poste présentateur ouvert : $URL"
echo "Laissez cette fenêtre ouverte pendant la présentation."
echo "Fermez-la (ou Ctrl+C) pour arrêter le serveur local."
echo ""

wait "$SERVER_PID"
