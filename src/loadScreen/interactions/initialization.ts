import { HOME_URL } from "@/common/urlUtil";
import { errorToast } from "@/components/toasts/toastUtil";
import { customLlmLoadConfig } from "@/llm/customLlmUtil";
import { connect as connectLlm, predictLoadTime } from "@/llm/llmUtil.ts";
import CustomLLMConfig from "@/llm/types/CustomLLMConfig";

let isInitialized = false;
let isInitializing = false;

enum LoadStage {
  START = 0,
  DOWNLOAD_MODEL = 1,
  LOAD_FROM_CACHE = 2,
  LOAD_TO_GPU = 3,
  UNKNOWN = 4
}
export type InitResults = {
  customLlmConfig:CustomLLMConfig|null;
}

// Format: Blah blah [3/45] blah blah
function _findProgressFromWebLLMStatus(status:string):[x:number, ofY:number]|null {
  const leftBracketPos = status.indexOf('[');
  if (leftBracketPos === -1) return null;
  const divisorPos = status.indexOf('/', leftBracketPos+1);
  if (divisorPos === -1) return null;
  const rightBracketPos = status.indexOf(']', divisorPos+1);
  if (rightBracketPos === -1) return null;
  const leftValue = parseInt(status.substring(leftBracketPos+1, divisorPos));
  const rightValue = parseInt(status.substring(divisorPos+1, rightBracketPos));
  if (isNaN(leftValue) || isNaN(rightValue) || rightValue === 0) return null;

  return [leftValue, rightValue];
}

/*
Example statuses:
  Start to fetch params
  Fetching param cache[4/108]: 160MB fetched. 3% completed, 7 secs elapsed. It can take a while when we first visit this page to populate the cache. Later refreshes will become faster.
  Loading model from cache[1/108]: 0MB loaded. 0% completed, 0 secs elapsed.
  Loading GPU shader modules[75/75]: 100% completed, 1 secs elapsed.
*/
function _findStageFromWebLLMStatus(status:string):LoadStage {
  status = status.trim().toLowerCase();
  if (status === '' || status.includes('fetch params')) return LoadStage.START;
  if (status.includes('fetching param cache')) return LoadStage.DOWNLOAD_MODEL;
  if (status.includes('loading model from cache')) return LoadStage.LOAD_FROM_CACHE;
  if (status.includes('gpu')) return LoadStage.LOAD_TO_GPU;
  console.warn(`Unknown status: "${status}".`); // Check coupling with WebLLM's status messages.
  return LoadStage.UNKNOWN;
}
  
function _simplifyStatus(status:string):string {
  const stage = _findStageFromWebLLMStatus(status);
  const stageProgress = _findProgressFromWebLLMStatus(status);
  const progressText = stageProgress ? ` (${stageProgress[0]}/${stageProgress[1]})` : '';
  switch(stage) {
    case LoadStage.START:
      return `Starting...${progressText}`;
    case LoadStage.DOWNLOAD_MODEL:
      return `Downloading the LLM from a cloud server to your browser cache...${progressText}`;
    case LoadStage.LOAD_FROM_CACHE:
      return `Loading the LLM from your browser's cache to memory...${progressText}`;
    case LoadStage.LOAD_TO_GPU:
      return `Loading the LLM onto your video card...${progressText}`;
    case LoadStage.UNKNOWN:
      return `Grinding away...${progressText}`;
  }
  return status;
}

let stagesSoFar:LoadStage[] = [];
let highestPercentComplete = 0;
function _findPercentCompleteFromStatus(status:string):number|null {
  const stage = _findStageFromWebLLMStatus(status);
  
  if (!stagesSoFar.includes(stage)) stagesSoFar.push(stage);

  let start = 0, end = 1;
  switch(stage) {
    case LoadStage.START: 
      start = 0; end = .01; 
    break;

    case LoadStage.DOWNLOAD_MODEL: 
    case LoadStage.LOAD_FROM_CACHE:
      start = .01; end = .90;
    break;

    case LoadStage.LOAD_TO_GPU:
      start = .90; end = .99;
    break;

    // A fall through when my parsing fails.
    case LoadStage.UNKNOWN:
      start = 0; end = 1;
    break;

    default: throw Error('Unexpected');
  }
  const duration = end - start;

  const [leftValue, rightValue] = _findProgressFromWebLLMStatus(status) || [0, 0];
  if (rightValue === 0) return highestPercentComplete;
  const progress = start + ((leftValue / rightValue) * duration);
  if (progress > highestPercentComplete) highestPercentComplete = progress;
  if (progress > 1) { console.warn(`Progress is over 100%: ${progress}`); return 1; }
  return progress;
}

export async function init():Promise<InitResults|null> {
  if (isInitialized || isInitializing) return null;
  const initResults:InitResults = { customLlmConfig:null };

  try {
    isInitializing = true;
    initResults.customLlmConfig = await customLlmLoadConfig();
    isInitialized = true;
    return initResults;
  } catch(e) {
    console.error(e);
    return null;
  } finally {
    isInitializing = false;
  }
}

export async function useCustomLlm(customLLMConfig:CustomLLMConfig|null, setModalDialog:Function, setLocation:Function) {
  if (!isInitialized || isInitializing || !customLLMConfig) throw Error('Unexpected');
  try {
    setModalDialog(null);
    await connectLlm(() => {}, customLLMConfig);
    setLocation(HOME_URL);
  } catch(e) {
    errorToast('Error: ' + e);
    console.error(e);
    return false;
  }
}

export async function useLocalLlm(setPercentComplete:Function, setCurrentTask:Function, setSpielUrl:Function, setModalDialog:Function, setLocation:Function) {
  if (!isInitialized || isInitializing) throw Error('Unexpected');
  
  try {
    function _onStatusUpdate(status:string, percentComplete:number) {
      const statusPercentComplete = _findPercentCompleteFromStatus(status); // For WebLLM, it's better to parse percent complete from status text.
      percentComplete = Math.max(percentComplete, statusPercentComplete || 0);
      setPercentComplete(percentComplete);
      const simplifiedStatus = _simplifyStatus(status);
      setCurrentTask(simplifiedStatus);
    }

    setModalDialog(null);
    highestPercentComplete = 0;
    stagesSoFar = [];
    const predictedLoadTime = await predictLoadTime();
    const spielUrl = predictedLoadTime < 30000 ? '/loading/calmPete30.spiel' : '/loading/calmPete120.spiel';
    setSpielUrl(spielUrl);
    await connectLlm(_onStatusUpdate);
    setLocation(HOME_URL);
  } catch(e) {
    errorToast('Error: ' + e);
    console.error(e);
  }
}

