const LoginDesign = () => {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden px-8 py-8 lg:px-12 lg:py-10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d99558] text-xs font-bold text-black">
          D
        </div>

        <span className="text-lg font-semibold text-white">
          DevSpace
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-xl">
        <div className="mb-8">
          <p className="text-xl font-semibold leading-8 text-white sm:text-2xl">
            "We stopped screen-sharing entirely.
          </p>

          <p className="text-xl font-semibold leading-8 text-[#d99558] sm:text-2xl">
            Everyone just works in the same workspace
          </p>

          <p className="text-xl font-semibold leading-8 text-white sm:text-2xl">
            now."
          </p>
        </div>

        {/* User */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-[10px] font-semibold text-black">
            PS
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Priya Shah
            </p>

            <p className="text-xs text-gray-500">
              Frontend Engineer
            </p>
          </div>
        </div>

        {/* Code card */}
        <div className="max-w-lg rounded-xl border border-[#27272a] bg-[#151518] p-4 shadow-2xl">
          <div className="mb-4 flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#29292d]" />
            <span className="h-2 w-2 rounded-full bg-[#29292d]" />
            <span className="h-2 w-2 rounded-full bg-[#29292d]" />
          </div>

          <div className="font-mono text-xs leading-6 sm:text-sm">
            <p>
              <span className="text-purple-400">const</span>{" "}
              <span className="text-white">total</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-blue-300">
                calculateTotal
              </span>
              <span className="text-gray-400">(items);</span>
            </p>

            <p>
              <span className="text-purple-400">return</span>{" "}
              <span className="text-gray-300">
                &lt;Cart total={"{"}total{"}"} /&gt;
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="h-2 w-2 rounded-full bg-green-400" />
        3 collaborators online right now
      </div>

      {/* Background glow */}
      <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl" />
    </div>
  );
};

const RegisterDesign = () => {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden px-8 py-8 lg:px-12 lg:py-10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d99558] text-xs font-bold text-black">
          D
        </div>

        <span className="text-lg font-semibold text-white">
          DevSpace
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-xl">
        <div className="mb-8">
          <p className="text-xl font-semibold leading-8 text-white sm:text-2xl">
            "No more jumping between tabs.
          </p>

          <p className="text-xl font-semibold leading-8 text-[#d99558] sm:text-2xl">
            Build, share and collaborate
          </p>

          <p className="text-xl font-semibold leading-8 text-white sm:text-2xl">
            in one place."
          </p>
        </div>

        {/* Collaborators */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-purple-400 text-[10px] font-semibold text-black">
              PS
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-blue-400 text-[10px] font-semibold text-black">
              R
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-green-400 text-[10px] font-semibold text-black">
              A
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Your team
            </p>

            <p className="text-xs text-gray-500">
              Collaborate in real time
            </p>
          </div>
        </div>

        {/* Workspace card */}
        <div className="max-w-lg rounded-xl border border-[#27272a] bg-[#151518] p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              DEVSPACE / WORKSPACE
            </span>

            <span className="rounded-md bg-green-500/10 px-2 py-1 text-[10px] text-green-400">
              LIVE
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-2 w-3/4 rounded bg-[#29292d]" />
            <div className="h-2 w-1/2 rounded bg-[#29292d]" />
            <div className="h-2 w-2/3 rounded bg-[#29292d]" />
          </div>

          <div className="mt-5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-xs text-gray-500">
              3 developers working
            </span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="text-xs text-gray-500">
        Start building together today.
      </div>

      {/* Background glow */}
      <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl" />
    </div>
  );
};

const RightSideDesign = ({ type = "login" }) => {
  return type === "register" ? <RegisterDesign /> : <LoginDesign />;
};

export default RightSideDesign;