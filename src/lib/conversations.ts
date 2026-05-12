import { cloudbaseDb, ensureCloudbaseLogin } from "../utils/cloudbase";
import { currentOwnerId } from "./profile";

export type ConversationMessage = {
  id?: string;
  author: "Post owner" | "Me";
  senderId?: string;
  text?: string;
  imageDataUrl?: string;
  createdAt?: number;
  recalled?: boolean;
  hiddenForUserIds?: string[];
};

export type Conversation = {
  id: string;
  postType: "request" | "carry";
  postId: string;
  otherUserName: string;
  item: string;
  route: string;
  reward: string;
  status: string;
  postOwnerId?: string;
  starterUserId?: string;
  matchConfirmations?: string[];
  latestPreview: string;
  latestTime: string;
  unread: boolean;
  hiddenForUserIds?: string[];
  messages: ConversationMessage[];
};

export type ConversationInput = Omit<
  Conversation,
  "id" | "latestPreview" | "latestTime" | "unread" | "messages"
>;

const conversationsCollectionName = "conversations";
const messagesCollectionName = "messages";
export const currentUserId = "me";

let conversationCache: Conversation[] = [];

function timestamp() {
  return Date.now();
}

function messageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    ) as T;
  }

  return value;
}

function timeLabel(createdAt?: number) {
  if (!createdAt) {
    return "";
  }

  const minutes = Math.max(0, Math.round((Date.now() - createdAt) / 60_000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function normalizeMessage(message: Record<string, unknown>, index: number): ConversationMessage {
  return {
    id: String(message._id || message.id || `legacy-${index}`),
    author: message.author === "Post owner" ? "Post owner" : "Me",
    senderId: String(message.senderId || (message.author === "Me" ? currentUserId : "other-user")),
    text: typeof message.text === "string" ? message.text : undefined,
    imageDataUrl: typeof message.imageDataUrl === "string" ? message.imageDataUrl : undefined,
    createdAt: typeof message.createdAt === "number" ? message.createdAt : 0,
    recalled: Boolean(message.recalled),
    hiddenForUserIds: Array.isArray(message.hiddenForUserIds)
      ? (message.hiddenForUserIds as string[])
      : [],
  };
}

function normalizeConversation(data: Record<string, unknown>, messages: ConversationMessage[] = []): Conversation {
  const createdAt = typeof data.createdAt === "number" ? data.createdAt : undefined;
  return {
    id: String(data._id || data.id || ""),
    postType: data.postType === "carry" ? "carry" : "request",
    postId: String(data.postId || ""),
    otherUserName: String(data.otherUserName || ""),
    item: String(data.item || ""),
    route: String(data.route || ""),
    reward: String(data.reward || ""),
    status: data.status === "Matched" ? "Matched" : "Open",
    postOwnerId: typeof data.postOwnerId === "string" ? data.postOwnerId : undefined,
    starterUserId: typeof data.starterUserId === "string" ? data.starterUserId : currentOwnerId(),
    matchConfirmations: Array.isArray(data.matchConfirmations)
      ? (data.matchConfirmations as string[])
      : [],
    latestPreview: String(data.latestPreview || ""),
    latestTime: String(data.latestTime || timeLabel(createdAt)),
    unread: Boolean(data.unread),
    hiddenForUserIds: Array.isArray(data.hiddenForUserIds)
      ? (data.hiddenForUserIds as string[])
      : [],
    messages,
  };
}

function latestPreviewFor(messages: ConversationMessage[], viewerId = currentOwnerId()) {
  const visibleMessages = messages.filter(
    (message) => !message.hiddenForUserIds?.includes(viewerId),
  );
  const latest = visibleMessages[visibleMessages.length - 1];
  if (!latest) {
    return "";
  }

  if (latest.recalled) {
    return "Message recalled";
  }

  return latest.text || (latest.imageDataUrl ? "Sent an image" : "");
}

async function readMessages(conversationId: string) {
  const result = await cloudbaseDb
    .collection(messagesCollectionName)
    .where({ conversationId })
    .orderBy("createdAt", "asc")
    .get();

  return (result.data || []).map(normalizeMessage);
}

async function readConversationDocument(id: string) {
  const result = await cloudbaseDb.collection(conversationsCollectionName).doc(id).get();
  return result.data?.[0] as Record<string, unknown> | undefined;
}

export function getCachedConversations() {
  return conversationCache;
}

export async function getConversations() {
  await ensureCloudbaseLogin();
  const result = await cloudbaseDb
    .collection(conversationsCollectionName)
    .orderBy("updatedAt", "desc")
    .get();

  const conversations = await Promise.all(
    (result.data || []).map(async (data: Record<string, unknown>) =>
      normalizeConversation(data, await readMessages(String(data._id || data.id || ""))),
    ),
  );
  conversationCache = conversations;
  return conversations;
}

export async function getConversation(id: string) {
  await ensureCloudbaseLogin();
  const data = await readConversationDocument(id);
  if (!data) {
    return null;
  }

  const conversation = normalizeConversation(data, await readMessages(id));
  conversationCache = [
    conversation,
    ...conversationCache.filter((cached) => cached.id !== conversation.id),
  ];
  return conversation;
}

export async function createOrOpenConversation(input: ConversationInput) {
  await ensureCloudbaseLogin();
  const id = `${input.postType}-${input.postId}`;
  const existing = await getConversation(id);

  if (existing) {
    return existing;
  }

  const conversation: Conversation = {
    ...input,
    id,
    status: input.status === "Matched" ? "Matched" : "Open",
    starterUserId: currentOwnerId(),
    matchConfirmations: [],
    latestPreview: "",
    latestTime: "",
    unread: true,
    hiddenForUserIds: [],
    messages: [],
  };

  await cloudbaseDb.collection(conversationsCollectionName).doc(id).set(
    stripUndefined({
      ...conversation,
      messages: undefined,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    }),
  );
  conversationCache = [conversation, ...conversationCache];
  return conversation;
}

export async function markConversationRead(id: string) {
  await ensureCloudbaseLogin();
  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
    unread: false,
    updatedAt: timestamp(),
  });
  conversationCache = conversationCache.map((conversation) =>
    conversation.id === id ? { ...conversation, unread: false } : conversation,
  );
}

export async function appendConversationMessage(id: string, text?: string, imageDataUrl?: string) {
  await ensureCloudbaseLogin();
  const createdAt = timestamp();
  const message: ConversationMessage = {
    id: messageId(),
    author: "Me",
    senderId: currentOwnerId(),
    text,
    imageDataUrl,
    createdAt,
    recalled: false,
    hiddenForUserIds: [],
  };
  await cloudbaseDb.collection(messagesCollectionName).doc(message.id || messageId()).set(
    stripUndefined({
      ...message,
      conversationId: id,
    }),
  );
  const latestPreview = text || (imageDataUrl ? "Sent an image" : "");
  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
    latestPreview,
    latestTime: timeLabel(createdAt),
    unread: false,
    updatedAt: createdAt,
  });
  return getConversation(id);
}

