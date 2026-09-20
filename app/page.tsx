"use client"

import { useState } from "react"
import { MapPin, Clock, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DEMO_CITIES } from "@/lib/demo-data"
import { analyzeScenario, type ScenarioResult, type ScenarioMode } from "@/lib/scenario-engine"
import { fetchWeatherForCity, type WeatherResult } from "@/lib/weather"
import { ScenarioResults } from "@/components/scenario-results"

const DURATIONS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "Demi-journee", minutes: 240 },
  { label: "Journee", minutes: 480 },
]

export default function Home() {
  const [durationMinutes, setDurationMinutes] = useState(120)
  const [city, setCity] = useState("Paris")
  const [mode, setMode] = useState<ScenarioMode>("equilibre")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const availableCities = Object.keys(DEMO_CITIES)

  async function handleSubmit() {
    setLoading(true)
    setWeatherError(null)
    const candidates = DEMO_CITIES[city] ?? []
    const scenario = analyzeScenario({ durationMinutes, city, mode }, candidates)
    setResult(scenario)

    try {
      const w = await fetchWeatherForCity(city)
      setWeather(w)
    } catch (err) {
      setWeather(null)
      setWeatherError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2c7a68] text-white">
          <Compass size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Time &amp; Travel Companion</h1>
        <p className="mt-1 text-sm text-slate-500">Transforme ton temps libre en scenario de sortie realisable.</p>
      </header>

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_50px_-28px_rgba(15,23,42,.35)]">
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Clock size={15} /> J&apos;ai du temps
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDurationMinutes(d.minutes)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                  durationMinutes === d.minutes
                    ? "border-[#2c7a68] bg-[#2c7a68]/10 text-[#2c7a68]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <MapPin size={15} /> Je suis ici
          </label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" />
          <p className="mt-1.5 text-xs text-slate-400">
            Lieux reels (POI + bornes de recharge via TomTom Maps) disponibles pour : {availableCities.join(", ")}. Cout et duree de visite restent estimes. La meteo fonctionne pour
            n&apos;importe quelle ville reelle.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "equilibre", label: "Equilibre" },
                { value: "economique", label: "Economique" },
              ] as const
            ).map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m.value
                    ? "border-[#4676b8] bg-[#4676b8]/10 text-[#4676b8]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full bg-[#2c7a68] text-white hover:bg-[#2c7a68]/90" onClick={handleSubmit} disabled={loading}>
          {loading ? "Construction en cours..." : "Construire mon scenario"}
        </Button>
      </section>

      {result && (
        <section className="mt-6">
          <ScenarioResults result={result} weather={weather} weatherError={weatherError} />
        </section>
      )}
    </main>
  )
}
