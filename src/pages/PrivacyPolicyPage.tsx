import BackButton from "../components/BackButton";

const sections = [
  {
    titleZh: "我们收集的信息",
    titleEn: "Information We Collect",
    bodyZh:
      "我们会根据你使用的功能收集邮箱、手机号、登录状态、昵称、城市、学校信息（选填）、发布内容、路线、物品描述、图片、聊天内容以及基础设备和错误日志信息。",
    bodyEn:
      "Depending on the features you use, we may collect your email address, phone number, login status, nickname, city, optional school information, posts, routes, item descriptions, images, chat content, and basic device or error log information.",
  },
  {
    titleZh: "信息用途",
    titleEn: "How We Use Information",
    bodyZh:
      "我们使用这些信息用于登录注册、账号安全、发布与匹配、站内沟通、风险控制、内容审核、问题排查和改进服务体验。",
    bodyEn:
      "We use this information for login and registration, account safety, posting and matching, in-app communication, risk control, content moderation, troubleshooting, and improving the service experience.",
  },
  {
    titleZh: "公开展示规则",
    titleEn: "Public Display Rules",
    bodyZh:
      "你的手机号和邮箱不会公开展示。市场页面可能展示你主动发布的路线、物品信息、预算、日期、备注和图片。聊天内容仅用于相关对话和必要的安全处理。",
    bodyEn:
      "Your phone number and email address are not publicly displayed. The Market page may show routes, item details, reward, dates, notes, and images that you choose to publish. Chat content is used for the relevant conversation and necessary safety handling.",
  },
  {
    titleZh: "敏感证件",
    titleEn: "Sensitive Documents",
    bodyZh:
      "请勿上传护照、签证、银行卡、身份证件或其他敏感证件。本 Beta 阶段不要求用户公开提交这些资料。如未来引入身份验证，应通过可信第三方或更安全的验证流程完成。",
    bodyEn:
      "Do not upload passports, visas, bank cards, identity documents, or other sensitive documents. During this Beta stage, users are not required to publicly submit these materials. If identity verification is introduced later, it should be handled through a trusted third party or a safer verification flow.",
  },
  {
    titleZh: "数据共享",
    titleEn: "Data Sharing",
    bodyZh:
      "我们不会出售你的个人信息。为提供服务、排查问题、遵守法律要求、处理安全风险或保护用户权益，平台可能在必要范围内处理或披露相关信息。",
    bodyEn:
      "We do not sell your personal information. To provide the service, troubleshoot issues, comply with legal requirements, handle safety risks, or protect users, the platform may process or disclose relevant information where necessary.",
  },
  {
    titleZh: "用户责任",
    titleEn: "User Responsibilities",
    bodyZh:
      "你应避免在公开发布内容或聊天中发送不必要的敏感信息。线下交接、物品合法性、海关航空规定和当地法律合规仍由用户自行负责。",
    bodyEn:
      "You should avoid sharing unnecessary sensitive information in public posts or chats. Users remain responsible for offline handovers, item legality, customs and airline rules, and local legal compliance.",
  },
  {
    titleZh: "Beta 阶段与数据保留",
    titleEn: "Beta Stage and Retention",
    bodyZh:
      "平台仍在完善中，数据结构和功能可能调整。我们会在提供服务所需期间保留信息，并在合理可行范围内支持账号或内容删除请求。",
    bodyEn:
      "The platform is still being improved, and data structures or features may change. We retain information as needed to provide the service and will support account or content removal requests where reasonably possible.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <BackButton fallback="/my" />

      <div className="rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-4 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Student Carry Beta</p>
        <h1 className="mt-2 text-2xl font-black text-white">隐私政策 / Privacy Policy</h1>
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
