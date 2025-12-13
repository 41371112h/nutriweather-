// src/sheetApi.js

// ✅ 你的 Apps Script URL
const APP_SCRIPT_URL =
  process.env.REACT_APP_APP_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbyzR25zI3BButzJDKCcyfmNWBU7tmjNPnXRPzKHXuCyyuT31vra1pQvgNYQx0NXT4-ewg/exec";

console.log("APP_SCRIPT_URL =>", APP_SCRIPT_URL);

/**
 * 讀取最新個人資料 (GET)
 */
export async function getLatestProfile() {
  if (!APP_SCRIPT_URL) throw new Error("APP_SCRIPT_URL 未設定");

  // 1. 發送 GET 請求
  const res = await fetch(`${APP_SCRIPT_URL}?action=getLatest`);

  if (!res.ok) {
    throw new Error("讀取使用者資料失敗，HTTP 狀態：" + res.status);
  }

  const json = await res.json();
  console.log("getLatestProfile 回傳：", json);

  // 2. 修正判斷邏輯：後端回傳的是 status，不是 ok
  if (json.status === 'success') {
    return json.data; // { gender, age, ... }
  }

  if (json.status === 'empty') {
    return null; // 資料庫是空的，不是錯誤
  }

  // 其他錯誤情況
  throw new Error(json.message || "讀取雲端資料發生未知錯誤");
}

/**
 * 儲存個人資料 (POST)
 */
export async function saveProfile(profile) {
  if (!APP_SCRIPT_URL) throw new Error("APP_SCRIPT_URL 未設定");

  // 1. 發送 POST 請求
  const res = await fetch(APP_SCRIPT_URL, {
    method: "POST",
    // 🔴 關鍵修正：必須使用 text/plain 避免 CORS 錯誤
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    throw new Error("寫入失敗，HTTP 狀態：" + res.status);
  }

  const json = await res.json();
  console.log("saveProfile 回傳：", json);

  // 2. 修正回傳邏輯
  // 後端回傳格式為: { status: 'success', message: '...' }
  if (json.status === 'success') {
    return json; // 直接把成功的物件回傳回去
  }

  // 如果後端回傳 error
  return { status: "error", message: json.message || "未知錯誤" };
}