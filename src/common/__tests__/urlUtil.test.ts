import { parseBasePathFromUriPath, baseUrl, parseDomainUrlFromUrl } from "../urlUtil";

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

  describe('baseUrl()', () => {
    it('returns a URL without a leading slash', () => {
      expect(baseUrl('dog.png')).toEqual('/dog.png');
    });

    it('returns a URL with a leading slash', () => {
      expect(baseUrl('/dog.png')).toEqual('/dog.png');
    });

    it('returns a URL that includes a subdirectory', () => {
      expect(baseUrl('subdir/dog.png')).toEqual('/subdir/dog.png');
    });

    it('returns a URL with an ending slash', () => {
      expect(baseUrl('subdir/')).toEqual('/subdir/');
    });
  });
  
  describe('parseDomainUrlFromUrl()', () => {
    test('handles https + IP address + port + path.', () => {
      expect(parseDomainUrlFromUrl('https://127.0.0.1:8080/path/to/file')).toEqual('https://127.0.0.1:8080/');
    });

    test('handles https + IP address + path.', () => {
      expect(parseDomainUrlFromUrl('https://127.0.0.1/path/to/file')).toEqual('https://127.0.0.1/');
    });

    test('handles domain name', () => {
      expect(parseDomainUrlFromUrl('https://example.com/path/to/file')).toEqual('https://example.com/');
    });

    test('handles http scheme', () => {
      expect(parseDomainUrlFromUrl('http://example.com/path/to/file')).toEqual('http://example.com/');
    });

    test('handles root URL', () => {
      expect(parseDomainUrlFromUrl('https://example.com/')).toEqual('https://example.com/');
    });

    test('handles root URL with no trailing slash', () => {
      expect(parseDomainUrlFromUrl('https://example.com')).toEqual('https://example.com/');
    });
  });
});