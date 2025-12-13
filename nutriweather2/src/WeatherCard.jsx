import React, { useEffect, useState } from "react";

const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

export default function WeatherCard({ onWeatherUpdate }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // 檢查 API Key
    if (!API_KEY) {
      setError("⚠ 找不到 OpenWeather API Key");
      setLoading(false);
      return;
    }

    // 檢查瀏覽器定位支援
    if (!navigator.geolocation) {
      setError("⚠ 瀏覽器不支援定位");
      setLoading(false);
      return;
    }

    // 取得定位並抓取天氣
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("⚠ 無法取得定位，請允許權限");
        setLoading(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("取得天氣資料失敗");

      const data = await res.json();

      // 整理資料格式
      const weatherObj = {
        name: data.name,
        temp: Math.round(data.main?.temp),
        desc: data.weather?.[0]?.description,
        humidity: data.main?.humidity ?? "—",
        wind: data.wind?.speed ?? "—",
      };

      // 更新畫面顯示
      setWeather(weatherObj);

      // 🔥 關鍵修改：存入 LocalStorage 並發送廣播事件
      localStorage.setItem("nutriWeather_current", JSON.stringify(weatherObj));
      window.dispatchEvent(new Event("weatherDataUpdated")); // 📢 廣播：天氣更新了！

      // 為了相容性，原本的回報給 App 也留著 (雖然你不一定會用到)
      if (onWeatherUpdate) {
        onWeatherUpdate(weatherObj);
      }

    } catch (err) {
      setError("⚠ 取得天氣資料錯誤");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weather-card card" style={{ marginBottom: '20px' }}>
      <h3>今日天氣</h3>

      {loading && <p>⏳ 正在取得天氣資料…</p>}

      {error && (
        <p style={{ color: "#b91c1c", marginTop: "8px" }}>{error}</p>
      )}

      {!loading && !error && weather && (
        <>
          <p style={{ margin: "4px 0", fontSize: "1rem" }}>
            <strong>📍 {weather.name}</strong>　|　{weather.desc}
          </p>
          <p style={{ margin: "4px 0", fontSize: "0.95rem", color: "#3f5974" }}>
            🌡 溫度：{weather.temp}°C　|　
            💧 濕度：{weather.humidity}%
          </p>
        </>
      )}
    </div>
  );
}