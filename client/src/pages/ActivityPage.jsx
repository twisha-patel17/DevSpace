import { useMemo, useState } from "react";
import {
Activity,
Search,
GitBranch,
FileCode2,
FolderPlus,
Users,
Pencil,
Trash2,
Clock3,
Filter,
History,
ArrowUpRight,
CircleDashed,
CalendarDays,
X
} from "lucide-react";

const FILTERS = [
{ id: "all", label: "All activity" },
{ id: "workspace", label: "Workspaces" },
{ id: "file", label: "Files" },
{ id: "collaboration", label: "Collaboration" },
];

const ACTION_ICONS = {
created: FolderPlus,
updated: Pencil,
deleted: Trash2,
joined: Users,
default: Activity,
};

const ActivityIcon = ({ action, category }) => {
const Icon =
ACTION_ICONS[action] ||
(category === "file"
? FileCode2
: category === "workspace"
? GitBranch
: Activity);

return ( <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dc9458]/15 bg-[#dc9458]/[0.07] text-[#dc9458]"> <Icon size={17} /> </div>
);
};

const EmptyState = ({ searching, onClear }) => (

  <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      {searching ? (
        <Search size={26} className="text-zinc-600" />
      ) : (
        <History size={27} className="text-zinc-600" />
      )}
    </div>

<h3 className="text-base font-semibold text-[#e9e2da]">
  {searching ? "No matching activity" : "Your timeline starts here"}
</h3>

<p className="mt-2 max-w-sm text-sm leading-6 text-[#858078]">
  {searching
    ? "Try a different search term or choose another activity category."
    : "Workspace creation, file changes, and collaboration events will appear here when activity tracking is connected."}
</p>

{searching ? (
  <button
    type="button"
    onClick={onClear}
    className="mt-4 inline-flex items-center gap-2 text-sm text-[#dc9458] transition hover:text-[#e9b17e]"
  >
    <X size={14} />
    Clear search
  </button>
) : (
  <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-[#858078]">
    <CircleDashed size={14} />
    Waiting for recorded events
  </div>
)}
  </div>
);

const ActivityPage = () => {
const [filter, setFilter] = useState("all");
const [search, setSearch] = useState("");

// Real activity records will be loaded from the backend later.
const activities = [];

const filteredActivities = useMemo(() => {
const query = search.trim().toLowerCase();

return activities.filter((item) => {
  const matchesFilter =
    filter === "all" || item.category === filter;

  const searchableText = [
    item.description,
    item.workspaceName,
    item.targetName,
    item.actorName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return matchesFilter && searchableText.includes(query);
});

}, [activities, filter, search]);

const formatDate = (date) => {
const parsed = new Date(date);

if (Number.isNaN(parsed.getTime())) {
  return "Unknown date";
}

return new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(parsed);

};

const stats = [
{
label: "Total events",
value: activities.length,
icon: Activity,
},
{
label: "Workspace events",
value: activities.filter(
(item) => item.category === "workspace"
).length,
icon: GitBranch,
},
{
label: "File changes",
value: activities.filter(
(item) => item.category === "file"
).length,
icon: FileCode2,
},
];

return ( <div className="mx-auto w-full max-w-6xl px-5 py-8 text-[#e9e2da] sm:px-8 lg:py-10">
{/* Page heading */} <div className="mb-8"> <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#dc9458]">
Workspace history </p>

    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#f2eee9] sm:text-4xl">
          Activity
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-[#96918b]">
          Follow the changes, updates, and collaboration happening
          across your DevSpace workspaces.
        </p>
      </div>

      <div className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-[#101214] px-3.5 py-2.5 text-xs text-[#96918b]">
        <CalendarDays size={15} className="text-[#dc9458]" />
        Activity timeline
      </div>
    </div>
  </div>

  {/* Summary cards */}
  <div className="mb-6 grid gap-4 sm:grid-cols-3">
    {stats.map(({ label, value, icon: Icon }) => (
      <div
        key={label}
        className="rounded-2xl border border-white/[0.08] bg-[#101214] p-5 transition hover:border-white/[0.13]"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs text-[#96918b]">{label}</span>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
            <Icon size={16} className="text-[#dc9458]" />
          </div>
        </div>

        <p className="text-3xl font-semibold tracking-tight text-[#f2eee9]">
          {value}
        </p>

        <p className="mt-2 text-xs text-[#69645f]">
          {value === 0 ? "No events recorded yet" : "Recorded events"}
        </p>
      </div>
    ))}
  </div>

  {/* Timeline */}
  <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101214]">
    <div className="border-b border-white/[0.07] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg border border-[#dc9458]/15 bg-[#dc9458]/[0.07] p-2">
          <History size={18} className="text-[#dc9458]" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[#f2eee9]">
            Recent events
          </h2>
          <p className="mt-1 text-xs text-[#858078]">
            A chronological record of workspace activity.
          </p>
        </div>

        <span className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-xs text-[#96918b]">
          {filteredActivities.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ id, label }) => {
            const active = filter === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={active}
                className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium transition ${
                  active
                    ? "border-[#dc9458]/30 bg-[#dc9458]/[0.09] text-[#e9b17e]"
                    : "border-white/[0.08] text-[#96918b] hover:bg-white/[0.04] hover:text-[#e9e2da]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0b0d0f] px-3.5 py-2.5 transition focus-within:border-[#dc9458]/50 xl:w-72">
          <Search size={16} className="shrink-0 text-[#69645f]" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activity..."
            aria-label="Search activity"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#e9e2da] outline-none placeholder:text-[#69645f]"
          />

          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="text-[#858078] hover:text-white"
            >
              <X size={14} />
            </button>
          )}

          <Filter size={14} className="shrink-0 text-[#69645f]" />
        </label>
      </div>
    </div>

    {/* Event list / empty state */}
    {filteredActivities.length === 0 ? (
      <EmptyState
        searching={Boolean(search.trim())}
        onClear={() => setSearch("")}
      />
    ) : (
      <div className="divide-y divide-white/[0.06]">
        {filteredActivities.map((item) => (
          <article
            key={item._id}
            className="flex gap-4 px-5 py-5 transition hover:bg-white/[0.015] sm:px-6"
          >
            <ActivityIcon
              action={item.action}
              category={item.category}
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6 text-[#e9e2da]">
                {item.description}
              </p>

              {(item.workspaceName || item.targetName) && (
                <p className="mt-1 text-xs text-[#858078]">
                  {item.workspaceName || "Workspace"}
                  {item.targetName ? ` · ${item.targetName}` : ""}
                </p>
              )}

              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#69645f]">
                <Clock3 size={12} />
                {formatDate(item.createdAt)}
                {item.actorName ? ` · ${item.actorName}` : ""}
              </p>
            </div>

            <ArrowUpRight
              size={16}
              className="mt-1 shrink-0 text-[#69645f]"
            />
          </article>
        ))}
      </div>
    )}
  </section>

  {/* Footer */}
  <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#69645f]">
    <Activity size={14} className="mt-0.5 shrink-0" />
    <p>
      Activity records will appear here after backend activity tracking
      is connected. No sample events are being displayed as real data.
    </p>
  </div>
</div>

);
};

export default ActivityPage;
