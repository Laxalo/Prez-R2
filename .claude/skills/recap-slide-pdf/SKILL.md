---
name: recap-slide-pdf
description: Exporte une slide précise d'un client (data/clients/<nom>.json) en PDF vectoriel propre — plein cadre 16:9, sans les nav-dots, sans bordure/marge visible, texte réel (pas un screenshot pixellisé). À utiliser quand Victor demande "la slide récap", "récupérer une slide en PDF", ou l'export PDF d'une diapositive donnée d'un dossier client.
---

Objectif : produire un PDF d'UNE slide du deck (pas toute la présentation), fidèle au rendu écran mais nettoyé pour un envoi client — vectoriel, plein cadre, sans les points de navigation à droite.

## Étapes

1. **Identifier le client et la slide.** Le fichier source est `data/clients/<nom>.json` (slug en minuscules, ex. `bretaudeau`). Si Victor décrit la slide en langage naturel ("l'avant-dernière", "la slide de clôture", "la slide SCPI financement"), retrouve son id ou sa position dans `deck["slides"]` — inspecte le JSON si besoin (`python3 -c "import json; ..."`) plutôt que de deviner.

2. **Vérifier l'environnement Playwright.** Le repo utilise un `.venv` local (gitignored) pour Playwright — ne PAS utiliser le Python système.
   ```
   test -d .venv || { python3 -m venv .venv && .venv/bin/pip install -q playwright && .venv/bin/python3 -m playwright install chromium; }
   ```
   Le venv est parfois cassé après un déplacement/sync iCloud (chemin absolu périmé) — si `.venv/bin/pip show playwright` échoue avec "bad interpreter", recrée-le (`rm -rf .venv` puis la commande ci-dessus).

3. **Lancer l'export** via `scripts/export_pdf.py` (déjà présent dans le repo — ne pas le réécrire à chaque fois, seulement si le rendu du deck a changé structurellement) :
   ```
   .venv/bin/python3 scripts/export_pdf.py <client> <slide-ref> --out <chemin>.pdf
   ```
   - `<slide-ref>` accepte : un index 1-indexé, un id de slide (`cloture-reflexion`), ou les mots-clés `premiere` / `derniere` / `avant-derniere`.
   - Le script bascule `data/deck.json` sur le client demandé le temps de l'export puis restaure son contenu précédent — ne pas toucher `data/deck.json` à la main autour de cet appel.
   - Il déroule automatiquement la révélation progressive jusqu'à son dernier état (via `slide.states`) pour capturer la slide complète, pas un état partiel.
   - Le PDF produit est déjà vectoriel, plein cadre 16:9 (960×540 pt), fond inclus, sans nav-dots — pas de retouche supplémentaire nécessaire.

4. **Vérifier le rendu avant de livrer** (le PDF n'est pas un format que tu peux lire directement) : convertis la page en PNG pour inspection visuelle.
   ```
   .venv/bin/pip install -q pymupdf   # une fois
   .venv/bin/python3 -c "
   import fitz
   doc = fitz.open('<chemin>.pdf')
   doc[0].get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save('<chemin>.check.png')
   "
   ```
   Relis ce PNG (outil Read) pour confirmer que c'est la bonne slide, complète, sans point de navigation ni bordure blanche. Supprime le PNG de contrôle une fois vérifié (fichier de travail, pas un livrable).

5. **Ranger le fichier final.** Si un dossier client existe sous `PRO/METIER/Clients/<Nom Prénom>/` (chercher par correspondance de mots avec `meta.client` du JSON — ex. `meta.client: "Paul Bretaudeau"` → dossier `Bretaudeau Paul`), copie le PDF dedans avec un nom clair (ex. le titre de la slide : `Préconisations patrimoniales.pdf`). Sinon, demande où le ranger plutôt que de deviner. Envoie aussi le fichier à Victor via l'outil d'envoi de fichier.

## Pièges déjà rencontrés

- Un simple screenshot (PNG) rewrappé en PDF donne un rendu pixellisé au zoom — toujours utiliser `page.pdf()` de Playwright (rendu vectoriel du texte), jamais screenshot→PDF.
- Le PDF imprimé naïvement (sans CSS d'impression dédiée) pagine le document en continu, pas une slide par page — `scripts/export_pdf.py` injecte déjà les règles `break-after: page` nécessaires ; les modifier seulement si la structure CSS du deck change.
- Par défaut, `.slide__stage` est centré dans `.slide` avec une marge (gutter) et un fond clair derrière — ça laisse un liseré blanc autour de la carte sombre. Le script neutralise déjà ce gutter en forçant `.slide__stage` à 100%×100% en mode print ; ne pas revenir à une taille de page incluant la marge.
