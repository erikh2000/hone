import { useEffect, useState } from "react";

import StringMap from '@/common/types/StringMap';
import Pane, { ButtonDefinition } from "@/components/pane/Pane";
import { createRowNameValues } from "@/sheets/sheetUtil";
import styles from './PromptPane.module.css';
import { fillTemplate } from "@/persistence/pathUtil";
import { isGenerating, submitPrompt } from "./interactions/prompt";
import HoneSheet from "@/sheets/types/HoneSheet";
import PromptOutputRow from "./PromptOutputRow";
import { fixGrammar } from "@/common/englishGrammarUtil";

type Props = {
  sheet:HoneSheet,
  className:string,
  testRowNo:number
}

function _noSheetLoadedContent() {
  return <div>No sheet loaded.</div>;
}

function _content(sheet:HoneSheet|null, promptTemplate:string, setPromptTemplate:Function, 
    testPrompt:string, lastTestOutput:string, testRowNo:number, isTestPromptGenerating:boolean) {
  if (!sheet) return _noSheetLoadedContent();
  
  const testPromptStyle = isTestPromptGenerating ? styles.testPromptGenerating : styles.testPrompt;
  const testPromptContent = testPrompt ? <div className={testPromptStyle}>Testing: "{testPrompt}"</div> : null;

  return (
    <div className={styles.promptForm}>
      <textarea 
        value={promptTemplate} rows={5} 
        placeholder="Enter prompt template here. Use {columnName} syntax to insert row values." 
        onChange={(e) => setPromptTemplate(e.target.value)}
        disabled={isTestPromptGenerating}
      />
      {testPromptContent}
      <PromptOutputRow sheet={sheet} rowNo={testRowNo} outputValue={lastTestOutput} />
    </div>
  )
}

function PromptPane({sheet, className, testRowNo}:Props) {
  const [promptTemplate, setPromptTemplate] = useState<string>('');
  const [testRowNameValues, setTestRowNameValues] = useState<StringMap>({});
  const [lastTestOutput, setLastTestOutput] = useState<string>('');

  useEffect(() => {
    if (!sheet) { setTestRowNameValues({}); return; }
    setTestRowNameValues(createRowNameValues(sheet, testRowNo-1));
  }, [sheet, testRowNo]);

  const testPrompt = fixGrammar(fillTemplate(promptTemplate, testRowNameValues));

  const isTestPromptGenerating = isGenerating();
  const disablePrompting = !sheet || promptTemplate === '' || isTestPromptGenerating;

  const buttons:ButtonDefinition[] = [
    { text:`Test Row #${testRowNo}`, onClick:() => {submitPrompt(testPrompt, setLastTestOutput)}, disabled:disablePrompting }, 
    { text:"Execute...", onClick:() => {}, disabled:disablePrompting }];

  const content = _content(sheet, promptTemplate, setPromptTemplate, testPrompt, lastTestOutput, testRowNo, isTestPromptGenerating);

  return (
    <Pane caption="Prompt" className={className} buttons={buttons} comment="Write a prompt to execute against each row of the sheet.">
      {content}
    </Pane>
  );
}

export default PromptPane;