import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 以 selectedDate（YYYY-MM-DD）算出那週的週一～週日
function getWeekDates(selectedDateStr) {
  const d = new Date(selectedDateStr);
  const day = d.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1) - day; // 算到週一
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);

  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x;
  });
}

export default function WeeklyWaterChart({ selectedDate }) {
  const { labels, values } = useMemo(() => {
    const history = JSON.parse(localStorage.getItem("water_history") || "{}");

    const dates = getWeekDates(selectedDate);
    const labels = dates.map((d) => {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}/${dd}`;
    });

    const values = dates.map((d) => {
      const key = toISODate(d);
      return Number(history[key] || 0);
    });

    return { labels, values };
  }, [selectedDate]);

  const data = {
    labels,
    datasets: [
      {
        label: "飲水量 (ml)",
        data: values,
        // 不指定顏色也可以，但你想固定藍色我也能幫你加
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "ml" } },
    },
  };

  return <Bar data={data} options={options} />;
}
