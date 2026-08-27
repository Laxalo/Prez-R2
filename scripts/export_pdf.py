#!/usr/bin/env python3
"""Exporte une slide du deck en PDF vectoriel, pleine page, sans les
nav-dots — voir SKILL "recap-slide-pdf" (.claude/skills/recap-slide-pdf/).

Contrairement à scripts/screenshot.py (PNG rasterisé, pour se vérifier
soi-même), celui-ci génère un vrai PDF via page.pdf() : texte
sélectionnable, net à tout zoom. Playwright vit dans .venv (voir
screenshot.py pour le setup initial) :

    .venv/bin/python3 scripts/export_pdf.py <client> <slide-ref> --out fichier.pdf

<client>    : nom de fichier dans data/clients/ sans extension (ex: bretaudeau)
<slide-ref> : index 1-indexé dans deck.slides (ex: 21), OU id de slide
              (ex: cloture-reflexion), OU mot-clé "premiere"/"derniere"/
              "avant-derniere"

Bascule data/deck.json sur le client demandé le temps de l'export, puis
restaure son contenu précédent (deck.json est l'ardoise "client actif"
utilisée par index.html/presenter.html, gitignored — ne pas la laisser
altérée par un export).
"""
import argparse
import json
import re
import socket
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CLIENTS_DIR = ROOT / "data" / "clients"
DECK_JSON = ROOT / "data" / "deck.json"
PORT = 8000
SETTLE_MS = 600
STAGE_W, STAGE_H = 1280, 720

PRINT_CSS = """
@media print {
  html, body { margin: 0; padding: 0; }
  .deck { height: auto !important; overflow: visible !important; scroll-snap-type: none !important; }
  .slide { break-after: page; break-inside: avoid; background: none !important; }
  .slide > .slide__stage {
    position: static !important;
    top: auto !important; left: auto !important;
    transform: none !important;
    width: 100% !important; height: 100% !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}
"""


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def resolve_slide(slides, ref):
    """Retourne (index0, slide) pour une référence donnée par l'utilisateur."""
    key = strip_accents(ref.strip().lower())
    if key in ("premiere", "1ere", "first"):
        return 0, slides[0]
    if key in ("derniere", "last"):
        return len(slides) - 1, slides[-1]
    if key in ("avant-derniere", "avant derniere", "second-to-last", "avant-dernier"):
        return len(slides) - 2, slides[-2]
    if re.fullmatch(r"\d+", ref.strip()):
        idx = int(ref.strip()) - 1
        return idx, slides[idx]
    for i, s in enumerate(slides):
        if s.get("id") == ref.strip():
            return i, s
    raise SystemExit(f"Slide introuvable pour la référence : {ref!r}")


def server_running(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


def start_server_if_needed(port):
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
    raise RuntimeError("le serveur local ne répond pas")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("client", help="nom du fichier dans data/clients/ (sans .json)")
    parser.add_argument("slide_ref", help="index 1-indexé, id de slide, ou premiere/derniere/avant-derniere")
    parser.add_argument("--out", required=True, help="chemin du PDF de sortie")
    args = parser.parse_args()

    client_path = CLIENTS_DIR / f"{args.client}.json"
    if not client_path.exists():
        raise SystemExit(f"Fiche client introuvable : {client_path}")
    deck = json.loads(client_path.read_text())
    slide_index, slide = resolve_slide(deck["slides"], args.slide_ref)
    page_number = slide_index + 1
    state = (len(slide["states"]) - 1) if slide.get("states") else 0
    selector = f"#slide-{slide['id']}"

    previous_deck = DECK_JSON.read_text() if DECK_JSON.exists() else None
    DECK_JSON.write_text(client_path.read_text())

    server_proc = start_server_if_needed(PORT)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": STAGE_W, "height": STAGE_H})
            page.goto(f"http://localhost:{PORT}/index.html")
            page.wait_for_selector(selector, timeout=10000)

            stage = page.locator(f"{selector} .slide__stage")
            for _ in range(state):
                # Coin haut-gauche : jamais un input/bouton d'une slide
                # "calculator" (voir app.js, clic exclu sur
                # input/button/a/[contenteditable]).
                stage.click(position={"x": 5, "y": 5})
                page.wait_for_timeout(SETTLE_MS)
            page.wait_for_timeout(SETTLE_MS)

            page.evaluate("document.getElementById('navDots')?.remove()")
            page.add_style_tag(content=PRINT_CSS)

            page.pdf(
                path=args.out,
                width=f"{STAGE_W}px",
                height=f"{STAGE_H}px",
                print_background=True,
                margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
                page_ranges=str(page_number),
            )
            browser.close()
    finally:
        if server_proc:
            server_proc.terminate()
            server_proc.wait(timeout=5)
        if previous_deck is not None:
            DECK_JSON.write_text(previous_deck)
        else:
            DECK_JSON.unlink(missing_ok=True)

    print(args.out)


if __name__ == "__main__":
    main()
