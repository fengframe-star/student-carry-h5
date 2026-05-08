import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { useLanguage } from "../lib/language";
import { createRegistrationSubmission } from "../lib/submissions";
import type { VerificationLater } from "../types";

const verificationOptions: VerificationLater[] = ["Yes / 是", "No / 否"];

const initialForm = {
  firstName: "",
  lastName: "",
  nickname: "",
  email: "",
  phoneNumber: "",
  currentCity: "",
  schoolOrUniversity: "",
  verificationLater: "Yes / 是" as VerificationLater,
  identityVerified: false,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      await createRegistrationSubmission(form);
      window.localStorage.setItem("studentCarryProfile", JSON.stringify({
        ...form,
        provider: "Registration",
        studentVerification: Boolean(form.schoolOrUniversity),
      }));
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
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <BackButton fallback="/my" />
      <div className="mb-5 rounded-[26px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <p className="text-xs font-bold text-slate-400">{t("Student registration", "学生注册")}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{t("Register", "注册")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("Create your basic profile. Identity verification is optional in this mock flow.", "创建基础资料。当前模拟流程中身份验证为可选。")}
        </p>
      </div>

      {state === "success" && (
        <div className="mb-6">
          <Notice title={t("Registration submitted", "注册成功")} tone="success">
            {t("Your basic profile has been saved. Redirecting to My.", "基础资料已保存，即将跳转到我的页面。")}
          </Notice>
        </div>
      )}

      {state === "error" && (
        <div className="mb-6">
          <Notice title={t("Registration failed", "注册失败")} tone="warning">
            {error}
          </Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" label={t("First name", "名")} required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <FormField id="lastName" label={t("Last name", "姓")} required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="nickname" label={t("Nickname", "昵称")} required value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} />
          <FormField id="email" label={t("Email", "邮箱")} type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="phoneNumber" label={t("Phone number", "手机号")} value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
          <FormField id="currentCity" label={t("Current city", "当前城市")} required value={form.currentCity} onChange={(event) => setForm({ ...form, currentCity: event.target.value })} />
        </div>
        <FormField id="schoolOrUniversity" label={t("School or university (optional)", "学校或大学（选填）")} value={form.schoolOrUniversity} onChange={(event) => setForm({ ...form, schoolOrUniversity: event.target.value })} />
        {form.schoolOrUniversity ? (
          <p className="rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-black text-sky-100">
            {t("Student verification option available", "可进行学生认证")}
          </p>
        ) : null}
        <label htmlFor="verificationLater" className="block">
          <span className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
            {t("Willing to complete identity verification later?", "是否愿意后续完成身份验证？")}
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
                {verificationLabel(option, language)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-3 rounded-[24px] bg-sky-400/10 p-4 text-sm leading-6 text-slate-200">
          <input
            type="checkbox"
            checked={form.identityVerified}
            onChange={(event) => setForm({ ...form, identityVerified: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#38bdf8] focus:ring-[#38bdf8]"
          />
          <span>{t("Mock complete real-name visa verification", "模拟完成实名签证认证")}</span>
        </label>
        <Notice title={t("Privacy", "隐私说明")} tone="info">
          {t("We do not collect passport numbers or ID documents at MVP stage. Identity verification may be introduced later through a trusted third-party provider.", "MVP 阶段不收集护照号码或身份证件。后续身份验证可能通过可信第三方服务完成。")}
        </Notice>
        <button
          type="submit"
          disabled={state === "submitting"}
          className="min-h-14 rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? t("Submitting...", "提交中...") : t("Submit registration", "提交注册")}
        </button>
      </form>
    </section>
  );
}

function verificationLabel(option: VerificationLater, language: "en" | "zh") {
  if (option.startsWith("Yes")) return language === "zh" ? "是" : "Yes";
  return language === "zh" ? "否" : "No";
}
