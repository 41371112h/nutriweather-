import React, { useState, useRef, useEffect } from "react";
import "./geminiChat.css";

// 安全讀取環境變數
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";

export default function GeminiChatFloating() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text:
        "嗨！我是你的專屬健康顧問 😊<br><br>" +
        "不管是飲食建議、運動規劃，還是心情調適，都可以跟我聊聊喔！"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 自動滾到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // 切換聊天室
  const toggleChat = () => {
    setOpen(!open);
  };

  // 發送訊息
  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!GEMINI_API_KEY) {
      alert("❌ 找不到你的 Gemini API Key，請確認 .env 是否設定正確！");
      console.error("API KEY NOT FOUND — .env 未讀到");
      return;
    }

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // AI 系統提示（人設）
    const systemPrompt = `
你現在是一位「全方位健康管家」，結合了【專業營養師】、【體態雕塑顧問】與【心理輔導師】的三重角色。
你的目標：幫助使用者養成健康習慣、提升幸福感。

回覆原則：
1. 語氣溫暖、療癒、像老朋友。
2. 災難或焦慮情境，要先安撫情緒。
3. 食物建議一定要營養角度切入。
4. 運動建議要安全、實際。
5. 回答不超過 120 字，表情符號適量使用 😊

使用者說：${input}
    `;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }]
              }
            ]
          })
        }
      );

      if (!res.ok) {
        throw new Error(`API Error ${res.status}`);
      }

      const data = await res.json();

      let botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "抱歉，我暫時無法回應，請稍後再試。";

      botText = botText.replace(/\n/g, "<br>");

      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (err) {
      console.error("Gemini Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ 連線失敗或 API Key 錯誤，請稍後再試。"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 懸浮球按鈕 */}
      <button className="floating-ball" onClick={toggleChat}>
        💬
      </button>

      {/* 聊天窗 */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            🌿 Nutri 健康小顧問
            <button className="close-btn" onClick={toggleChat}>
              ✖
            </button>
          </div>

          <div className="chat-body">
  {messages.map((msg, i) => (
    <div
      key={i}
      className={`bubble-row ${msg.role === "user" ? "right" : "left"}`}
    >
      <div
        className={`bubble ${msg.role}`}
        dangerouslySetInnerHTML={{ __html: msg.text }}
      />
    </div>
  ))}

  {loading && (
    <div className="bubble-row left">
      <div className="bubble bot">思考中… 🤔</div>
    </div>
  )}

  <div ref={messagesEndRef} />
</div>


          <div className="chat-input-area">
            <input
              type="text"
              placeholder="想問飲食、運動或心情都可以～"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>送出</button>
          </div>
        </div>
      )}
    </>
  );
}
