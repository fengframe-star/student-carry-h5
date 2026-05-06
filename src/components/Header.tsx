import { Link, NavLink } from "react-router-dom";
import { PackageCheck } from "lucide-react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/market", label: "Market" },
  { to: "/my", label: "我的" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050918]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#38bdf8] text-white shadow-sm">
            <PackageCheck size={20} aria-hidden="true" />
          </span>
          <span>Student Carry</span>
        </Link>
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
