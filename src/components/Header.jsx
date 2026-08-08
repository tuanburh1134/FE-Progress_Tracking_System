import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  FiBell,
  FiSettings,
  FiAlertCircle,
  FiClipboard,
  FiMail,
  FiCheck,
  FiX,
  FiUserX,
  FiMenu,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { STORAGE_KEYS } from "../constants";
import notificationService from "../features/auth/services/notificationService";
import invitationService from "../features/auth/services/invitationService";

// ─── LocalStorage key helpers ────────────────────────────────────────────────
// Key để lưu thông báo hệ thống dành cho một user (người mời nhận thông báo từ chối, v.v.)
const getSysNotifsKey = (userId) => `sys_notifs_${userId}`;

const formatTimeAgo = (timestamp) => {
  if (!timestamp || timestamp === 0) return "Vừa xong";
  const diff = Date.now() - timestamp;
  if (diff < 0) return "Sắp tới"; // Nếu deadline trong tương lai
  if (diff < 60000) return "Vài giây trước";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

export default function Header({ open, onMobileMenuToggle }) {
  const navigate = useNavigate();

  // ── Track window width to apply sidebar offset on desktop only ────────────
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isDesktop = windowWidth >= 1024;

  const storeUser = useAuthStore((s) => s.user);
  const localUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.USER_INFO) ||
        localStorage.getItem("user") ||
        "null"
      );
    } catch { return null; }
  })();
  const currentUser = storeUser || localUser;

  const name = currentUser?.fullName || currentUser?.username || "User";
  const firstLetter = name.charAt(0).toUpperCase();

  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);   // task overdue / assigned
  const [sysNotifs, setSysNotifs] = useState([]);            // system notifs (accepted/declined)
  const [invitations, setInvitations] = useState([]);        // lời mời chờ (PENDING)
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sysAlert, setSysAlert] = useState(null);

  const notificationRef = useRef(null);
  const avatarRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    useAuthStore.getState().clearAuth();
    navigate("/login");
  };

  // ── LocalStorage key: danh sách ID đã xem ─────────────────────────────────
  const getSeenIdsKey = (uid) => `notif_seen_${uid}`;

  // ── Fetch từ API thật ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!currentUser) return;

    try {
      // 1. Lấy thông báo hệ thống từ backend
      const apiNotifs = await notificationService.getNotifications().catch(() => []);

      // Tách lời mời nhận (INVITATION_RECEIVED) vs thông báo hệ thống khác
      const pendingInviteNotifs = apiNotifs.filter(
        (n) => n.type === "INVITATION_RECEIVED" && !n.isRead
      );
      const otherSysNotifs = apiNotifs.filter(
        (n) => n.type !== "INVITATION_RECEIVED"
      );

      // Đọc thêm thông báo hệ thống tự trị từ localStorage
      const userId = String(currentUser.id || currentUser.email || "anon");
      const localSysNotifs = JSON.parse(localStorage.getItem(`sys_notifs_${userId}`) || "[]");

      setSysNotifs([...localSysNotifs, ...otherSysNotifs]);

      // 2. Lấy lời mời PENDING từ API
      const pendingInvites = await invitationService.getPendingInvitations();
      setInvitations(pendingInvites);

      // 3. Task overdue / assigned (vẫn từ localStorage nếu có)
      const projects = JSON.parse(localStorage.getItem("projects") || "[]");
      const today = new Date().toISOString().split("T")[0];
      const taskNotifs = [];

      projects.forEach((proj) => {
        const projTasks = JSON.parse(localStorage.getItem("tasks_" + proj.id) || "[]");
        const allTasks = [...projTasks];
        if (proj.tasks && Array.isArray(proj.tasks)) {
          proj.tasks.forEach((t) => {
            if (!allTasks.some((x) => x.id === t.id)) allTasks.push(t);
          });
        }

        allTasks.forEach((task) => {
          if (task.deadline && task.status !== "done" && task.deadline <= today) {
            taskNotifs.push({
              id: `overdue-${proj.id}-${task.id}`,
              projectId: proj.id,
              projectName: proj.name,
              type: "overdue",
              title: "Trễ tiến độ",
              message: `Công việc "${task.name}" đã trễ hạn (${task.deadline}).`,
            });
          }

          const isAssigned =
            task.assignee &&
            (String(task.assignee.id) === userId ||
              task.assignee.email === currentUser.email ||
              task.assignee.name === currentUser.fullName ||
              task.assignee.name === currentUser.username);

          if (isAssigned && task.status !== "done") {
            taskNotifs.push({
              id: `assigned-${proj.id}-${task.id}`,
              projectId: proj.id,
              projectName: proj.name,
              type: "assigned",
              title: "Công việc được giao",
              message: `Bạn được giao "${task.name}" trong dự án "${proj.name}".`,
              createdAt: task.assignedAt || 0,
            });
          }
        });
      });

      setNotifications(taskNotifs);

      // 4. Tính badge từ API unread count + task notifs + local unread
      const apiUnread = await notificationService.getUnreadCount().catch(() => 0);
      const localUnread = localSysNotifs.filter(n => !n.isRead).length;
      setUnreadCount(apiUnread + taskNotifs.length + localUnread);

    } catch (err) {
      // Nếu API lỗi (ví dụ backend chưa chạy), giữ yên
      console.warn("Không thể fetch notifications từ API:", err?.message);
    }
  }, [currentUser]);

  // Mount, polling mỗi 30s, và storage events
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // polling 30s
    const handler = () => fetchAll();
    window.addEventListener("storage", handler);
    window.addEventListener("storage-update", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handler);
      window.removeEventListener("storage-update", handler);
    };
  }, [fetchAll]);

  // Khi mở dropdown → mark all as read
  useEffect(() => {
    if (isOpenNotification && currentUser) {
      notificationService.markAllAsRead().catch(() => {});
      setUnreadCount((prev) => {
        // Chỉ reset phần API notifications, giữ task count
        return notifications.length; // task notifs không thay đổi
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenNotification]);

  // Click outside để đóng dropdown
  useEffect(() => {
    const onOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsOpenNotification(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setMenu(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Gộp chung tất cả các loại thông báo và sắp xếp theo thời gian mới nhất ──
  const unifiedNotifications = useMemo(() => {
    const list = [];

    // 1. Invitations
    invitations.forEach((inv) => {
      const timeVal = inv.createdAt ? (typeof inv.createdAt === "number" ? inv.createdAt : Date.parse(inv.createdAt)) : 0;
      list.push({
        id: `inv-${inv.id}`,
        tabType: "invitations",
        createdAt: timeVal || 0,
        data: inv,
        type: "invitation"
      });
    });

    // 2. Notifications (tasks overdue / assigned)
    notifications.forEach((item) => {
      const timeVal = item.createdAt ? (typeof item.createdAt === "number" ? item.createdAt : Date.parse(item.createdAt)) : 0;
      list.push({
        id: item.id,
        tabType: "tasks",
        createdAt: timeVal || 0,
        data: item,
        type: "task"
      });
    });

    // 3. SysNotifs
    sysNotifs.forEach((notif) => {
      const timeVal = notif.createdAt ? (typeof notif.createdAt === "number" ? notif.createdAt : Date.parse(notif.createdAt)) : 0;
      list.push({
        id: `sys-${notif.id}`,
        tabType: "system",
        createdAt: timeVal || 0,
        data: notif,
        type: "system"
      });
    });

    // Sắp xếp: Mới nhất lên đầu (createdAt giảm dần)
    list.sort((a, b) => b.createdAt - a.createdAt);

    return list;
  }, [invitations, notifications, sysNotifs]);

  const filteredNotifs = useMemo(() => {
    if (activeTab === "all") return unifiedNotifications;
    return unifiedNotifications.filter((n) => n.tabType === activeTab);
  }, [unifiedNotifications, activeTab]);

  // ── Đồng ý lời mời → gọi API accept ─────────────────────────────────────
  const handleAccept = async (invite) => {
    try {
      await invitationService.acceptInvitation(invite.id);
      // Refresh danh sách
      await fetchAll();
      window.dispatchEvent(new CustomEvent("storage-update"));
    } catch (e) {
      console.error("Lỗi chấp nhận lời mời:", e?.response?.data?.message || e.message);
      setSysAlert({
        title: "Lỗi chấp nhận",
        message: e?.response?.data?.message || "Không thể chấp nhận lời mời. Vui lòng thử lại.",
        icon: "⚠️"
      });
    }
  };

  // ── Từ chối lời mời → gọi API decline ────────────────────────────────────
  const handleDecline = async (invite) => {
    try {
      await invitationService.declineInvitation(invite.id);
      // Refresh
      await fetchAll();
      window.dispatchEvent(new CustomEvent("storage-update"));
    } catch (e) {
      console.error("Lỗi từ chối lời mời:", e?.response?.data?.message || e.message);
      setSysAlert({
        title: "Lỗi từ chối",
        message: e?.response?.data?.message || "Không thể từ chối lời mời. Vui lòng thử lại.",
        icon: "⚠️"
      });
    }
  };

  // ── Xoá một sys notif ───────────────────────────
  const dismissSysNotif = async (notif) => {
    const notifId = notif.id;
    if (String(notifId).startsWith("swap-") || String(notifId).startsWith("task-")) {
      const userId = String(currentUser.id || currentUser.email || "anon");
      const localSysNotifs = JSON.parse(localStorage.getItem(`sys_notifs_${userId}`) || "[]");
      const updated = localSysNotifs.filter((n) => n.id !== notifId);
      localStorage.setItem(`sys_notifs_${userId}`, JSON.stringify(updated));
      setSysNotifs(updated);
      window.dispatchEvent(new CustomEvent("storage-update"));
      return;
    }

    try {
      await notificationService.markAsRead(notifId);
      setSysNotifs((prev) => prev.filter((n) => n.id !== notifId));
    } catch {
      // ignore
    }
  };

  // ── Chấp nhận hoán đổi công việc ──────────────────────────────────────────
  const handleAcceptSwap = (notif) => {
    const { projectId, taskId, targetTaskId, requestorId, targetId, requestorName, targetName, taskName, targetTaskName } = notif.metadata;
    const taskKey = `tasks_${projectId}`;
    const allTasks = JSON.parse(localStorage.getItem(taskKey) || "[]");
    
    const taskA = allTasks.find(t => String(t.id) === String(taskId));
    const taskTarget = allTasks.find(t => String(t.id) === String(targetTaskId));
    
    if (!taskA || !taskTarget) {
      setSysAlert({
        title: "Lỗi hoán đổi",
        message: "Không tìm thấy công việc để hoán đổi. Có thể công việc đã bị xóa.",
        icon: "⚠️"
      });
      dismissSysNotif(notif);
      return;
    }
    
    const assigneeA = taskA.assignee;
    const assigneeTarget = taskTarget.assignee;
    
    // Hoán đổi
    taskA.assignee = assigneeTarget;
    taskTarget.assignee = assigneeA;
    
    localStorage.setItem(taskKey, JSON.stringify(allTasks));
    
    // Gửi thông báo thành công cho A
    const notifKeyA = `sys_notifs_${requestorId}`;
    const notifsA = JSON.parse(localStorage.getItem(notifKeyA) || "[]");
    notifsA.unshift({
      id: `task-swap-success-req-${Date.now()}`,
      type: "SWAP_SUCCESS",
      title: "🤖 Hoán đổi công việc thành công",
      message: `AI báo tin vui: ${targetName} đã đồng ý đổi việc! Bạn nhận task "${targetTaskName}" và ${targetName} nhận task "${taskName}".`,
      createdAt: Date.now(),
      isRead: false
    });
    localStorage.setItem(notifKeyA, JSON.stringify(notifsA));
    
    // Gửi thông báo thành công cho Target (D)
    const notifKeyD = `sys_notifs_${targetId}`;
    const notifsD = JSON.parse(localStorage.getItem(notifKeyD) || "[]");
    notifsD.unshift({
      id: `task-swap-success-tar-${Date.now()}`,
      type: "SWAP_SUCCESS",
      title: "🤖 Hoán đổi công việc thành công",
      message: `Bạn đã nhận task "${taskName}" của ${requestorName}, và ${requestorName} nhận task "${targetTaskName}" của bạn.`,
      createdAt: Date.now(),
      isRead: false
    });
    localStorage.setItem(notifKeyD, JSON.stringify(notifsD));

    // Xoá hàng đợi
    localStorage.removeItem(`swap_queue_${taskId}`);

    // Hủy các thông báo song song gửi cho người khác của cùng task đó
    const team = JSON.parse(localStorage.getItem("team") || "[]");
    team.forEach(m => {
      const mKey = `sys_notifs_${m.id}`;
      const mNotifs = JSON.parse(localStorage.getItem(mKey) || "[]");
      const filtered = mNotifs.filter(n => !(n.type === "SWAP_REQUEST" && String(n.metadata?.taskId) === String(taskId)));
      localStorage.setItem(mKey, JSON.stringify(filtered));
    });
    
    dismissSysNotif(notif);
    window.dispatchEvent(new CustomEvent("storage-update"));
  };

  // ── Từ chối hoán đổi công việc (AI chuyển tiếp hoặc báo thất bại) ───────────
  const handleDeclineSwap = (notif) => {
    const { projectId, taskId, targetTaskId, requestorId, targetId, requestorName, targetName, taskName, targetTaskName } = notif.metadata;
    dismissSysNotif(notif);

    const queueKey = `swap_queue_${taskId}`;
    const queueData = JSON.parse(localStorage.getItem(queueKey) || "null");
    
    if (!queueData) return;
    
    const { queue, currentIndex } = queueData;
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < queue.length) {
      const nextCandidate = queue[nextIndex];
      
      localStorage.setItem(queueKey, JSON.stringify({
        queue,
        currentIndex: nextIndex
      }));
      
      const targetNotifKey = `sys_notifs_${nextCandidate.member.id}`;
      const targetNotifs = JSON.parse(localStorage.getItem(targetNotifKey) || "[]");
      
      targetNotifs.unshift({
        id: `swap-req-${taskId}-${Date.now()}`,
        type: "SWAP_REQUEST",
        title: "🤖 Đề xuất hoán đổi công việc",
        message: `AI nhận thấy bạn đang làm task "${nextCandidate.task.name}" (Khó: ${nextCandidate.task.score}) dễ hơn task "${taskName}" (Khó: ${notif.metadata.taskScore}) của ${requestorName} đang gặp khó khăn. Bạn có đồng ý hoán đổi công việc này không?`,
        createdAt: Date.now(),
        isRead: false,
        metadata: {
          ...notif.metadata,
          targetId: nextCandidate.member.id,
          targetName: nextCandidate.member.name || nextCandidate.member.fullName,
          targetTaskId: nextCandidate.task.id,
          targetTaskName: nextCandidate.task.name
        }
      });
      
      localStorage.setItem(targetNotifKey, JSON.stringify(targetNotifs));
      window.dispatchEvent(new CustomEvent("storage-update"));
    } else {
      const requestorNotifKey = `sys_notifs_${requestorId}`;
      const requestorNotifs = JSON.parse(localStorage.getItem(requestorNotifKey) || "[]");
      requestorNotifs.unshift({
        id: `task-swap-failed-${Date.now()}`,
        type: "SWAP_FAILED",
        title: "🤖 Hoán đổi thất bại",
        message: `Không có thành viên nào đồng ý nhận hoán đổi task "${taskName}" của bạn. Bạn vui lòng liên hệ trực tiếp với nhóm để thảo luận offline.`,
        createdAt: Date.now(),
        isRead: false
      });
      localStorage.setItem(requestorNotifKey, JSON.stringify(requestorNotifs));
      localStorage.removeItem(queueKey);
      window.dispatchEvent(new CustomEvent("storage-update"));
    }
  };

  // ── Tổng hiển thị ─────────────────────────────────────────────────────────
  const totalAll = invitations.length + notifications.length + sysNotifs.length;
  const activeTasks = notifications.length;
  const activeSys = sysNotifs.length;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 h-14
        bg-white dark:bg-[#0b0f1a]
        border-b border-gray-200 dark:border-gray-800
        flex items-center justify-between
        px-4 z-30
        transition-all duration-300 ease-in-out
        lg:left-auto lg:right-0
      `}
      style={
        /* Chỉ áp dụng marginLeft trên desktop (>= 1024px) */
        isDesktop
          ? { marginLeft: open ? "16rem" : "4rem" }
          : undefined
      }
    >
      {/* LEFT — hamburger trên mobile, logo thu gọn trên desktop */}
      <div className="flex items-center gap-3">
        {/* Hamburger: chỉ hiện trên mobile */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl p-1 transition"
          aria-label="Mở menu"
        >
          <FiMenu />
        </button>
        {/* Logo hiện khi sidebar thu gọn trên desktop */}
        <span className="hidden lg:block text-gray-900 dark:text-white font-bold text-lg">
          {!open ? "ProjectHub" : ""}
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* ── HÒM THƯ ─────────────────────────────────────────────── */}
        <div className="relative" ref={notificationRef}>
          <button
            id="btn-inbox"
            onClick={() => setIsOpenNotification((v) => !v)}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl relative p-1 transition duration-200"
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="
                absolute -top-1 -right-1 bg-red-500 text-[10px] text-white
                font-bold rounded-full min-w-[18px] h-[18px] flex items-center
                justify-center animate-pulse border-2 border-[#0b0f1a] px-0.5
              ">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* ── DROPDOWN ─────────────────────────────────────────── */}
          {isOpenNotification && (
            <div
              className="
                absolute right-0 mt-3
                w-[calc(100vw-2rem)] sm:w-[360px]
                max-h-[85vh] sm:max-h-none
                bg-white dark:bg-[#0f1422] border border-gray-800 dark:border-gray-800
                rounded-xl shadow-2xl z-50 overflow-hidden
                animate-[fadeIn_.15s_ease]
              "
              style={{ animation: "slideDown .15s ease" }}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gray-100 dark:bg-[#121829] border-b border-gray-800 dark:border-gray-800 flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-sm">Hòm thư</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-400 bg-gray-800/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full">
                  {totalAll === 0 ? "Không có gì mới" : `${totalAll} thông báo`}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0e1220]">
                {[
                  { key: "all",         label: "Tất cả",                 count: totalAll },
                  { key: "tasks",       label: "Công việc",              count: activeTasks },
                  { key: "invitations", label: "Lời mời",                count: invitations.length },
                  { key: "system",      label: "Hệ thống",               count: activeSys },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 text-[11px] font-semibold border-b-2 transition flex items-center justify-center gap-1 ${
                      activeTab === tab.key
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-gray-700 text-gray-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800/60 bg-white dark:bg-[#0f1422]">
                {filteredNotifs.map((notifItem) => {
                  if (notifItem.type === "invitation") {
                    const inv = notifItem.data;
                    return (
                      <div key={notifItem.id} className="p-4 bg-purple-50 dark:bg-violet-950/10 hover:bg-purple-100 dark:hover:bg-violet-950/20 transition-colors border-b border-gray-100 dark:border-gray-800/40">
                        <div className="flex gap-3">
                          <div className="mt-0.5 text-purple-600 dark:text-purple-400 text-base flex-shrink-0">
                            <FiMail />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                Lời mời vào nhóm
                              </p>
                              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                                {formatTimeAgo(notifItem.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-relaxed">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{inv.inviterName}</span>
                              {" "}mời bạn vào{" "}
                              <span className="font-semibold text-gray-900 dark:text-white">"{inv.projectName}"</span>
                              {" "}với vai trò{" "}
                              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {inv.role || "Thành viên"}
                              </span>
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleAccept(inv)}
                                className="bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                              >
                                <FiCheck className="text-xs" /> Đồng ý
                              </button>
                              <button
                                onClick={() => handleDecline(inv)}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                              >
                                <FiX className="text-xs" /> Từ chối
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (notifItem.type === "task") {
                    const item = notifItem.data;
                    return (
                      <div
                        key={notifItem.id}
                        onClick={() => {
                          setIsOpenNotification(false);
                          navigate(`/project/${item.projectId}`);
                        }}
                        className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition cursor-pointer flex gap-3"
                      >
                        <div className={`mt-0.5 text-base flex-shrink-0 ${
                          item.type === "overdue" ? "text-red-600 dark:text-red-500" : "text-blue-600 dark:text-blue-500"
                        }`}>
                          {item.type === "overdue" ? <FiAlertCircle /> : <FiClipboard />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${
                              item.type === "overdue" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                            }`}>
                              {item.title}
                            </p>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                              {formatTimeAgo(notifItem.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-relaxed">{item.message}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 font-medium">Dự án: {item.projectName}</p>
                        </div>
                      </div>
                    );
                  }

                  if (notifItem.type === "system") {
                    const notif = notifItem.data;
                    const isSwapRequest = notif.type === "SWAP_REQUEST";
                    const isSwapSuccess = notif.type === "SWAP_SUCCESS";
                    const isSwapFailed = notif.type === "SWAP_FAILED";

                    return (
                      <div
                        key={notif.id}
                        className={`p-4 flex gap-3 transition-colors ${
                          notif.isRead ? "opacity-60" : "bg-amber-50 dark:bg-amber-950/10 hover:bg-amber-100 dark:hover:bg-amber-950/20"
                        }`}
                      >
                        <div className={`mt-0.5 text-base flex-shrink-0 ${
                          isSwapRequest ? "text-blue-500" :
                          isSwapSuccess ? "text-green-500" :
                          isSwapFailed ? "text-red-500" :
                          notif.type === "INVITATION_DECLINED" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                        }`}>
                          {isSwapRequest ? <FiClipboard /> :
                           isSwapSuccess ? <FiCheck /> :
                           isSwapFailed ? <FiAlertCircle /> :
                           notif.type === "INVITATION_DECLINED" ? <FiUserX /> : <FiCheck />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${
                              isSwapRequest ? "text-blue-500" :
                              isSwapSuccess ? "text-green-500" :
                              isSwapFailed ? "text-red-500" :
                              notif.type === "INVITATION_DECLINED" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                            }`}>
                              {notif.title || (notif.type === "INVITATION_ACCEPTED" ? "Lời mời được chấp nhận" : "Lời mời bị từ chối")}
                            </p>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                              {formatTimeAgo(notifItem.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-relaxed">{notif.message}</p>
                          
                          {isSwapRequest && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleAcceptSwap(notif)}
                                className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition"
                              >
                                Đồng ý nhận
                              </button>
                              <button
                                onClick={() => handleDeclineSwap(notif)}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                          
                          {notif.isRead && !isSwapRequest && (
                            <p className="text-[9px] text-gray-500 dark:text-gray-500 mt-1 font-medium">Đã đọc</p>
                          )}
                        </div>
                        {!isSwapRequest && (
                          <button
                            onClick={() => dismissSysNotif(notif)}
                            className="text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 self-start mt-0.5 transition"
                            title="Xoá thông báo này"
                          >
                            <FiX className="text-xs" />
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}

                {/* ── EMPTY STATE ── */}
                {((activeTab === "all" && totalAll === 0) ||
                  (activeTab === "tasks" && activeTasks === 0) ||
                  (activeTab === "invitations" && invitations.length === 0) ||
                  (activeTab === "system" && activeSys === 0)) && (
                  <div className="py-10 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-600">
                    <FiBell className="text-3xl text-gray-400 dark:text-gray-600" />
                    <p className="text-xs font-medium">Không có thông báo nào</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl transition"
        >
          <FiSettings />
        </button>

        {/* Avatar */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setMenu((v) => !v)}
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
          >
            {firstLetter}
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl text-sm z-50 overflow-hidden">
              <button
                onClick={() => { setMenu(false); navigate("/profile"); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
              >
                Hồ Sơ
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 hover:bg-red-100 dark:hover:bg-red-600 transition text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                Đăng Xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CUSTOM SYS ALERT DIALOG ── */}
      {sysAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-fadeIn p-4">
          <div className="bg-white dark:bg-[#0b0f1a] border border-blue-200 dark:border-blue-900/50 rounded-3xl w-full max-w-[420px] shadow-2xl p-6 text-center space-y-4 animate-cardIn">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-3xl mx-auto border border-blue-500/20 animate-bounce-short">
              {sysAlert.icon}
            </div>
            <div className="space-y-1.5 text-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{sysAlert.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{sysAlert.message}</p>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => setSysAlert(null)}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 active:scale-[0.98] outline-none"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

