import React, { useEffect, useState, useRef } from "react";
import { getLatestProfile } from "./sheetApi";
import { calcTdee, splitMealsCalories } from "./nutrition";
import { getRecommendedRecipes } from "./spoonacularApi";


export default function TodayRecipeRecommend() {
  const [profile, setProfile] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  
  const [shoppingList, setShoppingList] = useState([]);
  const [notes, setNotes] = useState("");

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const detailRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [exclude, setExclude] = useState("");
  const [include, setInclude] = useState("");
  const [diet, setDiet] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxTime, setMaxTime] = useState("");

  // 取得台灣時間日期
  const getTaiwanDate = () => {
    return new Date().toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  // 1. 監聽天氣 + 恢復資料
  // 1. 監聽天氣 + 恢復資料 (含智慧重置邏輯)
  useEffect(() => {
    const loadWeather = () => {
      const saved = localStorage.getItem("nutriWeather_current");
      if (saved) { try { setWeatherData(JSON.parse(saved)); } catch (e) {} }
    };

    const loadData = () => {
      const savedRecipesStr = localStorage.getItem("nutriWeather_recipes");
      const savedDate = localStorage.getItem("nutriWeather_date");
      
      const todayDate = getTaiwanDate();
      
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

                  // 🔥🔥🔥 【新增這段】🔥🔥🔥
                  // 即使是讀取舊資料，也要同步一份給飲食日記 (today_recipes)
                  const recipesForLog = parsed.map(r => ({
                    meal: r.type,
                    name: r.title,
                    calories: r.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount.toFixed(0) || 0
                  }));
                  localStorage.setItem("today_recipes", JSON.stringify(recipesForLog));
                  // 🔥🔥🔥 【結束】🔥🔥🔥
              }
          } catch (e) {}
      }
      
      const savedNotes = localStorage.getItem("nutriWeather_notes");
      if (savedNotes) setNotes(savedNotes);
    };

    loadWeather();
    loadData();

    window.addEventListener("weatherDataUpdated", loadWeather);
    return () => window.removeEventListener("weatherDataUpdated", loadWeather);
  }, []);
  // 2. 初始化
  useEffect(() => {
    async function init() {
      try {
        const p = await getLatestProfile();
        setProfile(p);

        const savedGenProfileStr = localStorage.getItem("nutriWeather_gen_profile");
        const currentProfileStr = JSON.stringify(p);

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
      localStorage.setItem("nutriWeather_date", getTaiwanDate());
      localStorage.setItem("nutriWeather_gen_profile", JSON.stringify(profile));

      // ==========================================
      // 🔥🔥🔥 新增：儲存給「飲食日記」使用的資料 🔥🔥🔥
      // ==========================================
      const recipesForLog = recipeArray.map(r => ({
          meal: r.type,
          name: r.title,
          // 從 Spoonacular 資料結構中抓取熱量，若無則回傳 0
          calories: r.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount.toFixed(0) || 0
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

  if (loading) return <div className="card" style={{textAlign:'center'}}>資料載入中...</div>;
  if (!loading && !profile) return <div className="card" style={{textAlign: 'center', padding: '40px'}}>請先填寫個人設定</div>;

  return (
    <div>
      {/* 上半部 */}
      <section className="card">
        <h2>今日推薦菜單</h2>
        <p style={{color: '#666', marginBottom: '16px'}}>
          目標熱量：{profile ? calcTdee(profile) : '...'} kcal 
          {weatherData ? <span style={{marginLeft: '10px', color: '#4263eb', fontWeight: 'bold'}}>☀ {Math.round(weatherData.temp)}°C {weatherData.desc}</span> : <span style={{marginLeft: '10px', color: '#999'}}>(等待天氣...)</span>}
        </p>
        <div className="form-grid">
           <div className="form-group"><label>排除食材</label><input value={exclude} onChange={e=>setExclude(e.target.value)} placeholder="例如: pork" /></div>
           <div className="form-group"><label>指定食材</label><input value={include} onChange={e=>setInclude(e.target.value)} placeholder="例如: chicken" /></div>
           <div className="form-group"><label>飲食方式</label><select value={diet} onChange={e=>setDiet(e.target.value)}><option value="">不限</option><option value="vegetarian">蛋奶素</option><option value="vegan">全素</option><option value="ketogenic">生酮</option></select></div>
           <div className="form-group"><label>料理風格</label><select value={cuisine} onChange={e=>setCuisine(e.target.value)}><option value="">不限</option><option value="japanese">日式</option><option value="italian">義式</option><option value="chinese">中式</option><option value="american">美式</option></select></div>
           <div className="form-group"><label>時間 (分)</label><input type="number" value={maxTime} onChange={e=>setMaxTime(e.target.value)} placeholder="30" /></div>
        </div>
        <button className="btn primary-btn" onClick={generate} disabled={generating}>{generating ? "AI 生成中..." : "✨ 生成今日推薦"}</button>
        {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
      </section>

      {/* 結果列表 */}
      {recipes.length > 0 && (
        <section className="meal-grid">
          {recipes.map((r, index) => (
            <article key={index} className="card meal-card">
              <h3>{r.type} — {r.title}</h3>
              <p className="kcal">約 {r.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount.toFixed(0)} kcal</p>
              {r.image && <img src={r.image} alt={r.title} className="meal-img" />}
              <button className="btn secondary-btn" onClick={() => handleShowDetail(r)}>查看食譜詳情</button>
            </article>
          ))}
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
              <h4>📝 建議清單</h4>
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