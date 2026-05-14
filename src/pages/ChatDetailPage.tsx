import { FormEvent, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Copy, ImagePlus, Send, X } from "lucide-react";
import BackButton from "../components/BackButton";
import {
  appendConversationMessage,
  cancelConversationMatch,
  confirmConversationMatch,
  currentUserId,
  getConversation,
  hideConversationMessageForMe,
  markConversationRead,
  recallConversationMessage,
  subscribeConversation,
  subscribeConversationMessages,
  type Conversation,
  type ConversationMessage,
} from "../lib/conversations";
import { readImageAsDataUrl } from "../lib/imageFiles";
import { useLanguage } from "../lib/language";
import { isMatchedStatus } from "../lib/orderAccess";
import { currentOwnerId, isLoggedIn } from "../lib/profile";
import { updateSubmission } from "../lib/submissions";
import { getCloudbaseUid } from "../utils/cloudbase";

function mergeMessages(current: ConversationMessage[], incoming: ConversationMessage[]) {
  if (incoming.length === 0 && current.length > 0) {
    return current;
  }

  const byId = new Map<string, ConversationMessage>();
  [...current, ...incoming].forEach((message, index) => {
    const id = message.id || `message-${index}`;
    byId.set(id, { ...byId.get(id), ...message, id });
  });

  return Array.from(byId.values()).sort((first, second) => (first.createdAt || 0) - (second.createdAt || 0));
}

