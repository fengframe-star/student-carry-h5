import { Home, MessageCircle, Store, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../lib/language";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/market", label: "Market", icon: Store },
  { to: "/messages", label: "Message", icon: MessageCircle },
  { to: "/my", label: "My", icon: UserRound },
];

export default function BottomNav() {
  const { t } = useLanguage();

  return (
    <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[28px] border border-white/10 bg-[#141827]/95 p-2 shadow-2xl backdrop-blur sm:hidden">
      <div className="grid grid-cols-4 gap-1">
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
              <span className="mt-1">
                {item.label === "Home"
                  ? t("Home", "首页")
                  : item.label === "Market"
                    ? t("Market", "集市")
                    : item.label === "Message"
                      ? t("Message", "消息")
                      : t("My", "我的")}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
