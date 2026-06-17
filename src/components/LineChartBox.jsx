import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-100/80 dark:bg-black/80 backdrop-blur-md text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Giá trị:{" "}
          <span className="text-blue-400 font-bold">
            {payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function LineChartBox({ data }) {
  return (
    <div className="bg-white dark:bg-[#0b0f1a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
        Hoạt Động Nhóm
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          
          {/* grid nhẹ cho đẹp hơn */}
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />

          {/* hover tooltip */}
          <Tooltip content={<CustomTooltip />} />

          {/* line đẹp + animation */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 3, fill: "#3b82f6" }}
            activeDot={{ r: 6 }}
            animationDuration={900}
            isAnimationActive={true}
          />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

