import {
  MoreVertical,
  Plus,
  UserRound,
  FileText,
  Activity,
} from "lucide-react";

const workspaces = [
  {
    language: "JS",
    languageColor: "bg-[#302f1c] text-[#e5c82d]",
    title: "Portfolio",
    subtitle: "JavaScript · 3 collaborators",
    avatars: ["TP", "RK", "PS"],
    time: "12m ago",
  },
  {
    language: "C++",
    languageColor: "bg-[#1c2638] text-[#72a4e2]",
    title: "DSA Practice",
    subtitle: "C++ · 1 collaborator",
    avatars: ["TP"],
    time: "Yesterday",
  },
  {
    language: "PY",
    languageColor: "bg-[#1c3029] text-[#65bc8d]",
    title: "Quest API",
    subtitle: "Python · 2 collaborators",
    avatars: ["TP", "PS"],
    time: "3 days ago",
  },
];

const quickActions = [
  {
    title: "New Workspace",
    icon: Plus,
  },
  {
    title: "Shared With Me",
    icon: UserRound,
  },
  {
    title: "Recent Files",
    icon: FileText,
  },
  {
    title: "Activity",
    icon: Activity,
  },
];

const activities = [
  {
    text: "Rahul joined Portfolio",
    time: "10:42 AM",
    dot: "bg-[#73a8e9]",
  },
  {
    text: "You edited App.jsx",
    time: "10:18 AM",
    dot: "bg-[#df9758]",
  },
  {
    text: "Priya created Navbar.jsx",
    time: "9:51 AM",
    dot: "bg-[#a67adb]",
  },
];

const AvatarStack = ({ avatars }) => {
  const styles = [
    "bg-[#df9758] text-[#17110d]",
    "bg-[#73a8e9] text-[#111214]",
    "bg-[#a67adb] text-[#111214]",
  ];

  return (
    <div className="flex items-center pl-1">
      {avatars.map((avatar, index) => (
        <span
          key={`${avatar}-${index}`}
          className={`
            -ml-1 flex h-[17px] w-[17px]
            items-center justify-center
            rounded-full border border-[#17181a]
            text-[7px] font-bold
            ${styles[index % styles.length]}
          `}
        >
          {avatar}
        </span>
      ))}
    </div>
  );
};

const WorkspaceCard = ({ workspace }) => {
  return (
    <article
      className="
        rounded-[11px]
        border border-white/[0.075]
        bg-[#111214]
        p-[18px]
        transition-all duration-200
        hover:border-white/[0.13]
        hover:bg-[#151618]
      "
    >
      <div className="flex items-start justify-between">
        <div
          className={`
            flex h-9 min-w-9 items-center justify-center
            rounded-[9px] px-2
            font-mono text-[10px] font-medium
            ${workspace.languageColor}
          `}
        >
          {workspace.language}
        </div>

        <button
          className="
            flex h-7 w-7 items-center justify-center
            rounded-md text-[#6d6e72]
            hover:bg-white/[0.05]
            hover:text-zinc-200
          "
        >
          <MoreVertical size={15} />
        </button>
      </div>

      <div className="mt-3">
        <h3 className="text-[14px] font-semibold tracking-[-0.015em] text-zinc-200">
          {workspace.title}
        </h3>

        <p className="mt-1 text-[11px] text-[#626368]">
          {workspace.subtitle}
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <AvatarStack avatars={workspace.avatars} />

        <span className="text-[10px] text-[#626368]">
          {workspace.time}
        </span>
      </div>
    </article>
  );
};

const DashboardPage = () => {
  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100">
      {/* 
        Your existing Topbar is already fixed.
        Keep enough top padding for it.
      */}
      <div className="px-4 pb-10 pt-[105px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">

          {/* Greeting */}
          <section className="mb-8">
            <h1
              className="
                text-[24px] font-bold
                tracking-[-0.04em]
                text-[#ededee]
                sm:text-[26px]
              "
            >
              Good afternoon, Twisha
            </h1>

            <p className="mt-1 text-[13px] text-[#77787d]">
              Continue building where you left off.
            </p>
          </section>

          {/* Recent Workspaces */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[#dcdcdf]">
                Recent workspaces
              </h2>

              <button className="text-[11px] text-[#df9758] hover:text-[#eca267]">
                View all
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.title}
                  workspace={workspace}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-11">
            <h2 className="mb-3 text-[14px] font-semibold text-[#dcdcdf]">
              Quick actions
            </h2>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    className="
                      group flex min-h-[96px]
                      flex-col items-start
                      justify-between
                      rounded-[11px]
                      border border-white/[0.075]
                      bg-[#111214]
                      p-[18px]
                      text-left
                      transition-all duration-200
                      hover:border-white/[0.13]
                      hover:bg-[#17181a]
                    "
                  >
                    <span
                      className="
                        flex h-8 w-8
                        items-center justify-center
                        rounded-[7px]
                        bg-[#2c231d]
                        text-[#df9758]
                      "
                    >
                      <Icon size={15} strokeWidth={1.8} />
                    </span>

                    <span className="text-[13px] font-semibold text-[#d9d9dc]">
                      {action.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mt-11">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[#dcdcdf]">
                Recent activity
              </h2>

              <button className="text-[11px] text-[#df9758] hover:text-[#eca267]">
                View all
              </button>
            </div>

            <div
              className="
                overflow-hidden
                rounded-[11px]
                border border-white/[0.075]
                bg-[#111214]
              "
            >
              {activities.map((activity, index) => (
                <div
                  key={activity.text}
                  className={`
                    flex min-h-[42px]
                    items-center gap-3
                    px-4
                    ${
                      index !== activities.length - 1
                        ? "border-b border-white/[0.045]"
                        : ""
                    }
                  `}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${activity.dot}`}
                  />

                  <p className="flex-1 text-[12px] text-[#d0d0d3]">
                    {activity.text}
                  </p>

                  <span className="text-[10px] text-[#55565b]">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
};

export default DashboardPage;