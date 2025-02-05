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
  method: string;
  headers?: Record<string, string>;
  body: Record<string, unknown>;
};

type CustomLLMConfig = {
  userSettings: Record<string, string>;
  completionUrl: string;
  completionOptions: CompletionOptions;
  maxRequestsPerMinute: number;
};

export default CustomLLMConfig;