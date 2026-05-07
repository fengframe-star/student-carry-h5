const { createOrOpenConversation, getSubmissions } = require("../../utils/storage");

Page({
  data: {
    carry: null
  },

  async onLoad(options) {
    wx.showLoading({ title: "Loading" });
    try {
      const submissions = await getSubmissions();
      const carry = submissions.find((item) => item.type === "carrier" && item._id === options.id);
      this.setData({ carry: carry || null });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack();
  },

  contactNow() {
    const carry = this.data.carry;
    if (!carry) {
      return;
    }

    const conversation = createOrOpenConversation({
      postType: "carry",
      postId: carry._id,
      otherUserName: carry.name || "Post owner",
      item: carry.availableLuggageSpace || "Carry space",
      route: carry.travelRoute || "Route pending",
      reward: carry.expectedReward || "Reward pending",
      status: "Negotiating"
    });
    wx.navigateTo({ url: `/pages/chat/chat?id=${conversation.id}` });
  }
});
