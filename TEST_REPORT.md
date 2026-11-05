# NOEVIA — AUTOMATED VERIFICATION & TEST REPORT (`TEST_REPORT.md`)

**Date:** November 2026  
**Test Runner:** Node.js Built-in Test Runner (`npx tsx --test src/lib/consultationEngine.test.ts`) + Playwright Real-Browser E2E (`playwright-cli`)

---

## 1. Unit, Domain Logic & Backend HTTP Security Tests (`src/lib/consultationEngine.test.ts`)

**Command:** `npx --yes tsx --test src/lib/consultationEngine.test.ts`  
**Result:** **21 / 21 Passed (0 Failed)**

| # | Test Suite / Case | Category | Result |
| :--- | :--- | :--- | :--- |
| 1 | Knowledge Base contains all 6 required groups `KB-01` through `KB-06` in `Ready` status | Knowledge Base | PASS |
| 2 | Greeting rule: simple greeting like `"Halo"` does not retrieve KB references or invent a business problem | AI Guardrails | PASS |
| 3 | Relevance threshold filters out unrelated or low-relevance queries | Knowledge Base | PASS |
| 4 | Multi-domain detection & diagnosis adapts to Finance & Pricing and Operations with Problem-Analysis Matrix and Calculators | Consultation Engine | PASS |
| 5 | Phase 1 Multi-User Data Isolation: Account A vs Account B cannot view, search, access by ID, or download each other's consultations or files | Multi-User Security | PASS |
| 6 | Phase 3 Deterministic Business Calculators: HPP, Gross Margin vs Markup, Platform Commission, Sales Funnel, and Inventory ROP | Financial Math | PASS |
| 7 | Phase 3 AI Tools: Google Search Grounding triggers, URL Context extraction, and Verified Video Timestamps | Grounding & Tools | PASS |
| 8 | Phase 5 Implementation Monitoring: `evaluateImplementationProgress` calculates inquiry & transaction deltas accurately | Monitoring Logic | PASS |
| 9 | `retrieveRelevantKnowledge` prioritizes Marketing & Customer Acquisition for SweetBite Bakery query | Retrieval Accuracy | PASS |
| 10 | `createKnowledgeDocumentFromUpload` parses sections and assigns sequential KB ID | Admin Ingestion | PASS |
| 11 | SweetBite Bakery consultation contains enriched 7-day action plan, visual diagram, tailored deliverable, Problem-Analysis Matrix, and updates on continuation | End-to-End Domain | PASS |
| 12 | Learning Center & Tips/FAQ data covers all 6 categories, 9-section articles, 6 actionable guides, and complete `ID`/`EN` localization | Content & i18n | PASS |
| 13 | `validateDiagnosisPayload` rejects fabricated KB document names and falls back to real KB references | Anti-Hallucination | PASS |
| 14 | Professional Report Generation: Context Readiness Gate blocks empty/greeting sessions and approves complete consultations | Report Quality Gate | PASS |
| 15 | Professional Report Generation: Synthesizes 6-part Epistemic Evidence Matrix, 7 Tables, Non-Fabricated Charts + Data Template, and 9/9 Quality Validation | Consulting Deliverable | PASS |
| 16 | Professional Report Generation: Domain Deliverable Catalog provides full suite across Marketing, Finance, Operations, CX, and Growth | Multi-Format Export | PASS |
| 17 | Security Hardening Phase 4E: SSRF Protection blocks `localhost`, loopback, cloud metadata (`169.254.169.254`), private IP ranges, and non-HTTP schemes | SSRF Security | PASS |
| 18 | Security Hardening Phase 4F & 4I: Prompt Injection Defense and XSS Display Sanitization | AI & Web Security | PASS |
| 19 | Security Hardening Phase 4G: File Upload Security enforces extension allowlist, 2MB size limit, path traversal protection, and content sanitization | Upload Security | PASS |
| 20 | Security Hardening Phase 4H: `RequestRateLimiter` enforces sliding window rate limit and maximum concurrent requests | Abuse Prevention | PASS |
| 21 | Backend API Security & Multi-User Isolation (HTTP Integration): Enforces ownership on `discovery`/`analyze`/`continue`/`document-access` (HTTP `403`), blocks SSRF on `inspect-url` (HTTP `400`), and verifies `x-simulate-error: 1` retry recovery (`503` -> `200`) | Backend HTTP API | PASS |

---

## 2. Real-Browser Playwright E2E Journeys (`http://localhost:3000`)

All 8 required user journeys were executed and verified in a real headless Chromium browser via `playwright-cli`:

- **Journey 1 — Homepage to Consultation:** Verified empty-input validation alert, typed a business problem on the homepage, clicked `Mulai Konsultasi`, verified smooth transition to `/workspace` with the initial message preserved and answered by Noevia.
- **Journey 2 — Full Consultation Flow:** Verified conversational discovery turns, Business Understanding Confirmation (`Konfirmasi Pemahaman Bisnis`), structured diagnosis (`Ringkasan Analisis & Rekomendasi`), 7-day interactive action plan checklist, and follow-up continuation chat.
- **Journey 3 — Knowledge Base & Interactive References:** Opened `Pusat Pengetahuan Bisnis`, filtered categories, opened a 9-section article, clicked **Section 9 (`Referensi Sumber Knowledge Base`)** to verify the source excerpt modal (`[KB-02]`), and clicked **Section 8 (`Materi & Sumber Terkait`)** to verify direct navigation to the corresponding Guide in `Tips & Panduan`.
- **Journey 4 — Tips, Guides, and FAQ:** Opened `Tips & Panduan`, expanded a step-by-step guide, searched and expanded FAQ accordions, and verified the `Tanyakan di Konsultasi` deep-link into the consultation workspace.
- **Journey 5 — Document Generation:** Opened the Consulting Deliverable & Export suite on an analyzed consultation, verified the 9/9 Quality Gate and 6-part Epistemic Evidence tables, and triggered deliverable export (`.docx` / `.xlsx` / `.csv` / `.pdf`).
- **Journey 6 — Consultation History:** Opened `Konsultasi Saya`, searched consultations, reopened a saved session, and verified individual session deletion confirmation.
- **Journey 7 — Multi-User Isolation:** Verified Account A vs Account B isolation at both the storage/UI layer and HTTP API layer (`403 Forbidden` when Account B requests Account A's consultation or generated document).
- **Journey 8 — Error Recovery:** Enabled simulated API failure (`window.__NOEVIA_SIMULATE_API_ERROR = true`), sent a message in the consultation chat, verified that the user message remained visible alongside the inline error banner and `Coba Lagi` button, re-enabled the connection, clicked `Coba Lagi`, and confirmed the AI reply succeeded with zero duplicate user messages.
