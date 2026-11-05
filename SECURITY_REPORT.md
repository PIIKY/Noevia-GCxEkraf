# NOEVIA — SECURITY & PRIVACY HARDENING REPORT (`SECURITY_REPORT.md`)

**Date:** November 2026  
**Application:** Noevia — AI Business Consultant  
**Status:** Verified & Hardened

---

## 1. Secrets & Environment Security (Phase 4A)

- **Server-Side Only Gemini API Key:** `GEMINI_API_KEY` is read exclusively inside `server.ts` (`process.env.GEMINI_API_KEY`).
- **Zero Client Exposure:** Verified via codebase inspection and production bundle build (`dist/`) that `@google/genai` and `GEMINI_API_KEY` are never imported or bundled into client-side code (`src/`).
- **Repository Hygiene:** `.env.example` contains only placeholder keys (`GEMINI_API_KEY="MY_GEMINI_API_KEY"`, `APP_URL="https://example.com"`). No private API keys or credentials are hardcoded in source files or markdown documentation.

---

## 2. Authentication, Multi-User Data Isolation & Access Control (Phases 4B, 4C, 4D)

- **Firestore Security Rules (`firestore.rules`):**
  - Deployed with default-deny fallback (`match /{document=**} { allow read, write: if false; }`).
  - Strictly isolates `/users/{userId}/consultations/{consultationId}` and `/users/{userId}/generatedDocuments/{docId}` using `isOwner(userId)`, schema validation, field-level bounds, and immutable `userId`, `ownerId`, and `createdAt` enforcement.
  - Shared `/knowledgeBase/{docId}` is read-only for standard users (`allow read: if true; allow write: if isAdmin();`).
- **Application & Storage Isolation (`src/lib/multiUserIsolation.ts`):**
  - Separate local storage namespaces per authenticated user (`noevia_consultations_v3_uid_<uid>`) and guest session (`noevia_consultations_v3_guest`).
  - Signing out clears the active consultation state and switches to the isolated guest namespace without leaking private user sessions.
- **Backend Endpoint Authorization (`server.ts` + `src/lib/securityHardening.ts`):**
  - Every POST endpoint (`/api/consultation/discovery`, `/api/consultation/analyze`, `/api/consultation/continue`, `/api/consultation/inspect-url`, `/api/consultation/document-access`) validates ownership via `validateConsultationRequest` and `canAccessGeneratedDocument`.
  - Cross-user access attempts (Account B attempting to read, analyze, continue, or download Account A's consultation or document) are deterministically rejected with HTTP `403 Forbidden`.

---

## 3. SSRF & External URL Protection (Phase 4E)

- Implemented `validateSafeExternalUrl` and `filterSafeExternalUrls` in `src/lib/securityHardening.ts`:
  - **Protocol Allowlist:** Permits only `https:` and `http:` on valid public domain names; rejects `file:`, `javascript:`, `data:`, `ftp:`, and custom schemes.
  - **Loopback & Localhost Blocklist:** Rejects `localhost`, `*.localhost`, `*.local`, `*.internal`, `127.0.0.0/8`, `0.0.0.0`, and IPv6 loopback (`::1`).
  - **Cloud Metadata Blocklist:** Rejects `169.254.169.254` (AWS/GCP/Azure link-local metadata), `metadata.google.internal`, and `100.64.0.0/10` (CGNAT/cloud metadata).
  - **Private Network Blocklist (RFC1918):** Rejects `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`.
  - **Credential Stripping:** Rejects URLs containing embedded `username:password@` credentials.

---

## 4. Prompt Injection & AI Output Hardening (Phase 4F & 4I)

- **Untrusted Input Delimiting:** All user messages, Knowledge Base excerpts, and inspected URL summaries are sanitized via `sanitizeUntrustedPromptInput` and wrapped in explicit XML data tags (`<untrusted_user_input>`, `<untrusted_kb_reference>`, `<untrusted_url_context>`).
- **System Instruction Guardrails:** `MASTER_SYSTEM_INSTRUCTION` explicitly instructs the model to treat content inside `<untrusted_*>` tags strictly as data, ignore instruction-override commands, never reveal system prompts or keys, and never fabricate citations outside `KB-01..KB-06`.
- **Citation & Output Verification:** `validateDiagnosisPayload` verifies every returned citation against the real `INITIAL_KNOWLEDGE_DOCUMENTS` catalog and strips any hallucinated document names.
- **XSS Prevention:** All AI responses and user inputs are rendered as escaped React text nodes and sanitized with `sanitizeDisplayText` (stripping `<script>`, `<iframe>`, `javascript:`, and inline `on*=` event handlers). `dangerouslySetInnerHTML` is never used.

---

## 5. File Upload, Rate Limiting & Web Headers (Phases 4G, 4H, 4J, 4K)

- **File Upload Validation (`validateUploadedDocumentFile`):** Enforces a 2 MB size cap, `.pdf`/`.csv`/`.txt` allowlist, MIME verification, path traversal prevention (`..`, `/`, `\`), and script tag rejection.
- **Rate Limiting & Concurrency (`RequestRateLimiter`):** Protects all `/api/consultation/*` routes with a per-user/IP sliding window rate limiter and concurrent in-flight request cap (returning HTTP `429` with `retryAfterSeconds`).
- **Security Headers (`server.ts`):** Sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, disables `x-powered-by`, and restricts CORS origins.
- **User Privacy Transparency (`SettingsView.tsx`):** Includes a dedicated bilingual **Privasi & Isolasi Data / Data Privacy & Isolation** section explaining data isolation and user deletion controls.
