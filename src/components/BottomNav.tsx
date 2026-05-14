import { Home, MessageCircle, Store, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { subscribeUnreadMessages } from "../lib/conversations";
import { useLanguage } from "../lib/language";
import { currentOwnerId, isLoggedIn } from "../lib/profile";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/market", label: "Market", icon: Store },
  { to: "/messages", label: "Message", icon: MessageCircle },
  { to: "/my", label: "My", icon: UserRound },
];

export default function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const ownerId = currentOwnerId();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (!isLoggedIn()) {
      setHasUnreadMessages(false);
      return undefined;
    }

    void subscribeUnreadMessages({
      onUnread: (ids) => setHasUnreadMessages(ids.length > 0),
    }).then((close) => {
      unsubscribe = close;
    }).catch((error: unknown) => {
      console.error("Unread navigation sync failed.", error);
      setHasUnreadMessages(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [ownerId]);

  if (
    location.pathname.startsWith("/market/request/") ||
    location.pathname.startsWith("/market/carry/") ||
    /^\/messages\/[^/]+/.test(location.pathname) ||
    location.pathname === "/post-request" ||
    location.pathname === "/carry-earn" ||
    location.pathname === "/register"
  ) {
    return null;
  }

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
              <span className="relative">
                <Icon size={20} aria-hidden="true" />
                {item.to === "/messages" && hasUnreadMessages ? <span className="nav-unread-dot" /> : null}
              </span>
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
