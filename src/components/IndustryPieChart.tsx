"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
  type TooltipItem,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const sizes = [20, 15, 10, 12, 9, 8, 7, 6, 5, 8];

const colors = [
  "#FF9999",
  "#66B3FF",
  "#99FF99",
  "#FFCC99",
  "#FF99CC",
  "#99CCFF",
  "#FF99FF",
  "#FFFF99",
  "#99FFCC",
  "#FFB366",
];

const LABELS = {
  zh: {
    title: "2024 年悉尼各行业经济占比",
    items: [
      "金融与保险业",
      "专业、科学与技术服务业",
      "教育与培训业",
      "医疗与社会援助服务业",
      "零售贸易业",
      "制造业",
      "住宿与餐饮服务业",
      "信息媒体与电信业",
      "建筑业",
      "其他行业",
    ],
  },
  en: {
    title: "Sydney Industry Distribution (2024)",
    items: [
      "Finance & Insurance",
      "Professional, Scientific & Tech",
      "Education & Training",
      "Healthcare & Social Assistance",
      "Retail Trade",
      "Manufacturing",
      "Accommodation & Food",
      "Information Media & Telecom",
      "Construction",
      "Other Industries",
    ],
  },
} as const;

export const IndustryPieChart = ({ locale }: { locale: "zh" | "en" }) => {
  const labels = LABELS[locale];

  const data: ChartData<"pie"> = {
    labels: [...labels.items],
    datasets: [
      {
        data: sizes,
        backgroundColor: colors,
        borderColor: colors.map((c) => c.replace("FF", "CC")),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 11 },
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"pie">) =>
            `${ctx.label || ""}: ${ctx.parsed || 0}%`,
        },
      },
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-yellow-900 text-center">
          {labels.title}
        </h3>
        <div className="h-[280px] sm:h-[360px]">
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  );
};
