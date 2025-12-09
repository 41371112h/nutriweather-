import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import WeatherCard from "./WeatherCard";
import PersonalForm from "./PersonalForm";
import TodayRecipeRecommend from "./TodayRecipeRecommend";
import GeminiChat from "./GeminiChatFloating"; // 引入懸浮球

import reportWebVitals from "./reportWebVitals";
import NutritionAnalyzer from "./NutritionAnalyzer";

const nutritionRoot = document.getElementById("nutrition-root");

if (nutritionRoot) {
  ReactDOM.createRoot(nutritionRoot).render(
    <React.StrictMode>
      <NutritionAnalyzer />
    </React.StrictMode>
  );
}

// ---------------- Root #1：主應用程式 (首頁用) ----------------
// 包含：App 主畫面 + 懸浮聊天室
const mainRoot = document.getElementById("root");
if (mainRoot) {
  ReactDOM.createRoot(mainRoot).render(
    <>
      <App />
      <GeminiChat /> {/* 首頁的懸浮球 */}
    </>
  );
}

// ---------------- Root #2：WeatherCard -------------------
const weatherRoot = document.getElementById("weather-root");
if (weatherRoot) {
  ReactDOM.createRoot(weatherRoot).render(<WeatherCard />);
}

// ---------------- Root #3：PersonalForm -------------------
const personalRoot = document.getElementById("personal-root");
if (personalRoot) {
  ReactDOM.createRoot(personalRoot).render(<PersonalForm />);
}

// ---------------- Root #4：TodayRecipeRecommend ----------
const recommendRoot = document.getElementById("recommend-root");
if (recommendRoot) {
  ReactDOM.createRoot(recommendRoot).render(<TodayRecipeRecommend />);
}

// ---------------- Root #5：僅顯示懸浮聊天室 (飲食日記頁用) ----------------
// ✨ 這是新增的！只要頁面有 id="chat-only-root"，就只掛載聊天球
const chatOnlyRoot = document.getElementById("chat-only-root");
if (chatOnlyRoot) {
  ReactDOM.createRoot(chatOnlyRoot).render(
    <GeminiChat />
  );
} else {
  // 這裡不寫 console.warn，避免在首頁 (已有 root) 時跳出多餘警告
}

reportWebVitals();