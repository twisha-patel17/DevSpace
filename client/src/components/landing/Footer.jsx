const Footer = () => {
  return (
    <footer className="border-t border-white/[0.07] bg-[#090a0b] px-5 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Main Footer */}
        <div className="grid gap-12 py-14 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-16 lg:py-16">
          {/* Brand */}
          <div className="max-w-sm">
            <a
              href="#home"
              className="inline-flex items-center gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#df9758] text-xs font-extrabold text-[#17110d]">
                D
              </span>

              <span className="text-[15px] font-bold tracking-[-0.02em] text-zinc-100">
                DevSpace
              </span>
            </a>

            <p className="mt-5 max-w-xs text-[12px] leading-6 text-zinc-600">
              A real-time collaborative development environment,
              built for teams who ship together.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col">
            <h3 className="mb-5 text-[9px] font-bold tracking-[0.18em] text-zinc-500">
              PRODUCT
            </h3>

            <a
              href="#features"
              className="mb-3 text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="mb-3 text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              How it works
            </a>

            <a
              href="#developers"
              className="text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              Developers
            </a>
          </div>

          {/* Company */}
          <div className="flex flex-col">
            <h3 className="mb-5 text-[9px] font-bold tracking-[0.18em] text-zinc-500">
              COMPANY
            </h3>

            <a
              href="#home"
              className="mb-3 text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              About
            </a>

            <a
              href="#home"
              className="mb-3 text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              Careers
            </a>

            <a
              href="#home"
              className="text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              Contact
            </a>
          </div>

          {/* Resources */}
          <div className="flex flex-col">
            <h3 className="mb-5 text-[9px] font-bold tracking-[0.18em] text-zinc-500">
              RESOURCES
            </h3>

            <a
              href="#home"
              className="mb-3 text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              Documentation
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="mb-3 text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              GitHub
            </a>

            <a
              href="#home"
              className="text-[12px] text-zinc-600 transition-colors duration-200 hover:text-zinc-200"
            >
              Status
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-3 border-t border-white/[0.06] py-6 text-[10px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 DevSpace. All rights reserved.</span>

          <span>Made for developers, by developers.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;