const { addSubmission, createOrOpenConversation, getSubmissions } = require("../../utils/storage");
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
    itemCategories: ["Documents", "Clothes", "Cosmetics", "Electronics", "Gifts", "Food", "Medicine (restricted)", "Others"],
    itemCategoryIndex: 0,
    travelDate: "",
    agreed: false,
    matchingRequests: [],
    pendingSubmission: null,
    showingMatches: false
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

  onItemCategoryChange(event) {
    this.setData({ itemCategoryIndex: Number(event.detail.value) });
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

    const submission = {
      createdAt: Date.now(),
      type: "carrier",
      name: values.name,
      contact: "Platform messaging",
      travelRoute: `${this.data.fromCityOptions[this.data.fromCityIndex]} → ${this.data.toCityOptions[this.data.toCityIndex]}`,
      travelDate: this.data.travelDate,
      availableLuggageSpace: values.availableLuggageSpace,
      acceptedItemTypes: [this.data.itemCategories[this.data.itemCategoryIndex]],
      expectedReward: values.expectedReward,
      notes: values.notes || "",
      agreement: true
    };

    wx.showLoading({ title: "Matching" });
    try {
      const submissions = await getSubmissions();
      const matchingRequests = submissions
        .filter((item) => item.type === "request")
        .map((request) => ({
          ...request,
          matchScore: scoreRequestForCarrier(request, submission)
        }))
        .filter((request) => request.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

      this.setData({
        pendingSubmission: submission,
        matchingRequests,
        showingMatches: true
      });
    } catch (error) {
      wx.showToast({ title: "Match failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  async publishPendingCarry() {
    const submission = this.data.pendingSubmission;
    if (!submission) return;

    wx.showLoading({ title: "Submitting" });
    try {
      await addSubmission(submission);
      wx.showToast({ title: "Submitted", icon: "success" });
      setTimeout(() => wx.switchTab({ url: "/pages/market/market" }), 600);
    } catch (error) {
      wx.showToast({ title: "Submit failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  contactRequestUser() {
    const request = this.data.matchingRequests[0];
    if (!request) {
      wx.showToast({ title: "No matching request", icon: "none" });
      return;
    }

    const conversation = createOrOpenConversation({
      postType: "request",
      postId: request._id,
      otherUserName: request.name || "Requester",
      item: request.itemName || "Item",
      route: `${request.fromLocation || "From"} → ${request.toLocation || "To"}`,
      reward: `€${request.budgetEur || 0}`,
      status: "Negotiating"
    });

    wx.navigateTo({ url: `/pages/chat/chat?id=${conversation.id}` });
  }
});

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s/g, "").replace(/'/g, "");
}

function sameDate(a, b) {
  if (!a || !b) return false;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= 7 * 24 * 60 * 60 * 1000;
}

function scoreRequestForCarrier(request, carrier) {
  const route = normalize(carrier.travelRoute);
  const from = normalize(request.fromLocation);
  const to = normalize(request.toLocation);
  const category = request.itemCategory;
  let score = 0;

  if (route.includes(from) && route.includes(to)) score += 100;
  if (route.includes(to)) score += 45;
  if (route.includes(from)) score += 25;
  if (sameDate(request.desiredDeliveryDate, carrier.travelDate)) score += 20;
  if ((carrier.acceptedItemTypes || []).includes(category)) score += 15;

  return score;
}
