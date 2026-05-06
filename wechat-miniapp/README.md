# Student Carry WeChat Mini Program MVP

Open this `wechat-miniapp` folder in WeChat DevTools.

The MVP uses WeChat Cloud Database when `wx.cloud` is available. Before production, create these collections in Cloud Development:

- `submissions`
- `registrations`

If cloud development is not enabled, submissions are saved to local storage so the prototype can still be previewed.

This mini program does not collect passport numbers or ID documents at MVP stage. Identity verification may be introduced later through a trusted third-party provider.
