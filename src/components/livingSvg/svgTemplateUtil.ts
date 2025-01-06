import { parseSvg, parseTagAttributes, SvgParseStackItem } from "./svgUtil";
import SvgTemplate, { TextBox } from "./types/SvgTemplate";


function _onTag(svgText:string, tagName:string, tagPos:number, parseStack:any[]) {
  if (tagName !== 'rect') return;
  console.log(`tagName: ${tagName}, tagPos: ${tagPos}`);
  for(let i = 0; i < parseStack.length; ++i) {
    console.log(`  ${i}: ${parseStack[i].tagName} @ ${parseStack[i].tagPos}`);
  }
  const attributes = parseTagAttributes(svgText, tagPos);
  console.log(attributes);
}

function _viewboxTextToScaleDimensions(viewboxText:string):[number:scaleWidth, number:scaleHeight] {
  const [x, y, width, height] = viewboxText.split(' ').map(Number);
  return [width, height];
}

function _hasParent(parseStack:SvgParseStackItem[], parentTagPos:number):boolean {
  for(let i = 0; i < parseStack.length; ++i) {
    if (parseStack[i].tagPos === parentTagPos) return true;
  }
  return false;
}

function _labelOrId(attributes:any):string {
  const inkscapeLabel = attributes['inkscape:label']; // Using labels is nice because they are easy to set in Inkscape.
  if (inkscapeLabel) return inkscapeLabel;
  return attributes.id ?? ''; // But fall back to IDs if labels are not set.
}

export function createSvgTemplate(url:string, svgText:string):SvgTemplate {
  const textBoxes:TextBox[] = [];
  let scaleWidth = 0, scaleHeight = 0, textGroupPos = -1;

  parseSvg(svgText, (svgText, tagName, tagPos, parseStack) => {
    if (tagName === 'svg') {
      const attributes = parseTagAttributes(svgText, tagPos);
      const viewBox = attributes.viewBox;
      if (!viewBox) throw Error('SVG must have a viewBox attribute.');
      [scaleWidth, scaleHeight] = _viewboxTextToScaleDimensions(viewBox as string);
      return;
    }

    if (tagName === 'g') {
      const attributes = parseTagAttributes(svgText, tagPos);
      if (_labelOrId(attributes) === 'text') { textGroupPos = tagPos; }
    }

    if (tagName === 'rect') {
      if (textGroupPos !== -1 && _hasParent(parseStack, textGroupPos)) {
        const attributes = parseTagAttributes(svgText, tagPos);
        const key = _labelOrId(attributes);
        const x = Number(attributes.x) / scaleWidth;
        const y = Number(attributes.y) / scaleHeight;
        const width = Number(attributes.width) / scaleWidth;
        const height = Number(attributes.height) / scaleHeight;
        textBoxes.push({key, x, y, width, height});
      }
    }
  });
  return {url, textBoxes, svgText};
}

export async function loadSvgTemplate(url:string) {
  const response = await fetch(url);
  const svgText = await response.text(); 
  return createSvgTemplate(url, svgText);
}