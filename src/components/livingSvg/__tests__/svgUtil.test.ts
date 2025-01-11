import { parseSvg, parseTagAttributes, parseTagContent } from '../svgUtil';

describe('svgUtil', () => {
  describe('parseSvg()', () => {
    it('does not call onTag for an empty string', () => {
      const onTag = jest.fn();
      parseSvg('', onTag);
      expect(onTag).not.toHaveBeenCalled();
    });

    it('does not call onTag for a string without tags', () => {
      const onTag = jest.fn();
      parseSvg('Hello, world!', onTag);
      expect(onTag).not.toHaveBeenCalled();
    });

    it('does not call onTag for a string with only a comment', () => {
      const onTag = jest.fn();
      parseSvg('<!-- Hello, world! -->', onTag);
      expect(onTag).not.toHaveBeenCalled();
    });

    it('parses an <?xml> tag', () => { 
      const onTag = jest.fn();
      parseSvg('<?xml version="1.0" encoding="UTF-8"?>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('?xml');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('passes the full SVG text in callback', () => {
      const onTag = jest.fn();
      const svgText = '<svg width="100" height="100"><g>What?</g></svg>';
      parseSvg(svgText, onTag);
      expect(onTag).toHaveBeenCalledTimes(2);
      expect(onTag.mock.calls[0][0]).toBe(svgText);
    });

    it('parses a tag', () => {
      const onTag = jest.fn();
      parseSvg('<svg width="100" height="100"></svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('parses a tag offset from beginning of string', () => {
      const onTag = jest.fn();
      parseSvg('Hello, <svg width="100" height="100"></svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(7);
    });

    it('parses a tag with a name that ends with \r', () => {
      const onTag = jest.fn();
      parseSvg('<svg\r width="100" height="100"></svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('parses a tag with a name that ends with \n', () => {
      const onTag = jest.fn();
      parseSvg('<svg\n width="100" height="100"></svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('parses a tag with a name that ends with \t', () => {
      const onTag = jest.fn();
      parseSvg('<svg\t width="100" height="100"></svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('parses a tag with no attributes', () => {
      const onTag = jest.fn();
      parseSvg('<svg></svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('parses a tag with content', () =>{
      const onTag = jest.fn();
      parseSvg('<svg>some text</svg>', onTag);
      expect(onTag).toHaveBeenCalledTimes(1);
      expect(onTag.mock.calls[0][1]).toBe('svg');
      expect(onTag.mock.calls[0][2]).toBe(0);
    });

    it('throws if a < is found without a >', () => {
      const onTag = jest.fn();
      expect(() => parseSvg('<svg', onTag)).toThrow();
    });

    it('throws if one <tag> is found but then a < is found without a >', () => {
      const onTag = jest.fn();
      expect(() => parseSvg('<svg>x<svg/', onTag)).toThrow();
    });

    it('throws if < is found without a tag name following', () => {
      const onTag = jest.fn();
      expect(() => parseSvg('<>x</>', onTag)).toThrow();
    });
  });

  describe('parseTagAttributes()', () => {
    it('returns no attributes for a tag with no attributes', () => {
      const expected = {};
      const attributes = parseTagAttributes('<tag></tag>', 0);
      expect(attributes).toEqual(expected);
    });

    it('returns an attribute for a tag', () => { 
      const expected = {width:'100'};
      const attributes = parseTagAttributes('<tag width="100"></tag>', 0);
      expect(attributes).toEqual(expected);
    });

    it('returns an attribute for a tag offset from beginning of text', () => {
      const expected = {width:'100'};
      const attributes = parseTagAttributes('Hello, <tag width="100"></tag>', 7);
      expect(attributes).toEqual(expected);
    })

    it('returns multiple attributes for a tag', () => {
      const expected = {width:'100', height:'100'};
      const attributes = parseTagAttributes('<tag width="100" height="100"></tag>', 0);
      expect(attributes).toEqual(expected);
    });

    it('returns attribute for a self-closed tag', () => { 
      const expected = {width:'100'};
      const attributes = parseTagAttributes('<tag width="100"/>', 0);
      expect(attributes).toEqual(expected);
    });

    it('returns attribute that has whitespace around quoted value', () => {
      const expected = {width:'100'};
      const attributes = parseTagAttributes('<tag width= "100" ></tag>', 0);
      expect(attributes).toEqual(expected);
    });

    it('returns attribute that has whitespace around equal sign', () => {
      const expected = {width:'100'};
      const attributes = parseTagAttributes('<tag width = "100"></tag>', 0);
      expect(attributes).toEqual(expected);
    });

    it('returns attributes for an <?xml> tag', () => { 
      const expected = {version:'1.0', encoding:'UTF-8'};
      const attributes = parseTagAttributes('<?xml version="1.0" encoding="UTF-8"?>', 0);
      expect(attributes).toEqual(expected);
    });

    it('throws for unquoted attributes in a tag', () => {
      expect(() => parseTagAttributes('<tag x=100></tag>', 0)).toThrow();
    });

    it('throws for an attribute with no value in a tag', () => {
      expect(() => parseTagAttributes('<tag x></tag>', 0)).toThrow();
    });

    it('throws when a pair of quotes spans multiple tags', () => {
      expect(() => parseTagAttributes('<tag x="100/><tag y=200"/>', 0)).toThrow();
    });

    it('throws for a tag that has < but not >', () => {
      expect(() => parseTagAttributes('<tag x="100"', 0)).toThrow();
    });

    it('throws for a tag at end of text that has < but not >', () => {
      expect(() => parseTagAttributes('<tag', 0)).toThrow();
    });
  });

  describe('parseTagContent()', () => {
    it('returns an empty string for a tag with no content', () => {
      const content = parseTagContent('<tag></tag>', 0);
      expect(content).toBe('');
    });

    it('returns an empty string for a self-closed tag', () => {
      const content = parseTagContent('<tag/>', 0);
      expect(content).toBe('');
    });

    it('returns an empty string for an <?xml> tag', () => {
      const content = parseTagContent('<?xml version="1.0" encoding="UTF-8"?>', 0);
      expect(content).toBe('');
    });

    it('returns the content of an all-text tag', () => { 
      const content = parseTagContent('<tag>some text</tag>', 0);
      expect(content).toBe('some text');
    });

    it('returns the content of a tag offset from start of text', () => { 
      const content = parseTagContent('Hello, <tag>some text</tag>', 7);
      expect(content).toBe('some text');
    });

    it('returns content for a tag with nested tags', () => {
      const content = parseTagContent('<tag><subtag>some text</subtag></tag>', 0);
      expect(content).toBe('<subtag>some text</subtag>');
    });

    it('throws if a tag is not closed', () => {
      expect(() => parseTagContent('<tag>text', 0)).toThrow();
    });

    it('throws if a tag is not closed with starting tag at end of text', () => {
      expect(() => parseTagContent('<tag>', 0)).toThrow();
    });

    it('throws for a tag that has < but not >', () => {
      expect(() => parseTagContent('<tag x="100"', 0)).toThrow();
    });
  });
});