import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { citiesFor, cityLabel, countries, countryLabel, routeFromParts, type CountryName } from "../lib/cities";
import { useLanguage } from "../lib/language";
import { itemCategories, matchingRequests } from "../lib/matching";
import { createCarrierSubmission, getSubmissions, updateSubmission } from "../lib/submissions";
import { currentOwnerId, profileNickname } from "../lib/profile";
import type { CarrierSubmission, ItemCategory, RequestSubmission } from "../types";

const initialForm = {
  name: profileNickname(),
  ownerId: currentOwnerId(),
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

function itemCategoryLabel(category: ItemCategory, language: "en" | "zh") {
  const labels: Record<ItemCategory, string> = {
    Documents: "文件",
    Clothes: "衣物",
    Cosmetics: "美妆",
    Electronics: "电子产品",
    Gifts: "礼品",
    Food: "食品",
    "Medicine (restricted)": "药品（受限）",
    Others: "其他",
  };

  return language === "zh" ? labels[category] : category;
}

export default function CarryEarnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { language, t } = useLanguage();
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
          ownerId: currentOwnerId(),
          ownerNickname: profileNickname(),
        });
      } else {
        setForm((current) => ({ ...current, name: profileNickname(), ownerId: currentOwnerId(), ownerNickname: profileNickname() }));
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
        ownerId: currentOwnerId(),
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
    <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <BackButton fallback="/" />
      <div className="mb-3 rounded-[22px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
        <p className="text-xs font-bold text-slate-400">Carry</p>
        <h1 className="mt-2 text-base font-black text-white">{editId ? t("Edit carry post", "编辑顺路送") : t("Carry & earn", "顺路送")}</h1>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          {t("Add your route, travel date, space, and expected reward.", "填写路线、旅行日期、可用空间和期望报酬。")}
        </p>
      </div>

      {state === "success" && (
        <div className="mb-6">
          <Notice title={t("Carry saved", "提交成功")} tone="success">
            {t("Your travel details have been saved. Redirecting to Market.", "行程已保存，即将跳转到匹配集市。")}
          </Notice>
        </div>
      )}

      {state === "error" && (
        <div className="mb-6">
          <Notice title={t("Submission failed", "提交失败")} tone="warning">
            {error}
          </Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Notice title={t("Poster", "发布者")} tone="info">
            {profileNickname()}
          </Notice>
          <Notice title={t("Contact", "联系方式")} tone="info">
            {t("Contact details will be handled through the platform messaging system.", "联系方式将通过平台消息系统进行沟通。")}
          </Notice>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RouteSelect
            label={t("Departure", "出发地")}
            country={form.fromCountry}
            city={form.fromLocation}
            onCountryChange={(country) => setForm({ ...form, fromCountry: country, fromLocation: citiesFor(country)[0] })}
            onCityChange={(city) => setForm({ ...form, fromLocation: city })}
          />
          <RouteSelect
            label={t("Arrival", "到达地")}
            country={form.toCountry}
            city={form.toLocation}
            onCountryChange={(country) => setForm({ ...form, toCountry: country, toLocation: citiesFor(country)[0] })}
            onCityChange={(city) => setForm({ ...form, toLocation: city })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="travelDate" label={t("Travel date", "旅行日期")} type="date" required value={form.travelDate} onChange={(event) => setForm({ ...form, travelDate: event.target.value })} />
        </div>
        <div>
          <p className="whitespace-pre-line text-xs font-semibold leading-5 text-slate-100">
            {t("Accepted item types", "可接受物品类型")}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {itemCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleAcceptedItemType(category)}
                className={`pressable rounded-xl border px-2.5 py-2 text-[0.68rem] font-black ${
                  form.acceptedItemTypes.includes(category)
                    ? "border-sky-300/40 bg-sky-400/20 text-sky-50"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {itemCategoryLabel(category, language)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="availableLuggageSpace" label={t("Available luggage space", "可用行李空间")} required placeholder={t("3 kg / shoebox size", "3 公斤 / 鞋盒大小")} value={form.availableLuggageSpace} onChange={(event) => setForm({ ...form, availableLuggageSpace: event.target.value })} />
          <FormField id="expectedReward" label={t("Expected reward", "期望报酬")} required placeholder="EUR 20-35" value={form.expectedReward} onChange={(event) => setForm({ ...form, expectedReward: event.target.value })} />
        </div>
        <FormField id="notes" label={t("Notes", "备注")} kind="textarea" placeholder={t("Handoff preferences or timing", "交接偏好或时间")} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        <Notice title={t("Privacy", "隐私说明")} tone="info">
          {t("We do not collect passport numbers or ID documents at MVP stage. Identity verification may be introduced later through a trusted third-party provider.", "MVP 阶段不收集护照号码或身份证件。后续身份验证可能通过可信第三方服务完成。")}
        </Notice>
        <Notice title={t("Prohibited and restricted items", "禁运与限制物品")} tone="warning">
          {t("Dangerous goods, weapons, illegal substances, restricted batteries, large liquids, and gray-market reselling items are not allowed.", "禁止危险品、武器、非法物质、受限制电池、大容量液体、灰产代购或转售物品。")}
        </Notice>
        <label className="flex gap-2 rounded-[18px] bg-sky-400/10 p-3 text-xs leading-5 text-slate-200">
          <input
            type="checkbox"
            required
            checked={form.agreement}
            onChange={(event) => setForm({ ...form, agreement: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#38bdf8] focus:ring-[#38bdf8]"
          />
          <span className="whitespace-pre-line">
            {t("I agree to follow platform rules.", "我同意遵守平台规则。")}
          </span>
        </label>
        <label className="flex gap-2 rounded-[18px] bg-sky-400/10 p-3 text-xs leading-5 text-slate-200">
          <input
            type="checkbox"
            required
            checked={form.complianceConfirmation}
            onChange={(event) => setForm({ ...form, complianceConfirmation: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-[#38bdf8] focus:ring-[#38bdf8]"
          />
          <span className="whitespace-pre-line">
            {t("I confirm this item complies with airline, customs, and destination regulations.", "我确认该物品符合出发地、航空公司与目的地国家/地区规定。")}
          </span>
        </label>
        <button
          type="submit"
          disabled={state === "submitting" || !form.agreement || !form.complianceConfirmation}
          className="min-h-11 rounded-xl bg-[#38bdf8] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? t("Submitting...", "提交中...") : t("Review matching requests", "查看匹配建议")}
        </button>
      </form>

      {showMatches ? (
        <section className="mt-4 rounded-[24px] border border-white/10 bg-[#1f2232]/95 p-3.5 shadow-xl">
          <h2 className="text-base font-black text-white">{t("Possible matching requests", "可能匹配的帮我带")}</h2>
          <div className="mt-4 grid gap-3">
            {matches.length ? matches.map(({ request, score }) => (
              <Link key={request.id} to={`/market/request/${request.id}`} className="block rounded-[18px] border border-white/10 bg-white/[0.06] p-3 transition hover:border-sky-300/30">
                <p className="text-xs font-black text-white">{request.fromLocation} → {request.toLocation}</p>
                <p className="mt-1 text-xs text-slate-400">{request.itemName} · {request.desiredDeliveryDate}</p>
                <p className="mt-1 text-xs font-black text-sky-200">€{request.budgetEur}</p>
                <p className="mt-2 text-xs text-slate-500">{t("Match score", "匹配分")}: {score}</p>
              </Link>
            )) : (
              <p className="rounded-[18px] border border-white/10 bg-white/[0.06] p-3 text-xs text-slate-400">
                {t("No suitable request match yet. You can still publish your trip.", "暂无合适的帮我带匹配，你仍然可以发布行程。")}
              </p>
            )}
          </div>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => void publishCarryPost()}
              className="pressable min-h-11 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white"
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
      <p className="text-xs font-semibold leading-5 text-slate-100">{label}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <select
          value={country}
          onChange={(event) => onCountryChange(event.target.value as CountryName)}
          className="block w-full min-w-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
        >
          {countries.map((option) => (
            <option key={option} value={option}>{countryLabel(option, language)}</option>
          ))}
        </select>
        <select
          value={selectedCity}
          onChange={(event) => onCityChange(event.target.value)}
          className="block w-full min-w-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
        >
          {cityOptions.map((option) => (
            <option key={option} value={option}>{cityLabel(option, language)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
