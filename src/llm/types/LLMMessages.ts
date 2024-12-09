import LLMMessage from "./LLMMessage";

type LLMMessages = {
  chatHistory:LLMMessage[],
  maxChatHistorySize:number;
  systemMessage:string|null;
}

export default LLMMessages;