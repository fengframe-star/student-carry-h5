import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubmissions, updateSubmissionDate } from "../lib/submissions";
import type { Submission } from "../types";

export default function MyPage() {
  const [loggedIn, setLoggedIn] = useState(
    () => window.localStorage.getItem("studentCarryLoggedIn") === "true",
  );
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  async function loadPosts() {
    setSubmissions(await getSubmissions());
  }

  useEffect(() => {
    if (loggedIn) {
      void loadPosts();
    }
  }, [loggedIn]);

  function loginDemo() {
    window.localStorage.setItem("studentCarryLoggedIn", "true");
    setLoggedIn(true);
  }

  function logout() {
    window.localStorage.removeItem("studentCarryLoggedIn");
    setLoggedIn(false);
    setSubmissions([]);
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
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl">
        <p className="text-sm font-bold text-slate-300">
          <span className="block">我的</span>
          <span className="mt-1 block text-slate-400">My account</span>
        </p>
        <h1 className="mt-4 text-5xl font-black text-white">我的</h1>
        <p className="mt-4 leading-7 text-slate-300">
          <span className="block">注册、登录，并管理你发布的帮我带和顺路送。</span>
          <span className="block text-slate-400">Register, log in, and manage your own request or carry posts.</span>
        </p>
      </div>

      {!loggedIn ? (
        <>
          <div className="mt-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register"
                className="flex min-h-14 items-center justify-center rounded-2xl bg-[#38bdf8] px-3 text-center text-sm font-black text-white"
              >
                注册 / Register
              </Link>
              <button
                type="button"
                onClick={loginDemo}
                className="min-h-14 rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-black text-white"
              >
                Log in / 登录
              </button>
            </div>

            <h2 className="mt-8 text-xl font-black text-white">登录方式</h2>
            <p className="mt-1 text-sm text-slate-400">Login methods</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {["邮箱登录\nEmail", "Google 登录\nGoogle", "微信登录\nWeChat", "Apple ID 登录\nApple ID", "支付宝登录\nAlipay"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={loginDemo}
                  className="min-h-20 whitespace-pre-line rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-bold leading-5 text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-sky-400/25 bg-sky-400/10 p-5 text-sm leading-7 text-sky-50">
            <span className="block">当前是 MVP 演示登录。正式版本需要接入真实账号系统和权限控制。</span>
            <span className="block text-sky-100/80">This is MVP demo login. Production needs real authentication and access control.</span>
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black text-white">已登录</p>
                <p className="mt-1 text-sm text-slate-400">Logged in</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white"
              >
                退出 / Log out
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
