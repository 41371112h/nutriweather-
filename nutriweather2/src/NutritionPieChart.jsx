import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function NutritionPieChart({
  protein = 0,
  fat = 0,
  carbs = 0,
  title = "今日營養比例（P/F/C）",
}) {
  const hasData = protein + fat + carbs > 0;

  const data = {
    labels: ["蛋白質 Protein", "脂肪 Fat", "碳水 Carbs"],
    datasets: [
        {
        data: hasData ? [protein, fat, carbs] : [1, 1, 1],

        // ⭐ 固定顏色設定
        backgroundColor: [
            "#acd3f2ff", // 🟦 蛋白質 Protein
            "#fdca87ff", // 🟨 脂肪 Fat
            "#fdcfebff", // 🟧 碳水 Carbs
        ],
        borderColor: [
            "#77bff9ff",
            "#fcc419",
            "#ffb9eaff",
        ],
        borderWidth: 1,
        },
    ],
  };


  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: title },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || "";
            const value = ctx.raw ?? 0;
            return `${label}: ${value} g`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: "100%" }}>
      {!hasData && (
        <p style={{ textAlign: "center", fontSize: 12, opacity: 0.7 }}>
          （目前還沒有營養數據，先用示意圖）
        </p>
      )}
      <Pie data={data} options={options} />
      {hasData && (
        <p style={{ textAlign: "center", fontSize: 12, opacity: 0.75, marginTop: 8 }}>
            P {protein}g / F {fat}g / C {carbs}g
        </p>
      )}
    </div>
  );
}
