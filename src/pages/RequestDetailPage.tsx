import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import BackButton from "../components/BackButton";
import { createOrOpenConversation, getConversations } from "../lib/conversations";
import { itemCategoryLabel } from "../lib/matching";
import { formatPostedTime } from "../utils/time";
import { cityLabel } from "../lib/cities";
import {
  canOpenSubmission,
  isCurrentUserPostOwner,
  isMatchedStatus,
  localizedStatusLabel,
  markConversationForPost,
} from "../lib/orderAccess";
import { deleteSubmission, getSubmissions, updateSubmission } from "../lib/submissions";
import { useLanguage } from "../lib/language";
import { isLoggedIn, readStoredProfile } from "../lib/profile";
import { isProfileComplete } from "../lib/auth";
import type { RequestSubmission } from "../types";

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [request, setRequest] = useState<RequestSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const submissions = await getSubmissions();
      if (isLoggedIn()) {
        await getConversations().catch((error) => console.warn("Unable to warm conversation cache.", error));
      }
      const matched = submissions.find(
        (submission): submission is RequestSubmission =>
          submission.type === "request" && submission.id === id,
      );
      setRequest(matched ?? null);
      setLoading(false);
    }

    void load();
  }, [id]);

  const canOpen = request ? canOpenSubmission(request) : false;
  const isMatched = request ? isMatchedStatus(request.status) : false;
  const isOwner = request ? isCurrentUserPostOwner(request) : false;
  const requestInfoItems = request
    ? [
        request.budgetEur ? { label: t("Budget", "预算"), value: `€${request.budgetEur}`, highlight: true } : null,
        request.desiredDeliveryDate ? { label: t("Expected delivery", "期望送达"), value: request.desiredDeliveryDate } : null,
        request.itemCategory ? { label: t("Category", "分类"), value: itemCategoryLabel(request.itemCategory, language) } : null,
        request.estimatedValueEur ? { label: t("Estimated value", "预估价值"), value: `€${request.estimatedValueEur}` } : null,
      ].filter(Boolean) as Array<{ label: string; value: string; highlight?: boolean }>
    : [];

  async function handleCancelMatch() {
    if (!request) {
      return;
    }

    await updateSubmission(request.id, { status: "Open" });
    await markConversationForPost(request.id, "Open");
    setRequest({ ...request, status: "Open" });
  }

  async function handleDeletePost() {
    if (!request) {
      return;
    }

    const confirmed = window.confirm(t("Delete this post?", "确定删除这条发布吗？"));
    if (!confirmed) {
      return;
    }

    await deleteSubmission(request.id);
    navigate("/my");
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-20 sm:pt-8">
      <BackButton fallback="/market" />
      <div className="relative rounded-[22px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("Request listing", "帮我带发布")}</p>
        {loading ? (
          <p className="mt-5 text-slate-400">{t("Loading...", "加载中...")}</p>
        ) : request && !canOpen ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
            <h1 className="text-2xl font-black text-white">{t("Matched", "已匹配")}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t("This order can only be viewed by the two transaction parties.", "该订单仅交易双方可查看。")}
            </p>
          </div>
        ) : request ? (
          <>
            {isOwner && !isMatched ? (
              <div className="absolute right-5 top-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/post-request?edit=${request.id}`)}
                  className="pressable rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs font-black text-sky-100"
                >
                  {t("Edit", "编辑")}
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="pressable rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-black text-slate-300"
                >
                  {t("Delete", "删除")}
                </button>
              </div>
            ) : null}
            <h1 className="mt-2 pr-28 text-xl font-black leading-tight text-white sm:text-2xl">{request.itemName || t("Item", "物品")}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-300">
              <span className="text-sky-200">
                {routeText(request.fromLocation, request.toLocation, language)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
                {localizedStatusLabel(request.status, language)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{formatPostedTime(request.createdAt, language)}</span>
            </div>
            {isOwner && isMatched ? (
              <p className="mt-4 rounded-2xl bg-white/[0.06] px-3 py-2 text-xs font-bold leading-5 text-slate-300">
                {t("You can edit again after canceling the match.", "取消匹配后可重新编辑")}
              </p>
            ) : null}
            {request.itemPhotoDataUrl ? (
              <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
                <img
                  src={request.itemPhotoDataUrl}
                  alt="Item preview"
                  className="h-64 w-full object-cover"
                />
                <p className="px-4 py-3 text-xs font-semibold text-slate-400">
                  {t("Item photo", "物品照片")}
                </p>
              </div>
            ) : null}
            {requestInfoItems.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {requestInfoItems.map((item) => (
                  <InfoCard key={item.label} label={item.label} value={item.value} highlight={item.highlight} />
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {request.chinaDomesticShipping?.startsWith("Yes") ? (
                <Tag>{t("✓ Domestic forwarding available", "✓ 支持国内转寄")}</Tag>
              ) : null}
              {request.complianceConfirmation ? (
                <Tag>{t("✓ Customs and airline rules confirmed", "✓ 已确认海关与航空规定")}</Tag>
              ) : null}
            </div>
            {request.notes ? (
              <section className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-3">
                <p className="text-xs font-bold text-slate-500">{t("Notes", "备注")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{request.notes}</p>
              </section>
            ) : null}
            {isMatched ? (
              <button
                type="button"
                onClick={handleCancelMatch}
                className="pressable mt-3 w-full rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100"
              >
                {t("Cancel Match", "取消匹配")}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-5 text-slate-400">{t("This request could not be found.", "未找到该需求。")}</p>
        )}
      </div>

      <ContactNowButton
        hidden={Boolean(request && isOwner)}
        disabled={!request || !canOpen}
        label={isMatched ? t("Open Chat", "打开聊天") : t("Start Chat", "开始沟通")}
        onContact={async () => {
          if (!request) {
            return;
          }
          if (!isLoggedIn() || !isProfileComplete(readStoredProfile())) {
            navigate("/my");
            return;
          }

          try {
            const conversation = await createOrOpenConversation({
              postType: "request",
              postId: request.id,
              postOwnerId: request.ownerId,
              otherUserName: request.ownerNickname || request.name || t("User", "用户"),
              item: request.itemName || t("Item", "物品"),
              route: routeText(request.fromLocation, request.toLocation, language) || t("Route pending", "路线待定"),
              reward: `€${request.budgetEur || 0}`,
              status: request.status || "Open",
            });
            navigate(`/messages/${conversation.id}`);
          } catch (error) {
            console.error("Create conversation failed.", error);
            window.alert(t("Unable to start chat. Please check CloudBase permissions and try again.", "无法开始沟通，请检查 CloudBase 权限后重试。"));
          }
        }}
      />
    </section>
  );
}

function InfoCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-[14px] border border-white/10 px-2.5 py-2 ${highlight ? "bg-sky-400/10" : "bg-white/[0.045]"}`}>
      <p className="text-[0.68rem] font-bold text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xs font-black leading-4 ${highlight ? "text-sky-100" : "text-white"}`}>{value}</p>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-[0.68rem] font-bold text-slate-200">
      {children}
    </span>
  );
}

function routeText(from: string | undefined, to: string | undefined, language: "en" | "zh") {
  return [from ? cityLabel(from, language) : "", to ? cityLabel(to, language) : ""].filter(Boolean).join(" → ");
}

function ContactNowButton({
  hidden,
  disabled,
  label,
  onContact,
}: {
  hidden?: boolean;
  disabled: boolean;
  label: string;
  onContact: () => void;
}) {
  if (hidden) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050918]/85 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur sm:pb-5">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          disabled={disabled}
          onClick={onContact}
          className="pressable flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-3 text-xs font-black text-white shadow-xl shadow-sky-950/40 disabled:opacity-50"
        >
          <MessageCircle size={18} />
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}
