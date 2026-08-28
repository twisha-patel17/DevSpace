import {
  Search,
  Bell,
  Menu,
  Command,
} from "lucide-react";

const Topbar = ({ onMenuClick }) => {
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
          justify-between
          gap-4
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ================= LEFT ================= */}
        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-lg
              border border-white/[0.08]
              bg-[#111214]
              text-zinc-500
              transition-all duration-200
              hover:border-white/[0.12]
              hover:bg-[#151618]
              hover:text-zinc-200
              active:scale-95
              lg:hidden
            "
          >
            <Menu size={18} strokeWidth={1.8} />
          </button>

          {/* Desktop Search */}
          <div className="relative hidden sm:block">
            <div className="group relative w-[280px] md:w-[320px] lg:w-[380px]">
              <Search
                size={15}
                strokeWidth={1.8}
                className="
                  pointer-events-none
                  absolute left-3.5 top-1/2
                  -translate-y-1/2
                  text-zinc-600
                  transition-colors
                  group-focus-within:text-[#dc9458]
                "
              />

              <input
                type="text"
                placeholder="Search workspaces, files, members..."
                className="
                  h-10 w-full
                  rounded-lg
                  border border-white/[0.07]
                  bg-[#101113]
                  pl-10 pr-16
                  text-[12px]
                  text-zinc-300
                  outline-none
                  placeholder:text-zinc-600
                  transition-all duration-200
                  hover:border-white/[0.11]
                  focus:border-[#dc9458]/30
                  focus:bg-[#121315]
                  focus:ring-4
                  focus:ring-[#dc9458]/[0.04]
                "
              />

              {/* Command Shortcut */}
              <div
                className="
                  pointer-events-none
                  absolute right-2.5 top-1/2
                  flex -translate-y-1/2
                  items-center gap-1
                  rounded-md
                  border border-white/[0.07]
                  bg-white/[0.02]
                  px-1.5 py-1
                  font-mono
                  text-[9px]
                  text-zinc-600
                "
              >
                <Command size={9} />
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 sm:hidden">
            <div
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-[7px]
                bg-[#dc9458]
                text-[10px]
                font-extrabold
                text-[#17110d]
              "
            >
              D
            </div>

            <span
              className="
                text-[14px]
                font-bold
                tracking-[-0.02em]
                text-[#e9e9ea]
              "
            >
              DevSpace
            </span>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Mobile Search */}
          <button
            type="button"
            aria-label="Search"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              border border-white/[0.07]
              bg-[#101113]
              text-zinc-500
              transition-all duration-200
              hover:border-white/[0.12]
              hover:bg-[#151618]
              hover:text-zinc-200
              active:scale-95
              sm:hidden
            "
          >
            <Search size={16} strokeWidth={1.8} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="
              relative
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              border border-white/[0.07]
              bg-[#101113]
              text-zinc-500
              transition-all duration-200
              hover:border-white/[0.12]
              hover:bg-[#151618]
              hover:text-zinc-200
              active:scale-95
            "
          >
            <Bell size={16} strokeWidth={1.8} />

            <span
              className="
                absolute right-[9px] top-[8px]
                h-1.5 w-1.5
                rounded-full
                bg-[#dc9458]
                shadow-[0_0_8px_rgba(220,148,88,0.45)]
              "
            />
          </button>

        </div>
      </div>
    </header>
  );
};

export default Topbar;