import React, { useState } from "react";
import { saveProfile as saveProfileToSheet } from "./sheetApi";

const STORAGE_KEY = "nutriProfile";

export default function PersonalForm({ onProfileUpdate }) {
  // 1. 狀態初始化：移除了 location
  const [profile, setProfile] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    goal: ""
  });
  
  const [status, setStatus] = useState(""); 

  const handleChange = (e) => {
    const newProfile = {
      ...profile,
      [e.target.name]: e.target.value,
    };
    setProfile(newProfile);
    if (onProfileUpdate) onProfileUpdate(newProfile);
  };

  const saveProfile = async (e) => {
    if(e) e.preventDefault(); 
    setStatus("儲存中...");

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

        // 為了配合後端 Sheet 的欄位順序 (它預期最後一個是 location)，
        // 我們補一個空字串給它，避免欄位錯位
        const profileForBackend = { ...profile, location: "" };

        const res = await saveProfileToSheet(profileForBackend);
        
        if (res.status === 'success') {
            alert("✔ 個人設定已更新！");
            setStatus("儲存完成");
            localStorage.setItem("hasProfile", "true");
            window.dispatchEvent(new Event("profileUpdated"));
            if (onProfileUpdate) onProfileUpdate(profile);
        } else {
            alert("⚠️ 儲存失敗：" + (res.message || "未知錯誤"));
        }
    } catch (err) {
        console.error(err);
        alert("❌ 連線錯誤");
        setStatus("錯誤");
    }
  };

  return (
    <div className="card section">
      <h2>個人設定</h2>
      <p className="section-desc">請輸入您的基本資料以進行客製化推薦</p>
      
      {status && <p style={{fontSize: '12px', color: '#666'}}>{status}</p>}

      {/* 🔥 修改樣式：將 grid-template-columns 設為 repeat(5, 1fr) 
          這樣 5 個欄位就會強制排在同一行
      */}
      <div 
        className="form-grid" 
        style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '12px',
            alignItems: 'end' /* 讓標籤長度不同時，輸入框底部對齊 */
        }}
      >

        {/* 1. 性別 */}
        <div className="form-group">
          <label>性別</label>
          <select name="gender" value={profile.gender} onChange={handleChange}>
            <option value="">請選擇</option>
            <option value="female">女</option>
            <option value="male">男</option>
          </select>
        </div>

        {/* 2. 年齡 */}
        <div className="form-group">
          <label>年齡</label>
          <input type="number" name="age" value={profile.age} onChange={handleChange}  />
        </div>

        {/* 3. 身高 */}
        <div className="form-group">
          <label>身高 (cm)</label>
          <input type="number" name="height" value={profile.height} onChange={handleChange} placeholder="cm" />
        </div>

        {/* 4. 體重 */}
        <div className="form-group">
          <label>體重 (kg)</label>
          <input type="number" name="weight" value={profile.weight} onChange={handleChange} placeholder="kg" />
        </div>

        {/* 5. 目標 (含增肌) */}
        <div className="form-group">
          <label>目標</label>
          <select name="goal" value={profile.goal} onChange={handleChange}>
            <option value="">請選擇</option>
            <option value="lose">減脂</option>
            <option value="maintain">維持</option>
            <option value="gain">增肌</option>
          </select>
        </div>

        {/* ❌ 已移除地區欄位 */}
      </div>

      <button type="button" className="btn primary-btn" onClick={saveProfile} style={{marginTop: '20px'}}>
        儲存設定
      </button>
    </div>
  );
}