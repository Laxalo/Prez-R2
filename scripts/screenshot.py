#!/usr/bin/env python3
"""Capture une slide du deck en PNG — pour se vérifier soi-même sans
dépendre de l'extension Chrome (souvent indisponible en session).

Playwright vit dans un venv local (.venv), pas dans le Python système :
    .venv/bin/python3 scripts/screenshot.py <slide-id>

Setup initial (déjà fait une fois pour ce projet) :
    python3 -m venv .venv
    .venv/bin/pip install playwright
    .venv/bin/python3 -m playwright install chromium

Exemples :
    .venv/bin/python3 scripts/screenshot.py av-pourquoi
    -> /tmp/slide-av-pourquoi.png

    .venv/bin/python3 scripts/screenshot.py av-rachats --state 4
    -> avance de 4 clics dans la révélation progressive avant la capture

    .venv/bin/python3 scripts/screenshot.py cover --out /tmp/cover.png
"""
import argparse
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8000
# Le système "chapitrage" anime ses révélations sur --chap-duration-move
# (420ms, voir theme.css) : on laisse une marge après la dernière action
# avant de capturer, pour ne jamais figer une transition en cours.
SETTLE_MS = 600


def server_running(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


def start_server_if_needed(port):
    """Démarre `python3 -m http.server` si rien n'écoute déjà sur ce port
    — ne touche pas à un serveur déjà lancé par ailleurs dans la session."""
    if server_running(port):
        return None
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(50):
        if server_running(port):
            return proc
        time.sleep(0.1)
    proc.terminate()
    raise RuntimeError(f"Le serveur local ne répond pas sur le port {port}")


def main():
    parser = argparse.ArgumentParser(description="Capture une slide du deck en PNG.")
    parser.add_argument("slide_id", help="id de la slide (data/deck.json), ex: av-pourquoi")
    parser.add_argument("--out", default=None, help="chemin du PNG (défaut : /tmp/slide-<id>.png)")
    parser.add_argument(
        "--state",
        type=int,
        default=0,
        help="nombre de clics sur la scène avant capture (révélation progressive, voir js/deck.js)",
    )
    parser.add_argument("--width", type=int, default=1600, help="largeur du viewport (défaut 1600, ratio 16:9)")
    parser.add_argument("--height", type=int, default=900, help="hauteur du viewport (défaut 900, ratio 16:9)")
    args = parser.parse_args()

    out_path = Path(args.out) if args.out else Path(f"/tmp/slide-{args.slide_id}.png")
    selector = f"#slide-{args.slide_id}"

    server_proc = start_server_if_needed(PORT)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": args.width, "height": args.height})
            page.goto(f"http://localhost:{PORT}/index.html")

            try:
                page.wait_for_selector(selector, timeout=10000)
            except Exception:
                browser.close()
                sys.exit(f"Slide introuvable : {selector} (id correct dans data/deck.json ?)")

            stage = page.locator(f"{selector} .slide__stage")
            for _ in range(args.state):
                # Coin haut-gauche de la scène : jamais un input/bouton
                # d'une slide "calculator" (voir app.js, clic exclu sur
                # input/button/a/[contenteditable]).
                stage.click(position={"x": 5, "y": 5})
                page.wait_for_timeout(SETTLE_MS)

            page.wait_for_timeout(SETTLE_MS)
            page.locator(selector).screenshot(path=str(out_path))
            browser.close()
    finally:
        if server_proc:
            server_proc.terminate()
            server_proc.wait(timeout=5)

    print(str(out_path))


if __name__ == "__main__":
    main()
