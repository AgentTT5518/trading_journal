import { describe, it, expect } from 'vitest';
import { validateFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/features/screenshots/validations';

function makeFile(type: string, size: number, name = 'test.png'): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe('validateFile', () => {
  it('accepts a valid JPEG', () => {
    const file = makeFile('image/jpeg', 1024, 'photo.jpg');
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it('accepts a valid PNG', () => {
    const file = makeFile('image/png', 1024, 'chart.png');
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it('accepts a valid GIF', () => {
    const file = makeFile('image/gif', 1024, 'anim.gif');
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it('accepts a valid WebP', () => {
    const file = makeFile('image/webp', 1024, 'photo.webp');
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it('rejects an invalid mime type', () => {
    const file = makeFile('application/pdf', 1024, 'doc.pdf');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Invalid file type');
    }
  });

  it('rejects a file that is too large', () => {
    const file = makeFile('image/png', MAX_FILE_SIZE + 1, 'huge.png');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('File too large');
    }
  });

  it('accepts a file at the max size limit', () => {
    const file = makeFile('image/png', MAX_FILE_SIZE, 'max.png');
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it('exports allowed mime types', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES.length).toBe(4);
  });
});
