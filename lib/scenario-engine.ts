import type { CandidateStep } from "./demo-data"

export type ScenarioMode = "equilibre" | "economique"

export type ScenarioStep = CandidateStep & { order: number }

export type ScenarioResult = {
  steps: ScenarioStep[]
  totalDurationMinutes: number
  totalCost: number
  marginMinutes: number
  availableMinutes: number
  feasible: boolean
  reason?: string
}

const SAFETY_MARGIN_RATIO = 0.18 // reserve ~18% of the available time for the return trip / unexpected delays

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
  input: { durationMinutes: number; city: string; mode: ScenarioMode },
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

  const sorted = [...candidates].sort((a, b) => scoreStep(a, input.mode) - scoreStep(b, input.mode))

  const picked: CandidateStep[] = []
  let usedMinutes = 0
  let usedCost = 0

  for (const step of sorted) {
    if (usedMinutes + step.durationMinutes <= budgetMinutes) {
      picked.push(step)
      usedMinutes += step.durationMinutes
      usedCost += step.cost
    }
  }

  if (picked.length === 0) {
    const shortest = Math.min(...candidates.map((c) => c.durationMinutes))
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
  }
}
