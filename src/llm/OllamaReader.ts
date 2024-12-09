function _findFirstJson(text:string):{toPos:number, object:Object}|null {
    let fromPos = text.indexOf('{');
    if (fromPos === -1) return null;
    
    let depth = 1, insideQuotes = false;
    for (let i = fromPos+1; i < text.length; i++) {
        if (text[i] === '\\' && i < text.length - 1 && text[i+1] === '"') { i++; continue; } // Avoid counting escaped quote as a quote.
        if (text[i] === '"') { insideQuotes = !insideQuotes; continue; }
        if (text[i] === '{' && !insideQuotes) { ++depth; continue; }
        if (text[i] === '}' && !insideQuotes) {
            if (--depth > 0) continue;
            const toPos = i + 1;
            const json = text.substring(fromPos, toPos);
            try {
                const object = JSON.parse(json);
                return {toPos, object};
            } catch(e) {
                console.error('Error parsing JSON:', e);
                return null;
            }
        }
    }
    return null;
}

function _getMessageTextFromObject(obj:Object):string {
    return (obj as any).message?.content || '';
}

class OllamaReader {
    private _incompleteText: string;
    private _reader: ReadableStreamDefaultReader<Uint8Array>;
    private _decoder: TextDecoder;
    private _isDoneReading: boolean;
    private _areMoreMessages: boolean;

    constructor(response:Response) {
        this._incompleteText = '';
        if (!response.body) throw Error('Response body is null.');
        this._reader = response.body.getReader();
        this._decoder = new TextDecoder();
        this._areMoreMessages = true;
        this._isDoneReading = false;
    }

    get isMore() { return this._areMoreMessages; }
    
    async readNextJsonObject(): Promise<Object|null> {
        if (!this._areMoreMessages) return null;

        // Parse any already received JSON before reading more data.
        const first = _findFirstJson(this._incompleteText);
        if (first) {
            this._incompleteText = this._incompleteText.substring(first.toPos);
            return first.object;
        }

        if (this._isDoneReading) {
            // Done reading from stream and there are no more messages.
            this._areMoreMessages = false;
            return null;
        }

        if (!this._reader || !this._decoder) throw Error('Object is uninitialized.'); // Look for errors in constructor execution.
        while(true) {
            const { done, value } = await this._reader.read();
            if (done) { this._isDoneReading = true; return ''; } // Done reading from stream.

            this._incompleteText += this._decoder.decode(value, {stream:true});
            const next = _findFirstJson(this._incompleteText);
            if (!next) continue;

            this._incompleteText = this._incompleteText.substring(next.toPos);

            return next.object;
        }
    }

    async readNextMessage(): Promise<string> {
        const obj = await this.readNextJsonObject();
        if (!obj) return '';
        return _getMessageTextFromObject(obj);
    }
}

export default OllamaReader;