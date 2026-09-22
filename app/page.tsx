"use client"

import { useState } from "react"
import { MapPin, Clock, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DEMO_CITIES, getCandidatesForCity } from "@/lib/demo-data"
import { analyzeScenario, type ScenarioResult, type ScenarioMode, type TransportMode } from "@/lib/scenario-engine"
import { fetchWeatherForCity, type WeatherResult } from "@/lib/weather"
import { ScenarioResults } from "@/components/scenario-results"

const DURATIONS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "Demi-journee", minutes: 240 },
  { label: "Journee", minutes: 480 },
]

const TRANSPORT_MODES: { value: TransportMode; label: string }[] = [
  { value: "pied", label: "A pied" },
  { value: "transports", label: "Transports" },
  { value: "electrique", label: "Voiture electrique" },
]

export default function Home() {
  const [durationMinutes, setDurationMinutes] = useState(120)
  const [city, setCity] = useState("Paris")
  const [mode, setMode] = useState<ScenarioMode>("equilibre")
  const [transportMode, setTransportMode] = useState<TransportMode>("pied")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const availableCities = Object.keys(DEMO_CITIES)

  async function handleSubmit() {
    setLoading(true)
    setWeatherError(null)
    const candidates = getCandidatesForCity(city) ?? []
    const scenario = analyzeScenario({ durationMinutes, city, mode, transportMode }, candidates)
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
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center gap-3 text-[var(--ticket)]">
          <div className="flex h-11 w-11 items-center justify-center border-2 border-[var(--ticket)] text-[var(--ticket)]">
            <Compass size={20} />
          </div>
          <div>
            <p className="font-board text-[11px] uppercase tracking-[.2em] text-[var(--ticket)]/70">Carte d&rsquo;embarquement</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Time &amp; Travel Companion</h1>
          </div>
        </header>

        <section className="bg-[var(--ticket)] p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
                <Clock size={15} /> J&apos;ai du temps
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setDurationMinutes(d.minutes)}
                    className={`font-board border px-2 py-2 text-xs font-medium transition-colors ${
                      durationMinutes === d.minutes
                        ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)]"
                        : "border-[var(--ticket-line)] text-[var(--ink-soft)] hover:border-[var(--harbor)]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
                <MapPin size={15} /> Je suis ici
              </label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" className="border-[var(--ticket-line)] bg-white/60" />
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--ink-soft)]">
            Lieux reels (POI + bornes de recharge via TomTom Maps) disponibles pour : {availableCities.join(", ")}. Cout et duree de visite restent estimes. La meteo fonctionne pour
            n&apos;importe quelle ville reelle.
          </p>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">Mode</label>
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
                  className={`font-board border px-3 py-2 text-sm font-medium transition-colors ${
                    mode === m.value
                      ? "border-[var(--harbor)] bg-[var(--harbor)]/10 text-[var(--harbor)]"
                      : "border-[var(--ticket-line)] text-[var(--ink-soft)] hover:border-[var(--harbor)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">Je me deplace en</label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSPORT_MODES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTransportMode(t.value)}
                  className={`font-board border px-2 py-2 text-xs font-medium transition-colors ${
                    transportMode === t.value
                      ? "border-[var(--harbor)] bg-[var(--harbor)]/10 text-[var(--harbor)]"
                      : "border-[var(--ticket-line)] text-[var(--ink-soft)] hover:border-[var(--harbor)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Les etapes de recharge ne sont proposees que si vous vous deplacez en voiture electrique.
            </p>
          </div>

          <div className="ticket-perforation mt-8 pt-6">
            <Button
              className="w-full bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Construction en cours..." : "Construire mon scenario"}
            </Button>
          </div>
        </section>

        {result && (
          <section className="mt-6">
            <ScenarioResults result={result} weather={weather} weatherError={weatherError} />
          </section>
        )}
      </div>
    </main>
  )
}
