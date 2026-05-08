import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import Notice from "../components/Notice";
import { isFirebaseConfigured } from "../lib/firebase";
import { useLanguage } from "../lib/language";
import { getSubmissions, updateSubmissionPublishedDate } from "../lib/submissions";
import type { Submission } from "../types";

function formatDate(date?: Date) {
  if (!date) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function submissionSummary(submission: Submission) {
  if (submission.type === "request") {
    return {
      title: submission.itemName,
      route: `${submission.fromLocation} → ${submission.toLocation}`,
      amount: `Budget €${submission.budgetEur}`,
      date: submission.desiredDeliveryDate,
    };
  }

  return {
    title: submission.travelRoute,
    route: submission.availableLuggageSpace,
    amount: submission.expectedReward,
    date: submission.travelDate,
  };
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const grouped = useMemo(
    () => ({
      requests: submissions.filter((submission) => submission.type === "request"),
      carriers: submissions.filter((submission) => submission.type === "carrier"),
    }),
    [submissions],
  );

  useEffect(() => {
    async function load() {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        setSubmissions(await getSubmissions());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard submissions.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function handlePublishedDateChange(id: string, publishedDate: string) {
    setUpdatingId(id);
    setError("");

    try {
      await updateSubmissionPublishedDate(id, publishedDate);
      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === id ? { ...submission, publishedDate } : submission,
        ),
      );
    } catch (dateError) {
      setError(
        dateError instanceof Error
          ? dateError.message
          : "Unable to update published date.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function renderSubmission(submission: Submission) {
    const summary = submissionSummary(submission);

    return (
      <article key={submission.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {submission.type === "request" ? "Request" : "Carrier"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{summary.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{summary.route}</p>
          </div>
          <label className="block min-w-52">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9a6b00]">
              {t("Published Date", "发布日期")}
            </span>
            <input
            type="date"
            value={submission.publishedDate || ""}
            disabled={updatingId === submission.id}
            onChange={(event) =>
              void handlePublishedDateChange(
                submission.id,
                event.target.value,
              )
            }
            className="mt-2 min-h-10 w-full rounded-md border border-amber-300 bg-white px-3 text-sm font-medium outline-none focus:border-campus focus:ring-4 focus:ring-campus/20"
            />
          </label>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">{t("Name", "姓名")}</dt>
            <dd className="mt-1 font-medium">{submission.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("Contact", "联系方式")}</dt>
            <dd className="mt-1 font-medium break-words">{submission.contact}</dd>
          </div>
            <div>
              <dt className="text-slate-500">{t("Date", "日期")}</dt>
              <dd className="mt-1 font-medium">{summary.date}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("Published Date", "发布日期")}</dt>
              <dd className="mt-1 font-medium">{submission.publishedDate || t("Not set", "未设置")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("Reward / Budget", "报酬 / 预算")}</dt>
              <dd className="mt-1 font-medium">{summary.amount}</dd>
            </div>
          </dl>

        {submission.type === "request" && (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">{t("Estimated value", "预估价值")}</dt>
              <dd className="mt-1 font-medium">€{submission.estimatedValueEur}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("China domestic shipping", "中国国内邮寄")}</dt>
              <dd className="mt-1 font-medium">{submission.chinaDomesticShipping || t("Not sure", "不确定")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("Compliance confirmation", "合规确认")}</dt>
              <dd className="mt-1 font-medium">
                {submission.confirmation ? t("Confirmed", "已确认") : t("Missing", "缺失")}
              </dd>
            </div>
          </dl>
        )}

        {submission.notes && (
          <p className="mt-4 rounded-md bg-mist p-3 text-sm leading-6 text-slate-700">
            {submission.notes}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          {t("Submitted", "提交于")} {formatDate(submission.createdAt)}
        </p>
      </article>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BackButton fallback="/my" />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#9a6b00]">
            {t("Operations", "运营管理")}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{t("Admin order dashboard", "管理员订单看板")}</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {t("Review submitted requests and carrier profiles, then maintain the Published Date for each listing.", "查看已提交的需求和顺路送资料，并维护每条发布的发布日期。")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <p className="text-2xl font-bold">{grouped.requests.length}</p>
            <p className="text-xs font-medium text-slate-500">{t("Requests", "需求")}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <p className="text-2xl font-bold">{grouped.carriers.length}</p>
            <p className="text-xs font-medium text-slate-500">{t("Carriers", "顺路送")}</p>
          </div>
        </div>
      </div>

      {!isFirebaseConfigured && (
        <Notice title={t("Firebase setup needed", "需要配置 Firebase")} tone="warning">
          {t("Add your Firebase Vite environment variables to .env.local before the dashboard can load submissions.", "请先在 .env.local 添加 Firebase Vite 环境变量，看板才能加载提交内容。")}
        </Notice>
      )}

      {error && (
        <div className="mt-6">
          <Notice title={t("Dashboard error", "看板错误")} tone="warning">
            {error}
          </Notice>
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-600 shadow-soft">
          {t("Loading submissions...", "正在加载提交内容...")}
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold">{t("Submitted requests", "已提交需求")}</h2>
            <div className="grid gap-4">
              {grouped.requests.length > 0 ? (
                grouped.requests.map(renderSubmission)
              ) : (
                <EmptyState label={t("No requests submitted yet.", "暂无需求提交。")} />
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">{t("Carrier submissions", "顺路送提交")} </h2>
            <div className="grid gap-4">
              {grouped.carriers.length > 0 ? (
                grouped.carriers.map(renderSubmission)
              ) : (
                <EmptyState label={t("No carriers submitted yet.", "暂无顺路送提交。")} />
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      {label}
    </div>
  );
}
