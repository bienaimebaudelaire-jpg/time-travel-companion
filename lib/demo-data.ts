// Donnees de demonstration -- a remplacer par un vrai connecteur POI
// (ex. OpenStreetMap Overpass) avant tout usage en production.
// Aucune de ces valeurs ne doit etre consideree comme un prix ou un horaire reel a jour.

export type StepType = "activite" | "repas" | "pause" | "deplacement"

export type SourceLevel = 1 | 2 | 3 | 4

export type CandidateStep = {
  name: string
  type: StepType
  durationMinutes: number
  cost: number
  source: { name: string; level: SourceLevel; url?: string }
}

export const DEMO_CITIES: Record<string, CandidateStep[]> = {
  Paris: [
    { name: "Musee d'Orsay", type: "activite", durationMinutes: 90, cost: 16, source: { name: "Musee d'Orsay (site officiel, donnee demo)", level: 1 } },
    { name: "Jardin du Luxembourg", type: "activite", durationMinutes: 45, cost: 0, source: { name: "Ville de Paris (donnee demo)", level: 2 } },
    { name: "Cafe de Flore", type: "repas", durationMinutes: 60, cost: 22, source: { name: "Agregateur avis (donnee demo)", level: 4 } },
    { name: "Marche des Enfants Rouges", type: "repas", durationMinutes: 40, cost: 12, source: { name: "Office de tourisme Paris (donnee demo)", level: 2 } },
    { name: "Pause Seine, Pont des Arts", type: "pause", durationMinutes: 20, cost: 0, source: { name: "Ville de Paris (donnee demo)", level: 2 } },
    { name: "Trajet metro centre-ville", type: "deplacement", durationMinutes: 15, cost: 2.15, source: { name: "RATP (donnee demo)", level: 1 } },
  ],
  Lyon: [
    { name: "Basilique de Fourviere", type: "activite", durationMinutes: 60, cost: 0, source: { name: "Office de tourisme Lyon (donnee demo)", level: 2 } },
    { name: "Musee des Confluences", type: "activite", durationMinutes: 90, cost: 9, source: { name: "Musee des Confluences (donnee demo)", level: 1 } },
    { name: "Bouchon lyonnais Vieux Lyon", type: "repas", durationMinutes: 60, cost: 20, source: { name: "Agregateur avis (donnee demo)", level: 4 } },
    { name: "Halles de Lyon Paul Bocuse", type: "repas", durationMinutes: 40, cost: 14, source: { name: "Halles de Lyon (donnee demo)", level: 2 } },
    { name: "Pause Parc de la Tete d'Or", type: "pause", durationMinutes: 20, cost: 0, source: { name: "Ville de Lyon (donnee demo)", level: 2 } },
    { name: "Trajet metro/funiculaire", type: "deplacement", durationMinutes: 12, cost: 2.0, source: { name: "TCL (donnee demo)", level: 1 } },
  ],
}
