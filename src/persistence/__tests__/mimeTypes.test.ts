import { describe, it, expect } from 'vitest';

import { mimeTypeToExtension } from '../mimeTypes';

describe('mimeTypes', () => {
  describe('mimeTypeToExtension', () => {
    it('returns the correct extension for a given mime type', () => {
      expect(mimeTypeToExtension('image/png')).toBe('png');
      expect(mimeTypeToExtension('image/jpeg')).toBe('jpg');
      expect(mimeTypeToExtension('application/json')).toBe('json');
      expect(mimeTypeToExtension('application/octet-stream')).toBe('bin');
      expect(mimeTypeToExtension('text/plain')).toBe('txt');
      expect(mimeTypeToExtension('image/gif')).toBe('gif');
      expect(mimeTypeToExtension('image/svg+xml')).toBe('');
    });

    it('returns an empty string for an unknown mime type', () => {
      expect(mimeTypeToExtension('unknown/mime')).toBe('');
    });
  });
})