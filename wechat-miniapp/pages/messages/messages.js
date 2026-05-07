const { getConversations } = require("../../utils/storage");

Page({
  data: {
    activeCard: 0,
    cards: [
      {
        titleCn: "改价协商",
        titleEn: "Price negotiation",
        bodyCn: "讨论预算、报酬、押金或补偿方式。",
        bodyEn: "Discuss budget, reward, deposit, or compensation details."
      },
      {
        titleCn: "交接地点",
        titleEn: "Exchange location",
        bodyCn: "约定校园、车站、机场或其他可信线下地点。",
        bodyEn: "Agree on a trusted offline place such as campus, station, or airport."
      },
      {
        titleCn: "交易时间确认",
        titleEn: "Exchange time confirmation",
        bodyCn: "确认到达时间、交接窗口和延误处理方式。",
        bodyEn: "Confirm arrival time, handoff window, and delay handling."
      }
    ],
    displayCards: [],
    conversations: []
  },

  onLoad() {
    this.updateDisplayCards();
  },

  onShow() {
    this.setData({ conversations: getConversations() });
    this.startCarousel();
  },

  onHide() {
    this.stopCarousel();
  },

  onUnload() {
    this.stopCarousel();
  },

  startCarousel() {
    this.stopCarousel();
    this.timer = setInterval(() => {
      this.setData({ activeCard: (this.data.activeCard + 1) % this.data.cards.length });
      this.updateDisplayCards();
    }, 2000);
  },

  stopCarousel() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  setCard(event) {
    this.setData({ activeCard: Number(event.currentTarget.dataset.index) });
    this.updateDisplayCards();
    this.startCarousel();
  },

  updateDisplayCards() {
    this.setData({
      displayCards: this.data.cards.map((card, index) => ({
        ...card,
        originalIndex: index,
        position: (index - this.data.activeCard + this.data.cards.length) % this.data.cards.length
      }))
    });
  },

  openChat(event) {
    wx.navigateTo({ url: `/pages/chat/chat?id=${event.currentTarget.dataset.id}` });
  }
});
