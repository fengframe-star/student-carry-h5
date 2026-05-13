import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { sendLoginCode, signOut as cloudSignOut, isProfileComplete, saveProfile, verifyLoginCode, type LoginMethod, type PendingOtpLogin } from "../lib/auth";
import { getConversations } from "../lib/conversations";
import { useLanguage } from "../lib/language";
import { isCurrentUserPostOwner, isMatchedStatus, isOpenStatus, localizedStatusLabel } from "../lib/orderAccess";
import { currentOwnerId } from "../lib/profile";
import { deleteSubmission, getSubmissions } from "../lib/submissions";
import type { Submission } from "../types";

interface Profile {
  ownerId?: string;
  firstName?: string;
  lastName?: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  provider: string;
  currentCity?: string;
  schoolOrUniversity?: string;
  studentVerification?: boolean;
  identityVerified?: boolean;
  verificationLater?: string;
}

export default function MyPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(() => readProfile());
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [account, setAccount] = useState("");
  const [code, setCode] = useState("");
  const [pendingLogin, setPendingLogin] = useState<PendingOtpLogin | null>(null);
  const [profileForm, setProfileForm] = useState({
    nickname: profile?.nickname || "",
    currentCity: profile?.currentCity || "",
    schoolOrUniversity: profile?.schoolOrUniversity || "",
  });
  const [loginError, setLoginError] = useState("");
  const [authState, setAuthState] = useState<"idle" | "sending" | "verifying" | "saving">("idle");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [conversations, setConversations] = useState<Awaited<ReturnType<typeof getConversations>>>([]);

  async function loadPosts() {
    const [nextSubmissions, nextConversations] = await Promise.all([getSubmissions(), getConversations()]);
    setSubmissions(nextSubmissions);
    setConversations(nextConversations);
  }

  useEffect(() => {
    if (profile) {
      void loadPosts();
    }
  }, [profile]);

  async function logout() {
    await cloudSignOut();
    setProfile(null);
    setSubmissions([]);
    setConversations([]);
    setPendingLogin(null);
    setCode("");
  }

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setAuthState("sending");

    try {
      setPendingLogin(await sendLoginCode(loginMethod, account));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to send verification code.");
    } finally {
      setAuthState("idle");
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!pendingLogin) return;

    setLoginError("");
    setAuthState("verifying");

    try {
      const nextProfile = await verifyLoginCode(pendingLogin, code);
      setProfile(nextProfile);
      setProfileForm({
        nickname: nextProfile.nickname || "",
        currentCity: nextProfile.currentCity || "",
        schoolOrUniversity: nextProfile.schoolOrUniversity || "",
      });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to verify code.");
    } finally {
      setAuthState("idle");
    }
  }

  async function handleCompleteProfile(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;

    setLoginError("");
    setAuthState("saving");
    try {
      const nextProfile = {
        ...profile,
        nickname: profileForm.nickname.trim(),
        currentCity: profileForm.currentCity.trim(),
        schoolOrUniversity: profileForm.schoolOrUniversity.trim(),
        studentVerification: Boolean(profileForm.schoolOrUniversity.trim()),
      };
      await saveProfile(nextProfile);
      setProfile(nextProfile);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setAuthState("idle");
    }
  }

  const ownerId = currentOwnerId();
  const matchedPostIds = new Set(
    conversations
      .filter((conversation) => conversation.postOwnerId === ownerId || conversation.starterUserId === ownerId)
      .map((conversation) => conversation.postId),
  );
  const isOwnedByProfile = (submission: Submission) =>
    Boolean(profile?.nickname && isCurrentUserPostOwner(submission));
  const isRelatedMatchedPost = (submission: Submission) =>
    isMatchedStatus(submission.status) && matchedPostIds.has(submission.id);
  const matchedPosts = submissions.filter(isRelatedMatchedPost);
  const myPosts = submissions.filter(isOwnedByProfile);

  async function handleDeletePost(id: string) {
    await deleteSubmission(id);
    await loadPosts();
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      {!profile ? (
        <div className="rounded-[22px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
          <p className="text-xs font-bold text-slate-400">Profile</p>
          <h1 className="mt-1 text-xl font-black text-white">{t("My account", "我的")}</h1>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {t("Log in to view your profile, posts, and negotiation entry points.", "登录后查看个人资料、发布记录与交易协商入口。")}
          </p>
        </div>
      ) : null}

      {!profile ? (
        <>
          <div className="fade-slide-in mx-auto mt-4 w-full max-w-sm overflow-hidden rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("My account", "我的")}</p>
            <h2 className="mt-1 text-lg font-black text-white">{t("Sign in to continue", "登录后继续")}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {t("Use email code or Mainland China SMS code. New accounts are created automatically.", "使用邮箱验证码或中国大陆手机号短信验证码。新账号会自动创建。")}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setPendingLogin(null);
                }}
                className={`pressable flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black ${
                  loginMethod === "email" ? "border-sky-300/40 bg-sky-400/20 text-sky-50" : "border-white/15 bg-white/10 text-white"
                }`}
              >
                <Mail size={18} />
                {t("Email", "邮箱")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("phone");
                  setPendingLogin(null);
                }}
                className={`pressable flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black ${
                  loginMethod === "phone" ? "border-sky-300/40 bg-sky-400/20 text-sky-50" : "border-white/15 bg-white/10 text-white"
                }`}
              >
                <Phone size={18} />
                {t("Phone +86", "手机号 +86")}
              </button>
            </div>

            {!pendingLogin ? (
              <form onSubmit={handleSendCode} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">
                    {loginMethod === "email" ? t("Email address", "邮箱地址") : t("Mainland China phone number", "中国大陆手机号")}
                  </span>
                  <input
                    type={loginMethod === "email" ? "email" : "tel"}
                    required
                    value={account}
                    placeholder={loginMethod === "email" ? "name@example.com" : "13800138000"}
                    onChange={(event) => setAccount(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={authState === "sending"}
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {authState === "sending" ? t("Sending...", "发送中...") : t("Send verification code", "发送验证码")}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Verification code", "验证码")}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={authState === "verifying"}
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {authState === "verifying" ? t("Verifying...", "验证中...") : t("Log in / create account", "登录 / 自动注册")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingLogin(null);
                    setCode("");
                  }}
                  className="text-xs font-black text-sky-200"
                >
                  {t("Use another account", "使用其他账号")}
                </button>
              </form>
            )}
          </div>

          {loginError && (
            <div className="mt-4 rounded-[22px] border border-red-400/25 bg-red-400/10 p-3 text-xs leading-5 text-red-50">
              {loginError}
            </div>
          )}
        </>
      ) : !isProfileComplete(profile) ? (
        <form onSubmit={handleCompleteProfile} className="mt-4 grid gap-3 rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Profile</p>
            <h2 className="mt-1 text-lg font-black text-white">{t("Complete your profile", "完善个人资料")}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {t("Your email or phone is private and will not be shown publicly.", "你的邮箱或手机号不会公开展示。")}
            </p>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-100">{t("Nickname", "昵称")}</span>
            <input required value={profileForm.nickname} onChange={(event) => setProfileForm({ ...profileForm, nickname: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-100">{t("City", "城市")}</span>
            <input required value={profileForm.currentCity} onChange={(event) => setProfileForm({ ...profileForm, currentCity: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-100">{t("School or university (optional)", "学校或大学（选填）")}</span>
            <input value={profileForm.schoolOrUniversity} onChange={(event) => setProfileForm({ ...profileForm, schoolOrUniversity: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]" />
          </label>
          <button type="submit" disabled={authState === "saving"} className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60">
            {authState === "saving" ? t("Saving...", "保存中...") : t("Save profile", "保存资料")}
          </button>
          {loginError ? (
            <div className="rounded-[18px] border border-red-400/25 bg-red-400/10 p-3 text-xs leading-5 text-red-50">
              {loginError}
            </div>
          ) : null}
        </form>
      ) : (
        <>
          <div className="mt-4 rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-black text-white">{profile.nickname}</p>
                <p className="mt-0.5 text-xs text-slate-400">{profile.currentCity || t("City pending", "城市待完善")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    {profile.provider}
                  </p>
                  {profile.identityVerified ? (
                    <p className="inline-flex rounded-full bg-sky-400/15 px-3 py-1 text-xs font-black text-sky-100">
                      {t("Verified identity", "实名已认证")}
                    </p>
                  ) : null}
                  {profile.schoolOrUniversity ? (
                    <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                      {t("Student verification available", "可进行学生认证")}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white"
              >
                {t("Log out", "退出")}
              </button>
            </div>
          </div>

          <PostSection
            title={t("Matched", "已匹配")}
            subtitle={t("Matched orders you posted or accepted", "你发布或接单的已匹配订单")}
            empty={t("No matched orders yet.", "还没有已匹配订单")}
          >
            {matchedPosts.map((item) => (
              <OwnPostCard
                key={item.id}
                {...postCardProps(item, t)}
                status={item.status}
                owned={isOwnedByProfile(item)}
                onDelete={() => void handleDeletePost(item.id)}
              />
            ))}
          </PostSection>

          <PostSection
            title={t("My posts", "我的发布")}
            subtitle={t("All posts you published", "你发布的所有内容")}
            empty={t("No posts yet.", "还没有发布内容")}
          >
            {myPosts.map((item) => (
              <OwnPostCard
                key={item.id}
                {...postCardProps(item, t)}
                status={item.status}
                owned
                onDelete={() => void handleDeletePost(item.id)}
              />
            ))}
          </PostSection>
        </>
      )}
    </section>
  );
}

function postCardProps(
  item: Submission,
  t: (en: string, zh: string) => string,
) {
  if (item.type === "request") {
    return {
      kind: t("Request", "帮我带"),
      title: item.itemName,
      route: `${item.fromLocation} → ${item.toLocation}`,
      meta: `${t("Budget", "预算")}: €${item.budgetEur}`,
      detailTo: `/market/request/${item.id}`,
      editTo: `/post-request?edit=${item.id}`,
    };
  }

  return {
    kind: t("Carry", "顺路送"),
    title: item.travelRoute,
    route: `${t("Space", "空间")}: ${item.availableLuggageSpace}`,
    meta: `${t("Reward", "报酬")}: ${item.expectedReward}`,
    detailTo: `/market/carry/${item.id}`,
    editTo: `/carry-earn?edit=${item.id}`,
  };
}

function OwnPostCard({
  kind,
  title,
  route,
  meta,
  status,
  owned,
  detailTo,
  editTo,
  onDelete,
}: {
  kind: string;
  title: string;
  route: string;
  meta: string;
  status?: string;
  owned: boolean;
  detailTo: string;
  editTo: string;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const open = isOpenStatus(status);
  const matched = isMatchedStatus(status);
  const canEdit = owned && open;
  const content = (
    <>
      {canEdit ? (
        <div className="absolute right-3 top-3 flex gap-1.5">
          <Link
            to={editTo}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[0.65rem] font-black text-sky-100"
          >
            {t("Edit", "编辑")}
          </Link>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[0.65rem] font-black text-slate-300"
          >
            {t("Delete", "删除")}
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 pr-24">
        <span className="pill">{kind}</span>
        <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
          {localizedStatusLabel(status, language)}
        </span>
      </div>
      <h2 className="mt-2 truncate text-base font-black text-white">{title}</h2>
      <p className="mt-1 truncate text-xs text-slate-400">{route}</p>
      <p className="mt-1 truncate text-xs text-slate-400">{meta}</p>
      {matched && owned ? (
        <p className="mt-2 rounded-xl bg-white/[0.06] px-2.5 py-1.5 text-[0.68rem] font-bold leading-4 text-slate-300">
          {t("You can edit again after canceling the match.", "取消匹配后可重新编辑")}
        </p>
      ) : (
        <p className="mt-2 text-[0.68rem] font-bold text-sky-200">{t("Tap to view details", "点击查看详情")}</p>
      )}
    </>
  );

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(detailTo)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(detailTo);
        }
      }}
      className="my-card relative block cursor-pointer"
    >
      {content}
    </article>
  );
}

function readProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem("studentCarryProfile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile & { name?: string };
    return {
      ...parsed,
      nickname: parsed.nickname || parsed.name || "Student Carry User",
    };
  } catch {
    return null;
  }
}

function PostSection({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(items) && items.length === 0;

  return (
    <section className="mt-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      {isEmpty ? (
        <div className="mt-2 rounded-[20px] border border-white/10 bg-[#1f2232]/90 p-3 text-xs text-slate-400">
          {empty}
        </div>
      ) : (
        <div className="mt-2 grid gap-2">{children}</div>
      )}
    </section>
  );
}
