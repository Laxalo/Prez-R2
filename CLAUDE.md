# Prez-R2 — guide du projet

Moteur de présentation client (HTML/CSS/JS vanilla, piloté par JSON) pour les RDV Constat / Ingénieries / Préconisations. Remplace les decks PowerPoint.

## Architecture : moteur unique, contenu par client

Le code (`js/`, `css/`, `index.html`, `presenter.html`, `audience.html`) est le **moteur**, commun à tous les clients, versionné normalement.

Le contenu est séparé par client dans `data/clients/<nom>.json` — un fichier par client, jamais modifié après coup pour un autre RDV (voir Archivage). `data/clients/_demo.json` est le **gabarit de référence** : seul fichier client versionné (donnée fictive « Prénom Nom »), il sert de modèle à copier pour chaque nouveau client et de contenu affiché sur le site public (GitHub Pages n'a jamais accès aux fichiers clients réels — voir `.gitignore`).

Au lancement, `"Template slides.command"` copie `data/clients/<nom>.json` → `data/deck.json` (jamais versionné). `js/deck.js` (`loadDeck()`) ne lit que `data/deck.json` ; si absent (site public), il retombe sur `data/clients/_demo.json`. `client`/`date`/`chapitres` sont définis une seule fois dans `deck.meta` et injectés sur chaque slide au chargement (sauf `cover`, qui ne les affiche pas — voir plus bas).

## Workflow par client

1. **Double-cliquer sur l'alias Bureau "Prépa R2-3"** (script `Prépa R2-3.command`, ou l'exécuter directement depuis le projet) — demande le nom du client, puis R2 (nouveau client / refonte complète) ou R3 (finalisation post-RDV, voir plus bas). Copie le prompt correspondant dans le presse-papiers et ouvre Claude Code : Cmd+V puis Entrée pour le coller (reproduit ci-dessous pour référence).
2. **Répondre aux questions** de la "Procédure d'entretien client" (plus bas), dans l'ordre — une seule fois par client. Claude Code crée et personnalise lui-même `data/clients/<nom-client>.json` à partir des réponses, sans que tu aies à écrire toi-même le JSON ou un prompt détaillé.
3. **Vérifier** : lancer `./"Template slides.command" <nom-client>` (ou double-cliquer "Slides R2-3 clients.command" et taper le nom), relire chaque slide, comparer aux règles ci-dessous.
4. **RDV** : présentation en local (voir "Lancement local").
5. **Archiver ** : ne rien commiter (structurellement impossible, voir `.gitignore`). Garder le fichier sur disque (iCloud/Time Machine suffisent). Pour un second RDV avec le même client, **créer un nouveau fichier daté** (`dupont-jean-2.json` ou `dupont-jean-2026-09.json`) plutôt que d'écraser le premier.

**Modification ponctuelle après coup** (ex. changer un seul champ, corriger une coquille, passer du tutoiement au vouvoiement sur une slide) : pas besoin de repasser par R2 ni par l'entretien complet. Ouvrir Claude Code normalement (`claude`, sans script) dans le dossier du projet et demander directement la modification précise, en nommant le fichier client et le champ concerné — ex. « Dans data/clients/dupont-jean.json, passe cloture-reflexion et cloture-detail du tutoiement au vouvoiement ». R2/R3 servent à la création et à la finalisation post-RDV, pas aux retouches ponctuelles.

### Le prompt déclencheur (branche R2)

Généré automatiquement par `Prépa R2-3.command` (nom du client déjà inséré), copié dans le presse-papiers — reproduit ici pour référence, pas besoin de le taper :

```
Nouveau client : <nom-client>. Interviewe-moi selon la section "Procédure
d'entretien client" de CLAUDE.md, une question à la fois (attends ma
réponse avant de poser la suivante, ne saute aucun bloc). Une fois
toutes les réponses obtenues, crée data/clients/<nom-client>.json (copie
de data/clients/_demo.json, personnalisée avec mes réponses) —
uniquement ce fichier, ne touche à aucun autre fichier du projet.
Applique les règles impératives de CLAUDE.md sans me les redemander.
Une fois le fichier écrit, lance ./"Template slides.command" <nom-client>
pour ouvrir automatiquement la présentation.
```

### Procédure d'entretien client

