const { getSubmissions } = require("../../utils/storage");
const {
  anyOption,
  countryNames,
  getCities,
  routeMatchesFilters
} = require("../../utils/cities");

const searchCountries = [anyOption, ...countryNames];

Page({
  data: {
    activeType: "request",
    searchCountries,
    fromCountryIndex: 0,
    fromCityOptions: [anyOption],
    fromCityIndex: 0,
    toCountryIndex: 0,
    toCityOptions: [anyOption],
    toCityIndex: 0,
    allRequests: [],
    allCarriers: [],
    allPosts: [],
    requests: [],
    carriers: []
  },

  onShow() {
    this.loadListings();
  },

  setType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  goRequestDetail(event) {
    wx.navigateTo({ url: `/pages/request-detail/request-detail?id=${event.currentTarget.dataset.id}` });
  },

  goCarryDetail(event) {
    wx.navigateTo({ url: `/pages/carry-detail/carry-detail?id=${event.currentTarget.dataset.id}` });
  },

  goPostDetail(event) {
    const { id, type } = event.currentTarget.dataset;
    wx.navigateTo({
      url: type === "request"
        ? `/pages/request-detail/request-detail?id=${id}`
        : `/pages/carry-detail/carry-detail?id=${id}`
    });
  },

  onFromCountryChange(event) {
    const fromCountryIndex = Number(event.detail.value);
    const country = this.data.searchCountries[fromCountryIndex];
    this.setData({
      fromCountryIndex,
      fromCityOptions: country === anyOption ? [anyOption] : [anyOption, ...getCities(country)],
      fromCityIndex: 0
    });
    this.applyFilters();
  },

  onFromCityChange(event) {
    this.setData({ fromCityIndex: Number(event.detail.value) });
    this.applyFilters();
  },

  onToCountryChange(event) {
    const toCountryIndex = Number(event.detail.value);
    const country = this.data.searchCountries[toCountryIndex];
    this.setData({
      toCountryIndex,
      toCityOptions: country === anyOption ? [anyOption] : [anyOption, ...getCities(country)],
      toCityIndex: 0
    });
    this.applyFilters();
  },

  onToCityChange(event) {
    this.setData({ toCityIndex: Number(event.detail.value) });
    this.applyFilters();
  },

  clearSearch() {
    this.setData({
      fromCountryIndex: 0,
      fromCityOptions: [anyOption],
      fromCityIndex: 0,
      toCountryIndex: 0,
      toCityOptions: [anyOption],
      toCityIndex: 0
    });
    this.applyFilters();
  },

  applyFilters() {
    const fromCountry = this.data.searchCountries[this.data.fromCountryIndex];
    const fromCity = this.data.fromCityOptions[this.data.fromCityIndex];
    const toCountry = this.data.searchCountries[this.data.toCountryIndex];
    const toCity = this.data.toCityOptions[this.data.toCityIndex];

    const requests = this.data.allRequests.filter((item) =>
      routeMatchesFilters(`${item.fromLocation} ${item.toLocation}`, fromCountry, fromCity, toCountry, toCity)
    );
    const carriers = this.data.allCarriers.filter((item) =>
      routeMatchesFilters(item.travelRoute, fromCountry, fromCity, toCountry, toCity)
    );

    this.setData({
      requests,
      carriers,
      allPosts: [...requests, ...carriers].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    });
  },

  async loadListings() {
    wx.showLoading({ title: "Loading" });
    try {
      const submissions = await getSubmissions();
      const allRequests = submissions
        .filter((item) => item.type === "request")
        .map((item) => ({
          ...item,
          fromLocation: item.fromLocation || "From",
          toLocation: item.toLocation || "To",
          itemName: item.itemName || "Item",
          desiredDeliveryDate: item.desiredDeliveryDate || "Date pending",
          budgetEur: item.budgetEur || 0,
          displayRoute: `${item.fromLocation || "From"} → ${item.toLocation || "To"}`,
          displayMain: item.itemName || "Item",
          displayMeta: `${item.itemCategory || "Others"} · ${item.desiredDeliveryDate || "Date pending"}`,
          displayReward: `€${item.budgetEur || 0}`
        }));
      const allCarriers = submissions
        .filter((item) => item.type === "carrier")
        .map((item) => ({
          ...item,
          travelRoute: item.travelRoute || "Route pending",
          availableLuggageSpace: item.availableLuggageSpace || "Space pending",
          travelDate: item.travelDate || "Date pending",
          expectedReward: item.expectedReward || "Reward pending",
          displayRoute: item.travelRoute || "Route pending",
          displayMain: item.availableLuggageSpace || "Space pending",
          displayMeta: `${item.travelDate || "Date pending"} · ${(item.acceptedItemTypes || ["Flexible"]).join ? (item.acceptedItemTypes || ["Flexible"]).join(", ") : item.acceptedItemTypes || "Flexible"}`,
          displayReward: item.expectedReward || "Reward pending"
        }));

      this.setData({
        allRequests,
        allCarriers,
        allPosts: []
      });
      this.applyFilters();
    } catch (error) {
      wx.showToast({ title: "Load failed", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  }
});
