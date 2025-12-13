// src/translateApi.js

// 🔴 請把你在 Console 測試成功的那串網址，直接貼在下面的引號裡！
// 網址結尾應該是 /exec
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzVi3EDntvSZT3U-oARtALWXPgtUPH907wqwHtoQ3XwRAViyGLRqPHP8z3rrpMn8-DmWA/exec";


export async function translateTextBatch(texts) {
  // 防呆：如果網址沒填對
  if (!APP_SCRIPT_URL || APP_SCRIPT_URL.includes("你的_APPS_SCRIPT_ID")) {
    console.error("❌ 翻譯失敗：未設定 Apps Script 網址 (請檢查 src/translateApi.js)");
    return texts;
  }

  try {
    const res = await fetch(`${APP_SCRIPT_URL}?action=translate`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ texts: texts }),
    });

    const json = await res.json();

    if (json.status === 'success') {
      return json.data; // 回傳中文陣列
    } else {
      console.warn("⚠️ 翻譯 API 回傳錯誤:", json);
      return texts; // 失敗回傳原文
    }
  } catch (error) {
    console.error("❌ 翻譯連線失敗:", error);
    return texts;
  }
}