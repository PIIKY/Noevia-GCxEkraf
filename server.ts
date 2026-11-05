import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Consultation,
  ExternalReference,
  GeneratedDocumentMeta,
  KnowledgeDocument,
  Message,
  Recommendation,
} from './src/types';
import {
  INITIAL_KNOWLEDGE_DOCUMENTS,
  isGreetingOrSmallTalk,
  retrieveRelevantKnowledge,
} from './src/lib/knowledgeBase';
import {
  MASTER_SYSTEM_INSTRUCTION,
  extractContextFromConversation,
  extractUrlsFromText,
  generateContextualContinuationResponse,
  generateContextualDiscoveryResponse,
  generateKnowledgeBasedDiagnosis,
  retrieveExternalResources,
  shouldTriggerGoogleSearchGrounding,
  validateDiagnosisPayload,
} from './src/lib/consultationEngine';
import {
  canAccessConsultation,
  canAccessGeneratedDocument,
} from './src/lib/multiUserIsolation';
import {
  RequestRateLimiter,
  filterSafeExternalUrls,
  sanitizeDisplayText,
  validateConsultationRequest,
  validateSafeExternalUrl,
  wrapUntrustedBlock,
} from './src/lib/securityHardening';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiRateLimiter = new RequestRateLimiter(60_000, 40, 4);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getRateLimitKey(req: express.Request): string {
  const headerUser =
    typeof req.headers['x-user-id'] === 'string' && req.headers['x-user-id'].trim()
      ? req.headers['x-user-id'].trim()
      : null;
  const ip = req.ip || req.socket.remoteAddress || 'anon-ip';
  return headerUser ? `uid:${headerUser}` : `ip:${ip}`;
}

async function fetchGoogleSearchGroundingReferences(
  ai: GoogleGenAI,
  queryText: string
): Promise<ExternalReference[]> {
  try {
    const safeQuery = sanitizeDisplayText(queryText, 500);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Temukan referensi resmi terbaru (Kementerian, BPJPH, OSS, Bank Indonesia, atau regulasi/kebijakan platform di Indonesia) yang relevan dengan pertanyaan UMKM berikut:\n${wrapUntrustedBlock('untrusted_user_input', safeQuery, 500)}\nBerikan ringkasan faktual singkat dalam 2 kalimat.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const chunks =
      (
        response.candidates?.[0]?.groundingMetadata as
          | {
              groundingChunks?: Array<{
                web?: { uri?: string; title?: string };
              }>;
            }
          | undefined
      )?.groundingChunks || [];

    const refs: ExternalReference[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const web = chunks[i]?.web;
      if (web?.uri && web?.title && validateSafeExternalUrl(web.uri).valid) {
        refs.push({
          id: `grounding-${Date.now()}-${i}`,
          title: sanitizeDisplayText(web.title, 180),
          publisher: 'Google Search Grounding (Sumber Web Terverifikasi)',
          url: web.uri.trim(),
          updatedAt: new Date().getFullYear().toString(),
          relevanceReason:
            sanitizeDisplayText(response.text || '', 180) ||
            'Ditemukan melalui Google Search Grounding untuk informasi eksternal terkini.',
          sourceType: 'google-search-grounding',
        });
      }
    }
    return refs.slice(0, 3);
  } catch (err) {
    console.warn('Google Search Grounding fallback:', err);
    return [];
  }
}