export default function ChatDetailPage() {
  const { conversationId } = useParams();
  const { t } = useLanguage();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [sendError, setSendError] = useState("");
  const [activeActionMessageId, setActiveActionMessageId] = useState<string | null>(null);
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [sessionUid, setSessionUid] = useState(currentOwnerId());
  const [matchActionPending, setMatchActionPending] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    if (!isLoggedIn()) {
      setLoading(false);
      setConversation(null);
      return;
    }

    const id = conversationId;
    let unsubscribeMessages: (() => void) | undefined;
    let unsubscribeConversation: (() => void) | undefined;
    let cancelled = false;

    async function loadConversation() {
      setLoading(true);
      setSyncError("");
      try {
        await markConversationRead(id);
        const viewerId = (await getCloudbaseUid()) || currentOwnerId();
        setSessionUid(viewerId);
        const nextConversation = await getConversation(id);
        if (cancelled) {
          return;
        }

        setConversation(nextConversation);
        unsubscribeConversation = await subscribeConversation(id, {
          onConversation: (next) => {
            if (!next) return;
            setConversation((current) => ({
              ...next,
              messages: current?.messages?.length ? current.messages : next.messages,
            }));
          },
          onError: (message) => setSyncError(message),
        });
        unsubscribeMessages = await subscribeConversationMessages(id, {
          onMessages: (messages) => {
            setConversation((current) => {
              if (!current) return current;
              return { ...current, messages: mergeMessages(current.messages, messages) };
            });
            if (
              messages.some(
                (message) =>
                  message.senderId !== viewerId &&
                  !message.readByUserIds?.includes(viewerId),
              )
            ) {
              void markConversationRead(id);
            }
          },
          onError: (message) => setSyncError(message),
        });
      } catch (error) {
        console.error("Chat sync setup failed.", error);
        setSyncError(t("Message sync is temporarily delayed.", "消息同步暂时延迟。"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConversation();

    return () => {
      cancelled = true;
      unsubscribeMessages?.();
      unsubscribeConversation?.();
    };
  }, [conversationId, t]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text && !pendingImage) {
      return;
    }

    if (conversation) {
      setSendError("");
      try {
        const nextConversation = await appendConversationMessage(conversation.id, text || undefined, pendingImage || undefined);
        setConversation(nextConversation);
      } catch (error) {
        console.error("Send message failed.", error);
        const message = error instanceof Error ? error.message : String(error);
        setSendError(t("Message was not sent. Please try again.", "消息未发送，请重试。") + ` ${message}`);
        return;
      }
    }
    setDraft("");
    setPendingImage("");
  }

  if (loading) {
    return null;
  }

  if (!isLoggedIn()) {
    return <Navigate to="/my" replace />;
  }

  if (!conversation && syncError) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-132px)] max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <BackButton fallback="/messages" />
        <div className="mt-4 rounded-[22px] border border-red-300/25 bg-red-500/10 p-4 text-sm font-semibold leading-6 text-red-100">
          {syncError}
        </div>
      </section>
    );
  }

  if (!conversation) {
    return <Navigate to="/messages" replace />;
  }

  const isMatched = isMatchedStatus(conversation.status);
  const sideId = sessionUid || currentOwnerId();
  const canViewConversation =
    !isMatched ||
    !conversation.postOwnerId ||
    !conversation.starterUserId ||
    conversation.postOwnerId === sideId ||
    conversation.starterUserId === sideId;
  const hasConfirmed = conversation.matchConfirmations?.includes(sideId);
  const otherConfirmed = Boolean(conversation.matchConfirmations?.some((id) => id !== sideId));
  const matchStatus = isMatched ? "MATCHED" : conversation.matchConfirmations?.length ? "PENDING" : "OPEN";
  const actionLabel = otherConfirmed ? t("Accept Match", "接受匹配") : t("Request Match", "请求匹配");
  const otherContact = sideId === conversation.postOwnerId ? conversation.starterContact : conversation.postOwnerContact;

  if (!canViewConversation) {
    return <Navigate to="/messages" replace />;
  }

  function openMessageActions(messageId?: string) {
    if (messageId) {
      setActiveActionMessageId((current) => (current === messageId ? null : messageId));
    }
  }

  function startLongPress(messageId?: string) {
    if (!messageId) return;
    const timer = window.setTimeout(() => openMessageActions(messageId), 520);
    setPressTimer(timer);
  }

  function clearLongPress() {
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  function canRecall(message: ConversationMessage) {
    return (
      (message.senderId === sideId || message.senderId === currentUserId) &&
      !message.recalled &&
      Boolean(message.createdAt) &&
      Date.now() - (message.createdAt || 0) <= 120_000
    );
  }

  function handleRecall(message: ConversationMessage) {
    if (!message.id || !conversation) return;
    void recallConversationMessage(conversation.id, message.id).then(setConversation);
    setActiveActionMessageId(null);
  }

  function handleLocalDelete(message: ConversationMessage) {
    if (!message.id || !conversation) return;
    void hideConversationMessageForMe(conversation.id, message.id).then(setConversation);
    setActiveActionMessageId(null);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-132px)] max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-6">
      <BackButton fallback="/messages" />
      <div className={`sticky top-0 z-10 rounded-[22px] border border-sky-300/20 bg-[#1f2232]/95 p-2.5 shadow-xl backdrop-blur ${isMatched ? "opacity-80" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-400">Match Info</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-300">{conversation.route}</p>
          </div>
          <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[0.68rem] font-black text-sky-100">
            {matchStatus}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[0.68rem] text-slate-300 sm:grid-cols-3">
          <span className="rounded-xl bg-white/[0.06] px-2 py-1">{t("Item info / weight", "物品信息 / 重量")}: {conversation.item}</span>
          <span className="rounded-xl bg-white/[0.06] px-2 py-1">{t("Reward", "报酬")}: {conversation.reward}</span>
          <span className="rounded-xl bg-white/[0.06] px-2 py-1">{t("Status", "状态")}: {matchStatus}</span>
        </div>
        {!isMatched ? (
          <>
            {otherConfirmed && !hasConfirmed ? (
              <p className="mt-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200">
                {t("The other user wants to match with you.", "对方希望与你匹配")}
              </p>
            ) : null}
            <button
              type="button"
              disabled={hasConfirmed || matchActionPending}
              onClick={async () => {
                if (matchActionPending) return;
                setMatchActionPending(true);
                try {
                  const result = await confirmConversationMatch(conversation.id, sideId);
                  setConversation(result.conversation);
                  if (result.matched) {
                    void updateSubmission(conversation.postId, { status: "Matched", matchedAt: Date.now() } as never);
                  }
                } finally {
                  setMatchActionPending(false);
                }
              }}
              className="pressable mt-2 w-full rounded-lg bg-[#38bdf8] px-3 py-1.5 text-xs font-black text-white disabled:bg-white/10 disabled:text-slate-400"
            >
              {hasConfirmed ? t("Waiting for confirmation", "等待确认") : actionLabel}
            </button>
            <p className="mt-1 text-center text-[0.68rem] font-semibold text-slate-400">
              {t("Contact details will be exchanged after acceptance.", "同意后将自动交换联系方式")}
            </p>
          </>
        ) : (
          <div className="mt-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs text-slate-200">
            <p className="font-black text-sky-100">✓ {t("Contact details exchanged", "联系方式已交换")}</p>
            <div className="mt-2 grid gap-1.5">
              <ContactLine label="WeChat" value={otherContact?.shareWechat ? otherContact.wechatId : ""} empty={t("Not shared", "未共享")} />
              <ContactLine label={t("Phone", "手机号")} value={otherContact?.sharePhone ? otherContact.phoneNumber : ""} empty={t("Not shared", "未共享")} />
            </div>
          </div>
        )}
        {matchStatus === "PENDING" || matchStatus === "MATCHED" ? (
          <button
            type="button"
            disabled={matchActionPending}
            onClick={async () => {
              if (matchActionPending) return;
              setMatchActionPending(true);
              try {
                const next = await cancelConversationMatch(conversation.id);
                setConversation(next);
                void updateSubmission(conversation.postId, { status: "Open", matchedAt: null } as never);
              } finally {
                setMatchActionPending(false);
              }
            }}
            className="pressable mt-1.5 w-full rounded-lg border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-100 disabled:opacity-50"
          >
            {t("Cancel Match", "取消匹配")}
          </button>
        ) : null}
        {syncError ? (
          <p className="mt-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
            {syncError}
          </p>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 pb-36 pt-4">
        {conversation.messages
          .filter((message) => !message.hiddenForUserIds?.includes(sideId))
          .map((message) => {
          const isMe = message.senderId === sideId || message.senderId === currentUserId;
          if (message.recalled) {
            return (
              <p key={message.id} className="text-center text-xs font-semibold text-slate-500">
                {isMe ? t("You recalled a message", "你撤回了一条消息") : t("Message recalled", "对方撤回了一条消息")}
              </p>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-300/15 text-[0.68rem] font-black text-sky-100 ring-1 ring-sky-300/25">
                  {conversation.otherUserName.charAt(0)}
                </div>
              ) : null}
              <div
                onPointerDown={() => {
                  startLongPress(message.id);
                }}
                onPointerUp={clearLongPress}
                onPointerCancel={clearLongPress}
                onPointerLeave={clearLongPress}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openMessageActions(message.id);
                }}
                className={`group relative max-w-[78%] rounded-[18px] px-3 py-2 text-xs leading-5 shadow-lg ${
                  isMe
                    ? "bg-[#38bdf8] text-white"
                    : "border border-white/10 bg-[#1f2232]/95 text-slate-100"
                }`}
              >
                {message.text ? <p className="mt-1">{message.text}</p> : null}
                {message.imageDataUrl ? (
                  <img
                    src={message.imageDataUrl}
                    alt="Chat attachment"
                    className="mt-2 max-h-64 w-full rounded-2xl object-cover"
                  />
                ) : null}
                {activeActionMessageId === message.id ? (
                  <div className={`absolute top-full z-20 mt-2 flex gap-2 ${isMe ? "right-0" : "left-0"}`}>
                    {canRecall(message) ? (
                      <button
                        type="button"
                        onClick={() => handleRecall(message)}
                        className="rounded-full bg-[#050918]/95 px-3 py-1.5 text-[0.7rem] font-black text-sky-100 ring-1 ring-sky-300/20"
                      >
                        {t("Recall", "撤回")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleLocalDelete(message)}
                      className="rounded-full bg-[#050918]/95 px-3 py-1.5 text-[0.7rem] font-black text-slate-200 ring-1 ring-white/10"
                    >
                      {t("Delete", "删除")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-3xl rounded-[20px] border border-white/10 bg-[#1f2232]/95 p-2 shadow-xl backdrop-blur sm:bottom-6"
      >
        {pendingImage ? (
          <div className="mb-2 flex items-start gap-2 rounded-[16px] border border-white/10 bg-white/[0.06] p-2">
            <img src={pendingImage} alt="Selected preview" className="h-16 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white">{t("Image preview", "图片预览")}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {t("It will be sent only after you tap send.", "点击发送后才会发出。")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingImage("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200"
              aria-label="Remove selected image"
            >
              <X size={15} />
            </button>
          </div>
        ) : null}
        {sendError ? (
          <p className="mb-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
            {sendError}
          </p>
        ) : null}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("Type a message...", "输入消息...")}
            className="min-w-0 flex-1 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
          />
          <label className="pressable flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.06] text-sky-100">
            <ImagePlus size={18} />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setPendingImage(await readImageAsDataUrl(file));
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="submit"
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#38bdf8] text-white"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}

function ContactLine({ label, value, empty }: { label: string; value?: string; empty: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.05] px-2 py-1.5">
      <span className="font-semibold text-slate-400">{label}</span>
      <span className="flex min-w-0 items-center gap-1 font-black text-white">
        <span className="truncate">{value || empty}</span>
        {value ? (
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(value)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sky-100"
            aria-label={`Copy ${label}`}
          >
            <Copy size={12} />
          </button>
        ) : null}
      </span>
    </div>
  );
}
