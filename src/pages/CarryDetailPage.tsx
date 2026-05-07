import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import BackButton from "../components/BackButton";
import { createOrOpenConversation } from "../lib/conversations";
import { reputationFor } from "../lib/matching";
import { getSubmissions } from "../lib/submissions";
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

  return (
    <section className="mx-auto max-w-3xl px-4 pb-32 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
      <BackButton fallback="/market" />
      <div className="rounded-[32px] border border-white/10 bg-[#1f2232]/90 p-6 shadow-2xl">
        <p className="text-sm font-bold text-slate-300">顺路送 / Carry detail</p>
        {loading ? (
          <p className="mt-5 text-slate-400">Loading...</p>
        ) : carry ? (
          <>
            <h1 className="mt-4 text-4xl font-black text-white">{carry.travelRoute || "Route pending"}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-lg font-black text-sky-200">
                {carry.availableLuggageSpace || "Available luggage space"}
              </p>
              <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-black text-sky-100">
                {carry.status || "Open"}
              </span>
            </div>
            <p className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-slate-300">
              Completed: {reputationFor(1).completed} · {reputationFor(1).active} · {reputationFor(1).responseSpeed}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailLine label="Travel date" value={carry.travelDate || "TBD"} />
              <DetailLine label="Expected reward" value={carry.expectedReward || "Reward pending"} />
              <DetailLine label="Status" value={carry.status || "New"} />
              <DetailLine label="Published" value={carry.publishedDate || "TBD"} />
              <DetailLine label="Accepted item types" value={carry.acceptedItemTypes?.join(", ") || "Flexible"} />
            </div>
            {carry.notes ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-slate-500">Notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{carry.notes}</p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-5 text-slate-400">This carry post could not be found.</p>
        )}
      </div>

      <ContactNowButton
        disabled={!carry}
        onContact={() => {
          if (!carry) {
            return;
          }

          const conversation = createOrOpenConversation({
            postType: "carry",
            postId: carry.id,
            otherUserName: carry.name || "Post owner",
            item: carry.availableLuggageSpace || "Carry space",
            route: carry.travelRoute || "Route pending",
            reward: carry.expectedReward || "Reward pending",
            status: "Negotiating",
          });
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

function ContactNowButton({ disabled, onContact }: { disabled: boolean; onContact: () => void }) {
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
          <span>立即联系 / Contact Now</span>
        </button>
      </div>
    </div>
  );
}
