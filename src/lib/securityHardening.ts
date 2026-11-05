import { Consultation } from '../types';
import { canAccessConsultation, isValidEntityId } from './multiUserIsolation';

export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_MESSAGES_PER_REQUEST = 100;
export const MAX_URL_LENGTH = 512;
export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_UPLOAD_FILE_BYTES = MAX_UPLOAD_SIZE_BYTES;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
  normalizedUrl?: string;
}

/**
 * Validates an external URL against Server-Side Request Forgery (SSRF),
 * unsafe schemes, embedded credentials, loopback, link-local cloud metadata,
 * and private RFC1918 network ranges.
 */
export function validateSafeExternalUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      valid: false,
      error: 'URL tidak boleh kosong.',
      statusCode: 400,
    };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    return {
      valid: false,
      error: `URL melebihi batas panjang maksimum (${MAX_URL_LENGTH} karakter).`,
      statusCode: 400,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: 'Format URL tidak valid.',
      statusCode: 400,
    };
  }

  // Only allow https: (and http: only for public non-private domains if needed, prefer https)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      valid: false,
      error: 'Skema URL tidak diizinkan. Gunakan tautan publik https://.',
      statusCode: 400,
    };
  }

  // Reject embedded credentials
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: 'URL tidak boleh memuat kredensial autentikasi.',
      statusCode: 400,
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // Block localhost, loopback, and internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'metadata' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '::' ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fd00:')
  ) {
    return {
      valid: false,
      error:
        'Akses ke alamat lokal, jaringan internal, atau metadata cloud ditolak demi keamanan (SSRF Protection).',
      statusCode: 400,
    };
  }

  // Check IPv4 numeric ranges
  const ipv4Match = hostname.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  );
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map((n) => Number(n));
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
      return {
        valid: false,
        error: 'Alamat IP pada URL tidak valid.',
        statusCode: 400,
      };
    }
    const [a, b] = octets;
    const isPrivateOrReserved =
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) || // Cloud metadata 169.254.169.254 & link-local
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT / Alibaba metadata 100.100.100.200
      a >= 224;

    if (isPrivateOrReserved) {
      return {
        valid: false,
        error:
          'Akses ke alamat IP privat, loopback, atau metadata cloud ditolak (SSRF Protection).',
        statusCode: 400,
      };
    }
  }

  // Require a valid public TLD dot
  if (!hostname.includes('.')) {
    return {
      valid: false,
      error: 'Hostname URL harus berupa domain publik yang valid.',
      statusCode: 400,
    };
  }

  return { valid: true, normalizedUrl: trimmed };
}

/**
 * Filters a list of extracted URLs, returning only those that pass SSRF validation.
 */
export function filterSafeExternalUrls(urls: string[], maxCount = 2): string[] {
  if (!Array.isArray(urls)) return [];
  const safe: string[] = [];
  for (const raw of urls) {
    if (typeof raw !== 'string') continue;
    const check = validateSafeExternalUrl(raw);
    if (check.valid) {
      safe.push(raw.trim());
      if (safe.length >= maxCount) break;
    }
  }
  return safe;
}

/**
 * Detects common prompt-injection attempts trying to override system rules or exfiltrate secrets.
 */
export function detectPromptInjectionAttempt(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const patterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    /abaikan\s+(semua\s+)?(instruksi|perintah|aturan)\s+sebelumnya/i,
    /system\s*override/i,
    /reveal\s+(your\s+)?(system\s+prompt|api\s+key|secret)/i,
    /tampilkan\s+(system\s+prompt|api\s+key|kunci\s+rahasia)/i,
    /<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]/i,
    /<\/untrusted_/i,
  ];
  return patterns.some((re) => re.test(text));
}

/**
 * Sanitizes user or external text before embedding into an AI prompt so untrusted content
 * cannot break out of XML delimiters or inject fake system instructions.
 */
export function sanitizeUntrustedPromptInput(
  text: string,
  maxLength: number = MAX_MESSAGE_LENGTH
): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '')
    .replace(/<\/?untrusted_[a-z_]+>/gi, '[delimiter-stripped]')
    .replace(/<\|im_(start|end)\|>/gi, '')
    .replace(
      /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/gi,
      '[filtered-instruction-override]'
    )
    .replace(
      /abaikan\s+(semua\s+)?(instruksi|perintah|aturan)\s+sebelumnya/gi,
      '[filtered-instruction-override]'
    )
    .trim()
    .slice(0, maxLength);
}

