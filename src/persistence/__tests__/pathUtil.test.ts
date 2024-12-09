import {fillTemplate, keyToPath, keyToName, splitFilenameAndExtension} from '../pathUtil';

describe('pathUtil', () => {
  describe('keyToPath()', () => {
    it('returns empty string for empty string', () => {
      const key = '';
      const expected = '';
      const path = keyToPath(key);
      expect(path).toEqual(expected);
    });

    it('returns empty string for key with no path', () => {
      const key = 'dog';
      const expected = '';
      const path = keyToPath(key);
      expect(path).toEqual(expected);
    });

    it('returns / for key with a root path', () => {
      const key = '/dog';
      const expected = '/';
      const path = keyToPath(key);
      expect(path).toEqual(expected);
    });

    it('returns /path/ for key with one folder', () => {
      const key = '/pets/dog';
      const expected = '/pets/';
      const path = keyToPath(key);
      expect(path).toEqual(expected);
    });

    it('returns multi-folder path from key', () => {
      const key = '/pets/furry/dog';
      const expected = '/pets/furry/';
      const path = keyToPath(key);
      expect(path).toEqual(expected);
    });
  });

  describe('keyToName()', () => {
    it('returns empty string for empty string', () => {
      const key = '';
      const expected = '';
      const name = keyToName(key);
      expect(name).toEqual(expected);
    });

    it('returns empty string for key with path but no name', () => {
      const key = '/pets/furry/';
      const expected = '';
      const name = keyToName(key);
      expect(name).toEqual(expected);
    });

    it('returns name for key with name but no path', () => {
      const key = 'dog';
      const expected = 'dog';
      const name = keyToName(key);
      expect(name).toEqual(expected);
    });

    it('returns name for key with path and name', () => {
      const key = '/pets/furry/dog';
      const expected = 'dog';
      const name = keyToName(key);
      expect(name).toEqual(expected);
    });
  });
  
  describe('fillTemplate()', () => {
    it('returns empty string for empty template', () => {
      const template = '';
      const variables = {};
      const expected = '';
      expect(fillTemplate(template, variables)).toEqual(expected);
    });

    it('returns unmodified template string when contains no replacement markers', () => {
      const template = 'quick brown fox';
      const variables = {color:'red'};
      const expected = 'quick brown fox';
      expect(fillTemplate(template, variables)).toEqual(expected);
    });

    it('returns unmodified template string when contains no matching replacements', () => {
      const template = 'quick brown {animal}';
      const variables = {color:'red'};
      const expected = 'quick brown {animal}';
      expect(fillTemplate(template, variables)).toEqual(expected);
    });

    it('returns string with a replacement', () => {
      const template = 'quick brown {animal}';
      const variables = {animal:'fox'};
      const expected = 'quick brown fox';
      expect(fillTemplate(template, variables)).toEqual(expected);
    });

    it('returns string with same marker replaced in multiple locations', () => {
      const template = 'quick brown {animal} was a {animal}';
      const variables = {animal:'fox'};
      const expected = 'quick brown fox was a fox';
      expect(fillTemplate(template, variables)).toEqual(expected);
    });

    it('returns string with replacements made to different markers', () => {
      const template = 'quick {color} {animal}';
      const variables = {animal:'fox', color:'brown'};
      const expected = 'quick brown fox';
      expect(fillTemplate(template, variables)).toEqual(expected);
    });
  });

  describe('splitFilenameAndExtension()', () => {
    it('returns empty strings for empty string', () => {
      const filenameWithExtension = '';
      const expected = ['', ''];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('returns filename and empty extension for filename with no extension', () => {
      const filenameWithExtension = 'dog';
      const expected = ['dog', ''];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('returns filename and empty extension for filename with . followed by no extension', () => {
      const filenameWithExtension = 'dog.';
      const expected = ['dog', ''];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('returns empty string and extension for filename with no name', () => {
      const filenameWithExtension = '.txt';
      const expected = ['', 'txt'];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('returns filename and extension for filename with extension', () => {
      const filenameWithExtension = 'dog.txt';
      const expected = ['dog', 'txt'];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('sets extension to lower case', () => {
      const filenameWithExtension = 'dog.TXT';
      const expected = ['dog', 'txt'];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('handles single character extension', () => {
      const filenameWithExtension = 'dog.t';
      const expected = ['dog', 't'];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('handles long extension', () => {
      const filenameWithExtension = 'dog.theextension';
      const expected = ['dog', 'theextension'];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });

    it('handles multiple dots in filename', () => {
      const filenameWithExtension = 'dog.txt.bak';
      const expected = ['dog.txt', 'bak'];
      expect(splitFilenameAndExtension(filenameWithExtension)).toEqual(expected);
    });
  });
});