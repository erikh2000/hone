import { errorToast, infoToast } from "@/components/toasts/toastUtil";
import ExportOptionsDialog from "@/homeScreen/dialogs/ExportOptionsDialog";
import { exportSheetToClipboard, exportSheetToCsvFile, exportSheetToXlsxFile, getColumnNos, removeExcludedColumns } from "@/sheets/sheetUtil";
import HoneSheet from "@/sheets/types/HoneSheet";
import ExportType from "../types/ExportType";
import ExportOptions from "../types/ExportOptions";
import { MIMETYPE_CSV, MIMETYPE_XLSX } from "@/persistence/mimeTypes";
import { setDirty } from "./beforeUnload";

// Same as above but for selecting a filepath to export a CSV.
async function _selectCsvSaveFilepath():Promise<FileSystemFileHandle|null> {
    const saveFileOptions = {
        excludeAcceptAllOption: true,
        types: [{
            description: 'CSV files',
            accept: {
                [MIMETYPE_CSV]: ['.csv'],
            }
        }]
    };
    try {
        const handle:FileSystemFileHandle = await ((window as any).showSaveFilePicker(saveFileOptions));
        return handle;
    } catch(_ignoredAbortError) {
        return null;
    }
}

async function _selectXlsxSaveFilepath():Promise<FileSystemFileHandle|null> {
  const saveFileOptions = {
      excludeAcceptAllOption: true,
      types: [{
          description: 'Excel files',
          accept: {
              [MIMETYPE_XLSX]: ['.xlsx'],
          }
      }]
  };
  try {
      const handle:FileSystemFileHandle = await ((window as any).showSaveFilePicker(saveFileOptions));
      return handle;
  } catch(_ignoredAbortError) {
      return null;
  }
}


export function chooseExportType(setModalDialog:Function) {
  setModalDialog(ExportOptionsDialog.name);
}

async function _exportToClipboard(sheet:HoneSheet, options:ExportOptions) {
  try {
    sheet = removeExcludedColumns(sheet, options.includeColumnNos);
    await exportSheetToClipboard(sheet, options.includeHeaders);
    infoToast('Success - Sheet copied to clipboard. Try pasting it into your target app.');
  } catch(e) {
    console.error(e);
    errorToast('Failed to copy sheet to clipboard.');
  }
}

async function _exportToCsv(sheet:HoneSheet, options:ExportOptions) {
  try {
    sheet = removeExcludedColumns(sheet, options.includeColumnNos);
    const saveFileHandle = await _selectCsvSaveFilepath();
    if (!saveFileHandle) return; // User canceled.
    await exportSheetToCsvFile(sheet, saveFileHandle);
    infoToast('Success - CSV file is saved to your device at the chosen location.');
  } catch(e) {
    console.error(e);
    errorToast('Failed to export sheet to CSV.');
  }
}

async function _exportToExcel(sheet:HoneSheet, options:ExportOptions) {
  try {
    sheet = removeExcludedColumns(sheet, options.includeColumnNos);
    const saveFileHandle = await _selectXlsxSaveFilepath();
    if (!saveFileHandle) return; // User canceled.
    await exportSheetToXlsxFile(sheet, saveFileHandle);
    infoToast('Success - XLSX file is saved to your device at the chosen location.');
  } catch(e) {
    console.error(e);
    errorToast('Failed to export sheet to XLSX.');
  }
}

export async function exportSheet(sheet:HoneSheet|null, options:ExportOptions, setModalDialog:Function) {
  try {
    if (!sheet) throw Error('Unexpected');
    switch(options.exportType) {
      case ExportType.CLIPBOARD: await _exportToClipboard(sheet, options); break; // User might still lose clipboard contents, so don't clear dirty flag.
      case ExportType.CSV: await _exportToCsv(sheet, options); setDirty(false); break;
      case ExportType.EXCEL: await _exportToExcel(sheet, options); setDirty(false); break;
      default: throw Error('Unexpected');
    }
  } finally {
    setModalDialog(null);
  }
}

export function createExportOptionsForSheet(sheet:HoneSheet):ExportOptions {
  return {
    exportType: ExportType.CLIPBOARD,
    includeHeaders: true,
    includeColumnNos: getColumnNos(sheet)
  }
}