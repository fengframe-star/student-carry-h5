import { useNavigate } from "react-router-dom";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const navigate = useNavigate();

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
      ← 返回 / Back
    </button>
  );
}
