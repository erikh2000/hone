import { errorToast } from "@/components/toasts/toastUtil";
import { clearChatHistory, generate, isLlmConnected } from "@/llm/llmUtil";

export const SYSTEM_MESSAGE = "Output your answer to the following question solely in a JSON format like: {\"r\":\"your answer\"}. You are generating data, not a conversation. No other output should be provided.";

export const GENERATING = '...';

let _isGenerating = false;

export async function submitPrompt(prompt:string, setResponseText:Function):Promise<string|null> {
    let finalResponse = null;
    if (_isGenerating) { console.warn('Tried to call submitPrompt() while generating. Nonfatal error.'); return null;} // If only happening occasionally, it's just a benign race condition. User might have to click a button one more time.
    _isGenerating = true;
    clearChatHistory();
    setResponseText(GENERATING);
    try {
      if (!isLlmConnected()) { errorToast('LLM is not connected. This happens in dev environments with hot reload. You can reload from the start URL.'); return null; }
      finalResponse = await generate(prompt, (status:string) => setResponseText(`${status}...`));
      setResponseText(finalResponse);
    } catch(e) {
      console.error('Error while generating response.', e);
      errorToast('Error while generating response. If it persists, try reloading the page.');
      setResponseText('Error while generating response.');
    } finally {
      _isGenerating = false;
    }
    return finalResponse;
}

// For React components that call this in rendering function, consider that some prop/state change must happen before the component will re-render. The
// setResponseText() calls in submitPrompt() will probably generating rendering calls as needed.
export function isGenerating():boolean { return _isGenerating; }