const OPENWEATHER_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

export async function getWeatherByCity(city) {
  const params = new URLSearchParams({
    q: city,
    appid: OPENWEATHER_KEY,
    units: "metric",
    lang: "zh_tw",
  });

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
  );
  if (!res.ok) throw new Error("取得天氣失敗");

  const data = await res.json();
  return {
    temp: data.main.temp,
    description: data.weather?.[0]?.description || "",
    humidity: data.main.humidity,
  };
}
