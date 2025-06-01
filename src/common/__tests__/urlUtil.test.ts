import { describe, it, expect } from 'vitest';

import { parseBasePathFromUriPath, parseDomainUrlFromUrl } from "../urlUtil";

describe('urlUtil', () => {
  describe('parseBasePathFromUriPath()', () => {
    it('parses / from empty string', () => {
      const uriPath = '';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/');
    });

    it('parses / from /', () => {
      const uriPath = '/';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/');
    });

    it('parses /appA/ from /appA', () => {
      const uriPath = '/appA';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/appA/');
    });

    it('parses /appA/ from /appA/', () => {
      const uriPath = '/appA/';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/appA/');
    });

    it('parses /appA/ from /appA/index.html', () => {
      const uriPath = '/appA/index.html';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/appA/');
    });

    it('parses /appA/ from /appA/index.html?query=1#hash', () => {
      const uriPath = '/appA/index.html?query=1#hash';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/appA/');
    });

    it('parses /appA/ from /appA/settings', () => {
      const uriPath = '/appA/settings';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/appA/');
    });

    it('parses /_appA/a1a1a1a/ from /_appA/a1a1a1a', () => {
      const uriPath = '/_appA/a1a1a1a';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/_appA/a1a1a1a/');
    });

    it('parses /_appA/a1a1a1a/ from /_appA/a1a1a1a/', () => {
      const uriPath = '/_appA/a1a1a1a/';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/_appA/a1a1a1a/');
    });

    it('parses /_appA/a1a1a1a/ from /_appA/a1a1a1a/index.html', () => {
      const uriPath = '/_appA/a1a1a1a/index.html';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/_appA/a1a1a1a/');
    });

    it('parses /_appA/a1a1a1a/ from /_appA/a1a1a1a/index.html?query=1#hash', () => {
      const uriPath = '/_appA/a1a1a1a/index.html?query=1#hash';
      expect(parseBasePathFromUriPath(uriPath)).toEqual('/_appA/a1a1a1a/');
    });
  });
  
  describe('parseDomainUrlFromUrl()', () => {
    it('handles https + IP address + port + path.', () => {
      expect(parseDomainUrlFromUrl('https://127.0.0.1:8080/path/to/file')).toEqual('https://127.0.0.1:8080/');
    });

    it('handles https + IP address + path.', () => {
      expect(parseDomainUrlFromUrl('https://127.0.0.1/path/to/file')).toEqual('https://127.0.0.1/');
    });

    it('handles domain name', () => {
      expect(parseDomainUrlFromUrl('https://example.com/path/to/file')).toEqual('https://example.com/');
    });

    it('handles http scheme', () => {
      expect(parseDomainUrlFromUrl('http://example.com/path/to/file')).toEqual('http://example.com/');
    });

    it('handles root URL', () => {
      expect(parseDomainUrlFromUrl('https://example.com/')).toEqual('https://example.com/');
    });

    it('handles root URL with no trailing slash', () => {
      expect(parseDomainUrlFromUrl('https://example.com')).toEqual('https://example.com/');
    });
  });
});