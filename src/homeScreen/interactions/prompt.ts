import { generate, isLlmConnected } from "@/llm/llmUtil";

export const SYSTEM_MESSAGE = ""

export const GENERATING = '...';

export async function submitPrompt(prompt:string, setPrompt:Function, setResponseText:Function) {
    setResponseText(GENERATING);
    try {
      if (!isLlmConnected()) { setResponseText('LLM is not connected. This happens in dev environments with hot reload. You can reload from the start URL.'); return; }
      generate(prompt, (status:string) => setResponseText(status));
      setPrompt('');
    } catch(e) {
      console.error('Error while generating response.', e);
      setResponseText('Error while generating response.');
    }
}