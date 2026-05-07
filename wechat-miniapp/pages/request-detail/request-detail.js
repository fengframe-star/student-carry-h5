const { createOrOpenConversation, getSubmissions } = require("../../utils/storage");

Page({
  data: {
    request: null
  },

  async onLoad(options) {
    wx.showLoading({ title: "Loading" });
    try {
      const submissions = await getSubmissions();
      const request = submissions.find((item) => item.type === "request" && item._id === options.id);
      this.setData({ request: request || null });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack();
  },

  contactNow() {
    const request = this.data.request;
    if (!request) {
      return;
    }

    const conversation = createOrOpenConversation({
      postType: "request",
      postId: request._id,
      otherUserName: request.name || "Post owner",
      item: request.itemName || "Item",
      route: `${request.fromLocation || "From"} → ${request.toLocation || "To"}`,
      reward: `€${request.budgetEur || 0}`,
      status: "Negotiating"
    });
    wx.navigateTo({ url: `/pages/chat/chat?id=${conversation.id}` });
  }
});
