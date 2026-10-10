import { useState } from "react";
import {
  X,
  Bell,
  Check,
  Calendar,
  Receipt,
  Sparkles,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/firebase/notifications";

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  businessId,
  onNotificationsUpdated,
}) {
  if (!isOpen) return null;

  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkRead(id) {
    if (!businessId) return;
    await markNotificationAsRead(businessId, id);
    onNotificationsUpdated?.();
  }

  async function handleMarkAllRead() {
    if (!businessId || notifications.length === 0) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    await markAllNotificationsAsRead(businessId, unreadIds);
    onNotificationsUpdated?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-md h-full bg-white shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Notifications
              </h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread alert(s)` : "All caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-5 py-2.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              filter === "unread"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500/80" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                You're all caught up!
              </p>
              <p className="text-[11px] text-slate-400">
                New booking confirmations, payment receipts, and reminders will appear here.
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const isUnread = !n.read;
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && handleMarkRead(n.id)}
                  className={`relative rounded-2xl p-4 transition border ${
                    isUnread
                      ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20"
                      : "border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        n.type === "appointment"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40"
                          : n.type === "payment"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40"
                      }`}
                    >
                      {n.type === "appointment" ? (
                        <Calendar size={15} />
                      ) : n.type === "payment" ? (
                        <Receipt size={15} />
                      ) : (
                        <Sparkles size={15} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-400">
                        {n.createdAt?.toDate
                          ? n.createdAt.toDate().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recent alert"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
