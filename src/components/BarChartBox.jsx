import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
        <p className="text-xs font-bold text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Tiến độ hoàn thành:{" "}
          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
            {payload[0].value}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom shape cho từng cột – nổi lên và phát sáng khi hover
const CustomBar = (props) => {
  const { x, y, width, height, isHovered } = props;
  const scale = isHovered ? 1.05 : 1;
  const newHeight = Math.max(height * scale, 4);
  const newY = y - (newHeight - height);
  const newX = x - (width * (scale - 1)) / 2;
  const newWidth = width * scale;

  return (
    <g style={{ transition: "all 0.2s ease", filter: isHovered ? "drop-shadow(0 0 10px rgba(59,130,246,0.8))" : "none" }}>
      <defs>
        <linearGradient id={`barGrad-${props.index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isHovered ? "#60a5fa" : "#3b82f6"} stopOpacity={1} />
          <stop offset="100%" stopColor={isHovered ? "#2563eb" : "#1d4ed8"} stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <rect
        x={newX}
        y={newY}
        width={newWidth}
        height={newHeight}
        rx={6}
        ry={6}
        fill={`url(#barGrad-${props.index})`}
        style={{ transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
    </g>
  );
};

export default function BarChartBox({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleMouseMove = useCallback((state) => {
    if (state && state.isTooltipActive) {
      setHoveredIndex(state.activeTooltipIndex);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const isEmpty = !data || data.length === 0;

  return (
    <div className="col-span-2 bg-white dark:bg-[#0b0f1a] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Tiến Độ Từng Dự Án (%)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Phần trăm hoàn thành task của từng dự án
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-60 text-xs text-gray-400 italic">
          Chưa có dự án nào để hiển thị tiến độ
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            barGap={6}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#9ca3af"
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              isAnimationActive={true}
              shape={(props) => (
                <CustomBar
                  {...props}
                  isHovered={props.index === hoveredIndex}
                />
              )}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
