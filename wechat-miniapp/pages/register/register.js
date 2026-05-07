const { addRegistration } = require("../../utils/storage");

Page({
  data: {
    verificationOptions: ["Yes / 是", "No / 否"],
    verificationIndex: 0
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: "/pages/my/my" });
    }
  },

  onVerificationChange(event) {
    this.setData({ verificationIndex: Number(event.detail.value) });
  },

  async submitForm(event) {
    const values = event.detail.value;
    const required = [
      "fullName",
      "email",
      "messagingContact",
      "city",
      "schoolOrUniversity"
    ];
    const missing = required.some((field) => !values[field]);

    if (missing) {
      wx.showToast({ title: "Please complete required fields", icon: "none" });
      return;
    }

    wx.showLoading({ title: "Submitting" });
    try {
      await addRegistration({
        fullName: values.fullName,
        email: values.email,
        messagingContact: values.messagingContact,
        city: values.city,
        schoolOrUniversity: values.schoolOrUniversity,
        verificationLater: this.data.verificationOptions[this.data.verificationIndex]
      });
      wx.showToast({ title: "Submitted", icon: "success" });
      wx.setStorageSync("studentCarryLoggedIn", true);
      setTimeout(() => wx.switchTab({ url: "/pages/my/my" }), 600);
    } catch (error) {
      wx.showToast({ title: "Submit failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  }
});
