import { infoToast } from "@/components/toasts/toastUtil";
import ExportSheetDialog from "@/homeScreen/dialogs/ExportSheetDialog";
import { exportSheetToClipboard, getColumnNos, removeExcludedColumns } from "@/sheets/sheetUtil";
import HoneSheet from "@/sheets/types/HoneSheet";
import ExportType from "../types/ExportType";
import ExportOptions from "../types/ExportOptions";

export function chooseExportType(setModalDialog:Function) {
  setModalDialog(ExportSheetDialog.name);
}

function _exportToClipboard(sheet:HoneSheet, options:ExportOptions) {
  sheet = removeExcludedColumns(sheet, options.includeColumnNos);
  exportSheetToClipboard(sheet, options.includeHeaders);
  infoToast('Sheet copied to clipboard. Try pasting it into your target app.');
}

function _exportToCsv(sheet:HoneSheet, options:ExportOptions) {
  sheet = removeExcludedColumns(sheet, options.includeColumnNos);
  //TODO
}

function _exportToExcel(sheet:HoneSheet, options:ExportOptions) {
  sheet = removeExcludedColumns(sheet, options.includeColumnNos);
  //TODO
}

export function exportSheet(sheet:HoneSheet|null, options:ExportOptions, setModalDialog:Function) {
  if (!sheet) throw Error('Unexpected');
  switch(options.exportType) {
    case ExportType.CLIPBOARD: _exportToClipboard(sheet, options); break;
    case ExportType.CSV: _exportToCsv(sheet, options); break;
    case ExportType.EXCEL: _exportToExcel(sheet, options); break;
    default: throw Error('Unexpected');
  }
  setModalDialog(null); // Close the dialog.
}

export function createExportOptionsForSheet(sheet:HoneSheet):ExportOptions {
  return {
    exportType: ExportType.CLIPBOARD,
    includeHeaders: true,
    includeColumnNos: getColumnNos(sheet)
  }
}