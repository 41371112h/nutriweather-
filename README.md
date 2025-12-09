# nutriweather-  
試算表：https://docs.google.com/spreadsheets/d/1w0Ne3QLCxfL2HSScn5-tFEEO4V-Z8SCOL42_HhTaJNI/edit?usp=sharing

NutriWeather — 後端串接指南（組員 B 必看）

這份文件是給 組員 B 的 API 串接與資料整合說明。
前端（組員 A）已經完成所有 HTML / CSS / UI 更新函式，你只需要：

填入 API

回傳正確格式資料

不用碰任何 DOM / HTML / CSS

照這份文件做，你的程式就能自動更新到前端畫面。

🗂 你會修改的檔案：

main.js （中間的 3 個骨架函式）
位置都已經用註解清楚標記好。

⭐ 你需要實作的三個主函式
1️⃣ fetchWeatherForProfile(profile)
你的任務

串接 OpenWeather API，依照使用者輸入的城市（profile.location）取得目前天氣。

前端預期你 return 的格式：
{
  city: 'Taipei',
  temp: 27,
  desc: '多雲時晴'
}

前端怎麼用？

由 A 的程式自動呼叫：

updateWeatherUI(weather);


你不需要做任何畫面更新。

建議實作：
async function fetchWeatherForProfile(profile) {
  const city = profile.location || 'Taipei';
  const apiKey = '你的 OpenWeather API Key';

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=zh_tw`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    city,
    temp: Math.round(data.main.temp),
    desc: data.weather[0].description
  };
}

2️⃣ fetchMealsForProfile(profile, weather)
你的任務

使用 Spoonacular API + 你的推薦邏輯：

根據 profile（年齡/目標/身高/體重）決定熱量

根據 weather（溫度/天氣）決定偏向哪類料理

最後回傳 3 餐

前端預期的資料格式：
{
  breakfast: {
    title: "早餐 — xx料理",
    kcalText: "約 350 kcal · 高蛋白",
    desc: "一句簡短描述"
  },
  lunch: {
    title: "...",
    kcalText: "...",
    desc: "..."
  },
  dinner: {
    title: "...",
    kcalText: "...",
    desc: "..."
  }
}

前端怎麼用？

會自動更新 UI：

updateMealsUI(meals);


你不用操控 HTML。

可參考架構：
async function fetchMealsForProfile(profile, weather) {

  // TODO：你的 TDEE 計算 & 推薦邏輯

  const apiKey = 'SPOONACULAR_KEY';
  const url = `https://api.spoonacular.com/recipes/complexSearch?...`;

  const res = await fetch(url);
  const result = await res.json();

  return {
    breakfast: { ... },
    lunch: { ... },
    dinner: { ... }
  };
}

3️⃣ generatePlanFromApis()
你的任務

什麼都不用改。

這個函式已經寫好流程：

1. 讀取 localStorage → profile
2. await fetchWeatherForProfile(profile)
3. await fetchMealsForProfile(profile, weather)
4. updateWeatherUI(weather)  ← A 的函式
5. updateMealsUI(meals)      ← A 的函式
6. scrollToToday()


只要你把前兩個函式實作好，這裡就能跑。

🚀 最後切換成 API 模式

目前前端按鈕綁的是假資料：

generateDemoBtn.addEventListener('click', generateDemoPlan);


等你 API 完成後，把這一行改成：

generateDemoBtn.addEventListener('click', generatePlanFromApis);


然後整個專題就切換成「真實運作」版本。

🔍 profile 的內容（給你寫演算法用）

從 localStorage 讀出的使用者設定大概是：

{
  gender: "female",
  age: "22",
  height: "160",
  weight: "55",
  goal: "lose",       // lose = 減脂 / maintain = 維持
  location: "Taipei"
}


你可以在 fetchMealsForProfile 裡用這些資訊做推薦邏輯：

計算 TDEE

熱量分配

料理偏好

天氣加權（熱天/冷天/雨天）

📌 你不需要碰的部分（前端 A 已經處理好）

所有 HTML（完全不用動）

所有 CSS（不用動）

畫面更新（updateWeatherUI / updateMealsUI）

捲動效果（scrollToToday / scrollToRecipeDetail）

食譜詳情頁面切換

卡片 active 樣式切換

你只負責「資料準備」，前端負責「畫面呈現」。

🎯 最後提醒（A + B 的整合重點）

你只要回傳正確格式的 JSON，畫面就會自動更新。

不需要處理 DOM → A 已經做好了。

每個函式的 input / output 都在這份文件裡。

極重要：完成後通知 A，把按鈕改成 generatePlanFromApis()。
