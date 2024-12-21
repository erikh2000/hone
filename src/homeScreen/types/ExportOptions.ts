import ExportType from "./ExportType"

type ExportOptions = {
  exportType:ExportType,
  includeHeaders:boolean,
  includeColumnNos:number[]
}

export default ExportOptions;