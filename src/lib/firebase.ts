import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { getFirestore } from 'firebase/firestore';
import { Consultation, GeneratedDocumentMeta, Message } from '../types';
import { isValidEntityId } from './multiUserIsolation';

const envMeta = (
  import.meta as unknown as { env?: Record<string, string | undefined> }
).env;

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  projectId: envMeta?.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: envMeta?.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: envMeta?.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: envMeta?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId:
    envMeta?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId,
  storageBucket:
    envMeta?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    envMeta?.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfig.messagingSenderId,
};

const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestoreInstance();
export const auth = getAuth(app);

function getFirestoreInstance() {
  return getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
}

const knownCreatedDocPaths = new Set<string>();

// Validate connection to Firestore on boot (Mandatory skill constraint)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await upsertUserProfileToFirestore(cred.user);
  return cred.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

function sanitizeId(rawId: string, fallbackPrefix = 'item'): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  return isValidEntityId(cleaned) ? cleaned : `${fallbackPrefix}-${Date.now()}`;
}

export async function upsertUserProfileToFirestore(user: User): Promise<void> {
  if (!user.uid || !user.emailVerified) return;
  const uid = sanitizeId(user.uid, 'usr');
  const publicPath = `users/${uid}/public/profile`;
  const privatePath = `users/${uid}/private/info`;
  const displayName = (
    user.displayName ||
    user.email?.split('@')[0] ||
    'Pengguna Noevia'
  ).slice(0, 120);

  try {
    if (knownCreatedDocPaths.has(publicPath)) {
      await updateDoc(doc(db, 'users', uid, 'public', 'profile'), {
        displayName,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'public', 'profile'), {
        uid,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownCreatedDocPaths.add(publicPath);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  if (user.email) {
    try {
      const email = user.email.slice(0, 254);
      if (knownCreatedDocPaths.has(privatePath)) {
        await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
          email,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', uid, 'private', 'info'), {
          uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        knownCreatedDocPaths.add(privatePath);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
}

/**
 * Saves an authenticated user's consultation and its subcollections (`messages` and `documents`)
 * to Firestore while strictly adhering to the schema and size boundaries in `firebase-blueprint.json` and `firestore.rules`.
 */
export async function saveConsultationToFirestore(
  consultation: Consultation,
  user: User | null
): Promise<void> {
  if (!user || !user.uid || !user.emailVerified) return;
  if (consultation.id === 'cons-sweetbite-demo') return;

  const consultationId = sanitizeId(consultation.id, 'cons');
  const ownerId = sanitizeId(user.uid, 'usr');
  const path = `consultations/${consultationId}`;

  const businessContextMap = {
    mainChallenge: (consultation.businessContext.mainChallenge || '').slice(
      0,
      1000
    ),
    currentStrategy: (consultation.businessContext.currentStrategy || '').slice(
      0,
      1000
    ),
    targetAudience: (consultation.businessContext.targetAudience || '').slice(
      0,
      1000
    ),
    businessGoals: (consultation.businessContext.businessGoals || '').slice(
      0,
      1000
    ),
    budgetConstraints: (
      consultation.businessContext.budgetConstraints || ''
    ).slice(0, 1000),
    problemSummary: (consultation.businessContext.problemSummary || '').slice(
      0,
      1500
    ),
    confirmedFacts: (consultation.businessContext.confirmedFacts || []).slice(
      0,
      15
    ),
    assumptionsToVerify: (
      consultation.businessContext.assumptionsToVerify || []
    ).slice(0, 15),
    missingInformation: (
      consultation.businessContext.missingInformation || []
    ).slice(0, 15),
  };

  const mutableFields: Record<string, unknown> = {
    title: (consultation.title || 'Konsultasi Bisnis').slice(0, 200),
    businessName: (consultation.businessName || '').slice(0, 160),
    businessCategory: (
      consultation.businessCategory || 'Belum Dikategorikan'
    ).slice(0, 100),
    businessStage: ['Planning', 'Starting', 'Already Operating'].includes(
      consultation.businessStage
    )
      ? consultation.businessStage
      : 'Already Operating',
    workTopic: [
      'Starting a Business',
      'Marketing',
      'Finance & Pricing',
      'Operations',
      'Customer Experience',
      'Business Growth',
      'Other Challenges',
    ].includes(consultation.workTopic)
      ? consultation.workTopic
      : 'Marketing',
    initialProblem: (consultation.initialProblem || '').slice(0, 4000),
    consultationStatus: [
      'Discovery',
      'Understanding Review',
      'Analyzed & Active',
      'Completed',
    ].includes(consultation.consultationStatus)
      ? consultation.consultationStatus
      : 'Discovery',
    currentStep: (consultation.currentStep || 'step-04-discovery').slice(0, 64),
    businessContextMap,
    updatedAt: serverTimestamp(),
  };

  if (consultation.result) {
    mutableFields.analysisSummaryMap = {
      mainProblem: (consultation.result.mainProblem || '').slice(0, 1000),
      problemSummary: (consultation.result.problemSummary || '').slice(0, 2000),
      recommendationsCount: consultation.result.recommendations?.length || 0,
      completedActionCount:
        consultation.result.actionPlan?.filter((a) => a.completed).length || 0,
    };
  }

  try {
    if (knownCreatedDocPaths.has(path)) {
      await updateDoc(doc(db, 'consultations', consultationId), mutableFields);
    } else {
      await setDoc(doc(db, 'consultations', consultationId), {
        id: consultationId,
        ownerId,
        ...mutableFields,
        createdAt: serverTimestamp(),
      });
      knownCreatedDocPaths.add(path);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  // Persist recent messages in subcollection /consultations/{consultationId}/messages/{messageId}
  const recentMessages: Message[] = (consultation.messages || []).slice(-12);
  for (const msg of recentMessages) {
    const msgId = sanitizeId(msg.id, 'msg');
    const msgPath = `consultations/${consultationId}/messages/${msgId}`;
    if (knownCreatedDocPaths.has(msgPath)) continue;
    try {
      await setDoc(
        doc(db, 'consultations', consultationId, 'messages', msgId),
        {
          id: msgId,
          consultationId,
          ownerId,
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: (msg.content || '...').slice(0, 15000),
          phase:
            msg.phase === 'continuation' ? 'continuation' : 'discovery',
          createdAt: serverTimestamp(),
        }
      );
      knownCreatedDocPaths.add(msgPath);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, msgPath);
    }
  }

  // Persist generated documents in subcollection /consultations/{consultationId}/documents/{documentId}
  const genDocs: GeneratedDocumentMeta[] =
    consultation.generatedDocuments || [];
  for (const genDoc of genDocs.slice(-10)) {
    const docId = sanitizeId(genDoc.id, 'doc');
    const docPath = `consultations/${consultationId}/documents/${docId}`;
    if (knownCreatedDocPaths.has(docPath)) continue;
    try {
      await setDoc(
        doc(db, 'consultations', consultationId, 'documents', docId),
        {
          id: docId,
          consultationId,
          ownerId,
          kind: [
            'consultation-report',
            'action-plan',
            'tailored-document',
          ].includes(genDoc.kind)
            ? genDoc.kind
            : 'consultation-report',
          title: (genDoc.title || 'Dokumen Konsultasi').slice(0, 200),
          fileName: (genDoc.fileName || 'dokumen.pdf').slice(0, 200),
          format: ['PDF', 'CSV', 'XLSX', 'DOCX'].includes(genDoc.format)
            ? genDoc.format
            : 'PDF',
          createdAt: serverTimestamp(),
        }
      );
      knownCreatedDocPaths.add(docPath);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
}

export async function deleteConsultationFromFirestore(
  consultationId: string,
  user: User | null
): Promise<void> {
  if (!user || !user.uid || !user.emailVerified) return;
  if (consultationId === 'cons-sweetbite-demo') return;
  const cleanId = sanitizeId(consultationId, 'cons');
  const path = `consultations/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'consultations', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserConsultations(
  user: User,
  onReceiveRemoteIds: (remoteConsultationSummaries: {
    id: string;
    ownerId: string;
    title: string;
    businessName: string;
    businessCategory: string;
    workTopic: string;
    initialProblem: string;
  }[]) => void
): () => void {
  const path = 'consultations';
  const q = query(
    collection(db, path),
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          ownerId: String(data.ownerId || user.uid),
          title: String(data.title || 'Konsultasi Bisnis'),
          businessName: String(data.businessName || ''),
          businessCategory: String(
            data.businessCategory || 'Belum Dikategorikan'
          ),
          workTopic: String(data.workTopic || 'Marketing'),
          initialProblem: String(data.initialProblem || ''),
        };
      });
      onReceiveRemoteIds(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
