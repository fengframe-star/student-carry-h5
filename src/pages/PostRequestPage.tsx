import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Camera, X } from "lucide-react";
import BackButton from "../components/BackButton";
import FormField from "../components/FormField";
import Notice from "../components/Notice";
import { citiesFor, cityLabel, countries, countryLabel, type CountryName } from "../lib/cities";
import { readImageAsDataUrl } from "../lib/imageFiles";
import { useLanguage } from "../lib/language";
import { itemCategories, matchingCarriers } from "../lib/matching";
import { createRequestSubmission, getSubmissions, updateSubmission } from "../lib/submissions";
import { profileNickname } from "../lib/profile";
import type { CarrierSubmission, ChinaDomesticShipping, ItemCategory, RequestSubmission } from "../types";

const chinaDomesticShippingOptions: ChinaDomesticShipping[] = [
  "Yes / 是" as ChinaDomesticShipping,
  "No / 否" as ChinaDomesticShipping,
  "Not sure / 不确定" as ChinaDomesticShipping,
];

const initialForm = {
  name: profileNickname(),
  ownerNickname: profileNickname(),
  contact: "Platform messaging",
  fromCountry: "China" as CountryName,
  fromLocation: "Shanghai",
  toCountry: "France" as CountryName,
  toLocation: "Paris",
  itemName: "",
  itemCategory: "Documents" as ItemCategory,
  itemPhotoDataUrl: "",
  estimatedValueEur: "",
  desiredDeliveryDate: "",
  budgetEur: "",
  chinaDomesticShipping: "Not sure / 不确定" as ChinaDomesticShipping,
  notes: "",
  confirmation: false,
  complianceConfirmation: false,
};

const requestDraftKey = "studentCarryRequestDraft";

function chinaShippingLabel(option: ChinaDomesticShipping, language: "en" | "zh") {
  if (option.startsWith("Yes")) return language === "zh" ? "是" : "Yes";
  if (option.startsWith("No")) return language === "zh" ? "否" : "No";
  return language === "zh" ? "不确定" : "Not sure";
}

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

