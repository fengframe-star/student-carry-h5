import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { citiesFor, cityLabel, countries, countryLabel, routeFromParts, type CountryName } from "../lib/cities";
import { useLanguage } from "../lib/language";
import { itemCategories, matchingRequests } from "../lib/matching";
import { createCarrierSubmission, getSubmissions, updateSubmission } from "../lib/submissions";
import { profileNickname } from "../lib/profile";
import type { CarrierSubmission, ItemCategory, RequestSubmission } from "../types";

const initialForm = {
  name: profileNickname(),
  ownerNickname: profileNickname(),
  contact: "Platform messaging",
  fromCountry: "China" as CountryName,
  fromLocation: "Shanghai",
  toCountry: "France" as CountryName,
  toLocation: "Paris",
  travelRoute: "Shanghai → Paris",
  travelDate: "",
  availableLuggageSpace: "",
  acceptedItemTypes: ["Documents"] as ItemCategory[],
  expectedReward: "",
  notes: "",
  agreement: false,
  complianceConfirmation: false,
};

const carryDraftKey = "studentCarryCarryDraft";

export default function CarryEarnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<Array<{ request: RequestSubmission; score: number }>>([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (!editId) {
      const saved = window.sessionStorage.getItem(carryDraftKey);
      if (saved) {
        setForm({
          ...initialForm,
          ...JSON.parse(saved),
          name: profileNickname(),
          ownerNickname: profileNickname(),
        });
      } else {
        setForm((current) => ({ ...current, name: profileNickname(), ownerNickname: profileNickname() }));
      }
      return;
    }

    void getSubmissions().then((submissions) => {
      const existing = submissions.find(
        (submission): submission is CarrierSubmission =>
          submission.type === "carrier" && submission.id === editId,
      );
      if (!existing) return;
      setForm({
        ...initialForm,
        ...existing,
        fromCountry: (existing.fromCountry || "China") as CountryName,
        fromLocation: existing.fromLocation || existing.travelRoute.split("→")[0]?.trim() || "Shanghai",
        toCountry: (existing.toCountry || "France") as CountryName,
        toLocation: existing.toLocation || existing.travelRoute.split("→")[1]?.trim() || "Paris",
        acceptedItemTypes: existing.acceptedItemTypes || ["Documents"],
      });
    });
  }, [editId]);

  useEffect(() => {
    if (!editId) {
      window.sessionStorage.setItem(carryDraftKey, JSON.stringify(form));
    }
  }, [editId, form]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("idle");
    setError("");
    const submissions = await getSubmissions();
    setMatches(matchingRequests({ ...form, travelRoute: routeFromParts(form.fromLocation, form.toLocation) }, submissions));
    setShowMatches(true);
  }

  async function publishCarryPost() {
    setState("submitting");
    setError("");

    try {
      const payload = {
        ...form,
        name: profileNickname(),
        ownerNickname: profileNickname(),
        travelRoute: routeFromParts(form.fromLocation, form.toLocation),
      };
      if (editId) {
        await updateSubmission(editId, payload);
      } else {
        await createCarrierSubmission(payload);
      }
      window.sessionStorage.removeItem(carryDraftKey);
      setForm(initialForm);
      setShowMatches(false);
      setState("success");
      window.localStorage.setItem("studentCarryLoggedIn", "true");
      setTimeout(() => navigate("/market"), 600);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit the carrier profile.",
      );
      setState("error");
    }
  }

  function toggleAcceptedItemType(category: ItemCategory) {
    setForm((current) => ({
      ...current,
      acceptedItemTypes: current.acceptedItemTypes.includes(category)
        ? current.acceptedItemTypes.filter((item) => item !== category)
        : [...current.acceptedItemTypes, category],
    }));
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <BackButton fallback="/" />
      <div className="mb-5 rounded-[26px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <p className="text-xs font-bold text-slate-400">Carry</p>
        <h1 className="mt-2 text-3xl font-black text-white">{editId ? t("Edit carry post", "编辑顺路送") : t("Carry & earn", "顺路送")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("Add your route, travel date, space, and expected reward.", "填写路线、旅行日期、可用空间和期望报酬。")}
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
          <Notice title="Poster / 发布者" tone="info">
            {profileNickname()}
          </Notice>
          <Notice title="Contact / 联系方式" tone="info">
            联系方式将通过平台消息系统进行沟通。
            Contact details will be handled through the platform messaging system.
          </Notice>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <RouteSelect
            label="Departure / 出发地"
            country={form.fromCountry}
            city={form.fromLocation}
            onCountryChange={(country) => setForm({ ...form, fromCountry: country, fromLocation: citiesFor(country)[0] })}
            onCityChange={(city) => setForm({ ...form, fromLocation: city })}
          />
          <RouteSelect
            label="Arrival / 到达地"
            country={form.toCountry}
            city={form.toLocation}
            onCountryChange={(country) => setForm({ ...form, toCountry: country, toLocation: citiesFor(country)[0] })}
            onCityChange={(city) => setForm({ ...form, toLocation: city })}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="travelDate" label={t("Travel date", "旅行日期")} type="date" required value={form.travelDate} onChange={(event) => setForm({ ...form, travelDate: event.target.value })} />
        </div>
        <div>
          <p className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
            可接受物品类型{"\n"}Accepted item types
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {itemCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleAcceptedItemType(category)}
                className={`pressable rounded-2xl border px-3 py-3 text-xs font-black ${
                  form.acceptedItemTypes.includes(category)
                    ? "border-sky-300/40 bg-sky-400/20 text-sky-50"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
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
        <Notice title="禁运与限制物品 / Prohibited and restricted items" tone="warning">
          禁止危险品、武器、非法物质、受限制电池、大容量液体、灰产代购或转售物品。
          Dangerous goods, weapons, illegal substances, restricted batteries, large liquids, and gray-market reselling items are not allowed.
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
        <label className="flex gap-3 rounded-[24px] bg-sky-400/10 p-4 text-sm leading-6 text-slate-200">
          <input
            type="checkbox"
            required
            checked={form.complianceConfirmation}
            onChange={(event) => setForm({ ...form, complianceConfirmation: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#38bdf8] focus:ring-[#38bdf8]"
          />
          <span className="whitespace-pre-line">
            我确认该物品符合出发地、航空公司与目的地国家/地区规定。
            {"\n"}I confirm this item complies with airline, customs, and destination regulations.
          </span>
        </label>
        <button
          type="submit"
          disabled={state === "submitting" || !form.agreement || !form.complianceConfirmation}
          className="min-h-14 rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Submitting..." : "查看匹配建议 / Review matching requests"}
        </button>
      </form>

      {showMatches ? (
        <section className="mt-6 rounded-[32px] border border-white/10 bg-[#1f2232]/95 p-5 shadow-2xl">
          <h2 className="text-xl font-black text-white">可能匹配的帮我带</h2>
          <p className="mt-1 text-sm text-slate-400">Possible matching requests</p>
          <div className="mt-4 grid gap-3">
            {matches.length ? matches.map(({ request, score }) => (
              <Link key={request.id} to={`/market/request/${request.id}`} className="block rounded-[24px] border border-white/10 bg-white/[0.06] p-4 transition hover:border-sky-300/30">
                <p className="text-sm font-black text-white">{request.fromLocation} → {request.toLocation}</p>
                <p className="mt-2 text-sm text-slate-400">{request.itemName} · {request.desiredDeliveryDate}</p>
                <p className="mt-2 text-sm font-black text-sky-200">€{request.budgetEur}</p>
                <p className="mt-2 text-xs text-slate-500">Match score: {score}</p>
              </Link>
            )) : (
              <p className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-400">
                暂无合适的帮我带匹配，你仍然可以发布行程。
              </p>
            )}
          </div>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => void publishCarryPost()}
              className="pressable min-h-14 rounded-2xl bg-[#38bdf8] px-4 text-sm font-black text-white"
            >
              {t("Publish carry post", "直接发布行程")}
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function RouteSelect({
  label,
  country,
  city,
  onCountryChange,
  onCityChange,
}: {
  label: string;
  country: CountryName;
  city: string;
  onCountryChange: (country: CountryName) => void;
  onCityChange: (city: string) => void;
}) {
  const { language } = useLanguage();
  const cityOptions = citiesFor(country);
  const selectedCity = city || cityOptions[0];

  return (
    <div>
      <p className="text-sm font-semibold leading-6 text-slate-100">{label}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <select
          value={country}
          onChange={(event) => onCountryChange(event.target.value as CountryName)}
          className="block w-full min-w-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
        >
          {countries.map((option) => (
            <option key={option} value={option}>{countryLabel(option, language)}</option>
          ))}
        </select>
        <select
          value={selectedCity}
          onChange={(event) => onCityChange(event.target.value)}
          className="block w-full min-w-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
        >
          {cityOptions.map((option) => (
            <option key={option} value={option}>{cityLabel(option, language)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
