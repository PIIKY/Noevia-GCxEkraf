import { Consultation, GeneratedDocumentMeta, Message } from '../types';

export const ANONYMOUS_DEMO_SESSION_ID = 'anonymous-demo-session';

/**
 * Returns a strictly isolated storage key per authenticated user UID
 * or a dedicated temporary demo session key when unauthenticated.
 */
export function getScopedConsultationsStorageKey(userId: string | null): string {
  const safeId =
    userId && /^[a-zA-Z0-9_\-]+$/.test(userId.trim())
      ? userId.trim()
      : ANONYMOUS_DEMO_SESSION_ID;
  return `noevia_consultations_v3_${safeId}`;
}

/**
 * Validates a document/entity ID against the Firestore blueprint regex (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
 */
export function isValidEntityId(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

/**
 * Stamps a Consultation and all of its nested messages and generated documents
 * with the authoritative ownerId (`userId`). Never trusts a mismatched client-supplied ownerId.
 */
export function assignConsultationOwner(
  consultation: Consultation,
  authenticatedUserId: string | null
): Consultation {
  const ownerId = authenticatedUserId || ANONYMOUS_DEMO_SESSION_ID;
  const messages: Message[] = (consultation.messages || []).map((m) => ({
    ...m,
    ownerId,
  }));
  const generatedDocuments: GeneratedDocumentMeta[] = (
    consultation.generatedDocuments || []
  ).map((d) => ({
    ...d,
    ownerId,
  }));

  return {
    ...consultation,
    userId: ownerId,
    messages,
    generatedDocuments,
  };
}

/**
 * Verifies whether the requesting user (`requestingUserId`) is authorized to
 * read, modify, or delete a target consultation.
 */
export function canAccessConsultation(
  consultation: Consultation | null | undefined,
  requestingUserId: string | null
): boolean {
  if (!consultation) return false;
  const activeOwner = requestingUserId || ANONYMOUS_DEMO_SESSION_ID;
  // Built-in read-only SweetBite Bakery sample consultation can be viewed inside the user's own workspace
  if (consultation.id === 'cons-sweetbite-demo' && !consultation.userId) {
    return true;
  }
  if (!consultation.userId) return false;
  return consultation.userId === activeOwner;
}

/**
 * Filters a list of consultations so ONLY records owned by `requestingUserId` are returned.
 * Prevents cross-account leakage in history lists or search queries.
 */
export function filterConsultationsByOwner(
  consultations: Consultation[],
  requestingUserId: string | null
): Consultation[] {
  return consultations.filter((c) => canAccessConsultation(c, requestingUserId));
}

/**
 * Enforces ownership when looking up a single consultation by ID.
 * Throws a structured `PERMISSION_DENIED` error if another account attempts to access it.
 */
export function getAuthorizedConsultationById(
  consultations: Consultation[],
  consultationId: string,
  requestingUserId: string | null
): Consultation {
  const target = consultations.find((c) => c.id === consultationId);
  if (!target) {
    throw new Error('NOT_FOUND: Consultation does not exist.');
  }
  if (!canAccessConsultation(target, requestingUserId)) {
    throw new Error(
      'PERMISSION_DENIED: Account is not authorized to access this private consultation.'
    );
  }
  return target;
}

/**
 * Enforces private ownership on a generated deliverable (PDF, XLSX, DOCX, CSV)
 * before allowing download or viewing.
 */
export function canAccessGeneratedDocument(
  docMeta: GeneratedDocumentMeta | null | undefined,
  parentConsultation: Consultation | null | undefined,
  requestingUserId: string | null
): boolean {
  if (!docMeta || !parentConsultation) return false;
  if (docMeta.consultationId !== parentConsultation.id) return false;
  if (!canAccessConsultation(parentConsultation, requestingUserId)) return false;

  const activeOwner = requestingUserId || ANONYMOUS_DEMO_SESSION_ID;
  if (docMeta.ownerId && docMeta.ownerId !== activeOwner) {
    return false;
  }
  return true;
}

/**
 * Verifies whether a user is allowed to mutate shared Knowledge Base documents.
 * Ordinary users cannot modify the shared Knowledge Base.
 */
export function canModifySharedKnowledgeBase(user: {
  uid?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  isAdminRoute?: boolean;
} | null): boolean {
  if (!user) return false;
  if (
    user.emailVerified &&
    user.email?.toLowerCase() === 'vickyferdinands1@gmail.com'
  ) {
    return true;
  }
  return Boolean(user.isAdminRoute);
}
