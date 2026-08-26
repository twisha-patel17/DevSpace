const BrowserDots = () => (
  <div className="flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
    <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
    <span className="h-2 w-2 rounded-full bg-[#28c840]" />
  </div>
);

const Avatar = ({ children, className = "" }) => (
  <span
    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#111214] text-[9px] font-bold text-white ${className}`}
  >
    {children}
  </span>
);

/* ----------------------------------------
   HERO EDITOR
----------------------------------------- */

const HeroEditor = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0f11] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
      {/* Top bar */}
      <div className="flex h-11 items-center border-b border-white/[0.06] bg-[#111315] px-3 sm:px-4">
        <BrowserDots />

        <div className="ml-5 hidden items-center gap-2 text-[10px] text-zinc-500 sm:flex">
          <span>devspace.dev</span>
          <span className="text-zinc-700">/</span>
          <span>my-react-project</span>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[9px] text-zinc-500">
          <div className="flex -space-x-2">
            <Avatar className="bg-[#df9758]">T</Avatar>
            <Avatar className="bg-[#4f7cff]">R</Avatar>
            <Avatar className="bg-[#9b6cff]">P</Avatar>
          </div>

          <span className="hidden sm:inline">3 online</span>
        </div>
      </div>

      {/* Editor body */}
      <div className="grid min-h-[300px] grid-cols-[150px_1fr] sm:grid-cols-[180px_1fr_190px] lg:min-h-[360px]">
        {/* Explorer */}
        <aside className="hidden border-r border-white/[0.06] bg-[#0b0d0f] sm:block">
          <div className="border-b border-white/[0.05] px-4 py-3 text-[9px] font-semibold tracking-[0.18em] text-zinc-600">
            EXPLORER
          </div>

          <div className="px-2 py-2">
            {[
              { name: "App.jsx", active: true },
              { name: "main.jsx", dot: "bg-[#4f7cff]" },
              { name: "Navbar.jsx", dot: "bg-[#9b6cff]" },
              { name: "Button.jsx" },
              { name: "package.json" },
            ].map((file) => (
              <div
                key={file.name}
                className={`flex h-8 items-center gap-2 rounded px-2 text-[10px] ${
                  file.active
                    ? "bg-white/[0.06] text-zinc-200"
                    : "text-zinc-500"
                }`}
              >
                <span className="text-[12px] text-[#63a7ff]">◇</span>
                <span>{file.name}</span>

                {file.dot && (
                  <span className={`ml-auto h-1.5 w-1.5 rounded-full ${file.dot}`} />
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Code */}
        <div className="min-w-0 overflow-hidden bg-[#0d0f11] px-2 py-4 font-mono text-[9px] leading-7 sm:px-4 sm:text-[10px] lg:text-[11px]">
          {[
            {
              n: 1,
              content: (
                <>
                  <span className="text-[#c586c0]">import</span>{" "}
                  <span className="text-zinc-200">React</span>{" "}
                  <span className="text-[#c586c0]">from</span>{" "}
                  <span className="text-[#ce9178]">"react"</span>;
                </>
              ),
            },
            { n: 2 },
            {
              n: 3,
              content: (
                <>
                  <span className="text-[#c586c0]">function</span>{" "}
                  <span className="text-[#569cd6]">App</span>() {"{"}
                </>
              ),
            },
            {
              n: 4,
              content: (
                <>
                  <span className="text-[#c586c0]">const</span>{" "}
                  <span className="text-zinc-200">total</span> ={" "}
                  <span className="text-[#569cd6]">calculateTotal</span>(
                  items);
                </>
              ),
              cursor: true,
            },
            {
              n: 5,
              content: (
                <>
                  <span className="text-[#c586c0]">return</span> (
                </>
              ),
            },
            {
              n: 6,
              content: (
                <>
                  <span className="text-[#f44747]">&lt;div</span>{" "}
                  <span className="text-[#dcdcaa]">className</span>=
                  <span className="text-[#ce9178]">"app"</span>
                  <span className="text-[#f44747]">&gt;</span>
                </>
              ),
            },
            {
              n: 7,
              content: (
                <span className="text-[#f44747]">&lt;Navbar /&gt;</span>
              ),
            },
            {
              n: 8,
              content: (
                <span className="text-[#f44747]">&lt;/div&gt;</span>
              ),
            },
            {
              n: 9,
              content: <span>);</span>,
            },
          ].map((line) => (
            <div
              key={line.n}
              className="relative flex min-w-max"
            >
              <span className="mr-4 inline-block w-3 select-none text-right text-zinc-700">
                {line.n}
              </span>

              <span
                className={
                  line.n === 4
                    ? "pl-2"
                    : line.n >= 5 && line.n <= 8
                    ? "pl-4"
                    : ""
                }
              >
                {line.content}
              </span>

              {line.cursor && (
                <span className="ml-2 inline-flex items-center rounded bg-[#4f7cff] px-1.5 text-[8px] font-sans leading-4 text-white">
                  Rahul
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Output */}
        <aside className="hidden border-l border-white/[0.06] bg-[#0a0c0d] sm:block">
          <div className="border-b border-white/[0.05] px-4 py-3 text-[9px] font-semibold tracking-[0.18em] text-zinc-600">
            OUTPUT
          </div>

          <div className="space-y-2 p-4 font-mono text-[9px] leading-5">
            <div className="text-zinc-300">
              <span className="mr-2 text-[#df9758]">›</span>
              npm run dev
            </div>

            <div className="text-zinc-600">Local:</div>

            <div className="break-all text-zinc-600">
              http://localhost:5173
            </div>

            <div className="pt-2 text-zinc-600">[vite] hmr update</div>

            <div className="text-zinc-600">App.jsx</div>

            <div className="pt-2 text-[#65c982]">
              ✓ Compiled successfully
            </div>

            <div className="text-zinc-600">Time: 0.42s</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ----------------------------------------
   COLLABORATION CODE
----------------------------------------- */

const CollaborationCode = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0f11] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-6">
      <div className="space-y-1 font-mono text-[10px] leading-7 sm:text-[11px]">
        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-right text-zinc-700">1</span>

          <span className="rounded bg-[#4f7cff]/20 px-1 text-[8px] text-[#78a8ff]">
            Rahul
          </span>

          <span className="text-zinc-200">calculateTotal</span>
          <span className="text-zinc-500">=</span>
          <span className="text-zinc-300">(items) =&gt; {"{"}</span>
        </div>

        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-right text-zinc-700">2</span>

          <span className="pl-8 text-zinc-300">
            return items.reduce((sum, i) =&gt; {"{"}
          </span>
        </div>

        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-right text-zinc-700">3</span>

          <span className="pl-14 text-zinc-300">
            sum + i.price * i.qty, 0);
          </span>
        </div>

        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-right text-zinc-700">4</span>

          <span className="pl-8 text-zinc-300">{"};"}</span>
        </div>

        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-right text-zinc-700">5</span>

          <span className="rounded bg-[#9b6cff]/20 px-1 text-[8px] text-[#b99aff]">
            Priya
          </span>
        </div>

        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-right text-zinc-700">6</span>

          <span className="pl-8 italic text-zinc-600">
            // nice, cleaner than the old loop
          </span>

          <span className="mt-2 h-3 w-px animate-pulse bg-[#df9758]" />
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------
   WORKSPACE TREE
----------------------------------------- */

const WorkspaceTree = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0f11] p-5 font-mono text-[10px] text-zinc-500 shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-7 sm:text-[11px]">
      <div className="flex items-center gap-2 text-zinc-300">
        <span className="text-[#df9758]">▰</span>
        <span>my-react-project</span>
      </div>

      <div className="ml-2 mt-3 border-l border-white/[0.08] pl-5">
        <div className="flex items-center gap-2 py-1.5">
          <span className="text-[#df9758]">▰</span>
          <span>src</span>
        </div>

        <div className="ml-5 border-l border-white/[0.06] pl-5">
          <div className="flex items-center gap-2 py-1.5">
            <span className="text-[#63a7ff]">◈</span>
            <span>App.jsx</span>
          </div>

          <div className="flex items-center gap-2 py-1.5">
            <span className="text-[#63a7ff]">◈</span>
            <span>main.jsx</span>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <span className="text-[#df9758]">▰</span>
          <span>components</span>
        </div>

        <div className="ml-5 border-l border-white/[0.06] pl-5">
          <div className="flex items-center gap-2 py-1.5">
            <span className="text-[#63a7ff]">◈</span>
            <span>Navbar.jsx</span>
          </div>

          <div className="flex items-center gap-2 py-1.5">
            <span className="text-[#63a7ff]">◈</span>
            <span>Button.jsx</span>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1.5 text-zinc-700">
          <span>◈</span>
          <span>package.json</span>
        </div>

        <div className="flex items-center gap-2 py-1.5 text-zinc-700">
          <span>◈</span>
          <span>README.md</span>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------
   TERMINAL
----------------------------------------- */

const Terminal = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#090b0c] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
      <div className="flex h-10 items-center border-b border-white/[0.06] px-4">
        <BrowserDots />
      </div>

      <div className="p-5 font-mono text-[10px] leading-7 sm:p-6 sm:text-[11px]">
        <div className="text-zinc-400">
          <span className="mr-2 text-[#df9758]">$</span>
          Running main.cpp
        </div>

        <div className="mt-3 text-zinc-200">
          Hello World
        </div>

        <div className="mt-4 text-[#65c982]">
          Process finished with exit code 0
        </div>

        <div className="text-zinc-600">
          Time: 0.42s
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------
   HERO
----------------------------------------- */

const Hero = () => {
  return (
    <>
      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden bg-[#090a0b] px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-36 lg:px-10 lg:pb-36 lg:pt-44"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-24 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[#df9758]/[0.06] blur-[120px] sm:h-[500px] sm:w-[900px]" />

        <div className="relative mx-auto max-w-5xl">
          {/* Hero content */}
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[9px] font-medium tracking-wide text-zinc-500 sm:mb-7 sm:text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#65c982]" />
              Now with live cursors &amp; 6-language execution
            </div>

            {/* Heading */}
            <h1 className="text-balance text-4xl font-bold leading-[1.03] tracking-[-0.045em] text-zinc-100 sm:text-6xl lg:text-7xl">
              Code together.
              <br />
              <span className="text-[#df9758]">Build together.</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-zinc-500 sm:mt-7 sm:text-base sm:leading-7">
              DevSpace is a real-time collaborative development environment
              where teams can code, collaborate, and run projects together —
              directly from the browser.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-9 sm:flex-row sm:items-center">
              <a
                href="#cta"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#df9758] px-7 text-sm font-bold text-[#17110d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#eba064] hover:shadow-[0_10px_30px_rgba(223,151,88,0.15)]"
              >
                Start Coding
              </a>

              <a
                href="#features"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/[0.09] bg-white/[0.02] px-7 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.04] hover:text-white"
              >
                Explore DevSpace
              </a>
            </div>
          </div>

          {/* Editor preview */}
          <div className="mx-auto mt-14 max-w-5xl sm:mt-16 lg:mt-20">
            <HeroEditor />
          </div>
        </div>
      </section>

      {/* REAL-TIME COLLABORATION */}
      <section
        id="developers"
        className="bg-[#090a0b] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-xl">
            <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-[#df9758]">
              REAL-TIME COLLABORATION
            </div>

            <h2 className="text-3xl font-bold leading-tight tracking-[-0.035em] text-zinc-100 sm:text-4xl lg:text-5xl">
              Your team, inside the same codebase.
            </h2>

            <p className="mt-5 text-sm leading-7 text-zinc-500 sm:text-base">
              Watch changes land as your teammates type. Every cursor, every
              edit, every file switch — visible the instant it happens, with
              zero merge-conflict anxiety.
            </p>
          </div>

          <CollaborationCode />
        </div>
      </section>

      {/* SHARED WORKSPACE */}
      <section className="bg-[#090a0b] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 lg:order-1">
            <WorkspaceTree />
          </div>

          <div className="order-1 max-w-xl lg:order-2">
            <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-[#df9758]">
              SHARED WORKSPACES
            </div>

            <h2 className="text-3xl font-bold leading-tight tracking-[-0.035em] text-zinc-100 sm:text-4xl lg:text-5xl">
              One workspace.
              <br />
              Everything you need.
            </h2>

            <p className="mt-5 text-sm leading-7 text-zinc-500 sm:text-base">
              Files, folders, configuration, and docs — all living in one
              place your whole team can reach. No cloning, no syncing, no
              "which branch is this".
            </p>
          </div>
        </div>
      </section>

      {/* CODE EXECUTION */}
      <section className="bg-[#090a0b] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-xl">
            <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-[#df9758]">
              CODE EXECUTION
            </div>

            <h2 className="text-3xl font-bold leading-tight tracking-[-0.035em] text-zinc-100 sm:text-4xl lg:text-5xl">
              Write it. Run it. See the result.
            </h2>

            <p className="mt-5 text-sm leading-7 text-zinc-500 sm:text-base">
              Execute your project without leaving the browser. DevSpace runs
              your code in an isolated environment and streams the output
              straight back to the editor.
            </p>
          </div>

          <Terminal />
        </div>
      </section>
    </>
  );
};

export default Hero;