import React, { useEffect, useState, useRef } from "react";
import { getLatestProfile } from "./sheetApi";
import { calcTdee, splitMealsCalories } from "./nutrition";
import { getRecommendedRecipes } from "./spoonacularApi";
import NutritionPieChart from "./NutritionPieChart";



export default function TodayRecipeRecommend() {
  const [profile, setProfile] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  
  const [shoppingList, setShoppingList] = useState([]);
  const [notes, setNotes] = useState("");
  // ===== 每日飲水量 =====
  const [waterMl, setWaterMl] = useState(0);     // 今天已喝多少 ml
  const [waterGoalMl, setWaterGoalMl] = useState(2000); // 今天建議喝多少 ml
  // ===== 水杯顯示設定 =====
  const CUP_ML = 500;     // 每杯 500 ml
  const TOTAL_CUPS = 6;   // 固定 6 杯
  const drankCups = Math.floor(waterMl / CUP_ML);


  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const detailRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [hasProfile, setHasProfile] = useState(false);

  const [exclude, setExclude] = useState("");
  const [include, setInclude] = useState("");
  const [diet, setDiet] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxTime, setMaxTime] = useState("");
  // ===============================
  // 單一餐點的 P / F / C 計算
  // ===============================
  const getMealPFC = (recipe) => {
    const nutrients = recipe?.nutrition?.nutrients || [];

    const p = nutrients.find((n) => n.name === "Protein")?.amount || 0;
    const f = nutrients.find((n) => n.name === "Fat")?.amount || 0;
    const c = nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0;

    return {
      protein: Math.round(p),
      fat: Math.round(f),
      carbs: Math.round(c),
    };
  };


  // ===============================
// 今日營養加總（P / F / C）
// ===============================
const getTodayNutritionTotal = () => {
  let protein = 0;
  let fat = 0;
  let carbs = 0;

  recipes.forEach((r) => {
    const nutrients = r.nutrition?.nutrients || [];

    const p = nutrients.find(n => n.name === "Protein")?.amount || 0;
    const f = nutrients.find(n => n.name === "Fat")?.amount || 0;
    const c = nutrients.find(n => n.name === "Carbohydrates")?.amount || 0;

    protein += p;
    fat += f;
    carbs += c;
  });

  return {
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  };
};

