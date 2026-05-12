import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle, PackageCheck, PackagePlus, Send } from "lucide-react";
import { useLanguage } from "../lib/language";

export default function LandingPage() {
  const { language, t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const steps = [
    {
      icon: PackagePlus,
      titleCn: "发布需求 / 发布行程",
      titleEn: "Publish Request / Trip",
      bodyCn: "填写路线、物品和预算，快速发布需求。",
      bodyEn: "Add your route, item, and reward to create a post.",
    },
    {
      icon: MessageCircle,
      titleCn: "沟通并匹配",
      titleEn: "Chat and Match",
      bodyCn: "确认路线、时间、预算和交接方式。",
      bodyEn: "Confirm route, timing, budget, and handover details.",
    },
    {
      icon: PackageCheck,
      titleCn: "确认匹配",
      titleEn: "Confirm Match",
      bodyCn: "匹配后继续沟通时间、地点和交接细节。",
      bodyEn: "Continue chatting about timing, location, and handoff details after matching.",
    },
  ];

  useEffect(() => {
    if (isInteracting) return;

    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isInteracting, steps.length]);

  function goToStep(direction: 1 | -1) {
    setActiveStep((current) => (current + direction + steps.length) % steps.length);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStart === null) {
      setIsInteracting(false);
      return;
    }
    const distance = clientX - touchStart;
    if (Math.abs(distance) > 34) {
      goToStep(distance < 0 ? 1 : -1);
    }
    setTouchStart(null);
    setIsInteracting(false);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-bold tracking-wide text-slate-300">
          {t("Connect with students already heading your way.", "留学生顺路帮带平台")}
        </p>
        <h1 className="mt-5 text-5xl font-black leading-tight text-white">
          Student Carry
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-300">
          {t(
            "Post requests, match with travelers, and chat about handoff details.",
            "发布需求，匹配顺路同学，在线沟通细节。",
          )}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            to="/post-request"
            className="pressable flex min-h-14 items-center justify-center rounded-2xl bg-[#38bdf8] px-3 text-center text-sm font-black text-white transition hover:bg-[#0ea5e9]"
          >
            {t("Request Carry", "帮我带")}
          </Link>
          <Link
            to="/carry-earn"
            className="pressable flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-3 text-center text-sm font-black text-white transition hover:bg-white/15"
          >
            {t("I'm Traveling", "顺路送")}
          </Link>
        </div>
      </div>

      <section className="p-2">
        <h2 className="text-xl font-black text-white">{t("How it works", "如何使用")}</h2>

        <div
          className="relative mt-4 h-[372px] overflow-hidden"
          onTouchStart={(event) => {
            setIsInteracting(true);
            setTouchStart(event.touches[0]?.clientX ?? null);
          }}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          onTouchCancel={() => {
            setTouchStart(null);
            setIsInteracting(false);
          }}
          onMouseDown={(event) => {
            setIsInteracting(true);
            setTouchStart(event.clientX);
          }}
          onMouseUp={(event) => handleTouchEnd(event.clientX)}
          onMouseLeave={() => {
            setTouchStart(null);
            setIsInteracting(false);
          }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const position = (index - activeStep + steps.length) % steps.length;
            const isFront = position === 0;
            const xOffset = position === 0 ? 0 : position === 1 ? 48 : -48;
            const yOffset = position === 0 ? 0 : 18;
            const scale = position === 0 ? 1 : position === 1 ? 0.93 : 0.87;
            const cardStyle = {
              transform: `translateX(${xOffset}px) translateY(${yOffset}px) scale(${scale})`,
              opacity: position === 0 ? 1 : position === 1 ? 0.46 : 0.3,
              filter: position === 0 ? "blur(0px)" : "blur(1px)",
              zIndex: position === 0 ? 3 : position === 1 ? 2 : 1,
              pointerEvents: isFront ? "auto" : "none",
            } as const;

            return (
              <article
                key={step.titleEn}
                className="how-stack-card absolute inset-x-0 top-0 flex h-[342px] overflow-hidden rounded-[28px] border border-white/10 bg-[#171b2b]/92 p-4 shadow-2xl backdrop-blur sm:p-5"
                style={cardStyle}
              >
                <div className="flex h-full w-full flex-col">
                  <div className="shrink-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-black text-sky-200">0{index + 1}</span>
                        <h3 className="mt-1 text-lg font-black text-white">
                          {language === "zh" ? step.titleCn : step.titleEn}
                        </h3>
                        {language === "zh" ? (
                          <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">
                            {step.titleEn}
                          </p>
                        ) : null}
                      </div>
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#38bdf8]/15 text-[#7dd3fc] ring-1 ring-[#38bdf8]/30">
                        {isFront ? <span className="active-dot" /> : null}
                        <Icon size={21} strokeWidth={2.4} />
                      </span>
                    </div>
                    <div className="mt-2 flex min-h-12 items-center text-left">
                      <p className="text-sm leading-6 text-slate-300">{t(step.bodyEn, step.bodyCn)}</p>
                    </div>
                  </div>
                  <StepPreview index={index} language={language} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {steps.map((step, index) => (
            <button
              key={step.titleEn}
              type="button"
              aria-label={`Show step ${index + 1}`}
              onClick={() => setActiveStep(index)}
              className={`h-2.5 rounded-full transition-all ${
                activeStep === index ? "w-7 bg-[#38bdf8]" : "w-2.5 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>

      </section>

      <InfoCard
        titleCn="安全与隐私"
        titleEn="Safety & Privacy"
        bodyCn="平台仅提供信息发布与沟通工具。个人联系方式默认不会公开显示，建议双方在线下可信场所完成交接。"
        bodyEn="The platform only provides posting and messaging tools. Personal contact details are hidden by default. We recommend completing handoffs in trusted public places."
        tone="blue"
      />

      <InfoCard
        titleCn="携带须知"
        titleEn="Carry Guidelines"
        bodyCn="仅支持合法、可正常携带的物品。请自行确认海关、航空及目的地相关规定，禁止违禁品、灰产代购及受限制物品。"
        bodyEn="Only legal and travel-friendly items are allowed. Please check customs, airline, and destination regulations before arranging a carry request."
        tone="red"
      />
    </section>
  );
}

function StepPreview({ index, language }: { index: number; language: "en" | "zh" }) {
  if (index === 0) {
    return (
      <div className="home-post-preview mx-auto mt-4 h-[300px] w-[86%] overflow-hidden rounded-[22px] border border-sky-300/15 bg-[#071223]/70 p-3 shadow-[0_18px_50px_rgba(56,189,248,0.08)]">
        <div className="mb-2.5 grid grid-cols-2 gap-2 text-[0.68rem] font-black">
          <span className="home-preview-primary rounded-full bg-[#38bdf8] px-3 py-1.5 text-center text-white">
            {language === "zh" ? "帮我带" : "Request Carry"}
          </span>
          <span className="home-preview-secondary rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-center text-slate-300">
            {language === "zh" ? "顺路送" : "I'm Traveling"}
          </span>
        </div>
        <div className="home-preview-panel rounded-2xl border border-white/10 bg-white/[0.065] p-3 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-black text-white">
              {language === "zh" ? "上海 → 巴黎" : "Shanghai → Paris"}
            </p>
            <span className="shrink-0 rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
              €20
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[0.68rem] font-bold">
  <span className="flex-1 rounded-xl bg-white/[0.06] px-2.5 py-2 text-slate-300">
    {language === "zh" ? "文件" : "Documents"}
  </span>
  <span className="flex-1 whitespace-nowrap rounded-xl bg-white/[0.06] px-2.5 py-2 text-slate-300">
    {language === "zh" ? "5月15日" : "May 15"}
  </span>
  <span className="ml-auto shrink-0 whitespace-nowrap text-emerald-100">
    Open
  </span>
</div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
    <div className="home-chat-preview mx-auto mt-2 h-[300px] w-[86%] overflow-hidden rounded-[22px] border border-sky-300/15 bg-[#071223]/70 p-3 shadow-[0_18px_50px_rgba(56,189,248,0.08)]">
        <div className="home-preview-panel rounded-2xl border border-white/10 bg-white/[0.065] px-3 py-1.5">
          <div className="flex items-center justify-between gap-1 text-[0.72rem] font-black text-white">
            <span>{language === "zh" ? "上海 → 巴黎" : "Shanghai → Paris"}</span>
            <span className="text-sky-100">€20</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[0.62rem] font-semibold text-slate-400">
              {language === "zh" ? "文件 · Open" : "Documents · Open"}
            </p>
            <span className="home-match-badge rounded-full bg-sky-400/15 px-2 py-0.5 text-[0.56rem] font-black text-sky-100">
              {language === "zh" ? "匹配" : "Match"}
            </span>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="home-chat-bubble-left max-w-[84%] rounded-2xl rounded-bl-md bg-white/[0.08] px-2.5 py-1 text-[0.6rem] leading-3 text-slate-200">
            <span className="font-black text-sky-100">{language === "zh" ? "我：" : "Me: "}</span>
            {language === "zh" ? "你好，我想确认这单的细节。" : "Hi, I would like to discuss this post."}
          </div>
          <div className="home-chat-bubble-right ml-auto max-w-[84%] rounded-2xl rounded-br-md bg-[#38bdf8] px-2.5 py-1 text-[0.6rem] font-semibold leading-3 text-white">
            <span className="font-black">{language === "zh" ? "发布者：" : "Post owner: "}</span>
            {language === "zh" ? "可以，我们确认路线和时间。" : "Sure, we can confirm the details here."}
          </div>
        </div>
        <div className="home-chat-input mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-0.3 pl-3">
          <span className="min-w-0 flex-1 truncate text-[0.6rem] font-semibold text-slate-500">
            {language === "zh" ? "输入消息..." : "Type a message..."}
          </span>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#38bdf8] text-white">
            <Send size={11} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="home-confirm-preview mx-auto mt-4 h-[300px] w-[86%] overflow-hidden rounded-[22px] border border-sky-300/15 bg-[#071223]/70 p-4 shadow-[0_18px_50px_rgba(56,189,248,0.08)]">
      <div className="flex items-center justify-center pt-1">
        <span className="home-confirm-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/20">
          <CheckCircle2 size={22} />
        </span>
      </div>
      <div className="mt-3 space-y-2 text-center">
        <div className="home-confirm-status rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-black text-white">
          {language === "zh" ? "已匹配 ✓" : "Match confirmed ✓"}
        </div>
        <div className="home-chat-open rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100">
          {language === "zh" ? "聊天继续开放 ✓" : "Chat stays open ✓"}
        </div>
      </div>
      <div className="home-cancel-note mt-3 rounded-xl bg-white/[0.05] px-3 py-2 text-center text-[0.66rem] font-bold text-slate-300">
        {language === "zh" ? "双方可取消匹配 ✓" : "Either side can cancel ✓"}
      </div>
    </div>
  );
}

function InfoCard({
  titleCn,
  titleEn,
  bodyCn,
  bodyEn,
  tone,
}: {
  titleCn: string;
  titleEn: string;
  bodyCn: string;
  bodyEn: string;
  tone: "blue" | "red";
}) {
  const { t } = useLanguage();
  const toneClass =
    tone === "blue"
      ? "border-sky-400/25 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.22),transparent_36%),rgba(31,34,50,0.92)]"
      : "border-fuchsia-500/20 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.20),transparent_34%),radial-gradient(circle_at_80%_100%,rgba(239,68,68,0.14),transparent_34%),rgba(31,34,50,0.92)]";

  return (
    <section className={`mt-4 rounded-[24px] border p-3.5 shadow-xl ${toneClass}`}>
      <h2 className="text-base font-black text-white">{t(titleEn, titleCn)}</h2>
      <p className="mt-2 text-xs leading-5 text-slate-300">{t(bodyEn, bodyCn)}</p>
    </section>
  );
}
