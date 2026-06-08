export default function StatCard({ title, value }) {
  return (
    <div className="bg-[#0b0f1a] p-4 rounded-xl border border-gray-800">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}   