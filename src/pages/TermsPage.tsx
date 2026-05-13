import BackButton from "../components/BackButton";

const sections = [
  {
    titleZh: "服务定位",
    titleEn: "Service Positioning",
    bodyZh:
      "Student Carry 是面向国际学生的跨境随身携带信息匹配与沟通工具。平台仍在完善中，我们提供发布、浏览、匹配和站内消息功能，但不提供专业物流、国际运输、代购、担保交易或海关代理服务。",
    bodyEn:
      "Student Carry is an early version information matching and messaging tool for international students coordinating cross-border carry requests. The service is still being improved. We provide posting, browsing, matching, and in-app messaging tools, but we are not a professional delivery service, international shipping company, purchasing agent, escrow provider, or customs broker.",
  },
  {
    titleZh: "用户资格",
    titleEn: "Eligibility",
    bodyZh:
      "你必须年满 18 周岁才能使用本服务。使用平台即表示你确认自己具备独立判断物品合法性、出行规则和线下交接风险的能力。",
    bodyEn:
      "You must be at least 18 years old to use this service. By using the platform, you confirm that you can independently assess item legality, travel rules, and offline handover risks.",
  },
  {
    titleZh: "禁止物品",
    titleEn: "Prohibited Items",
    bodyZh:
      "禁止发布、携带或协商任何非法、危险、受限制、受海关管制、受航空限制或目的地法律限制的物品，包括但不限于危险品、武器、非法物质、受限制电池、大容量液体、灰产代购商品以及任何无法合法携带的物品。",
    bodyEn:
      "You may not post, carry, or coordinate illegal, dangerous, restricted, customs-controlled, aviation-restricted, or locally prohibited items, including dangerous goods, weapons, illegal substances, restricted batteries, large liquids, gray-market resale goods, or anything that cannot be carried legally.",
  },
  {
    titleZh: "合规责任",
    titleEn: "Compliance Responsibilities",
    bodyZh:
      "用户需自行确认出发地、航空公司、转机地、海关以及目的地国家或地区的相关规定。平台不保证任何物品可以通过安检、航空运输、海关或当地监管要求。",
    bodyEn:
      "Users are responsible for checking rules in the departure location, airline, transit location, customs authority, and destination country or region. The platform does not guarantee that any item can pass security checks, airline rules, customs, or local regulations.",
  },
  {
    titleZh: "交易与沟通",
    titleEn: "Transactions and Communication",
    bodyZh:
      "平台仅提供信息匹配与消息沟通工具。用户自行决定是否联系、匹配、取消匹配或线下交接，并自行承担由沟通、价格协商、交接地点、时间安排和物品合法性带来的风险。",
    bodyEn:
      "The platform only provides information matching and messaging tools. Users decide whether to contact, match, cancel a match, or complete an offline handover, and users are responsible for risks related to communication, reward discussions, meeting locations, timing, and item legality.",
  },
  {
    titleZh: "账号与安全",
    titleEn: "Account and Safety",
    bodyZh:
      "用户应提供真实、可联系的登录信息，并不得冒充他人、滥用消息功能、骚扰其他用户或发布误导性内容。平台可基于安全、合规或滥用风险移除内容、限制功能或暂停账号。",
    bodyEn:
      "Users should provide accurate login information and must not impersonate others, abuse messaging, harass users, or post misleading content. For safety, compliance, or abuse risks, the platform may remove content, limit features, or suspend accounts.",
  },
  {
    titleZh: "Beta 阶段说明",
    titleEn: "Beta Notice",
    bodyZh:
      "本服务处于 Beta 阶段，功能、规则和页面可能持续调整。我们会尽力保持服务稳定，但不承诺所有功能始终无误或不中断。",
    bodyEn:
      "This service is in Beta. Features, rules, and pages may continue to change. We aim to keep the service stable, but we do not promise that every feature will always be error-free or uninterrupted.",
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <BackButton fallback="/my" />

      <div className="rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-4 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Student Carry Beta</p>
        <h1 className="mt-2 text-2xl font-black text-white">服务条款 / Terms of Service</h1>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          生效日期：2026 年 5 月 14 日
          <br />
          Effective date: May 14, 2026
        </p>
      </div>

      <div className="mt-3 grid gap-3">
        {sections.map((section) => (
          <article key={section.titleEn} className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 shadow-lg">
            <h2 className="text-base font-black text-white">{section.titleZh}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-300">{section.bodyZh}</p>
            <div className="my-3 h-px bg-white/10" />
            <h3 className="text-sm font-black text-sky-100">{section.titleEn}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">{section.bodyEn}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
