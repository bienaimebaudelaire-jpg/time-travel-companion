# CLAUDE.md — time-travel-companion

Notes de discipline pour toute future session de code sur ce repo.

## Erreurs deja rencontrees ici — ne pas repeter

1. **Versions Tailwind v4** : figer `tailwindcss`/`@tailwindcss/postcss` a `4.0.0` casse le build (`ScannerOptions.negated`). Toujours utiliser une paire alignee, ex. `^4.2.0`, et garder Next/React a des versions recentes coherentes entre elles.
2. **Variable hors scope** : dans `lib/scenario-engine.ts`, un callback de tri utilisait `mode` au lieu de `input.mode` (le parametre destructure n'existait pas dans ce scope). Toujours verifier qu'une variable utilisee dans une closure est bien celle qui est en scope, pas un nom qui "ressemble" a une variable exterieure.

## Principes a garder

- `lib/demo-data.ts` contient des lieux reels recuperes via TomTom Maps (POI + bornes de recharge), pas des donnees inventees. Cout et duree de visite restent des estimations tant qu'aucune source de prix dediee n'est branchee — le dire explicitement dans l'UI si ce n'est plus le cas.
- Le moteur de scenario (`lib/scenario-engine.ts`) ne doit jamais fabriquer une etape ou un horaire absent des candidats : `feasible: false` + raison explicite plutot qu'un scenario force.
- Seule la meteo est un connecteur live reel au moment ou ce fichier est ecrit (Open-Meteo, sans cle). Si un vrai fetch TomTom cote serveur est branche plus tard, mettre a jour cette note.
