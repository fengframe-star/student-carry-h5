# Bug Fix Log

## 2026-05-14

### Mobile Session Identity Drift
- **Issue:** Real phones could show stale unread dots, delayed match state, or inconsistent message direction even when local desktop testing looked correct.
- **Cause:** Realtime hydration mixed CloudBase auth uid with local profile/current-owner fallbacks during message and conversation normalization.
- **Fix:** Passed the active CloudBase viewer uid through message reads, conversation reads, conversation list sync, unread sync, and chat detail rendering.
- **Verification:** `npm run build` and `npm run test:mobile` pass.

### Mobile Match State Realtime Lag
- **Issue:** `Request Match`, `Accept Match`, and `Cancel Match` could require refresh/re-entry on mobile before the other user saw the new state.
- **Cause:** Conversation detail realtime listener watched a fragile `_id` query and match action buttons had no per-chat pending guard for rapid mobile taps.
- **Fix:** Switched conversation detail watch to the stable `id` field, preserved polling fallback, and added per-chat pending disabled state for match/cancel actions.
- **Verification:** `npm run build` and `npm run test:mobile` pass.

### CloudBase Static Hosting Stale Bundle Risk
- **Issue:** After deploy, mobile browsers could continue loading old entry HTML and stale JS/CSS, leaving old state logic active.
- **Cause:** SPA entry/fallback pages had no cache-busting hints at the HTML level.
- **Fix:** Added no-cache meta hints to `index.html` and `public/404.html`; Vite hashed assets remain responsible for long-lived JS/CSS cache safety.
- **Verification:** `npm run build` and `npm run test:mobile` pass.

### Mobile Regression Coverage
- **Issue:** Build success alone did not catch mobile data-flow regressions.
- **Fix:** Added `npm run test:mobile`, a static mobile regression script that checks uid-based normalization, receiver-scoped unread state, message-list visibility rules, listener fallback, match-action race guards, and stale-cache protections.
- **Verification:** `npm run test:mobile` passes.

### Chat Sync And Unread State
- **Issue:** Sender could see a sent message locally, but the receiver did not reliably receive it.
- **Cause:** Some chat identity paths could still derive user identity from local profile fields rather than CloudBase auth uid.
- **Fix:** Standardized `senderId`, `receiverId`, `participantIds`, and post `ownerId` around CloudBase auth uid.
- **Verification:** `npm run build` passes.

### Realtime Listener Failure
- **Issue:** Mobile browser could show `SDK_DATABASE_REALTIME_LISTENER_WEBSOCKET_CONNECTION_ERROR`.
- **Cause:** Realtime websocket listener errors were surfaced too directly and had no graceful fallback.
- **Fix:** Wrapped conversation/message/unread listeners in guarded setup with polling fallback.
- **Verification:** `npm run build` passes.

### Message List Auto-Creation
- **Issue:** Opening an order/chat could make a conversation appear in the message list before any real message existed.
- **Cause:** Conversation records were prepared before a message was sent, and list filtering only checked broad conversation visibility.
- **Fix:** Message list now only shows conversations with `hasMessages` or `MATCHED` status.
- **Verification:** `npm run build` passes.

### Match State Delay
- **Issue:** After `Request Match`, the other user did not immediately see `Accept Match` without refresh/re-enter.
- **Cause:** Chat detail listened to messages but not the conversation document that stores match state.
- **Fix:** Added conversation-level realtime subscription/fallback polling for Chat detail.
- **Verification:** `npm run build` passes.

### User-Specific Unread
- **Issue:** Unread state could behave like a global conversation flag.
- **Cause:** Conversation documents had broad unread fields, while actual read state should be per message and per user.
- **Fix:** Unread dot is based on messages where `receiverId` is current user and current uid is absent from `readByUserIds`; entering chat marks only current user's unread messages as read.
- **Verification:** `npm run build` passes.

### Market Matched Visibility
- **Issue:** Matched cards did not clearly show matched state and old posts could stay visible too long or disappear too early.
- **Fix:** Matched cards are semi-transparent, show `MATCHED`, block new contact, remain visible for 7 days after matching, and open posts hide 48 hours after their date.
- **Verification:** `npm run build` passes.

### Removed Legacy Status Semantics
- **Issue:** Some helper logic still treated `Closed` or `Completed` as matched.
- **Fix:** Status helper now treats only `Matched` as matched; public UI uses `OPEN`, `PENDING`, and `MATCHED`.
- **Verification:** `npm run build` passes.
