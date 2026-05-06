const { addSubmission } = require("../../utils/storage");

Page({
  data: {
    travelDate: "",
    agreed: false
  },

  onTravelDateChange(event) {
    this.setData({ travelDate: event.detail.value });
  },

  toggleAgreed() {
    this.setData({ agreed: !this.data.agreed });
  },

  async submitForm(event) {
    const values = event.detail.value;
    const required = [
      "name",
      "contact",
      "travelRoute",
      "availableLuggageSpace",
      "expectedReward"
    ];
    const missing = required.some((field) => !values[field]);

    if (missing || !this.data.travelDate) {
      wx.showToast({ title: "Please complete required fields", icon: "none" });
      return;
    }

    if (!this.data.agreed) {
      wx.showToast({ title: "Please agree to rules", icon: "none" });
      return;
    }

    wx.showLoading({ title: "Submitting" });
    try {
      await addSubmission({
        type: "carrier",
        name: values.name,
        contact: values.contact,
        travelRoute: values.travelRoute,
        travelDate: this.data.travelDate,
        availableLuggageSpace: values.availableLuggageSpace,
        expectedReward: values.expectedReward,
        notes: values.notes || "",
        agreement: true
      });
      wx.showToast({ title: "Submitted", icon: "success" });
      setTimeout(() => wx.switchTab({ url: "/pages/my/my" }), 600);
    } catch (error) {
      wx.showToast({ title: "Submit failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  }
});
