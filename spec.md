# DesiTube

## Current State
- Video sharing platform with upload, comments, likes, subscribe, monetization (200 subscriber threshold)
- Channel pages with subscriber counts tracked on backend
- No live streaming or live chat feature

## Requested Changes (Diff)

### Add
- Live stream feature locked behind 30 subscribers
- Backend: startLiveStream, endLiveStream, getLiveStream, getAllLiveStreams, sendLiveChatMessage, getLiveChatMessages
- LiveStreamPage showing embedded video + live chat panel
- Go Live button on channel page (owner, 30+ subs only)
- Live badge on home page for active streams

### Modify
- ChannelPage: Go Live button for owners with 30+ subs
- HomePage: Live streams section at top
- App.tsx: Add /live/$principal route

### Remove
- Nothing

## Implementation Plan
1. Add live stream and live chat functions to main.mo
2. Add LiveStreamPage component
3. Update ChannelPage with Go Live button
4. Update HomePage with live section
5. Add route to App.tsx
