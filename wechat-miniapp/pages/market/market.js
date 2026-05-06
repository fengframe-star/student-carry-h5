const { getSubmissions } = require("../../utils/storage");

Page({
  data: {
    activeType: "request",
    requests: [],
    carriers: []
  },

  onShow() {
    this.loadListings();
  },

  setType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  async loadListings() {
    wx.showLoading({ title: "Loading" });
    try {
      const submissions = await getSubmissions();
      this.setData({
        requests: submissions
          .filter((item) => item.type === "request")
          .map((item) => ({
            ...item,
            fromLocation: item.fromLocation || "From",
            toLocation: item.toLocation || "To",
            itemName: item.itemName || "Item",
            desiredDeliveryDate: item.desiredDeliveryDate || "Date pending",
            budgetEur: item.budgetEur || 0
          })),
        carriers: submissions
          .filter((item) => item.type === "carrier")
          .map((item) => ({
            ...item,
            travelRoute: item.travelRoute || "Route pending",
            availableLuggageSpace: item.availableLuggageSpace || "Space pending",
            travelDate: item.travelDate || "Date pending",
            expectedReward: item.expectedReward || "Reward pending"
          }))
      });
    } catch (error) {
      wx.showToast({ title: "Load failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  }
});
