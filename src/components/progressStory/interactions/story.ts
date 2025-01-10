import { wait } from '@/common/waitUtil';
import {Spiel, importSpielFile} from 'sl-spiel';

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
  playLooped:boolean
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

function _showNextMessage() {
  if(!theStoryState) throw Error('Unexpected');

  const {spiel, setTextReplacements, pendingMessages, playLooped} = theStoryState;
  if (!spiel.currentNode) return;

  let dialogue = spiel.currentNode.nextDialogue();
  let characterName = spiel.currentNode.line.character;
  if (pendingMessages.length > 0) {
    const message = pendingMessages.shift();
    if (!message) throw Error('Unexpected');
    characterName = message.character;
    dialogue = message.dialogue;
  } else {
    if (playLooped) {
      spiel.moveNextLooped();
    } else {
      spiel.moveNext();
    }
  }
  
  const duration = 2000;

  const textReplacements:{[key:string]:string} = {};
  textReplacements[characterName] = dialogue;
  setTextReplacements(textReplacements);

  theStoryState.nextDialogTimer = setTimeout(_showNextMessage, duration);
}

export async function startSpiel(waitSeconds:number, spielUrl:string, playLooped:boolean, setTextReplacements:Function) {
  const startTime = Date.now();
  const spiel = await _loadSpiel(spielUrl);
  if (!spiel) return;
  
  theStoryState = {spiel, setTextReplacements, nextDialogTimer:null, pendingMessages:[], playLooped};

  const remainingWait = waitSeconds * 1000 - (Date.now() - startTime);
  await wait(remainingWait);

  _showNextMessage();
}

export function stopSpiel() {
  if(!theStoryState) return;

  if(theStoryState.nextDialogTimer) clearTimeout(theStoryState.nextDialogTimer);
  
  theStoryState = null;
}

export function updateProgress(percentComplete:number) {
  if(!theStoryState) return;
  
  const text = `${percentComplete}%`;
  const reply = theStoryState.spiel.checkForMatch(text);
  if (!reply) return;

  const dialogue = reply.nextDialogue();
  const character = reply.line.character;
  theStoryState.pendingMessages.push({character, dialogue});
}