/**
 * Wraps untrusted text inside explicit XML data tags so the model treats it strictly as data.
 */
export function wrapUntrustedBlock(
  tagName: 'untrusted_user_input' | 'untrusted_kb_reference' | 'untrusted_url_context',
  content: string,
  maxLength: number = MAX_MESSAGE_LENGTH
): string {
  const clean = sanitizeUntrustedPromptInput(content, maxLength);
  return `<${tagName}>\n${clean}\n</${tagName}>`;
}

/**
 * Sanitizes text intended for UI display or document export (strips executable HTML/script tags).
 */
export function sanitizeDisplayText(text: string, maxLength = 15000): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates file upload metadata and content for Knowledge Base / Admin ingestion.
 */
export function validateUploadedDocumentFile(params: {
  fileName: string;
  fileSize?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  rawContent?: string;
}): ValidationResult & {
  safeFileName?: string;
  sanitizedFileName?: string;
  sanitizedContent?: string;
} {
  const { fileName, fileSize, fileSizeBytes, mimeType, rawContent } = params;
  const effectiveSize =
    typeof fileSizeBytes === 'number' ? fileSizeBytes : fileSize;

  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    return {
      valid: false,
      error: 'Nama dokumen wajib diisi.',
      statusCode: 400,
    };
  }

  // Prevent path traversal and null bytes
  if (
    fileName.includes('..') ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName.includes('\0')
  ) {
    return {
      valid: false,
      error: 'Nama berkas tidak valid (karakter jalur direktori tidak diizinkan).',
      statusCode: 400,
    };
  }

  const trimmedName = fileName.trim();
  const safeBase = trimmedName
    .replace(/[^a-zA-Z0-9._\- ]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);

  if (!safeBase) {
    return {
      valid: false,
      error: 'Nama berkas tidak valid.',
      statusCode: 400,
    };
  }

  const hasValidExt = /\.(pdf|csv|txt)$/i.test(safeBase);
  const normalizedName = hasValidExt ? safeBase : `${safeBase}.pdf`;

  if (/\.(exe|sh|bat|cmd|js|ts|html|htm|php|py|jar|svg)$/i.test(trimmedName)) {
    return {
      valid: false,
      error: 'Tipe berkas tidak diizinkan. Hanya dokumen .pdf, .csv, atau .txt yang diperbolehkan.',
      statusCode: 400,
    };
  }

  if (typeof effectiveSize === 'number' && effectiveSize > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran berkas melebihi batas maksimum 2 MB.',
      statusCode: 400,
    };
  }

  if (mimeType && mimeType.trim() !== '') {
    const allowedMimes = [
      'application/pdf',
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `Tipe MIME berkas (${mimeType}) tidak diizinkan.`,
        statusCode: 400,
      };
    }
  }

  if (rawContent && /<script\b|<!DOCTYPE\s+html/i.test(rawContent)) {
    return {
      valid: false,
      error: 'Isi berkas mengandung kode skrip/HTML yang tidak diizinkan.',
      statusCode: 400,
    };
  }

  return {
    valid: true,
    safeFileName: normalizedName,
    sanitizedFileName: normalizedName,
    sanitizedContent: rawContent ? sanitizeDisplayText(rawContent, 8000) : '',
  };
}

/**
 * Validates incoming consultation & messages payload on backend endpoints.
 */
