import { Home, Store, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/market", label: "Market", icon: Store },
  { to: "/my", label: "我的", icon: UserRound },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[28px] border border-white/10 bg-[#141827]/95 p-2 shadow-2xl backdrop-blur sm:hidden">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-semibold transition",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
