import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeEuro, Clock3, MapPin } from "lucide-react";
import { getConversations } from "../lib/conversations";

const messageCards = [
  {
    icon: BadgeEuro,
    titleCn: "改价协商",
    titleEn: "Price negotiation",
    bodyCn: "讨论预算、报酬、押金或补偿方式。",
    bodyEn: "Discuss budget, reward, deposit, or compensation details.",
  },
  {
    icon: MapPin,
    titleCn: "交接地点",
    titleEn: "Exchange location",
    bodyCn: "约定校园、车站、机场或其他可信线下地点。",
    bodyEn: "Agree on a trusted offline place such as campus, station, or airport.",
  },
  {
    icon: Clock3,
    titleCn: "交易时间确认",
    titleEn: "Exchange time confirmation",
    bodyCn: "确认到达时间、交接窗口和延误处理方式。",
    bodyEn: "Confirm arrival time, handoff window, and delay handling.",
  },
];

export default function MessagesPage() {
  const [activeCard, setActiveCard] = useState(0);
  const [conversations, setConversations] = useState(() => getConversations());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveCard((current) => (current + 1) % messageCards.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setConversations(getConversations());
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl">
        <p className="text-sm font-bold text-slate-300">
          <span className="block">协商消息</span>
          <span className="mt-1 block text-slate-400">Message</span>
        </p>
        <h1 className="mt-4 text-5xl font-black text-white">Message</h1>
        <p className="mt-4 leading-7 text-slate-300">
          <span className="block">用于双方确认价格、地点、时间和交接细节。</span>
          <span className="block text-slate-400">A space for both sides to confirm price, place, timing, and handoff details.</span>
        </p>
      </div>

      <div className="mt-5 overflow-hidden">
        <div className="relative mx-auto h-[166px] max-w-[420px]">
          {messageCards.map((card, index) => {
            const Icon = card.icon;
            const position = (index - activeCard + messageCards.length) % messageCards.length;
            const isFront = position === 0;
            const offset = position === 0 ? 0 : position === 1 ? 62 : -62;
            const cardStyle = {
              transform: `translateX(${offset}px) scale(${isFront ? 1 : 0.92})`,
              opacity: isFront ? 1 : 0.35,
              zIndex: isFront ? 3 : 1,
              pointerEvents: isFront ? "auto" : "none",
            } as const;

            return (
              <article
                key={card.titleEn}
                className="how-stack-card absolute inset-x-6 top-0 rounded-[22px] border border-white/10 bg-[#171b2b]/95 p-3.5 shadow-xl backdrop-blur"
                style={cardStyle}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-white">{card.titleCn}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{card.titleEn}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#38bdf8]/15 text-[#7dd3fc] ring-1 ring-[#38bdf8]/30">
                    <Icon size={17} strokeWidth={2.4} />
                  </span>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-200">{card.bodyCn}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{card.bodyEn}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {messageCards.map((card, index) => (
            <button
              key={card.titleEn}
              type="button"
              aria-label={`Show negotiation tip ${index + 1}`}
              onClick={() => setActiveCard(index)}
              className={`h-2 rounded-full transition-all ${
                activeCard === index ? "w-6 bg-[#38bdf8]" : "w-2 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>
      </div>

      {conversations.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {conversations.map((conversation) => (
            <Link
              to={`/messages/${conversation.id}`}
              key={conversation.id}
              className="pressable relative flex items-center gap-3 rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-4 shadow-2xl transition hover:border-sky-300/25 hover:bg-[#24283a]"
            >
              {conversation.unread ? <span className="unread-dot" /> : null}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-300/15 text-sm font-black text-sky-100 ring-1 ring-sky-300/25">
                {conversation.otherUserName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-black text-white">{conversation.otherUserName}</h2>
                  <span className="truncate text-xs text-slate-500">{conversation.latestTime}</span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-slate-300">
                  {conversation.item} · {conversation.route}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">{conversation.latestPreview}</p>
              </div>
              <span className="shrink-0 rounded-full bg-sky-400/15 px-3 py-1 text-xs font-black text-sky-100">
                {conversation.reward}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-6 text-center shadow-2xl">
          <h2 className="text-lg font-black text-white">暂无消息</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">No messages yet</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            当你联系订单发布者后，对话会显示在这里。
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Conversations will appear here after you contact a post owner.
          </p>
        </div>
      )}
    </section>
  );
}