export function validateConsultationRequest(params: {
  consultation: unknown;
  messages?: unknown;
  userQuestion?: unknown;
  headerUserId?: string | null;
  bodyUserId?: string | null;
  requireMessages?: boolean;
  requireUserQuestion?: boolean;
}): ValidationResult {
  const {
    consultation,
    messages,
    userQuestion,
    headerUserId,
    bodyUserId,
    requireMessages = false,
    requireUserQuestion = false,
  } = params;

  if (!consultation || typeof consultation !== 'object') {
    return {
      valid: false,
      error: 'Objek konsultasi tidak valid atau tidak ditemukan.',
      statusCode: 400,
    };
  }

  const cons = consultation as Partial<Consultation>;
  if (!cons.id || typeof cons.id !== 'string' || !isValidEntityId(cons.id)) {
    return {
      valid: false,
      error: 'ID sesi konsultasi tidak valid.',
      statusCode: 400,
    };
  }

  // Verify header vs body user ID consistency if both are supplied
  if (
    headerUserId &&
    bodyUserId &&
    headerUserId.trim() !== bodyUserId.trim()
  ) {
    return {
      valid: false,
      error: 'Identitas pengguna pada header dan body tidak konsisten.',
      statusCode: 403,
    };
  }

  const effectiveUserId =
    headerUserId !== undefined ? headerUserId : bodyUserId ?? null;

  if (!canAccessConsultation(cons as Consultation, effectiveUserId)) {
    return {
      valid: false,
      error:
        'Akses ditolak: Anda tidak memiliki izin untuk mengakses sesi konsultasi milik pengguna lain.',
      statusCode: 403,
    };
  }

  if (requireMessages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        valid: false,
        error: 'Daftar pesan konsultasi tidak boleh kosong.',
        statusCode: 400,
      };
    }
    if (messages.length > MAX_MESSAGES_PER_REQUEST) {
      return {
        valid: false,
        error: `Jumlah pesan melebihi batas maksimum (${MAX_MESSAGES_PER_REQUEST}).`,
        statusCode: 400,
      };
    }
    const lastMsg = messages[messages.length - 1] as
      | { role?: unknown; content?: unknown }
      | undefined;
    if (
      !lastMsg ||
      typeof lastMsg.content !== 'string' ||
      !lastMsg.content.trim()
    ) {
      return {
        valid: false,
        error: 'Pesan pengguna tidak boleh kosong atau hanya berisi spasi.',
        statusCode: 400,
      };
    }
    if (lastMsg.content.length > MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Pesan melebihi batas panjang maksimum (${MAX_MESSAGE_LENGTH} karakter).`,
        statusCode: 400,
      };
    }
  }

  if (requireUserQuestion) {
    if (typeof userQuestion !== 'string' || !userQuestion.trim()) {
      return {
        valid: false,
        error: 'Pertanyaan lanjutan tidak boleh kosong.',
        statusCode: 400,
      };
    }
    if (userQuestion.length > MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Pertanyaan lanjutan melebihi batas panjang maksimum (${MAX_MESSAGE_LENGTH} karakter).`,
        statusCode: 400,
      };
    }
  }

  return { valid: true };
}

/**
 * Sliding-window Rate Limiter & Concurrency Guard per user/IP key.
 */
export class RequestRateLimiter {
  private hits = new Map<string, number[]>();
  private inFlight = new Map<string, number>();

  constructor(
    private readonly windowMs: number = 60_000,
    private readonly maxRequestsPerWindow: number = 30,
    private readonly maxConcurrent: number = 3
  ) {}

  public checkAndAcquire(key: string): {
    allowed: boolean;
    reason?: string;
    retryAfterSeconds?: number;
  } {
    const safeKey = (key || 'anon').slice(0, 128);
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const currentInFlight = this.inFlight.get(safeKey) || 0;
    if (currentInFlight >= this.maxConcurrent) {
      return {
        allowed: false,
        reason:
          'Permintaan sebelumnya masih sedang diproses. Mohon tunggu beberapa detik.',
        retryAfterSeconds: 3,
      };
    }

    const recent = (this.hits.get(safeKey) || []).filter((t) => t > cutoff);
    if (recent.length >= this.maxRequestsPerWindow) {
      const oldest = recent[0] || now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - now) / 1000)
      );
      this.hits.set(safeKey, recent);
      return {
        allowed: false,
        reason: `Batas frekuensi permintaan tercapai (${this.maxRequestsPerWindow} permintaan/menit). Silakan coba lagi dalam ${retryAfterSeconds} detik.`,
        retryAfterSeconds,
      };
    }

    recent.push(now);
    this.hits.set(safeKey, recent);
    this.inFlight.set(safeKey, currentInFlight + 1);
    return { allowed: true };
  }

  public release(key: string): void {
    const safeKey = (key || 'anon').slice(0, 128);
    const current = this.inFlight.get(safeKey) || 0;
    if (current <= 1) {
      this.inFlight.delete(safeKey);
    } else {
      this.inFlight.set(safeKey, current - 1);
    }
  }

  public reset(): void {
    this.hits.clear();
    this.inFlight.clear();
  }
}
