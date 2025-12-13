// nutritionApi.js

// 步驟 1: 新增一個 helper function 用來翻譯中文到英文
async function translateZhToEn(text) {
  try {
    // 使用 MyMemory 免費翻譯 API (限制：每天一定用量，適合開發測試)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh|en`;
    const res = await fetch(url);
    const data = await res.json();
    
    // 取得翻譯後的文字
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return text; // 如果翻譯失敗，回傳原文碰碰運氣
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
}

// 步驟 2: 修改原本的 getNutrition
export async function getNutrition(foodName, apiKey) {
  // A. 先將使用者輸入的中文轉成英文
  const englishFoodName = await translateZhToEn(foodName);
  
  console.log(`查詢中: ${foodName} -> ${englishFoodName}`); // 除錯用，可以在 Console 看到翻譯結果

  // B. 使用英文名稱呼叫 CalorieNinjas
  const url = `https://api.calorieninjas.com/v1/nutrition?query=${englishFoodName}`;

  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey }
  });

  if (!res.ok) throw new Error("Nutrition API error");

  const data = await res.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error("找不到該食物的營養資訊");
  }

  return data.items[0];  // 回傳第一個食物資訊
}