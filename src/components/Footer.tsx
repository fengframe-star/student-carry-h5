import { useLanguage } from "../lib/language";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="hidden border-t border-white/10 bg-[#050918] sm:block">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-400 sm:px-6">
        {t(
          "Student Carry is a Beta information matching and messaging tool for student-to-student carry coordination.",
          "Student Carry 是 Beta 阶段的学生互助携带信息匹配与消息沟通工具。",
        )}
      </div>
    </footer>
  );
}
