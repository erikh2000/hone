import { useState, useEffect } from "react";

import ExecutionJob from "@/sheets/types/ExecutionJob";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import DialogButton from "@/components/modalDialogs/DialogButton";
import { copyExecutionJob, countUnprocessedRows, predictExecutionSeconds } from "@/sheets/executionJobUtil";
import { describeDuration } from "@/common/timeUtil";
import styles from './ExecuteSetupDialog.module.css';
import Selector from "@/components/selector/Selector";
import { getColumnNames, getWritableColumnNames } from "@/sheets/sheetUtil";
import { findUniqueName } from "@/common/nameUtil";
import NumericInputRange from "@/components/numericInputRange/NumericInputRange";

type Props = {
  isOpen:boolean,
  defaultOptions:ExecutionJob|null,
  onExecute(job:ExecutionJob):void,
  onCancel():void
}

const ALL_ROWS = 0;
const SOME_ROWS = 1;

const NEW_COLUMN = 0;
const EXISTING_COLUMN = 1;

const OVERWRITE_ALL = 0;
const OVERWRITE_BLANKS = 1;

function ExecuteSetupDialog({isOpen, defaultOptions, onExecute, onCancel}:Props) {
  const [rowRangeOptionNo, setRowRangeOptionNo] = useState<number>(ALL_ROWS);
  const [outputToOptionNo, setOutputToOptionNo] = useState<number>(NEW_COLUMN);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [writeStartRowNo, setWriteStartRowNo] = useState<number>(1);
  const [writeEndRowNo, setWriteEndRowNo] = useState<number>(1);
  const [writableColumnNames, setWritableColumnNames] = useState<string[]>([]);
  const [writableColumnOptionNo, setWritableColumnOptionNo] = useState<number>(0);
  const [unprocessedRowCount, setUnprocessedRowCount] = useState<number>(0);
  const [predictedExecutionSeconds, setPredictedExecutionSeconds] = useState<number>(0);
  const [overwriteOptionNo, setOverwriteOptionNo] = useState<number>(OVERWRITE_BLANKS);

  useEffect(() => {
    if (!isOpen || !defaultOptions) return;

    // Set up UI based on job values.
    setWritableColumnNames(getWritableColumnNames(defaultOptions.sheet));
    setRowRangeOptionNo(defaultOptions.writeEndRowNo - defaultOptions.writeStartRowNo === defaultOptions.sheet.rows.length ? ALL_ROWS : SOME_ROWS);
    setOutputToOptionNo(defaultOptions.writeExisting ? NEW_COLUMN : EXISTING_COLUMN);
    if (defaultOptions.writeExisting) {
      setNewColumnName(findUniqueName(defaultOptions.writeColumnName, getColumnNames(defaultOptions.sheet)));
      setWritableColumnOptionNo(writableColumnNames.indexOf(defaultOptions.writeColumnName));
    } else {
      setNewColumnName(defaultOptions.writeColumnName);
    }
    setWriteStartRowNo(defaultOptions.writeStartRowNo);
    setWriteEndRowNo(defaultOptions.writeEndRowNo);
    setUnprocessedRowCount(defaultOptions.unprocessedRowCount);
    setPredictedExecutionSeconds(defaultOptions.predictedExecutionSeconds);
    setOverwriteOptionNo(defaultOptions.onlyOverwriteBlanks ? OVERWRITE_BLANKS : OVERWRITE_ALL);
  }, [isOpen, defaultOptions]);

  // Update unprocessed row count and predicted execution time whenever user input changes a value that affects it.
  useEffect(() => {
    if (!defaultOptions) return;
    const writeColumnName = outputToOptionNo === NEW_COLUMN ? newColumnName : writableColumnNames[writableColumnOptionNo];
    const onlyOverwriteBlanks = overwriteOptionNo === OVERWRITE_BLANKS;
    const startRowNo = rowRangeOptionNo === ALL_ROWS ? 1 : writeStartRowNo;
    const endRowNo = rowRangeOptionNo === ALL_ROWS ? defaultOptions.sheet.rows.length : writeEndRowNo;
    const nextUnprocessedRowCount = countUnprocessedRows(defaultOptions.sheet, writeColumnName, startRowNo, endRowNo, onlyOverwriteBlanks);
    setUnprocessedRowCount(nextUnprocessedRowCount);
    setPredictedExecutionSeconds(predictExecutionSeconds(nextUnprocessedRowCount));
  }, [defaultOptions, rowRangeOptionNo, outputToOptionNo, newColumnName, writeStartRowNo, writeEndRowNo, writableColumnOptionNo, overwriteOptionNo]);

  if (!defaultOptions || !isOpen) return null;

  const { promptTemplate, sheet } = defaultOptions;
  const rowCountText = unprocessedRowCount === 1 ? '1 row' : `${unprocessedRowCount} rows`;
  const predictedDuration = describeDuration(predictedExecutionSeconds);

  function _handleExecute() {
    if (!defaultOptions) return;
    const job = copyExecutionJob(defaultOptions);
    job.writeExisting = outputToOptionNo === EXISTING_COLUMN;
    job.writeColumnName = outputToOptionNo === NEW_COLUMN ? newColumnName : writableColumnNames[writableColumnOptionNo];
    job.writeStartRowNo = rowRangeOptionNo === ALL_ROWS ? 1 : writeStartRowNo;
    job.writeEndRowNo = rowRangeOptionNo === ALL_ROWS ? sheet.rows.length : writeEndRowNo;
    job.onlyOverwriteBlanks = overwriteOptionNo === OVERWRITE_BLANKS;
    job.unprocessedRowCount = unprocessedRowCount;
    job.predictedExecutionSeconds = predictedExecutionSeconds;
    onExecute(job);
  }

  function _handleWriteRangeChange(leftValue:number, rightValue:number) {
    setWriteStartRowNo(leftValue);
    setWriteEndRowNo(rightValue);
  }

  const someRangeOptions = rowRangeOptionNo === SOME_ROWS ? (
    <div className={styles.jobRow}>
      <label>Range from</label>
      <NumericInputRange minValue={1} maxValue={sheet.rows.length} allowSameValues
        onChange={_handleWriteRangeChange} leftValue={writeStartRowNo} rightValue={writeEndRowNo} digitWidth={6}
      />
      &nbsp;<span>({rowCountText})</span>
    </div>
  ) : null;

  const areWritableColumnsAvailable = writableColumnNames.length > 0;
  const outputToSelector = areWritableColumnsAvailable ? (
    <Selector label="Output to" optionNames={['new column', 'existing column']} selectedOptionNo={outputToOptionNo} onChange={setOutputToOptionNo} />
  ) : null;

  const outputToOptions = outputToOptionNo === NEW_COLUMN ? (
    <div className={styles.jobRow}>
      <label>{areWritableColumnsAvailable ? 'New column:' : 'Output to new column:'}</label>
      <input type="text" value={newColumnName} onChange={(e) => {setNewColumnName(e.target.value)}} />
    </div>
  ) : (
    <>
      <Selector label="Existing column" optionNames={writableColumnNames} selectedOptionNo={writableColumnOptionNo} onChange={setWritableColumnOptionNo} />
      <Selector label="Overwrite" optionNames={['all values', 'only blank values']} selectedOptionNo={overwriteOptionNo} onChange={setOverwriteOptionNo} />
    </>
  );

  return (
    <ModalDialog isOpen={isOpen} title="Execution Setup" onCancel={onCancel}>
      <p>Get ready to run your prompt across multiple rows of the &quot;{sheet.name}&quot; sheet.</p>
      <div className={styles.jobForm}>
        <div className={styles.jobRow}>
          <label>Run prompt:</label>
          <span>&quot;{promptTemplate}&quot;</span>
        </div>
        <Selector label="On" optionNames={['all rows', 'some rows']} selectedOptionNo={rowRangeOptionNo} onChange={setRowRangeOptionNo} />
        {someRangeOptions}
        {outputToSelector}
        {outputToOptions}
        <div className={styles.jobRow}>
          <label>Predicted time to execute:</label>
          <span>{predictedDuration}</span>
        </div>
      </div>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Execute" onClick={() => _handleExecute()} isPrimary disabled={defaultOptions===null}/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ExecuteSetupDialog;