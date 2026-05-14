import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import {
  checkAccountStatus,
  createAccountWithPassword,
  sendCreateAccountCode,
  sendPasswordResetCode,
  signInWithAccountPassword,
  signOut as cloudSignOut,
  isProfileComplete,
  saveProfile,
  readCloudbaseUser,
  resetPasswordAndSignIn,
  type LoginMethod,
  type PendingPasswordReset,
} from "../lib/auth";
import { getConversations } from "../lib/conversations";
import { matchingCarriers, matchingRequests } from "../lib/matching";
import { useLanguage } from "../lib/language";
import { isCurrentUserPostOwner, isMatchedStatus, isOpenStatus, localizedStatusLabel } from "../lib/orderAccess";
import { currentOwnerId } from "../lib/profile";
import { deleteSubmission, getSubmissions } from "../lib/submissions";
import type { Submission } from "../types";

type AuthStep = "account" | "password" | "register" | "forgot";

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
  legalAgreementAcceptedAt?: number;
  wechatId?: string;
  shareWechat?: boolean;
  sharePhone?: boolean;
}

const authDraftKey = "studentCarryAuthDraft";

function readAuthDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(authDraftKey) || "null") as {
      loginMethod?: LoginMethod;
      authStep?: AuthStep;
      account?: string;
      emailAccount?: string;
      phoneAccount?: string;
      normalizedAccount?: string;
      code?: string;
      password?: string;
      confirmPassword?: string;
      createVerificationId?: string;
      legalAccepted?: boolean;
    } | null;
  } catch {
    return null;
  }
}

