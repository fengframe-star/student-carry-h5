import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import BackButton from "../components/BackButton";
import { createOrOpenConversation } from "../lib/conversations";
import { reputationFor } from "../lib/matching";
import {
  canOpenSubmission,
  isCompletedStatus,
  isMatchedStatus,
  markConversationForPost,
  publicStatusLabel,
} from "../lib/orderAccess";
import { getSubmissions, updateSubmission } from "../lib/submissions";
import type { CarrierSubmission } from "../types";

export default function CarryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const isCompleted = carry ? isCompletedStatus(carry.status) : false;

  async function handleCancelMatch() {
    if (!carry) {
      return;
    }

    await updateSubmission(carry.id, { status: "Open" });
    markConversationForPost(carry.id, "Negotiating");
    setCarry({ ...carry, status: "Open" });
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-32 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
      <BackButton fallback="/market" />
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl">
        <p className="text-sm font-bold text-slate-300">顺路送 / Carry detail</p>
        {loading ? (
          <p className="mt-5 text-slate-400">Loading...</p>
        ) : carry && !canOpen ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
            <h1 className="text-2xl font-black text-white">已匹配 / Matched</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This order can only be viewed by the two transaction parties.
            </p>
          </div>
        ) : carry ? (
          <>
            <h1 className="mt-4 text-4xl font-black text-white">{carry.travelRoute || "Route pending"}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-lg font-black text-sky-200">
                {carry.availableLuggageSpace || "Available luggage space"}
              </p>
              <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-black text-sky-100">
                {publicStatusLabel(carry.status)}
              </span>
            </div>
            <p className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-slate-300">
              Completed: {reputationFor(1).completed} · {reputationFor(1).active} · {reputationFor(1).responseSpeed}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailLine label="Poster" value={carry.ownerNickname || carry.name || "Student Carry User"} />
              <DetailLine label="Contact" value={carry.contact || "Platform messaging"} />
              <DetailLine label="Travel date" value={carry.travelDate || "TBD"} />
              <DetailLine label="Expected reward" value={carry.expectedReward || "Reward pending"} />
              <DetailLine label="Status" value={publicStatusLabel(carry.status)} />
              <DetailLine label="Published" value={carry.publishedDate || "TBD"} />
              <DetailLine label="Accepted item types" value={carry.acceptedItemTypes?.join(", ") || "Flexible"} />
              <DetailLine label="Compliance confirmed" value={carry.complianceConfirmation ? "Yes" : "Pending"} />
            </div>
            {carry.notes ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-slate-500">Notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{carry.notes}</p>
              </div>
            ) : null}
            {isMatched && !isCompleted ? (
              <button
                type="button"
                onClick={handleCancelMatch}
                className="pressable mt-5 w-full rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-100"
              >
                取消匹配 / Cancel Match
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-5 text-slate-400">This carry post could not be found.</p>
        )}
      </div>

      <ContactNowButton
        disabled={!carry || !canOpen || isCompleted}
        label={isMatched ? "打开聊天 / Open Chat" : "立即联系 / Contact Now"}
        onContact={() => {
          if (!carry) {
            return;
          }

          const nextStatus = isMatched ? "Matched" : "Negotiating";
          const conversation = createOrOpenConversation({
            postType: "carry",
            postId: carry.id,
            otherUserName: carry.name || "Post owner",
            item: carry.availableLuggageSpace || "Carry space",
            route: carry.travelRoute || "Route pending",
            reward: carry.expectedReward || "Reward pending",
            status: nextStatus,
          });
          if (!isMatched) {
            void updateSubmission(carry.id, { status: "Negotiating" });
            setCarry({ ...carry, status: "Negotiating" });
          }
          navigate(`/messages/${conversation.id}`);
        }}
      />
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function ContactNowButton({
  disabled,
  label,
  onContact,
}: {
  disabled: boolean;
  label: string;
  onContact: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050918]/85 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur sm:pb-5">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          disabled={disabled}
          onClick={onContact}
          className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#38bdf8] px-4 text-sm font-black text-white shadow-2xl shadow-sky-950/40 disabled:opacity-50"
        >
          <MessageCircle size={18} />
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}
