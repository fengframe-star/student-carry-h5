import { getCachedConversations, updateConversationStatus } from "./conversations";
import { currentOwnerId, profileNickname } from "./profile";
import type { Submission, SubmissionStatus } from "../types";

export function isMatchedStatus(status?: SubmissionStatus | string) {
  return status === "Matched";
}

export function publicStatusLabel(status?: SubmissionStatus | string) {
  if (status === "Pending") {
    return "PENDING";
  }
  if (isMatchedStatus(status)) {
    return "MATCHED";
  }

  return "OPEN";
}

export function localizedStatusLabel(status: SubmissionStatus | string | undefined, _language: "en" | "zh" = "en") {
  const normalized = publicStatusLabel(status);
  const labels: Record<string, string> = {
    OPEN: "OPEN",
    PENDING: "PENDING",
    MATCHED: "MATCHED",
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
  return getCachedConversations().some((conversation) => {
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

export async function markConversationForPost(postId: string, status: string) {
  await Promise.all(
    getCachedConversations()
    .filter((conversation) => conversation.postId === postId)
    .map((conversation) => updateConversationStatus(conversation.id, status)),
  );
}
