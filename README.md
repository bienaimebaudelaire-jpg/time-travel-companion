# Time & Travel Companion — MVP

Scaffold V1 : transforme un temps disponible + une ville en scenario de sortie compose et faisable.

## Ce qui est reel dans ce scaffold

- **Moteur de scenario** (`lib/scenario-engine.ts`) : compose une suite d'etapes faisables dans le temps disponible moins une marge de securite de retour (~18%), pondere par le mode (equilibre/economique). Ne fabrique jamais une etape : si rien ne rentre, retourne `feasible: false` avec une raison explicite.
- **Meteo live reelle** (`lib/weather.ts`) : geocodage + prevision via l'API publique Open-Meteo, sans cle API. C'est le seul connecteur reellement branche pour l'instant.
- **Donnees POI** (`lib/demo-data.ts`) : jeu de demonstration pour Paris et Lyon, clairement etiquete comme tel, a remplacer par un vrai connecteur (ex. OpenStreetMap Overpass, prix-carburants.gouv.fr, data.gouv.fr) avant tout usage reel.

## Prochaine etape technique

Brancher un vrai connecteur POI (OpenStreetMap Overpass en priorite, gratuit et sans cle) a la place de `demo-data.ts`, en respectant la hierarchie de sources definie dans la spec produit (officiel > institutionnel > partenaires > agregateurs).

## Demarrer en local

```bash
npm install
npm run dev
```
