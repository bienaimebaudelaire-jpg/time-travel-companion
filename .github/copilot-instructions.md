<!-- Fichier généré automatiquement depuis AGENTS.md par .github/workflows/sync-agent-instructions.yml. Ne pas modifier : éditer AGENTS.md. -->

# AGENTS.md — time-travel-companion

Source unique des instructions pour les agents IA (Claude Code, GitHub Copilot, etc.).
- `CLAUDE.md` contient seulement `@AGENTS.md` : Claude Code lit ce fichier.
- `.github/copilot-instructions.md` est généré automatiquement depuis ce fichier : ne pas le modifier à la main.

## Règles communes

### Veille avant toute suggestion technique
Avant de proposer une librairie, un framework, une version ou une approche :
1. Vérifier qu'elle n'est pas obsolète ou dépréciée (changelog récent, dernière mise à jour).
2. Vérifier qu'elle est parmi les choix les plus utilisés/éprouvés pour ce cas d'usage (pas juste la première connue).
3. Signaler explicitement si une alternative plus récente ou plus performante existe, même si ce n'est pas ce qui est demandé.
4. Ne jamais inventer une donnee, un prix, une statistique ou une source (horaires, tarifs, disponibilite) : verifier ou dire qu'on ne sait pas.

### Avant de livrer du code
- Se relire une fois pour la logique, une fois pour les erreurs/failles évidentes (secrets en dur, entrées non validées, valeurs par défaut trompeuses).
- Optimiser pour : ergonomie/intuitivité, performance raisonnable, coût d'infrastructure maîtrisé.
- Rester dans le périmètre demandé : proposer un élargissement en option, jamais l'imposer.

### Style
- Réponses et commentaires de code en français si le repo est en français, code en anglais.
- Être direct sur les limites ou risques d'un choix, ne jamais les cacher pour « faire plaisir ».

## Spécifique au projet

Lire aussi `DESIGN.md`, `STATUS.md` et `README.md` si présents : ils font foi sur le produit.

Notes de discipline pour toute future session de code sur ce repo.

### Erreurs deja rencontrees ici — ne pas repeter

1. **Versions Tailwind v4** : figer `tailwindcss`/`@tailwindcss/postcss` a `4.0.0` casse le build (`ScannerOptions.negated`). Toujours utiliser une paire alignee, ex. `^4.2.0`, et garder Next/React a des versions recentes coherentes entre elles.
2. **Variable hors scope** : dans `lib/scenario-engine.ts`, un callback de tri utilisait `mode` au lieu de `input.mode` (le parametre destructure n'existait pas dans ce scope). Toujours verifier qu'une variable utilisee dans une closure est bien celle qui est en scope, pas un nom qui "ressemble" a une variable exterieure.

### Principes a garder

- `lib/demo-data.ts` contient des lieux reels recuperes via TomTom Maps (POI + bornes de recharge), pas des donnees inventees. Cout et duree de visite restent des estimations tant qu'aucune source de prix dediee n'est branchee — le dire explicitement dans l'UI si ce n'est plus le cas.
- Le moteur de scenario (`lib/scenario-engine.ts`) ne doit jamais fabriquer une etape ou un horaire absent des candidats : `feasible: false` + raison explicite plutot qu'un scenario force.
- Seule la meteo est un connecteur live reel au moment ou ce fichier est ecrit (Open-Meteo, sans cle). Si un vrai fetch TomTom cote serveur est branche plus tard, mettre a jour cette note.
