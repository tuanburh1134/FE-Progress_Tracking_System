import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-gray-700 shadow-lg">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-gray-300">
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

export default function BarChartBox({ data }) {
  return (
    <div className="col-span-2 bg-[#0b0f1a] p-4 rounded-xl border border-gray-800 shadow-lg">
      <h3 className="mb-4 font-semibold text-white">
        Project Progress
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={6}>
          
          {/* grid nhẹ cho đẹp */}
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#9ca3af" />

          {/* tooltip xịn */}
          <Tooltip content={<CustomTooltip />} />

          {/* bar đẹp hơn */}
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            isAnimationActive={true}
            />

          {/* gradient màu */}
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
            </linearGradient>
          </defs>

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}