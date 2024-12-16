import HoneSheet from "./HoneSheet"

type ExecutionJob = {
  sheet:HoneSheet,                  // By reference. Take care not to mutate.
  promptTemplate:string,            // The template to be used for the prompt. Can contain {columnName} syntax.
  predictedExecutionSeconds:number, // The predicted execution time in seconds of the entire job.
  writeExisting:boolean,            // If true, prompt results will be written to an existing column. If false, they'll be written to a new column.
  writeColumnName:string,           // The name of the existing column to write to, or the name of the new column.
  writeStartRowNo:number,           // Starting row number (1-based) to write to
  writeEndRowNo:number,             // Ending row number (1-based) to write to, inclusive.
  onlyOverwriteBlanks:boolean,      // If true, only overwrite blank values in the column. Meaningless if writeExisting is false.
  unprocessedRowCount:number        // The number of rows that have not yet been processed.
}

export default ExecutionJob;