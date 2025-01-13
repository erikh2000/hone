import { baseUrl } from "@/common/urlUtil";
import { parseSvg, parseTagAttributes, SvgParseStackItem } from "./svgUtil";
import SvgTemplate, { TextBox } from "./types/SvgTemplate";


function _viewboxTextToScaleDimensions(viewboxText:string):[scaleWidth:number, scaleHeight:number] {
  const [_x, _y, width, height] = viewboxText.split(' ').map(Number);
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
        const className = '' + attributes.class;
        textBoxes.push({key, x, y, width, height, className});
      }
    }
  });
  return {url, textBoxes, svgText};
}

export async function loadSvgTemplate(url:string) {
  const response = await fetch(baseUrl(url));
  const svgText = await response.text(); 
  return createSvgTemplate(url, svgText);
}