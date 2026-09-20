export type WeatherResult = {
  city: string
  latitude: number
  longitude: number
  temperatureC: number
  condition: string
  windKmh: number
}

const WEATHER_CODE_LABEL: Record<number, string> = {
  0: "Ciel degage",
  1: "Plutot degage",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine legere",
  53: "Bruine",
  55: "Bruine dense",
  61: "Pluie legere",
  63: "Pluie",
  65: "Pluie forte",
  71: "Neige legere",
  73: "Neige",
  75: "Neige forte",
  80: "Averses",
  95: "Orage",
}

export async function fetchWeatherForCity(city: string): Promise<WeatherResult> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`
  )
  if (!geoRes.ok) throw new Error("Geocodage indisponible pour le moment.")
  const geoData = await geoRes.json()
  const place = geoData?.results?.[0]
  if (!place) throw new Error(`Ville introuvable : ${city}`)

  const { latitude, longitude, name } = place

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m`
  )
  if (!forecastRes.ok) throw new Error("Prevision meteo indisponible pour le moment.")
  const forecastData = await forecastRes.json()
  const current = forecastData?.current
  if (!current) throw new Error("Donnees meteo incompletes.")

  return {
    city: name,
    latitude,
    longitude,
    temperatureC: Math.round(current.temperature_2m),
    condition: WEATHER_CODE_LABEL[current.weather_code] ?? "Conditions inconnues",
    windKmh: Math.round(current.wind_speed_10m),
  }
}
