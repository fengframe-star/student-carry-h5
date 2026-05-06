import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { createRequestSubmission } from "../lib/submissions";
import type { ChinaDomesticShipping } from "../types";

const chinaDomesticShippingOptions: ChinaDomesticShipping[] = [
  "Yes / 是" as ChinaDomesticShipping,
  "No / 否" as ChinaDomesticShipping,
  "Not sure / 不确定" as ChinaDomesticShipping,
];

const initialForm = {
  name: "",
  contact: "",
  fromLocation: "",
  toLocation: "",
  itemName: "",
  estimatedValueEur: "",
  desiredDeliveryDate: "",
  budgetEur: "",
  chinaDomesticShipping: "Not sure / 不确定" as ChinaDomesticShipping,
  notes: "",
  confirmation: false,
};

export default function PostRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("submitting");
    setError("");

    const canContinue = window.confirm(
      `支付待接入 / Payment pending\n\n当前为 MVP H5 测试环境，无法直接完成微信支付。正式版将为预算 €${form.budgetEur} 拉起支付。\n\n点击确定继续保存发布。`,
    );

    if (!canContinue) {
      setState("idle");
      return;
    }

    try {
      await createRequestSubmission({
        ...form,
        estimatedValueEur: Number(form.estimatedValueEur),
        budgetEur: Number(form.budgetEur),
      });
      setForm(initialForm);
      setState("success");
      window.localStorage.setItem("studentCarryLoggedIn", "true");
      setTimeout(() => navigate("/my"), 600);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit the request.",
      );
      setState("error");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <p className="text-sm font-bold text-slate-300">
          <span className="block">发布需求</span>
          <span className="mt-1 block text-slate-400">Request</span>
        </p>
        <h1 className="mt-3 text-5xl font-black text-white">帮我带</h1>
        <p className="mt-4 leading-7 text-slate-300">
          <span className="block">填写路线、物品信息和预算。请不要填写护照、身份证、签证或其他证件信息。</span>
          <span className="block text-slate-400">Share route, item details, and budget. Do not enter passport, national ID, visa, or identity document details.</span>
        </p>
      </div>

      {state === "success" && (
        <div className="mb-6">
          <Notice title="提交成功 / Request saved" tone="success">
            发布已保存，即将跳转到我的页面。
            Your request has been saved. Redirecting to My.
          </Notice>
        </div>
      )}

      {state === "error" && (
        <div className="mb-6">
          <Notice title="提交失败 / Submission failed" tone="warning">
            {error}
          </Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="name" label={"姓名\nName"} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <FormField id="contact" label={"联系方式\nWeChat / WhatsApp / Email"} required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="fromLocation" label={"出发城市/国家\nFrom city/country"} required placeholder="Shanghai, China" value={form.fromLocation} onChange={(event) => setForm({ ...form, fromLocation: event.target.value })} />
          <FormField id="toLocation" label={"到达城市/国家\nTo city/country"} required placeholder="Paris, France" value={form.toLocation} onChange={(event) => setForm({ ...form, toLocation: event.target.value })} />
        </div>
        <FormField id="itemName" label={"物品名称\nItem name"} required placeholder="课本 / Textbook" value={form.itemName} onChange={(event) => setForm({ ...form, itemName: event.target.value })} />
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField id="estimatedValueEur" label={"预估价值 EUR\nEstimated value in EUR"} type="number" min="0" step="0.01" required value={form.estimatedValueEur} onChange={(event) => setForm({ ...form, estimatedValueEur: event.target.value })} />
          <FormField id="desiredDeliveryDate" label={"期望送达日期\nDesired delivery date"} type="date" required value={form.desiredDeliveryDate} onChange={(event) => setForm({ ...form, desiredDeliveryDate: event.target.value })} />
          <FormField id="budgetEur" label={"预算 EUR\nBudget in EUR"} type="number" min="0" step="0.01" required value={form.budgetEur} onChange={(event) => setForm({ ...form, budgetEur: event.target.value })} />
        </div>
        <label htmlFor="chinaDomesticShipping" className="block">
          <span className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
            中国国内是否可邮寄？{"\n"}Domestic shipping in China available?
          </span>
          <select
            id="chinaDomesticShipping"
            value={form.chinaDomesticShipping}
            onChange={(event) =>
              setForm({
                ...form,
                chinaDomesticShipping: event.target.value as ChinaDomesticShipping,
              })
            }
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-sky-400/10"
          >
            {chinaDomesticShippingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <FormField id="notes" label={"备注\nNotes"} kind="textarea" placeholder="尺寸、时间、交接方式 / Size, timing, handoff details" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        <Notice title="隐私说明 / Privacy" tone="info">
          MVP 阶段不收集护照号码或身份证件。
          We do not collect passport numbers or ID documents at MVP stage.
          后续身份验证可能通过可信第三方服务完成。
          Identity verification may be introduced later through a trusted third-party provider.
        </Notice>
        <label className="flex gap-3 rounded-[24px] bg-sky-400/10 p-4 text-sm leading-6 text-slate-200">
          <input
            type="checkbox"
            required
            checked={form.confirmation}
            onChange={(event) => setForm({ ...form, confirmation: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#38bdf8] focus:ring-[#38bdf8]"
          />
          <span className="whitespace-pre-line">
            我确认该物品不是限制、违法、奢侈、高价值或身份证件类物品。
            {"\n"}I confirm this is not a restricted, illegal, luxury, high-value, or identity document item.
          </span>
        </label>
        <button
          type="submit"
          disabled={state === "submitting"}
          className="min-h-14 rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Submitting..." : "提交并支付 / Submit and pay"}
        </button>
      </form>
    </section>
  );
}