// ===== 依體重計算建議飲水量 =====
// 基本：體重(kg) × 30 ml
const calcWaterGoalByWeight = (p) => {
  const weight = Number(p?.weight || 0);
  if (!weight) return 1500; // 防呆

  let goal = weight * 30;
  goal = Math.min(goal, 3000); // 只保留上限，不鎖死最低 1500

  return goal;
};

  // 取得台灣時間日期
  const getTaiwanDate = () => {
    return new Date().toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  // ✅ 統一用於資料 key 的台灣日期（YYYY-MM-DD）
  const getTaiwanISODate = () => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })
    );
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };


  // 1. 監聽天氣 + 恢復資料
  // 1. 監聽天氣 + 恢復資料 (含智慧重置邏輯)
  useEffect(() => {
    const loadWeather = () => {
      const saved = localStorage.getItem("nutriWeather_current");
      if (saved) { try { setWeatherData(JSON.parse(saved)); } catch (e) {} }
    };

    const loadData = () => {
      // ✅ 沒有完成個人設定前：不要恢復舊的飲水/食譜（維持歸零）
      const flag = localStorage.getItem("hasProfile") === "true";
      if (!flag) {
        setRecipes([]);
        setShoppingList([]);
        setNotes("");
        setWaterMl(0);
        // waterGoalMl 會在 init() 那邊設為 0（或你也可在這裡 setWaterGoalMl(0)）
        return;
      }

      const savedRecipesStr = localStorage.getItem("nutriWeather_recipes");
      const savedDate = localStorage.getItem("nutriWeather_date");
      
      const todayDate = getTaiwanISODate();
      // ===== 飲水量：依日期自動重置 / 恢復 =====
      const waterDateKey = "water_date";
      const waterMlKey = "water_ml";

      const savedWaterDate = localStorage.getItem(waterDateKey);
      if (savedWaterDate !== todayDate) {
        // 新的一天：歸零
        localStorage.setItem(waterDateKey, todayDate);
        localStorage.setItem(waterMlKey, "0");
        setWaterMl(0);
      } else {
        // 同一天：恢復
        const saved = Number(localStorage.getItem(waterMlKey) || 0);
        setWaterMl(Number.isFinite(saved) ? saved : 0);
      }

      if (savedDate !== todayDate) {
          console.log("日期變更，清除舊資料");
          localStorage.removeItem("nutriWeather_recipes");
          localStorage.removeItem("nutriWeather_date");
          localStorage.removeItem("nutriWeather_gen_profile");
          localStorage.removeItem("today_recipes"); 
          setRecipes([]);
          setShoppingList([]);
      } else if (savedRecipesStr) {
        try {
          const parsed = JSON.parse(savedRecipesStr);

          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecipes(parsed);
            generateShoppingList(parsed);

            // 同步一份給飲食日記用的下拉選單
            const recipesForLog = parsed.map(r => ({
              meal: r.type,
              name: r.title,
              calories:
                r.nutrition?.nutrients
                  .find(n => n.name === "Calories")
                  ?.amount
                  ?.toFixed(0) ?? 0
            }));
            localStorage.setItem("today_recipes", JSON.stringify(recipesForLog));
          }
        } catch (e) {}
      }

      
      const savedNotes = localStorage.getItem("nutriWeather_notes");
      if (savedNotes) setNotes(savedNotes);
    };

    loadWeather();
    loadData();

    // ✅ 當 PersonalForm 儲存成功時，立刻讀最新的 profile（localStorage 的 nutriProfile）
    const handleProfileUpdated = () => {
      const saved = localStorage.getItem("nutriProfile");
      if (!saved) return;

      const p = JSON.parse(saved);
      setProfile(p);

      localStorage.setItem("hasProfile", "true");
      setHasProfile(true); // ✅新增：儲存後立刻開啟顯示
    };

    window.addEventListener("weatherDataUpdated", loadWeather);
    window.addEventListener("profileUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("weatherDataUpdated", loadWeather);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };

  }, []);
  // 2. 初始化
  useEffect(() => {
    async function init() {
      const flag = localStorage.getItem("hasProfile") === "true";
      setHasProfile(flag);

      if (!flag) {
        // ✅ 一開始進畫面先歸零
        setProfile(null);
        setWaterGoalMl(0);
        setWaterMl(0);

        // 如果你不想連 localStorage 也清掉，就不要 remove
        // 你要「看起來歸零」就好 => 只 setState 就夠了
        return;
      }

      try {
        const localP = loadProfileFromLocal();
        if (localP) {
          setProfile(localP);
        } else {
          const p = await getLatestProfile();
          setProfile(p);
        }

        const activeProfile = localP || (await getLatestProfile());
        const savedGenProfileStr = localStorage.getItem("nutriWeather_gen_profile");
        const currentProfileStr = JSON.stringify(activeProfile);


        if (savedGenProfileStr && savedGenProfileStr !== currentProfileStr) {
             console.log("個人設定變更，強制重置食譜");
             localStorage.removeItem("nutriWeather_recipes");
             localStorage.removeItem("nutriWeather_gen_profile");
             localStorage.removeItem("today_recipes"); // 🔥 清除舊的推薦
             setRecipes([]);
             setShoppingList([]);
        }

      } catch (e) {
        console.error("初始化錯誤:", e);
        setError("無法取得使用者資料");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // profile 或天氣更新時，更新今日建議飲水量
  useEffect(() => {
    if (!hasProfile) return;
    if (!profile) return;
    const goal = calcWaterGoalByWeight(profile);
    setWaterGoalMl(goal);
  }, [hasProfile, profile]);

  // ✅ 從 localStorage 讀最新的個人設定（PersonalForm 存在 nutriProfile）
  const loadProfileFromLocal = () => {
    try {
      const saved = localStorage.getItem("nutriProfile");
      if (!saved) return null;
      const p = JSON.parse(saved);
      return p;
    } catch (e) {
      return null;
    }
  };

  const generateShoppingList = (recipeArray) => {
    if (!recipeArray) return;
    const allIngredients = [];
    recipeArray.forEach(recipe => {
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          if (!allIngredients.includes(ing)) allIngredients.push(ing);
        });
      }
    });
    setShoppingList(allIngredients);
  };

  async function generate() {
    if (!profile) { alert("請先填寫個人設定！"); return; }
    try {
      setGenerating(true);
      setError("");
      setSelectedRecipe(null);
      
      const tdee = calcTdee(profile);
      const perMeal = splitMealsCalories(tdee);
      const prefs = { exclude, include, diet, cuisine, maxTime };
      const currentWeather = weatherData || { temp: 25, desc: "預設天氣" };

      const recs = await getRecommendedRecipes(perMeal, currentWeather, prefs);
      
      if (!recs || !recs.meals || !recs.meals.breakfast) {
        throw new Error("無法取得有效的食譜資料，請稍後再試。");
      }

      const recipeArray = [
        { ...recs.meals.breakfast, type: '早餐' },
        { ...recs.meals.lunch, type: '午餐' },
        { ...recs.meals.dinner, type: '晚餐' }
      ];
      
      setRecipes(recipeArray);
      
      // 儲存 React App 自己的狀態
      localStorage.setItem("nutriWeather_recipes", JSON.stringify(recipeArray));
      localStorage.setItem("nutriWeather_date", getTaiwanISODate());
      localStorage.setItem("nutriWeather_gen_profile", JSON.stringify(profile));

      // ==========================================
      // 🔥🔥🔥 新增：儲存給「飲食日記」使用的資料 🔥🔥🔥
      // ==========================================
      const recipesForLog = recipeArray.map(r => ({
          meal: r.type,
          name: r.title,
          // 從 Spoonacular 資料結構中抓取熱量，若無則回傳 0
          calories:
            r.nutrition?.nutrients
              .find(n => n.name === 'Calories')
              ?.amount
              ?.toFixed(0) ?? 0
      }));
      localStorage.setItem("today_recipes", JSON.stringify(recipesForLog));
      // ==========================================

      generateShoppingList(recipeArray);

    } catch (e) {
      console.error(e);
      setError(e.message || "生成失敗，請檢查 API 配額或網路狀態");
    } finally {
      setGenerating(false);
    }
  }

  const handleShowDetail = (recipe) => {
    setSelectedRecipe(recipe);
    setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem("nutriWeather_notes", val);
  };

  const addWater = (ml) => {
    const today = getTaiwanISODate();

    const next = Math.max(0, waterMl + ml);
    setWaterMl(next);

    localStorage.setItem("water_date", today);
    localStorage.setItem("water_ml", String(next));

    // ✅ 新增：同步到每日日誌（給「一週飲水統計」用）
    const key = "water_history";
    const history = JSON.parse(localStorage.getItem(key) || "{}");
    history[today] = next; // 今天累積多少就記多少
    localStorage.setItem(key, JSON.stringify(history));
  };


const resetWater = () => {
  const today = getTaiwanISODate();
  setWaterMl(0);
  localStorage.setItem("water_date", today);
  localStorage.setItem("water_ml", "0");

  // ✅ 同步到 water_history（避免週圖還留舊值）
  const key = "water_history";
  const history = JSON.parse(localStorage.getItem(key) || "{}");
  history[today] = 0;
  localStorage.setItem(key, JSON.stringify(history));
};


  if (loading) return <div className="card" style={{textAlign:'center'}}>資料載入中...</div>;

  return (
    <div>
      {/* 上半部 */}
      <section className="card">
        <h2>今日推薦菜單</h2>
        <p style={{color: '#666', marginBottom: '16px'}}>
          目標熱量：{profile ? calcTdee(profile) : '...'} kcal 
          {weatherData ? <span style={{marginLeft: '10px', color: '#4263eb', fontWeight: 'bold'}}>☀ {Math.round(weatherData.temp)}°C {weatherData.desc}</span> : <span style={{marginLeft: '10px', color: '#999'}}>(等待天氣...)</span>}
        </p>
        {/* 💧 每日飲水量（放在今日天氣下面） */}
        {weatherData && (
          <div
            style={{
              marginTop: 10,
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(148, 163, 184, 0.25)",
              background: "rgba(66, 99, 235, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700 }}>今日飲水量</div>
              <div style={{ fontSize: 13, color: "#444" }}>
                {hasProfile ? (
                  <>
                    建議：<b>{waterGoalMl}</b> ml　已喝：<b>{waterMl}</b> ml
                    <span style={{ marginLeft: 8, opacity: 0.75 }}>
                      （體重：{profile?.weight ?? "?"} kg）
                    </span>
                  </>
                ) : (
                  <span style={{ opacity: 0.7 }}>
                    尚未設定個人資料（請先儲存個人設定）
                  </span>
                )}
              </div>
            </div>

            {/* 進度條 */}
            <div style={{ marginTop: 10, height: 10, background: "rgba(0,0,0,0.08)", borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  width: `${waterGoalMl > 0 ? Math.min(100, Math.round((waterMl / waterGoalMl) * 100)) : 0}%`,
                  borderRadius: 999,
                  background: "#4dabf7",
                  transition: "width 0.2s ease",
                }}
              />
            </div>

            {/* 🥛 水杯視覺（固定 6 杯，每 500ml 一杯） */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              {Array.from({ length: TOTAL_CUPS }).map((_, idx) => {
                const filled = idx < drankCups;
                return (
                  <span
                    key={idx}
                    title={`${(idx + 1) * CUP_ML} ml`}
                    style={{
                      fontSize: 22,
                      opacity: filled ? 1 : 0.25,
                      filter: filled ? "none" : "grayscale(100%)",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    🥛
                  </span>
                );
              })}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn secondary-btn" type="button" onClick={() => addWater(250)}>
                +250 ml
              </button>
              <button className="btn secondary-btn" type="button" onClick={() => addWater(500)}>
                +500 ml
              </button>
              <button className="btn secondary-btn" type="button" onClick={resetWater}>
                重設
              </button>

              <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75, alignSelf: "center" }}>
                進度：{waterGoalMl > 0 ? Math.min(100, Math.round((waterMl / waterGoalMl) * 100)) : 0}%
              </div>
            </div>
          </div>
        )}

        <div className="form-grid">
           <div className="form-group"><label>排除食材</label><input value={exclude} onChange={e=>setExclude(e.target.value)} placeholder="例如: pork" /></div>
           <div className="form-group"><label>指定食材</label><input value={include} onChange={e=>setInclude(e.target.value)} placeholder="例如: chicken" /></div>
           <div className="form-group"><label>飲食方式</label><select value={diet} onChange={e=>setDiet(e.target.value)}><option value="">不限</option><option value="vegetarian">蛋奶素</option><option value="vegan">全素</option><option value="ketogenic">生酮</option></select></div>
           <div className="form-group"><label>料理風格</label><select value={cuisine} onChange={e=>setCuisine(e.target.value)}><option value="">不限</option><option value="japanese">日式</option><option value="italian">義式</option><option value="chinese">中式</option><option value="american">美式</option></select></div>
           <div className="form-group"><label>時間 (分)</label><input type="number" value={maxTime} onChange={e=>setMaxTime(e.target.value)} placeholder="30" /></div>
        </div>
        <button className="btn primary-btn" onClick={generate} disabled={generating}>{generating ? "生成中..." : "生成今日推薦"}</button>
        {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
      </section>

      {/* 結果列表 */}
      {recipes.length > 0 && (
        <section className="meal-grid">
          {recipes.map((r, index) => (
            <article key={index} className="card meal-card">
              <h3>{r.type} — {r.title}</h3>
              <p className="kcal">
                約 {r.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount?.toFixed(0) ?? "0"} kcal
              </p>
              {r.image && <img src={r.image} alt={r.title} className="meal-img" />}
              <button className="btn secondary-btn" onClick={() => handleShowDetail(r)}>查看食譜詳情</button>
            </article>
          ))}
        </section>
      )}

      {/* 三餐各自營養圓餅圖 */}
      {recipes.length > 0 && (
        <section className="card section" style={{ marginTop: "24px" }}>
          <h2>三餐營養圓餅圖</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginTop: "14px",
            }}
          >
            {["早餐", "午餐", "晚餐"].map((label, idx) => {
              const recipe = recipes[idx];
              const pfc = getMealPFC(recipe);

              return (
                <div
                  key={label}
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                    borderRadius: 12,
                    padding: 12,
                    background: "white",
                  }}
                >
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>
                    {label}
                    {recipe?.title ? ` · ${recipe.title}` : ""}
                  </h3>

                  <NutritionPieChart
                    protein={pfc.protein}
                    fat={pfc.fat}
                    carbs={pfc.carbs}
                    title={`${label} P/F/C`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 詳情區塊 */}
      {selectedRecipe && (
        <section ref={detailRef} className="card section" style={{marginTop: '24px', borderTop: '4px solid #5c7cfa'}}>
            <h2>{selectedRecipe.type}詳情 — {selectedRecipe.title}</h2>
            <div className="recipe-layout">
                <div className="recipe-image-col">
                    <img src={selectedRecipe.image} alt={selectedRecipe.title} style={{width: '100%', borderRadius: '12px'}} />
                    <p className="kcal" style={{textAlign: 'center'}}>🔥 熱量：{selectedRecipe.nutrition?.nutrients[0]?.amount.toFixed(0)} kcal</p>
                </div>
                <div className="recipe-info-col">
                    <h3>🛒 食材準備</h3>
                    <ul className="recipe-list">{selectedRecipe.ingredients?.map((ing, i) => <li key={i}>{ing}</li>)}</ul>
                    <h3 style={{marginTop: '20px'}}>🍳 料理步驟</h3>
                    <ol className="recipe-list">{selectedRecipe.steps?.map((step, i) => <li key={i}>{step}</li>)}</ol>
                </div>
            </div>
        </section>
      )}

      {/* 採買清單區塊 */}
      {recipes.length > 0 && (
        <section className="card section" style={{marginTop: '24px'}}>
          <h2>今日採買清單</h2>
          
          <div className="shopping-layout">
            
            {/* 左欄 */}
            <div className="shopping-input-col">
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>備註 / 自己想加的東西</label>
              <textarea 
                value={notes} 
                onChange={handleNoteChange} 
                placeholder="在此輸入備註..." 
                style={{ width: '100%', height: '400px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }} 
              />
            </div>

            {/* 右欄 */}
            <div className="shopping-list-col">
              <h4>建議清單</h4>
              {shoppingList.length > 0 ? (
                <ul className="recipe-list" style={{
                    maxHeight: '310px',       // 設定最大高度 (配合左邊備註欄)
                    overflowY: 'auto',        // 超出高度時顯示捲軸
                    border: '1px solid #ddd', // 加上邊框讓區域更明顯
                    borderRadius: '8px',      // 圓角
                    padding: '20px',          // 內距
                    backgroundColor: '#fff'   // 確保背景色
                }}>
                  {shoppingList.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ) : <p style={{color: '#999'}}>暫無食材</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}