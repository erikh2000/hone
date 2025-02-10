/* Example
{
  "userSettings": [ {"Access Token":""} ],
  "completionUrl": "https://127.0.0.1:11434/api/chat",
  "completionOptions": {
    "method": "POST",
    "headers": { "Content-Type": "application/json", "Authorization": "Bearer $ACCESS_TOKEN"},
    "body": {
      "model": "llama3.1",
      "options": { "temperature": 0 },
      "max_tokens": 512
    }
  },
  "maxRequestsPerMinute": 0
}*/

export type CompletionOptions = {
  method:string;
  headers?:Record<string, string>;
  body:Record<string, unknown>;
};

// Type that mirrors what can be in the llmConfig.json file.
export type JsonCustomLLMConfig = {
  userSettings:Record<string, string>;
  completionUrl:string;
  completionOptions:CompletionOptions;
  maxRequestsPerMinute:number;
}

// Full configuration object with additional settings.
type CustomLLMConfig = JsonCustomLLMConfig & {
  persistUserSettings:boolean;
};

export default CustomLLMConfig;