import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import BackButton from "../components/BackButton";
import { createOrOpenConversation } from "../lib/conversations";
import { itemCategoryLabel } from "../lib/matching";
import { formatPostedTime } from "../utils/time";
import { routeLabel } from "../lib/cities";
import {
  canOpenSubmission,
  isCurrentUserPostOwner,
  isMatchedStatus,
  localizedStatusLabel,
  markConversationForPost,
} from "../lib/orderAccess";
import { deleteSubmission, getSubmissions, updateSubmission } from "../lib/submissions";
import { useLanguage } from "../lib/language";
import type { CarrierSubmission } from "../types";

export default function CarryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [carry, setCarry] = useState<CarrierSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const submissions = await getSubmissions();
      const matched = submissions.find(
        (submission): submission is CarrierSubmission =>
          submission.type === "carrier" && submission.id === id,
      );
      setCarry(matched ?? null);
      setLoading(false);
    }

    void load();
  }, [id]);

  const canOpen = carry ? canOpenSubmission(carry) : false;
  const isMatched = carry ? isMatchedStatus(carry.status) : false;
  const isOwner = carry ? isCurrentUserPostOwner(carry) : false;
  const carryInfoItems = carry
    ? [
        carry.expectedReward ? { label: t("Expected reward", "期望报酬"), value: carry.expectedReward, highlight: true } : null,
        carry.travelDate ? { label: t("Travel date", "旅行日期"), value: carry.travelDate } : null,
        carry.acceptedItemTypes?.length
          ? {
              label: t("Accepted items", "可接受物品"),
              value: carry.acceptedItemTypes.map((item) => itemCategoryLabel(item, language)).join(", "),
            }
          : null,
        carry.availableLuggageSpace ? { label: t("Luggage space", "行李空间"), value: carry.availableLuggageSpace } : null,
      ].filter(Boolean) as Array<{ label: string; value: string; highlight?: boolean }>
    : [];

  async function handleCancelMatch() {
    if (!carry) {
      return;
    }

    await updateSubmission(carry.id, { status: "Open" });
    markConversationForPost(carry.id, "Open");
    setCarry({ ...carry, status: "Open" });
  }

  async function handleDeletePost() {
    if (!carry) {
      return;
    }

    const confirmed = window.confirm(t("Delete this post?", "确定删除这条发布吗？"));
    if (!confirmed) {
      return;
    }

    await deleteSubmission(carry.id);
    navigate("/my");
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-20 sm:pt-8">
      <BackButton fallback="/market" />
      <div className="relative rounded-[22px] border border-white/10 bg-[#1f2232]/90 p-3.5 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("Carry listing", "顺路送发布")}</p>
        {loading ? (
          <p className="mt-5 text-slate-400">{t("Loading...", "加载中...")}</p>
        ) : carry && !canOpen ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
            <h1 className="text-2xl font-black text-white">{t("Matched", "已匹配")}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t("This order can only be viewed by the two transaction parties.", "该订单仅交易双方可查看。")}
            </p>
          </div>
        ) : carry ? (
          <>
            {isOwner && !isMatched ? (
              <div className="absolute right-5 top-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/carry-earn?edit=${carry.id}`)}
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
            <h1 className="mt-2 pr-28 text-xl font-black leading-tight text-white sm:text-2xl">{carry.travelRoute ? routeLabel(carry.travelRoute, language) : t("Route pending", "路线待定")}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-300">
              <span className="text-sky-200">{carry.expectedReward || t("Reward pending", "报酬待定")}</span>
              <span className="text-slate-600">·</span>
              <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">
                {localizedStatusLabel(carry.status, language)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{formatPostedTime(carry.createdAt, language)}</span>
            </div>
            {isOwner && isMatched ? (
              <p className="mt-4 rounded-2xl bg-white/[0.06] px-3 py-2 text-xs font-bold leading-5 text-slate-300">
                {t("You can edit again after canceling the match.", "取消匹配后可重新编辑")}
              </p>
            ) : null}
            {carryInfoItems.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {carryInfoItems.map((item) => (
                  <InfoCard key={item.label} label={item.label} value={item.value} highlight={item.highlight} />
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {carry.complianceConfirmation ? (
                <Tag>{t("✓ Customs and airline rules confirmed", "✓ 已确认海关与航空规定")}</Tag>
              ) : null}
            </div>
            {carry.notes ? (
              <section className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-3">
                <p className="text-xs font-bold text-slate-500">{t("Notes", "备注")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{carry.notes}</p>
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
          <p className="mt-5 text-slate-400">{t("This carry post could not be found.", "未找到该顺路送发布。")}</p>
        )}
      </div>

      <ContactNowButton
        hidden={Boolean(carry && isOwner)}
        disabled={!carry || !canOpen}
        label={isMatched ? t("Open Chat", "打开聊天") : t("Start Chat", "开始沟通")}
        onContact={() => {
          if (!carry) {
            return;
          }

          const conversation = createOrOpenConversation({
            postType: "carry",
            postId: carry.id,
            postOwnerId: carry.ownerId || carry.ownerNickname || carry.name,
            otherUserName: carry.ownerNickname || carry.name || t("User", "用户"),
            item: carry.availableLuggageSpace || t("Carry space", "可用空间"),
            route: carry.travelRoute ? routeLabel(carry.travelRoute, language) : t("Route pending", "路线待定"),
            reward: carry.expectedReward || t("Reward pending", "报酬待定"),
            status: carry.status || "Open",
          });
          navigate(`/messages/${conversation.id}`);
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
