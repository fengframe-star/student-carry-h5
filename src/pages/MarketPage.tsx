import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { reputationFor } from "../lib/matching";
import { canOpenSubmission, isOpenStatus, publicStatusLabel } from "../lib/orderAccess";
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

  const marketSubmissions = submissions.filter((submission) => submission.status !== "Completed");
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
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="rounded-[26px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <p className="text-xs font-bold text-slate-400">Market</p>
        <h1 className="mt-2 text-3xl font-black text-white">{t("Market", "匹配集市")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("Browse public request and carry posts.", "浏览所有公开的帮我带和顺路送发布。")}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveType("request")}
            className={tabButtonClass(activeType === "request")}
          >
            {t("Request", "帮我带")}
          </button>
          <button
            type="button"
            onClick={() => setActiveType("carrier")}
            className={tabButtonClass(activeType === "carrier")}
          >
            {t("Carry", "顺路送")}
          </button>
          <button
            type="button"
            onClick={() => setActiveType("all")}
            className={tabButtonClass(activeType === "all")}
          >
            All
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">
              {search ? `${activeCount} / ${totalCount}` : `${totalCount}`} {t("posts", "条发布")}
            </p>
          </div>
          <Link
            to={publishTo}
            className={`shrink-0 rounded-2xl bg-[#38bdf8] px-4 py-3 text-sm font-black text-white ${activeType === "all" ? "hidden" : ""}`}
          >
            {t("Post", "我要发布")}
          </Link>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-100">{t("Custom search", "自定义搜索")}</span>
          <span className="mt-1 block text-xs text-slate-500">
            {t("Search by city to city, e.g. China to Paris", "按城市到城市搜索，例如中国到巴黎")}
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="西安至巴黎 / Shanghai to Paris"
            className="mt-3 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#38bdf8]"
          />
        </label>
      </div>

      {loading ? (
        <div className="mt-5 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-5 text-slate-300">
          Loading...
        </div>
      ) : activeType === "all" ? (
        <ListingGrid emptyLabel="暂无发布 / No posts yet.">
          {visibleAll.map((item, index) =>
            item.type === "request" ? (
              <RequestCard key={item.id} item={item} index={index} />
            ) : (
              <CarryCard key={item.id} item={item} index={index} />
            ),
          )}
        </ListingGrid>
      ) : activeType === "request" ? (
        <ListingGrid emptyLabel="暂无帮我带发布 / No request posts yet.">
          {visibleRequests.map((item) => (
            <RequestCard key={item.id} item={item} index={visibleRequests.indexOf(item)} />
          ))}
        </ListingGrid>
      ) : (
        <ListingGrid emptyLabel="暂无顺路送发布 / No carry posts yet.">
          {visibleCarriers.map((item) => (
            <CarryCard key={item.id} item={item} index={visibleCarriers.indexOf(item)} />
          ))}
        </ListingGrid>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
      {publicStatusLabel(status)}
    </span>
  );
}

function ReputationLine({ index }: { index: number }) {
  const reputation = reputationFor(index);
  return (
    <p className="market-line text-[0.72rem]">
      Completed: {reputation.completed} · {reputation.active}
    </p>
  );
}

function RequestCard({ item, index }: { item: RequestSubmission; index: number }) {
  const canOpen = canOpenSubmission(item);
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="market-route">{item.fromLocation || "From"} → {item.toLocation || "To"}</p>
        <StatusBadge status={item.status} />
      </div>
      <h2 className="market-main">{item.itemName || "Item"}</h2>
      <p className="market-line">{item.itemCategory || "Others"} · {item.desiredDeliveryDate || "Date pending"}</p>
      <p className="market-price">€{item.budgetEur || 0}</p>
      <ReputationLine index={index} />
      {!canOpen ? (
        <p className="mt-3 rounded-2xl bg-white/[0.06] px-3 py-2 text-[0.68rem] font-bold text-slate-400">
          {`Only transaction parties can view this matched order.`}
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
  const canOpen = canOpenSubmission(item);
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="market-route">{item.travelRoute || "Route pending"}</p>
        <StatusBadge status={item.status} />
      </div>
      <h2 className="market-main">{item.availableLuggageSpace || "Space pending"}</h2>
      <p className="market-line">{item.acceptedItemTypes?.join(", ") || "Flexible"} · {item.travelDate || "Date pending"}</p>
      <p className="market-price">{item.expectedReward || "Reward pending"}</p>
      <ReputationLine index={index} />
      {!canOpen ? (
        <p className="mt-3 rounded-2xl bg-white/[0.06] px-3 py-2 text-[0.68rem] font-bold text-slate-400">
          {`Only transaction parties can view this matched order.`}
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
    "pressable min-h-14 rounded-2xl px-3 text-sm font-black transition",
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
      <div className="mt-5 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-5 text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return <div className="mt-5 grid grid-cols-2 gap-3">{children}</div>;
}
