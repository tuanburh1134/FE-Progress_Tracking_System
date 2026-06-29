import { useState, useEffect } from "react";
import { FiGithub, FiCopy, FiRefreshCw, FiGitCommit, FiTerminal, FiCpu, FiAlertTriangle, FiCheckCircle, FiLoader } from "react-icons/fi";

import apiClient from "../services/api";

export default function CICDTab({ tasks, team, project }) {
  const [copied, setCopied] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://unusable-backlight-prism.ngrok-free.dev/api/webhooks/github");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchReports = async () => {
    if (!project?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/cicd/reports/project/${project.id}`);
      const data = res.data?.data || [];
      setReports(data);
      if (data.length > 0) {
        setSelectedReport(data[0]);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối đến máy chủ để tải lịch sử kiểm thử.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [project?.id]);

  const parseTests = (logText) => {
    if (!logText) return { passed: 0, total: 0 };
    const regex = /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+)/i;
    const match = logText.match(regex);
    if (match) {
      const run = parseInt(match[1]) || 0;
      const failures = parseInt(match[2]) || 0;
      const errors = parseInt(match[3]) || 0;
      const passed = Math.max(0, run - failures - errors);
      return { passed, total: run };
    }
    return { passed: 0, total: 0 };
  };

  const successBuilds = reports.filter((r) => r.status === "SUCCESS").length;
  const failedBuilds  = reports.filter((r) => r.status === "FAILED").length;
  
  let totalPassed = 0;
  let totalTests = 0;
  reports.forEach((r) => {
    const { passed, total } = parseTests(r.log);
    totalPassed += passed;
    totalTests += total;
  });

  const statusConfig = {
    SUCCESS: { dot: "bg-green-500", text: "text-green-400", border: "border-green-800/40", bg: "bg-green-900/10", label: "Thành công", icon: "✓" },
    FAILED:  { dot: "bg-red-500",   text: "text-red-400",   border: "border-red-800/40",   bg: "bg-red-900/10",   label: "Thất bại",   icon: "✗" },
    RUNNING: { dot: "bg-blue-500 animate-pulse", text: "text-blue-400", border: "border-blue-800/40", bg: "bg-blue-900/10", label: "Đang chạy", icon: "↺" },
    PENDING: { dot: "bg-gray-500", text: "text-gray-400", border: "border-gray-800/40", bg: "bg-gray-900/10", label: "Chờ xử lý", icon: "•" }
  };

  return (
    <div className="space-y-5">
      
      {/* ─── GITHUB INTEGRATION & WEBHOOK GUIDE ─── */}
      <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiGithub className="text-xl text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Liên kết GitHub & Webhook CI/CD</h3>
          </div>
          {project?.githubLink ? (
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
              Đang hoạt động
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-yellow-600 dark:text-yellow-500 rounded-full">
              Chưa liên kết
            </span>
          )}
        </div>

        {project?.githubLink ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Repository đã kết nối</p>
                <a 
                  href={project.githubLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 block truncate"
                >
                  {project.githubLink}
                </a>
              </div>
              <button 
                onClick={() => window.open(project.githubLink, "_blank")}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex-shrink-0"
              >
                Mở Repo
              </button>
            </div>

            <div className="text-xs text-gray-700 dark:text-gray-400 space-y-2 border-t border-gray-200 dark:border-gray-800 pt-3">
              <p className="font-bold text-gray-900 dark:text-white">Cấu hình Webhook trên GitHub để tự động chạy Test Case:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                <li>Truy cập vào Repository của bạn trên GitHub ➜ chọn <span className="font-semibold text-gray-900 dark:text-white">Settings</span> ➜ <span className="font-semibold text-gray-900 dark:text-white">Webhooks</span> ➜ <span className="font-semibold text-gray-900 dark:text-white">Add webhook</span>.</li>
                <li className="items-center">Dán link webhook này vào mục <span className="font-semibold text-gray-900 dark:text-white">Payload URL</span>:
                  <div className="mt-1.5 flex items-center gap-2 max-w-full">
                    <code className="bg-gray-100 dark:bg-black px-2.5 py-1 rounded text-red-500 dark:text-red-400 font-mono text-[11px] select-all border border-gray-300 dark:border-gray-800 truncate flex-1">
                      https://unusable-backlight-prism.ngrok-free.dev/api/webhooks/github
                    </code>
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-[11px] font-semibold transition flex items-center gap-1 shrink-0"
                    >
                      <FiCopy className="text-xs" />
                      <span>{copied ? "Đã Copy!" : "Copy"}</span>
                    </button>
                  </div>
                </li>
                <li>Mục <span className="font-semibold text-gray-900 dark:text-white">Content type</span>: Chọn <code className="bg-gray-100 dark:bg-black px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">application/json</code>.</li>
                <li>Mục <span className="font-semibold text-gray-900 dark:text-white">Which events...</span>: Chọn <span className="font-semibold text-gray-900 dark:text-white">Just the push event</span>.</li>
                <li>Bấm <span className="font-semibold text-gray-900 dark:text-white">Add webhook</span> để hoàn tất. Mỗi khi push code lên nhánh <code className="text-indigo-600 dark:text-indigo-400">feature/deploye_sever</code>, hệ thống sẽ tự động chạy AI test suite!</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
            <p className="text-sm font-medium text-yellow-650 dark:text-yellow-500">Dự án này chưa được liên kết với GitHub Repository</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              Bạn hãy bấm vào biểu tượng chỉnh sửa bút chì ✎ tại trang Danh sách Dự án để dán link Repo GitHub của dự án này, từ đó kích hoạt tính năng tự động chạy kiểm thử thông qua Webhook!
            </p>
          </div>
        )}
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng builds",    val: reports.length, color: "text-blue-400",   border: "border-blue-800/40",   bg: "bg-blue-900/10" },
          { label: "Build thành công", val: successBuilds,       color: "text-green-400",  border: "border-green-800/40",  bg: "bg-green-900/10" },
          { label: "Build thất bại",   val: failedBuilds,        color: "text-red-400",    border: "border-red-800/40",    bg: "bg-red-900/10" },
          { label: "Test case pass",   val: totalTests > 0 ? `${totalPassed}/${totalTests}` : "—", color: "text-purple-400", border: "border-purple-800/40", bg: "bg-purple-900/10" },
        ].map((c) => (
          <div key={c.label} className={`p-4 border ${c.border} ${c.bg} rounded-2xl`}>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
          <span className="text-sm">Đang tải nhật ký code...</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">

          {/* ─── TIMELINE ─── */}
          <div className="col-span-1 bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-[#0b0f1a] flex-shrink-0">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Lịch sử các lần push</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Chọn một lần push để xem chi tiết log</p>
              </div>
              <button
                onClick={fetchReports}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-850 rounded-lg text-gray-400 hover:text-white transition"
                title="Tải lại"
              >
                <FiRefreshCw size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800">
              {reports.map((r, idx) => {
                const s = statusConfig[r.status] || statusConfig.PENDING;
                const { passed, total } = parseTests(r.log);
                const isSelected = selectedReport?.id === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition cursor-pointer ${
                      isSelected ? "bg-blue-500/5 border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                        <FiGitCommit />
                        {r.commitHash?.substring(0, 7) || "unknown"}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${s.text} ${s.bg} border ${s.border}`}>
                        {r.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-gray-800 dark:text-white truncate mb-1" title={r.commitMessage}>
                      {r.commitMessage || "Không có message"}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                      <span>Nhánh: <code className="text-indigo-400">⎇ {r.branch}</code></span>
                      <span>{new Date(r.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: total > 0 ? `${(passed / total) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-[9px] text-green-400 font-medium">{passed}/{total} Pass</span>
                    </div>
                  </div>
                );
              })}

              {reports.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-600 italic">
                  Chưa nhận được commit nào từ GitHub của dự án này.
                </div>
              )}
            </div>
          </div>

          {/* ─── DETAILS & LOG CONSOLE ─── */}
          <div className="col-span-2 bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            {selectedReport ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header chi tiết */}
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-[#0b0f1a]/50 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                        Commit: {selectedReport.commitMessage}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Tác giả: <strong className="text-gray-350">{selectedReport.author}</strong> • Nhánh: <code className="text-indigo-400">{selectedReport.branch}</code> • {new Date(selectedReport.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-xl">
                      {selectedReport.status === "SUCCESS" && <FiCheckCircle className="text-green-500 text-sm" />}
                      {selectedReport.status === "FAILED" && <FiAlertTriangle className="text-red-500 text-sm" />}
                      {selectedReport.status === "RUNNING" && <FiLoader className="text-blue-500 text-sm animate-spin" />}
                      <span className="font-bold text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-300">{selectedReport.status}</span>
                    </div>
                  </div>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* AI Suggestions / Tests generated */}
                  {selectedReport.aiSuggestions && (
                    <div className="p-4 bg-blue-900/10 border border-blue-800/20 rounded-xl">
                      <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FiCpu />
                        <span>Trợ lý AI tự động viết Unit Test</span>
                      </h5>
                      <div className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {selectedReport.aiSuggestions}
                      </div>
                    </div>
                  )}

                  {/* Log console terminal */}
                  <div className="flex flex-col h-[300px]">
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FiTerminal />
                      <span>Console Log tiến trình chạy Maven Test</span>
                    </h5>
                    <pre className="flex-1 bg-black text-gray-300 font-mono text-[11px] p-4 rounded-xl overflow-y-auto whitespace-pre-wrap leading-relaxed border border-gray-900 shadow-inner">
                      {selectedReport.log || "Không có log."}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2.5">
                <FiTerminal size={40} className="text-gray-300 dark:text-gray-800" />
                <p className="text-xs font-medium">Chọn một lần push bên danh sách để xem log tiến trình chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
