const { getSubmissions, updateSubmissionDate } = require("../../utils/storage");

Page({
  data: {
    loggedIn: false,
    requests: [],
    carriers: []
  },

  onShow() {
    const loggedIn = Boolean(wx.getStorageSync("studentCarryLoggedIn"));
    this.setData({ loggedIn });
    if (loggedIn) {
      this.loadMyPosts();
    }
  },

  goRegister() {
    wx.navigateTo({ url: "/pages/register/register" });
  },

  loginDemo() {
    wx.setStorageSync("studentCarryLoggedIn", true);
    this.setData({ loggedIn: true });
    this.loadMyPosts();
    wx.showToast({ title: "Logged in", icon: "success" });
  },

  logout() {
    wx.removeStorageSync("studentCarryLoggedIn");
    this.setData({ loggedIn: false, requests: [], carriers: [] });
  },

  async loadMyPosts() {
    wx.showLoading({ title: "Loading" });
    try {
      const submissions = await getSubmissions();
      this.setData({
        requests: submissions.filter((item) => item.type === "request"),
        carriers: submissions.filter((item) => item.type === "carrier")
      });
    } catch (error) {
      wx.showToast({ title: "Load failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  async onDateChange(event) {
    const { id, field } = event.currentTarget.dataset;
    const value = event.detail.value;

    wx.showLoading({ title: "Saving" });
    try {
      await updateSubmissionDate(id, field, value);
      await this.loadMyPosts();
      wx.showToast({ title: "Saved", icon: "success" });
    } catch (error) {
      wx.showToast({ title: "Save failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  }
});
