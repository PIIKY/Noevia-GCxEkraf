# NOEVIA — ARCHITECTURE & FULL SYSTEM AUDIT REPORT (`AUDIT_REPORT.md`)

**Date:** November 2026  
**Application:** Noevia — AI Business Consultant for Aspiring Entrepreneurs & UMKM Owners  
**Audit Scope:** Phases 1–7 (Architecture, Frontend UX, Backend API, Security Hardening, Multi-User Data Isolation, Animations, and Automated Verification)

---

## 1. Architecture Summary

- **Frontend Stack:** React 19 + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons, custom monochrome design tokens (`src/index.css`).
- **Backend Stack:** Express (`server.ts`) serving both `/api/*` JSON routes and Vite SPA middleware in development or static `dist/` assets in production on port `3000`.
- **AI Engine Integration:** Server-side `@google/genai` SDK (`^2.32.0`) using model `gemini-3.8-flash` with `User-Agent: aistudio-build`, Structured Outputs (`responseSchema`), Google Search Grounding (`googleSearch`), URL Context inspection (`urlContext`), and deterministic Knowledge Base (`KB-01`..`KB-06`) + financial/operational calculators fallback.
- **Database & Authentication:** Firebase Authentication (Google Sign-In) + Cloud Firestore (`firebase-applet-config.json`, `firestore.rules`, `firebase-blueprint.json`) with per-user subcollections (`/users/{userId}/consultations/{consultationId}` and `/users/{userId}/generatedDocuments/{docId}`), plus UID-scoped `localStorage` isolation (`noevia_consultations_v3_uid_<uid>` vs `noevia_consultations_v3_guest`).
- **Deliverable Generation:** Client/Server-verified consulting report synthesis (`src/lib/reportSynthesisEngine.ts`, `src/lib/documentGenerator.ts`) producing structured PDF (print-ready consulting report), DOCX (`word/document.xml`), XLSX (`SpreadsheetML`), and CSV deliverables.

---

## 2. Route & View Inventory

| Route / View Key | Component | Access Scope | Status |
| :--- | :--- | :--- | :--- |
| `home` (Landing Page) | `src/components/LandingView.tsx` | Public / Authenticated | Verified & Hardened |
| `workspace` (Consultation Chat & Deliverables) | `src/components/ConsultationWorkspace.tsx` | Scoped to active session owner | Verified & Hardened |
| `history` (My Consultations / Konsultasi Saya) | `src/components/MyConsultationsView.tsx` | Private to current UID / Guest session | Verified & Hardened |
| `knowledge` (Business Learning Center) | `src/components/KnowledgeBaseView.tsx` | Shared Read-Only (`KB-01..KB-06` + 9-section articles) | Verified & Hardened |
| `guides` (Tips, Guides & FAQ) | `src/components/TipsAndGuidesView.tsx` | Shared Read-Only | Verified & Hardened |
| `settings` (Settings & Privacy) | `src/components/SettingsView.tsx` | User Preferences + Data Privacy Summary | Verified & Hardened |
| `admin` (`?admin=1` / `#admin`) | `src/components/AdminToolsView.tsx` | Separated Internal Admin / Developer Route | Verified & Hardened |

### Backend API Endpoints (`server.ts`)
- `GET /api/health` — Server and Gemini configuration health status.
- `POST /api/consultation/discovery` — Conversational discovery turn with context extraction, KB retrieval, URL inspection, and Search Grounding.
- `POST /api/consultation/analyze` — Structured business diagnosis, possible causes, prioritized recommendations, and 7-day action plan.
- `POST /api/consultation/continue` — Follow-up consultation Q&A and dynamic 7-day action plan adaptation.
- `POST /api/consultation/inspect-url` — Public URL inspection with SSRF protection.
- `POST /api/consultation/document-access` — Server-side verification of private generated document ownership.

---

## 3. Broken or Incomplete Features Found & Remediated

1. **Knowledge Base Article Section 8 & Section 9 Non-Interactive Cards (Fixed):**
   - *Finding:* In `KnowledgeBaseView.tsx`, Section 8 (`8. Materi & Sumber Terkait`) and Section 9 (`9. Referensi Sumber Knowledge Base`) previously rendered static `<div>` elements without click handlers.
   - *Fix:* Converted both sections into interactive `<button type="button">` cards with keyboard focus styles, hover feedback, and `ExternalLink` indicators. Clicking Section 8 navigates directly to the linked Guide in `TipsAndGuidesView.tsx`, opens the related article, or pre-fills a consultation topic; clicking Section 9 opens an interactive modal displaying the full source excerpt and metadata from `KB-01..KB-06`.
2. **Firestore `createdAt` Immutability on Subsequent Sync Updates (Fixed):**
   - *Finding:* `firestore.rules` enforces `incoming().createdAt == existing().createdAt` on `allow update`. Calling `setDoc(..., { merge: true })` with a newly generated timestamp on an already-created document could trigger a permission error on subsequent updates.
   - *Fix:* Updated `src/lib/firebase.ts` to track created document paths and use `updateDoc` (omitting `createdAt` and preserving `userId`/`ownerId`) when updating existing consultation or document records.
3. **Homepage Empty/Whitespace Input & Transition Polish (Fixed):**
   - *Finding:* Pressing Enter on whitespace-only text on the Landing Page silently ignored input without user feedback, and transitioning to the workspace was abrupt.
   - *Fix:* Added explicit bilingual validation alerts (`validationAlert`), a 5,000-character ceiling check, duplicate-submission locking (`isTransitioning`), and a smooth 180ms fade/translate transition that preserves the initial user message.

---

## 4. Security Issues Found & Remediated

1. **Server-Side Request Forgery (SSRF) Risk on URL Inspection (Fixed):**
   - *Fix:* Implemented `validateSafeExternalUrl` and `filterSafeExternalUrls` in `src/lib/securityHardening.ts` and enforced them on `/api/consultation/inspect-url` and automatic URL extraction. Blocks `localhost`, `127.0.0.1`, `0.0.0.0`, IPv6 loopback, RFC1918 private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local cloud metadata (`169.254.169.254`, `metadata.google.internal`), embedded credentials, and non-HTTP(S) protocols (`file:`, `javascript:`, `data:`).
2. **Backend API Cross-User Consultation & Document Ownership Enforcement (Fixed):**
   - *Fix:* Added `validateConsultationRequest` across all `/api/consultation/*` endpoints and added `/api/consultation/document-access` so requests where `x-user-id` / `actingUserId` does not match `consultation.userId` or `document.ownerId` are rejected with HTTP `403`.
3. **Prompt Injection & Untrusted Content Delimiting (Fixed):**
   - *Fix:* Added `sanitizeUntrustedPromptInput` and `wrapUntrustedBlock` (`<untrusted_user_input>`, `<untrusted_kb_reference>`, `<untrusted_url_context>`) in `server.ts` and `MASTER_SYSTEM_INSTRUCTION`, plus `sanitizeDisplayText` on all model outputs.
4. **Admin Document Upload Validation (Fixed):**
   - *Fix:* Wired `validateUploadedDocumentFile` in `AdminToolsView.tsx` to enforce a 2 MB maximum size, `.pdf`/`.csv`/`.txt` extension and MIME allowlist, path traversal rejection (`..`, `/`, `\`), and script/HTML payload rejection.
5. **Rate Limiting & Security Headers (Fixed):**
   - *Fix:* Added `RequestRateLimiter` (sliding-window rate limit + concurrency guard returning HTTP `429`) and HTTP security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, strict CORS) in `server.ts`.
