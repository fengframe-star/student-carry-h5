import { useEffect, useState } from "react";
import { getSubmissions } from "../lib/submissions";
import type { Submission } from "../types";

type ActiveType = "request" | "carrier";

export default function MarketPage() {
  const [activeType, setActiveType] = useState<ActiveType>("request");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

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

  const requests = submissions.filter((submission) => submission.type === "request");
  const carriers = submissions.filter((submission) => submission.type === "carrier");

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
            className={[
              "min-h-14 rounded-2xl px-3 text-sm font-black transition",
              activeType === "request"
                ? "bg-[#38bdf8] text-white"
                : "border border-white/15 bg-white/10 text-white",
            ].join(" ")}
          >
            帮我带
          </button>
          <button
            type="button"
            onClick={() => setActiveType("carrier")}
            className={[
              "min-h-14 rounded-2xl px-3 text-sm font-black transition",
              activeType === "carrier"
                ? "bg-[#38bdf8] text-white"
                : "border border-white/15 bg-white/10 text-white",
            ].join(" ")}
          >
            顺路送
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-5 text-slate-300">
          Loading...
        </div>
      ) : activeType === "request" ? (
        <ListingGrid emptyLabel="暂无帮我带发布 / No request posts yet.">
          {requests.map((item) => (
            <article key={item.id} className="market-card">
              <p className="market-route">{item.fromLocation || "From"} → {item.toLocation || "To"}</p>
              <h2 className="market-main">{item.itemName || "Item"}</h2>
              <p className="market-line">{item.desiredDeliveryDate || "Date pending"}</p>
              <p className="market-price">€{item.budgetEur || 0}</p>
            </article>
          ))}
        </ListingGrid>
      ) : (
        <ListingGrid emptyLabel="暂无顺路送发布 / No carry posts yet.">
          {carriers.map((item) => (
            <article key={item.id} className="market-card">
              <p className="market-route">{item.travelRoute || "Route pending"}</p>
              <h2 className="market-main">{item.availableLuggageSpace || "Space pending"}</h2>
              <p className="market-line">{item.travelDate || "Date pending"}</p>
              <p className="market-price">{item.expectedReward || "Reward pending"}</p>
            </article>
          ))}
        </ListingGrid>
      )}
    </section>
  );
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
