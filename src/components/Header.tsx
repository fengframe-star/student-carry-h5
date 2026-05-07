import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Globe2, MessageCircle, PackageCheck } from "lucide-react";
import { useLanguage } from "../lib/language";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/market", label: "Market" },
  { to: "/messages", label: "Message" },
  { to: "/my", label: "My" },
];

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageClosing, setLanguageClosing] = useState(false);

  function closeLanguagePicker(nextLanguage?: "en" | "zh") {
    if (nextLanguage) {
      setLanguage(nextLanguage);
    }
    setLanguageClosing(true);
    window.setTimeout(() => {
      setLanguageOpen(false);
    }, 180);
    window.setTimeout(() => {
      setLanguageClosing(false);
    }, 360);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050918]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#38bdf8] text-white shadow-sm">
            <PackageCheck size={20} aria-hidden="true" />
          </span>
          <span>Student Carry</span>
        </Link>
        <div className="language-picker relative ml-auto h-10 w-10 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (languageOpen) {
                closeLanguagePicker();
              } else {
                setLanguageOpen(true);
              }
            }}
            className={`pressable language-globe absolute right-0 top-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 ${languageOpen ? "language-globe-open" : ""}`}
            aria-label="Change language"
          >
            <Globe2 size={20} strokeWidth={1.8} />
          </button>
          {languageOpen ? (
            <div
              className={`language-options absolute top-0 z-10 flex h-10 items-center gap-1 rounded-full border border-white/10 bg-[#141827]/95 p-1 text-xs font-black shadow-2xl backdrop-blur ${languageClosing ? "language-options-close" : "language-options-open"}`}
            >
              <button
                type="button"
                onClick={() => closeLanguagePicker("en")}
                className={`rounded-full px-3 py-1.5 transition ${language === "en" ? "bg-[#38bdf8] text-white" : "text-slate-300 hover:bg-white/10"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => closeLanguagePicker("zh")}
                className={`rounded-full px-3 py-1.5 transition ${language === "zh" ? "bg-[#38bdf8] text-white" : "text-slate-300 hover:bg-white/10"}`}
              >
                中文
              </button>
            </div>
          ) : null}
        </div>
        <Link
          to="/messages"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 sm:hidden"
          aria-label="Message"
        >
          <MessageCircle size={19} aria-hidden="true" />
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
              {item.label === "Home"
                ? t("Home", "首页")
                : item.label === "Market"
                  ? t("Market", "集市")
                  : item.label === "Message"
                    ? t("Message", "消息")
                    : t("My", "我的")}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
