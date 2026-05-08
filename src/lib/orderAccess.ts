import { getConversations, updateConversationStatus } from "./conversations";
import { profileNickname, readStoredProfile } from "./profile";
import type { Submission, SubmissionStatus } from "../types";

const localDemoOwnerNames = new Set([
  "Student Carry User",
  "Gmail User",
  "Google User",
  "Apple User",
  "WeChat User",
  "Alipay User",
]);

export function isMatchedStatus(status?: SubmissionStatus | string) {
  return status === "Matched" || status === "Closed" || status === "Completed";
}

export function publicStatusLabel(status?: SubmissionStatus | string) {
  if (isMatchedStatus(status)) {
    return "Matched";
  }

  return "Open";
}

export function localizedStatusLabel(status: SubmissionStatus | string | undefined, _language: "en" | "zh" = "en") {
  const normalized = publicStatusLabel(status);
  const labels: Record<string, string> = {
    Open: "Open",
    Matched: "Matched",
  };

  return labels[normalized] || normalized;
}

export function isOpenStatus(status?: SubmissionStatus | string) {
  return !isMatchedStatus(status);
}

export function isCurrentUserPostOwner(submission: Submission) {
  const nickname = profileNickname();
  const postOwner = submission.ownerNickname || submission.name;
  const hasLocalProfile = Boolean(readStoredProfile());
  return Boolean(
    nickname &&
      (postOwner === nickname || (hasLocalProfile && localDemoOwnerNames.has(postOwner))),
  );
}

export function hasConversationForPost(submission: Submission) {
  return getConversations().some((conversation) => conversation.postId === submission.id);
}

export function canOpenSubmission(submission: Submission) {
  if (!isMatchedStatus(submission.status)) {
    return true;
  }

  return isCurrentUserPostOwner(submission) || hasConversationForPost(submission);
}

export function markConversationForPost(postId: string, status: string) {
  getConversations()
    .filter((conversation) => conversation.postId === postId)
    .forEach((conversation) => {
      updateConversationStatus(conversation.id, status);
    });
}
