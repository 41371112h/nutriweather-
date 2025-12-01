// main.js
// NutriWeather 前端邏輯（目前：個人設定 + 今日推薦假資料）
// 未來可以在下面區塊加：天氣 API、食譜 API、推薦演算法

window.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'nutriProfile';

  // --- DOM 元素取得區 -------------------------------------------------

  // 個人設定欄位
  const genderInput = document.getElementById('gender');
  const ageInput = document.getElementById('age');
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const goalInput = document.getElementById('goal');
  const locationInput = document.getElementById('location');
  const saveBtn = document.getElementById('save-profile-btn');

  // 今日推薦相關
  const generateDemoBtn = document.getElementById('generate-demo-btn');
  const weatherLocationSpan = document.getElementById('weather-location');
  const weatherTempSpan = document.getElementById('weather-temp');
  const weatherDescSpan = document.getElementById('weather-desc');
  const todaySummaryP = document.getElementById('today-summary');

  // 三餐餐點卡片元素
  const mealBreakfastTitle = document.getElementById('meal-breakfast-title');
  const mealBreakfastKcal = document.getElementById('meal-breakfast-kcal');
  const mealBreakfastDesc = document.getElementById('meal-breakfast-desc');

  const mealLunchTitle = document.getElementById('meal-lunch-title');
  const mealLunchKcal = document.getElementById('meal-lunch-kcal');
  const mealLunchDesc = document.getElementById('meal-lunch-desc');

  const mealDinnerTitle = document.getElementById('meal-dinner-title');
  const mealDinnerKcal = document.getElementById('meal-dinner-kcal');
  const mealDinnerDesc = document.getElementById('meal-dinner-desc');


  // --- 共用小工具 ------------------------------------------------------

  // 捲動到「今日推薦」區塊
  function scrollToToday() {
    const todaySection = document.getElementById('today');
    if (todaySection) {
      todaySection.scrollIntoView({ behavior: 'smooth' });
    }
  }

    // --- 天氣顯示：只負責更新畫面，之後會給它真資料 -------------------

  /**
   * 更新「今日天氣」區塊的顯示
   * @param {{ city: string, temp: number, desc: string }} weatherData
   */
  function updateWeatherUI(weatherData) {
    if (weatherLocationSpan && weatherData.city) {
      weatherLocationSpan.textContent = weatherData.city;
    }

    if (weatherTempSpan && typeof weatherData.temp === 'number') {
      weatherTempSpan.textContent = Math.round(weatherData.temp);
    }

    if (weatherDescSpan && weatherData.desc) {
      weatherDescSpan.textContent = weatherData.desc;
    }
  }

    // --- 三餐顯示：更新今日推薦餐點 -------------------------------------

  /**
   * 更新今日三餐推薦
   * @param {{
   *   breakfast?: { title?: string, kcalText?: string, desc?: string },
   *   lunch?: { title?: string, kcalText?: string, desc?: string },
   *   dinner?: { title?: string, kcalText?: string, desc?: string }
   * }} meals
   */
  function updateMealsUI(meals) {
    if (meals.breakfast) {
      if (mealBreakfastTitle && meals.breakfast.title) {
        mealBreakfastTitle.textContent = meals.breakfast.title;
      }
      if (mealBreakfastKcal && meals.breakfast.kcalText) {
        mealBreakfastKcal.textContent = meals.breakfast.kcalText;
      }
      if (mealBreakfastDesc && meals.breakfast.desc) {
        mealBreakfastDesc.textContent = meals.breakfast.desc;
      }
    }

    if (meals.lunch) {
      if (mealLunchTitle && meals.lunch.title) {
        mealLunchTitle.textContent = meals.lunch.title;
      }
      if (mealLunchKcal && meals.lunch.kcalText) {
        mealLunchKcal.textContent = meals.lunch.kcalText;
      }
      if (mealLunchDesc && meals.lunch.desc) {
        mealLunchDesc.textContent = meals.lunch.desc;
      }
    }

    if (meals.dinner) {
      if (mealDinnerTitle && meals.dinner.title) {
        mealDinnerTitle.textContent = meals.dinner.title;
      }
      if (mealDinnerKcal && meals.dinner.kcalText) {
        mealDinnerKcal.textContent = meals.dinner.kcalText;
      }
      if (mealDinnerDesc && meals.dinner.desc) {
        mealDinnerDesc.textContent = meals.dinner.desc;
      }
    }
  }

  // --- localStorage：載入 & 儲存個人資料 -----------------------------

  // 讀 localStorage，把舊資料塞回表單
  function loadProfile() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return; // 沒資料就不做事

    try {
      const profile = JSON.parse(saved);
      if (profile.gender) genderInput.value = profile.gender;
      if (profile.age) ageInput.value = profile.age;
      if (profile.height) heightInput.value = profile.height;
      if (profile.weight) weightInput.value = profile.weight;
      if (profile.goal) goalInput.value = profile.goal;
      if (profile.location) locationInput.value = profile.location;
    } catch (err) {
      console.error('載入 profile 失敗：', err);
    }
  }

  // 把表單內容存進 localStorage
  function saveProfile() {
    const profile = {
      gender: genderInput.value,
      age: ageInput.value,
      height: heightInput.value,
      weight: weightInput.value,
      goal: goalInput.value,
      location: locationInput.value,
    };

    // 簡單檢查一下有沒有輸入一些基本資料（可選）
    if (!profile.gender || !profile.height || !profile.weight) {
      alert('建議至少填寫「性別、身高、體重」，之後才好幫你算建議熱量喔！');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    alert('已儲存個人設定！之後可以用這些資料算 TDEE 🙌');

    // 儲存後自動捲到今日推薦
    scrollToToday();
  }

  // --- 今日推薦：使用個人設定產生假資料說明 -------------------------

  function generateDemoPlan() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      alert('你還沒儲存個人設定喔！請先到上面的首頁區塊填寫資料再按「儲存設定」。');
      return;
    }

    let profile;
    try {
      profile = JSON.parse(saved);
    } catch (err) {
      console.error('解析 profile 失敗：', err);
      alert('讀取個人設定時發生錯誤，可以嘗試重新儲存一次。');
      return;
    }

    // 地區文字（沒填就用預設）
    const locationText =
      profile.location && profile.location.trim() !== ''
        ? profile.location
        : '你所在的城市';

    if (weatherLocationSpan) {
      weatherLocationSpan.textContent = locationText;
    }

    // 目標對應一句話
    let goalText = '目前顯示的是預設示意餐單，之後會根據你的熱量與天氣進行調整。';
    if (profile.goal === 'lose') {
      goalText =
        '已套用你的「減脂」目標，這是一份偏低熱量、適合減脂的示意餐單（目前仍為假資料）。';
    } else if (profile.goal === 'maintain') {
      goalText =
        '已套用你的「維持體重」目標，這是一份均衡示意餐單（目前仍為假資料）。';
    }

    if (todaySummaryP) {
      const goalLabel =
        profile.goal === 'lose'
          ? '減脂'
          : profile.goal === 'maintain'
          ? '維持'
          : '未設定';

      todaySummaryP.textContent = `地區：${locationText}｜目標：${goalLabel}。${goalText}`;
    }

    // 之後在這裡可以改成真的根據 profile & 天氣去選食譜
    // TODO: 接天氣 API & 食譜 API，組成真正的推薦結果
    scrollToToday();
  }

  // --- 事件監聽綁定 ----------------------------------------------------

  if (saveBtn) {
    saveBtn.addEventListener('click', saveProfile);
  }

  if (generateDemoBtn) {
    generateDemoBtn.addEventListener('click', generateDemoPlan);
  }

  // 一進頁面就先把資料載回來
  loadProfile();

    // Day 1：先用假資料測試天氣 UI 更新（之後組員 B 會換成真 API 資料）
  updateWeatherUI({
    city: 'Taipei',
    temp: 28,
    desc: '局部多雲'
  });

    // Day 2：先用假資料測試三餐 UI 更新（之後由推薦演算法提供）
  updateMealsUI({
    breakfast: {
      title: '早餐 — 清爽優格水果碗',
      kcalText: '約 320 kcal · 高蛋白 · 低脂',
      desc: '希臘優格搭配香蕉和藍莓，加一點燕麥增加飽足感。'
    },
    lunch: {
      title: '午餐 — 檸檬香煎雞胸沙拉',
      kcalText: '約 480 kcal · 高蛋白 · 低碳水',
      desc: '檸檬香料雞胸搭配大量生菜與小番茄，適合炎熱天氣。'
    },
    dinner: {
      title: '晚餐 — 味噌鮭魚配溫蔬菜',
      kcalText: '約 550 kcal · Omega-3 好油脂',
      desc: '味噌醃鮭魚烤至金黃，配上燙青花菜和地瓜，暖胃又不會太重。'
    }
  });

  // TODO: 之後可以在這裡初始化：
  // - 取得當前天氣
  // - 根據天氣預先顯示建議
  // - 或自動產生今日推薦
});
