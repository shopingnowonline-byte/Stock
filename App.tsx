
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Watchlist } from './pages/Watchlist';
import { Settings } from './pages/Settings';
import { View, AppSettings, WatchlistItem, SheetRow } from './types';
import { fetchSheetData } from './services/googleSheetsService';

const STORAGE_KEY = 'sheetbase_settings';
const WATCHLIST_KEY = 'sheetbase_watchlist';

const DEFAULT_SETTINGS: AppSettings = {
  googleSheetId: '',
  googleApiKey: '',
  schema: [
    { sheetName: 'Portfolio', columns: ['Symbol', 'Price', 'Change', 'Volume'] },
    { sheetName: 'SYMBOLS_MASTER', columns: ['Symbol', 'Name', 'Sector', 'Market Cap'] },
    { sheetName: 'PRICE_DAILY', columns: ['Symbol', 'open', 'close', 'Low', 'High', '52w High'] },
    { sheetName: 'RESULTS_QUARTERLY', columns: ['Symbol', 'Period', 'Revenue', 'Profit', 'Margin'] },
    { sheetName: 'RESULTS_YEARLY', columns: ['Symbol', 'Year', 'Revenue', 'Profit', 'Margin'] },
    { sheetName: 'Orders', columns: ['ID', 'Item', 'Quantity', 'Status'] }
  ]
};

const MOCK_DATA: Record<string, SheetRow[]> = {
  'Portfolio': [
    { Symbol: 'AAPL', Price: 185.92, Change: '+1.2%', Volume: '52M' },
    { Symbol: 'MSFT', Price: 410.34, Change: '-0.4%', Volume: '28M' },
    { Symbol: 'TSLA', Price: 175.05, Change: '+3.1%', Volume: '105M' },
    { Symbol: 'GOOGL', Price: 154.22, Change: '+0.8%', Volume: '19M' },
  ],
  'SYMBOLS_MASTER': [
    { Symbol: 'NVDA', Name: 'NVIDIA Corp', Sector: 'Technology', 'Market Cap': '2.2T' },
    { Symbol: 'AMD', Name: 'Advanced Micro Devices', Sector: 'Technology', 'Market Cap': '310B' },
    { Symbol: 'AAPL', Name: 'Apple Inc', Sector: 'Technology', 'Market Cap': '2.8T' },
    { Symbol: 'MSFT', Name: 'Microsoft Corp', Sector: 'Technology', 'Market Cap': '3.1T' },
  ],
  'PRICE_DAILY': [
    { Symbol: 'NVDA', open: 820.50, close: 850.10, Low: 818.00, High: 855.00, '52w High': 974.00 },
    { Symbol: 'AMD', open: 170.20, close: 174.50, Low: 169.00, High: 176.00, '52w High': 227.00 },
    { Symbol: 'AAPL', open: 184.00, close: 185.92, Low: 183.50, High: 187.00, '52w High': 199.62 },
    { Symbol: 'MSFT', open: 412.00, close: 410.34, Low: 408.00, High: 415.00, '52w High': 430.82 },
  ],
  'RESULTS_QUARTERLY': [
    { Symbol: 'NVDA', Period: 'Q1 24', Revenue: 26044, Profit: 14881, Margin: '57%' },
    { Symbol: 'NVDA', Period: 'Q4 23', Revenue: 22103, Profit: 12285, Margin: '55%' },
    { Symbol: 'NVDA', Period: 'Q3 23', Revenue: 18120, Profit: 9243, Margin: '51%' },
    { Symbol: 'AAPL', Period: 'Q1 24', Revenue: 119575, Profit: 33916, Margin: '28%' },
    { Symbol: 'AAPL', Period: 'Q4 23', Revenue: 89498, Profit: 22956, Margin: '25%' },
  ],
  'RESULTS_YEARLY': [
    { Symbol: 'NVDA', Year: '2023', Revenue: 60922, Profit: 29760, Margin: '48%' },
    { Symbol: 'NVDA', Year: '2022', Revenue: 26974, Profit: 4368, Margin: '16%' },
    { Symbol: 'AAPL', Year: '2023', Revenue: 383285, Profit: 96995, Margin: '25%' },
    { Symbol: 'AAPL', Year: '2022', Revenue: 394328, Profit: 99803, Margin: '25%' },
  ],
  'Orders': [
    { ID: '1001', Item: 'MacBook Pro', Quantity: 1, Status: 'Delivered' },
    { ID: '1002', Item: 'iPhone 15', Quantity: 2, Status: 'Processing' },
    { ID: '1003', Item: 'AirPods', Quantity: 5, Status: 'Shipped' },
  ]
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sheetData, setSheetData] = useState<Record<string, SheetRow[]>>(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(true);

  const loadData = useCallback(async () => {
    if (!settings.googleSheetId || !settings.googleApiKey) {
      setSheetData(MOCK_DATA);
      setIsUsingMock(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSheetData(
        settings.googleSheetId,
        settings.googleApiKey,
        settings.schema
      );
      setSheetData(data);
      setIsUsingMock(false);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google Sheets');
      setSheetData(MOCK_DATA);
      setIsUsingMock(true);
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  // STRICT SYNC: Watchlist ONLY contains items from SYMBOLS_MASTER
  useEffect(() => {
    const masterSymbols = sheetData['SYMBOLS_MASTER'];
    if (masterSymbols) {
      const newWatchlist: WatchlistItem[] = masterSymbols.map(row => ({
        sheetName: 'SYMBOLS_MASTER',
        id: String(row['Symbol'] || Object.values(row)[0]),
        data: row,
        addedAt: Date.now()
      }));
      setWatchlist(newWatchlist);
    }
  }, [sheetData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <Home 
            data={sheetData} 
            isUsingMock={isUsingMock}
            isLoading={isLoading}
            error={error}
            onRefresh={loadData}
          />
        );
      case 'watchlist':
        return <Watchlist items={watchlist} removeItem={() => {}} allData={sheetData} />;
      case 'settings':
        return <Settings settings={settings} onSave={setSettings} />;
      default:
        return <Home data={sheetData} isUsingMock={isUsingMock} isLoading={isLoading} error={error} onRefresh={loadData} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView} isConnected={!isUsingMock && !error}>
      {renderView()}
    </Layout>
  );
};

export default App;
