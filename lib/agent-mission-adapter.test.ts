import { describe, expect, it } from "vitest"
import { runPlanningMission } from "./agent-mission-adapter"

describe("runPlanningMission", () => {
  it("retourne un resultat propositionnel sans action irreversible", async () => {
    const result = await runPlanningMission(
      {
        missionId: "m-1",
        mode: "proposition",
        input: {
          availableMinutes: 120,
          city: "Paris",
          mode: "equilibre",
          constraints: { transportMode: "pied" },
        },
      },
      {
        getWeather: async () => ({
          city: "Paris",
          latitude: 48.85,
          longitude: 2.35,
          temperatureC: 20,
          condition: "Ciel degage",
          windKmh: 9,
        }),
      }
    )

    expect(result.mode).toBe("proposition")
    expect(result.noIrreversibleActions).toBe(true)
    expect(result.proposedActions.length).toBeGreaterThan(0)
    expect(result.proposedActions.every((a) => a.irreversible === false && a.executeAutomatically === false)).toBe(true)
    expect(result.sources.some((s) => s.kind === "weather_live")).toBe(true)
    expect(result.warnings.some((w) => w.code === "DEMO_DATA_USED")).toBe(true)
    expect(result.warnings.some((w) => w.code === "ESTIMATED_VALUES")).toBe(true)
  })

  it("signale l'indisponibilite meteo sans reseau", async () => {
    const result = await runPlanningMission(
      {
        mode: "proposition",
        input: {
          availableMinutes: 120,
          city: "Paris",
          mode: "equilibre",
          constraints: { transportMode: "pied" },
        },
      },
      {
        getWeather: async () => {
          throw new Error("offline")
        },
      }
    )

    expect(result.weather).toBeNull()
    expect(result.warnings.some((w) => w.code === "WEATHER_UNAVAILABLE")).toBe(true)
    expect(result.sources.some((s) => s.kind === "weather_live")).toBe(false)
  })

  it("ajoute un avertissement quand un plafond de cout est depasse", async () => {
    const result = await runPlanningMission(
      {
        mode: "proposition",
        input: {
          availableMinutes: 240,
          city: "Lyon",
          mode: "equilibre",
          constraints: { transportMode: "pied", maxCostEur: 5 },
        },
      },
      {
        getWeather: async () => ({
          city: "Lyon",
          latitude: 45.75,
          longitude: 4.85,
          temperatureC: 18,
          condition: "Couvert",
          windKmh: 7,
        }),
      }
    )

    expect(result.scenario.feasible).toBe(true)
    expect(result.warnings.some((w) => w.code === "MAX_COST_EXCEEDED")).toBe(true)
  })
})
