# Noevia — Security Specification & Multi-User Data Isolation Audit

## 1. Data Invariants

1. **Consultation Ownership Invariant**: Every `/consultations/{consultationId}` document has an immutable `ownerId` equal to `request.auth.uid`. No user may `get`, `list`, `create`, `update`, or `delete` a consultation unless `resource.data.ownerId == request.auth.uid` (for reads/deletes) and `request.resource.data.ownerId == request.auth.uid` (for writes).
2. **Subcollection Master Gate Invariant**: Every `/consultations/{consultationId}/messages/{messageId}` and `/consultations/{consultationId}/documents/{documentId}` record requires that the parent `/consultations/{consultationId}` exists AND `get(/databases/$(database)/documents/consultations/$(consultationId)).data.ownerId == request.auth.uid`, in addition to `ownerId == request.auth.uid`.
3. **PII Split Collection Invariant**: User PII (`email`) is strictly isolated in `/users/{userId}/private/{docId}` and is readable/writable ONLY when `request.auth.uid == userId`. Non-PII display profile resides in `/users/{userId}/public/{docId}`.
4. **Shared Knowledge Base Separation Invariant**: `/knowledge_base/{docId}` is shared reference knowledge (`allow get, list: if true;`), but write operations (`create`, `update`, `delete`) are restricted strictly to verified administrators (`isAdmin()`). Ordinary users cannot modify or delete shared Knowledge Base documents.
5. **Temporal & Immutable Identity Integrity**: `createdAt == request.time` on `create`, `updatedAt == request.time` on `create`/`update`, and `id`, `ownerId`, `consultationId`, and `createdAt` are strictly immutable across all updates.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Identity Spoofing on Consultation Create**: `{ "id": "cons-1", "ownerId": "victim-uid", ... }` sent by `attacker-uid` -> **PERMISSION_DENIED**.
2. **Cross-User Consultation Read (`get` / `list`)**: `Account B` attempts `get(/consultations/cons-account-a)` or `list(/consultations)` without `where('ownerId', '==', auth.uid)` -> **PERMISSION_DENIED**.
3. **Shadow Field Injection on Update**: Adding `"isAdmin": true` or `"verified": true` to `/consultations/{id}` -> **PERMISSION_DENIED** via `hasOnly()`.
4. **Owner Hijack on Update**: Modifying `ownerId` from `user-a` to `user-b` during `update` -> **PERMISSION_DENIED** via immutability gate.
5. **Orphaned Message Write**: Creating `/consultations/non-existent-id/messages/msg-1` -> **PERMISSION_DENIED** via `exists()` and `get()` Master Gate on parent consultation.
6. **Cross-User Subcollection Message Read**: `Account B` attempts to read `/consultations/cons-account-a/messages/msg-1` -> **PERMISSION_DENIED**.
7. **Cross-User Private Deliverable Access**: `Account B` attempts to read `/consultations/cons-account-a/documents/doc-1` -> **PERMISSION_DENIED**.
8. **ID Poisoning / Resource Exhaustion**: Using a 2,000-character document ID or 50,000-character message string -> **PERMISSION_DENIED** via `isValidId()` and `.size()` bounds.
9. **PII Leakage Attack**: `Account B` attempts `get(/users/account-a/private/info)` -> **PERMISSION_DENIED**.
10. **Unverified Email Admin Spoof**: Spoofing `vickyferdinands1@gmail.com` with `email_verified: false` to overwrite `/knowledge_base/KB-01` -> **PERMISSION_DENIED**.
11. **Ordinary User Knowledge Base Tampering**: `Account A` attempts `delete(/knowledge_base/KB-01)` -> **PERMISSION_DENIED**.
12. **Client Timestamp Forgery**: Supplying a forged past or future `createdAt` / `updatedAt` timestamp not equal to `request.time` -> **PERMISSION_DENIED**.
