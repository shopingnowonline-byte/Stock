
import { SheetRow, SheetConfig } from "../types";

export const fetchSheetData = async (
  spreadsheetId: string,
  apiKey: string,
  sheetConfigs: SheetConfig[]
): Promise<Record<string, SheetRow[]>> => {
  const results: Record<string, SheetRow[]> = {};

  for (const config of sheetConfigs) {
    try {
      // Fetch the first 200 rows for each sheet to be safer
      const range = `${config.sheetName}!A1:Z200`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Failed to fetch sheet: ${config.sheetName}`);
      }

      const data = await response.json();
      const rows = data.values;

      if (!rows || rows.length === 0) {
        results[config.sheetName] = [];
        continue;
      }

      // First row is headers
      const headers = rows[0];
      const items: SheetRow[] = [];

      for (let i = 1; i < rows.length; i++) {
        const rowData: SheetRow = {};
        const currentRow = rows[i];
        
        headers.forEach((header: string, index: number) => {
          // Case-insensitive column check
          const isRequested = config.columns.length === 0 || 
            config.columns.some(col => col.toLowerCase() === header.toLowerCase());
            
          if (isRequested) {
            rowData[header] = currentRow[index] || "";
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          items.push(rowData);
        }
      }

      results[config.sheetName] = items;
    } catch (error) {
      console.error(`Error fetching sheet ${config.sheetName}:`, error);
      throw error;
    }
  }

  return results;
};
