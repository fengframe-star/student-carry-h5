import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-bold tracking-wide text-slate-300">
          <span className="block">欧洲学生顺路带物匹配</span>
          <span className="mt-1 block text-slate-400">Europe student delivery matching</span>
        </p>
        <h1 className="mt-5 text-5xl font-black leading-tight text-white">
          Student Carry
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-300">
          <span className="block">为欧洲留学生提供小件合法物品的需求发布、行程匹配和基础交易协调。</span>
          <span className="mt-1 block text-slate-400">
            A simple MVP for international students carrying small legal items between cities.
          </span>
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            to="/post-request"
            className="flex min-h-14 items-center justify-center rounded-2xl bg-[#38bdf8] px-3 text-center text-sm font-black text-white transition hover:bg-[#0ea5e9]"
          >
            帮我带 / Request
          </Link>
          <Link
            to="/carry-earn"
            className="flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-3 text-center text-sm font-black text-white transition hover:bg-white/15"
          >
            顺路送 / Carry
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
        <Link to="/market" className="flex min-h-20 items-center justify-between gap-4 border-b border-white/10 pb-5">
          <span>
            <span className="block text-lg font-black text-white">匹配集市</span>
            <span className="mt-1 block text-sm text-slate-400">Market</span>
          </span>
          <span className="text-4xl text-slate-500">›</span>
        </Link>
        <Link to="/my" className="mt-5 flex min-h-20 items-center justify-between gap-4">
          <span>
            <span className="block text-lg font-black text-white">我的发布与登录</span>
            <span className="mt-1 block text-sm text-slate-400">My posts and login</span>
          </span>
          <span className="text-4xl text-slate-500">›</span>
        </Link>
      </div>

      <div className="mt-5 rounded-[28px] border border-sky-400/25 bg-sky-400/10 p-5 text-sm leading-7 text-sky-50">
        <span className="block">MVP 阶段不收集护照号码或身份证件。</span>
        <span className="block text-sky-100/80">We do not collect passport numbers or ID documents at MVP stage.</span>
        <span className="mt-2 block">后续身份验证可能通过可信第三方服务完成。</span>
        <span className="block text-sky-100/80">Identity verification may be introduced later through a trusted third-party provider.</span>
      </div>

      <div className="mt-5 rounded-[28px] border border-red-400/25 bg-red-400/10 p-5 text-sm leading-7 text-red-50">
        <span className="block">平台仅提供匹配与基础交易协调，用户需自行确认海关规定和物品合法性。</span>
        <span className="block text-red-100/80">
          The platform only supports matching and basic transaction coordination. Users are responsible for customs compliance and item legality.
        </span>
      </div>
    </section>
  );
}