async function inspectPublicUrlsWithGemini(
  ai: GoogleGenAI | null,
  urls: string[],
  businessContextSummary: string
): Promise<{
  summaryText: string;
  urlReferences: ExternalReference[];
}> {
  const validUrls = filterSafeExternalUrls(urls, 2);
  if (validUrls.length === 0) {
    return { summaryText: '', urlReferences: [] };
  }

  if (!ai) {
    return {
      summaryText: `Tautan publik (${validUrls.join(', ')}) telah dicatat sebagai referensi konteks usaha Anda. Pastikan halaman tersebut menampilkan proposisi nilai produk, kisaran harga, dan tombol pemesanan WhatsApp yang jelas.`,
      urlReferences: validUrls.map((u, idx) => ({
        id: `url-ctx-local-${Date.now()}-${idx}`,
        title: `Halaman Publik yang Dianalisis: ${u}`,
        publisher: 'URL Context Inspection (Tautan Pengguna)',
        url: u,
        updatedAt: new Date().getFullYear().toString(),
        relevanceReason:
          'Tautan publik yang dibagikan langsung oleh pengguna dalam sesi konsultasi.',
        sourceType: 'url-context',
      })),
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Periksa URL publik berikut: ${validUrls.join(', ')}.
Konteks usaha pengguna:
${wrapUntrustedBlock('untrusted_user_input', businessContextSummary, 600)}
Berikan analisis praktis dalam Bahasa Indonesia (maksimal 3 poin) mengenai:
1. Kejelasan penawaran produk/jasa di halaman tersebut.
2. Kemudahan calon pelanggan menghubungi atau memesan (Call-to-Action).
3. Satu saran perbaikan cepat yang paling berdampak.`,
      config: {
        tools: [{ urlContext: {} }],
      },
    });

    const summaryText = sanitizeDisplayText(response.text || '', 2000);
    return {
      summaryText,
      urlReferences: validUrls.map((u, idx) => ({
        id: `url-ctx-${Date.now()}-${idx}`,
        title: `Analisis Konteks URL: ${u}`,
        publisher: 'Gemini URL Context Tool',
        url: u,
        updatedAt: new Date().getFullYear().toString(),
        relevanceReason:
          summaryText.slice(0, 180) ||
          'Dianalisis menggunakan URL Context Tool dari tautan publik yang diberikan pengguna.',
        sourceType: 'url-context',
      })),
    };
  } catch (err) {
    console.warn('URL Context fallback:', err);
    return {
      summaryText: `Catatan untuk tautan ${validUrls.join(', ')}: Pastikan informasi produk utama, kisaran harga, dan tautan pesan 1-klik terlihat jelas pada layar pertama.`,
      urlReferences: validUrls.map((u, idx) => ({
        id: `url-ctx-fb-${Date.now()}-${idx}`,
        title: `Referensi URL Pengguna: ${u}`,
        publisher: 'URL Context Reference',
        url: u,
        updatedAt: new Date().getFullYear().toString(),
        relevanceReason: 'Tautan publik yang dibagikan oleh pemilik usaha.',
        sourceType: 'url-context',
      })),
    };
  }
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Security headers middleware (Phase 4.J)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    res.setHeader('X-XSS-Protection', '0');

    // Never allow wildcard CORS with credentials
    const origin = req.headers.origin;
    const configuredAppUrl = process.env.APP_URL?.trim();
    if (
      origin &&
      (origin.includes('localhost:3000') ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.vercel.app') ||
        (configuredAppUrl && origin === configuredAppUrl))
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, x-user-id, x-simulate-error'
      );
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      agent: 'Noevia — AI Business Consultant',
      geminiConfigured: Boolean(getGeminiClient()),
    });
  });

  // Private Document Ownership Verification Endpoint (Phase 4.C & 4.G)
  app.post('/api/consultation/document-access', (req, res) => {
    const {
      consultation,
      documentMeta,
      document: docAlias,
      actingUserId,
    } = (req.body || {}) as {
      consultation?: Consultation;
      documentMeta?: GeneratedDocumentMeta;
      document?: GeneratedDocumentMeta;
      actingUserId?: string | null;
    };

    const resolvedDoc = documentMeta || docAlias;

    const headerUserId =
      typeof req.headers['x-user-id'] === 'string'
        ? req.headers['x-user-id']
        : undefined;

    const reqValidation = validateConsultationRequest({
      consultation,
      headerUserId,
      bodyUserId: actingUserId,
    });

    if (!reqValidation.valid) {
      res.status(reqValidation.statusCode || 403).json({
        allowed: false,
        error: reqValidation.error,
      });
      return;
    }

    const effectiveUserId =
      headerUserId !== undefined ? headerUserId : actingUserId ?? null;

    if (
      !resolvedDoc ||
      !canAccessGeneratedDocument(
        resolvedDoc,
        consultation || null,
        effectiveUserId
      )
    ) {
      res.status(403).json({
        allowed: false,
        error:
          'Akses dokumen ditolak: Anda tidak memiliki izin untuk mengunduh dokumen milik akun lain.',
      });
      return;
    }

    res.json({
      allowed: true,
      documentId: resolvedDoc.id,
      fileName: resolvedDoc.fileName,
    });
  });

  // URL Context Inspection Endpoint (Phase 3.3 & Phase 4.H SSRF Hardened)
  app.post('/api/consultation/inspect-url', async (req, res) => {
    const rateKey = getRateLimitKey(req);
    const rateCheck = apiRateLimiter.checkAndAcquire(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: rateCheck.reason,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
      return;
    }

    try {
      const { url, consultation, actingUserId } = (req.body || {}) as {
        url?: string;
        consultation?: Consultation;
        actingUserId?: string | null;
      };

      const headerUserId =
        typeof req.headers['x-user-id'] === 'string'
          ? req.headers['x-user-id']
          : undefined;

      if (consultation) {
        const check = validateConsultationRequest({
          consultation,
          headerUserId,
          bodyUserId: actingUserId,
        });
        if (!check.valid) {
          res.status(check.statusCode || 403).json({ error: check.error });
          return;
        }
      }

      if (!url || typeof url !== 'string' || !url.trim()) {
        res.status(400).json({
          error: 'Masukkan URL publik yang valid (diawali https://).',
        });
        return;
      }

      const rawExtracted = extractUrlsFromText(url);
      const candidateUrl = rawExtracted[0] || url.trim();
      const ssrfCheck = validateSafeExternalUrl(candidateUrl);
      if (!ssrfCheck.valid) {
        res.status(ssrfCheck.statusCode || 400).json({
          error: ssrfCheck.error,
        });
        return;
      }

      const safeUrls = filterSafeExternalUrls(
        rawExtracted.length > 0 ? rawExtracted : [candidateUrl],
        2
      );
      if (safeUrls.length === 0) {
        res.status(400).json({
          error: 'Masukkan URL publik yang valid dan aman.',
        });
        return;
      }

      const ai = getGeminiClient();
      const inspected = await inspectPublicUrlsWithGemini(
        ai,
        safeUrls,
        consultation
          ? `${consultation.businessName || consultation.businessCategory} — ${consultation.businessContext.mainChallenge}`
          : 'Usaha UMKM'
      );

      res.json({
        summary: inspected.summaryText,
        externalReferences: inspected.urlReferences,
        provider: ai ? 'gemini-3.8-flash-url-context' : 'noevia-url-fallback',
      });
    } catch {
      res.status(500).json({
        error:
          'Gagal memeriksa URL publik. Pastikan tautan dapat diakses secara publik.',
      });
    } finally {
      apiRateLimiter.release(rateKey);
    }
  });

  // Conversational Discovery Endpoint (Noevia 2.0)
  app.post('/api/consultation/discovery', async (req, res) => {
    const rateKey = getRateLimitKey(req);
    const rateCheck = apiRateLimiter.checkAndAcquire(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: rateCheck.reason,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
      return;
    }

    try {
      const {
        consultation,
        messages,
        documents = INITIAL_KNOWLEDGE_DOCUMENTS,
        simulateError = false,
        actingUserId,
      } = (req.body || {}) as {
        consultation: Consultation;
        messages: Message[];
        documents?: KnowledgeDocument[];
        simulateError?: boolean;
        actingUserId?: string | null;
      };

      if (simulateError || req.headers['x-simulate-error'] === '1') {
        res.status(503).json({
          error:
            'Koneksi ke layanan AI Noevia mengalami gangguan sementara. Pesan Anda tetap tersimpan—silakan tekan tombol Coba Lagi.',
        });
        return;
      }

      const headerUserId =
        typeof req.headers['x-user-id'] === 'string'
          ? req.headers['x-user-id']
          : undefined;

      const validation = validateConsultationRequest({
        consultation,
        messages,
        headerUserId,
        bodyUserId: actingUserId,
        requireMessages: true,
      });

      if (!validation.valid) {
        res.status(validation.statusCode || 400).json({
          error: validation.error,
        });
        return;
      }

      const fallbackResult = generateContextualDiscoveryResponse(
        consultation,
        messages,
        documents
      );

      const userMessages = messages.filter((m) => m.role === 'user');
      const lastUserMessage =
        userMessages[userMessages.length - 1]?.content || '';
      const substantiveMessages = userMessages.filter(
        (m) => !isGreetingOrSmallTalk(m.content)
      );

      const ai = getGeminiClient();
      if (
        !ai ||
        (isGreetingOrSmallTalk(lastUserMessage) &&
          substantiveMessages.length === 0)
      ) {
        res.json({
          ...fallbackResult,
          provider: 'noevia-kb-engine',
        });
        return;
      }

      const userTurnCount = substantiveMessages.length;
      const kbRefs = retrieveRelevantKnowledge(
        substantiveMessages.map((m) => m.content).join(' '),
        fallbackResult.updatedContext.workTopic,
        documents,
        3
      );

      const sharedUrls = filterSafeExternalUrls(
        extractUrlsFromText(lastUserMessage),
        2
      );
      const urlInspection =
        sharedUrls.length > 0
          ? await inspectPublicUrlsWithGemini(
              ai,
              sharedUrls,
              `${consultation.businessName || consultation.businessCategory} (${fallbackResult.updatedContext.workTopic})`
            )
          : { summaryText: '', urlReferences: [] };

      const groundingRefs = shouldTriggerGoogleSearchGrounding(lastUserMessage)
        ? await fetchGoogleSearchGroundingReferences(ai, lastUserMessage)
        : [];

      const kbContextText = kbRefs
        .map(
          (r) =>
            `[${r.documentId}] ${r.documentTitle} — ${r.sectionHeading} (Hal. ${r.pageNumber}): ${r.relevantContent}`
        )
        .join('\n\n');

      const transcript = messages
        .slice(-20)
        .map(
          (m) =>
            `${m.role === 'user' ? 'Pengguna' : 'Noevia'}: ${sanitizeDisplayText(m.content, 2000)}`
        )
        .join('\n');

      const prompt = `Konteks Bisnis Pengguna Saat Ini:
- Nama Bisnis: ${sanitizeDisplayText(consultation.businessName || 'Belum disebutkan', 160)}
- Kategori Bisnis: ${sanitizeDisplayText(consultation.businessCategory, 100)}
- Tahap Bisnis: ${consultation.businessStage}
- Topik Konsultasi: ${consultation.workTopic}
- Cerita Awal: ${sanitizeDisplayText(consultation.initialProblem, 1000)}
- Jumlah Jawaban Pengguna Sejauh Ini: ${userTurnCount}
${urlInspection.summaryText ? `\nHasil Pemeriksaan URL Publik Pengguna:\n${wrapUntrustedBlock('untrusted_url_context', urlInspection.summaryText, 1200)}\n` : ''}
Referensi Knowledge Base Terkait:
${wrapUntrustedBlock('untrusted_kb_reference', kbContextText || 'Belum ada referensi spesifik.', 3000)}

Riwayat Percakapan:
${wrapUntrustedBlock('untrusted_user_input', transcript, 8000)}

Instruksi Respons Konsultan Noevia 2.0:
1. Susun balasan seperti konsultan bisnis manusia yang hangat, tenang, dan bijaksana (bukan robot atau kuesioner).
2. Strukturkan balasan menjadi:
   - Pengakuan singkat yang tulus (Brief acknowledgement).
   - Refleksi atau interpretasi dari jawaban pengguna sebelumnya (tunjukkan Anda benar-benar memahami arti situasi tersebut bagi bisnis mereka).
   - Tepat SATU pertanyaan lanjutan yang relevan untuk menggali dimensi yang belum terjawab (Latar belakang produk/saluran, Detail masalah & sejak kapan terjadi, Upaya yang sudah pernah dicoba, Sumber daya/batasan anggaran/waktu, atau Hasil yang paling diprioritaskan).
3. Jika pengguna sudah menjawab >= 3 kali ATAU informasi inti sudah cukup utuh, sampaikan refleksi penutup dan ajak pengguna meninjau Konfirmasi Pemahaman Bisnis (ready_for_understanding = true).
4. Pisahkan dengan tegas antara fakta yang terkonfirmasi (confirmed_facts), gejala yang dilaporkan (user_reported_symptoms), dan asumsi yang masih perlu diverifikasi (assumptions_to_verify).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Pesan balasan Noevia dalam Bahasa Indonesia yang hangat, reflektif, dan tidak kaku.',
              },
              ready_for_understanding: {
                type: Type.BOOLEAN,
                description:
                  'True jika konteks sudah cukup untuk menyusun konfirmasi pemahaman.',
              },
              main_challenge: { type: Type.STRING },
              current_strategy: { type: Type.STRING },
              target_audience: { type: Type.STRING },
              business_goals: { type: Type.STRING },
              budget_constraints: { type: Type.STRING },
              confirmed_facts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              user_reported_symptoms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              preliminary_inferences: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              assumptions_to_verify: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missing_information: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              problem_summary: { type: Type.STRING },
              suggested_follow_ups: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'ready_for_understanding'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as Record<
        string,
        unknown
      >;
      const baseCtx = fallbackResult.updatedContext;

      const updatedContext = {
        ...baseCtx,
        mainChallenge:
          typeof parsed.main_challenge === 'string' &&
          parsed.main_challenge.trim()
            ? sanitizeDisplayText(parsed.main_challenge, 1000)
            : baseCtx.mainChallenge,
        currentStrategy:
          typeof parsed.current_strategy === 'string' &&
          parsed.current_strategy.trim()
            ? sanitizeDisplayText(parsed.current_strategy, 1000)
            : baseCtx.currentStrategy,
        targetAudience:
          typeof parsed.target_audience === 'string' &&
          parsed.target_audience.trim()
            ? sanitizeDisplayText(parsed.target_audience, 1000)
            : baseCtx.targetAudience,
        businessGoals:
          typeof parsed.business_goals === 'string' &&
          parsed.business_goals.trim()
            ? sanitizeDisplayText(parsed.business_goals, 1000)
            : baseCtx.businessGoals,
        budgetConstraints:
          typeof parsed.budget_constraints === 'string' &&
          parsed.budget_constraints.trim()
            ? sanitizeDisplayText(parsed.budget_constraints, 1000)
            : baseCtx.budgetConstraints,
        confirmedFacts:
          Array.isArray(parsed.confirmed_facts) &&
          parsed.confirmed_facts.length > 0
            ? (parsed.confirmed_facts as string[])
                .slice(0, 15)
                .map((s) => sanitizeDisplayText(String(s), 400))
            : baseCtx.confirmedFacts,
        userReportedSymptoms:
          Array.isArray(parsed.user_reported_symptoms) &&
          parsed.user_reported_symptoms.length > 0
            ? (parsed.user_reported_symptoms as string[])
                .slice(0, 15)
                .map((s) => sanitizeDisplayText(String(s), 400))
            : baseCtx.userReportedSymptoms,
        preliminaryInferences:
          Array.isArray(parsed.preliminary_inferences) &&
          parsed.preliminary_inferences.length > 0
            ? (parsed.preliminary_inferences as string[])
                .slice(0, 15)
                .map((s) => sanitizeDisplayText(String(s), 400))
            : baseCtx.preliminaryInferences,
        assumptionsToVerify:
          Array.isArray(parsed.assumptions_to_verify) &&
          parsed.assumptions_to_verify.length > 0
            ? (parsed.assumptions_to_verify as string[])
                .slice(0, 15)
                .map((s) => sanitizeDisplayText(String(s), 400))
            : baseCtx.assumptionsToVerify,
        missingInformation:
          Array.isArray(parsed.missing_information) &&
          parsed.missing_information.length > 0
            ? (parsed.missing_information as string[])
                .slice(0, 15)
                .map((s) => sanitizeDisplayText(String(s), 400))
            : baseCtx.missingInformation,
        problemSummary:
          typeof parsed.problem_summary === 'string' &&
          parsed.problem_summary.trim()
            ? sanitizeDisplayText(parsed.problem_summary, 1500)
            : baseCtx.problemSummary,
      };

      const combinedExternalReferences = [
        ...urlInspection.urlReferences,
        ...groundingRefs,
        ...(fallbackResult.externalReferences || []),
      ].slice(0, 4);

      res.json({
        reply:
          typeof parsed.reply === 'string' && parsed.reply.trim()
            ? sanitizeDisplayText(parsed.reply, 6000)
            : fallbackResult.reply,
        updatedContext,
        readyForUnderstanding:
          typeof parsed.ready_for_understanding === 'boolean'
            ? parsed.ready_for_understanding || userTurnCount >= 3
            : fallbackResult.readyForUnderstanding,
        suggestedFollowUps:
          Array.isArray(parsed.suggested_follow_ups) &&
          parsed.suggested_follow_ups.length > 0
            ? (parsed.suggested_follow_ups as string[])
                .slice(0, 4)
                .map((s) => sanitizeDisplayText(String(s), 200))
            : fallbackResult.suggestedFollowUps,
        knowledgeReferences: kbRefs,
        externalReferences: combinedExternalReferences,
        videoResources: fallbackResult.videoResources,
        provider: 'gemini-3.8-flash',
      });
    } catch {
      const {
        consultation,
        messages,
        documents = INITIAL_KNOWLEDGE_DOCUMENTS,
      } = req.body || {};
      if (consultation && Array.isArray(messages)) {
        const fallbackResult = generateContextualDiscoveryResponse(
          consultation,
          messages,
          documents
        );
        res.json({
          ...fallbackResult,
          provider: 'noevia-kb-fallback',
        });
        return;
      }
      res.status(500).json({
        error: 'Gagal memproses percakapan konsultasi. Silakan coba kembali.',
      });
    } finally {
      apiRateLimiter.release(rateKey);
    }
  });

  // Personalized Consultation Summary & Action Plan Endpoint (Noevia 2.0)
  app.post('/api/consultation/analyze', async (req, res) => {
    const rateKey = getRateLimitKey(req);
    const rateCheck = apiRateLimiter.checkAndAcquire(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: rateCheck.reason,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
      return;
    }

    try {
      const {
        consultation,
        documents = INITIAL_KNOWLEDGE_DOCUMENTS,
        simulateError = false,
        actingUserId,
      } = (req.body || {}) as {
        consultation: Consultation;
        documents?: KnowledgeDocument[];
        simulateError?: boolean;
        actingUserId?: string | null;
      };

      if (simulateError || req.headers['x-simulate-error'] === '1') {
        res.status(503).json({
          error:
            'Gagal menyusun ringkasan konsultasi karena gangguan koneksi AI. Silakan tekan tombol Coba Lagi.',
        });
        return;
      }

      const headerUserId =
        typeof req.headers['x-user-id'] === 'string'
          ? req.headers['x-user-id']
          : undefined;

      const validation = validateConsultationRequest({
        consultation,
        headerUserId,
        bodyUserId: actingUserId,
      });

      if (!validation.valid) {
        res.status(validation.statusCode || 400).json({
          error: validation.error,
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        const diagnosis = generateKnowledgeBasedDiagnosis(
          consultation,
          documents
        );
        res.json({ result: diagnosis, provider: 'noevia-kb-engine' });
        return;
      }

      const ctx = extractContextFromConversation(
        consultation,
        consultation.messages
      );
      const fullConversationText = consultation.messages
        .map((m) => m.content)
        .join(' ');
      const matchedRefs = retrieveRelevantKnowledge(
        `${consultation.workTopic} ${consultation.businessCategory} ${ctx.mainChallenge} ${ctx.currentStrategy} ${ctx.targetAudience} ${consultation.initialProblem}`,
        consultation.workTopic,
        documents,
        4
      );

      const sharedUrls = filterSafeExternalUrls(
        extractUrlsFromText(fullConversationText),
        2
      );
      const urlInspection =
        sharedUrls.length > 0
          ? await inspectPublicUrlsWithGemini(ai, sharedUrls, ctx.mainChallenge)
          : { summaryText: '', urlReferences: [] };
      const groundingRefs = shouldTriggerGoogleSearchGrounding(
        fullConversationText
      )
        ? await fetchGoogleSearchGroundingReferences(ai, fullConversationText)
        : [];

      const kbText =
        matchedRefs.length > 0
          ? matchedRefs
              .map(
                (r) =>
                  `Document: "${r.documentTitle}" | Section: "${r.sectionHeading}" | Page: ${r.pageNumber ?? 'N/A'}\nContent: ${r.relevantContent}`
              )
              .join('\n\n')
          : 'Tidak ada dokumen Knowledge Base yang berstatus Ready.';

      const transcript = consultation.messages
        .slice(-25)
        .map(
          (m) =>
            `${m.role === 'user' ? 'Pengguna' : 'Noevia'}: ${sanitizeDisplayText(m.content, 2000)}`
        )
        .join('\n');

      const prompt = `Susun ringkasan konsultasi personal (YOUR BUSINESS SITUATION, WHAT WE UNDERSTAND, WHAT MAY BE HAPPENING, WHAT WE RECOMMEND, YOUR NEXT STEPS) untuk usaha berikut.

Profil & Konteks Bisnis:
- Nama Bisnis: ${sanitizeDisplayText(consultation.businessName || 'Usaha UMKM', 160)}
- Kategori: ${sanitizeDisplayText(consultation.businessCategory, 100)}
- Tahap: ${consultation.businessStage}
- Tantangan Utama: ${sanitizeDisplayText(ctx.mainChallenge, 1000)}
- Strategi Saat Ini: ${sanitizeDisplayText(ctx.currentStrategy, 1000)}
- Target Pasar: ${sanitizeDisplayText(ctx.targetAudience, 1000)}
- Tujuan Bisnis: ${sanitizeDisplayText(ctx.businessGoals, 1000)}
- Sumber Daya & Batasan Budget: ${sanitizeDisplayText(ctx.budgetConstraints, 1000)}
- Fakta Terkonfirmasi: ${ctx.confirmedFacts.join('; ')}

Transkrip Konsultasi:
${wrapUntrustedBlock('untrusted_user_input', transcript, 8000)}

Dokumen Knowledge Base Resmi (HANYA gunakan dokumen di bawah ini sebagai referensi):
${wrapUntrustedBlock('untrusted_kb_reference', kbText, 4000)}

Ketentuan Penting:
1. Gunakan Bahasa Indonesia yang natural, suportif, dan mudah dipahami pelaku UMKM.
2. Pada possible_causes, gunakan confidence HANYA salah satu dari: "Kemungkinan penyebab", "Indikasi awal", atau "Perlu diperiksa lebih lanjut".
3. Berikan maksimal 3 rekomendasi terprioritas (recommendations). Untuk setiap rekomendasi jelaskan: description (apa yang perlu dilakukan), why_it_matters (mengapa penting), why_it_fits (mengapa cocok dengan situasi spesifik pengguna), steps (langkah praktis), expected_outcome, required_resources, dan limitations_to_consider (batasan yang perlu diperhatikan).
4. Buat rencana tindakan 7 hari (action_plan Day 1 s/d Day 7) yang realistis sesuai ketersediaan sumber daya pengguna.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              main_problem: { type: Type.STRING },
              problem_summary: { type: Type.STRING },
              supporting_findings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              possible_causes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cause: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['cause', 'confidence', 'explanation'],
                },
              },
              additional_considerations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              knowledge_references: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    document: { type: Type.STRING },
                    section: { type: Type.STRING },
                    page: { type: Type.INTEGER },
                  },
                  required: ['document', 'section'],
                },
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    description: { type: Type.STRING },
                    why_it_matters: { type: Type.STRING },
                    why_it_fits: { type: Type.STRING },
                    steps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    expected_outcome: { type: Type.STRING },
                    required_resources: { type: Type.STRING },
                    limitations_to_consider: { type: Type.STRING },
                  },
                  required: [
                    'title',
                    'priority',
                    'description',
                    'why_it_matters',
                    'why_it_fits',
                    'steps',
                    'expected_outcome',
                    'required_resources',
                    'limitations_to_consider',
                  ],
                },
              },
              action_plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    action: { type: Type.STRING },
                    objective: { type: Type.STRING },
                  },
                  required: ['day', 'action', 'objective'],
                },
              },
            },
            required: [
              'main_problem',
              'problem_summary',
              'supporting_findings',
              'possible_causes',
              'additional_considerations',
              'knowledge_references',
              'recommendations',
              'action_plan',
            ],
          },
        },
      });

      const rawJson = JSON.parse((response.text ?? '{}').trim());
      const validatedResult = validateDiagnosisPayload(
        rawJson,
        consultation,
        documents
      );
      validatedResult.externalReferences = [
        ...urlInspection.urlReferences,
        ...groundingRefs,
        ...(validatedResult.externalReferences || []),
      ].slice(0, 4);

      res.json({ result: validatedResult, provider: 'gemini-3.8-flash' });
    } catch {
      const { consultation, documents = INITIAL_KNOWLEDGE_DOCUMENTS } =
        req.body || {};
      if (consultation) {
        const fallbackResult = generateKnowledgeBasedDiagnosis(
          consultation,
          documents
        );
        res.json({ result: fallbackResult, provider: 'noevia-kb-fallback' });
        return;
      }
      res.status(500).json({
        error: 'Gagal menghasilkan ringkasan konsultasi. Silakan coba kembali.',
      });
    } finally {
      apiRateLimiter.release(rateKey);
    }
  });

  // Continuous Consultation Endpoint (Where Would You Like to Go From Here?)
  app.post('/api/consultation/continue', async (req, res) => {
    const rateKey = getRateLimitKey(req);
    const rateCheck = apiRateLimiter.checkAndAcquire(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: rateCheck.reason,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
      return;
    }

    try {
      const {
        consultation,
        userQuestion,
        documents = INITIAL_KNOWLEDGE_DOCUMENTS,
        simulateError = false,
        actingUserId,
      } = (req.body || {}) as {
        consultation: Consultation;
        userQuestion: string;
        documents?: KnowledgeDocument[];
        simulateError?: boolean;
        actingUserId?: string | null;
      };

      if (simulateError || req.headers['x-simulate-error'] === '1') {
        res.status(503).json({
          error:
            'Koneksi terputus saat memproses pertanyaan lanjutan. Silakan tekan tombol Coba Lagi.',
        });
        return;
      }

      const headerUserId =
        typeof req.headers['x-user-id'] === 'string'
          ? req.headers['x-user-id']
          : undefined;

      const validation = validateConsultationRequest({
        consultation,
        userQuestion,
        headerUserId,
        bodyUserId: actingUserId,
        requireUserQuestion: true,
      });

      if (!validation.valid) {
        res.status(validation.statusCode || 400).json({
          error: validation.error,
        });
        return;
      }

      const fallback = generateContextualContinuationResponse(
        consultation,
        userQuestion,
        documents
      );

      const ai = getGeminiClient();
      if (!ai) {
        res.json({ ...fallback, provider: 'noevia-kb-engine' });
        return;
      }

      const refs = retrieveRelevantKnowledge(
        `${consultation.initialProblem} ${userQuestion}`,
        consultation.workTopic,
        documents,
        3
      );

      const sharedUrls = filterSafeExternalUrls(
        extractUrlsFromText(userQuestion),
        2
      );
      const urlInspection =
        sharedUrls.length > 0
          ? await inspectPublicUrlsWithGemini(
              ai,
              sharedUrls,
              consultation.businessContext.mainChallenge
            )
          : { summaryText: '', urlReferences: [] };
      const groundingRefs = shouldTriggerGoogleSearchGrounding(userQuestion)
        ? await fetchGoogleSearchGroundingReferences(ai, userQuestion)
        : [];
      const curatedResources = retrieveExternalResources(
        userQuestion,
        consultation.workTopic
      );

      const kbText = refs
        .map(
          (r) =>
            `Source: ${r.documentTitle} — ${r.sectionHeading} (Hal. ${r.pageNumber ?? 'N/A'}): ${r.relevantContent}`
        )
        .join('\n\n');

      const currentRecs =
        consultation.result?.recommendations
          .map((r) => `- ${r.title}: ${r.description}`)
          .join('\n') || '';
      const currentPlan =
        consultation.result?.actionPlan
          .map((a) => `Day ${a.day}: ${a.action} (${a.objective})`)
          .join('\n') || '';

      const prompt = `Pengguna melanjutkan konsultasi bisnis.
Pertahankan seluruh konteks bisnis sebelumnya:
- Nama Bisnis: ${sanitizeDisplayText(consultation.businessName || consultation.businessCategory, 160)}
- Masalah Utama: ${sanitizeDisplayText(consultation.businessContext.mainChallenge, 1000)}
- Strategi Saat Ini: ${sanitizeDisplayText(consultation.businessContext.currentStrategy, 1000)}
- Target Pelanggan: ${sanitizeDisplayText(consultation.businessContext.targetAudience, 1000)}
- Batasan Budget: ${sanitizeDisplayText(consultation.businessContext.budgetConstraints, 1000)}
${urlInspection.summaryText ? `\nHasil Analisis URL Publik:\n${wrapUntrustedBlock('untrusted_url_context', urlInspection.summaryText, 1200)}\n` : ''}
Rekomendasi Sebelumnya:
${currentRecs}

Rencana Tindakan Sebelumnya:
${currentPlan}

Referensi Knowledge Base Relevan:
${wrapUntrustedBlock('untrusted_kb_reference', kbText, 3000)}

Pertanyaan / Permintaan Lanjutan Pengguna:
${wrapUntrustedBlock('untrusted_user_input', userQuestion, 2000)}

Berikan jawaban konsultasi lanjutan yang hangat, memahami situasi pengguna, dan langsung dapat dipraktikkan. Jika pengguna mengubah strategi (misal tidak memiliki budget iklan atau meminta penyesuaian solusi), set should_update_plan = true dan berikan updated_action_plan (7 hari).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              should_update_plan: { type: Type.BOOLEAN },
              updated_action_plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    action: { type: Type.STRING },
                    objective: { type: Type.STRING },
                  },
                  required: ['day', 'action', 'objective'],
                },
              },
            },
            required: ['reply', 'should_update_plan'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as Record<
        string,
        unknown
      >;
      const updatedActionPlan =
        parsed.should_update_plan &&
        Array.isArray(parsed.updated_action_plan) &&
        parsed.updated_action_plan.length === 7
          ? (
              parsed.updated_action_plan as Array<{
                day: number;
                action: string;
                objective: string;
              }>
            ).map((item, idx) => ({
              day: item.day || idx + 1,
              action: sanitizeDisplayText(item.action, 500),
              objective: sanitizeDisplayText(item.objective, 500),
              completed: false,
            }))
          : fallback.updatedActionPlan;

      const combinedExternalReferences = [
        ...urlInspection.urlReferences,
        ...groundingRefs,
        ...(curatedResources.externalReferences || []),
      ].slice(0, 4);

      res.json({
        reply:
          typeof parsed.reply === 'string' && parsed.reply.trim()
            ? sanitizeDisplayText(parsed.reply, 6000)
            : fallback.reply,
        knowledgeReferences: refs,
        externalReferences: combinedExternalReferences,
        videoResources: curatedResources.videoResources,
        updatedActionPlan,
        updatedRecommendations: fallback.updatedRecommendations as
          | Recommendation[]
          | undefined,
        provider: 'gemini-3.8-flash',
      });
    } catch {
      const {
        consultation,
        userQuestion,
        documents = INITIAL_KNOWLEDGE_DOCUMENTS,
      } = req.body || {};
      if (consultation && userQuestion) {
        const fallback = generateContextualContinuationResponse(
          consultation,
          userQuestion,
          documents
        );
        res.json({ ...fallback, provider: 'noevia-kb-fallback' });
        return;
      }
      res.status(500).json({
        error: 'Gagal memproses konsultasi lanjutan. Silakan coba kembali.',
      });
    } finally {
      apiRateLimiter.release(rateKey);
    }
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Noevia server listening on http://0.0.0.0:${PORT}`);
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  startServer();
}
