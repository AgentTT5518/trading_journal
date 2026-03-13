import { describe, it, expect } from 'vitest';
import { getExtension, getMimeType } from '@/features/screenshots/services/storage';

describe('getExtension', () => {
  it('returns jpg for image/jpeg', () => {
    expect(getExtension('image/jpeg')).toBe('jpg');
  });

  it('returns png for image/png', () => {
    expect(getExtension('image/png')).toBe('png');
  });

  it('returns gif for image/gif', () => {
    expect(getExtension('image/gif')).toBe('gif');
  });

  it('returns webp for image/webp', () => {
    expect(getExtension('image/webp')).toBe('webp');
  });

  it('returns bin for unknown type', () => {
    expect(getExtension('application/pdf')).toBe('bin');
  });
});

describe('getMimeType', () => {
  it('returns image/jpeg for .jpg', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for .jpeg', () => {
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
  });

  it('returns image/png for .png', () => {
    expect(getMimeType('chart.png')).toBe('image/png');
  });

  it('returns image/gif for .gif', () => {
    expect(getMimeType('anim.gif')).toBe('image/gif');
  });

  it('returns image/webp for .webp', () => {
    expect(getMimeType('photo.webp')).toBe('image/webp');
  });

  it('returns application/octet-stream for unknown ext', () => {
    expect(getMimeType('file.xyz')).toBe('application/octet-stream');
  });
});
