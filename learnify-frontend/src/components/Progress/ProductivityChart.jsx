import { useEffect, useRef } from "react";

const getPastDays = () => {
  const list = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    list.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      hours: 0
    });
  }
  return list;
};

const DEFAULT_DATA = getPastDays();

function loadChartJs(cb) {
  if (window.Chart) { cb(window.Chart); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
  s.onload = () => cb(window.Chart);
  document.head.appendChild(s);
}

export default function ProductivityChart({
  title    = "Weekly Study Activity",
  subtitle = `Daily study hours — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
  data     = DEFAULT_DATA,
  target   = 4,
}) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    loadChartJs((Chart) => {
      if (!canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels: data.map((d) => d.label),
          datasets: [
            {
              label: "Study Hours",
              data: data.map((d) => d.hours),
              borderColor: "#4A7FA7",
              backgroundColor: "rgba(74,127,167,0.07)",
              borderWidth: 2.5,
              pointBackgroundColor: "#ffffff",
              pointBorderColor: "#4A7FA7",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.4,
              fill: true,
            },
            {
              label: "Target",
              data: data.map(() => target),
              borderColor: "rgba(74,127,167,0.28)",
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              tension: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#fff",
              borderColor: "#D0E3F0",
              borderWidth: 1,
              titleColor: "#0A1931",
              bodyColor: "#4A6880",
              titleFont: { family: "Poppins", weight: "700", size: 12 },
              bodyFont:  { family: "Inter",   size: 12 },
              padding: 10,
              boxPadding: 4,
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(208,227,240,0.7)" },
              ticks: { color: "#8AAABF", font: { size: 11, family: "Inter" } },
            },
            y: {
              grid: { color: "rgba(208,227,240,0.7)" },
              ticks: { color: "#8AAABF", font: { size: 11, family: "Inter" } },
              min: 0,
              max: 8,
            },
          },
        },
      });
    });

    return () => chartRef.current?.destroy();
  }, [data, target]);

  return (
    <div className="h-full bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E3F0]">
        <div>
          <div
            className="text-[15px] font-bold text-[#0A1931]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {title}
          </div>
          <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            {subtitle}
          </div>
        </div>
        <button
          className="text-[12px] font-semibold text-[#4A7FA7] bg-[#deeef8] px-3 py-1.5 rounded-[7px] hover:bg-[#cce3f3] transition-colors border-none cursor-pointer"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="px-6 py-5" style={{ height: 260 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
