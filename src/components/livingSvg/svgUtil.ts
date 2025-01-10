import { findNonWhiteSpace, findWhiteSpace } from "@/common/regExUtil";

export type SvgAttributeValue = string | number;
export type SvgAttributes = { [key:string]:SvgAttributeValue }
export type SvgTagCallback = (svgText:string, tagName:string, tagPos:number, parseStack:SvgParseStackItem[]) => void;

export type SvgParseStackItem = {
  tagName:string,
  tagPos:number   // Position of the "<" character of the tag, can also serve as a unique ID.
}

function _textToAttributeValue(valueText:string):SvgAttributeValue {
  if (valueText.startsWith('"') && valueText.endsWith('"')) {
    return valueText.slice(1, valueText.length-1);
  } else {
    const numericValue = parseFloat(valueText);
    return isNaN(numericValue) ? valueText : numericValue;
  }
}

const END_TAG_NAME_CHARS = ' \t\r\n/>';
function _findTagNameEnd(svgText:string, fromPos:number):number {
  for (let i = fromPos; i < svgText.length; ++i) {
    if (END_TAG_NAME_CHARS.includes(svgText[i])) return i;
  }
  return -1;
}

function _parseOpenTagName(svgText:string, fromPos:number):string {
  const tagNameEndPos = _findTagNameEnd(svgText, fromPos);
  if (tagNameEndPos === -1) throw Error('Malformed SVG text'); // "<" without a tag name is malformed.
  return svgText.slice(fromPos, tagNameEndPos);
}

const END_TAG_CHARS = '>?-/';
function _findOpenTagEnd(svgText:string, fromPos:number):number {
  let endPos = svgText.indexOf('>', fromPos);
  if (endPos === -1) throw Error('Malformed SVG text');
  while(endPos > 0 && END_TAG_CHARS.includes(svgText[endPos])) --endPos;
  return endPos + 1;
}

function _parseAttributeValueText(svgText:string, fromPos:number, openTagEndPos:number):string {
  if (svgText[fromPos] === '"') {
    const endQuotePos = svgText.indexOf('"', fromPos+1);
    if (endQuotePos === -1) throw Error('Malformed SVG text');
    return svgText.slice(fromPos, endQuotePos+1);
  }
    const whitespacePos = findWhiteSpace(svgText, fromPos + 1);
    const endValuePos = whitespacePos === -1 || whitespacePos > openTagEndPos ? openTagEndPos : whitespacePos;
    return svgText.slice(fromPos, endValuePos);
}

export function parseTagAttributes(svgText:string, tagPos:number):SvgAttributes {
  let pos = tagPos;
  const attributes:SvgAttributes = {};

  pos = _findTagNameEnd(svgText, pos);
  const openTagEndPos = _findOpenTagEnd(svgText, pos);
  if (pos === -1) throw Error('Malformed SVG.');
  while(pos < openTagEndPos) {
    pos = findNonWhiteSpace(svgText, pos);
    const equalPos = svgText.indexOf('=', pos);
    if (equalPos === -1) throw Error('Malformed SVG.');
    const name = svgText.slice(pos, equalPos).trim();
    pos = findNonWhiteSpace(svgText, equalPos+1);
    
    const valueText = _parseAttributeValueText(svgText, pos, openTagEndPos);
    const value = _textToAttributeValue(valueText);
    attributes[name] = value;

    pos += valueText.length;
    pos = findNonWhiteSpace(svgText, pos);
  }
  return attributes;
}

export function parseTagContent(svgText:string, tagPos:number):string {
  let pos = tagPos;
  const tagName = _parseOpenTagName(svgText, pos+1);
  pos = _findOpenTagEnd(svgText, pos+tagName.length+1)+1;
  if (pos === -1) throw Error('Malformed SVG.');
  if (svgText[pos-1] === '/' || svgText[pos-1] === '?' || svgText[pos+1] === '!') return ''; // Self-closed.
  const startContentPos = pos;

  let depth = 1;
  while(pos < svgText.length) {
    const nextTagStartPos = svgText.indexOf('<', pos+1);
    if (nextTagStartPos === -1) throw Error('Malformed SVG.');
    depth += (svgText[nextTagStartPos+1] === '/') ? -1 : 1; // Allows for nested tags in content.
    if (depth === 0) return svgText.slice(startContentPos, nextTagStartPos); // This is the close tag that matches the open tag. Or malformed SVG, which the main parser will catch.
    pos = nextTagStartPos+3; // +3 b/c a one character tagname (<x>) is the smallest possible thing that could be before the next tag.
  }

  throw Error('Malformed SVG.'); // Open tag without a matchin close tag.
}

// Parses an SVG without creating an object model of it, but rather calling a callback for each tag found.
// Parsing of attributes not performed here, but can be done in the callback. tagPos is the position of the "<" character, 
// and it can also serve as a unique ID.
export function parseSvg(svgText:string, onTag:SvgTagCallback):void {
  let fromPos = 0;
  let tagNameStack:SvgParseStackItem[] = [];
  while(fromPos < svgText.length) {
    const nextOpenPos = svgText.indexOf('<', fromPos);
    if (nextOpenPos === -1 || nextOpenPos >= svgText.length) return;
    
    const isOpenTag = svgText[nextOpenPos+1] !== '/';
    if (isOpenTag) {
      const tagName = _parseOpenTagName(svgText, nextOpenPos+1);
      if (!tagName) throw Error('Malformed SVG text'); // "<" without a tag name is malformed.
      if (!tagName.startsWith('!--')) onTag(svgText, tagName, nextOpenPos, tagNameStack);
      tagNameStack.push({tagName, tagPos:nextOpenPos});
      fromPos = nextOpenPos + tagName.length + 1;
    }

    const nextClosePos = svgText.indexOf('>', fromPos);
    if (nextClosePos === -1)  throw Error('Malformed SVG text'); // "<"" without a closing ">" is malformed.
    if (!isOpenTag || svgText[nextClosePos-1] === '/' || svgText[nextOpenPos+1] === '?' || svgText[nextOpenPos+1] === '!') tagNameStack.pop();
    fromPos = nextClosePos + 1;
  }
}