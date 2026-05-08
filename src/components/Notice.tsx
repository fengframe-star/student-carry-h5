interface NoticeProps {
  title: string;
  children: string;
  tone?: "info" | "warning" | "success";
}

const tones = {
  info: "border-sky-400/25 bg-sky-400/10 text-sky-50",
  warning: "border-red-400/25 bg-red-400/10 text-red-50",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-50",
};

export default function Notice({ title, children, tone = "info" }: NoticeProps) {
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 whitespace-pre-line text-xs leading-5">{children}</p>
    </div>
  );
}
