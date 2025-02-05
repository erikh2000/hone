import CustomLLMConfig from "./CustomLLMConfig";
import LLMConnectionState from "./LLMConnectionState";
import LLMConnectionType from "./LLMConnectionType";

import * as webllm from "@mlc-ai/web-llm";

type LLMConnection = {
  state:LLMConnectionState,
  webLLMEngine:webllm.MLCEngineInterface|null,
  serverUrl:string|null,
  customLLMConfig:CustomLLMConfig|null,
  connectionType:LLMConnectionType
}

export default LLMConnection;