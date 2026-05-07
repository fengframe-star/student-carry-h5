Page({
  data: {
    activeStep: 0,
    steps: [
      {
        number: "01",
        titleCn: "发布需求",
        titleEn: "Post a request",
        bodyCn: "填写路线、物品类型、时间、预算并支付。",
        bodyEn: "Add route, item type, date, reward, and payment."
      },
      {
        number: "02",
        titleCn: "匹配顺路学生",
        titleEn: "Match with a student carrier",
        bodyCn: "选择合适的顺路学生并开始沟通。",
        bodyEn: "Choose a suitable carrier and start chatting."
      },
      {
        number: "03",
        titleCn: "线下交接确认",
        titleEn: "Confirm offline handover",
        bodyCn: "完成交接后确认订单状态。",
        bodyEn: "Confirm the order after the handover is completed."
      }
    ],
    displaySteps: []
  },

  onLoad() {
    this.updateDisplaySteps();
  },

  onShow() {
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
      this.setData({ activeStep: (this.data.activeStep + 1) % this.data.steps.length });
      this.updateDisplaySteps();
    }, 2000);
  },

  stopCarousel() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  setStep(event) {
    this.setData({ activeStep: Number(event.currentTarget.dataset.index) });
    this.updateDisplaySteps();
    this.startCarousel();
  },

  updateDisplaySteps() {
    this.setData({
      displaySteps: this.data.steps.map((step, index) => ({
        ...step,
        originalIndex: index,
        position: (index - this.data.activeStep + this.data.steps.length) % this.data.steps.length
      }))
    });
  },

  goPost() {
    wx.navigateTo({ url: "/pages/post-request/post-request" });
  },

  goCarry() {
    wx.navigateTo({ url: "/pages/carry-earn/carry-earn" });
  },

  goMarket() {
    wx.switchTab({ url: "/pages/market/market" });
  },

  goMy() {
    wx.switchTab({ url: "/pages/my/my" });
  }
});
