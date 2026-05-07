import { FormEvent, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth, googleProvider } from "../lib/firebase";
import { useLanguage } from "../lib/language";
import { getSubmissions, updateSubmissionDate } from "../lib/submissions";
import type { Submission } from "../types";

interface Profile {
  name: string;
  email: string;
  provider: string;
}

export default function MyPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(() => readProfile());
  const [showLoginMethods, setShowLoginMethods] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  async function loadPosts() {
    setSubmissions(await getSubmissions());
  }

  useEffect(() => {
    if (profile) {
      void loadPosts();
    }
  }, [profile]);

  function saveProfile(nextProfile: Profile) {
    window.localStorage.setItem("studentCarryLoggedIn", "true");
    window.localStorage.setItem("studentCarryProfile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
  }

  function logout() {
    window.localStorage.removeItem("studentCarryLoggedIn");
    window.localStorage.removeItem("studentCarryProfile");
    setProfile(null);
    setSubmissions([]);
    setShowLoginMethods(false);
    setShowEmailForm(false);
  }

  async function handleEmailLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");

    try {
      if (auth) {
        let credential;
        try {
          credential = await signInWithEmailAndPassword(auth, email, password);
        } catch {
          credential = await createUserWithEmailAndPassword(auth, email, password);
        }
        saveProfile({
          name: credential.user.displayName || "Student Carry User",
          email: credential.user.email || email,
          provider: "Email",
        });
      } else {
        saveProfile({
          name: "Student Carry User",
          email,
          provider: "Email demo",
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
          name: "Gmail User",
          email: "gmail-user@example.com",
          provider: "Gmail demo",
        });
        return;
      }

      const credential = await signInWithPopup(auth, googleProvider);
      saveProfile({
        name: credential.user.displayName || "Gmail User",
        email: credential.user.email || "",
        provider: "Gmail",
      });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to log in with Gmail.");
    }
  }

  async function handleDateChange(
    id: string,
    field: "desiredDeliveryDate" | "travelDate",
    value: string,
  ) {
    await updateSubmissionDate(id, field, value);
    await loadPosts();
  }

  const requests = submissions.filter((submission) => submission.type === "request");
  const carriers = submissions.filter((submission) => submission.type === "carrier");

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {!profile ? (
        <div className="rounded-[26px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
          <p className="text-xs font-bold text-slate-400">Profile</p>
          <h1 className="mt-2 text-3xl font-black text-white">{t("My account", "我的")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {t("Log in to view your profile, posts, and negotiation entry points.", "登录后查看个人资料、发布记录与交易协商入口。")}
          </p>
        </div>
      ) : null}

      {!profile ? (
        <>
          <div className="fade-slide-in mt-5 overflow-hidden rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
            {!showLoginMethods ? (
              <div className="stagger-in grid grid-cols-2 gap-3">
                <Link
                  to="/register"
                  className="pressable flex min-h-14 items-center justify-center rounded-2xl bg-[#38bdf8] px-3 text-center text-sm font-black text-white"
                >
                  {t("Register", "注册")}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowLoginMethods(true)}
                  className="pressable min-h-14 rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-black text-white"
                >
                  {t("Log in", "登录")}
                </button>
              </div>
            ) : (
              <div className="slide-panel-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginMethods(false);
                    setShowEmailForm(false);
                  }}
                  className="pressable mb-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-slate-300"
                >
                  ← {t("Back", "返回")}
                </button>
                <h2 className="text-xl font-black text-white">{t("Login methods", "登录方式")}</h2>
                {!showEmailForm ? (
                  <div className="stagger-in mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(true)}
                      className="pressable min-h-14 rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-black text-white"
                    >
                      {t("Email login", "邮箱登录")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGmailLogin()}
                      className="pressable min-h-14 rounded-2xl bg-[#38bdf8] px-3 text-sm font-black text-white"
                    >
                      {t("Gmail login", "Gmail 登录")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailLogin} className="slide-panel-in mt-5 grid gap-4">
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="pressable w-fit rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-slate-300"
                    >
                      ← {t("Back", "返回")}
                    </button>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-100">{t("Email", "邮箱")}</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-100">{t("Password", "密码")}</span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                      />
                    </label>
                    <button
                      type="submit"
                      className="pressable min-h-14 rounded-2xl bg-[#38bdf8] px-3 text-sm font-black text-white"
                    >
                      {t("Continue", "继续")}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {loginError && (
            <div className="mt-5 rounded-[28px] border border-red-400/25 bg-red-400/10 p-5 text-sm leading-7 text-red-50">
              {loginError}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-white">{profile.name}</p>
                <p className="mt-1 text-sm text-slate-400">{profile.email || "No email connected"}</p>
                <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                  {profile.provider}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white"
              >
                {t("Log out", "退出")}
              </button>
            </div>
          </div>

          <PostSection
            title="我的帮我带"
            subtitle="My requests"
            empty="暂无帮我带发布 / No request posts yet."
          >
            {requests.map((item) => (
              <article key={item.id} className="my-card">
                <span className="pill">Request / 帮我带</span>
                <h2 className="mt-4 text-xl font-black text-white">{item.itemName}</h2>
                <p className="mt-2 text-sm text-slate-400">{item.fromLocation} → {item.toLocation}</p>
                <p className="mt-2 text-sm text-slate-400">Budget / 预算: €{item.budgetEur}</p>
                <label className="mt-4 block">
                  <span className="whitespace-pre-line text-sm font-semibold text-slate-100">期望送达日期{"\n"}Desired delivery date</span>
                  <input
                    type="date"
                    value={item.desiredDeliveryDate || ""}
                    onChange={(event) =>
                      void handleDateChange(item.id, "desiredDeliveryDate", event.target.value)
                    }
                    className="mt-2 h-10 w-full rounded-2xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
              </article>
            ))}
          </PostSection>

          <PostSection
            title="我的顺路送"
            subtitle="My carry posts"
            empty="暂无顺路送发布 / No carry posts yet."
          >
            {carriers.map((item) => (
              <article key={item.id} className="my-card">
                <span className="pill">Carry / 顺路送</span>
                <h2 className="mt-4 text-xl font-black text-white">{item.travelRoute}</h2>
                <p className="mt-2 text-sm text-slate-400">Space / 空间: {item.availableLuggageSpace}</p>
                <p className="mt-2 text-sm text-slate-400">Reward / 报酬: {item.expectedReward}</p>
                <label className="mt-4 block">
                  <span className="whitespace-pre-line text-sm font-semibold text-slate-100">旅行日期{"\n"}Travel date</span>
                  <input
                    type="date"
                    value={item.travelDate || ""}
                    onChange={(event) =>
                      void handleDateChange(item.id, "travelDate", event.target.value)
                    }
                    className="mt-2 h-10 w-full rounded-2xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus:border-[#38bdf8]"
                  />
                </label>
              </article>
            ))}
          </PostSection>
        </>
      )}
    </section>
  );
}

function readProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem("studentCarryProfile");
    return raw ? (JSON.parse(raw) as Profile) : null;
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
    <section className="mt-8">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      {isEmpty ? (
        <div className="mt-4 rounded-[28px] border border-white/10 bg-[#1f2232]/90 p-5 text-slate-400">
          {empty}
        </div>
      ) : (
        <div className="mt-4 grid gap-4">{children}</div>
      )}
    </section>
  );
}
