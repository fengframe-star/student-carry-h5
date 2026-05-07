const { getSubmissions, updateSubmissionDate } = require("../../utils/storage");

Page({
  data: {
    submissions: [],
    requests: [],
    carriers: []
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: "/pages/my/my" });
    }
  },

  onShow() {
    this.loadSubmissions();
  },

  async loadSubmissions() {
    wx.showLoading({ title: "Loading" });
    try {
      const submissions = await getSubmissions();
      this.setData({
        submissions,
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
      await this.loadSubmissions();
      wx.showToast({ title: "Saved", icon: "success" });
    } catch (error) {
      wx.showToast({ title: "Save failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  }
});
