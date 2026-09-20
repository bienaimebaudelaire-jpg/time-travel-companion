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
  1: "#2c7a68",
  2: "#4676b8",
  3: "#b8862d",
  4: "#667085",
}

export function ScenarioResults({ result, weather, weatherError }: { result: ScenarioResult; weather: WeatherResult | null; weatherError: string | null }) {
  if (!result.feasible) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Aucun scenario ne rentre dans ce temps.</p>
        <p className="mt-1">{result.reason}</p>
      </div>
    )
  }

  const usedRatio = Math.min(100, Math.round((result.totalDurationMinutes / result.availableMinutes) * 100))

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-22px_rgba(15,23,42,.4)]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Wallet size={16} style={{ color: "#2c7a68" }} /> {result.totalCost.toFixed(2)} EUR au total
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Clock size={16} style={{ color: "#4676b8" }} /> {result.totalDurationMinutes} min sur {result.availableMinutes} min disponibles
          </div>
          {weather && (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Cloud size={16} style={{ color: "#4676b8" }} /> {weather.city} : {weather.temperatureC} degres C, {weather.condition}
            </div>
          )}
          {weatherError && <div className="text-sm text-amber-700">Meteo indisponible : {weatherError}</div>}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#2c7a68] transition-all" style={{ width: `${usedRatio}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Marge de securite reservee pour le retour : {result.marginMinutes} min.
        </p>
      </div>

      <ol className="space-y-3">
        {result.steps.map((step) => (
          <li key={`${step.order}-${step.name}`} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {step.order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-800">{step.name}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{TYPE_LABEL[step.type]}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
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

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs leading-relaxed text-slate-500">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
          <Sparkles size={13} /> Comment ce scenario est construit ?
        </p>
        Le moteur choisit uniquement parmi les etapes disponibles pour la ville selectionnee et ne fabrique jamais un
        prix, un horaire ou une disponibilite absent de la source. Les lieux et bornes de recharge ci-dessus
        proviennent d\'une recherche live TomTom Maps ; la meteo provient d\'Open-Meteo. Le cout et la duree de
        visite restent des estimations tant qu\'une source de prix dediee n\'est pas branchee.
      </div>
    </div>
  )
}
