export default function StatCard({ title, value, subtext, icon, color = "blue" }) {
  const colorStyles = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    teal: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  };

  const badgeStyle = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white dark:bg-[#0b0f1a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-700 transition">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className={`p-2 rounded-xl border text-sm ${badgeStyle}`}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {value}
        </h2>

        {subtext && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
