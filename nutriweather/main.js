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

  // 「查看詳情」按鈕（早餐/午餐/晚餐）
  const mealDetailButtons = document.querySelectorAll('.meal-detail-btn');

  // 食譜詳情區塊元素
  const recipeImage = document.getElementById('recipe-image');
  const recipeTitle = document.getElementById('recipe-title');
  const recipeKcal = document.getElementById('recipe-kcal');
  const recipeIngredients = document.getElementById('recipe-ingredients');
  const recipeSteps = document.getElementById('recipe-steps');

  // --- 共用小工具 ------------------------------------------------------

  // 捲動到「今日推薦」區塊
  function scrollToToday() {
    const todaySection = document.getElementById('today');
    if (todaySection) {
      todaySection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 捲動到「食譜詳情」區塊
  function scrollToRecipeDetail() {
    const detailSection = document.getElementById('recipe-detail');
    if (detailSection) {
      detailSection.scrollIntoView({ behavior: 'smooth' });
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

    // --- 食譜詳情：Demo 用假資料 ---------------------------------------

  const demoRecipeDetails = {
    breakfast: {
      image: 'https://via.placeholder.com/400x250?text=Breakfast',
      title: '早餐 — 清爽優格水果碗',
      kcal: '約 320 kcal · 高蛋白 · 低脂',
      ingredients: [
        '希臘優格 150g',
        '香蕉 1 根',
        '藍莓 一小把',
        '燕麥 30g',
        '蜂蜜 少許'
      ],
      steps: [
        '將香蕉切片、藍莓洗淨備用。',
        '碗中放入優格，鋪上水果與燕麥。',
        '最後淋上少許蜂蜜即可。'
      ]
    },
    lunch: {
      image: 'https://via.placeholder.com/400x250?text=Lunch',
      title: '午餐 — 檸檬香煎雞胸沙拉',
      kcal: '約 480 kcal · 高蛋白 · 低碳水',
      ingredients: [
        '雞胸肉 120g',
        '綜合生菜 60g',
        '小番茄 6 顆',
        '橄欖油 1 小匙',
        '檸檬汁 1 小匙',
        '鹽、胡椒 適量'
      ],
      steps: [
        '雞胸肉以鹽、胡椒、檸檬汁醃 10 分鐘。',
        '平底鍋少油煎至兩面金黃熟透，切片。',
        '生菜與小番茄放入碗中，加入雞胸肉。',
        '淋上橄欖油與少許檸檬汁拌勻。'
      ]
    },
    dinner: {
      image: 'https://via.placeholder.com/400x250?text=Dinner',
      title: '晚餐 — 味噌鮭魚配溫蔬菜',
      kcal: '約 550 kcal · Omega-3 好油脂',
      ingredients: [
        '鮭魚片 120g',
        '西蘭花 60g',
        '地瓜 1 顆',
        '味噌 1 大匙',
        '味醂 1 小匙'
      ],
      steps: [
        '味噌與味醂調勻，抹在鮭魚表面醃 10 分鐘。',
        '地瓜切塊蒸熟，西蘭花燙熟備用。',
        '平底鍋煎鮭魚至兩面金黃。',
        '盤中擺上鮭魚與蔬菜即可。'
      ]
    }
  };

  /**
   * 根據餐別更新下方「食譜詳情」區塊
   * @param {'breakfast' | 'lunch' | 'dinner'} mealType
   */
  function updateRecipeDetailUI(mealType) {
    const data = demoRecipeDetails[mealType];
    if (!data) return;

    if (recipeImage && data.image) {
      recipeImage.src = data.image;
    }

    if (recipeTitle && data.title) {
      recipeTitle.textContent = data.title;
    }

    if (recipeKcal && data.kcal) {
      recipeKcal.textContent = data.kcal;
    }

    if (recipeIngredients && Array.isArray(data.ingredients)) {
      recipeIngredients.innerHTML = data.ingredients
        .map((item) => `<li>${item}</li>`)
        .join('');
    }

    if (recipeSteps && Array.isArray(data.steps)) {
      recipeSteps.innerHTML = data.steps
        .map((step) => `<li>${step}</li>`)
        .join('');
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

     // 2️⃣ 根據目標決定「假天氣建議」（之後這裡會換成真 API）
    const fakeWeather =
      profile.goal === 'lose'
        ? {
            city: locationText,
            temp: 27,
            desc: '偏熱，適合清爽沙拉與冷盤'
          }
        : {
            city: locationText,
            temp: 23,
            desc: '舒適微涼，適合溫熱料理與湯品'
          };

    updateWeatherUI(fakeWeather);

    // 3️⃣ 根據目標決定「今日三餐假推薦」
    let fakeMeals;

    if (profile.goal === 'lose') {
      fakeMeals = {
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
          kcalText: '約 540 kcal · Omega-3 好油脂',
          desc: '味噌醃鮭魚烤至金黃，配上燙青花菜和地瓜，暖胃又不會太重。'
        }
      };
    } else {
      // 維持體重或未設定 → 稍微放寬一點
      fakeMeals = {
        breakfast: {
          title: '早餐 — 花生醬香蕉吐司配牛奶',
          kcalText: '約 420 kcal · 碳水與蛋白質均衡',
          desc: '全麥吐司抹花生醬，加切片香蕉，搭配一杯低脂牛奶。'
        },
        lunch: {
          title: '午餐 — 雞肉咖哩飯配溫蔬菜',
          kcalText: '約 650 kcal · 份量適中',
          desc: '咖哩雞肉配白飯與花椰菜，適合上班或上課後補充能量。'
        },
        dinner: {
          title: '晚餐 — 蕃茄鮪魚筆管麵',
          kcalText: '約 600 kcal · 有菜有澱粉',
          desc: '蕃茄醬燉煮鮪魚與洋蔥，拌入筆管麵，簡單一鍋搞定。'
        }
      };
    }

    updateMealsUI(fakeMeals);

    // 之後在這裡可以改成真的根據 profile & 天氣去選食譜
    // TODO: 接天氣 API & 食譜 API，組成真正的推薦結果
    scrollToToday();
  }

    // --- 第二週與組員 B 整合用：API / 演算法骨架 -----------------------

  /**
   * （骨架）根據使用者資料取得天氣資訊
   * 未來組員 B 會在這裡改成真的 OpenWeather API 呼叫
   * @param {Object} profile - 使用者設定（從 localStorage 來）
   * @returns {Promise<{city: string, temp: number, desc: string}>}
   */
  async function fetchWeatherForProfile(profile) {
    const city =
      profile.location && profile.location.trim() !== ''
        ? profile.location
        : '你所在的城市';

    // ⬇⬇⬇ 之後組員 B 在這裡改成真的 fetch(OpenWeather...) ⬇⬇⬇
    // 現在先回傳假資料，確保結構正確
    return {
      city,
      temp: 26,
      desc: '多雲時晴（暫用假資料）'
    };
    // ⬆⬆⬆⚠️ 上面這段 return 之後可以被 B 換掉 ⚠️⬆⬆⬆
  }

  /**
   * （骨架）根據使用者與天氣資訊取得今日三餐推薦
   * 未來組員 B 會在這裡接 Spoonacular / 自己的演算法
   * @param {Object} profile - 使用者設定
   * @param {{city: string, temp: number, desc: string}} weather - 上面那個函式的回傳
   * @returns {Promise<{
   *   breakfast: { title: string, kcalText: string, desc: string },
   *   lunch: { title: string, kcalText: string, desc: string },
   *   dinner: { title: string, kcalText: string, desc: string }
   * }>}
   */
  async function fetchMealsForProfile(profile, weather) {
    // ⬇⬇⬇ 之後組員 B 會把這裡換成「真的推薦結果」 ⬇⬇⬇

    // 這裡先用跟 generateDemoPlan 類似的假資料，
    // 之後 B 只要遵守這個回傳格式就可以直接用你的 updateMealsUI()
    const isLose = profile.goal === 'lose';

    if (isLose) {
      return {
        breakfast: {
          title: '早餐 — 清爽優格水果碗（API demo）',
          kcalText: '約 320 kcal · 高蛋白 · 低脂',
          desc: '（假資料）依照減脂目標推薦的清爽早餐。'
        },
        lunch: {
          title: '午餐 — 檸檬雞胸沙拉（API demo）',
          kcalText: '約 480 kcal · 高蛋白 · 低碳水',
          desc: '（假資料）適合炎熱天氣、減脂中的午餐。'
        },
        dinner: {
          title: '晚餐 — 味噌鮭魚配溫蔬菜（API demo）',
          kcalText: '約 540 kcal · Omega-3 好油脂',
          desc: '（假資料）暖胃又不會太重的減脂晚餐。'
        }
      };
    } else {
      return {
        breakfast: {
          title: '早餐 — 花生醬香蕉吐司（API demo）',
          kcalText: '約 420 kcal · 均衡型',
          desc: '（假資料）適合維持體重的活力早餐。'
        },
        lunch: {
          title: '午餐 — 雞肉咖哩飯（API demo）',
          kcalText: '約 650 kcal · 份量適中',
          desc: '（假資料）適合上課/上班族的午餐。'
        },
        dinner: {
          title: '晚餐 — 蕃茄鮪魚筆管麵（API demo）',
          kcalText: '約 600 kcal · 有菜有澱粉',
          desc: '（假資料）簡單一鍋完成的晚餐。'
        }
      };
    }

    // ⬆⬆⬆⚠️ 整個 return 之後也可以被 B 換掉 ⚠️⬆⬆⬆
  }

  /**
   * （骨架）真正接 API 的流程：讀使用者設定 → 拿天氣 → 拿食譜 → 更新畫面
   * 現在先用上面兩個「假 API 函式」，之後 B 直接替換內部即可
   */
  async function generatePlanFromApis() {
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

    // 1️⃣ 先根據使用者資料拿到天氣（未來這裡會變成真的 API）
    const weather = await fetchWeatherForProfile(profile);

    // 2️⃣ 再用 profile + weather 拿到「推薦三餐」
    const meals = await fetchMealsForProfile(profile, weather);

    // 3️⃣ 用你之前寫好的 UI 更新函式更新畫面
    updateWeatherUI(weather);
    updateMealsUI(meals);

    // 4️⃣ 捲到今日推薦
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

  // 「查看詳情」按鈕：更新詳情 + 標記 active + 捲到詳情區
    if (mealDetailButtons && mealDetailButtons.length > 0) {
    mealDetailButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
        // 取得餐別（breakfast / lunch / dinner）
        const mealType = event.currentTarget.getAttribute('data-meal');

        // 1️⃣ 先把所有卡片的 active 拿掉
        document.querySelectorAll('.meal-card.active').forEach((card) => {
            card.classList.remove('active');
        });

        // 2️⃣ 幫目前點擊的這張卡片加 active
        const clickedCard = event.currentTarget.closest('.meal-card');
        if (clickedCard) {
            clickedCard.classList.add('active');
        }

        // 3️⃣ 更新詳情區內容
        if (mealType) {
            updateRecipeDetailUI(mealType);
        }

        // 4️⃣ 捲到詳情區
        scrollToRecipeDetail();
        });
    });
    }

  // TODO: 之後可以在這裡初始化：
  // - 取得當前天氣
  // - 根據天氣預先顯示建議
  // - 或自動產生今日推薦
});