export default function MyPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(() => readProfile());
  const [authDraft] = useState(() => readAuthDraft());
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(() => authDraft?.loginMethod || "email");
  const [authStep, setAuthStep] = useState<AuthStep>(() => authDraft?.authStep || "account");
  const [emailAccount, setEmailAccount] = useState(() => authDraft?.emailAccount || authDraft?.account || ".com");
  const [phoneAccount, setPhoneAccount] = useState(() => authDraft?.phoneAccount || "");
  const [normalizedAccount, setNormalizedAccount] = useState(() => authDraft?.normalizedAccount || "");
  const [code, setCode] = useState(() => authDraft?.code || "");
  const [password, setPassword] = useState(() => authDraft?.password || "");
  const [confirmPassword, setConfirmPassword] = useState(() => authDraft?.confirmPassword || "");
  const [createVerificationId, setCreateVerificationId] = useState(() => authDraft?.createVerificationId || "");
  const [pendingReset, setPendingReset] = useState<PendingPasswordReset | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(() => Boolean(authDraft?.legalAccepted));
  const [profileForm, setProfileForm] = useState({
    nickname: profile?.nickname || "",
    currentCity: profile?.currentCity || "",
    schoolOrUniversity: profile?.schoolOrUniversity || "",
    wechatId: profile?.wechatId || "",
    phoneNumber: profile?.phoneNumber || "",
    shareWechat: Boolean(profile?.shareWechat),
    sharePhone: Boolean(profile?.sharePhone),
  });
  const [loginError, setLoginError] = useState("");
  const [authState, setAuthState] = useState<"idle" | "checking" | "sending" | "verifying" | "saving">("idle");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [conversations, setConversations] = useState<Awaited<ReturnType<typeof getConversations>>>([]);
  const [expandedMatchPostId, setExpandedMatchPostId] = useState<string | null>(null);
  const account = loginMethod === "email" ? emailAccount : phoneAccount;

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

  useEffect(() => {
    if (profile) return;
    let cancelled = false;
    void readCloudbaseUser().then((user) => {
      const ownerId = String(user?.uid || user?.id || "");
      if (!ownerId || cancelled) return;
      const restored = readProfile();
      if (restored?.ownerId === ownerId) {
        setProfile(restored);
      }
    }).catch((error) => {
      console.error("CloudBase session restore failed.", error);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (profile || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(authDraftKey, JSON.stringify({
      loginMethod,
      authStep,
      account,
      emailAccount,
      phoneAccount,
      normalizedAccount,
      code,
      password,
      confirmPassword,
      createVerificationId,
      legalAccepted,
    }));
  }, [profile, loginMethod, authStep, account, emailAccount, phoneAccount, normalizedAccount, code, password, confirmPassword, createVerificationId, legalAccepted]);

  async function logout() {
    await cloudSignOut();
    window.sessionStorage.removeItem(authDraftKey);
    setProfile(null);
    setSubmissions([]);
    setConversations([]);
    setAuthStep("account");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setCreateVerificationId("");
    setPendingReset(null);
  }

  function resetAuthInputs() {
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setCreateVerificationId("");
    setPendingReset(null);
    setLoginError("");
  }

  function requireRegistrationAgreement() {
    if (legalAccepted) return true;
    setLoginError(t("Please read and agree to the Terms of Service and Privacy Policy first.", "请先阅读并同意服务条款和隐私政策。"));
    return false;
  }

  async function handleContinue(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setAuthState("checking");

    try {
      const result = await checkAccountStatus(loginMethod, account);
      setNormalizedAccount(result.account);
      resetAuthInputs();
      if (result.exists) {
        setAuthStep("password");
      } else {
        setAuthState("sending");
        setCreateVerificationId(await sendCreateAccountCode(loginMethod, result.account));
        setAuthStep("register");
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setAuthState("idle");
    }
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setAuthState("verifying");

    try {
      const nextProfile = await signInWithAccountPassword(loginMethod, normalizedAccount, password);
      window.sessionStorage.removeItem(authDraftKey);
      setProfile(nextProfile);
      setProfileForm(profileFormFrom(nextProfile));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setAuthState("idle");
    }
  }

  function profileFormFrom(nextProfile: Profile) {
    return {
      nickname: nextProfile.nickname || "",
      currentCity: nextProfile.currentCity || "",
      schoolOrUniversity: nextProfile.schoolOrUniversity || "",
      wechatId: nextProfile.wechatId || "",
      phoneNumber: nextProfile.phoneNumber || "",
      shareWechat: Boolean(nextProfile.shareWechat),
      sharePhone: Boolean(nextProfile.sharePhone),
    };
  }

  async function handleStartForgotPassword() {
    setLoginError("");
    setAuthState("sending");
    try {
      setPendingReset(await sendPasswordResetCode(normalizedAccount));
      setCode("");
      setPassword("");
      setConfirmPassword("");
      setAuthStep("forgot");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to send reset code.");
    } finally {
      setAuthState("idle");
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!requireRegistrationAgreement()) return;
    if (password !== confirmPassword) {
      setLoginError(t("Passwords do not match.", "两次密码不一致。"));
      return;
    }

    setLoginError("");
    setAuthState("verifying");
    try {
      const nextProfile = await createAccountWithPassword(loginMethod, normalizedAccount, createVerificationId, code, password, Date.now());
      window.sessionStorage.removeItem(authDraftKey);
      setProfile(nextProfile);
      setProfileForm(profileFormFrom(nextProfile));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setAuthState("idle");
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    if (!pendingReset) return;
    if (password !== confirmPassword) {
      setLoginError(t("Passwords do not match.", "两次密码不一致。"));
      return;
    }

    setLoginError("");
    setAuthState("verifying");
    try {
      const nextProfile = await resetPasswordAndSignIn(loginMethod, pendingReset, code, password);
      window.sessionStorage.removeItem(authDraftKey);
      setProfile(nextProfile);
      setProfileForm(profileFormFrom(nextProfile));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setAuthState("idle");
    }
  }

  async function handleCompleteProfile(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;

    setLoginError("");
    if (!profileForm.wechatId.trim() && !profileForm.phoneNumber.trim()) {
      setLoginError(t("Please add at least WeChat ID or phone number.", "请至少填写 WeChat ID 或手机号中的一种联系方式。"));
      return;
    }
    setAuthState("saving");
    try {
      const nextProfile = {
        ...profile,
        nickname: profileForm.nickname.trim(),
        currentCity: profileForm.currentCity.trim(),
        schoolOrUniversity: profileForm.schoolOrUniversity.trim(),
        wechatId: profileForm.wechatId.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        shareWechat: Boolean(profileForm.shareWechat && profileForm.wechatId.trim()),
        sharePhone: Boolean(profileForm.sharePhone && profileForm.phoneNumber.trim()),
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
      .filter((conversation) => conversation.participantIds?.includes(ownerId) || conversation.postOwnerId === ownerId || conversation.starterUserId === ownerId)
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
              {t("Continue with email or Mainland China phone. Existing accounts use password; new accounts verify and create a password.", "使用邮箱或中国大陆手机号继续。已有账号使用密码登录，新账号验证码验证后设置密码。")}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setAuthStep("account");
                  resetAuthInputs();
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
                  setAuthStep("account");
                  resetAuthInputs();
                }}
                className={`pressable flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black ${
                  loginMethod === "phone" ? "border-sky-300/40 bg-sky-400/20 text-sky-50" : "border-white/15 bg-white/10 text-white"
                }`}
              >
                <Phone size={18} />
                {t("Phone +86", "手机号 +86")}
              </button>
            </div>

            {authStep === "account" ? (
              <form onSubmit={handleContinue} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">
                    {loginMethod === "email" ? t("Email address", "邮箱地址") : t("Mainland China phone number", "中国大陆手机号")}
                  </span>
                  <input
                    type={loginMethod === "email" ? "email" : "tel"}
                    required
                    value={account}
                    placeholder={loginMethod === "email" ? "name@example.com" : "13800138000"}
                    onChange={(event) => {
                      if (loginMethod === "email") {
                        setEmailAccount(event.target.value);
                      } else {
                        setPhoneAccount(event.target.value);
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={authState === "checking" || authState === "sending"}
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {authState === "checking" || authState === "sending" ? <LoadingDots /> : t("Continue", "继续")}
                </button>
              </form>
            ) : null}

            {authStep === "password" ? (
              <form onSubmit={handlePasswordLogin} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-bold text-slate-400">{normalizedAccount}</p>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Password", "密码")}</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={authState === "verifying"}
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {authState === "verifying" ? t("Logging in...", "登录中...") : t("Log in", "登录")}
                </button>
                <div className="flex items-center justify-between text-xs font-black">
                  <button type="button" onClick={() => setAuthStep("account")} className="text-slate-300">
                    {t("Use another account", "使用其他账号")}
                  </button>
                  <button type="button" onClick={() => void handleStartForgotPassword()} className="text-sky-200">
                    {t("Forgot password?", "忘记密码？")}
                  </button>
                </div>
              </form>
            ) : null}

            {authStep === "register" ? (
              <form onSubmit={handleRegister} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-bold text-slate-400">
                  {t("Create account", "创建账号")} · {normalizedAccount}
                </p>
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
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Create password", "设置密码")}</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Confirm password", "确认密码")}</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <label className="flex items-start gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(event) => {
                      setLegalAccepted(event.target.checked);
                      if (event.target.checked) setLoginError("");
                    }}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-[#38bdf8]"
                  />
                  <span>
                    {t("I have read and agree to the ", "我已阅读并同意")}
                    <Link to="/terms" className="font-black text-sky-200 underline decoration-sky-200/40 underline-offset-2">
                      {t("Terms of Service", "服务条款")}
                    </Link>
                    {t(" and ", "和")}
                    <Link to="/privacy" className="font-black text-sky-200 underline decoration-sky-200/40 underline-offset-2">
                      {t("Privacy Policy", "隐私政策")}
                    </Link>
                    {t(".", "。")}
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={authState === "verifying" || !legalAccepted}
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {authState === "verifying" ? t("Creating...", "创建中...") : t("Create account", "创建账号")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep("account");
                    resetAuthInputs();
                  }}
                  className="text-xs font-black text-sky-200"
                >
                  {t("Use another account", "使用其他账号")}
                </button>
              </form>
            ) : null}

            {authStep === "forgot" ? (
              <form onSubmit={handleResetPassword} className="slide-down-panel mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-bold text-slate-400">
                  {t("Reset password", "重置密码")} · {normalizedAccount}
                </p>
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
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("New password", "新密码")}</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-100">{t("Confirm new password", "确认新密码")}</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={authState === "verifying"}
                  className="pressable min-h-10 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {authState === "verifying" ? t("Resetting...", "重置中...") : t("Reset password and log in", "重置密码并登录")}
                </button>
                <button type="button" onClick={() => setAuthStep("password")} className="text-xs font-black text-sky-200">
                  {t("Back to password login", "返回密码登录")}
                </button>
              </form>
            ) : null}

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
          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-black text-white">{t("Contact after match", "匹配后联系方式")}</p>
            <p className="mt-1 text-[0.68rem] leading-4 text-slate-400">
              {t("Contact details are shown only after both sides agree to match.", "联系方式仅会在双方同意匹配后显示。")}
            </p>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-100">WeChat ID</span>
              <input value={profileForm.wechatId} onChange={(event) => setProfileForm({ ...profileForm, wechatId: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]" />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-100">{t("Phone number", "手机号")}</span>
              <input value={profileForm.phoneNumber} onChange={(event) => setProfileForm({ ...profileForm, phoneNumber: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-[#38bdf8]" />
            </label>
            <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-300">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profileForm.shareWechat} onChange={(event) => setProfileForm({ ...profileForm, shareWechat: event.target.checked })} className="h-4 w-4 accent-[#38bdf8]" />
                {t("Share WeChat after match", "匹配后共享 WeChat")}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profileForm.sharePhone} onChange={(event) => setProfileForm({ ...profileForm, sharePhone: event.target.checked })} className="h-4 w-4 accent-[#38bdf8]" />
                {t("Share phone number after match", "匹配后共享手机号")}
              </label>
            </div>
          </div>
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
            subtitle={t("Posts you matched or published", "你匹配或发布的已匹配订单")}
            empty={t("No matched orders yet.", "还没有已匹配订单")}
          >
            {matchedPosts.map((item) => (
              <OwnPostCard
                key={item.id}
                {...postCardProps(item, t)}
                status={item.status}
                owned={isOwnedByProfile(item)}
                recentMatches={recentMatchesFor(item, submissions, t)}
                expanded={expandedMatchPostId === item.id}
                onToggleMatches={() => setExpandedMatchPostId((current) => current === item.id ? null : item.id)}
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
                recentMatches={recentMatchesFor(item, submissions, t)}
                expanded={expandedMatchPostId === item.id}
                onToggleMatches={() => setExpandedMatchPostId((current) => current === item.id ? null : item.id)}
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

function recentMatchesFor(item: Submission, submissions: Submission[], t: (en: string, zh: string) => string) {
  if (item.type === "request") {
    return matchingCarriers(item, submissions).map(({ carrier }) => ({
      label: carrier.travelRoute,
      meta: `${carrier.travelDate} · ${carrier.expectedReward}`,
      to: `/market/carry/${carrier.id}`,
    }));
  }

  return matchingRequests(item, submissions).map(({ request }) => ({
    label: `${request.fromLocation} → ${request.toLocation}`,
    meta: `${request.itemName || t("Item", "物品")} · €${request.budgetEur || 0}`,
    to: `/market/request/${request.id}`,
  }));
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
  recentMatches,
  expanded,
  onToggleMatches,
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
  recentMatches: Array<{ label: string; meta: string; to: string }>;
  expanded: boolean;
  onToggleMatches: () => void;
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
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleMatches();
          }}
          className="mt-2 text-[0.68rem] font-bold text-sky-200"
        >
          {t("View recent matches", "查看最近匹配")}
        </button>
      )}
      {expanded ? (
        <div className="mt-2 grid gap-1.5 rounded-xl bg-white/[0.05] p-2">
          {recentMatches.length ? recentMatches.map((match) => (
            <Link
              key={match.to}
              to={match.to}
              onClick={(event) => event.stopPropagation()}
              className="rounded-lg bg-white/[0.06] px-2 py-1.5 text-[0.68rem] text-slate-300"
            >
              <span className="block font-black text-white">{match.label}</span>
              <span className="block truncate text-slate-400">{match.meta}</span>
            </Link>
          )) : (
            <p className="text-[0.68rem] font-semibold text-slate-400">{t("No suitable matches yet.", "暂无合适匹配")}</p>
          )}
        </div>
      ) : null}
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

function LoadingDots() {
  return (
    <span className="loading-dots" aria-label="Loading">
      <span />
      <span />
      <span />
    </span>
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
