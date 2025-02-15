import { doesSheetHaveWritableColumns } from "@/sheets/sheetUtil";
import HoneSheet from "@/sheets/types/HoneSheet";

export function getComment(sheet:HoneSheet|null) {
  if (!sheet) return "Import your own sheet or example data.";
  if (!doesSheetHaveWritableColumns(sheet)) return "You can add new prompt-generated columns to this sheet.";
  return "When you're happy with your sheet, you can export it.";
}