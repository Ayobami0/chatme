# Feature checklist

A service method existing doesn't make a feature complete. Each row tracks the four layers separately. Controls for features that aren't complete are hidden in the UI.

✅ done · 🟡 partial · ❌ missing · — not applicable

| Feature | API method | State handling | UI interaction | Failure recovery | Notes |
|---|---|---|---|---|---|
| Remove direct chat (for me) | ✅ | ✅ | ✅ | ✅ | Confirmed; reports partial failures |
| Delete group (owner) / leave group | ✅ | ✅ | ✅ | ✅ | Action picked by `getRemovalAction` |
| Pin / archive / mute (list) | ✅ | ✅ | ✅ | ✅ | Real outcome toasts; failed items stay selected |
| Mute (chat info switch) | ✅ | ✅ | ✅ | 🟡 | Reverts on failure; no error toast |
| Send text message | ✅ | ✅ | ✅ | ✅ | Persisted outbox, retry, restart resume |
| Send image (recent photos) | ✅ | ✅ | 🟡 | ✅ | Upload metadata fixed in Phase 6; picker/camera hidden |
| Documents / audio / video | ✅ | ❌ | ❌ | ❌ | "Document" action hidden |
| Message history paging | ✅ | ✅ | ✅ | 🟡 | Older-page errors are not surfaced yet |
| Read receipts (outgoing) | ✅ | ✅ | — | 🟡 | Marked on focus/foreground/new incoming message |
| Typing indicators | ✅ | ✅ | ✅ | — | Throttled start, idle/blur/send/unmount stop |
| Presence | ✅ | ✅ | ✅ | — | Direct chats only |
| Block contact | ✅ | ❌ | ❌ | ❌ | Row hidden |
| Message reactions / editing / deletion | ✅ | ❌ | ❌ | ❌ | Not exposed |
| Chat info: photos, starred, links | 🟡 | ❌ | ❌ | ❌ | Rows (with hardcoded counts) hidden |
| Voice / video calls | ❌ | ❌ | ❌ | ❌ | Header buttons hidden |
| Group description | ❌ | ❌ | ❌ | ❌ | Not in create/update DTOs; field hidden |
| Avatar upload (profile) | ✅ | 🟡 | 🟡 | ❌ | Phase 6 |
| PIN lock | ❌ | ❌ | 🟡 | ❌ | Phase 7: hide until implemented |
| Push notifications | ✅ | ❌ | ❌ | ❌ | Phase 8 |