export function appendConversationImageMessage(id: string, imageDataUrl: string) {
  return appendConversationMessage(id, undefined, imageDataUrl);
}

export async function hideConversationMessageForMe(id: string, messageIdToHide: string) {
  await ensureCloudbaseLogin();
  const conversation = await getConversation(id);
  if (!conversation) {
    return null;
  }

  const viewerId = currentOwnerId();
  const messages = conversation.messages.map((message) =>
    message.id === messageIdToHide
      ? {
          ...message,
          hiddenForUserIds: Array.from(new Set([...(message.hiddenForUserIds || []), viewerId])),
        }
      : message,
  );
  const message = messages.find((item) => item.id === messageIdToHide);
  if (message?.id) {
    await cloudbaseDb
      .collection(messagesCollectionName)
      .doc(message.id)
      .update({ hiddenForUserIds: message.hiddenForUserIds || [] });
  }

  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
    latestPreview: latestPreviewFor(messages, viewerId),
    updatedAt: timestamp(),
  });

  return getConversation(id);
}

export async function hideConversationForMe(id: string) {
  await ensureCloudbaseLogin();
  const conversation = await getConversation(id);
  if (!conversation) {
    return conversationCache;
  }

  const viewerId = currentOwnerId();
  const hiddenForUserIds = Array.from(new Set([...(conversation.hiddenForUserIds || []), viewerId]));
  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
    hiddenForUserIds,
    updatedAt: timestamp(),
  });
  conversationCache = conversationCache.map((item) =>
    item.id === id ? { ...item, hiddenForUserIds } : item,
  );
  return conversationCache;
}

export async function recallConversationMessage(id: string, messageIdToRecall: string) {
  await ensureCloudbaseLogin();
  await cloudbaseDb.collection(messagesCollectionName).doc(messageIdToRecall).update({
    text: "",
    imageDataUrl: "",
    recalled: true,
    hiddenForUserIds: [],
  });
  const conversation = await getConversation(id);
  if (conversation) {
    await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
      latestPreview: latestPreviewFor(conversation.messages),
      updatedAt: timestamp(),
    });
  }
  return getConversation(id);
}

export async function updateConversationStatus(id: string, status: string) {
  await ensureCloudbaseLogin();
  const nextStatus = status === "Matched" ? "Matched" : "Open";
  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update(stripUndefined({
    status: nextStatus,
    matchConfirmations: nextStatus === "Open" ? [] : undefined,
    updatedAt: timestamp(),
  }));
  return getConversation(id);
}

export async function confirmConversationMatch(id: string, confirmerId = currentOwnerId()) {
  await ensureCloudbaseLogin();
  const conversation = await getConversation(id);
  if (!conversation) {
    return { conversation: null, matched: false, postId: null as string | null };
  }

  const confirmations = Array.from(new Set([...(conversation.matchConfirmations || []), confirmerId]));
  const required = [conversation.postOwnerId, conversation.starterUserId].filter(Boolean) as string[];
  const matched = required.length >= 2 && required.every((requiredId) => confirmations.includes(requiredId));
  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
    status: matched ? "Matched" : "Open",
    matchConfirmations: confirmations,
    updatedAt: timestamp(),
  });
  const updated = await getConversation(id);
  return {
    conversation: updated,
    matched,
    postId: matched ? conversation.postId : null,
  };
}

export async function cancelConversationMatch(id: string) {
  await ensureCloudbaseLogin();
  await cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
    status: "Open",
    matchConfirmations: [],
    updatedAt: timestamp(),
  });
  return getConversation(id);
}
