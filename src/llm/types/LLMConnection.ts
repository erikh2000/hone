import LLMConnectionState from "./LLMConnectionState";
import LLMConnectionType from "./LLMConnectionType";

import * as webllm from "@mlc-ai/web-llm";

type LLMConnection = {
  state:LLMConnectionState,
  webLLMEngine:webllm.MLCEngineInterface|null,
  //webLLMEngine:any,
  serverUrl:string|null,
  connectionType:LLMConnectionType
}

export default LLMConnection;