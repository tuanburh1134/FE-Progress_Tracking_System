import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

// Màu cho từng trạng thái
const COLORS = ["#3b82f6", "#f97316", "#a855f7", "#22c55e", "#ef4444"];

// Tooltip nổi theo con trỏ chuột (giống BarChartBox)
const FloatingTooltip = ({ visible, x, y, name, value, color }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: x + 14,
        top: y - 10,
        pointerEvents: "none",
        zIndex: 9999,
        transform: "translateY(-100%)",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${color}55`,
          borderRadius: "10px",
          padding: "10px 16px",
          boxShadow: `0 8px 32px ${color}33, 0 2px 8px rgba(0,0,0,0.5)`,
          minWidth: "130px",
        }}
      >
        {/* Chấm màu + tên */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
          <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700, margin: 0 }}>
            {name}
          </p>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0, paddingLeft: "18px" }}>
          Số lượng:{" "}
          <span style={{ color, fontWeight: 800, fontSize: "15px" }}>{value}</span>
        </p>
      </div>
    </div>
  );
};

// Shape slice đang được hover – nổi lên với outerRadius lớn hơn + glow
const ActiveSlice = (props) => {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle,
    fill,
  } = props;

  return (
    <g>
      {/* Glow layer phía sau */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 18}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.18}
      />
      {/* Slice chính nổi lên */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={1.5}
        strokeOpacity={0.8}
      />
    </g>
  );
};

export default function PieChartBox({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false, x: 0, y: 0, name: "", value: 0, color: "",
  });

  const handleMouseEnter = useCallback((_, index, event) => {
    setActiveIndex(index);
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      name: data[index]?.name ?? "",
      value: data[index]?.value ?? 0,
      color: COLORS[index % COLORS.length],
    });
  }, [data]);

  const handleMouseMove = useCallback((_, index, event) => {
    if (activeIndex === index) {
      setTooltip((prev) => ({ ...prev, x: event.clientX, y: event.clientY }));
    }
  }, [activeIndex]);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Nếu không có dữ liệu, hiện placeholder
  const isEmpty = !data || data.length === 0;

  return (
    <div className="bg-white dark:bg-[#0b0f1a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
      <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Trạng Thái Công Việc</h2>

      {/* Tooltip theo chuột */}
      <FloatingTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        name={tooltip.name}
        value={tooltip.value}
        color={tooltip.color}
      />

      {isEmpty ? (
        <div className="flex items-center justify-center h-56 text-gray-600 dark:text-gray-400 text-sm">
          Chưa có dữ liệu
        </div>
      ) : (
        <>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={82}
                  innerRadius={36}
                  paddingAngle={3}
                  isAnimationActive={true}
                  animationDuration={900}
                  activeIndex={activeIndex}
                  activeShape={ActiveSlice}
                  onMouseEnter={handleMouseEnter}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      style={{ cursor: "pointer", transition: "opacity 0.2s ease" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {data.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
                style={{
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {entry.name}
                  </span>
                </div>
                <span
                  className="font-bold"
                  style={{ color: COLORS[index % COLORS.length] }}
                >
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

