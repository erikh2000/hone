import { read, WorkBook } from 'xlsx';

import { MIMETYPE_CSV, MIMETYPE_XLS, MIMETYPE_XLSX } from "@/persistence/mimeTypes";
import { errorToast } from '@/components/toasts/toastUtil';
import { baseUrl } from '@/common/urlUtil';
import ImportSheetDialog from '../dialogs/ImportSheetDialog';
import HoneSheet from '@/sheets/types/HoneSheet';
import ImportOptions from '../types/ImportOptions';
import ImportType from '../types/ImportType';
import { importSheetFromClipboard, SheetErrorType } from '@/sheets/sheetUtil';
import { CvsImportErrorType, MAX_FIELD_COUNT } from '@/csv/csvImportUtil';

async function _selectSpreadsheetFileHandle():Promise<FileSystemFileHandle|null> {
    const openFileOptions = {
        excludeAcceptAllOption: true,
        multiple:false,
        types: [{
            description: 'Excel or CSV files',
            accept: {
                [MIMETYPE_XLS]: ['.xls'],
                [MIMETYPE_XLSX]: ['.xlsx'],
                [MIMETYPE_CSV]: ['.csv'],
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

function _filenameToWorkbookName(filename:string):string {
    const parts = filename.split('.');
    parts.pop();
    return parts.join('.');
}

export async function importWorkbook(onChangeWorkbook:Function):Promise<void> {
    const fileHandle = await _selectSpreadsheetFileHandle();
    if (!fileHandle) return;
    try {
        const file = await fileHandle.getFile();
        const blob = await file.arrayBuffer();
        const data = new Uint8Array(blob);
        const workbook:WorkBook = read(data, {type: 'array'});
        const workbookName = _filenameToWorkbookName(file.name);
        onChangeWorkbook(workbook, workbookName);
    } catch(e) {
        console.error(e);
        errorToast('Failed to import workbook from provided file.');
    }
}

export async function importExample(onChangeWorkbook:Function):Promise<void> {
    try {
        const response = await fetch(baseUrl('/example/Examples.xlsx'));
        const data = await response.arrayBuffer();
        const workbook:WorkBook = read(new Uint8Array(data), {type: 'array'});
        onChangeWorkbook(workbook, 'Example');
    } catch(e) {
        console.error(e);
        errorToast('Failed to import example workbook.');
    }
}

export function onChangeWorkbook(workbook:WorkBook, workbookName:string, setWorkbook:Function, setWorkbookName:Function, setSelectedSheet:Function, setModalDialog:Function) {
    setWorkbook(workbook);
    setWorkbookName(workbookName);
    setSelectedSheet(null);
    if (workbook !== null) setModalDialog(ImportSheetDialog.name);
  }

export function onCancelImportSheet(setWorkbook:Function, setWorkbookName:Function, setSelectedSheet:Function, setModalDialog:Function) {
    setWorkbook(null);
    setWorkbookName('');
    setSelectedSheet(null);
    setModalDialog(null);
  }

export function onSelectSheet(sheet:HoneSheet, setSelectedSheet:Function, setModalDialog:Function) {
    setSelectedSheet(sheet);
    setModalDialog(null);
}

// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS, 
//           SheetError.CLIPBOARD_NO_ROWS, NO_CLIPBOARD_ACCESS, UNEXPECTED_CLIPBOARD_ERROR
async function _importFromClipboard(importOptions:ImportOptions):Promise<HoneSheet|null> {
    try {
        return await importSheetFromClipboard(importOptions.useFirstRowColumnNames);
    } catch(e:any) {
        const errorName = e.name;
        switch(errorName) {
            case SheetErrorType.NO_CLIPBOARD_ACCESS:
                errorToast('Please allow clipboard access for this website in your browser seetings and try again.');
                return null;
            case SheetErrorType.CLIPBOARD_NO_ROWS: case CvsImportErrorType.NO_DATA:
                errorToast(`The pasted data didn't include any rows. Maybe try copying and pasting the data again?`);
                return null;
            case SheetErrorType.UNEXPECTED_CLIPBOARD_ERROR:
                errorToast(`There was a problem pasting. Please try again.`);
                return null;
            case CvsImportErrorType.FIELD_COUNT_MISMATCH: case CvsImportErrorType.UNSTRUCTURED_DATA:
                errorToast(`Some of the pasted data was in an unexpected format. Maybe try copying and pasting the data again?`);
                return null;
            case CvsImportErrorType.TOO_MANY_FIELDS:
                errorToast(`The pasted data had too many columns. (Max supported is ${MAX_FIELD_COUNT}). Maybe try copying a smaller set of columns?`);
                return null;
            default:
                console.error(e);
                errorToast(`It didn't work and the reason is unclear. Maybe try again?`);
                return null;
        }
    }
}

export async function importSheet(importOptions:ImportOptions, setSheet:Function, setModalDialog:Function) {
    switch(importOptions.importType) {
        case ImportType.CLIPBOARD:
            const sheet = await _importFromClipboard(importOptions);
            if (sheet) { 
                setSheet(sheet);
                setModalDialog(null);
            }
        break;

        default:
            throw Error('Unexpected');
    }
}