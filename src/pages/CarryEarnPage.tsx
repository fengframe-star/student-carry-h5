import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { createCarrierSubmission } from "../lib/submissions";

const initialForm = {
  name: "",
  contact: "Platform messaging",
  travelRoute: "",
  travelDate: "",
  availableLuggageSpace: "",
  expectedReward: "",
  notes: "",
  agreement: false,
};

export default function CarryEarnPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      await createCarrierSubmission(form);
      setForm(initialForm);
      setState("success");
      window.localStorage.setItem("studentCarryLoggedIn", "true");
      setTimeout(() => navigate("/my"), 600);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit the carrier profile.",
      );
      setState("error");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <BackButton fallback="/" />
      <div className="mb-6">
        <p className="text-sm font-bold text-slate-300">
          <span className="block">顺路送</span>
          <span className="mt-1 block text-slate-400">Carry</span>
        </p>
        <h1 className="mt-3 text-5xl font-black text-white">顺路送</h1>
        <p className="mt-4 leading-7 text-slate-300">
          <span className="block">填写你的路线和可用行李空间，方便后续匹配合适需求。</span>
          <span className="block text-slate-400">Add your route and available space so admins can match you with a suitable request.</span>
        </p>
      </div>

      {state === "success" && (
        <div className="mb-6">
          <Notice title="提交成功 / Carry saved" tone="success">
            行程已保存，即将跳转到我的页面。
            Your travel details have been saved. Redirecting to My.
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
          <Notice title="联系方式 / Contact" tone="info">
            联系方式将通过平台消息系统进行沟通。
            Contact details will be handled through the platform messaging system.
          </Notice>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="travelRoute" label={"旅行路线\nTravel route"} required placeholder="Shanghai → Paris" value={form.travelRoute} onChange={(event) => setForm({ ...form, travelRoute: event.target.value })} />
          <FormField id="travelDate" label={"旅行日期\nTravel date"} type="date" required value={form.travelDate} onChange={(event) => setForm({ ...form, travelDate: event.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="availableLuggageSpace" label={"可用行李空间\nAvailable luggage space"} required placeholder="3 kg / shoebox size" value={form.availableLuggageSpace} onChange={(event) => setForm({ ...form, availableLuggageSpace: event.target.value })} />
          <FormField id="expectedReward" label={"期望报酬\nExpected reward"} required placeholder="EUR 20-35" value={form.expectedReward} onChange={(event) => setForm({ ...form, expectedReward: event.target.value })} />
        </div>
        <FormField id="notes" label={"备注\nNotes"} kind="textarea" placeholder="交接偏好或时间 / Handoff preferences or timing" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
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
            checked={form.agreement}
            onChange={(event) => setForm({ ...form, agreement: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#38bdf8] focus:ring-[#38bdf8]"
          />
          <span className="whitespace-pre-line">
            我同意遵守平台规则，并了解后续可能需要押金。
            {"\n"}I agree to follow platform rules and may be asked for a deposit.
          </span>
        </label>
        <button
          type="submit"
          disabled={state === "submitting"}
          className="min-h-14 rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Submitting..." : "提交行程 / Submit travel details"}
        </button>
      </form>
    </section>
  );
}
