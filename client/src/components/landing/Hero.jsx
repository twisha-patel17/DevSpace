const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] pt-32 pb-20 sm:pt-40 sm:pb-28">

      <div className="pointer-events-none absolute left-1/2 top-20 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#d9955a]/5 blur-[120px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
      
        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9955a]" />
            <span className="text-xs font-medium tracking-wider text-white/60">
              COLLABORATIVE DEVELOPMENT
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Build together.
            <br />
            <span className="text-[#d9955a]">Ship something great.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            A collaborative development workspace where teams can write,
            run, and build code together in real time.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/register"
              className="w-full rounded-lg bg-[#d9955a] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[#e3a66c] hover:shadow-[0_0_30px_rgba(217,149,90,0.15)] sm:w-auto"
            >
              Get Started
            </a>

            <a
              href="#github"
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/5 sm:w-auto"
            >
              View GitHub
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-[1050px] sm:mt-20">
   
          <div className="absolute -inset-4 rounded-3xl bg-[#d9955a]/5 blur-2xl" />

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] shadow-2xl">
            
            <div className="flex h-12 items-center border-b border-white/10 bg-[#111111] px-4">
     
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>

              <div className="ml-6 flex h-full items-center">
                <div className="flex h-full items-center border-x border-white/10 bg-white/[0.03] px-4 text-xs text-white/70">
                  server.js
                </div>

                <div className="hidden h-full items-center px-4 text-xs text-white/30 sm:flex">
                  index.js
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d9955a]" />
                <span className="hidden text-[11px] text-white/40 sm:inline">
                  Live
                </span>
              </div>
            </div>

            <div className="relative min-h-[390px] bg-[#0d0d0d]">
              <div className="flex font-mono text-[11px] leading-7 sm:text-[13px]">
               
                <div className="select-none border-r border-white/5 px-4 py-5 text-right text-white/20 sm:px-5">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <div className="overflow-hidden px-5 py-5 text-white/70 sm:px-7">
                  <div>
                    <span className="text-[#c792ea]">import</span>{" "}
                    <span className="text-white">express</span>{" "}
                    <span className="text-[#c792ea]">from</span>{" "}
                    <span className="text-[#c3e88d]">'express'</span>;
                  </div>

                  <div>&nbsp;</div>

                  <div>
                    <span className="text-[#c792ea]">const</span>{" "}
                    <span className="text-[#82aaff]">app</span>{" "}
                    <span className="text-white">=</span>{" "}
                    <span className="text-[#82aaff]">express</span>();
                  </div>

                  <div>&nbsp;</div>

                  <div>
                    <span className="text-[#82aaff]">app</span>.
                    <span className="text-[#82aaff]">get</span>(
                    <span className="text-[#c3e88d]">'/'</span>,{" "}
                    <span className="text-[#f78c6c]">(</span>
                    <span className="text-[#ffcb6b]">req</span>,{" "}
                    <span className="text-[#ffcb6b]">res</span>
                    <span className="text-[#f78c6c]">)</span>{" "}
                    <span className="text-[#c792ea]">=&gt;</span>{" "}
                    <span className="text-[#f78c6c]">{"{"}</span>
                  </div>

                  <div className="pl-5">
                    <span className="text-[#ffcb6b]">res</span>.
                    <span className="text-[#82aaff]">json</span>(
                    <span className="text-[#f78c6c]">{"{"}</span>
                  </div>

                  <div className="pl-10">
                    <span className="text-white">message:</span>{" "}
                    <span className="text-[#c3e88d]">
                      "Hello from DevSpace"
                    </span>
                  </div>

                  <div className="pl-5">
                    <span className="text-[#f78c6c]">{"}"}</span>
                    );
                  </div>

                  <div>
                    <span className="text-[#f78c6c]">{"}"}</span>
                    );
                  </div>

                  <div>&nbsp;</div>

                  <div>
                    <span className="text-[#82aaff]">app</span>.
                    <span className="text-[#82aaff]">listen</span>(
                    <span className="text-[#f78c6c]">3000</span>);
                  </div>

                  <div className="absolute left-[48%] top-[132px] hidden sm:block">
                    <div className="relative">
                      <div className="h-4 w-[2px] bg-[#d9955a] animate-pulse" />
                      <div className="absolute left-0 top-3 rounded-r-md rounded-bl-md bg-[#d9955a] px-2 py-0.5 text-[10px] font-sans font-medium text-black">
                        Rahul
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-[23%] top-[218px] hidden sm:block">
                    <div className="relative">
                      <div className="h-4 w-[2px] bg-purple-400 animate-pulse" />
                      <div className="absolute left-0 top-3 rounded-r-md rounded-bl-md bg-purple-400 px-2 py-0.5 text-[10px] font-sans font-medium text-black">
                        Priya
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-[#0a0a0a] px-4 py-3 sm:px-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-medium tracking-wider text-white/30">
                    TERMINAL
                  </span>
                </div>

                <div className="font-mono text-[11px] sm:text-xs">
                  <span className="text-[#d9955a]">$</span>
                  <span className="ml-2 text-white/50">npm run dev</span>
                </div>

                <div className="mt-1 font-mono text-[11px] text-white/30 sm:text-xs">
                  ✓ Server running on localhost:3000
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 bg-[#d9955a]/5 blur-[100px]" />
        </div>
      </div>
    </section>
  );
};

export default Hero;