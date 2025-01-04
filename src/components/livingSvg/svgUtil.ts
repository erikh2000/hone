import { getShimmerFrames, setShimmerFrames } from "@/persistence/shimmerCache";
import SvgCoordinates from "./types/SvgCoordinates";
import SvgTemplate from "./types/SvgTemplate";

function _parseCoordinates(part:string):SvgCoordinates|null {
  const numberTexts = part.split(',');
  if (numberTexts.length !== 2) return null;
  const x = parseFloat(numberTexts[0]);
  const y = parseFloat(numberTexts[1]);
  if (isNaN(x) || isNaN(y)) return null;
  return {x,y};
}

function _parseTag(part:string):string|null {
  return part.startsWith('<') ? part.slice(1) : null;
}

function _parseAttribute(part:string):string|null {
  const subParts = part.split('=');
  return subParts.length === 2 ? subParts[0] : null;
}

const WHITE_SPACE_REGEX = /\s+/g;
export function createSvgTemplate(url:string, svgText:string):SvgTemplate {
  const parts = svgText.split(WHITE_SPACE_REGEX);
  const templateParts:(string|SvgCoordinates)[] = [];
  let currentTag = '', currentAttribute = '';
  for (let partI = 0; partI < parts.length; ++partI) {
    const part = parts[partI];
    const coordinate = _parseCoordinates(part);
    if (coordinate) {
      templateParts.push(coordinate);
      continue;
    }

    const tag = _parseTag(part);
    if (tag) currentTag = tag;
    const attribute = _parseAttribute(part);
    if (attribute) currentAttribute = attribute;

    // Remove width and height attributes from template so that DOM layout can instead set them.
    if (currentTag === 'svg' && (currentAttribute === 'width' || currentAttribute === 'height')) {
      console.log('Removing width or height attribute from template');
      continue;
    }

    templateParts.push(part);
  }
  return {url, svgText, parts:templateParts};
}

export async function loadSvgTemplate(url:string) {
  const response = await fetch(url);
  const svgText = await response.text(); 
  return createSvgTemplate(url, svgText);
}

export function shimmerSvg(svgTemplate:SvgTemplate, amount:number):string {
  let concat = '';
  const halfAmount = amount / 2;
  for (let partI = 0; partI < svgTemplate.parts.length; ++partI) {
    if (partI > 0) concat += ' ';
    const part = svgTemplate.parts[partI];
    if (typeof part === 'string') {
      concat += part;
      continue;
    }
    const x = part.x + Math.random() * amount - halfAmount;
    const y = part.y + Math.random() * amount - halfAmount;
    concat += `${x},${y}`;
  }
  return concat;
}

function _generateShimmerFrames(svgTemplate:SvgTemplate, amount:number, frameCount:number):string[] {
  const frames:string[] = [];
  for (let frameI = 0; frameI < frameCount; ++frameI) {
    frames.push(shimmerSvg(svgTemplate, frameI === 0 ? 0 : amount)); // First frame is the original. Save processing time by not shimmering it.
  }
  return frames;
}

function _svgTextToBlobUrl(svgText:string):string {
  const blob = new Blob([svgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
}

export async function getOrCreateShimmerBlobUrls(url:string, amount:number, frameCount:number, useCache:boolean = true):Promise<string[]> {
  if (useCache) {
    const cachedFrames = await getShimmerFrames(url);
    if (cachedFrames) return cachedFrames.map(frame => _svgTextToBlobUrl(frame));
  }

  const template = await loadSvgTemplate(url);
  const generatedFrames = _generateShimmerFrames(template, amount, frameCount);
  setShimmerFrames(url, generatedFrames);
  return generatedFrames.map(frame => _svgTextToBlobUrl(frame));
}