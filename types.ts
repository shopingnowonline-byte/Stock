
export interface SheetConfig {
  sheetName: string;
  columns: string[];
}

export interface AppSettings {
  googleSheetId: string;
  googleApiKey: string;
  schema: SheetConfig[];
}

export interface SheetRow {
  [key: string]: string | number;
}

export interface WatchlistItem {
  sheetName: string;
  id: string; // Typically based on the first column value
  data: SheetRow;
  addedAt: number;
}

export type View = 'home' | 'watchlist' | 'settings';
