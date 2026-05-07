import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { createRegistrationSubmission } from "../lib/submissions";
import type { VerificationLater } from "../types";

const verificationOptions: VerificationLater[] = ["Yes / 是", "No / 否"];

const initialForm = {
  fullName: "",
  email: "",
  messagingContact: "",
  city: "",
  schoolOrUniversity: "",
  verificationLater: "Yes / 是" as VerificationLater,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      await createRegistrationSubmission(form);
      setForm(initialForm);
      setState("success");
      window.localStorage.setItem("studentCarryLoggedIn", "true");
      setTimeout(() => navigate("/my"), 600);
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Unable to submit registration.",
      );
      setState("error");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <BackButton fallback="/my" />
      <div className="mb-6">
        <p className="text-sm font-bold text-slate-300">
          <span className="block">学生注册</span>
          <span className="mt-1 block text-slate-400">Student registration</span>
        </p>
        <h1 className="mt-3 text-5xl font-black text-white">注册</h1>
        <p className="mt-4 leading-7 text-slate-300">
          <span className="block">创建基础 MVP 资料。请不要填写护照号码、身份证号码、签证信息或上传证件。</span>
          <span className="block text-slate-400">Create a basic MVP profile. Do not enter passport numbers, national ID numbers, visa details, or document uploads.</span>
        </p>
      </div>

      {state === "success" && (
        <div className="mb-6">
          <Notice title="注册成功 / Registration submitted" tone="success">
            基础资料已保存，即将跳转到我的页面。
            Your basic profile has been saved. Redirecting to My.
          </Notice>
        </div>
      )}

      {state === "error" && (
        <div className="mb-6">
          <Notice title="注册失败 / Registration failed" tone="warning">
            {error}
          </Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="fullName" label={"姓名全称\nFull name"} required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          <FormField id="email" label={"邮箱\nEmail"} type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="messagingContact" label={"微信 / WhatsApp\nWeChat / WhatsApp"} required value={form.messagingContact} onChange={(event) => setForm({ ...form, messagingContact: event.target.value })} />
          <FormField id="city" label={"城市\nCity"} required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        </div>
        <FormField id="schoolOrUniversity" label={"学校或大学\nSchool or university"} required value={form.schoolOrUniversity} onChange={(event) => setForm({ ...form, schoolOrUniversity: event.target.value })} />
        <label htmlFor="verificationLater" className="block">
          <span className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
            是否愿意后续完成身份验证？{"\n"}Willing to complete identity verification later?
          </span>
          <select
            id="verificationLater"
            value={form.verificationLater}
            onChange={(event) =>
              setForm({
                ...form,
                verificationLater: event.target.value as VerificationLater,
              })
            }
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-sky-400/10"
          >
            {verificationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Notice title="隐私说明 / Privacy" tone="info">
          MVP 阶段不收集护照号码或身份证件。
          We do not collect passport numbers or ID documents at MVP stage.
          后续身份验证可能通过可信第三方服务完成。
          Identity verification may be introduced later through a trusted third-party provider.
        </Notice>
        <button
          type="submit"
          disabled={state === "submitting"}
          className="min-h-14 rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Submitting..." : "提交注册 / Submit registration"}
        </button>
      </form>
    </section>
  );
}
