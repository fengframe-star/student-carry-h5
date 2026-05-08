import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function ButtonLink({
  to,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={[
        "inline-flex min-h-9 items-center justify-center rounded-md px-4 py-2 text-xs font-semibold transition",
        variant === "primary"
          ? "bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
          : "border border-white/15 bg-white/10 text-white hover:bg-white/15",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
