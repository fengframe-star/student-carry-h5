import { cloudbaseDb, ensureCloudbaseLogin } from "../utils/cloudbase";
import { currentOwnerId } from "./profile";

export type ConversationMessage = {
  id?: string;
  author: "Post owner" | "Me";
  senderId?: string;
  receiverId?: string;
  text?: string;
  imageUrl?: string;
  imageDataUrl?: string;
  type?: "text" | "image";
  createdAt?: number;
  read?: boolean;
  readByUserIds?: string[];
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
const localConversationsKey = "studentCarryCloudFallbackConversations";
const cloudTimeoutMs = 3500;
export const currentUserId = "me";

let conversationCache: Conversation[] = [];

function timestamp() {
  return Date.now();
}

function messageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function readLocalConversations() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    return (JSON.parse(window.localStorage.getItem(localConversationsKey) || "[]") as Conversation[]).map(
      (conversation) => normalizeConversation(conversation as unknown as Record<string, unknown>, conversation.messages || []),
    );
  } catch {
    return [];
  }
}

function writeLocalConversations(conversations: Conversation[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(localConversationsKey, JSON.stringify(conversations));
  conversationCache = conversations;
}

function saveLocalConversation(conversation: Conversation) {
  const conversations = readLocalConversations();
  writeLocalConversations([
    conversation,
    ...conversations.filter((item) => item.id !== conversation.id),
  ]);
}

function updateLocalConversation(id: string, updater: (conversation: Conversation) => Conversation) {
  const conversations = readLocalConversations();
  const next = conversations.map((conversation) =>
    conversation.id === id ? updater(conversation) : conversation,
  );
  writeLocalConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), cloudTimeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
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
  const senderId = String(message.senderId || (message.author === "Me" ? currentUserId : "other-user"));
  const imageUrl = typeof message.imageUrl === "string"
    ? message.imageUrl
    : typeof message.imageDataUrl === "string"
      ? message.imageDataUrl
      : undefined;

  return {
    id: String(message._id || message.id || `legacy-${index}`),
    author: senderId === currentOwnerId() || senderId === currentUserId ? "Me" : "Post owner",
    senderId,
    receiverId: typeof message.receiverId === "string" ? message.receiverId : undefined,
    text: typeof message.text === "string" ? message.text : undefined,
    imageUrl,
    imageDataUrl: imageUrl,
    type: message.type === "image" || imageUrl ? "image" : "text",
    createdAt: typeof message.createdAt === "number" ? message.createdAt : 0,
    read: Boolean(message.read),
    readByUserIds: Array.isArray(message.readByUserIds)
      ? (message.readByUserIds as string[])
      : [],
    recalled: Boolean(message.recalled),
    hiddenForUserIds: Array.isArray(message.hiddenForUserIds)
      ? (message.hiddenForUserIds as string[])
      : [],
  };
}

function normalizeConversation(data: Record<string, unknown>, messages: ConversationMessage[] = []): Conversation {
  const createdAt = typeof data.createdAt === "number" ? data.createdAt : undefined;
  const viewerId = currentOwnerId();
  const unreadFromMessages = messages.some(
    (message) =>
      message.senderId !== viewerId &&
      !message.recalled &&
      !message.hiddenForUserIds?.includes(viewerId) &&
      !message.readByUserIds?.includes(viewerId),
  );
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
    unread: unreadFromMessages,
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
  const result = await withTimeout(
    cloudbaseDb
      .collection(messagesCollectionName)
      .where({ conversationId })
      .orderBy("createdAt", "asc")
      .get(),
    "Read messages",
  );

  return (result.data || [])
    .map(normalizeMessage)
    .sort((first, second) => (first.createdAt || 0) - (second.createdAt || 0));
}

async function readConversationDocument(id: string) {
  const result = await withTimeout(
    cloudbaseDb.collection(conversationsCollectionName).doc(id).get(),
    "Read conversation document",
  );
  return result.data?.[0] as Record<string, unknown> | undefined;
}

export function getCachedConversations() {
  return conversationCache;
}

