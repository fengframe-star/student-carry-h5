import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, MessageCircle, PackagePlus } from "lucide-react";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

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

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-bold tracking-wide text-slate-300">
          <span className="block">国际学生跨境顺路带物匹配</span>
          <span className="mt-1 block text-slate-400">Cross-border carry matching for international students</span>
        </p>
        <h1 className="mt-5 text-5xl font-black leading-tight text-white">
          Student Carry
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-300">
          <span className="block">为留学生提供发布需求、浏览行程、沟通协商和线下确认的一站式匹配体验。</span>
          <span className="mt-1 block text-slate-400">
            A student marketplace for posting requests, browsing carry routes, negotiating details, and confirming offline exchanges.
          </span>
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            to="/post-request"
            className="pressable flex min-h-14 items-center justify-center rounded-2xl bg-[#38bdf8] px-3 text-center text-sm font-black text-white transition hover:bg-[#0ea5e9]"
          >
            帮我带 / Request
          </Link>
          <Link
            to="/carry-earn"
            className="pressable flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-3 text-center text-sm font-black text-white transition hover:bg-white/15"
          >
            顺路送 / Carry
          </Link>
        </div>
      </div>

      <section className="mt-5 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.18),transparent_34%),rgba(31,34,50,0.92)] p-5 shadow-2xl sm:p-6">
        <h2 className="text-xl font-black text-white">如何使用 / How it works</h2>

        <div className="relative mt-5 h-[300px] sm:h-[270px]">
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
                    <h3 className="mt-3 text-xl font-black text-white">{step.titleCn}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-400">{step.titleEn}</p>
                  </div>
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#38bdf8]/15 text-[#7dd3fc] ring-1 ring-[#38bdf8]/30">
                    {isFront ? <span className="active-dot" /> : null}
                    <Icon size={25} strokeWidth={2.4} />
                  </span>
                </div>
                <p className="mt-7 text-sm leading-6 text-slate-200">{step.bodyCn}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.bodyEn}</p>
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
            <span>Item: Documents</span>
            <span>Reward: €20</span>
            <span>Status: Looking for carrier</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            示例：从上海到巴黎带一份文件，预算 €20，等待顺路学生接单。
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Example: Carry documents from Shanghai to Paris with a €20 reward, waiting for a student carrier.
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
  const toneClass =
    tone === "blue"
      ? "border-sky-400/25 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.22),transparent_36%),rgba(31,34,50,0.92)]"
      : "border-fuchsia-500/20 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.20),transparent_34%),radial-gradient(circle_at_80%_100%,rgba(239,68,68,0.14),transparent_34%),rgba(31,34,50,0.92)]";

  return (
    <section className={`mt-5 rounded-[32px] border p-5 shadow-2xl ${toneClass}`}>
      <h2 className="text-xl font-black text-white">{titleCn}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-400">{titleEn}</p>
      <p className="mt-4 text-sm leading-7 text-slate-200">{bodyCn}</p>
      <p className="mt-2 text-sm leading-7 text-slate-400">{bodyEn}</p>
    </section>
  );
}
