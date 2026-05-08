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

const conversationsKey = "studentCarryConversations";
export const currentUserId = "me";

function messageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMessage(message: ConversationMessage, index: number): ConversationMessage {
  return {
    ...message,
    id: message.id || `legacy-${index}`,
    senderId: message.senderId || (message.author === "Me" ? currentUserId : "other-user"),
    createdAt: message.createdAt || 0,
    recalled: Boolean(message.recalled),
    hiddenForUserIds: message.hiddenForUserIds || [],
  };
}

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    status: conversation.status === "Matched" ? "Matched" : "Open",
    starterUserId: conversation.starterUserId || currentUserId,
    matchConfirmations: conversation.matchConfirmations || [],
    hiddenForUserIds: conversation.hiddenForUserIds || [],
    messages: conversation.messages.map(normalizeMessage),
  };
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getConversations() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    return (JSON.parse(window.localStorage.getItem(conversationsKey) || "[]") as Conversation[]).map(
      normalizeConversation,
    );
  } catch {
    return [];
  }
}

export function getConversation(id: string) {
  return getConversations().find((conversation) => conversation.id === id) ?? null;
}

function writeConversations(conversations: Conversation[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(conversationsKey, JSON.stringify(conversations));
}

export function createOrOpenConversation(input: ConversationInput) {
  const id = `${input.postType}-${input.postId}`;
  const conversations = getConversations();
  const existing = conversations.find((conversation) => conversation.id === id);

  if (existing) {
    return existing;
  }

  const conversation: Conversation = {
    ...input,
    id,
    starterUserId: currentOwnerId(),
    matchConfirmations: [],
    latestPreview: "Hi, I would like to discuss this post.",
    latestTime: "Just now",
    unread: true,
    messages: [
      {
        id: messageId(),
        author: "Me",
        senderId: currentUserId,
        text: "Hi, I would like to discuss this post.",
        createdAt: Date.now() - 180_000,
      },
      {
        id: messageId(),
        author: "Post owner",
        senderId: "other-user",
        text: "Sure, we can confirm the details here.",
        createdAt: Date.now() - 170_000,
      },
    ],
  };

  writeConversations([conversation, ...conversations]);
  return conversation;
}

export function markConversationRead(id: string) {
  writeConversations(
    getConversations().map((conversation) =>
      conversation.id === id ? { ...conversation, unread: false } : conversation,
    ),
  );
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

export function appendConversationMessage(id: string, text?: string, imageDataUrl?: string) {
  const conversations = getConversations();
  const next = conversations.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          latestPreview: text || (imageDataUrl ? "Sent an image" : conversation.latestPreview),
          latestTime: "Now",
          unread: false,
          messages: [
            ...conversation.messages,
            {
              id: messageId(),
              author: "Me" as const,
              senderId: currentUserId,
              text,
              imageDataUrl,
              createdAt: Date.now(),
              recalled: false,
              hiddenForUserIds: [],
            },
          ],
        }
      : conversation,
  );

  writeConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}

export function appendConversationImageMessage(id: string, imageDataUrl: string) {
  return appendConversationMessage(id, undefined, imageDataUrl);
}

export function hideConversationMessageForMe(id: string, messageIdToHide: string) {
  const conversations = getConversations();
  const viewerId = currentOwnerId();
  const next = conversations.map((conversation) => {
    if (conversation.id !== id) {
      return conversation;
    }

    const messages = conversation.messages.map((message) =>
      message.id === messageIdToHide
        ? {
            ...message,
            hiddenForUserIds: Array.from(new Set([...(message.hiddenForUserIds || []), viewerId])),
          }
        : message,
    );
    return {
      ...conversation,
      latestPreview: latestPreviewFor(messages, viewerId),
      latestTime: messages.length ? conversation.latestTime : "Now",
      messages,
    };
  });

  writeConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}

export function hideConversationForMe(id: string) {
  const viewerId = currentOwnerId();
  const next = getConversations().map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          hiddenForUserIds: Array.from(new Set([...(conversation.hiddenForUserIds || []), viewerId])),
        }
      : conversation,
  );

  writeConversations(next);
  return next;
}

export function recallConversationMessage(id: string, messageIdToRecall: string) {
  const conversations = getConversations();
  const next = conversations.map((conversation) => {
    if (conversation.id !== id) {
      return conversation;
    }

    const messages = conversation.messages.map((message) =>
      message.id === messageIdToRecall
        ? {
            ...message,
            text: undefined,
            imageDataUrl: undefined,
            recalled: true,
            hiddenForUserIds: [],
          }
        : message,
    );
    return {
      ...conversation,
      latestPreview: latestPreviewFor(messages),
      messages,
    };
  });

  writeConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}

export function updateConversationStatus(id: string, status: string) {
  const conversations = getConversations();
  const next = conversations.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          status,
          matchConfirmations: status === "Open" ? [] : conversation.matchConfirmations,
        }
      : conversation,
  );

  writeConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}

export function confirmConversationMatch(id: string, confirmerId = currentOwnerId()) {
  const conversations = getConversations();
  let matchedPostId: string | null = null;
  const next = conversations.map((conversation) => {
    if (conversation.id !== id) {
      return conversation;
    }

    const confirmations = Array.from(
      new Set([...(conversation.matchConfirmations || []), confirmerId]),
    );
    const required = [conversation.postOwnerId, conversation.starterUserId].filter(Boolean) as string[];
    const matched = required.length >= 2 && required.every((requiredId) => confirmations.includes(requiredId));
    if (matched) {
      matchedPostId = conversation.postId;
    }

    return {
      ...conversation,
      status: matched ? "Matched" : "Open",
      matchConfirmations: confirmations,
    };
  });

  writeConversations(next);
  return {
    conversation: next.find((conversation) => conversation.id === id) ?? null,
    matched: Boolean(matchedPostId),
    postId: matchedPostId,
  };
}

export function cancelConversationMatch(id: string) {
  const conversations = getConversations();
  const next = conversations.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          status: "Open",
          matchConfirmations: [],
        }
      : conversation,
  );

  writeConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}
