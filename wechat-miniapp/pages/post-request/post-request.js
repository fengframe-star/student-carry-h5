const { addSubmission } = require("../../utils/storage");

Page({
  data: {
    shippingOptions: ["Yes / 是", "No / 否", "Not sure / 不确定"],
    shippingIndex: 2,
    desiredDeliveryDate: "",
    confirmed: false
  },

  onDeliveryDateChange(event) {
    this.setData({ desiredDeliveryDate: event.detail.value });
  },

  onShippingChange(event) {
    this.setData({ shippingIndex: Number(event.detail.value) });
  },

  toggleConfirmed() {
    this.setData({ confirmed: !this.data.confirmed });
  },

  requestPaymentPlaceholder(submission) {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: "支付待接入 / Payment pending",
        content: `当前为 MVP 测试环境，无法使用游客 AppID 直接支付。正式版将为预算 €${submission.budgetEur} 拉起微信支付。`,
        confirmText: "继续保存",
        cancelText: "取消",
        success(result) {
          if (result.confirm) {
            resolve();
          } else {
            reject(new Error("Payment cancelled"));
          }
        },
        fail: reject
      });
    });
  },

  async submitForm(event) {
    const values = event.detail.value;
    const required = [
      "name",
      "contact",
      "fromLocation",
      "toLocation",
      "itemName",
      "estimatedValueEur",
      "budgetEur"
    ];
    const missing = required.some((field) => !values[field]);

    if (missing || !this.data.desiredDeliveryDate) {
      wx.showToast({ title: "Please complete required fields", icon: "none" });
      return;
    }

    if (!this.data.confirmed) {
      wx.showToast({ title: "Please confirm item rules", icon: "none" });
      return;
    }

    wx.showLoading({ title: "Submitting" });
    try {
      const submission = {
        type: "request",
        name: values.name,
        contact: values.contact,
        fromLocation: values.fromLocation,
        toLocation: values.toLocation,
        itemName: values.itemName,
        estimatedValueEur: Number(values.estimatedValueEur),
        desiredDeliveryDate: this.data.desiredDeliveryDate,
        budgetEur: Number(values.budgetEur),
        chinaDomesticShipping: this.data.shippingOptions[this.data.shippingIndex],
        notes: values.notes || "",
        confirmation: true
      };

      wx.hideLoading();
      await this.requestPaymentPlaceholder(submission);
      wx.showLoading({ title: "Saving" });
      await addSubmission(submission);
      wx.showToast({ title: "Saved", icon: "success" });
      setTimeout(() => wx.switchTab({ url: "/pages/my/my" }), 600);
    } catch (error) {
      if (error.message !== "Payment cancelled") {
        wx.showToast({ title: "Submit failed", icon: "none" });
      }
    } finally {
      wx.hideLoading();
    }
  }
});
