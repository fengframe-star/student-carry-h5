import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface BaseProps {
  id: string;
  label: string;
  children?: ReactNode;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { kind?: "input" };
type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { kind: "textarea" };

export default function FormField(props: InputProps | TextareaProps) {
  const { id, label, children, kind, className, ...fieldProps } = props;
  const fieldClass =
    "mt-1.5 block w-full min-w-0 max-w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#38bdf8] focus:ring-4 focus:ring-sky-400/10";

  return (
    <label htmlFor={id} className="block">
      <span className="whitespace-pre-line text-xs font-semibold leading-5 text-slate-100">{label}</span>
      {kind === "textarea" ? (
        <textarea
          id={id}
          className={[fieldClass, "min-h-20 resize-y", className].filter(Boolean).join(" ")}
          {...(fieldProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          className={[fieldClass, className].filter(Boolean).join(" ")}
          {...(fieldProps as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {children}
    </label>
  );
}
