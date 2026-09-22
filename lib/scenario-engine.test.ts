import { describe, expect, it } from "vitest"
import { analyzeScenario } from "./scenario-engine"
import { DEMO_CITIES, getCandidatesForCity } from "./demo-data"

describe("analyzeScenario - Paris, 2h, sans vehicule electrique", () => {
  const input = { durationMinutes: 120, city: "Paris", mode: "equilibre" as const, transportMode: "pied" as const }

  it("ne propose jamais d'etape de recharge quand l'utilisateur n'a pas declare de VE", () => {
    const result = analyzeScenario(input, DEMO_CITIES.Paris)
    expect(result.feasible).toBe(true)
    expect(result.steps.some((s) => s.type === "pause")).toBe(false)
  })

  it("inclut au moins une etape repas puisque la duree disponible est >= 120 min et qu'un repas rentre dans le budget", () => {
    const result = analyzeScenario(input, DEMO_CITIES.Paris)
    expect(result.feasible).toBe(true)
    expect(result.steps.filter((s) => s.type === "repas")).toHaveLength(1)
  })

  it("ne selectionne jamais deux repas pour une sortie de moins de 4h", () => {
    const economique = analyzeScenario({ ...input, mode: "economique" }, DEMO_CITIES.Paris)
    expect(economique.steps.filter((s) => s.type === "repas").length).toBeLessThanOrEqual(1)
  })
})

describe("analyzeScenario - VE autorise la recharge", () => {
  it("peut inclure une etape de recharge quand l'utilisateur se deplace en voiture electrique", () => {
    const result = analyzeScenario(
      { durationMinutes: 240, city: "Paris", mode: "equilibre", transportMode: "electrique" },
      DEMO_CITIES.Paris
    )
    expect(result.feasible).toBe(true)
    expect(result.steps.some((s) => s.type === "pause")).toBe(true)
  })
})

describe("analyzeScenario - casse et accents de la ville", () => {
  it("resout 'paris' en minuscules vers les memes candidats que 'Paris'", () => {
    expect(getCandidatesForCity("paris")).toBe(DEMO_CITIES.Paris)
    expect(getCandidatesForCity("  PARIS  ")).toBe(DEMO_CITIES.Paris)
  })

  it("retourne undefined pour une ville inconnue", () => {
    expect(getCandidatesForCity("Marseille")).toBeUndefined()
  })
})

describe("analyzeScenario - budget trop court", () => {
  it("retourne feasible=false avec une raison explicite quand rien ne rentre dans le temps restant", () => {
    const result = analyzeScenario(
      { durationMinutes: 5, city: "Paris", mode: "equilibre", transportMode: "pied" },
      DEMO_CITIES.Paris
    )
    expect(result.feasible).toBe(false)
    expect(result.reason).toBeTruthy()
    expect(result.steps).toHaveLength(0)
  })

  it("explique pourquoi aucun repas n'a pu etre inclus si aucun candidat repas ne rentre dans le budget", () => {
    const candidates = [
      { name: "Petite balade", type: "activite" as const, durationMinutes: 20, cost: 0, source: { name: "test", level: 3 as const } },
      { name: "Grand repas", type: "repas" as const, durationMinutes: 150, cost: 20, source: { name: "test", level: 3 as const } },
    ]
    const result = analyzeScenario(
      { durationMinutes: 130, city: "VilleTest", mode: "equilibre", transportMode: "pied" },
      candidates
    )
    expect(result.feasible).toBe(true)
    expect(result.steps.some((s) => s.type === "repas")).toBe(false)
    expect(result.warning).toBeTruthy()
  })
})

describe("analyzeScenario - differenciation reelle des modes", () => {
  const candidates = [
    { name: "Activite gratuite A", type: "activite" as const, durationMinutes: 30, cost: 0, source: { name: "test", level: 3 as const } },
    { name: "Activite gratuite B", type: "activite" as const, durationMinutes: 30, cost: 0, source: { name: "test", level: 3 as const } },
    { name: "Trajet couteux", type: "deplacement" as const, durationMinutes: 10, cost: 5, source: { name: "test", level: 3 as const } },
    { name: "Repas", type: "repas" as const, durationMinutes: 30, cost: 10, source: { name: "test", level: 3 as const } },
  ]
  const base = { durationMinutes: 120, city: "VilleTest", transportMode: "pied" as const }

  it("economique privilegie le cout minimal (evite le trajet couteux au profit d'une 2e activite gratuite)", () => {
    const result = analyzeScenario({ ...base, mode: "economique" }, candidates)
    expect(result.steps.some((s) => s.type === "deplacement")).toBe(false)
    expect(result.steps.filter((s) => s.type === "activite")).toHaveLength(2)
  })

  it("equilibre privilegie la diversite des types d'etapes (inclut le trajet malgre son cout)", () => {
    const result = analyzeScenario({ ...base, mode: "equilibre" }, candidates)
    expect(result.steps.some((s) => s.type === "deplacement")).toBe(true)
  })

  it("les deux modes produisent des scenarios differents pour un meme jeu de candidats", () => {
    const economique = analyzeScenario({ ...base, mode: "economique" }, candidates)
    const equilibre = analyzeScenario({ ...base, mode: "equilibre" }, candidates)
    expect(economique.totalCost).not.toBe(equilibre.totalCost)
  })
})