export async function getConversations() {
  try {
    await withTimeout(ensureCloudbaseLogin(), "CloudBase login");
    const result = await withTimeout(
      cloudbaseDb
        .collection(conversationsCollectionName)
        .orderBy("updatedAt", "desc")
        .get(),
      "Read conversations",
    );

    const conversations = await Promise.all(
      (result.data || []).map(async (data: Record<string, unknown>) =>
        normalizeConversation(data, await readMessages(String(data._id || data.id || ""))),
      ),
    );
    conversationCache = conversations;
    return conversations;
  } catch (error) {
    console.error("CloudBase conversations read failed.", error);
    throw error;
  }
}

export async function getConversation(id: string) {
  const cached = conversationCache.find((conversation) => conversation.id === id);

  try {
    await withTimeout(ensureCloudbaseLogin(), "CloudBase login");
    const data = await withTimeout(readConversationDocument(id), "Read conversation");
    if (!data) {
      return cached ?? null;
    }

    const conversation = normalizeConversation(data, await readMessages(id));
    conversationCache = [
      conversation,
      ...conversationCache.filter((cached) => cached.id !== conversation.id),
    ];
    return conversation;
  } catch (error) {
    console.error("CloudBase conversation read failed.", error);
    throw error;
  }
}

export async function createOrOpenConversation(input: ConversationInput) {
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

  try {
    await withTimeout(ensureCloudbaseLogin(), "CloudBase login");
    await withTimeout(
      cloudbaseDb.collection(conversationsCollectionName).doc(id).set(
        stripUndefined({
          ...conversation,
          messages: undefined,
          createdAt: timestamp(),
          updatedAt: timestamp(),
        }),
      ),
      "Create conversation",
    );
    conversationCache = [conversation, ...conversationCache];
  } catch (error) {
    console.error("CloudBase conversation create failed.", error);
    throw error;
  }
  return conversation;
}

function receiverIdFor(conversation: Conversation, senderId: string) {
  const candidateIds = [conversation.postOwnerId, conversation.starterUserId].filter(Boolean) as string[];
  return candidateIds.find((candidateId) => candidateId !== senderId) || "other-user";
}

export async function markConversationRead(id: string) {
  const viewerId = currentOwnerId();
  try {
    await withTimeout(ensureCloudbaseLogin(), "CloudBase login");
    const messages = await readMessages(id);
    await Promise.all(
      messages
        .filter(
          (message) =>
            message.id &&
            message.senderId !== viewerId &&
            !message.readByUserIds?.includes(viewerId),
        )
        .map((message) =>
          cloudbaseDb
            .collection(messagesCollectionName)
            .doc(message.id!)
            .update({
              read: true,
              readByUserIds: Array.from(new Set([...(message.readByUserIds || []), viewerId])),
            }),
        ),
    );
    await withTimeout(
      cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
        unread: false,
        unreadForUserIds: [],
        updatedAt: timestamp(),
      }),
      "Mark conversation read",
    );
  } catch {
    updateLocalConversation(id, (conversation) => ({ ...conversation, unread: false }));
  }
  conversationCache = conversationCache.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          unread: false,
          messages: conversation.messages.map((message) =>
            message.senderId !== viewerId
              ? { ...message, read: true, readByUserIds: Array.from(new Set([...(message.readByUserIds || []), viewerId])) }
              : message,
          ),
        }
      : conversation,
  );
}

