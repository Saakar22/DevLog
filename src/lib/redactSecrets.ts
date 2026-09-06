/**
 * DevLog Sensitive Secret Redaction Utility
 * 
 * Automatically detects and redacts sensitive credentials, API keys, tokens,
 * passwords, database URLs, and private keys before persistence in Firestore.
 */

const NON_SECRET_WORDS = new Set([
  "undefined",
  "null",
  "true",
  "false",
  "boolean",
  "string",
  "number",
  "object",
  "function",
  "symbol",
  "unknown",
  "any",
  "default",
  "required",
  "optional",
  "placeholder",
  "redacted",
]);

/**
 * Sanitizes a single string by stripping known secret patterns.
 */
export function redactSecretString(text: string): string {
  if (!text || typeof text !== "string") return text;

  let sanitized = text;

  // 1. Private keys (PEM format)
  sanitized = sanitized.replace(
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    "[REDACTED_PRIVATE_KEY]"
  );

  // 2. Google / Firebase API keys (AIza...)
  sanitized = sanitized.replace(
    /\bAIza[0-9A-Za-z_\-]{35}\b/g,
    "[REDACTED_API_KEY]"
  );

  // 3. GitHub personal access tokens
  sanitized = sanitized.replace(
    /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/g,
    "[REDACTED_GITHUB_TOKEN]"
  );

  // 4. AWS Access Key IDs
  sanitized = sanitized.replace(
    /\bAKIA[0-9A-Z]{16}\b/g,
    "[REDACTED_AWS_KEY]"
  );

  // 5. Database Connection URLs containing passwords
  // (mongodb://user:password@host, postgresql://user:password@host, etc.)
  sanitized = sanitized.replace(
    /\b((?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^:\s\/]+:)([^@\s]+)(@[^\s"']+)\b/gi,
    "$1[REDACTED]$3"
  );

  // 6. Bearer / JWT Tokens in Authorization headers or text
  sanitized = sanitized.replace(
    /(Authorization:\s*Bearer\s+)[A-Za-z0-9_\-\.]+/gi,
    "$1[REDACTED]"
  );
  sanitized = sanitized.replace(
    /(?<=\bBearer\s+)[A-Za-z0-9_\-\.]{15,}/gi,
    "[REDACTED]"
  );

  // 7. Standalone JWT tokens (header.payload.signature)
  sanitized = sanitized.replace(
    /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g,
    "[REDACTED_JWT_TOKEN]"
  );

  // 8. Key-Value assignment pairs (e.g., GEMINI_API_KEY="...", password: "...")
  sanitized = sanitized.replace(
    /\b(api[_-]?key|secret|token|password|passwd|auth[_-]?token|jwt[_-]?secret|private[_-]?key)\b(\s*[:=]\s*["']?)([^"'\s\n,;]{8,})(["']?)/gi,
    (match, keyName, separator, secretVal, quote) => {
      const lower = secretVal.toLowerCase();
      if (NON_SECRET_WORDS.has(lower) || secretVal.startsWith("[REDACTED")) {
        return match;
      }
      return `${keyName}${separator}[REDACTED]${quote}`;
    }
  );

  return sanitized;
}

/**
 * Deeply redacts secrets from any payload (string, array, or object) before saving.
 */
export function redactSecrets<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return redactSecretString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSecrets(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const redactedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      redactedObj[key] = redactSecrets(value);
    }
    return redactedObj as T;
  }

  return data;
}
