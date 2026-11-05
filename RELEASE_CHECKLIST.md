# NOEVIA — FINAL PRODUCTION RELEASE CHECKLIST (`RELEASE_CHECKLIST.md`)

**Date:** November 2026  
**Release Target:** Noevia 2.0 (Hardened Production Release)

---

## 1. Build, Type Safety & Linting

- [x] `compile_applet` (`npm run build` — Vite production bundle) succeeds with 0 errors.
- [x] `lint_applet` (`npm run lint` — `tsc --noEmit`) succeeds with 0 TypeScript or missing-import errors.
- [x] `npx tsx --test src/lib/consultationEngine.test.ts` passes 21/21 unit and HTTP security integration tests.

## 2. Security & Multi-User Privacy

- [x] `GEMINI_API_KEY` is used strictly server-side in `server.ts` and never bundled into client assets.
- [x] `firestore.rules` is deployed and enforces strict per-UID ownership on `/users/{userId}/consultations/{consultationId}` and `/users/{userId}/generatedDocuments/{docId}` with immutable `userId`, `ownerId`, and `createdAt`.
- [x] All `/api/consultation/*` endpoints validate request schemas, message length ceilings (`5,000` chars), and consultation/document ownership (`HTTP 403` on cross-user access).
- [x] `/api/consultation/inspect-url` and automatic URL extraction enforce `validateSafeExternalUrl` SSRF protection (blocking `localhost`, `127.0.0.1`, `169.254.169.254`, private RFC1918 subnets, and non-HTTP schemes).
- [x] Prompt injection defenses (`<untrusted_user_input>`, `<untrusted_kb_reference>`, `<untrusted_url_context>`) and output XSS sanitization (`sanitizeDisplayText`) are active.
- [x] Admin document uploads enforce a 2 MB size limit, `.pdf`/`.csv`/`.txt` allowlist, and path traversal prevention.
- [x] Sliding-window rate limiting (`RequestRateLimiter`) and HTTP security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) are active on all API responses.

## 3. Product Experience & User Journeys

- [x] **Homepage (`LandingView.tsx`):** Clean monochrome layout, single top-left brand logo, empty-input validation alert, duplicate-submit prevention, smooth 180ms transition into consultation workspace, and bottom-right `ID | EN` selector.
- [x] **Consultation Workspace (`ConsultationWorkspace.tsx`):** Natural discovery flow, Business Understanding Confirmation, 5-part structured analysis, 7-day interactive action plan, deterministic financial/operational calculators, and non-duplicating `Coba Lagi` retry recovery.
- [x] **Business Learning Center (`KnowledgeBaseView.tsx`):** 6 UMKM categories, 9-section educational articles, interactive **Section 8 (`Materi & Sumber Terkait`)** navigation, and interactive **Section 9 (`Referensi Sumber Knowledge Base`)** source excerpt modal.
- [x] **Tips, Guides & FAQ (`TipsAndGuidesView.tsx`):** 6 practical guides, searchable FAQ accordions, and direct consultation deep-linking.
- [x] **Settings & Privacy (`SettingsView.tsx`):** Working Light/Dark/System theme selector, `ID | EN` interface language selector, and transparent Data Privacy & Isolation summary (with Admin Tools cleanly separated to `?admin=1`).
- [x] **Accessibility & Motion (`src/index.css`):** Subtle 180–260ms fade/translate animations with full `@media (prefers-reduced-motion: reduce)` support.
