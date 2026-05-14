import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const conversations = read("src/lib/conversations.ts");
const messagesPage = read("src/pages/MessagesPage.tsx");
const chatDetail = read("src/pages/ChatDetailPage.tsx");
const indexHtml = read("index.html");
const fallbackHtml = read("public/404.html");
const distIndexExists = existsSync(join(root, "dist/index.html"));

assert(
  conversations.includes("function normalizeConversation(data: Record<string, unknown>, messages: ConversationMessage[] = [], viewerId"),
  "Conversation normalization must use explicit CloudBase viewer uid.",
);
assert(
  conversations.includes("function normalizeMessage(message: Record<string, unknown>, index: number, viewerId"),
  "Message normalization must use explicit CloudBase viewer uid.",
);
assert(
  conversations.includes(".where({ id: conversationId })"),
  "Conversation detail realtime listener must watch the stable id field, not a fragile _id query.",
);
assert(
  conversations.includes("receiverId: viewerId") &&
    conversations.includes("readByUserIds?.includes(viewerId)") &&
    conversations.includes("unreadForUserIds"),
  "Unread state must be receiver-scoped and cleared only for the current viewer.",
);
assert(
  conversations.includes("startPollingFallback") &&
    conversations.includes("Message sync is temporarily delayed."),
  "Realtime listener failures must silently fall back to polling.",
);
assert(
  conversations.includes("hasMessages: false") &&
    messagesPage.includes("(conversation.hasMessages || conversation.status === \"Matched\")"),
  "Opening a chat must not make it visible in Messages until a real message exists or the match is confirmed.",
);
assert(
  chatDetail.includes("const [matchActionPending") &&
    chatDetail.includes("disabled={hasConfirmed || matchActionPending}") &&
    chatDetail.includes("disabled={matchActionPending}"),
  "Match actions must have per-chat pending guards to avoid mobile double-tap races.",
);
assert(
  indexHtml.includes("Cache-Control") && fallbackHtml.includes("Cache-Control"),
  "HTML entry and SPA fallback need no-cache hints to reduce mobile stale bundle loads.",
);
assert(
  !indexHtml.includes("serviceWorker") && !conversations.includes("navigator.serviceWorker"),
  "No service worker should cache stale mobile bundles unless explicitly versioned.",
);
assert(distIndexExists, "Run npm run build before mobile regression so dist/index.html exists.");

console.log("Mobile regression checks passed.");
