import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, MessageCircle, PackagePlus } from "lucide-react";
import { useLanguage } from "../lib/language";

export default function LandingPage() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const steps = [
    {
      icon: PackagePlus,
      titleCn: "发布需求",
      titleEn: "Post a request",
      bodyCn: "填写路线、物品类型、时间和预算。",
      bodyEn: "Add route, item type, date, and reward.",
    },
    {
      icon: MessageCircle,
      titleCn: "匹配顺路学生",
      titleEn: "Match with a student carrier",
      bodyCn: "选择合适的顺路学生并开始沟通。",
      bodyEn: "Choose a suitable carrier and start chatting.",
    },
    {
      icon: Handshake,
      titleCn: "线下交接确认",
      titleEn: "Confirm offline handover",
      bodyCn: "完成交接后确认订单状态。",
      bodyEn: "Confirm the order after the handover is completed.",
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [steps.length]);

  function goToStep(direction: 1 | -1) {
    setActiveStep((current) => (current + direction + steps.length) % steps.length);
  }

  function handleSwipeEnd(point: { x: number; y: number }) {
    if (!touchStart) {
      return;
    }

    const deltaY = point.y - touchStart.y;
    if (Math.abs(deltaY) > 34) {
      goToStep(deltaY < 0 ? 1 : -1);
    }
    setTouchStart(null);
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
          className="relative mt-5 h-[300px] sm:h-[270px]"
          onTouchStart={(event) =>
            setTouchStart({ x: event.touches[0]?.clientX ?? 0, y: event.touches[0]?.clientY ?? 0 })
          }
          onTouchEnd={(event) =>
            handleSwipeEnd({
              x: event.changedTouches[0]?.clientX ?? 0,
              y: event.changedTouches[0]?.clientY ?? 0,
            })
          }
          onMouseDown={(event) => setTouchStart({ x: event.clientX, y: event.clientY })}
          onMouseUp={(event) => handleSwipeEnd({ x: event.clientX, y: event.clientY })}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const position = (index - activeStep + steps.length) % steps.length;
            const isFront = position === 0;
            const cardStyle = {
              transform: `translateY(${position * 22}px) scale(${1 - position * 0.055})`,
              opacity: position === 0 ? 1 : position === 1 ? 0.66 : 0.38,
              zIndex: steps.length - position,
              pointerEvents: isFront ? "auto" : "none",
            } as const;

            return (
              <article
                key={step.titleEn}
                className="how-stack-card absolute inset-x-0 top-0 rounded-[28px] border border-white/10 bg-[#171b2b]/95 p-5 shadow-2xl backdrop-blur"
                style={cardStyle}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-sky-200">0{index + 1}</span>
                    <h3 className="mt-3 text-xl font-black text-white">{t(step.titleEn, step.titleCn)}</h3>
                  </div>
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#38bdf8]/15 text-[#7dd3fc] ring-1 ring-[#38bdf8]/30">
                    {isFront ? <span className="active-dot" /> : null}
                    <Icon size={25} strokeWidth={2.4} />
                  </span>
                </div>
                <p className="mt-7 text-sm leading-6 text-slate-300">{t(step.bodyEn, step.bodyCn)}</p>
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

        <div className="mt-5 rounded-[24px] border border-sky-300/20 bg-[#071223]/60 p-4">
          <p className="text-sm font-black text-white">Shanghai → Paris</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
            <span>{t("Item: Documents", "物品：文件")}</span>
            <span>{t("Reward: €20", "预算：€20")}</span>
            <span>{t("Status: Looking for carrier", "状态：等待接单")}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            {t(
              "Example: Carry documents from Shanghai to Paris with a €20 reward, waiting for a student carrier.",
              "示例：从上海到巴黎带一份文件，预算 €20，等待顺路学生接单。",
            )}
          </p>
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
