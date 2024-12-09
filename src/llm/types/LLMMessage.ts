type LLMMessage = {
  role: string;
  content: string;
  tool_call_id?: string;
}

export default LLMMessage;