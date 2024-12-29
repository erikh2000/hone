class DOMTextMeasurer {
  private _parentElement:HTMLElement;
  private _className:string;
  private _measureElement:HTMLElement|null;
  private _isInitialized:boolean;
  
  constructor(parentElement:HTMLElement, className:string) {
    this._parentElement = parentElement;
    this._className = className;
    this._measureElement = null;
    this._isInitialized = false;
  }

  private _initializeAsNeeded() {
    if (this._isInitialized) return;

    this._measureElement = document.createElement('div');
    this._measureElement.className = this._className;
    this._measureElement.style.position = 'absolute';
    this._measureElement.style.visibility = 'hidden';
    this._measureElement.style.pointerEvents = 'none';
    this._parentElement.appendChild(this._measureElement);

    this._isInitialized = true;
  }

  public measureTextWidth(text:string):number {
    this._initializeAsNeeded();
    if (!this._measureElement) throw 'Unexpected';
    this._measureElement.textContent = text;
    const width = this._measureElement.offsetWidth;
    this._measureElement.textContent = ''; // Save memory.
    return width;
  }
}

export default DOMTextMeasurer;