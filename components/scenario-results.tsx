"use client"

import { Cloud, MapPin, Wallet, Clock, ShieldCheck, Sparkles } from "lucide-react"
import type { ScenarioResult } from "@/lib/scenario-engine"
import type { WeatherResult } from "@/lib/weather"

const TYPE_LABEL: Record<string, string> = {
  activite: "Activite",
  repas: "Repas",
  pause: "Pause",
  deplacement: "Deplacement",
}

const LEVEL_LABEL: Record<number, string> = {
  1: "Officiel",
  2: "Institutionnel",
  3: "Partenaire",
  4: "Agregateur",
}

const LEVEL_COLOR: Record<number, string> = {
  1: "var(--harbor)",
  2: "var(--coral)",
  3: "var(--gold)",
  4: "var(--ink-soft)",
}

export function ScenarioResults({ result, weather, weatherError }: { result: ScenarioResult; weather: WeatherResult | null; weatherError: string | null }) {
  if (!result.feasible) {
    return (
      <div className="border border-[var(--coral)]/40 bg-[var(--coral)]/10 p-6 text-sm text-[var(--ink)]">
        <p className="font-semibold">Aucun scenario ne rentre dans ce temps.</p>
        <p className="mt-1">{result.reason}</p>
      </div>
    )
  }

  const usedRatio = Math.min(100, Math.round((result.totalDurationMinutes / result.availableMinutes) * 100))

  return (
    <div className="space-y-4">
      <div className="bg-[var(--ticket)] p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="font-board flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Wallet size={15} style={{ color: "var(--harbor)" }} /> {result.totalCost.toFixed(2)} EUR
          </div>
          <div className="font-board flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Clock size={15} style={{ color: "var(--coral)" }} /> {result.totalDurationMinutes} / {result.availableMinutes} min
          </div>
          {weather && (
            <div className="font-board flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <Cloud size={15} style={{ color: "var(--harbor)" }} /> {weather.city} : {weather.temperatureC}&deg;C, {weather.condition}
            </div>
          )}
          {weatherError && <div className="text-sm text-[var(--coral)]">Meteo indisponible : {weatherError}</div>}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden bg-[var(--ticket-line)]">
          <div className="h-full bg-[var(--coral)] transition-all" style={{ width: `${usedRatio}%` }} />
        </div>
        <p className="mt-2 text-xs text-[var(--ink-soft)]">
          Marge de securite reservee pour le retour : {result.marginMinutes} min.
        </p>
      </div>

      <ol className="space-y-0">
        {result.steps.map((step, i) => (
          <li key={`${step.order}-${step.name}`} className={`flex gap-4 bg-[var(--ticket)] p-4 ${i > 0 ? "ticket-perforation" : ""}`}>
            <div className="font-board flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--ticket-line)] text-sm font-semibold text-[var(--harbor)]">
              {step.order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-[var(--ink)]">{step.name}</p>
                <span className="font-board border border-[var(--ticket-line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">{TYPE_LABEL[step.type]}</span>
              </div>
              <div className="font-board mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-soft)]">
                <span>{step.durationMinutes} min</span>
                <span>{step.cost > 0 ? `${step.cost.toFixed(2)} EUR` : "Gratuit"}</span>
                <span className="inline-flex items-center gap-1 font-medium" style={{ color: LEVEL_COLOR[step.source.level] }}>
                  <ShieldCheck size={12} /> {LEVEL_LABEL[step.source.level]} - {step.source.name}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="bg-[var(--harbor)] p-5 text-xs leading-relaxed text-[var(--ticket)]/80">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--ticket)]">
          <Sparkles size={13} /> Comment ce scenario est construit ?
        </p>
        Le moteur choisit uniquement parmi les etapes disponibles pour la ville selectionnee et ne fabrique jamais un
        prix, un horaire ou une disponibilite absent de la source. Les lieux et bornes de recharge ci-dessus
        proviennent d&rsquo;une recherche live TomTom Maps ; la meteo provient d&rsquo;Open-Meteo. Le cout et la duree de
        visite restent des estimations tant qu&rsquo;une source de prix dediee n&rsquo;est pas branchee.
      </div>
    </div>
  )
}
