// Donnees POI recuperees via le connecteur TomTom Maps (recherche live, le 2026-09-20).
// Musees, restaurants et bornes de recharge reels avec adresse. Cout et duree de visite restent
// estimes (TomTom ne fournit ni prix ni duree de visite) : traiter ces deux champs comme
// approximatifs jusqu'a branchement d'une source de prix dediee (site de l'etablissement).

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
    { name: "Galerie du Haut Pave (3 Quai de Montebello)", type: "activite", durationMinutes: 40, cost: 0, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3 } },
    { name: "Cybele, librairie-galerie (65 Rue Galande)", type: "activite", durationMinutes: 30, cost: 0, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3 } },
    { name: "Rose Monde (6 Parvis Notre-Dame)", type: "repas", durationMinutes: 55, cost: 18, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3 } },
    { name: "Food & Cafe (6 Parvis Notre-Dame)", type: "repas", durationMinutes: 35, cost: 11, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3 } },
    { name: "Recharge TEVGO, 4 Quai du Marche Neuf (Type 2 / CCS / Chademo)", type: "pause", durationMinutes: 25, cost: 0, source: { name: "TomTom Maps EV Search, disponibilite en temps reel au moment de la requete", level: 2 } },
    { name: "Trajet metro centre-ville", type: "deplacement", durationMinutes: 15, cost: 2.15, source: { name: "RATP (tarif estime)", level: 2 } },
  ],
  Lyon: [
    { name: "Musee de l'Imprimerie de Lyon (13 Rue de la Poulaillerie)", type: "activite", durationMinutes: 70, cost: 8, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3, url: "https://www.imprimerie.lyon.fr/imprimerie/" } },
    { name: "APN Gallery (33 Rue de la Republique)", type: "activite", durationMinutes: 30, cost: 0, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3, url: "http://www.apngallery.com" } },
    { name: "Chez Basset, pizzeria (18 Rue de la Republique)", type: "repas", durationMinutes: 50, cost: 16, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3, url: "http://chezbasset.com" } },
    { name: "Charcuterie Bonnard (36 Rue Grenette)", type: "repas", durationMinutes: 35, cost: 13, source: { name: "TomTom Maps, POI verifie le 2026-09-20", level: 3, url: "http://www.charcuteriebonnard.fr" } },
    { name: "Recharge E-Totem, 2 Quai Saint-Antoine (46 bornes disponibles au moment de la requete)", type: "pause", durationMinutes: 20, cost: 0, source: { name: "TomTom Maps EV Search, disponibilite en temps reel au moment de la requete", level: 2 } },
    { name: "Trajet metro/funiculaire", type: "deplacement", durationMinutes: 12, cost: 2.0, source: { name: "TCL (tarif estime)", level: 2 } },
  ],
}
