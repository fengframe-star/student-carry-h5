import { cloudbaseDb, ensureCloudbaseLogin } from "../utils/cloudbase";
import { currentOwnerId, profileNickname } from "./profile";

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
  postOwnerName?: string;
  starterUserId?: string;
  starterUserName?: string;
  participantIds?: string[];
  matchConfirmations?: string[];
  hasMessages?: boolean;
  lastMessageAt?: number;
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
const cloudTimeoutMs = 3500;
const syncFallbackPollingMs = 12_000;
export const currentUserId = "me";

let conversationCache: Conversation[] = [];

function timestamp() {
  return Date.now();
}

function messageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function closeRealtimeListener(listener: { close?: () => void } | undefined) {
  try {
    listener?.close?.();
  } catch (error) {
    console.error("CloudBase listener close failed.", error);
  }
}

function startPollingFallback(task: () => Promise<void>, label: string) {
  let closed = false;

  async function run() {
    try {
      await task();
    } catch (error) {
      console.error(`${label} polling failed.`, error);
    }
  }

  void run();
  const intervalId = window.setInterval(() => {
    if (!closed) {
      void run();
    }
  }, syncFallbackPollingMs);

  return () => {
    closed = true;
    window.clearInterval(intervalId);
  };
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
  const lastMessageAt = typeof data.lastMessageAt === "number" ? data.lastMessageAt : createdAt;
  const viewerId = currentOwnerId();
  const participantIds = Array.isArray(data.participantIds)
    ? (data.participantIds as string[]).filter(Boolean)
    : [data.postOwnerId, data.starterUserId].filter(Boolean) as string[];
  const unreadFromMessages = messages.some(
    (message) =>
      message.senderId !== viewerId &&
      !message.recalled &&
      !message.hiddenForUserIds?.includes(viewerId) &&
      !message.readByUserIds?.includes(viewerId),
  );
  const postOwnerId = typeof data.postOwnerId === "string" ? data.postOwnerId : undefined;
  const starterUserId = typeof data.starterUserId === "string" ? data.starterUserId : currentOwnerId();
  const postOwnerName = String(data.postOwnerName || data.otherUserName || "");
  const starterUserName = String(data.starterUserName || "");
  const otherUserName = viewerId && viewerId === postOwnerId
    ? starterUserName || "Student Carry User"
    : postOwnerName || String(data.otherUserName || "Student Carry User");

  return {
    id: String(data._id || data.id || ""),
    postType: data.postType === "carry" ? "carry" : "request",
    postId: String(data.postId || ""),
    otherUserName,
    item: String(data.item || ""),
    route: String(data.route || ""),
    reward: String(data.reward || ""),
    status: data.status === "Matched" ? "Matched" : "Open",
    postOwnerId,
    postOwnerName,
    starterUserId,
    starterUserName,
    participantIds,
    matchConfirmations: Array.isArray(data.matchConfirmations)
      ? (data.matchConfirmations as string[])
      : [],
    hasMessages: Boolean(data.hasMessages || lastMessageAt || messages.length),
    lastMessageAt,
    latestPreview: String(data.latestPreview || ""),
    latestTime: String(data.latestTime || timeLabel(lastMessageAt)),
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

    const viewerId = currentOwnerId();
    const conversations = await Promise.all(
      (result.data || []).map(async (data: Record<string, unknown>) =>
        normalizeConversation(data, await readMessages(String(data._id || data.id || ""))),
      ),
    );
    const visibleConversations = conversations
      .filter((conversation) => conversation.hasMessages)
      .filter((conversation) => conversation.participantIds?.includes(viewerId))
      .sort((first, second) => (second.lastMessageAt || 0) - (first.lastMessageAt || 0));
    conversationCache = visibleConversations;
    return visibleConversations;
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
  const starterId = currentOwnerId();
  if (!starterId) {
    throw new Error("Login required.");
  }
  if (!input.postOwnerId || input.postOwnerId === starterId) {
    throw new Error("Unable to start a chat for this post.");
  }

  await withTimeout(ensureCloudbaseLogin(), "CloudBase login");
  const existingForUser = (await getConversations()).find(
    (conversation) => conversation.postId === input.postId && conversation.participantIds?.includes(starterId),
  );
  if (existingForUser) {
    return existingForUser;
  }

  const id = `${input.postType}-${input.postId}-${starterId}`;
  const existing = await getConversation(id);

  if (existing) {
    return existing;
  }
  const now = timestamp();
  const participantIds = Array.from(new Set([input.postOwnerId, starterId].filter(Boolean))) as string[];

  const conversation: Conversation = {
    ...input,
    id,
    status: input.status === "Matched" ? "Matched" : "Open",
    starterUserId: starterId,
    starterUserName: profileNickname(),
    postOwnerName: input.otherUserName,
    participantIds,
    matchConfirmations: [],
    hasMessages: false,
    lastMessageAt: undefined,
    latestPreview: "",
    latestTime: "",
    unread: false,
    hiddenForUserIds: [],
    messages: [],
  };

  try {
    await withTimeout(
      cloudbaseDb.collection(conversationsCollectionName).doc(id).set(
        stripUndefined({
          ...conversation,
          messages: undefined,
          createdAt: now,
          updatedAt: now,
        }),
      ),
      "Prepare conversation",
    );
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
  } catch (error) {
    console.error("Mark conversation read failed.", error);
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
  if (!senderId || !receiverId || receiverId === "other-user") {
    throw new Error("Unable to identify chat participants.");
  }
  const type = imageDataUrl ? "image" : "text";
  const stableMessageId = messageId();
  const message: ConversationMessage = {
    id: stableMessageId,
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
    cloudbaseDb.collection(messagesCollectionName).doc(stableMessageId).set(
      stripUndefined({
        ...message,
        clientId: stableMessageId,
        conversationId: id,
        imageDataUrl: undefined,
      }),
    ),
    "Send message",
  );
  await withTimeout(
    cloudbaseDb.collection(conversationsCollectionName).doc(id).update({
      participantIds: Array.from(new Set([conversation.postOwnerId, conversation.starterUserId, senderId, receiverId].filter(Boolean))),
      hasMessages: true,
      latestPreview,
      latestTime: timeLabel(createdAt),
      lastMessageAt: createdAt,
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
      hasMessages: true,
      lastMessageAt: createdAt,
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

  let fallbackClose: (() => void) | undefined;
  let listener: { close?: () => void } | undefined;

  const startFallback = () => {
    if (fallbackClose) return;
    closeRealtimeListener(listener);
    handlers.onError("Message sync is temporarily delayed.");
    fallbackClose = startPollingFallback(async () => {
      handlers.onMessages(await readMessages(conversationId));
    }, "Message sync");
  };

  try {
    listener = cloudbaseDb
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
        console.error("CloudBase message listener failed.", error);
        startFallback();
      },
    });
  } catch (error) {
    console.error("CloudBase message listener setup failed.", error);
    startFallback();
  }

  return () => {
    closeRealtimeListener(listener);
    fallbackClose?.();
  };
}

export async function subscribeConversations(
  handlers: {
    onConversations: (conversations: Conversation[]) => void;
    onError?: (message: string) => void;
  },
) {
  await ensureCloudbaseLogin();

  let fallbackClose: (() => void) | undefined;
  let listener: { close?: () => void } | undefined;

  const hydrateConversations = async (docs: Record<string, unknown>[]) => {
    const conversations = await Promise.all(
      docs.map(async (data) =>
        normalizeConversation(data, await readMessages(String(data._id || data.id || ""))),
      ),
    );
    const viewerId = currentOwnerId();
    const visibleConversations = conversations
      .filter((conversation) => conversation.hasMessages)
      .filter((conversation) => conversation.participantIds?.includes(viewerId))
      .sort((first, second) => (second.lastMessageAt || 0) - (first.lastMessageAt || 0));
    conversationCache = visibleConversations;
    handlers.onConversations(visibleConversations);
  };

  const startFallback = () => {
    if (fallbackClose) return;
    closeRealtimeListener(listener);
    handlers.onError?.("Message sync is temporarily delayed.");
    fallbackClose = startPollingFallback(async () => {
      handlers.onConversations(await getConversations());
    }, "Conversation sync");
  };

  try {
    listener = cloudbaseDb
    .collection(conversationsCollectionName)
    .orderBy("updatedAt", "desc")
    .watch({
      onChange: (snapshot: { docs?: Record<string, unknown>[] }) => {
        void hydrateConversations(snapshot.docs || []).catch((error: unknown) => {
          console.error("CloudBase conversation listener hydration failed.", error);
          startFallback();
        });
      },
      onError: (error: unknown) => {
        console.error("CloudBase conversation listener failed.", error);
        startFallback();
      },
    });
  } catch (error) {
    console.error("CloudBase conversation listener setup failed.", error);
    startFallback();
  }

  return () => {
    closeRealtimeListener(listener);
    fallbackClose?.();
  };
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

  const loadUnread = async () => {
    const result = await withTimeout(
      cloudbaseDb
        .collection(messagesCollectionName)
        .where({ receiverId: viewerId })
        .get(),
      "Read unread messages",
    );
    const unreadConversationIds = new Set<string>();
    (result.data || []).forEach((doc: Record<string, unknown>, index: number) => {
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
  };

  let fallbackClose: (() => void) | undefined;
  let listener: { close?: () => void } | undefined;

  const startFallback = () => {
    if (fallbackClose) return;
    closeRealtimeListener(listener);
    fallbackClose = startPollingFallback(loadUnread, "Unread sync");
  };

  try {
    listener = cloudbaseDb
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
        console.error("CloudBase unread listener failed.", error);
        startFallback();
      },
    });
  } catch (error) {
    console.error("CloudBase unread listener setup failed.", error);
    startFallback();
  }

  return () => {
    closeRealtimeListener(listener);
    fallbackClose?.();
  };
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
