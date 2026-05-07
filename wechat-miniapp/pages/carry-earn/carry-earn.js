const { addSubmission } = require("../../utils/storage");
const { countryNames, getCities } = require("../../utils/cities");

Page({
  data: {
    countryNames,
    fromCountryIndex: 0,
    fromCityOptions: getCities(countryNames[0]),
    fromCityIndex: 0,
    toCountryIndex: 1,
    toCityOptions: getCities(countryNames[1]),
    toCityIndex: 0,
    travelDate: "",
    agreed: false
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: "/pages/market/market" });
    }
  },

  onFromCountryChange(event) {
    const fromCountryIndex = Number(event.detail.value);
    this.setData({
      fromCountryIndex,
      fromCityOptions: getCities(this.data.countryNames[fromCountryIndex]),
      fromCityIndex: 0
    });
  },

  onFromCityChange(event) {
    this.setData({ fromCityIndex: Number(event.detail.value) });
  },

  onToCountryChange(event) {
    const toCountryIndex = Number(event.detail.value);
    this.setData({
      toCountryIndex,
      toCityOptions: getCities(this.data.countryNames[toCountryIndex]),
      toCityIndex: 0
    });
  },

  onToCityChange(event) {
    this.setData({ toCityIndex: Number(event.detail.value) });
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
        contact: "Platform messaging",
        travelRoute: `${this.data.fromCityOptions[this.data.fromCityIndex]} → ${this.data.toCityOptions[this.data.toCityIndex]}`,
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
