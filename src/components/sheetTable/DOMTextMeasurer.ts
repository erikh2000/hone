const MEASURABLE_SPACE = ' \u200B'; // Adding Unicode zero-width character to end will cause the browser to measure the preceding space.

type WordWidths = Record<string,number>;
type WordWidthsCache = Record<string,WordWidths>; 

// Shared per-layout word widths across all instances of DOMTextMeasurer.
const theWordWidthsCache:WordWidthsCache = {};

// Use classname as key to cache word widths specific to that layout. 
// Still possible to have collisions if two different layouts use the same classname. If you have that problem, you can create a separate className for each layout.
function _getOrCreateWordWidths(className:string):WordWidths {
  if (theWordWidthsCache[className]) return theWordWidthsCache[className];
  return theWordWidthsCache[className] = {};
}

class DOMTextMeasurer {
  private _parentElement:HTMLElement;
  private _className:string;
  private _measureElement:HTMLElement|null;
  private _isInitialized:boolean;
  private _wordWidths:Record<string,number>;
  private _lineHeight:number;
  
  // Measurement will be based on styles inherited from both parentElement and className.
  constructor(parentElement:HTMLElement, className:string) {
    this._parentElement = parentElement;
    this._className = className;
    this._measureElement = null;
    this._isInitialized = false;
    this._wordWidths = {};
    this._lineHeight = 0;
  }

  private _initializeAsNeeded() {
    if (this._isInitialized) return;

    this._measureElement = document.createElement('div');
    this._measureElement.className = this._className;
    this._measureElement.style.position = 'absolute';
    this._measureElement.style.visibility = 'hidden';
    this._measureElement.style.pointerEvents = 'none';
    this._parentElement.appendChild(this._measureElement);
    this._wordWidths = _getOrCreateWordWidths(this._className);

    this._measureElement.textContent = 'M';
    this._lineHeight = this._measureElement.offsetHeight;
    this._measureElement.textContent = '';

    this._isInitialized = true;
  }

  public measureTextWidth(text:string):number {
    this._initializeAsNeeded();
    if (!this._measureElement) throw 'Unexpected';
    
    let totalWidth = 0;
    const words = text.split(' ');
    for(let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? MEASURABLE_SPACE : '');
      if (this._wordWidths[word]) {
        totalWidth += this._wordWidths[word];
        continue;
      }
      
      this._measureElement.textContent = word;
      const width = this._measureElement.offsetWidth;
      this._wordWidths[word] = width;
      totalWidth += width;
    }
    
    this._measureElement.textContent = '';
    return totalWidth;
  }

  public getLineHeight():number {
    this._initializeAsNeeded();
    return this._lineHeight;
  }
}

export default DOMTextMeasurer;