export default function PostRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { language, t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<Array<{ carrier: CarrierSubmission; score: number }>>([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (!editId) {
      const saved = window.sessionStorage.getItem(requestDraftKey);
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
        (submission): submission is RequestSubmission =>
          submission.type === "request" && submission.id === editId,
      );
      if (!existing) return;
      setForm({
        ...initialForm,
        ...existing,
        fromCountry: (existing.fromCountry || "China") as CountryName,
        toCountry: (existing.toCountry || "France") as CountryName,
        estimatedValueEur: String(existing.estimatedValueEur || ""),
        budgetEur: String(existing.budgetEur || ""),
      });
    });
  }, [editId]);

  useEffect(() => {
    if (!editId) {
      window.sessionStorage.setItem(requestDraftKey, JSON.stringify(form));
    }
  }, [editId, form]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("idle");
    setError("");
    const submissions = await getSubmissions();
    setMatches(matchingCarriers({
      ...form,
      estimatedValueEur: Number(form.estimatedValueEur),
      budgetEur: Number(form.budgetEur),
    }, submissions));
    setShowMatches(true);
  }

  async function publishRequest() {
    setState("submitting");
    setError("");

    try {
      const payload = {
        ...form,
        name: profileNickname(),
        ownerNickname: profileNickname(),
        estimatedValueEur: Number(form.estimatedValueEur),
        budgetEur: Number(form.budgetEur),
      };
      if (editId) {
        await updateSubmission(editId, payload);
      } else {
        await createRequestSubmission(payload);
      }
      window.sessionStorage.removeItem(requestDraftKey);
      setForm(initialForm);
      setShowMatches(false);
      setState("success");
      window.localStorage.setItem("studentCarryLoggedIn", "true");
      setTimeout(() => navigate("/market"), 600);
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
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <BackButton fallback="/" />
      <div className="mb-5 rounded-[26px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <p className="text-xs font-bold text-slate-400">Request</p>
        <h1 className="mt-2 text-3xl font-black text-white">{editId ? t("Edit request", "编辑帮我带") : t("Post a request", "帮我带")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t(
            "Share route, item details, date, and reward.",
            "填写路线、物品信息、时间和预算。",
          )}
        </p>
      </div>

      {state === "success" && (
        <div className="mb-6">
          <Notice title={t("Request saved", "提交成功")} tone="success">
            {t("Your request has been saved. Redirecting to Market.", "发布已保存，即将跳转到匹配集市。")}
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

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Notice title={t("Poster", "发布者")} tone="info">
            {profileNickname()}
          </Notice>
          <Notice title={t("Contact", "联系方式")} tone="info">
            {t("Contact details will be handled through the platform messaging system.", "联系方式将通过平台消息系统进行沟通。")}
          </Notice>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
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
        <FormField id="itemName" label={t("Item", "物品")} required placeholder={t("Textbook", "教材")} value={form.itemName} onChange={(event) => setForm({ ...form, itemName: event.target.value })} />
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
                {t("Item photo (optional)", "物品照片（可选）")}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {t("Helps others estimate size and carrying difficulty.", "帮助对方判断体积与携带难度。")}
              </p>
              <p className="mt-2 text-xs leading-5 text-amber-100/80">
                {t("Do not upload passports, visas, bank cards, or sensitive documents.", "请勿上传护照、签证、银行卡或其他敏感证件。")}
              </p>
            </div>
            <label className="pressable inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#38bdf8] px-4 text-sm font-black text-white">
              <Camera size={17} />
              <span>{t("Add photo", "添加照片")}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setForm({ ...form, itemPhotoDataUrl: await readImageAsDataUrl(file) });
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {form.itemPhotoDataUrl ? (
            <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-[#071223]/70">
              <img src={form.itemPhotoDataUrl} alt="Selected item preview" className="h-48 w-full object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, itemPhotoDataUrl: "" })}
                className="flex w-full items-center justify-center gap-2 bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-200"
              >
                <X size={16} />
                {t("Remove photo", "移除照片")}
              </button>
            </div>
          ) : null}
        </div>
        <label htmlFor="itemCategory" className="block">
          <span className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
            {t("Item category", "物品分类")}
          </span>
          <select
            id="itemCategory"
            value={form.itemCategory}
            onChange={(event) => setForm({ ...form, itemCategory: event.target.value as ItemCategory })}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
          >
            {itemCategories.map((category) => (
              <option key={category} value={category}>{itemCategoryLabel(category, language)}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField id="estimatedValueEur" label={t("Item estimated value EUR", "物品预估价值 EUR")} type="number" min="0" step="0.01" required value={form.estimatedValueEur} onChange={(event) => setForm({ ...form, estimatedValueEur: event.target.value })} />
          <FormField id="desiredDeliveryDate" label={t("Desired delivery date", "期望送达日期")} type="date" required value={form.desiredDeliveryDate} onChange={(event) => setForm({ ...form, desiredDeliveryDate: event.target.value })} />
          <FormField id="budgetEur" label={t("Order budget EUR", "本单预算 EUR")} type="number" min="0" step="0.01" required value={form.budgetEur} onChange={(event) => setForm({ ...form, budgetEur: event.target.value })} />
        </div>
        <label htmlFor="chinaDomesticShipping" className="block">
          <span className="whitespace-pre-line text-sm font-semibold leading-6 text-slate-100">
            {t("Domestic shipping in China available?", "中国国内是否可邮寄？")}
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
                {chinaShippingLabel(option, language)}
              </option>
            ))}
          </select>
        </label>
        <FormField id="notes" label={t("Notes", "备注")} kind="textarea" placeholder={t("Size, timing, handoff details", "尺寸、时间、交接方式")} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        <Notice title={t("Privacy", "隐私说明")} tone="info">
          {t("We do not collect passport numbers or ID documents at MVP stage. Identity verification may be introduced later through a trusted third-party provider.", "MVP 阶段不收集护照号码或身份证件。后续身份验证可能通过可信第三方服务完成。")}
        </Notice>
        <Notice title={t("Prohibited and restricted items", "禁运与限制物品")} tone="warning">
          {t("Dangerous goods, weapons, illegal substances, restricted batteries, large liquids, and gray-market reselling items are not allowed.", "禁止危险品、武器、非法物质、受限制电池、大容量液体、灰产代购或转售物品。")}
        </Notice>
        <Notice title={t("Domestic anonymous shipping in China", "中国国内匿名邮寄")} tone="info">
          {t("If domestic forwarding is needed, users can discuss SF Express anonymous shipping and tracking inside chat. MVP provides guidance only.", "如需中国国内转寄，可在聊天中协商顺丰匿名寄件与运单信息。MVP 阶段平台仅提供指引。")}
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
            {t("I confirm this is not a restricted, illegal, luxury, high-value, or identity document item.", "我确认该物品不是限制、违法、奢侈、高价值或身份证件类物品。")}
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
            {t("I confirm this item complies with airline, customs, and destination regulations.", "我确认该物品符合出发地、航空公司与目的地国家/地区规定。")}
          </span>
        </label>
        <button
          type="submit"
          disabled={state === "submitting" || !form.confirmation || !form.complianceConfirmation}
          className="min-h-14 rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? t("Submitting...", "提交中...") : t("Review matching carriers", "查看匹配建议")}
        </button>
      </form>

      {showMatches ? (
        <section className="mt-6 rounded-[32px] border border-white/10 bg-[#1f2232]/95 p-5 shadow-2xl">
          <h2 className="text-xl font-black text-white">{t("Possible matching carry posts", "可能匹配的顺路送")}</h2>
          <div className="mt-4 grid gap-3">
            {matches.length ? matches.map(({ carrier, score }) => (
              <Link key={carrier.id} to={`/market/carry/${carrier.id}`} className="block rounded-[24px] border border-white/10 bg-white/[0.06] p-4 transition hover:border-sky-300/30">
                <p className="text-sm font-black text-white">{carrier.travelRoute}</p>
                <p className="mt-2 text-sm text-slate-400">{carrier.travelDate} · {carrier.availableLuggageSpace}</p>
                <p className="mt-2 text-sm font-black text-sky-200">{carrier.expectedReward}</p>
                <p className="mt-2 text-xs text-slate-500">{t("Match score", "匹配分")}: {score}</p>
              </Link>
            )) : (
              <p className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-400">
                {t("No suitable carry match yet. You can still publish your request.", "暂无合适的顺路送匹配，你仍然可以发布需求。")}
              </p>
            )}
          </div>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => void publishRequest()}
              className="pressable min-h-14 rounded-2xl bg-[#38bdf8] px-4 text-sm font-black text-white"
            >
              {t("Publish request", "直接发布需求")}
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
      <div className="mt-2 grid gap-2 grid-cols-2">
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
