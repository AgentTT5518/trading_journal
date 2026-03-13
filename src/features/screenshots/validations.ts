const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function validateFile(file: File): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB` };
  }
  return { valid: true };
}

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
