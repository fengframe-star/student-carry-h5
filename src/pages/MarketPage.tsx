import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { reputationFor } from "../lib/matching";
import { canOpenSubmission, isOpenStatus, localizedStatusLabel } from "../lib/orderAccess";
import { getSubmissions } from "../lib/submissions";
import { useLanguage } from "../lib/language";
import type { CarrierSubmission, RequestSubmission, Submission } from "../types";

type ActiveType = "request" | "carrier" | "all";

const chinaOrigins = [
  "china",
  "中国",
  "mainland",
  "上海",
  "shanghai",
  "北京",
  "beijing",
  "广州",
  "guangzhou",
  "深圳",
  "shenzhen",
  "杭州",
  "hangzhou",
  "南京",
  "nanjing",
  "成都",
  "chengdu",
  "西安",
  "xian",
  "xi'an",
  "武汉",
  "wuhan",
];

export default function MarketPage() {
  const { t } = useLanguage();
  const [activeType, setActiveType] = useState<ActiveType>("request");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setSubmissions(await getSubmissions());
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const marketSubmissions = submissions.filter((submission) => isOpenStatus(submission.status));
  const requests = marketSubmissions.filter(
    (submission): submission is RequestSubmission =>
      submission.type === "request" && isOpenStatus(submission.status),
  );
  const carriers = marketSubmissions.filter(
    (submission): submission is CarrierSubmission =>
      submission.type === "carrier" && isOpenStatus(submission.status),
  );
  const allRequests = marketSubmissions.filter(
    (submission): submission is RequestSubmission => submission.type === "request",
  );
  const allCarriers = marketSubmissions.filter(
    (submission): submission is CarrierSubmission => submission.type === "carrier",
  );

  const visibleRequests = useMemo(
    () => requests.filter((item) => routeMatches(search, `${item.fromLocation} ${item.toLocation}`)),
    [requests, search],
  );
  const visibleCarriers = useMemo(
    () => carriers.filter((item) => routeMatches(search, item.travelRoute)),
    [carriers, search],
  );

  const totalCount =
    activeType === "request"
      ? requests.length
      : activeType === "carrier"
        ? carriers.length
        : marketSubmissions.length;
  const publishTo = activeType === "request" ? "/post-request" : "/carry-earn";
  const visibleAll = [
    ...allRequests.filter((item) => routeMatches(search, `${item.fromLocation} ${item.toLocation}`)),
    ...allCarriers.filter((item) => routeMatches(search, item.travelRoute)),
  ].sort((a, b) => {
    const first = a.createdAt?.getTime?.() ?? 0;
    const second = b.createdAt?.getTime?.() ?? 0;
    return second - first;
  });
  const activeCount =
    activeType === "request"
      ? visibleRequests.length
      : activeType === "carrier"
        ? visibleCarriers.length
        : visibleAll.length;

  return (
    <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="rounded-[22px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
        <p className="text-xs font-bold text-slate-400">Market</p>
        <h1 className="mt-1 text-xl font-black text-white">{t("Market", "匹配集市")}</h1>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          {t("Browse public requests and travel routes.", "浏览公开需求与顺路行程。")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveType("request")}
            className={tabButtonClass(activeType === "request")}
          >
            {t("Requests", "帮我带")}
          </button>
          <button
            type="button"
            onClick={() => setActiveType("carrier")}
            className={tabButtonClass(activeType === "carrier")}
          >
            {t("Traveling", "顺路送")}
          </button>
          <button
            type="button"
            onClick={() => setActiveType("all")}
            className={tabButtonClass(activeType === "all")}
          >
            {t("All", "全部")}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-[22px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">
              {search ? `${activeCount} / ${totalCount}` : `${totalCount}`} {t("posts", "条发布")}
            </p>
          </div>
          <Link
            to={publishTo}
            className={`shrink-0 rounded-xl bg-[#38bdf8] px-3 py-2 text-xs font-black text-white ${activeType === "all" ? "hidden" : ""}`}
          >
            {t("Post", "发布需求")}
          </Link>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-semibold text-slate-100">{t("Search Routes", "搜索路线")}</span>
          <span className="mt-0.5 block text-[0.68rem] text-slate-500">
            {t("Search by city, country, or route", "按城市、国家与路线搜索")}
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("e.g. Xi'an → Paris", "例如：西安至巴黎")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-500 focus:border-[#38bdf8]"
          />
        </label>
      </div>

      {loading ? (
        <div className="mt-3 rounded-[20px] border border-white/10 bg-[#1f2232]/90 p-3 text-xs text-slate-300">
          {t("Loading...", "加载中...")}
        </div>
      ) : activeType === "all" ? (
        <ListingGrid emptyLabel={t("No posts yet.", "暂无发布")}>
          {visibleAll.map((item, index) =>
            item.type === "request" ? (
              <RequestCard key={item.id} item={item} index={index} />
            ) : (
              <CarryCard key={item.id} item={item} index={index} />
            ),
          )}
        </ListingGrid>
      ) : activeType === "request" ? (
        <ListingGrid emptyLabel={t("No request posts yet.", "还没有帮我带发布")}>
          {visibleRequests.map((item) => (
            <RequestCard key={item.id} item={item} index={visibleRequests.indexOf(item)} />
          ))}
        </ListingGrid>
      ) : (
        <ListingGrid emptyLabel={t("No carry posts yet.", "还没有顺路送发布")}>
          {visibleCarriers.map((item) => (
            <CarryCard key={item.id} item={item} index={visibleCarriers.indexOf(item)} />
          ))}
        </ListingGrid>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const { language } = useLanguage();
  return (
    <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
      {localizedStatusLabel(status, language)}
    </span>
  );
}

function RequestCard({ item, index }: { item: RequestSubmission; index: number }) {
  const { t } = useLanguage();
  const canOpen = canOpenSubmission(item);
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="market-route">{item.fromLocation || t("From", "出发地")} → {item.toLocation || t("To", "到达地")}</p>
        <StatusBadge status={item.status} />
      </div>
      <h2 className="market-main">{item.itemName || t("Item", "物品")}</h2>
      <p className="market-line">{item.itemCategory || t("Others", "其他")} · {item.desiredDeliveryDate || t("Date pending", "日期待定")}</p>
      <p className="market-price">€{item.budgetEur || 0}</p>
      {!canOpen ? (
        <p className="mt-3 rounded-2xl bg-white/[0.06] px-3 py-2 text-[0.68rem] font-bold text-slate-400">
          {t("Only transaction parties can view this matched order.", "仅交易双方可查看该已匹配订单。")}
        </p>
      ) : null}
    </>
  );

  if (!canOpen) {
    return <div className="market-card opacity-75">{content}</div>;
  }

  return (
    <Link to={`/market/request/${item.id}`} className="market-card block">
      {content}
    </Link>
  );
}

function CarryCard({ item, index }: { item: CarrierSubmission; index: number }) {
  const { t } = useLanguage();
  const canOpen = canOpenSubmission(item);
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="market-route">{item.travelRoute || t("Route pending", "路线待定")}</p>
        <StatusBadge status={item.status} />
      </div>
      <h2 className="market-main">{item.availableLuggageSpace || t("Space pending", "空间待定")}</h2>
      <p className="market-line">{item.acceptedItemTypes?.join(", ") || t("Flexible", "灵活")} · {item.travelDate || t("Date pending", "日期待定")}</p>
      <p className="market-price">{item.expectedReward || t("Reward pending", "报酬待定")}</p>
      {!canOpen ? (
        <p className="mt-3 rounded-2xl bg-white/[0.06] px-3 py-2 text-[0.68rem] font-bold text-slate-400">
          {t("Only transaction parties can view this matched order.", "仅交易双方可查看该已匹配订单。")}
        </p>
      ) : null}
    </>
  );

  if (!canOpen) {
    return <div className="market-card opacity-75">{content}</div>;
  }

  return (
    <Link to={`/market/carry/${item.id}`} className="market-card block">
      {content}
    </Link>
  );
}

function tabButtonClass(active: boolean) {
  return [
    "pressable min-h-10 rounded-xl px-2 text-xs font-black transition",
    active
      ? "bg-[#38bdf8] text-white"
      : "border border-white/15 bg-white/10 text-white",
  ].join(" ");
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/，/g, ",")
    .replace(/\s/g, "")
    .replace(/'/g, "");
}

function parseSearch(search: string) {
  const normalized = normalize(search);
  const [from = "", to = ""] = normalized.split(/至|到|->|→|-/);
  return { from, to };
}

function isChinaQuery(value: string) {
  return chinaOrigins.some((origin) => value.includes(normalize(origin)));
}

function routeMatches(search: string, routeText: string) {
  const normalizedSearch = normalize(search);
  if (!normalizedSearch) {
    return true;
  }

  const route = normalize(routeText);
  if (route.includes(normalizedSearch)) {
    return true;
  }

  const { from, to } = parseSearch(search);
  if (!from && !to) {
    return route.includes(normalizedSearch);
  }

  const fromMatches =
    !from || route.includes(from) || (isChinaQuery(from) && isChinaQuery(route));
  const toMatches = !to || route.includes(to);

  return fromMatches && toMatches;
}

function ListingGrid({
  children,
  emptyLabel,
}: {
  children: React.ReactNode;
  emptyLabel: string;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(items) && items.length === 0;

  if (isEmpty) {
    return (
      <div className="mt-3 rounded-[20px] border border-white/10 bg-[#1f2232]/90 p-3 text-xs text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return <div className="mt-3 grid grid-cols-2 gap-2">{children}</div>;
}
