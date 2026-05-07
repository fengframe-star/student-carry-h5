import { FormEvent, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import BackButton from "../components/BackButton";
import {
  appendConversationMessage,
  getConversation,
  markConversationRead,
  updateConversationStatus,
  type Conversation,
} from "../lib/conversations";
import { useLanguage } from "../lib/language";
import { isCompletedStatus, isMatchedStatus, publicStatusLabel } from "../lib/orderAccess";
import { updateSubmission } from "../lib/submissions";

export default function ChatDetailPage() {
  const { conversationId } = useParams();
  const { t } = useLanguage();
  const [conversation, setConversation] = useState<Conversation | null>(() =>
    conversationId ? getConversation(conversationId) : null,
  );
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    markConversationRead(conversationId);
    setConversation(getConversation(conversationId));
  }, [conversationId]);

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    if (conversation) {
      setConversation(appendConversationMessage(conversation.id, text));
    }
    setDraft("");
  }

  if (!conversation) {
    return <Navigate to="/messages" replace />;
  }

  const isMatched = isMatchedStatus(conversation.status);
  const isCompleted = isCompletedStatus(conversation.status);
  const actionLabel =
    conversation.postType === "request"
      ? t("Accept Request", "接单")
      : t("Confirm Match", "同意合作");

  return (
    <section className="mx-auto flex min-h-[calc(100vh-132px)] max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <BackButton fallback="/messages" />
      <div className="sticky top-0 z-10 rounded-[28px] border border-sky-300/20 bg-[#1f2232]/95 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400">{t("Transaction", "交易")}</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">{conversation.route}</p>
          </div>
          <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-black text-sky-100">
            {publicStatusLabel(conversation.status)}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
          <span className="rounded-2xl bg-white/[0.06] px-3 py-1.5">{t("Item", "物品")}: {conversation.item}</span>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-1.5">{t("Reward", "报酬")}: {conversation.reward}</span>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-1.5">{t("Location", "地点")}: TBD</span>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-1.5">{t("Time", "时间")}: TBD</span>
        </div>
        <button
          type="button"
          disabled={isMatched || isCompleted}
          onClick={() => {
            setConversation(updateConversationStatus(conversation.id, "Matched"));
            void updateSubmission(conversation.postId, { status: "Matched" });
          }}
          className="pressable mt-2 w-full rounded-xl bg-[#38bdf8] px-4 py-2 text-sm font-black text-white disabled:bg-white/10 disabled:text-slate-400"
        >
          {isCompleted ? t("Completed", "已完成") : isMatched ? t("Matched", "已匹配") : actionLabel}
        </button>
        {isMatched && !isCompleted ? (
          <button
            type="button"
            onClick={() => {
              setConversation(updateConversationStatus(conversation.id, "Completed"));
              void updateSubmission(conversation.postId, { status: "Completed" });
            }}
            className="pressable mt-2 w-full rounded-xl bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-100 ring-1 ring-emerald-300/20"
          >
            完成交易 / Complete Transaction
          </button>
        ) : null}
        {isMatched && !isCompleted ? (
          <button
            type="button"
            onClick={() => {
              setConversation(updateConversationStatus(conversation.id, "Negotiating"));
              void updateSubmission(conversation.postId, { status: "Open" });
            }}
            className="pressable mt-2 w-full rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-black text-red-100"
          >
            取消匹配 / Cancel Match
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 pb-28 pt-6">
        {conversation.messages.map((message, index) => {
          const isMe = message.author === "Me";

          return (
            <div
              key={`${message.author}-${index}`}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-300/15 text-xs font-black text-sky-100 ring-1 ring-sky-300/25">
                  {conversation.otherUserName.charAt(0)}
                </div>
              ) : null}
              <div
                className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-xl ${
                  isMe
                    ? "bg-[#38bdf8] text-white"
                    : "border border-white/10 bg-[#1f2232]/95 text-slate-100"
                }`}
              >
                <p className="text-xs font-black opacity-75">{message.author}</p>
                <p className="mt-1">{message.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-3xl gap-2 rounded-[24px] border border-white/10 bg-[#1f2232]/95 p-2 shadow-2xl backdrop-blur sm:bottom-6"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
        />
        <button
          type="submit"
          className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#38bdf8] text-white"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
