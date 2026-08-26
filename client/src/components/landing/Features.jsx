const features = [
  {
    icon: "</>",
    title: "Monaco Editor",
    description:
      "The same editing engine behind VS Code, tuned for speed inside the browser.",
  },
  {
    icon: "♧",
    title: "Real-time collaboration",
    description:
      "Every keystroke syncs instantly across everyone in the workspace.",
  },
  {
    icon: "▱",
    title: "Live cursors",
    description:
      "See exactly where teammates are working, down to the line and column.",
  },
  {
    icon: "□",
    title: "Workspace management",
    description:
      "Organize files, folders, and configuration in one persistent environment.",
  },
  {
    icon: "▷",
    title: "Code execution",
    description:
      "Run projects in six languages with output streamed back in real time.",
  },
  {
    icon: "♙",
    title: "Team permissions",
    description:
      "Assign Owner, Editor, or Viewer roles down to the individual member.",
  },
  {
    icon: "◷",
    title: "Activity history",
    description:
      "A clear, scannable timeline of every change, join, and run.",
  },
  {
    icon: "≋",
    title: "Multi-language support",
    description:
      "JavaScript, Python, C++, and more — all runnable without local setup.",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="bg-[#090a0b] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-[#df9758]">
            BUILT FOR DEVELOPERS
          </div>

          <h2 className="text-3xl font-bold leading-[1.1] tracking-[-0.04em] text-zinc-100 sm:text-4xl lg:text-5xl">
            Everything a modern dev team
            <br className="hidden sm:block" />
            needs
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-500 sm:text-base">
            No plugins to configure. No local setup. Just open a workspace
            and start building.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group bg-[#0d0f11] p-6 transition-colors duration-300 hover:bg-[#111315] sm:p-7 lg:p-8"
            >
              {/* Icon */}
              <div className="mb-7 flex h-9 w-9 items-center justify-center rounded-md border border-[#df9758]/20 bg-[#df9758]/[0.07] font-mono text-[11px] font-bold text-[#df9758] transition-all duration-300 group-hover:border-[#df9758]/40 group-hover:bg-[#df9758]/[0.12]">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-200">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-3 text-[12px] leading-6 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-500">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;