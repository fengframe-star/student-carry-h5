import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeEuro, Clock3, MapPin } from "lucide-react";
import { getConversations } from "../lib/conversations";
import { useLanguage } from "../lib/language";

const messageCards = [
  {
    icon: BadgeEuro,
    titleCn: "改价协商",
    titleEn: "Price negotiation",
    bodyCn: "讨论预算、报酬或补偿方式。",
    bodyEn: "Discuss budget, reward, or compensation details.",
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
  const { t } = useLanguage();
  const [activeCard, setActiveCard] = useState(0);
  const [conversations, setConversations] = useState(() => getConversations());
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveCard((current) => (current + 1) % messageCards.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setConversations(getConversations());
  }, []);

  function goToCard(direction: 1 | -1) {
    setActiveCard((current) => (current + direction + messageCards.length) % messageCards.length);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStart === null) {
      return;
    }

    const distance = clientX - touchStart;
    if (Math.abs(distance) > 34) {
      goToCard(distance < 0 ? 1 : -1);
    }
    setTouchStart(null);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="rounded-[26px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <p className="text-xs font-bold text-slate-400">{t("Negotiation", "协商")}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{t("Messages", "消息")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("Confirm price, place, timing, and handoff details.", "确认价格、地点、时间和交接细节。")}
        </p>
      </div>

      <div
        className="mt-5 overflow-hidden"
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        onTouchCancel={() => setTouchStart(null)}
        onMouseDown={(event) => setTouchStart(event.clientX)}
        onMouseUp={(event) => handleTouchEnd(event.clientX)}
        onMouseLeave={() => setTouchStart(null)}
      >
        <div className="relative mx-auto h-[62px] max-w-[420px]">
          {messageCards.map((card, index) => {
            const Icon = card.icon;
            const position = (index - activeCard + messageCards.length) % messageCards.length;
            const isFront = position === 0;
            const offset = position === 0 ? 0 : position === 1 ? 92 : -92;
            const cardStyle = {
              transform: `translateX(calc(-50% + ${offset}px)) scale(${isFront ? 1 : 0.9})`,
              opacity: isFront ? 1 : 0.38,
              filter: isFront ? "blur(0px)" : "blur(0.8px)",
              zIndex: isFront ? 3 : position === 1 ? 2 : 1,
              pointerEvents: isFront ? "auto" : "none",
            } as const;

            return (
              <article
                key={card.titleEn}
                className="how-stack-card absolute left-1/2 top-0 h-[58px] w-[74%] max-w-[306px] overflow-hidden rounded-[18px] border border-white/10 bg-[#171b2b]/95 px-2.5 py-2 shadow-xl backdrop-blur"
                style={cardStyle}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[0.68rem] font-black leading-none text-white">{t(card.titleEn, card.titleCn)}</h2>
                  </div>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#38bdf8]/15 text-[#7dd3fc] ring-1 ring-[#38bdf8]/30">
                    <Icon size={12} strokeWidth={2.4} />
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[0.56rem] leading-3 text-slate-300">{t(card.bodyEn, card.bodyCn)}</p>
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
          <h2 className="text-lg font-black text-white">{t("No messages yet", "暂无消息")}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {t(
              "Conversations will appear here after you contact a post owner.",
              "当你联系订单发布者后，对话会显示在这里。",
            )}
          </p>
        </div>
      )}
    </section>
  );
}
