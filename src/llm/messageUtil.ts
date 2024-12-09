import LLMMessage from "./types/LLMMessage";
import LLMMessages from "./types/LLMMessages";

let toolCallId = 0;

export function addUserMessageToChatHistory(messages:LLMMessages, prompt:string) {
  messages.chatHistory.push({role:'user', content:prompt});
  if (messages.chatHistory.length > messages.maxChatHistorySize) messages.chatHistory.shift();
}

export function addAssistantMessageToChatHistory(messages:LLMMessages, message:string) {
  messages.chatHistory.push({role:'assistant', content:message});
  if (messages.chatHistory.length > messages.maxChatHistorySize) messages.chatHistory.shift();
}

export function addToolMessageToChatHistory(messages:LLMMessages, message:string) {
  messages.chatHistory.push({role:'tool', content:message, tool_call_id:`${++toolCallId}`});
  if (messages.chatHistory.length > messages.maxChatHistorySize) messages.chatHistory.shift();
}

export function createChatHistory(messages:LLMMessages, prompt:string) {
  const chatHistory:LLMMessage[] = [];
  if (messages.systemMessage) chatHistory.push({role:'system', content:messages.systemMessage});
  for (const chatMessage of messages.chatHistory) { chatHistory.push(chatMessage); }
  chatHistory.push({role:'user', content:prompt});
  return chatHistory;
}