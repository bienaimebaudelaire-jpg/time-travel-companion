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


## Roadmap V2 (benchmark contre des projets comparables)

Comparaison avec des planificateurs de voyage open source existants (notamment `itskovacs/trip`) pour reperer ce qui manque encore ici :

- **Details de lieu enrichis** : horaires d'ouverture, note, photos, contact -- on a le nom et l'adresse via TomTom, pas encore ces details.
- **Routes entre etapes** : calcul d'itineraire reel entre chaque etape (on a la duree de deplacement estimee, pas le trajet trace).
- **Budget avec estimation par poste** : on a un cout total, pas encore une ventilation par categorie.
- **Exigences visa/voyage** : pertinent pour la fonctionnalite trajet longue distance deja prevue dans la spec, pas encore dans le MVP.
- **Liste de bagages / checklist pre-depart** : absent du MVP actuel, faible cout d'implementation.
- **Export vers Google Maps** : permettrait de sortir le scenario construit vers une vraie navigation.

Aucun de ces points n'est urgent pour le MVP actuel (voir section 7 de la spec produit), mais ils donnent un ordre de priorite concret pour la V2 plutot que de repartir de zero sur les idees.

## Integration NVIDIA OpenShell (optionnelle)

Le module serveur `lib/openshell.ts` encapsule le CLI OpenShell sans passer par un shell systeme. Il permet de creer, lister et supprimer des sandboxes, ou d'executer une commande de composition dans une sandbox existante. Le CLI `openshell` doit etre installe et configure separement (Docker, Podman ou virtualisation locale selon la plateforme) ; cette integration n'est pas requise pour lancer l'application.

```ts
import { runOpenShellScenarioCommand } from "@/lib/openshell"

const result = await runOpenShellScenarioCommand({
  action: "compose",
  sandbox: "planner",
  command: ["scenario-agent", "compose", "--city", "Paris", "--duration", "120"],
})
console.log(result.stdout)
```

`scenario-agent` est une commande fournie par l'image de sandbox choisie, pas par ce projet. Le sandbox OpenShell par defaut est minimal et ne contient pas cet agent : fournissez une image adaptee avec `from` lors de sa creation, ou installez-y l'agent au prealable. Le wrapper transmet chaque argument separement, limite le temps d'execution a 30 secondes et la sortie a 1 Mio par defaut. Le CLI est injectable avec `OPENSHELL_CLI` si son executable n'est pas dans le `PATH`.

Exemples de gestion d'une sandbox :

```ts
await runOpenShellScenarioCommand({
  action: "create",
  name: "planner",
  from: "registry.example/scenario-agent:latest",
})
const sandboxes = await runOpenShellScenarioCommand({ action: "list" })
await runOpenShellScenarioCommand({ action: "delete", sandbox: "planner" })
```

Le SDK TypeScript officiel `@nvidia/openshell-sdk` est declare comme dependance optionnelle. Il est distribue via GitHub Packages (registre `https://npm.pkg.github.com`) et necessite un jeton GitHub avec `read:packages`; sans ce SDK, le wrapper CLI reste utilisable. Ne placez jamais le jeton dans le depot.