Section de référence pour l'interview — Claude Code pose ces questions dans l'ordre, une à la fois. Tous les chapitres (Assurance vie, SCPI, PER) sont **toujours** présents dans le fichier créé — le masquage éventuel d'un chapitre pour un RDV donné se fait en live, à la présentation, via les boutons "Masquer" du poste présentateur (pas au moment de la création du fichier). Les slides purement pédagogiques (pourquoi l'AV, épargne dormante, univers d'investissement, fiscalité des rachats, mécanisme SCPI, atouts SCPI, cadence SCPI, pourquoi le PER, plafond PER, ainsi que les slides "titre" de chapitre) restent identiques à `_demo.json` — copies telles quelles, aucune question à leur sujet.

**Bloc 1 — Identité**
- Q1. Nom du client (sert à nommer le fichier — ex. `dupont-jean`, sans accents/espaces).

**Bloc 2 — Synthèse patrimoniale (slide 2, `constat`)**
- Q2. Quels sont les 3 blocs à faire apparaître en haut de la slide de synthèse patrimoniale, et leurs valeurs ? (ex. effort d'épargne mensuelle : 1 000 € / capacité d'endettement : 20 % / durée avant la retraite : 6 ans — ou bien épargne de précaution souhaitée / réelle, etc. Libre selon ce qui est pertinent pour ce client.)
- Q3. Lignes d'épargne existantes — répéter pour chacune : nom du support, montant. (La disponibilité réelle n'est pas à préciser à chaque fois : elle est déterminée automatiquement via la table de référence ci-dessous. Si un support ne figure pas dans la table, je te demande sa disponibilité réelle et l'ajoute à la table pour les prochains clients.)
- Q4. Objectifs retenus (parmi : diversifier le patrimoine / optimiser la rentabilité / compléter les revenus / préparer la retraite / autre à préciser).

**Table de référence — disponibilité réelle des supports (pour Q3)**

Rappel Règle 1 : toujours la disponibilité réelle, jamais un repère fiscal.

