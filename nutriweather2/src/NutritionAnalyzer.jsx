import React, { useState } from "react";
import { Radar } from "react-chartjs-2";
import { getNutrition } from "./nutritionApi";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function NutritionAnalyzer() {
  const [food, setFood] = useState("");
  const [displayFoodName, setDisplayFoodName] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 🔥 新增：追蹤卡片是否被滑鼠懸停
  const [isHovered, setIsHovered] = useState(false);

  const API_KEY = process.env.REACT_APP_CALORIE_NINJA_KEY;

  const analyze = async () => {
    if (!food.trim()) return;
    setLoading(true);
    setNutrition(null);

    try {
      const data = await getNutrition(food, API_KEY);
      setNutrition(data);
      setDisplayFoodName(food);
    } catch (err) {
      alert("查詢失敗，請確認食材名稱或嘗試英文");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
       
      <div 
        style={{
          ...styles.card,
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          border: isHovered ? '1px solid #4263eb' : '2px solid transparent',
          boxShadow: isHovered ? '0 20px 40px rgba(66, 99, 235, 0.15)' : styles.card.boxShadow
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 style={styles.title}>食材營養分析</h2>
        
        {/* 搜尋區塊 */}
        <div style={styles.searchBox}>
          <input
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="輸入食物 (例如：雞胸肉)"
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
          />
          <button 
            onClick={analyze} 
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading ? "分析中..." : "開始分析"}
          </button>
        </div>

        {/* 結果顯示區塊 (左右佈局) */}
        {nutrition && (
          <div style={styles.resultContainer}>
            
            {/* 左側：數值資訊 */}
            <div style={styles.infoColumn}>
              <h3 style={styles.foodName}>
                {displayFoodName} 
                <span style={styles.subName}>({nutrition.name})</span>
              </h3>
              
              <div style={styles.mainStat}>
                <span style={styles.caloriesLabel}>🔥 熱量</span>
                <span style={styles.caloriesValue}>{nutrition.calories}</span>
                <span style={styles.caloriesUnit}>kcal</span>
              </div>

              <div style={styles.macroGrid}>
                <MacroCard label="蛋白質" value={nutrition.protein_g} unit="g" color="#4a90e2" />
                <MacroCard label="碳水" value={nutrition.carbohydrates_total_g} unit="g" color="#f5a623" />
                <MacroCard label="脂肪" value={nutrition.fat_total_g} unit="g" color="#d0021b" />
                <MacroCard label="糖分" value={nutrition.sugar_g} unit="g" color="#bd10e0" />
              </div>
            </div>

            {/* 右側：雷達圖 */}
            <div style={styles.chartColumn}>
              <div style={styles.chartWrapper}>
                <Radar
                  data={{
                    labels: ["蛋白質", "碳水", "脂肪", "糖分", "纖維"],
                    datasets: [
                      {
                        label: '營養分佈',
                        data: [
                          nutrition.protein_g,
                          nutrition.carbohydrates_total_g,
                          nutrition.fat_total_g,
                          nutrition.sugar_g,
                          nutrition.fiber_g
                        ],
                        backgroundColor: "rgba(63, 89, 116, 0.2)",
                        borderColor: "#3f5974",
                        borderWidth: 2,
                        pointBackgroundColor: "#fff",
                        pointBorderColor: "#3f5974",
                        pointHoverBackgroundColor: "#3f5974",
                        pointHoverBorderColor: "#fff",
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false, // 讓圖表適應容器大小
                    scales: {
                      r: {
                        angleLines: { color: 'rgba(0,0,0,0.05)' },
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        suggestedMin: 0,
                        pointLabels: {
                          font: { size: 12, family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" },
                          color: '#666'
                        }
                      }
                    },
                    plugins: {
                      legend: { display: false } // 隱藏圖例讓畫面更乾淨
                    }
                  }}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// 簡單的小元件：顯示單個營養素
const MacroCard = ({ label, value, unit, color }) => (
  <div style={{...styles.macroItem, borderLeft: `4px solid ${color}`}}>
    <div style={styles.macroLabel}>{label}</div>
    <div style={styles.macroValue}>{value} <span style={{fontSize: '0.8rem'}}>{unit}</span></div>
  </div>
);

// 樣式表 (Inline Styles)
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: '#f5f7fa',
    minHeight: '60vh',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    padding: '10px',
    width: '100%',
    maxWidth: '100%', 
    
    transition: 'all 0.3s ease', // 確保浮起與變色動畫平滑
  },
  title: {
    textAlign: 'left',
    marginBottom: '30px',
    color: '#2c3e50',
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  searchBox: {
    display: 'flex',
    justifyContent: 'left',
    gap: '10px',
    marginBottom: '40px',
  },
  input: {
    padding: '12px 25px',
    width: '100%',
    maxWidth: '500px',
    borderRadius: '50px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px 30px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: '#3f5974', // 主色調
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    padding: '12px 30px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: '#ccc',
    color: '#fff',
    cursor: 'not-allowed',
  },
  
  // 結果容器
  resultContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '40px',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '30px',
  },
  
  infoColumn: {
    flex: '1',
    minWidth: '280px',
  },
  foodName: {
    fontSize: '1.5rem',
    color: '#34495e',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  subName: {
    fontSize: '1rem',
    color: '#95a5a6',
    fontWeight: 'normal',
  },
  mainStat: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  caloriesLabel: {
    fontSize: '1rem',
    color: '#666',
    fontWeight: 'bold',
  },
  caloriesValue: {
    fontSize: '2.5rem',
    color: '#3f5974',
    fontWeight: '800',
    lineHeight: '1',
  },
  caloriesUnit: {
    color: '#888',
  },
  macroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
  },
  macroItem: {
    padding: '10px 15px',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
  },
  macroLabel: {
    fontSize: '0.85rem',
    color: '#888',
    marginBottom: '5px',
  },
  macroValue: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333',
  },

  chartColumn: {
    flex: '1',
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    width: '100%',
    height: '350px', 
    position: 'relative',
  }
};