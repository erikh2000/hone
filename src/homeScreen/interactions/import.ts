import { read, WorkBook } from 'xlsx';

import { MIMETYPE_CSV, MIMETYPE_XLS, MIMETYPE_XLSX } from "@/persistence/mimeTypes";
import { errorToast } from '@/components/toasts/toastUtil';
import { baseUrl } from '@/common/urlUtil';
import ImportSheetDialog from '../dialogs/ImportSheetDialog';
import HoneSheet from '@/sheets/types/HoneSheet';

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