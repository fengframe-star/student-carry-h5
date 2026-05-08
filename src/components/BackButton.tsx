import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/language";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(fallback);
        }
      }}
      className="pressable mb-5 inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white"
    >
      ← {t("Back", "返回")}
    </button>
  );
}
