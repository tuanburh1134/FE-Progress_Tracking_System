import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#f97316", "#a855f7", "#22c55e"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-gray-700 shadow-lg transition-all">
        <p className="text-sm font-semibold">{payload[0].name}</p>
        <p className="text-sm text-gray-300">
          Số lượng:{" "}
          <span className="text-blue-400 font-bold">
            {payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function PieChartBox({ data }) {
  return (
    <div className="bg-white dark:bg-[#0b0f1a] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
      <h2 className="text-gray-900 dark:text-white text-sm mb-4">Trạng Thái Công Việc</h2>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={false}
              isAnimationActive={true}
              animationDuration={900}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            
            <Tooltip
  content={<CustomTooltip />}
  cursor={{ fill: "rgba(255,255,255,0.08)" }}
/>  
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