export async function appendConversationMessage(id: string, text?: string, imageDataUrl?: string) {
  const conversation = await getConversation(id);
  if (!conversation) {
    throw new Error("Conversation not found. Please reopen the post and try again.");
  }

  const createdAt = timestamp();
  const senderId = currentOwnerId();
  const receiverId = receiverIdFor(conversation, senderId);
  const type = imageDataUrl ? "image" : "text";
  const message: ConversationMessage = {
    id: messageId(),
    author: "Me",
    senderId,
    receiverId,
    text,
    imageUrl: imageDataUrl,
    imageDataUrl,
    type,
    createdAt,
    read: false,
    readByUserIds: [senderId],
    recalled: false,
    hiddenForUserIds: [],
  };
  const latestPreview = text || (imageDataUrl ? "Sent an image" : "");

  await withTimeout(ensureCloudbaseLogin(), "CloudBase login");
  await withTimeout(
    cloudbaseDb.collection(messagesCollectionName).doc(message.id || messageId()).set(
      stripUndefined({
        ...message,
        conversationId: id,
        imageDataUrl: undefined,
      }),
    ),
    "Send message",
  );
  await withTimeout(
    cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
      latestPreview,
      latestTime: timeLabel(createdAt),
      unread: true,
      unreadForUserIds: [receiverId],
      updatedAt: createdAt,
    }),
    "Update conversation",
  );

  try {
    return await getConversation(id);
  } catch {
    return {
      ...conversation,
      latestPreview,
      latestTime: timeLabel(createdAt),
      unread: true,
      messages: [...conversation.messages, message],
    };
  }
}

export async function subscribeConversationMessages(
  conversationId: string,
  handlers: {
    onMessages: (messages: ConversationMessage[]) => void;
    onError: (message: string) => void;
  },
) {
  await ensureCloudbaseLogin();

  const listener = cloudbaseDb
    .collection(messagesCollectionName)
    .where({ conversationId })
    .orderBy("createdAt", "asc")
    .watch({
      onChange: (snapshot: { docs?: Record<string, unknown>[] }) => {
        const messages = (snapshot.docs || [])
          .map(normalizeMessage)
          .sort((first, second) => (first.createdAt || 0) - (second.createdAt || 0));
        handlers.onMessages(messages);
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("CloudBase message listener failed.", error);
        handlers.onError(`Message sync failed: ${message}`);
      },
    });

  return () => listener.close();
}

export async function subscribeConversations(
  handlers: {
    onConversations: (conversations: Conversation[]) => void;
    onError?: (message: string) => void;
  },
) {
  await ensureCloudbaseLogin();

  const listener = cloudbaseDb
    .collection(conversationsCollectionName)
    .orderBy("updatedAt", "desc")
    .watch({
      onChange: (snapshot: { docs?: Record<string, unknown>[] }) => {
        void Promise.all(
          (snapshot.docs || []).map(async (data) =>
            normalizeConversation(data, await readMessages(String(data._id || data.id || ""))),
          ),
        ).then((conversations) => {
          conversationCache = conversations;
          handlers.onConversations(conversations);
        }).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error("CloudBase conversation listener hydration failed.", error);
          handlers.onError?.(`Conversation sync failed: ${message}`);
        });
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("CloudBase conversation listener failed.", error);
        handlers.onError?.(`Conversation sync failed: ${message}`);
      },
    });

  return () => listener.close();
}

export async function subscribeUnreadMessages(
  handlers: {
    onUnread: (unreadConversationIds: string[]) => void;
    onError?: (message: string) => void;
  },
) {
  await ensureCloudbaseLogin();
  const viewerId = currentOwnerId();
  if (!viewerId) {
    handlers.onUnread([]);
    return () => {};
  }

  const listener = cloudbaseDb
    .collection(messagesCollectionName)
    .where({ receiverId: viewerId })
    .watch({
      onChange: (snapshot: { docs?: Record<string, unknown>[] }) => {
        const unreadConversationIds = new Set<string>();
        (snapshot.docs || []).forEach((doc, index) => {
          const message = normalizeMessage(doc, index);
          const conversationId = typeof doc.conversationId === "string" ? doc.conversationId : "";
          if (
            conversationId &&
            !message.recalled &&
            !message.hiddenForUserIds?.includes(viewerId) &&
            !message.readByUserIds?.includes(viewerId)
          ) {
            unreadConversationIds.add(conversationId);
          }
        });
        handlers.onUnread(Array.from(unreadConversationIds));
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("CloudBase unread listener failed.", error);
        handlers.onError?.(`Unread sync failed: ${message}`);
      },
    });

  return () => listener.close();
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
