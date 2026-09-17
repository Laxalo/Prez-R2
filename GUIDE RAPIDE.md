# Guide rapide — Prez-R2

Les trois raccourcis du dossier, en une phrase chacun : **Prépa R2-3** crée
ou finalise un client (avec Claude Code), **Slides R2-3 clients** ouvre une
présentation existante pour la consulter, **Template slides** est le moteur
technique derrière ce dernier — tu ne le lances quasiment jamais toi-même.

## Prépa R2-3.command

**À quoi ça sert** : créer un nouveau client (ou refondre un client
existant), ou finaliser les montants après un RDV. C'est le seul des trois
scripts qui ouvre Claude Code.

**Comment l'utiliser** : double-clic (alias Bureau). Il demande le nom du
client, puis :

- **R2** = personnaliser l'ensemble des slides — nouveau client, ou refonte
  complète. Interview complet, une question à la fois.
- **R3** = finaliser uniquement les montants de la dernière slide — post-RDV.
  Reprend les questions « quid... ? » de l'avant-dernière slide et te
  demande un montant pour chacune.

Le prompt correspondant est copié dans le presse-papiers et Claude Code
s'ouvre automatiquement : `Cmd+V` puis `Entrée` pour le coller.

**Coût** : R2 tourne avec le modèle par défaut (contenu financier, règles à
respecter — la qualité prime). R3 tourne avec un modèle économique
(`haiku`, effort réduit — tâche mécanique, coût minime).

**Modification ponctuelle après coup** (ex. corriger une coquille, changer
tutoiement/vouvoiement) : pas besoin de ce script. Ouvrir Claude Code
normalement (`claude`, sans raccourci) dans le dossier du projet et
demander directement, en nommant le fichier client et le champ concerné.
Détail dans CLAUDE.md.

## Slides R2-3 clients.command

**À quoi ça sert** : ouvrir la présentation d'un client déjà créé, pour la
consulter ou la montrer en RDV. Aucune création ni modification — juste de
l'affichage.

**Comment l'utiliser** : double-clic (alias Bureau). Liste les clients
disponibles, tu tapes le nom (ou juste Entrée pour la démo). Le navigateur
s'ouvre automatiquement sur le poste présentateur.

**Coût** : aucun — pas d'IA impliquée, script purement local.

## Template slides.command

**À quoi ça sert** : le moteur technique qui démarre le serveur local et
affiche la présentation. Appelé automatiquement par « Slides R2-3
clients.command » — tu n'as normalement jamais besoin de le lancer toi-même
directement.

**Comment l'utiliser** (rare, en ligne de commande) : `./"Template
slides.command" <nom-client>`. Sans argument, ouvre la démo (`_demo`).

**Coût** : aucun — pas d'IA impliquée, script purement local.

---

Pour tout le reste (règles de contenu, structure du projet, procédure
d'entretien détaillée) : voir `CLAUDE.md`, dans ce même dossier.
