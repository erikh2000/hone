import ImportType from "./ImportType"

type ImportOptions = {
  sheetName:string,
  importType:ImportType,
  useFirstRowColumnNames:boolean
}

export default ImportOptions;