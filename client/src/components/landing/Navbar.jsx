import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Developers", href: "#developers" },
    { name: "GitHub", href: "#github" },
  ];

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#d9955a] text-sm font-bold text-black">
            D
          </div>

          <span className="text-[15px] font-semibold tracking-tight text-white">
            DevSpace
          </span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-5 md:flex">
          <a
            href="/login"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Log in
          </a>

          <a
            href="/register"
            className="rounded-lg bg-[#d9955a] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#e3a66c]"
          >
            Get Started
          </a>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      <div
        className={`overflow-hidden border-t border-white/10 bg-[#0a0a0a] transition-all duration-300 md:hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 px-4 py-4 sm:px-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.name}
            </a>
          ))}

          <div className="my-3 border-t border-white/10" />

          <a
            href="/login"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Log in
          </a>

          <a
            href="/register"
            onClick={() => setIsOpen(false)}
            className="mt-2 block rounded-lg bg-[#d9955a] px-4 py-3 text-center text-sm font-semibold text-black transition-all hover:bg-[#e3a66c]"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;