import { setSystemMessage } from "@/llm/llmUtil";
import { SYSTEM_MESSAGE } from "./prompt";

export async function init() {
  setSystemMessage(SYSTEM_MESSAGE);
}