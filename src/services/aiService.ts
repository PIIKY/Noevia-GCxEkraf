import {
  ActionPlanItem,
  BusinessContextData,
  Consultation,
  ConsultationResult,
  ExternalReference,
  KnowledgeDocument,
  KnowledgeReference,
  Message,
  Recommendation,
  VideoResource,
} from '../types';
import {
  generateContextualContinuationResponse,
  generateContextualDiscoveryResponse,
  generateKnowledgeBasedDiagnosis,
} from '../lib/consultationEngine';

export interface DiscoveryApiResponse {
  reply: string;
  updatedContext: BusinessContextData;
  readyForUnderstanding: boolean;
  suggestedFollowUps: string[];
  knowledgeReferences: KnowledgeReference[];
  externalReferences?: ExternalReference[];
  videoResources?: VideoResource[];
  provider?: string;
}

function buildRequestHeaders(
  actingUserId?: string | null,
  simulateError?: boolean
): Record<string, string> {
  const globalSimulated =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { __NOEVIA_SIMULATE_API_ERROR?: boolean })
        .__NOEVIA_SIMULATE_API_ERROR
    );

  return {
    'Content-Type': 'application/json',
    ...(actingUserId ? { 'x-user-id': actingUserId } : {}),
    ...(simulateError || globalSimulated ? { 'x-simulate-error': '1' } : {}),
  };
}

export async function sendDiscoveryMessage(params: {
  consultation: Consultation;
  messages: Message[];
  documents: KnowledgeDocument[];
  actingUserId?: string | null;
  simulateError?: boolean;
}): Promise<DiscoveryApiResponse> {
  const response = await fetch('/api/consultation/discovery', {
    method: 'POST',
    headers: buildRequestHeaders(params.actingUserId, params.simulateError),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error || 'Gagal menghubungi layanan konsultasi AI Noevia. Silakan coba lagi.'
    );
  }

  return response.json();
}

export async function requestBusinessDiagnosis(params: {
  consultation: Consultation;
  documents: KnowledgeDocument[];
  actingUserId?: string | null;
  simulateError?: boolean;
}): Promise<{ result: ConsultationResult; provider?: string }> {
  const response = await fetch('/api/consultation/analyze', {
    method: 'POST',
    headers: buildRequestHeaders(params.actingUserId, params.simulateError),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error || 'Gagal menyusun ringkasan analisis bisnis dan rekomendasi. Silakan coba lagi.'
    );
  }

  return response.json();
}

export async function sendContinuationMessage(params: {
  consultation: Consultation;
  userQuestion: string;
  documents: KnowledgeDocument[];
  actingUserId?: string | null;
  simulateError?: boolean;
}): Promise<{
  reply: string;
  knowledgeReferences: KnowledgeReference[];
  externalReferences?: ExternalReference[];
  videoResources?: VideoResource[];
  updatedActionPlan?: ActionPlanItem[];
  updatedRecommendations?: Recommendation[];
  provider?: string;
}> {
  const response = await fetch('/api/consultation/continue', {
    method: 'POST',
    headers: buildRequestHeaders(params.actingUserId, params.simulateError),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error || 'Gagal memproses pesan konsultasi lanjutan. Silakan coba lagi.'
    );
  }

  return response.json();
}

export async function inspectPublicUrl(params: {
  url: string;
  consultation?: Consultation;
  actingUserId?: string | null;
  simulateError?: boolean;
}): Promise<{
  summary: string;
  externalReferences: ExternalReference[];
  provider?: string;
}> {
  const response = await fetch('/api/consultation/inspect-url', {
    method: 'POST',
    headers: buildRequestHeaders(params.actingUserId, params.simulateError),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error || 'Gagal memeriksa URL publik. Pastikan tautan diawali https://.'
    );
  }

  return response.json();
}

export {
  generateContextualDiscoveryResponse,
  generateKnowledgeBasedDiagnosis,
  generateContextualContinuationResponse,
};
