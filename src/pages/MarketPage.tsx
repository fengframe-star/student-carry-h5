import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSubmissions } from "../lib/submissions";
import type { CarrierSubmission, RequestSubmission, Submission } from "../types";

type ActiveType = "request" | "carrier";

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

  const requests = submissions.filter(
    (submission): submission is RequestSubmission => submission.type === "request",
  );
  const carriers = submissions.filter(
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

  const activeCount = activeType === "request" ? visibleRequests.length : visibleCarriers.length;
  const totalCount = activeType === "request" ? requests.length : carriers.length;
  const publishTo = activeType === "request" ? "/post-request" : "/carry-earn";

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl">
        <p className="text-sm font-bold text-slate-300">Market</p>
        <h1 className="mt-3 text-5xl font-black text-white">匹配集市</h1>
        <p className="mt-4 leading-7 text-slate-300">
          <span className="block">选择你想要查看的类型</span>
          <span className="block text-slate-400">Choose the type you want to view</span>
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveType("request")}
            className={tabButtonClass(activeType === "request")}
          >
            帮我带
          </button>
          <button
            type="button"
            onClick={() => setActiveType("carrier")}
            className={tabButtonClass(activeType === "carrier")}
          >
            顺路送
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">
              {search ? `${activeCount} / ${totalCount}` : `${totalCount}`} posts
            </p>
          </div>
          <Link
            to={publishTo}
            className="shrink-0 rounded-2xl bg-[#38bdf8] px-4 py-3 text-sm font-black text-white"
          >
            我要发布
          </Link>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-100">自定义搜索</span>
          <span className="mt-1 block text-xs text-slate-500">Search by city to city, e.g. 西安至巴黎 / China to Paris</span>
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
      ) : activeType === "request" ? (
        <ListingGrid emptyLabel="暂无帮我带发布 / No request posts yet.">
          {visibleRequests.map((item) => (
            <Link key={item.id} to={`/market/request/${item.id}`} className="market-card block">
              <p className="market-route">{item.fromLocation || "From"} → {item.toLocation || "To"}</p>
              <h2 className="market-main">{item.itemName || "Item"}</h2>
              <p className="market-line">{item.desiredDeliveryDate || "Date pending"}</p>
              <p className="market-price">€{item.budgetEur || 0}</p>
            </Link>
          ))}
        </ListingGrid>
      ) : (
        <ListingGrid emptyLabel="暂无顺路送发布 / No carry posts yet.">
          {visibleCarriers.map((item) => (
            <Link key={item.id} to={`/market/carry/${item.id}`} className="market-card block">
              <p className="market-route">{item.travelRoute || "Route pending"}</p>
              <h2 className="market-main">{item.availableLuggageSpace || "Space pending"}</h2>
              <p className="market-line">{item.travelDate || "Date pending"}</p>
              <p className="market-price">{item.expectedReward || "Reward pending"}</p>
            </Link>
          ))}
        </ListingGrid>
      )}
    </section>
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
