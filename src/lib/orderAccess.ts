import { getConversations, updateConversationStatus } from "./conversations";
import { profileNickname } from "./profile";
import type { Submission, SubmissionStatus } from "../types";

export function isMatchedStatus(status?: SubmissionStatus | string) {
  return status === "Matched" || status === "Closed";
}

export function isCompletedStatus(status?: SubmissionStatus | string) {
  return status === "Completed";
}

export function publicStatusLabel(status?: SubmissionStatus | string) {
  if (isCompletedStatus(status)) {
    return "已完成 / Completed";
  }

  return isMatchedStatus(status) ? "已匹配 / Matched" : status || "Open";
}

export function isOpenStatus(status?: SubmissionStatus | string) {
  return !status || status === "Open";
}

export function isCurrentUserPostOwner(submission: Submission) {
  const nickname = profileNickname();
  return Boolean(
    nickname &&
      (submission.ownerNickname === nickname || submission.name === nickname),
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
