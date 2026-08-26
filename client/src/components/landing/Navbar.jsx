import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#090a0b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <a
          href="#home"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#df9758] text-xs font-extrabold text-[#17110d]">
            D
          </span>

          <span className="text-[15px] font-bold tracking-[-0.02em] text-zinc-100">
            DevSpace
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex lg:gap-9">
          <a
            href="#features"
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-100"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-100"
          >
            How it works
          </a>

          <a
            href="#developers"
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-100"
          >
            Developers
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-100"
          >
            GitHub
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-100"
          >
            Log in
          </button>

          <a
            href="#cta"
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#df9758] px-5 text-[13px] font-bold text-[#17110d] transition-all duration-200 hover:-translate-y-px hover:bg-[#eba064]"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md border border-white/[0.08] bg-transparent p-2 md:hidden"
        >
          <span
            className={`h-px w-full bg-zinc-400 transition-all duration-200 ${
              menuOpen ? "translate-y-[3px] rotate-45" : ""
            }`}
          />

          <span
            className={`h-px w-full bg-zinc-400 transition-all duration-200 ${
              menuOpen ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />

          <span
            className={`h-px w-full bg-zinc-400 transition-all duration-200 ${
              menuOpen ? "hidden" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`overflow-hidden border-t border-white/[0.06] bg-[#090a0b]/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          menuOpen
            ? "max-h-[420px] opacity-100"
            : "max-h-0 border-t-transparent opacity-0"
        }`}
      >
        <nav className="flex flex-col px-5">
          <a
            href="#features"
            onClick={closeMenu}
            className="border-b border-white/[0.05] py-4 text-sm text-zinc-500 transition-colors hover:text-zinc-100"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            onClick={closeMenu}
            className="border-b border-white/[0.05] py-4 text-sm text-zinc-500 transition-colors hover:text-zinc-100"
          >
            How it works
          </a>

          <a
            href="#developers"
            onClick={closeMenu}
            className="border-b border-white/[0.05] py-4 text-sm text-zinc-500 transition-colors hover:text-zinc-100"
          >
            Developers
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
            className="border-b border-white/[0.05] py-4 text-sm text-zinc-500 transition-colors hover:text-zinc-100"
          >
            GitHub
          </a>
        </nav>

        {/* Mobile Actions */}
        <div className="grid grid-cols-2 gap-2.5 px-5 py-5">
          <button
            type="button"
            className="h-10 rounded-md border border-white/[0.09] bg-transparent text-[13px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.03]"
          >
            Log in
          </button>

          <a
            href="#cta"
            onClick={closeMenu}
            className="flex h-10 items-center justify-center rounded-md bg-[#df9758] text-[13px] font-bold text-[#17110d] transition-colors hover:bg-[#eba064]"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;