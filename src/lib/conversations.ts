export type ConversationMessage = {
  author: "Post owner" | "Me";
  text: string;
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
  latestPreview: string;
  latestTime: string;
  unread: boolean;
  messages: ConversationMessage[];
};

export type ConversationInput = Omit<
  Conversation,
  "id" | "latestPreview" | "latestTime" | "unread" | "messages"
>;

const conversationsKey = "studentCarryConversations";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getConversations() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(conversationsKey) || "[]") as Conversation[];
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
    latestPreview: "Hi, I would like to discuss this post.",
    latestTime: "Just now",
    unread: true,
    messages: [
      {
        author: "Me",
        text: "Hi, I would like to discuss this post.",
      },
      {
        author: "Post owner",
        text: "Sure, we can confirm the details here.",
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

export function appendConversationMessage(id: string, text: string) {
  const conversations = getConversations();
  const next = conversations.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          latestPreview: text,
          latestTime: "Now",
          unread: false,
          messages: [...conversation.messages, { author: "Me" as const, text }],
        }
      : conversation,
  );

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
        }
      : conversation,
  );

  writeConversations(next);
  return next.find((conversation) => conversation.id === id) ?? null;
}
