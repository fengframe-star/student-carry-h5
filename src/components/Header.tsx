import { Link, NavLink } from "react-router-dom";
import { MessageCircle, PackageCheck } from "lucide-react";
import { useLanguage } from "../lib/language";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/market", label: "Market" },
  { to: "/messages", label: "Message" },
  { to: "/my", label: "My" },
];

export default function Header() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050918]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#38bdf8] text-white shadow-sm">
            <PackageCheck size={20} aria-hidden="true" />
          </span>
          <span>Student Carry</span>
        </Link>
        <Link
          to="/messages"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 sm:hidden"
          aria-label="Message"
        >
          <MessageCircle size={19} aria-hidden="true" />
        </Link>
        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-xl px-2.5 py-1.5 transition ${language === "en" ? "bg-[#38bdf8] text-white" : "text-slate-400"}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("zh")}
            className={`rounded-xl px-2.5 py-1.5 transition ${language === "zh" ? "bg-[#38bdf8] text-white" : "text-slate-400"}`}
          >
            中文
          </button>
        </div>
        <nav className="hidden flex-wrap items-center justify-end gap-1 text-sm sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 font-medium transition",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
