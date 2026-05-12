import { FormEvent, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { Apple, Circle, Mail, MessageCircle, WalletCards } from "lucide-react";
import { auth, googleProvider } from "../lib/firebase";
import { getConversations } from "../lib/conversations";
import { useLanguage } from "../lib/language";
import { isCurrentUserPostOwner, isMatchedStatus, isOpenStatus, localizedStatusLabel } from "../lib/orderAccess";
import { currentOwnerId, ownerIdForProfile } from "../lib/profile";
import { deleteSubmission, getSubmissions } from "../lib/submissions";
import type { CarrierSubmission, RequestSubmission, Submission } from "../types";

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
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationChoice, setVerificationChoice] = useState("No");
  const [loginError, setLoginError] = useState("");
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

  function saveProfile(nextProfile: Profile) {
    const profileWithOwnerId = {
      ...nextProfile,
      ownerId: ownerIdForProfile(nextProfile),
    };
    window.localStorage.setItem("studentCarryLoggedIn", "true");
    window.localStorage.setItem("studentCarryProfile", JSON.stringify(profileWithOwnerId));
    setProfile(profileWithOwnerId);
  }

  function profileFromLogin(provider: string, loginEmail: string, fallbackNickname: string): Profile {
    return {
      nickname: nickname.trim() || fallbackNickname,
      email: loginEmail,
      phoneNumber: phoneNumber.trim(),
      provider,
      verificationLater: verificationChoice,
      identityVerified: verificationChoice === "Yes",
    };
  }

  function logout() {
    window.localStorage.removeItem("studentCarryLoggedIn");
    window.localStorage.removeItem("studentCarryProfile");
    setProfile(null);
    setSubmissions([]);
    setShowPasswordForm(false);
  }

  async function handleEmailLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");

    try {
      if (!email.includes("@")) {
        saveProfile({
          ...profileFromLogin("Phone demo", `${email}@phone.local`, email || "Student Carry User"),
          phoneNumber: email,
        });
        return;
      }

      if (auth) {
        let credential;
        try {
          credential = await signInWithEmailAndPassword(auth, email, password);
        } catch {
          credential = await createUserWithEmailAndPassword(auth, email, password);
        }
        saveProfile({
          ...profileFromLogin("Email", credential.user.email || email, credential.user.displayName || "Student Carry User"),
        });
      } else {
        saveProfile({
          ...profileFromLogin("Email demo", email, "Student Carry User"),
        });
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to log in.");
    }
  }

  async function handleGmailLogin() {
    setLoginError("");

    try {
      if (!auth) {
        saveProfile({
          ...profileFromLogin("Gmail demo", "gmail-user@example.com", "Gmail User"),
        });
        return;
      }

      const credential = await signInWithPopup(auth, googleProvider);
      saveProfile({
        ...profileFromLogin("Gmail", credential.user.email || "", credential.user.displayName || "Gmail User"),
      });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to log in with Gmail.");
    }
  }

  function handleMockLogin(provider: string) {
    saveProfile(profileFromLogin(`${provider} demo`, `${provider.toLowerCase()}-user@example.com`, `${provider} User`));
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
  const requests = submissions.filter(
    (submission): submission is RequestSubmission =>
      submission.type === "request" && (isOwnedByProfile(submission) || isRelatedMatchedPost(submission)),
  );
  const carriers = submissions.filter(
    (submission): submission is CarrierSubmission =>
      submission.type === "carrier" && (isOwnedByProfile(submission) || isRelatedMatchedPost(submission)),
  );

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
              {t("Use a social account or continue with phone or email.", "使用社交账号，或通过手机号/邮箱继续。")}
            </p>

            <div className="stagger-in mt-3 grid gap-2">
              <OAuthButton icon={Apple} label={t("Continue with Apple", "使用 Apple 继续")} onClick={() => handleMockLogin("Apple")} />
              <OAuthButton icon={Circle} label={t("Continue with Google", "使用 Google 继续")} onClick={() => void handleGmailLogin()} />
              <OAuthButton icon={MessageCircle} label={t("Continue with WeChat", "使用微信继续")} onClick={() => handleMockLogin("WeChat")} />
              <OAuthButton icon={WalletCards} label={t("Continue with Alipay", "使用支付宝继续")} onClick={() => handleMockLogin("Alipay")} />
              <button
                type="button"
                onClick={() => setShowPasswordForm((open) => !open)}
                className="pressable flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-black text-white"
              >
                <Mail size={18} />
                {t("Use phone or email", "使用手机号或邮箱")}
              </button>
            </div>

            {showPasswordForm ? (
              <form onSubmit={handleEmailLogin} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Phone or email", "手机号或邮箱")}</span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Password", "密码")}</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <button
                  type="submit"
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white"
                >
                  {t("Continue", "继续")}
                </button>
              </form>
            ) : null}

            <p className="mt-3 text-center text-xs text-slate-400">
              {t("Don't have an account?", "还没有账号？")}{" "}
              <Link to="/register" className="font-black text-sky-200">
                {t("Sign up", "注册")}
              </Link>
            </p>
          </div>

          {loginError && (
            <div className="mt-4 rounded-[22px] border border-red-400/25 bg-red-400/10 p-3 text-xs leading-5 text-red-50">
              {loginError}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-4 rounded-[24px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-black text-white">{profile.nickname}</p>
                <p className="mt-0.5 text-xs text-slate-400">{profile.email || t("No email connected", "未绑定邮箱")}</p>
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
            title={t("My requests", "我的帮我带")}
            subtitle={t("Request posts", "帮我带发布")}
            empty={t("No request posts yet.", "还没有帮我带发布")}
          >
            {requests.map((item) => (
              <OwnPostCard
                key={item.id}
                kind={t("Request", "帮我带")}
                title={item.itemName}
                route={`${item.fromLocation} → ${item.toLocation}`}
                meta={`${t("Budget", "预算")}: €${item.budgetEur}`}
                status={item.status}
                owned={isOwnedByProfile(item)}
                detailTo={`/market/request/${item.id}`}
                editTo={`/post-request?edit=${item.id}`}
                onDelete={() => void handleDeletePost(item.id)}
              />
            ))}
          </PostSection>

          <PostSection
            title={t("My carry posts", "我的顺路送")}
            subtitle={t("Carry posts", "顺路送发布")}
            empty={t("No carry posts yet.", "还没有顺路送发布")}
          >
            {carriers.map((item) => (
              <OwnPostCard
                key={item.id}
                kind={t("Carry", "顺路送")}
                title={item.travelRoute}
                route={`${t("Space", "空间")}: ${item.availableLuggageSpace}`}
                meta={`${t("Reward", "报酬")}: ${item.expectedReward}`}
                status={item.status}
                owned={isOwnedByProfile(item)}
                detailTo={`/market/carry/${item.id}`}
                editTo={`/carry-earn?edit=${item.id}`}
                onDelete={() => void handleDeletePost(item.id)}
              />
            ))}
          </PostSection>
        </>
      )}
    </section>
  );
}

function OAuthButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Apple;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable grid min-h-10 grid-cols-[1fr_auto_1fr] items-center rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-black text-white"
    >
      <Icon size={16} className="mr-3 self-center justify-self-end" />
      <span className="self-center justify-self-center leading-none">{label}</span>
      <span />
    </button>
  );
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
