import { wait } from '@/common/waitUtil';
import {Spiel, SpielReply, importSpielFile} from 'sl-spiel';

type Message = {
  character:string,
  dialogue:string
}

// Using module-scope singleton below means only one ProgressStory component can be used at a time. If you want to 
// change this later, then you can do something like using a class.
type StoryState = {
  spiel:Spiel,
  pendingMessages:Message[],
  setTextReplacements:Function,
  nextDialogTimer:NodeJS.Timeout|null,
  clearDialogTimer:NodeJS.Timeout|null,
  playLooped:boolean,
  pastReplies:SpielReply[],
  highestPercentComplete:number
}
let theStoryState:StoryState|null = null;

async function _loadSpiel(spielUrl:string):Promise<Spiel|null> {
  try {
    const spielResponse = await fetch(spielUrl);
    const spielText = await spielResponse.text();
    const spiel = importSpielFile(spielText);
    return spiel;
  } catch(e) {
    console.error(`Failed to load spiel from ${spielUrl}. ${e}`);
    return null;
  }
}

const MIN_DIALOGUE_MSECS = 3500;
const BETWEEN_MESSAGE_SILENCE_MSECS = 500;
const MSECS_PER_WORD = 400;
function _getDurationForDialogue(dialogue:string):number {
  const wordCount = dialogue.split(' ').length;
  return Math.max(MIN_DIALOGUE_MSECS, wordCount * MSECS_PER_WORD);
}

function _finishedPlayingSpiel():boolean {
  if(!theStoryState) throw Error('Unexpected');
  const {spiel, playLooped} = theStoryState;
  return !playLooped && !spiel.hasNext;
}

function _showNextMessage() {
  if(!theStoryState) throw Error('Unexpected');
  theStoryState.nextDialogTimer = null; // Clear timer to represent that it is not active.

  const {spiel, setTextReplacements, pendingMessages, playLooped} = theStoryState;
  if (!spiel.currentNode) return;

  let dialogue =  spiel.currentNode.nextDialogue();
  let characterName = spiel.currentNode.line.character;
  let duration = 0;
  const usePendingMessage = pendingMessages.length > 0;
  if (usePendingMessage) {
    const message = pendingMessages.shift();
    if (!message) throw Error('Unexpected');
    characterName = message.character;
    dialogue = message.dialogue;
    duration = _getDurationForDialogue(dialogue);
  } else {
    characterName = spiel.currentNode.line.character;
    dialogue =  spiel.currentNode.nextDialogue();
    duration = _getDurationForDialogue(dialogue) + spiel.currentNode.postDelay;
  }

  const textReplacements:{[key:string]:string} = {};
  textReplacements[characterName] = dialogue;
  setTextReplacements(textReplacements);
  theStoryState.clearDialogTimer = setTimeout(() => setTextReplacements({}), duration - BETWEEN_MESSAGE_SILENCE_MSECS); // The gap is important to signal to the user a new message is coming.

  if(_finishedPlayingSpiel() && theStoryState.pendingMessages.length === 0) return;

  if (!usePendingMessage) {
    if (playLooped) {
      spiel.moveNextLooped();
    } else {
      spiel.moveNext();
    }
  }
  theStoryState.nextDialogTimer = setTimeout(_showNextMessage, duration);
}

let isStarting = false;
export async function startSpiel(waitSeconds:number, spielUrl:string, playLooped:boolean, setTextReplacements:Function) {
  if (isStarting) return;
  isStarting = true;
  try {
    const startTime = Date.now();
    const spiel = await _loadSpiel(spielUrl);
    if (!spiel) return;
    theStoryState = {spiel, setTextReplacements, nextDialogTimer:null, clearDialogTimer:null,
      pendingMessages:[], playLooped, highestPercentComplete:0, pastReplies:[]};
    const remainingWait = waitSeconds * 1000 - (Date.now() - startTime);
    await wait(remainingWait);
    _showNextMessage();
  } catch(e) {
    console.error(`Failed to start spiel.`, e);
  } finally {
    isStarting = false;
  }
}

export function stopSpiel() {
  if (!theStoryState) return;
  if (theStoryState.nextDialogTimer) clearTimeout(theStoryState.nextDialogTimer);
  if (theStoryState.clearDialogTimer) clearTimeout(theStoryState.clearDialogTimer);
  theStoryState = null;
}

function _addReplyAsPendingMessage(reply:SpielReply) {
  if(!theStoryState) throw Error('Unexpected');
  theStoryState.pastReplies.push(reply);
  const dialogue = reply.nextDialogue();
  const character = reply.line.character;
  theStoryState.pendingMessages.push({character, dialogue});
  if (_finishedPlayingSpiel() && theStoryState.nextDialogTimer === null) _showNextMessage();
}

export function updateProgress(percentComplete:number) {
  if(!theStoryState) return;
  const lastPercentComplete = theStoryState.highestPercentComplete;
  const currentPercentComplete = Math.floor(percentComplete * 100);
  theStoryState.highestPercentComplete = currentPercentComplete;
  for(let checkPercent = currentPercentComplete; checkPercent > lastPercentComplete; checkPercent--) {
    const text = `${checkPercent}%`;
    const reply = theStoryState.spiel.checkForMatch(text);
    if (reply && !theStoryState.pastReplies.includes(reply)) { 
      _addReplyAsPendingMessage(reply);
      return;
    }
  }
}

export function updateCurrentTask(currentTask:string) {
  if(!theStoryState) return;
  const reply = theStoryState.spiel.checkForMatch(currentTask);
  if (reply && !theStoryState.pastReplies.includes(reply)) _addReplyAsPendingMessage(reply);  
}