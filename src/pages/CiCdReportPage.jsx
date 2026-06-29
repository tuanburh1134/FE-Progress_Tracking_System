import { useState, useEffect } from "react";
import { FiRefreshCw, FiGitCommit, FiTerminal, FiCpu, FiAlertTriangle, FiCheckCircle, FiLoader } from "react-icons/fi";
import apiClient from "../services/api";

export default function CiCdReportPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/cicd/reports");
      setReports(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối đến máy chủ để tải lịch sử CI/CD.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiCpu className="text-blue-500" />
            <span>AI CI/CD Automation Reports</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Báo cáo kiểm thử tự động nhận qua GitHub Webhook và sinh mã bởi Trợ lý AI.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-[#0b0f1a] hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg text-sm transition"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
          <span className="text-sm">Đang tải lịch sử build...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lịch sử build */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Lịch sử các lần push
            </h2>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {reports.map((r) => {
                const isSuccess = r.status === "SUCCESS";
                const isFailed = r.status === "FAILED";
                const isRunning = r.status === "RUNNING";

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedReport?.id === r.id
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0f1a] hover:border-gray-400 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        <FiGitCommit />
                        {r.commitHash?.substring(0, 7) || "unknown"}
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        isSuccess ? "bg-green-500/15 text-green-400" :
                        isFailed ? "bg-red-500/15 text-red-400" :
                        isRunning ? "bg-blue-500/15 text-blue-400 animate-pulse" :
                        "bg-gray-500/15 text-gray-400"
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 mb-2">
                      {r.commitMessage || "Không có tin nhắn commit"}
                    </h3>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Nhánh: <span className="font-semibold text-gray-700 dark:text-gray-300">{r.branch}</span></span>
                      <span>{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                );
              })}

              {reports.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-600 bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-xl">
                  Chưa có lịch sử nhận Webhook từ GitHub.
                </div>
              )}
            </div>
          </div>

          {/* Chi tiết logs / AI Suggestions */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 h-full flex flex-col">
                
                {/* Header chi tiết */}
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Báo cáo Commit: {selectedReport.commitMessage}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Đẩy lên bởi <strong>{selectedReport.author}</strong> lúc {new Date(selectedReport.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedReport.status === "SUCCESS" && <FiCheckCircle className="text-green-500 text-2xl" />}
                    {selectedReport.status === "FAILED" && <FiAlertTriangle className="text-red-500 text-2xl" />}
                    {selectedReport.status === "RUNNING" && <FiLoader className="text-blue-500 text-2xl animate-spin" />}
                    <span className="font-bold text-sm uppercase">{selectedReport.status}</span>
                  </div>
                </div>

                {/* AI Suggestions / Tests generated */}
                {selectedReport.aiSuggestions && (
                  <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FiCpu />
                      <span>Các test case được AI sinh tự động</span>
                    </h3>
                    <p className="text-sm font-mono whitespace-pre-line text-gray-700 dark:text-gray-300">
                      {selectedReport.aiSuggestions}
                    </p>
                  </div>
                )}

                {/* Console Log Terminal */}
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FiTerminal />
                    <span>Nhật ký tiến trình (Console Log)</span>
                  </h3>

                  <div className="flex-1 bg-black text-gray-300 font-mono text-xs p-4 rounded-lg overflow-y-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed">
                    {selectedReport.log || "Không có nội dung log."}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500 gap-2">
                <FiTerminal className="text-4xl text-gray-300 dark:text-gray-700" />
                <p className="text-sm font-medium">Chọn một lần push ở danh sách bên trái để xem log chi tiết.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
