import { analyzeScenario, type ScenarioMode, type ScenarioResult, type TransportMode } from "./scenario-engine"
import { getCandidatesForCity } from "./demo-data"
import { fetchWeatherForCity, type WeatherResult } from "./weather"

export type PlanningConstraints = {
  transportMode: TransportMode
  maxCostEur?: number
}

export type PlanningMissionInput = {
  availableMinutes: number
  city: string
  mode: ScenarioMode
  constraints: PlanningConstraints
}

export type PlanningMissionRequest = {
  missionId?: string
  mode: "proposition"
  input: PlanningMissionInput
}

export type PlanningMissionWarning = {
  code:
    | "SCENARIO_WARNING"
    | "SCENARIO_INFEASIBLE"
    | "WEATHER_UNAVAILABLE"
    | "DEMO_DATA_USED"
    | "ESTIMATED_VALUES"
    | "MAX_COST_EXCEEDED"
  message: string
}

export type PlanningMissionSource = {
  kind: "weather_live" | "poi_demo_data" | "estimation"
  detail: string
}

export type PlanningMissionAction = {
  id: "review_scenario" | "check_weather" | "manual_booking_only" | "manual_calendar_update"
  description: string
  irreversible: false
  executeAutomatically: false
}

export type PlanningMissionResponse = {
  missionId?: string
  mode: "proposition"
  scenario: ScenarioResult
  weather: WeatherResult | null
  sources: PlanningMissionSource[]
  warnings: PlanningMissionWarning[]
  proposedActions: PlanningMissionAction[]
  noIrreversibleActions: true
}

type Dependencies = {
  getWeather?: (city: string) => Promise<WeatherResult>
}

export async function runPlanningMission(
  request: PlanningMissionRequest,
  deps: Dependencies = {}
): Promise<PlanningMissionResponse> {
  const candidates = getCandidatesForCity(request.input.city) ?? []
  const scenario = analyzeScenario(
    {
      durationMinutes: request.input.availableMinutes,
      city: request.input.city,
      mode: request.input.mode,
      transportMode: request.input.constraints.transportMode,
    },
    candidates
  )

  const warnings: PlanningMissionWarning[] = []
  if (!scenario.feasible && scenario.reason) {
    warnings.push({ code: "SCENARIO_INFEASIBLE", message: scenario.reason })
  }
  if (scenario.warning) {
    warnings.push({ code: "SCENARIO_WARNING", message: scenario.warning })
  }
  if (
    typeof request.input.constraints.maxCostEur === "number" &&
    scenario.feasible &&
    scenario.totalCost > request.input.constraints.maxCostEur
  ) {
    warnings.push({
      code: "MAX_COST_EXCEEDED",
      message: `Le scenario depasse le plafond de ${request.input.constraints.maxCostEur.toFixed(2)} EUR.`,
    })
  }

  warnings.push({
    code: "DEMO_DATA_USED",
    message: "Les POI du scenario proviennent de donnees de demonstration locales (TomTom capture prealablement).",
  })
  warnings.push({
    code: "ESTIMATED_VALUES",
    message: "Les couts et durees de visite des etapes sont des estimations.",
  })

  const getWeather = deps.getWeather ?? fetchWeatherForCity
  let weather: WeatherResult | null = null
  try {
    weather = await getWeather(request.input.city)
  } catch {
    warnings.push({
      code: "WEATHER_UNAVAILABLE",
      message: "Meteo live indisponible pour le moment; verifier manuellement avant execution reelle.",
    })
  }

  const sources: PlanningMissionSource[] = [
    {
      kind: "poi_demo_data",
      detail: "lib/demo-data.ts (POI de demonstration, verifies ponctuellement)",
    },
    {
      kind: "estimation",
      detail: "Couts et durees d'etapes estimes (pas de tarification live).",
    },
    ...(weather
      ? [{ kind: "weather_live" as const, detail: "Open-Meteo (meteo live, sans cle API)." }]
      : []),
  ]

  const proposedActions: PlanningMissionAction[] = [
    {
      id: "review_scenario",
      description: "Relire le scenario recommande et valider la faisabilite locale.",
      irreversible: false,
      executeAutomatically: false,
    },
    {
      id: "check_weather",
      description: "Confirmer la meteo juste avant le depart.",
      irreversible: false,
      executeAutomatically: false,
    },
    {
      id: "manual_booking_only",
      description: "Effectuer toute reservation/paiement manuellement apres validation humaine.",
      irreversible: false,
      executeAutomatically: false,
    },
    {
      id: "manual_calendar_update",
      description: "Mettre a jour un calendrier externe manuellement si necessaire.",
      irreversible: false,
      executeAutomatically: false,
    },
  ]

  return {
    missionId: request.missionId,
    mode: "proposition",
    scenario,
    weather,
    sources,
    warnings,
    proposedActions,
    noIrreversibleActions: true,
  }
}
