Page({
  goPost() {
    wx.navigateTo({ url: "/pages/post-request/post-request" });
  },

  goCarry() {
    wx.navigateTo({ url: "/pages/carry-earn/carry-earn" });
  },

  goMarket() {
    wx.switchTab({ url: "/pages/market/market" });
  },

  goMy() {
    wx.switchTab({ url: "/pages/my/my" });
  }
});
