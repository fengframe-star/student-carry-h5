import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle, PackageCheck, PackagePlus, Send } from "lucide-react";
import { useLanguage } from "../lib/language";

export default function LandingPage() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const steps = [
    {
      icon: PackagePlus,
      titleCn: "发布需求 / 发布行程",
      titleEn: "Publish request / trip",
      bodyCn: "填写路线、物品、时间和预算生成需求。",
      bodyEn: "Create a post from route, item, time, and budget.",
    },
    {
      icon: MessageCircle,
      titleCn: "沟通并匹配",
      titleEn: "Match and chat",
      bodyCn: "确认路线、时间、预算和交接方式。",
      bodyEn: "Confirm route, timing, budget, and handover details.",
    },
    {
      icon: PackageCheck,
      titleCn: "确认完成",
      titleEn: "Confirm completion",
      bodyCn: "双方确认完成交接后结束交易。",
      bodyEn: "Close the transaction after both sides confirm handover.",
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
          {t("Cross-border carry matching for international students", "国际学生跨境顺路带物匹配")}
        </p>
        <h1 className="mt-5 text-5xl font-black leading-tight text-white">
          Student Carry
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-300">
          {t(
            "A student marketplace for posting requests, browsing carry routes, negotiating details, and confirming offline exchanges.",
            "为留学生提供发布需求、浏览行程、沟通协商和线下确认的一站式匹配体验。",
          )}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            to="/post-request"
            className="pressable flex min-h-14 items-center justify-center rounded-2xl bg-[#38bdf8] px-3 text-center text-sm font-black text-white transition hover:bg-[#0ea5e9]"
          >
            {t("Request", "帮我带")}
          </Link>
          <Link
            to="/carry-earn"
            className="pressable flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-3 text-center text-sm font-black text-white transition hover:bg-white/15"
          >
            {t("Carry", "顺路送")}
          </Link>
        </div>
      </div>

      <section className="mt-5 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.18),transparent_34%),rgba(31,34,50,0.92)] p-5 shadow-2xl sm:p-6">
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
                        <h3 className="mt-1 text-lg font-black text-white">{step.titleCn}</h3>
                        <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">
                          {step.titleEn}
                        </p>
                      </div>
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#38bdf8]/15 text-[#7dd3fc] ring-1 ring-[#38bdf8]/30">
                        {isFront ? <span className="active-dot" /> : null}
                        <Icon size={21} strokeWidth={2.4} />
                      </span>
                    </div>
                    <div className="mt-2 flex min-h-12 items-center text-left">
                      <p className="text-sm leading-6 text-slate-300">{step.bodyCn}</p>
                    </div>
                  </div>
                  <StepPreview index={index} />
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
        bodyCn="我们提供基础匹配与沟通服务。用户个人信息默认不会公开展示，平台鼓励通过可信方式完成线下交接与确认。"
        bodyEn="We provide basic matching and communication tools for students. Personal information is not publicly displayed by default, and users are encouraged to complete exchanges through trusted offline verification."
        tone="blue"
      />

      <InfoCard
        titleCn="平台规则"
        titleEn="Platform Guidelines"
        bodyCn="仅支持合法、可正常携带的小件物品。用户需自行确认海关、航空及目的地相关规定，禁止违禁品、灰产代购及受限制物品。"
        bodyEn="Only legal and carry-on eligible small items are supported. Users are responsible for checking customs and airline regulations. Prohibited or restricted items are not allowed."
        tone="red"
      />
    </section>
  );
}

function StepPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mx-auto mt-4 h-[300px] w-[86%] overflow-hidden rounded-[22px] border border-sky-300/15 bg-[#071223]/70 p-3 shadow-[0_18px_50px_rgba(56,189,248,0.08)]">
        <div className="mb-2.5 grid grid-cols-2 gap-2 text-[0.68rem] font-black">
          <span className="rounded-full bg-[#38bdf8] px-3 py-1.5 text-center text-white">帮我带</span>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-center text-slate-300">顺路送</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.065] p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-black text-white">Shanghai → Paris</p>
            <span className="shrink-0 rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
              €20
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[0.68rem] font-bold text-slate-300">
            <span className="rounded-xl bg-white/[0.06] px-2.5 py-2">Documents</span>
            <span className="rounded-xl bg-white/[0.06] px-2.5 py-2">5月15日</span>
            <span className="rounded-xl bg-emerald-400/10 px-2.5 py-2 text-emerald-100">Open</span>
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mx-auto mt-4 h-[300px] w-[86%] overflow-hidden rounded-[22px] border border-sky-300/15 bg-[#071223]/70 p-3 shadow-[0_18px_50px_rgba(56,189,248,0.08)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.065] px-3 py-1.5">
          <div className="flex items-center justify-between gap-1 text-[0.72rem] font-black text-white">
            <span>上海 → 巴黎</span>
            <span className="text-sky-100">€20</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[0.62rem] font-semibold text-slate-400">文件 · 协商中</p>
            <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[0.56rem] font-black text-sky-100">
              匹配
            </span>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="max-w-[84%] rounded-2xl rounded-bl-md bg-white/[0.08] px-2.5 py-1 text-[0.6rem] leading-3 text-slate-200">
            <span className="font-black text-sky-100">Me: </span>你好，我想确认这单的细节。
          </div>
          <div className="ml-auto max-w-[84%] rounded-2xl rounded-br-md bg-[#38bdf8] px-2.5 py-1 text-[0.6rem] font-semibold leading-3 text-white">
            <span className="font-black">Post owner: </span>可以，我们确认路线和时间。
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-0.3 pl-3">
          <span className="min-w-0 flex-1 truncate text-[0.6rem] font-semibold text-slate-500">输入消息...</span>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#38bdf8] text-white">
            <Send size={11} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 h-[300px] w-[86%] overflow-hidden rounded-[22px] border border-sky-300/15 bg-[#071223]/70 p-4 shadow-[0_18px_50px_rgba(56,189,248,0.08)]">
      <div className="flex items-center justify-center pt-1">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/20">
          <CheckCircle2 size={22} />
        </span>
      </div>
      <div className="mt-3 space-y-2 text-center">
        <div className="rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-black text-white">
          Package received ✓
        </div>
        <div className="rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100">
          Transaction completed ✓
        </div>
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
    <section className={`mt-5 rounded-[32px] border p-5 shadow-2xl ${toneClass}`}>
      <h2 className="text-xl font-black text-white">{t(titleEn, titleCn)}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-300">{t(bodyEn, bodyCn)}</p>
    </section>
  );
}
