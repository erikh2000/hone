import { MIMETYPE_CSV, MIMETYPE_TSV, MIMETYPE_XLS, MIMETYPE_XLSX } from "@/persistence/mimeTypes";
import { errorToast } from '@/components/toasts/toastUtil';
import { baseUrl } from '@/common/urlUtil';
import ImportSheetDialog from '@/homeScreen/dialogs/ImportSheetDialog';
import HoneSheet from '@/sheets/types/HoneSheet';
import ImportOptions from '@/homeScreen/types/ImportOptions';
import ImportType from '@/homeScreen/types/ImportType';
import { importSheetFromClipboard, importSheetFromClipboardData, importSheetFromCsvFile, importSheetsFromXlsBytes, importSheetsFromXlsFile, SheetErrorType } from '@/sheets/sheetUtil';
import { CvsImportErrorType, MAX_FIELD_COUNT } from '@/csv/csvImportUtil';
import ConfirmSheetPasteDialog from "../dialogs/ConfirmSheetPasteDialog";

async function _selectExcelFileHandle():Promise<FileSystemFileHandle|null> {
    const openFileOptions = {
        excludeAcceptAllOption: true,
        multiple:false,
        types: [{
            description: 'Excel files',
            accept: {
                [MIMETYPE_XLS]: ['.xls'],
                [MIMETYPE_XLSX]: ['.xlsx']
            }
        }]
    };
    try {
        const handles:FileSystemFileHandle[] = await ((window as any).showOpenFilePicker(openFileOptions));
        return handles[0];
    } catch(_ignoredAbortError) {
        return null;
    }
}

async function _selectCsvFileHandle():Promise<FileSystemFileHandle|null> {
    const openFileOptions = {
        excludeAcceptAllOption: true,
        multiple:false,
        types: [{
            description: 'CSV or TSV files',
            accept: {
                [MIMETYPE_CSV]: ['.csv'],
                [MIMETYPE_TSV]: ['.tsv']
            }
        }]
    };
    try {
        const handles:FileSystemFileHandle[] = await ((window as any).showOpenFilePicker(openFileOptions));
        return handles[0];
    } catch(_ignoredAbortError) {
        return null;
    }
}

export function onSelectSheet(sheet:HoneSheet, setAvailableSheets:Function, setSheet:Function, setModalDialog:Function) {
    setAvailableSheets([]);
    setSheet(sheet);
    setModalDialog(null);
}

async function _importFromClipboard(importOptions:ImportOptions, setSheet:Function, setModalDialog:Function) {
    try {
        const sheet = await importSheetFromClipboard(importOptions.useFirstRowColumnNames, importOptions.sheetName);
        setSheet(sheet);
        setModalDialog(null);
    } catch(e:any) {
        switch(e.name) {
            case SheetErrorType.NO_CLIPBOARD_ACCESS:
                errorToast('Please allow clipboard access for this website in your browser seetings and try again.');
                return;
            case SheetErrorType.CLIPBOARD_NO_ROWS: case CvsImportErrorType.NO_DATA:
                errorToast(`The pasted data didn't include any rows. Maybe try copying and pasting the data again?`);
                return;
            case SheetErrorType.UNEXPECTED_CLIPBOARD_ERROR:
                errorToast(`There was a problem pasting. Please try again.`);
                return;
            case CvsImportErrorType.FIELD_COUNT_MISMATCH: case CvsImportErrorType.UNSTRUCTURED_DATA:
                errorToast(`Some of the pasted data was in an unexpected format. Maybe try copying and pasting the data again?`);
                return;
            case CvsImportErrorType.TOO_MANY_FIELDS:
                errorToast(`The pasted data had too many columns. (Max supported is ${MAX_FIELD_COUNT}). Maybe try copying a smaller set of columns?`);
                return;
            default:
                console.error(e);
                errorToast(`There was an unexpected error importing the pasted data.`);
                return;
        }
    }
}

export async function importFromPasteEvent(event:ClipboardEvent, setAvailableSheets:Function, setModalDialog:Function) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    try {
      const honeSheet = await importSheetFromClipboardData(clipboardData, 'Pasted');
      setAvailableSheets([honeSheet]);
      setModalDialog(ConfirmSheetPasteDialog.name);
    } catch(e:any) {
        setModalDialog(null);
        switch(e.name) {
            // Most errors will be quietly ignored because the user might have accidentally tried to paste something that wasn't a table.
            // They can use the "import" feature to express their intent more clearly and get more feedback on import problems.
            case SheetErrorType.CLIPBOARD_NO_ROWS: case CvsImportErrorType.NO_DATA:
            case SheetErrorType.UNEXPECTED_CLIPBOARD_ERROR:
            case CvsImportErrorType.FIELD_COUNT_MISMATCH: case CvsImportErrorType.UNSTRUCTURED_DATA:
                return;
            
            case CvsImportErrorType.TOO_MANY_FIELDS:
                errorToast(`The pasted data had too many columns. (Max supported is ${MAX_FIELD_COUNT}). Maybe try copying a smaller set of columns?`);
                return;
            
            default:
                console.error(e); // Debug error probably.
                return;
        }
    }
}

