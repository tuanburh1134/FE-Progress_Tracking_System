import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// Tooltip nổi theo con trỏ chuột
const FloatingTooltip = ({ visible, x, y, label, value }) => {
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
          background: "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(99,102,241,0.4)",
          borderRadius: "10px",
          padding: "10px 16px",
          boxShadow: "0 8px 32px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.5)",
          minWidth: "120px",
        }}
      >
        <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
          {label}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
          Tiến độ:{" "}
          <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: "15px" }}>
            {value}%
          </span>
        </p>
      </div>
    </div>
  );
};

// Custom shape cho từng cột – nổi lên và phát sáng khi hover
const CustomBar = (props) => {
  const { x, y, width, height, fill, isHovered } = props;
  const scale = isHovered ? 1.06 : 1;
  const newHeight = height * scale;
  const newY = y - (newHeight - height);
  const newX = x - (width * (scale - 1)) / 2;
  const newWidth = width * scale;

  return (
    <g style={{ transition: "all 0.2s ease", filter: isHovered ? "drop-shadow(0 0 10px rgba(99,130,246,0.7))" : "none" }}>
      <defs>
        <linearGradient id={`barGrad-${props.index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isHovered ? "#818cf8" : "#3b82f6"} stopOpacity={1} />
          <stop offset="100%" stopColor={isHovered ? "#4f46e5" : "#1d4ed8"} stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <rect
        x={newX}
        y={newY}
        width={newWidth}
        height={newHeight}
        rx={8}
        ry={8}
        fill={`url(#barGrad-${props.index})`}
        style={{ transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
    </g>
  );
};

export default function BarChartBox({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: "", value: 0 });

  const handleMouseMove = useCallback((state, event) => {
    if (state && state.isTooltipActive && state.activePayload && state.activePayload.length) {
      const idx = state.activeTooltipIndex;
      setHoveredIndex(idx);
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        label: state.activePayload[0].payload.name,
        value: state.activePayload[0].value,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className="col-span-2 bg-[#0b0f1a] p-4 rounded-xl border border-gray-800 shadow-lg">
      <h3 className="mb-4 font-semibold text-white">Tiến Độ Dự Án</h3>

      <FloatingTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        label={tooltip.label}
        value={tooltip.value}
      />

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          barGap={6}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

          <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" />

          {/* Tắt tooltip mặc định */}
          {/* <Tooltip content={<CustomTooltip />} /> */}

          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            isAnimationActive={true}
            shape={(props) => (
              <CustomBar
                {...props}
                isHovered={props.index === hoveredIndex}
              />
            )}
          >
            {data &&
              data.map((_, index) => (
                <Cell key={`cell-${index}`} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}