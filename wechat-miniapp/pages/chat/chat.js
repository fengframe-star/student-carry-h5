const {
  appendConversationMessage,
  getConversation,
  markConversationRead
} = require("../../utils/storage");

Page({
  data: {
    conversation: null,
    draft: ""
  },

  onLoad(options) {
    this.id = options.id;
    markConversationRead(this.id);
    this.setData({ conversation: getConversation(this.id) });
  },

  goBack() {
    wx.navigateBack();
  },

  onDraftInput(event) {
    this.setData({ draft: event.detail.value });
  },

  sendMessage() {
    const text = this.data.draft.trim();
    if (!text || !this.data.conversation) {
      return;
    }

    const conversation = appendConversationMessage(this.data.conversation.id, text);
    this.setData({ conversation, draft: "" });
  }
});