async function _importFromCsv(importOptions:ImportOptions, setSheet:Function, setModalDialog:Function) {
    try {
        const fileHandle = await _selectCsvFileHandle();
        if (!fileHandle) { setModalDialog(null); return; } // Not an error, user canceled.
        const sheet = await importSheetFromCsvFile(fileHandle, importOptions.useFirstRowColumnNames);
        setSheet(sheet);
        setModalDialog(null);
    } catch(e:any) {
        switch(e.name) {
            case SheetErrorType.READ_FILE_ERROR:
                errorToast('There was a problem reading the file itself - maybe permission-related.');
                return;
            case SheetErrorType.CLIPBOARD_NO_ROWS: case CvsImportErrorType.NO_DATA:
                errorToast(`The CSV file didn't include any rows, so I couldn't use it.`);
                return;
            case CvsImportErrorType.FIELD_COUNT_MISMATCH: case CvsImportErrorType.UNSTRUCTURED_DATA:
                errorToast(`Some of the CSV data was in an unexpected format, so I couldn't use it.`);
                return;
            case CvsImportErrorType.TOO_MANY_FIELDS:
                errorToast(`The CSV data had too many columns. (Max supported is ${MAX_FIELD_COUNT}). Maybe try exporting a smaller set of columns?`);
                return;
            default:
                console.error(e);
                errorToast(`There was an unexpected error importing the CSV file.`);
                return;
        }
    }
}

async function _importFromExcel(setAvailableSheets:Function, setSheet:Function, setModalDialog:Function) {
    try {
        const fileHandle = await _selectExcelFileHandle();
        if (!fileHandle) { setModalDialog(null); return; } // Not an error, user canceled.
        const sheets:HoneSheet[] = await importSheetsFromXlsFile(fileHandle, errorToast);
        if (sheets.length === 0) {
            errorToast('The Excel file didn\'t have any usable sheets.'); // TODO I need to think about giving enough information for the user to diagnose the problem. Also, some kinds of errors should have recoverability.
            return;
        }
        if (sheets.length === 1) { // If only one sheet, import it directly.
            setSheet(sheets[0]);
            setAvailableSheets([]);
            setModalDialog(null);
            return;
        }
        setAvailableSheets(sheets); //Otherwise, need to let user choose a sheet.
        setSheet(null);
        setModalDialog(ImportSheetDialog.name);
    } catch(e:any) {
        switch(e.name) {
            case SheetErrorType.READ_FILE_ERROR:
                errorToast('There was a problem reading the file itself - maybe permission-related.');
                return;
            case SheetErrorType.XLS_FORMAT_ERROR:
                errorToast(`The Excel file was in an unexpected format, so I couldn't use it.`);
                return;
            default:
                console.error(e);
                errorToast(`There was an unexpected error importing the Excel file.`);
                return;
        }
    }
}

async function _importExample(setAvailableSheets:Function, setModalDialog:Function):Promise<void> {
    try {
        const response = await fetch(baseUrl('/example/Examples.xlsx'));
        const data = new Uint8Array(await response.arrayBuffer());
        const sheets:HoneSheet[] = await importSheetsFromXlsBytes(data, skipSheetErrorMessage => console.error(skipSheetErrorMessage)); // Any import error is unexpected debug error.
        if (sheets.length < 1) throw Error('Unexpected');
        setAvailableSheets(sheets);
        setModalDialog(ImportSheetDialog.name);
    } catch(e) {
        console.error(e);
        errorToast('There was an unexpected error importing the example file.');
    }
}

export async function importSheet(importOptions:ImportOptions, setAvailableSheets:Function, setSheet:Function, setModalDialog:Function) {
    switch(importOptions.importType) {
        case ImportType.CLIPBOARD:
            await _importFromClipboard(importOptions, setSheet, setModalDialog);
        return;

        case ImportType.CSV:
            await _importFromCsv(importOptions, setSheet, setModalDialog);
        return;

        case ImportType.EXCEL:
            await _importFromExcel(setAvailableSheets, setSheet, setModalDialog);
        return;

        case ImportType.EXAMPLE:
            await _importExample(setAvailableSheets, setModalDialog);
        return;

        default:
            throw Error('Unexpected');
    }
}