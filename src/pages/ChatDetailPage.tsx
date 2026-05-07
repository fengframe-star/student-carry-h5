import { FormEvent, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import BackButton from "../components/BackButton";
import {
  appendConversationMessage,
  getConversation,
  markConversationRead,
  type Conversation,
} from "../lib/conversations";

export default function ChatDetailPage() {
  const { conversationId } = useParams();
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

  return (
    <section className="mx-auto flex min-h-[calc(100vh-132px)] max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <BackButton fallback="/messages" />
      <div className="sticky top-0 z-10 rounded-[28px] border border-sky-300/20 bg-[#1f2232]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400">Transaction</p>
            <h1 className="mt-1 text-xl font-black text-white">{conversation.item}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">{conversation.route}</p>
          </div>
          <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-black text-sky-100">
            {conversation.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-4">
          <span className="rounded-2xl bg-white/[0.06] px-3 py-2">Item: {conversation.item}</span>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-2">Reward: {conversation.reward}</span>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-2">Location: TBD</span>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-2">Time: TBD</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 py-6">
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
        className="sticky bottom-20 flex gap-2 rounded-[24px] border border-white/10 bg-[#1f2232]/95 p-2 shadow-2xl backdrop-blur sm:bottom-4"
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
