import { useEffect, useMemo, useState, useRef } from "react";

import StringMap from '@/common/types/StringMap';
import Pane, { ButtonDefinition } from "@/components/pane/Pane";
import { createRowNameValues } from "@/sheets/sheetUtil";
import styles from './PromptPane.module.css';
import { fillTemplate } from "@/common/stringUtil";
import { insertFieldNameIntoPromptTemplate, isGenerating, promptForSimpleResponse } from "./interactions/prompt";
import HoneSheet from "@/sheets/types/HoneSheet";
import PromptOutputRow from "./PromptOutputRow";
import { fixGrammar } from "@/common/englishGrammarUtil";
import FieldInsertionList from "./FieldInsertionList";

type Props = {
  sheet:HoneSheet,
  className:string,
  testRowNo:number,
  defaultPromptTemplate:string,
  onExecute:(promptTemplate:string) => void
}

function PromptPane({sheet, className, testRowNo, onExecute, defaultPromptTemplate}:Props) {
  const promptTemplateTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [promptTemplate, setPromptTemplate] = useState<string>('');
  const [testRowNameValues, setTestRowNameValues] = useState<StringMap>({});
  const [lastTestOutput, setLastTestOutput] = useState<string>('');

  useEffect(() => {
    if (!sheet) { setTestRowNameValues({}); return; }
    setTestRowNameValues(createRowNameValues(sheet, testRowNo));
  }, [sheet, testRowNo]);

  useEffect(() => {
    setPromptTemplate(defaultPromptTemplate);
  }, [defaultPromptTemplate]);

  if (!sheet) return null;

  const isTestPromptGenerating = isGenerating();
  const disablePrompting = !sheet || promptTemplate === '' || isTestPromptGenerating;

  const buttons:ButtonDefinition[] = [
    { text:`Test One Row`, onClick:() => {promptForSimpleResponse(testPrompt, setLastTestOutput)}, disabled:disablePrompting }, 
    { text:"Execute All Rows", onClick:() => {onExecute(promptTemplate)}, disabled:disablePrompting }];

  const testPrompt = fixGrammar(fillTemplate(promptTemplate, testRowNameValues));
  const testPromptStyle = isTestPromptGenerating ? styles.testPromptGenerating : styles.testPrompt;
  const testPromptContent = testPrompt ? <div className={testPromptStyle}>Testing row #{testRowNo}: "{testPrompt}"</div> : null;
  const columnNames = useMemo(() => sheet.columns.map(column => column.name), [sheet.columns]);

  return (
    <Pane caption="Prompt" className={className} buttons={buttons} comment="Write a prompt to execute against each row of the sheet.">
      <div className={styles.promptForm}>
      <FieldInsertionList 
        columnNames={columnNames} 
        onInsert={fieldName => {
          if (promptTemplateTextAreaRef.current) {
            insertFieldNameIntoPromptTemplate(fieldName, promptTemplateTextAreaRef.current, promptTemplate, setPromptTemplate);
          }
        }} 
        disabled={isTestPromptGenerating}
      />
      <textarea 
        value={promptTemplate} rows={4} 
        placeholder="Enter prompt template here. Use {columnName} syntax to insert row values." 
        onChange={(e) => setPromptTemplate(e.target.value)}
        disabled={isTestPromptGenerating}
        ref={promptTemplateTextAreaRef}
      />
      {testPromptContent}
      <PromptOutputRow sheet={sheet} rowNo={testRowNo} outputValue={lastTestOutput} />
    </div>
    </Pane>
  );
}

export default PromptPane;