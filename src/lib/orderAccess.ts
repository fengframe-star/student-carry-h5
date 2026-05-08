import { getConversations, updateConversationStatus } from "./conversations";
import { currentOwnerId, profileNickname } from "./profile";
import type { Submission, SubmissionStatus } from "../types";

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
  const ownerId = currentOwnerId();
  return Boolean(
    (submission.ownerId && submission.ownerId === ownerId) ||
      (!submission.ownerId && nickname && postOwner === nickname),
  );
}

export function hasConversationForPost(submission: Submission) {
  const ownerId = currentOwnerId();
  return getConversations().some((conversation) => {
    if (conversation.postId !== submission.id) {
      return false;
    }

    if (!conversation.postOwnerId && !conversation.starterUserId) {
      return true;
    }

    return conversation.postOwnerId === ownerId || conversation.starterUserId === ownerId;
  });
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
