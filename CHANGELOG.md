# Changelog

## 2026-05-14

### Added
- Added CloudBase-backed marketplace, conversation, message, and user profile flows.
- Added email/password and Mainland China phone/password login/register flows with CloudBase Auth.
- Added Terms of Service and Privacy Policy pages linked from registration.
- Added dark/light theme support with persisted preference.
- Added item photo upload previews for request posts and chat messages.
- Added marketplace listing detail pages with compact listing-style metadata.
- Added Match Info flow in chat: `OPEN`, `PENDING`, and `MATCHED`.
- Added contact exchange after both users confirm a match.
- Added unread indicators for message list and bottom navigation.

### Changed
- Market tabs default to `All`, with `Requests` and `Traveling` as filtered views.
- Message list now shows conversations only after a real message exists or after both users match.
- Matching recommendations now require correct country direction and only show scores of 80+ internally.
- My page now groups user-related matched orders and all user-owned posts.
- Request/Carry detail pages now hide chat actions for post owners and show edit/delete owner controls.
- Logo asset now uses transparent edges for better dark-mode rendering.

### Fixed
- Fixed mobile chat/session desync by normalizing conversation and message state with the active CloudBase auth uid instead of falling back to profile/local identity during realtime hydration.
- Fixed conversation detail realtime subscription to watch the stable conversation `id` field with polling fallback, improving Request Match / Accept Match / Cancel Match sync on mobile.
- Added mobile regression checks for conversation visibility, unread logic, listener fallback, match-action race guards, and stale bundle cache hints.
- Added no-cache hints to the app entry and SPA fallback pages to reduce CloudBase mobile browsers loading old JS/CSS after deploy.
- Fixed mobile date input width overflow.
- Fixed language switch open/close animation and outside-click behavior.
- Fixed light-mode contrast for form fields, navigation icons, and Home mockups.
- Fixed CloudBase realtime listener failure fallback by switching to polling when websocket sync fails.
- Fixed chat identity keys to use CloudBase auth uid only.
- Fixed unread message logic so self-sent messages do not create unread dots for the sender.
- Fixed matched post visibility rules in Market.
