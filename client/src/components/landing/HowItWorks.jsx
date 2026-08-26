const steps = [
  {
    number: "01",
    title: "Create workspace",
    description:
      "Pick a language, choose a template, and your environment is ready instantly.",
  },
  {
    number: "02",
    title: "Invite collaborators",
    description:
      "Share a link or invite by email — set roles as Owner, Editor, or Viewer.",
  },
  {
    number: "03",
    title: "Code together",
    description:
      "Edit the same files at once, with live cursors and presence for everyone.",
  },
  {
    number: "04",
    title: "Run and ship",
    description:
      "Execute your project in-browser and see results the moment they're ready.",
  },
];

const HowItWorks = () => {
  return (
    <>
      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-[#090a0b] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36"
      >
        <div className="mx-auto max-w-6xl">
          {/* Heading */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-[#df9758]">
              HOW IT WORKS
            </div>

            <h2 className="text-3xl font-bold leading-[1.1] tracking-[-0.04em] text-zinc-100 sm:text-4xl lg:text-5xl">
              From idea to running code in
              <br className="hidden sm:block" />
              minutes
            </h2>
          </div>

          {/* Steps */}
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-0">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="relative px-0 sm:px-4 lg:px-8"
              >
                {/* Number + connecting line */}
                <div className="flex items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#df9758]/25 bg-[#df9758]/[0.06] font-mono text-[10px] font-bold text-[#df9758]">
                    {step.number}
                  </span>

                  {/* Desktop connecting line */}
                  {index !== steps.length - 1 && (
                    <span className="ml-4 hidden h-px flex-1 bg-gradient-to-r from-[#df9758]/25 to-white/[0.06] lg:block" />
                  )}
                </div>

                {/* Step content */}
                <div className="mt-6">
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-200">
                    {step.title}
                  </h3>

                  <p className="mt-3 max-w-xs text-[12px] leading-6 text-zinc-600">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta"
        className="relative overflow-hidden bg-[#090a0b] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#df9758]/[0.08] blur-[110px] sm:h-[350px] sm:w-[800px]" />

        {/* Border / subtle background */}
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent sm:inset-x-8 lg:inset-x-10" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-zinc-100 sm:text-4xl lg:text-5xl">
            Your next project deserves
            <br className="hidden sm:block" />
            a better workspace.
          </h2>

          <a
            href="#home"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-[#df9758] px-7 text-sm font-bold text-[#17110d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#eba064] hover:shadow-[0_12px_35px_rgba(223,151,88,0.18)]"
          >
            Create a Workspace
          </a>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;