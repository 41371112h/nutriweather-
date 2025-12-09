// src/spoonacularApi.js
import { translateTextBatch } from "./translateApi"; // 引入翻譯

const API_KEY = process.env.REACT_APP_SPOONACULAR_KEY;
const BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";

function calculateTargetCalories(profile) { return 2000; } 
function getWeatherKeywords(temp) { return ""; }

export async function getRecommendedRecipes(mealCalories, weather, preferences) {
  
  const weatherQuery = getWeatherKeywords(weather?.temp);
  let usedRecipeIds = new Set();

  const fetchAndTranslateMeal = async (type, calories, extraQuery = "") => {
    if (!API_KEY) throw new Error("Missing API Key");

    // 1. 呼叫 Spoonacular (取得英文食譜)
    const randomOffset = Math.floor(Math.random() * 10);
    const params = new URLSearchParams({
      apiKey: API_KEY,
      addRecipeNutrition: "true",
      instructionsRequired: "true",
      fillIngredients: "true",
      number: "3", 
      offset: randomOffset.toString(),
      ignorePantry: "true",
      type: type,
      minCalories: (calories - 200).toString(),
      maxCalories: (calories + 200).toString(),
      excludeIngredients: preferences.exclude || "",
      includeIngredients: preferences.include || "",
      diet: preferences.diet || "",
      cuisine: preferences.cuisine || "",
      maxReadyTime: (preferences.maxTime || 60).toString(),
    });

    if (extraQuery) params.set("query", extraQuery);

    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (res.status === 402 || res.status === 429) throw new Error("API_QUOTA_EXCEEDED");
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    
    const data = await res.json();
    const results = data.results || [];
    
    // 過濾重複
    let recipe = results.find(r => !usedRecipeIds.has(r.id));
    if (!recipe) recipe = results[0]; 
    if (!recipe) return null;

    usedRecipeIds.add(recipe.id);

    // 圖片畫質處理
    let highResImage = recipe.image;
    if (highResImage) highResImage = highResImage.replace(/-\d+x\d+(?=\.\w+$)/, "-636x393");

    // ---------------------------------------------------------
    // 🔥 開始翻譯流程
    // ---------------------------------------------------------
    
    // A. 準備原始資料
    const originalTitle = recipe.title;
    const originalIngredients = recipe.extendedIngredients?.map(i => i.original) || [];
    // 處理步驟
    let originalSteps = [];
    if (recipe.analyzedInstructions?.length > 0 && recipe.analyzedInstructions[0].steps) {
        originalSteps = recipe.analyzedInstructions[0].steps.map(s => s.step);
    } else {
        originalSteps = ["No detailed steps provided."];
    }

    // B. 打包成一個陣列
    const textPacket = [originalTitle, ...originalIngredients, ...originalSteps];

    try {
        console.log(`正在翻譯 ${type}...`);
        // C. 呼叫翻譯
        const translatedPacket = await translateTextBatch(textPacket);

        // D. 解包 (還原回物件)
        const zhTitle = translatedPacket[0];
        
        const ingLength = originalIngredients.length;
        const zhIngredients = translatedPacket.slice(1, 1 + ingLength);
        const zhSteps = translatedPacket.slice(1 + ingLength);

        // 回傳中文食譜
        return {
            ...recipe,
            title: zhTitle,
            image: highResImage,
            ingredients: zhIngredients,
            steps: zhSteps
        };

    } catch (translateError) {
        console.error("翻譯過程發生錯誤，回傳英文原版:", translateError);
        return {
            ...recipe,
            image: highResImage,
            ingredients: originalIngredients,
            steps: originalSteps
        };
    }
  };

  try {
    console.log("🚀 開始獲取並翻譯食譜...");
    
    // 依序執行，避免同時發送太多請求
    const breakfast = await fetchAndTranslateMeal("breakfast", mealCalories.breakfast);
    const lunch = await fetchAndTranslateMeal("main course", mealCalories.lunch, weatherQuery);
    const dinner = await fetchAndTranslateMeal("main course", mealCalories.dinner, weatherQuery);

    if (!breakfast || !lunch || !dinner) {
        throw new Error("找不到足夠的食譜");
    }

    return {
      success: true,
      meals: { breakfast, lunch, dinner }
    };

  } catch (error) {
    console.error("API 流程錯誤:", error.message);
    throw error;
  }
}