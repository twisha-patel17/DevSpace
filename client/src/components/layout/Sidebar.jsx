import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  FolderKanban,
  Clock3,
  Users,
  Activity,
  Settings,
  User,
  Plus,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Workspaces",
        path: "/workspaces",
        icon: FolderKanban,
      },
      {
        label: "Shared with me",
        path: "/shared",
        icon: Users,
        count: 3,
      },
    ],
  },

  {
    title: "WORKSPACE",
    items: [
      {
        label: "Recent",
        path: "/workspaces?sort=recent",
        icon: Clock3,
      },
      {
        label: "Activity",
        path: "/activity",
        icon: Activity,
      },
    ],
  },

  {
    title: "ACCOUNT",
    items: [
      {
        label: "Profile",
        path: "/profile",
        icon: User,
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

const Sidebar = ({
  open,
  onClose,
  onCreateWorkspace,
}) => {
  const location = useLocation();

  const isItemActive = (item, routerIsActive) => {
 
    if (item.label === "Workspaces") {
      return (
        location.pathname === "/workspaces" &&
        !location.search
      );
    }

    if (item.label === "Recent") {
      return (
        location.pathname === "/workspaces" &&
        location.search === "?sort=recent"
      );
    }

    if (item.label === "Shared with me") {
      return location.pathname === "/shared";
    }

    return routerIsActive;
  };

  return (
    <>
    
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40
          bg-black/70
          backdrop-blur-sm
          transition-opacity duration-300
          lg:hidden

          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[250px] flex-col
          border-r border-white/[0.06]
          bg-[#0d0e10]
          shadow-[20px_0_60px_rgba(0,0,0,0.25)]
          transition-transform duration-300 ease-out

          lg:translate-x-0
          lg:shadow-none

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
       
        <div
          className="
            flex h-[76px]
            shrink-0
            items-center
            border-b border-white/[0.06]
            px-5
          "
        >
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="group flex items-center gap-3"
          >
            {/* Logo */}

            <span
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-[9px]
                bg-[#dc9458]
                text-[12px]
                font-black
                text-[#17110d]
                shadow-[0_0_25px_rgba(220,148,88,0.12)]
                transition-transform duration-200
                group-hover:scale-105
              "
            >
              D
            </span>

            {/* Brand */}

            <div className="flex flex-col">
              <span
                className="
                  text-[15px]
                  font-bold
                  tracking-[-0.03em]
                  text-zinc-200
                "
              >
                DevSpace
              </span>

              <span
                className="
                  mt-0.5
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  text-zinc-600
                "
              >
                Developer Platform
              </span>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              ml-auto
              flex h-8 w-8
              items-center justify-center
              rounded-lg
              border border-white/[0.06]
              text-zinc-600
              transition
              hover:bg-white/[0.05]
              hover:text-zinc-200
              lg:hidden
            "
          >
            <X size={16} />
          </button>
        </div>

        <nav
          className="
            flex-1
            overflow-y-auto
            px-3
            py-6
            scrollbar-thin
            scrollbar-track-transparent
            scrollbar-thumb-white/10
          "
        >
          {navigation.map((section) => (
            <div
              key={section.title}
              className="mb-7 last:mb-0"
            >
              
              <div
                className="
                  mb-2
                  flex
                  items-center
                  px-3
                "
              >
                <span
                  className="
                    text-[9px]
                    font-semibold
                    tracking-[0.18em]
                    text-zinc-600
                  "
                >
                  {section.title}
                </span>

                <div
                  className="
                    ml-3
                    h-px
                    flex-1
                    bg-white/[0.035]
                  "
                />
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => {
                        const active =
                          isItemActive(
                            item,
                            isActive
                          );

                        return `
                          group
                          relative
                          flex h-10
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          text-[12px]
                          font-medium
                          transition-all
                          duration-200

                          ${
                            active
                              ? "bg-[#241d19] text-zinc-100"
                              : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200"
                          }
                        `;
                      }}
                    >
                      {({ isActive }) => {
                        const active =
                          isItemActive(
                            item,
                            isActive
                          );

                        return (
                          <>
                           
                            <span
                              className={`
                                absolute
                                left-0
                                top-1/2
                                h-5
                                w-[2px]
                                -translate-y-1/2
                                rounded-r-full
                                bg-[#dc9458]
                                transition-opacity

                                ${
                                  active
                                    ? "opacity-100"
                                    : "opacity-0"
                                }
                              `}
                            />

                            <span
                              className={`
                                flex h-7 w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-md
                                transition-all
                                duration-200

                                ${
                                  active
                                    ? "bg-[#dc9458]/10 text-[#dc9458]"
                                    : "text-zinc-600 group-hover:bg-white/[0.04] group-hover:text-zinc-300"
                                }
                              `}
                            >
                              <Icon
                                size={15}
                                strokeWidth={
                                  active
                                    ? 2
                                    : 1.7
                                }
                              />
                            </span>

                            <span
                              className="
                                min-w-0
                                flex-1
                                truncate
                              "
                            >
                              {item.label}
                            </span>

                            {item.count && (
                              <span
                                className={`
                                  flex h-5
                                  min-w-5
                                  items-center
                                  justify-center
                                  rounded-full
                                  px-1.5
                                  text-[9px]
                                  font-semibold

                                  ${
                                    active
                                      ? "bg-[#dc9458]/15 text-[#dc9458]"
                                      : "bg-white/[0.04] text-zinc-600"
                                  }
                                `}
                              >
                                {item.count}
                              </span>
                            )}

                            {active && (
                              <ChevronRight
                                size={13}
                                className="
                                  text-[#dc9458]/60
                                "
                              />
                            )}
                          </>
                        );
                      }}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={onCreateWorkspace}
            className="
              group
              relative
              flex h-10
              w-full
              items-center
              justify-center
              gap-2
              overflow-hidden
              rounded-lg
              border border-[#dc9458]/20
              bg-[#dc9458]/[0.07]
              text-[11px]
              font-semibold
              text-[#dc9458]
              transition-all
              duration-200

              hover:border-[#dc9458]/40
              hover:bg-[#dc9458]/[0.12]
              active:scale-[0.98]
            "
          >
            
            <span
              className="
                absolute
                inset-0
                -translate-x-full
                bg-gradient-to-r
                from-transparent
                via-white/[0.04]
                to-transparent
                transition-transform
                duration-500
                group-hover:translate-x-full
              "
            />

            <Plus
              size={15}
              strokeWidth={2.2}
            />

            <span>
              New Workspace
            </span>
          </button>
        </div>

        <div
          className="
            border-t
            border-white/[0.06]
            p-3
          "
        >
          <div
            className="
              group
              flex
              items-center
              gap-3
              rounded-lg
              p-2
              transition
              hover:bg-white/[0.025]
            "
          >
            
            <NavLink
              to="/profile"
              onClick={onClose}
              className="
                relative
                shrink-0
              "
            >
              <div
                className="
                  flex h-9 w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-[#dc9458]
                  text-[10px]
                  font-bold
                  text-[#17110d]
                "
              >
                TP
              </div>

              <span
                className="
                  absolute
                  bottom-0
                  right-0
                  h-2.5
                  w-2.5
                  rounded-full
                  border-2
                  border-[#0d0e10]
                  bg-emerald-400
                "
              />
            </NavLink>

            <NavLink
              to="/profile"
              onClick={onClose}
              className="
                min-w-0
                flex-1
              "
            >
              <p
                className="
                  truncate
                  text-[11px]
                  font-semibold
                  text-zinc-300
                "
              >
                Twisha Patel
              </p>

              <p
                className="
                  mt-0.5
                  flex
                  items-center
                  gap-1
                  text-[9px]
                  text-zinc-600
                "
              >
                <span
                  className="
                    h-1
                    w-1
                    rounded-full
                    bg-emerald-400
                  "
                />

                Online
              </p>
            </NavLink>

            <button
              type="button"
              title="Log out"
              className="
                flex h-8 w-8
                shrink-0
                items-center
                justify-center
                rounded-md
                border border-white/[0.06]
                text-zinc-600
                transition-all

                hover:border-red-400/20
                hover:bg-red-400/[0.05]
                hover:text-red-400
              "
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;