| Support | Disponibilité |
|---|---|
| Livret A, LDDS, Livret Jeune, PEL, LEP, Livret Bleu (livrets bancaires) | Disponible |
| Assurance-vie | Disponible (positionnée après les livrets bancaires dans l'ordre d'affichage, mais bien "disponible" — un rachat total ou partiel est possible à tout moment) |
| Compte à terme | Bloqué à échéance |
| PEA | 5 ans (un retrait avant 5 ans est légalement possible mais entraîne la clôture du plan — contrairement à l'assurance-vie, où un rachat ne ferme jamais le contrat) |
| SCPI en direct | Recommandé ~8-10 ans sans blocage légal (durée pour amortir les frais d'entrée ~10 % et la friction du marché secondaire) |
| PER | Horizon retraite (légalement bloqué jusqu'à la retraite, hors cas de déblocage anticipé) |
| PEE (Plan Épargne Entreprise) | Bloqué 5 ans (sauf cas de déblocage anticipé) |
| PERCO / PER collectif | Horizon retraite (même traitement que le PER individuel) |
| Compte-titres ordinaire (CTO) | Disponible |
| Compte courant | Disponible |

Table vivante : tout nouveau support rencontré et clarifié avec Victor doit être ajouté ici dans la même forme.

**Bloc 3 — Assurance vie**
- Q5. Quelles données afficher sur la simulation "Valoriser son épargne à l'abri de la fiscalité" (`av-impact-40`) ? (capital en assurance-vie, capital équivalent bancaire net de fiscalité, écart, hypothèses de rendement/durée — valeurs sorties de ton simulateur habituel, jamais calculées par Claude Code, voir Règle 4.)

La slide de transmission (`av-transmission`) n'est jamais modifiée — reprise telle quelle depuis `_demo.json`, aucune question.

**Bloc 4 — SCPI**
- Q6. Simulation de financement SCPI (`scpi-financement`) — un champ à la fois, pas de phrase à rédiger : pour chacun, réponds soit par le chiffre à afficher (sorti de ton simulateur habituel, jamais calculé par Claude Code, voir Règle 4), soit "on garde" / "inchangé" pour conserver la valeur du gabarit `_demo.json` indiquée entre parenthèses.
  - Capital cible (`capitalCible`, gabarit : 85 000 €)
  - Patrimoine réinvesti (`patrimoineReinvesti`, gabarit : 57 695 €)
  - Durée en années (`dureeAnnees`, gabarit : 25 ans)
  - Financement mensuel (`financementMensuel`, gabarit : 496 €)
  - Revenu mensuel (`revenuMensuel`, gabarit : 361 €)
  - Taux de distribution (`tauxDistribution`, gabarit : 5,1 %)
  - Taux de financement (`tauxFinancement`, gabarit : 5,85 %)
- Q6bis. Sur cette même slide, l'hypothèse "Sans financement" (colonne de gauche du diagramme de levier) doit-elle prendre en compte le réinvestissement des loyers ?
  - Si **non** : `masquerLabelReinvesti: true` sur la slide `scpi-financement` — masque le repère d'ordonnée "Patrimoine immobilier constitué par réinvestissement des loyers" (le montant `patrimoineReinvesti` continue de servir au calcul de la hauteur de colonne et de l'effet de levier, seul ce libellé disparaît) et retire aussi la précision "fiscalité avant réinvestissement prise en compte (TMI 30 % + PS 17,2 %)" de la ligne d'hypothèses en bas de slide (n'a plus d'objet dans ce cas). Voir `gaelle-pigot.json`.
  - Si **oui** : ne rien ajouter (comportement par défaut, le repère s'affiche). Voir `maxime-gouzy.json`.

**Bloc 5 — PER**
Aucune question pour l'instant — les questions propres au PER (dont `per-transmission`) seront fournies plus tard par Victor. Jusque-là, ce chapitre est repris tel quel depuis `_demo.json`.

**Bloc 6 — Clôture (avant-dernière et dernière slide)**
- Q7. Tutoiement ou vouvoiement sur la slide de préconisations ? S'applique à tout le texte des slides `cloture-reflexion` / `cloture-detail` comportant un pronom de 2e personne : bullets d'argumentaire (voir table ci-dessous), sous-titres de budget (Q9) et message "à terme" (Q10) — y compris si mes réponses à ces questions sont formulées dans l'autre registre par habitude, reformule sans me redemander. Vouvoiement par défaut (registre professionnel) si je ne précise rien.
- Q8. Préconisations retenues à ce stade — **une question par bloc**, dans cet ordre fixe : PER, Assurance vie, SCPI en direct, SCPI en financement. C'est aussi l'ordre d'affichage sur la slide (les blocs absents sont simplement sautés, pas d'ordre à redemander). Pour chaque bloc :
  1. « Est-ce qu'il y a le bloc <nom> ? » — si non, bloc suivant, rien à écrire.
  2. Si oui : « On garde le défaut ou il y a des modifications ? » — rappeler le bloc par défaut (nom, bullets, questions, voir table ci-dessous) à ce moment-là. Si modifications, les recueillir immédiatement (nom court reste, Règle 2 ; bullets remplacées/ajoutées ; questions adaptées).
  - Cas particulier SCPI en direct : le 2e bullet n'a pas un seul défaut — c'est toujours l'une des deux variantes de la table (jamais les deux, jamais une autre formulation par défaut). Demander laquelle des deux s'applique à ce client, systématiquement (pas de règle automatique pour choisir).
  - Cas particulier PER : pas encore de bloc par défaut (bullets/questions à fournir par Victor) — traiter comme avant (« bloc inclus ou non », contenu à rédiger au cas par cas) jusqu'à ce qu'un défaut soit ajouté à la table.
  - Pas de montants à ce stade : ils sont ajustés dans un second temps, après le RDV (branche R3).
  - Cas particulier — préconisation déjà mise en place avant ce RDV (pas une question ouverte, un fait acquis) : prend `"statut": { "label": "Déjà en place", "detail": "<montant>" }` à la place de `questions`/`montant` — rendu sur une seule ligne ("✓ Déjà en place, <montant>"), en or, comme le nom de la préconisation (lui aussi passe en or) : le doré signale d'un coup d'œil ce qui a déjà été fait. Voir `nicolas-coudert.json`. **Toujours placée en premier** dans `preconisations[]` (avant les blocs à questions ouvertes), sur `cloture-reflexion` comme sur `cloture-detail` — peu importe l'ordre PER/AV/SCPI direct/SCPI financement sinon appliqué.
- Q9. Sous-titres de budget (`cloture-reflexion` / `cloture-detail`) : faut-il afficher la capacité d'épargne mensuelle et/ou la capacité d'investissement initial ? Si oui, les montants et la formulation exacte.
- Q10. Message de synthèse "à terme" — une ou plusieurs pistes courtes (2-3 items, pas de phrase à rallonge). Registre par défaut (voir `_demo.json`/`maxime-gouzy.json`) : `aTerme.bullets` avec `"ligne": true`, qui pose le label "À TERME" à côté de la liste plutôt qu'au-dessus (voir `.cloture__aterme--ligne` dans `css/chapitre.css`) — gagne de la hauteur quand le cadre est déjà chargé par les préconisations au-dessus. N'utiliser `aTerme.texte` (phrase unique, centrée) que si le message tient vraiment en une seule phrase courte et qu'aucune liste n'a de sens ; et repasser en liste empilée sans `ligne` (comme `florent-tachenne.json`) seulement si des pistes ont besoin de sous-puces ou sont trop longues pour tenir à côté du label.

**Table de référence — blocs par défaut des préconisations (pour Q8, et bullets en tutoiement pour Q7)**

Blocs repris par défaut depuis `_demo.json` (vouvoiement) ; si Q7 = tutoiement, utiliser directement la version ci-dessous plutôt que de reformuler à chaque fois (garde un phrasé validé et cohérent d'un client à l'autre) :

| Préconisation | Bullet (vouvoiement, défaut) | Bullet (tutoiement) |
|---|---|---|
| Assurance-vie | Rentabiliser votre épargne, tout en la gardant disponible | Rentabiliser ton épargne, tout en la gardant disponible |
| Assurance-vie | Vous placer à l'abri de la fiscalité, et hors masse successorale | Te placer à l'abri de la fiscalité, et hors masse successorale |
| Assurance-vie | Diversifier les moteurs de performance de votre patrimoine | Diversifier les moteurs de performance de ton patrimoine |
| SCPI en direct | Allocation de SCPI européennes récentes et diversifiées, pour constituer du patrimoine | Allocation de SCPI européennes récentes et diversifiées, pour constituer ton patrimoine |
| SCPI en direct — variante A | Vos revenus SCPI complètent l'effort d'épargne, en tenant compte de votre fiscalité | Tes revenus SCPI complètent l'effort d'épargne, en tenant compte de ta fiscalité |
| SCPI en direct — variante B | Rentabiliser votre effort d'épargne, en tenant compte de votre fiscalité | Rentabiliser ton effort d'épargne, en tenant compte de ta fiscalité |
| SCPI en financement | Une partie de votre effort d'épargne dope votre patrimoine grâce au levier du crédit | Une partie de ton effort d'épargne dope ton patrimoine grâce au levier du crédit |
| SCPI en financement | Vos revenus SCPI compensent l'effort d'épargne du financement, et améliorent votre profil bancaire | Tes revenus SCPI compensent l'effort d'épargne du financement, et améliorent ton profil bancaire |

Assurance-vie : 3 bullets par défaut (les 2 premières + celle sur la diversification). SCPI en direct : le 1er bullet est fixe, le 2e est **soit** la variante A **soit** la variante B — jamais les deux, jamais une troisième formulation par défaut — à demander au cas par cas (Q8, pas de règle automatique). SCPI en financement : 2 bullets fixes, pas de variante.

Questions par défaut (`cloture-reflexion`, `preconisations[].questions`) : Assurance-vie et SCPI en direct → "Quid du versement programmé ?" / "Quid du versement initial ?" ; SCPI en financement → "Quid de la participation mensuelle ?".

Table vivante : toute nouvelle préconisation ou variante (ex. bloc PER une fois ses questions fournies par Victor) doit être ajoutée ici au fur et à mesure.

Règles impératives appliquées automatiquement (détail plus bas) : ordre des lignes d'épargne par disponibilité réelle (Règle 1), noms de préconisation courts (Règle 2), pas de sous-texte sous les KPI (Règle 3), pas de calcul financier improvisé (Règle 4).

## Finalisation post-RDV (montants de clôture — branche R3)

Une fois le RDV terminé et les montants définitifs connus, la branche R3 de `Prépa R2-3.command` (même script que la création, choix "R3" après le nom du client) reprend `cloture-reflexion` (l'avant-dernière slide, questions ouvertes utilisées en live pour la discussion) pour finaliser `cloture-detail` (la dernière slide, la version chiffrée envoyée/archivée) : chaque question `questions[]` devient un montant réel dans `montant`.

Déroulé, une fois le prompt collé dans Claude Code (Cmd+V) : pour chaque préconisation de `cloture-reflexion`, Claude Code pose une à une les questions de `questions[]`, telles qu'écrites ; tu réponds avec le montant correspondant. Une fois toutes les questions d'une préconisation répondues, il propose la formulation du champ `montant` de `cloture-detail` et tu valides ou corriges avant écriture :
- **Une seule réponse** (une seule question dans `questions[]`, ou une seule renseignée) → chaîne simple reprise telle quelle, ex. `"montant": "500 €/mois"`.
- **Deux réponses — versement initial + versement programmé** → **jamais** de chaîne combinée ni de retour à la ligne dans une chaîne : toujours l'objet dédié `"montant": { "initial": "3 000 €", "programme": "500 €" }` (montants seuls, sans "/mois" ni "en versement initial" — le gabarit `cloture-detail.js` ajoute lui-même les libellés "Versement initial : …" et "Versement programmé : …/mois", dans le même style que les questions de `cloture-reflexion`). Voir `édouard-baillieul.json`.

Titre, budget et `aTerme` sont recopiés tels quels de `cloture-reflexion` vers `cloture-detail` (filet de sécurité — ils sont normalement déjà identiques, fixés une fois pour toutes à la création du client). Seul `data/clients/<nom-client>.json` est modifié ; les `questions[]` de `cloture-reflexion` restent inchangées.

**Dernière étape, systématique** : une fois tous les montants recueillis, demander « Y a-t-il des préconisations déjà réalisées avant ce RDV, à signaler comme telles ? ». Si oui, pour chaque préconisation concernée, remplacer — **sur `cloture-reflexion` ET `cloture-detail`** (les deux gardent le même `statut`, comme les autres champs recopiés) — `questions`/`montant` par `"statut": { "label": "Déjà en place", "detail": "<montant réel>" }` (le `nom` de la préconisation passe alors en doré, avec une coche "✓ Déjà en place, <montant réel>" sur une seule ligne — voir Q8 de la Procédure d'entretien client, et `nicolas-coudert.json`) et **la déplacer en tête de `preconisations[]`** (sur les deux slides). Ne rien ajouter si la réponse est non.

Une fois le fichier écrit (R2 comme R3), Claude Code lance lui-même `./"Template slides.command" <nom-client>` pour ouvrir automatiquement la présentation — pas besoin de le relancer à la main pour vérifier.

("Finaliser les montants.command" / "Prépa R3.command" — ancien script séparé, désormais fusionné dans `Prépa R2-3.command` — n'est plus utilisé, laissé en place comme redirection le temps de supprimer son alias Bureau.)

La branche R3 lance Claude Code avec `--model sonnet --effort low` (tâche mécanique — poser quelques questions, recopier des champs texte — mais Haiku s'est montré trop imprécis sur ces formulations ; Sonnet en effort réduit reste largement moins coûteux que le modèle par défaut). La branche R2 garde le modèle par défaut : elle traite du contenu financier et doit appliquer les règles impératives, la qualité prime.

## Règles impératives (contenu)

**1. `supports[].horizon` (slide 2) = disponibilité réelle, jamais un repère fiscal.**
Piège classique : l'assurance-vie n'est *jamais* "bloquée 8 ans" — un rachat total ou partiel est possible à tout moment, sans autorisation ni délai légal. Les 8 ans sont un seuil **fiscal** (abattement + PFU réduit sur les plus-values de rachat), pas une contrainte de disponibilité. Classer l'assurance-vie en `"disponible"` (positionnée après les livrets bancaires dans l'ordre d'affichage, cf. usage courant, mais bien "disponible").
- Disponible : livrets, assurance-vie.
- Bloqué à échéance : compte à terme.
- Cas particulier (traité comme une durée, mais pour une raison structurelle et non fiscale) : PEA — un retrait avant 5 ans est possible mais ferme le plan.
- Recommandé sans blocage légal : SCPI en direct (~8-10 ans pour amortir les frais d'entrée ~10 % et la friction du marché secondaire).
- Légalement bloqué : PER (jusqu'à la retraite, hors cas de déblocage anticipé).

`constat.js` ne trie jamais `supports[]` — l'ordre affiché est strictement celui du JSON, donc c'est à la saisie que la règle s'applique. Voir la table de référence complète dans la Procédure d'entretien client ci-dessus.

**2. Noms de préconisation courts en clôture (`cloture-reflexion.js` / `cloture-detail.js`).**
`preconisations[].nom` reste court ("Assurance-vie", "SCPI en direct"). Le détail versement initial/programmé va dans `preconisations[].questions[]` (variante `cloture-reflexion`, questions ouvertes) ou dans les `bullets[]` (variante `cloture-detail`, chiffrée) — jamais concaténé au `nom`.

**3. Pas de sous-texte sous les KPI de la slide 2.**
Le gabarit `constat.js` ne rend plus `kpi.note` (retiré du rendu) : les 3 blocs du haut (`kpis[]`) n'affichent que `label` + `valeur`. Ne pas ajouter de champ `note` en le remplissant — il ne s'affichera pas.

**4bis. `supports[].nom` (slide 2) — quand il y a beaucoup de lignes d'épargne, ne garder que le type de support, jamais l'établissement.**
Si le nombre de lignes fait déborder le nom complet (ex. "Livret A - BPDA", "PEA - Boursobank"), retirer la partie après le type ("Livret A", "PEA"). Ne s'applique que sous contrainte de place — avec peu de lignes, le nom complet (établissement inclus) reste préférable s'il apporte de l'info utile au client.

**4. Ne jamais calculer une simulation financière (`av-impact-40`, `scpi-financement`).**
Les valeurs affichées (capital, écart, revenu, taux, durée...) proviennent toujours des simulateurs existants de Victor (`Simulateur AV:SCPI.webloc`, `Simulateur PER.webloc`, `Simulation_SCPI_AV_PER.xlsx`, dans `METIER`) — jamais recalculées, estimées ou approchées par Claude Code. C'est un garde-fou de responsabilité professionnelle, pas seulement une question de style : une simulation fiscale/financière erronée engage Victor face au client. La question à poser est toujours "quelles données afficher", jamais "quels paramètres calculer".

## Lancement local

- **"Template slides.command"** (dans `PRO/METIER/Prez-R2`) : sans argument → `_demo` ; avec un nom de client en argument → ce client. Détecte un port libre à partir de 8734, ouvre `presenter.html` dans le navigateur par défaut, se ferme automatiquement après ~1s (serveur détaché, continue de tourner en arrière-plan — sans conséquence, `localhost` uniquement).
- **"Slides R2-3 clients.command"** : version interactive — liste les clients disponibles dans `data/clients/`, demande le nom, délègue au script ci-dessus. Pratique en raccourci Bureau (créer un **alias Finder**, jamais une copie — sinon le script ne retrouve pas le projet).
- Poste présentateur : navigation slide à slide, notes, bouton "Ouvrir l'écran auditoire" (fenêtre miroir sans chrome, synchronisée via `BroadcastChannel`), et un bouton "Masquer" par slide pour ne pas présenter un chapitre sans le retirer du fichier.

## Site public (GitHub Pages)

`https://victorkieny.github.io/Prez-R2/presenter.html` — accessible depuis le téléphone sans serveur local. N'affiche jamais un client réel : `data/deck.json` n'est jamais poussé (`.gitignore`), donc `loadDeck()` retombe systématiquement sur `data/clients/_demo.json`. Un 404 dans la console à chaque chargement est normal (c'est la tentative sur `data/deck.json` qui échoue avant le fallback).

`.nojekyll` doit rester à la racine — sans lui, GitHub Pages (Jekyll) exclut silencieusement tout fichier commençant par `_`, dont `_demo.json`.

## Garde-fous de confidentialité (dépôt public)

```
data/clients/*.json       # tout fichier client réel est ignoré...
!data/clients/_demo.json  # ...sauf le gabarit de référence
data/deck.json             # jamais la source, copié au lancement
PDF/                        # exports (voir scripts/export_pdf.py) : contiennent des préconisations réelles
.venv/                      # environnement Python local (screenshot.py, export_pdf.py)
```

Un `git add -A` ne peut donc pas exposer un client réel par erreur — c'est structurel, pas une discipline à maintenir manuellement. En contrepartie : **on ne peut pas "archiver via git"** un fichier client (il sera toujours ignoré). L'archivage réel se fait sur disque (copies datées, iCloud/Time Machine).
