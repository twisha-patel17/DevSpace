import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  Command,
  CheckCheck,
  X,
  Users,
  FileCode2,
  FolderKanban,
  Check,
  ArrowUpRight,
} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    type: "workspace",
    title: "Workspace invitation",
    message: "You've been invited to collaborate on a workspace.",
    time: "10 min ago",
    read: false,
  },
  {
    id: 2,
    type: "collaboration",
    title: "New collaborator",
    message: "A collaborator joined your development workspace.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "file",
    title: "File updated",
    message: "A workspace file was recently updated.",
    time: "3 hours ago",
    read: true,
  },
];

const notificationIcons = {
  workspace: FolderKanban,
  collaboration: Users,
  file: FileCode2,
};

const Topbar = ({ onMenuClick, onViewAllNotifications }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] = useState(
    initialNotifications
  );

  const notificationRef = useRef(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Close the popover when clicking outside it.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const dismissNotification = (id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <header
      className="
        sticky top-0 z-40
        h-[76px]
        border-b border-white/[0.06]
        bg-[#090a0b]/90
        backdrop-blur-2xl
      "
    >
      <div
        className="
          flex h-full items-center
          justify-between gap-4
          px-4 sm:px-6 lg:px-8
        "
      >
        {/* Left section */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-lg border border-white/[0.08]
              bg-[#111214] text-zinc-500
              transition hover:bg-[#151618] hover:text-zinc-200
              active:scale-95 lg:hidden
            "
          >
            <Menu size={18} strokeWidth={1.8} />
          </button>

          {/* Desktop search */}
          <div className="relative hidden sm:block">
            <div className="group relative w-[280px] md:w-[320px] lg:w-[380px]">
              <Search
                size={15}
                strokeWidth={1.8}
                className="
                  pointer-events-none absolute left-3.5 top-1/2
                  -translate-y-1/2 text-zinc-600
                  transition-colors
                  group-focus-within:text-[#dc9458]
                "
              />

              <input
                type="text"
                placeholder="Search workspaces, files, members..."
                className="
                  h-10 w-full rounded-lg
                  border border-white/[0.07]
                  bg-[#101113] pl-10 pr-16
                  text-[12px] text-zinc-300
                  outline-none placeholder:text-zinc-600
                  transition
                  hover:border-white/[0.11]
                  focus:border-[#dc9458]/30
                  focus:bg-[#121315]
                  focus:ring-4 focus:ring-[#dc9458]/[0.04]
                "
              />

              <div
                className="
                  pointer-events-none absolute right-2.5 top-1/2
                  flex -translate-y-1/2 items-center gap-1
                  rounded-md border border-white/[0.07]
                  bg-white/[0.02] px-1.5 py-1
                  font-mono text-[9px] text-zinc-600
                "
              >
                <Command size={9} />
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 sm:hidden">
            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-[7px] bg-[#dc9458]
                text-[10px] font-extrabold text-[#17110d]
              "
            >
              D
            </div>

            <span className="text-[14px] font-bold tracking-tight text-[#e9e9ea]">
              DevSpace
            </span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            className="
              flex h-10 w-10 items-center justify-center
              rounded-lg border border-white/[0.07]
              bg-[#101113] text-zinc-500
              transition hover:bg-[#151618] hover:text-zinc-200
              active:scale-95 sm:hidden
            "
          >
            <Search size={16} strokeWidth={1.8} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-haspopup="dialog"
              aria-expanded={isNotificationsOpen}
              onClick={() =>
                setIsNotificationsOpen((current) => !current)
              }
              className={`
                relative flex h-10 w-10 items-center justify-center
                rounded-lg border bg-[#101113]
                transition-all duration-200 active:scale-95
                ${
                  isNotificationsOpen
                    ? "border-[#dc9458]/40 text-[#dc9458]"
                    : "border-white/[0.07] text-zinc-500 hover:border-white/[0.12] hover:bg-[#151618] hover:text-zinc-200"
                }
              `}
            >
              <Bell size={17} strokeWidth={1.8} />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute -right-1 -top-1
                    flex h-[17px] min-w-[17px]
                    items-center justify-center
                    rounded-full border-2 border-[#090a0b]
                    bg-[#dc9458] px-1
                    text-[9px] font-bold text-[#17110d]
                  "
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {isNotificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="
                  absolute right-0 top-[calc(100%+14px)]
                  z-50 w-[min(380px,calc(100vw-24px))]
                  overflow-hidden rounded-xl
                  border border-white/[0.09]
                  bg-[#101113]
                  shadow-[0_20px_70px_rgba(0,0,0,0.55)]
                  animate-in fade-in slide-in-from-top-2 duration-200
                "
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/[0.06] px-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-zinc-100">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <span className="rounded-md bg-[#dc9458]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#dc9458]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      Stay updated on your workspace activity.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    aria-label="Close notifications"
                    className="
                      rounded-md p-1.5 text-zinc-500
                      transition hover:bg-white/[0.06]
                      hover:text-zinc-200
                    "
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Actions */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                      Recent activity
                    </span>

                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="
                            flex items-center gap-1.5
                            text-[10px] font-medium text-zinc-400
                            transition hover:text-[#dc9458]
                          "
                        >
                          <CheckCheck size={13} />
                          Mark all read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="
                          text-[10px] font-medium text-zinc-500
                          transition hover:text-red-400
                        "
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}

                {/* Notification list */}
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const Icon =
                        notificationIcons[notification.type] ||
                        Bell;

                      return (
                        <div
                          key={notification.id}
                          className={`
                            group relative flex gap-3 border-b
                            border-white/[0.04] px-4 py-4
                            transition-colors hover:bg-white/[0.025]
                            ${
                              !notification.read
                                ? "bg-[#dc9458]/[0.025]"
                                : ""
                            }
                          `}
                        >
                          <div
                            className="
                              flex h-9 w-9 shrink-0
                              items-center justify-center
                              rounded-lg border border-white/[0.06]
                              bg-[#191a1c] text-[#dc9458]
                            "
                          >
                            <Icon size={16} strokeWidth={1.7} />
                          </div>

                          <div className="min-w-0 flex-1 pr-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[12px] font-semibold text-zinc-200">
                                {notification.title}
                              </p>

                              {!notification.read && (
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dc9458]" />
                              )}
                            </div>

                            <p className="mt-1 text-[11px] leading-[1.6] text-zinc-500">
                              {notification.message}
                            </p>

                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-600">
                                {notification.time}
                              </span>

                              <div className="flex items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                                {!notification.read && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAsRead(notification.id)
                                    }
                                    aria-label="Mark as read"
                                    title="Mark as read"
                                    className="
                                      rounded-md p-1.5
                                      text-zinc-500 transition
                                      hover:bg-white/[0.07]
                                      hover:text-[#dc9458]
                                    "
                                  >
                                    <Check size={13} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    dismissNotification(notification.id)
                                  }
                                  aria-label="Dismiss notification"
                                  title="Dismiss"
                                  className="
                                    rounded-md p-1.5
                                    text-zinc-600 transition
                                    hover:bg-white/[0.07]
                                    hover:text-red-400
                                  "
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center px-6 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-[#191a1c]">
                        <Bell
                          size={20}
                          strokeWidth={1.5}
                          className="text-zinc-500"
                        />
                      </div>

                      <h4 className="mt-4 text-[13px] font-medium text-zinc-200">
                        You're all caught up
                      </h4>

                      <p className="mt-1.5 max-w-[230px] text-[11px] leading-5 text-zinc-500">
                        No notifications here. New workspace activity
                        will appear here when available.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-white/[0.06] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onViewAllNotifications?.();
                      }}
                      className="
                        flex w-full items-center justify-center gap-2
                        rounded-lg border border-white/[0.07]
                        bg-white/[0.02] py-2.5
                        text-[11px] font-medium text-zinc-400
                        transition hover:border-[#dc9458]/25
                        hover:bg-[#dc9458]/[0.04]
                        hover:text-[#dc9458]
                      "
                    >
                      View all notifications
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

