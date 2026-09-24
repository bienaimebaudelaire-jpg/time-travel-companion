# Time & Travel Companion — MVP

Scaffold V1 : transforme un temps disponible + une ville en scenario de sortie compose et faisable.

## Ce qui est reel dans ce scaffold

- **Moteur de scenario** (`lib/scenario-engine.ts`) : compose une suite d'etapes faisables dans le temps disponible moins une marge de securite de retour (~18%), pondere par le mode (equilibre/economique). Ne fabrique jamais une etape : si rien ne rentre, retourne `feasible: false` avec une raison explicite.
- **Meteo live reelle** (`lib/weather.ts`) : geocodage + prevision via l'API publique Open-Meteo, sans cle API. C'est le seul connecteur reellement branche pour l'instant.
- **Donnees POI** (`lib/demo-data.ts`) : jeu de demonstration pour Paris et Lyon, clairement etiquete comme tel, a remplacer par un vrai connecteur (ex. OpenStreetMap Overpass, prix-carburants.gouv.fr, data.gouv.fr) avant tout usage reel.

## Prochaine etape technique

Brancher un vrai connecteur POI (OpenStreetMap Overpass en priorite, gratuit et sans cle) a la place de `demo-data.ts`, en respectant la hierarchie de sources definie dans la spec produit (officiel > institutionnel > partenaires > agregateurs).

## Couche preparatoire "agent runtime" (sans dependance Automaton)

Une couche locale d'adaptation est disponible dans `lib/agent-mission-adapter.ts`.
Elle expose un contrat pour une mission de planification de type agent :

- **Entree** : temps disponible, ville, mode, contraintes (`transportMode`, plafond de cout optionnel).
- **Sortie** : scenario calcule, meteo (si disponible), provenance des donnees, avertissements, actions proposees.
- **Mode propositionnel uniquement** : aucune reservation, aucun paiement, aucune ecriture sur un calendrier externe.

### Exemple d'appel local

```ts
import { runPlanningMission } from "@/lib/agent-mission-adapter"

const response = await runPlanningMission({
  missionId: "mission-001",
  mode: "proposition",
  input: {
    availableMinutes: 120,
    city: "Paris",
    mode: "equilibre",
    constraints: { transportMode: "pied", maxCostEur: 25 },
  },
})
```

### Exemple de configuration/prompt pour un futur agent Automaton/HUMEAN

```json
{
  "agentName": "travel-planner-proposal",
  "runtimeMode": "proposal-only",
  "tools": ["runPlanningMission"],
  "forbiddenActions": ["book", "pay", "write_external_calendar", "self_modify", "replicate"],
  "requiresHumanApproval": true
}
```

Prompt systeme suggere :

```text
Tu es un agent de planification en mode propositionnel strict.
Tu peux appeler runPlanningMission pour recommander un scenario.
Tu ne dois jamais reserver, payer, modifier un calendrier externe, ni executer d'action irreversible.
Tu dois retourner les avertissements et la provenance (meteo live, donnees demo, estimations).
```

### Limites explicites

- Cette couche **n'importe pas Automaton** : elle prepare seulement un contrat local stable.
- Les POI restent des donnees de demonstration (`lib/demo-data.ts`).
- Les couts et durees de visite sont des estimations.
- Seule la meteo est live (Open-Meteo) et peut etre indisponible.

## Demarrer en local

```bash
npm install
npm run dev
```


## Roadmap V2 (benchmark contre des projets comparables)

Comparaison avec des planificateurs de voyage open source existants (notamment `itskovacs/trip`) pour reperer ce qui manque encore ici :

- **Details de lieu enrichis** : horaires d'ouverture, note, photos, contact -- on a le nom et l'adresse via TomTom, pas encore ces details.
- **Routes entre etapes** : calcul d'itineraire reel entre chaque etape (on a la duree de deplacement estimee, pas le trajet trace).
- **Budget avec estimation par poste** : on a un cout total, pas encore une ventilation par categorie.
- **Exigences visa/voyage** : pertinent pour la fonctionnalite trajet longue distance deja prevue dans la spec, pas encore dans le MVP.
- **Liste de bagages / checklist pre-depart** : absent du MVP actuel, faible cout d'implementation.
- **Export vers Google Maps** : permettrait de sortir le scenario construit vers une vraie navigation.

Aucun de ces points n'est urgent pour le MVP actuel (voir section 7 de la spec produit), mais ils donnent un ordre de priorite concret pour la V2 plutot que de repartir de zero sur les idees.
