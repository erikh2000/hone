import HoneSheet from "./HoneSheet"

type ExecutionJob = {
  sheet:HoneSheet,                  // When job starts, this is the original sheet. When job ends, this is the updated sheet (new instance).
  
  // These values set at job start.
  promptTemplate:string,            // The template to be used for the prompt. Can contain {columnName} syntax.
  writeExisting:boolean,            // If true, prompt results will be written to an existing column. If false, they'll be written to a new column.
  writeColumnName:string,           // The name of the existing column to write to, or the name of the new column.
  writeStartRowNo:number,           // Starting row number (1-based) to write to
  writeEndRowNo:number,             // Ending row number (1-based) to write to, inclusive.
  onlyOverwriteBlanks:boolean,      // If true, only overwrite blank values in the column. Meaningless if writeExisting is false.
  jobRowCount:number,               // The number of unprocessed rows before job execution began.

  // These values set during job execution.
  processedRowCount:number,         // The number of rows processed so far.
  currentPrompt:string,             // The prompt currently being processed with {columnName} values for one row filled in.
  timeRemainingText:string          // A human-readable description of the time remaining in the job.
}

export default ExecutionJob;