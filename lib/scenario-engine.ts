import type { CandidateStep, StepType } from "./demo-data"

export type ScenarioMode = "equilibre" | "economique"

export type TransportMode = "pied" | "transports" | "electrique"

export type ScenarioStep = CandidateStep & { order: number }

export type ScenarioResult = {
  steps: ScenarioStep[]
  totalDurationMinutes: number
  totalCost: number
  marginMinutes: number
  availableMinutes: number
  feasible: boolean
  reason?: string
  warning?: string
}

const SAFETY_MARGIN_RATIO = 0.18 // reserve ~18% of the available time for the return trip / unexpected delays

// A "pause" candidate in the demo data is always an EV charging stop (see lib/demo-data.ts):
// only relevant if the user actually travels by electric car.
function isStepCompatible(step: CandidateStep, transportMode: TransportMode): boolean {
  if (step.type === "pause") return transportMode === "electrique"
  return true
}

// Stacking more than one meal only makes sense once the outing spans half a day or more
// (lunch + dinner); below that, a second "repas" at the same time slot is never realistic.
function maxRepasFor(availableMinutes: number): number {
  return availableMinutes < 240 ? 1 : 2
}

// A meal is only guaranteed for outings of 2h or more; shorter trips have no realistic slot for one.
const REPAS_GUARANTEE_THRESHOLD_MINUTES = 120

function scoreStep(step: CandidateStep, mode: ScenarioMode): number {
  // Lower score = picked first. Economique prioritises cost per minute.
  // Equilibre balances cost per minute against a small bonus for variety (non-deplacement steps).
  const costPerMinute = step.cost / Math.max(step.durationMinutes, 1)
  if (mode === "economique") return costPerMinute
  const varietyBonus = step.type === "deplacement" ? 0.15 : 0
  return costPerMinute + varietyBonus
}

/**
 * Composes a realistic, feasible scenario out of candidate steps.
 * Never fabricates a step or a duration/cost that is not present in the candidate list:
 * if nothing fits, it returns feasible=false with an explicit reason rather than forcing a plan.
 */
export function analyzeScenario(
  input: { durationMinutes: number; city: string; mode: ScenarioMode; transportMode: TransportMode },
  candidates: CandidateStep[]
): ScenarioResult {
  const availableMinutes = input.durationMinutes
  const marginMinutes = Math.round(availableMinutes * SAFETY_MARGIN_RATIO)
  const budgetMinutes = availableMinutes - marginMinutes

  if (candidates.length === 0) {
    return {
      steps: [],
      totalDurationMinutes: 0,
      totalCost: 0,
      marginMinutes,
      availableMinutes,
      feasible: false,
      reason: `Aucune donnee disponible pour ${input.city} pour l'instant.`,
    }
  }

  const compatible = candidates.filter((c) => isStepCompatible(c, input.transportMode))

  if (compatible.length === 0) {
    return {
      steps: [],
      totalDurationMinutes: 0,
      totalCost: 0,
      marginMinutes,
      availableMinutes,
      feasible: false,
      reason: `Aucune etape compatible avec le mode de deplacement selectionne pour ${input.city}.`,
    }
  }

  if (budgetMinutes <= 0) {
    return {
      steps: [],
      totalDurationMinutes: 0,
      totalCost: 0,
      marginMinutes,
      availableMinutes,
      feasible: false,
      reason: "Le temps disponible est trop court une fois la marge de securite retiree.",
    }
  }

  const sorted = [...compatible].sort((a, b) => scoreStep(a, input.mode) - scoreStep(b, input.mode))

  const picked: CandidateStep[] = []
  let usedMinutes = 0
  let usedCost = 0
  let repasCount = 0
  const maxRepas = maxRepasFor(availableMinutes)

  const fits = (step: CandidateStep) => usedMinutes + step.durationMinutes <= budgetMinutes

  function pick(step: CandidateStep) {
    picked.push(step)
    usedMinutes += step.durationMinutes
    usedCost += step.cost
    if (step.type === "repas") repasCount++
  }

  // Guarantee at least one meal for outings of 2h or more, if one actually fits the remaining budget.
  let repasWarning: string | undefined
  if (availableMinutes >= REPAS_GUARANTEE_THRESHOLD_MINUTES) {
    const repasCandidates = sorted.filter((s) => s.type === "repas")
    const bestRepas = repasCandidates.find(fits)
    if (bestRepas) {
      pick(bestRepas)
    } else if (repasCandidates.length > 0) {
      repasWarning = "Aucun repas disponible ne rentre dans le temps restant apres la marge de securite."
    } else {
      repasWarning = `Aucune option de repas disponible pour ${input.city}.`
    }
  }

  if (input.mode === "equilibre") {
    // Equilibre favours a diverse mix of step types before repeating any single type.
    const remainingTypes: StepType[] = ["activite", "deplacement", "pause"]
    for (const type of remainingTypes) {
      const candidate = sorted.find((s) => s.type === type && !picked.includes(s) && fits(s))
      if (candidate) pick(candidate)
    }
  }

  // Fill the rest of the budget by score, cheapest/most balanced first, respecting the meal cap.
  for (const step of sorted) {
    if (picked.includes(step)) continue
    if (step.type === "repas" && repasCount >= maxRepas) continue
    if (fits(step)) pick(step)
  }

  if (picked.length === 0) {
    const shortest = Math.min(...compatible.map((c) => c.durationMinutes))
    return {
      steps: [],
      totalDurationMinutes: 0,
      totalCost: 0,
      marginMinutes,
      availableMinutes,
      feasible: false,
      reason: `Meme la plus courte etape disponible (${shortest} min) ne rentre pas dans le temps restant apres la marge de securite.`,
    }
  }

  // Order for readability: activite/repas/pause interleaved roughly by original discovery order, deplacement steps kept at natural transitions.
  const ordered = picked
    .sort((a, b) => candidates.indexOf(a) - candidates.indexOf(b))
    .map((step, index) => ({ ...step, order: index + 1 }))

  return {
    steps: ordered,
    totalDurationMinutes: usedMinutes,
    totalCost: Math.round(usedCost * 100) / 100,
    marginMinutes,
    availableMinutes,
    feasible: true,
    warning: repasWarning,
  }
}
