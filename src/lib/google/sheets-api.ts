/**
 * Google Sheets API Integration
 * Browser-safe version - All Google API operations must be called through API server
 */

// Browser-safe: Comment out Node.js imports
// import { GoogleSpreadsheet } from 'google-spreadsheet';
// import { JWT } from 'google-auth-library';

// Khởi tạo JWT credentials
const getServiceAccountAuth = () => {
  const credentials = JSON.parse(import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
};

/**
 * Tạo Google Sheet mới
 */
export async function createSpreadsheet(title: string) {
  const auth = getServiceAccountAuth();
  const doc = await GoogleSpreadsheet.createNewSpreadsheetDocument(auth, { title });
  
  return {
    spreadsheetId: doc.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}`,
    title: doc.title,
  };
}

/**
 * Mở Google Sheet đã tồn tại
 */
export async function openSpreadsheet(spreadsheetId: string) {
  const auth = getServiceAccountAuth();
  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();
  
  return doc;
}

/**
 * Thêm sheet mới vào spreadsheet
 */
export async function addSheet(
  spreadsheetId: string,
  sheetTitle: string,
  headerValues: string[]
) {
  const doc = await openSpreadsheet(spreadsheetId);
  const sheet = await doc.addSheet({ title: sheetTitle, headerValues });
  
  return sheet;
}

/**
 * Ghi SEO data vào Google Sheets
 */
export async function writeSEOData(
  spreadsheetId: string,
  data: {
    date: string;
    url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    keyword?: string;
  }[]
) {
  const doc = await openSpreadsheet(spreadsheetId);
  
  // Tìm hoặc tạo sheet "SEO Data"
  let sheet = doc.sheetsByTitle['SEO Data'];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'SEO Data',
      headerValues: ['Date', 'URL', 'Clicks', 'Impressions', 'CTR', 'Position', 'Keyword'],
    });
  }

  // Ghi data
  const rows = data.map(item => ({
    Date: item.date,
    URL: item.url,
    Clicks: item.clicks,
    Impressions: item.impressions,
    CTR: item.ctr.toFixed(2) + '%',
    Position: item.position.toFixed(1),
    Keyword: item.keyword || '',
  }));

  await sheet.addRows(rows);
  
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}`;
  return { rowsAdded: rows.length, sheetUrl };
}

/**
 * Ghi Analytics data vào Google Sheets
 */
export async function writeAnalyticsData(
  spreadsheetId: string,
  data: {
    date: string;
    sessions: number;
    users: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversions: number;
  }[]
) {
  const doc = await openSpreadsheet(spreadsheetId);
  
  // Tìm hoặc tạo sheet "Analytics"
  let sheet = doc.sheetsByTitle['Analytics'];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'Analytics',
      headerValues: [
        'Date',
        'Sessions',
        'Users',
        'Page Views',
        'Bounce Rate',
        'Avg Session Duration',
        'Conversions',
      ],
    });
  }

  const rows = data.map(item => ({
    Date: item.date,
    Sessions: item.sessions,
    Users: item.users,
    'Page Views': item.pageViews,
    'Bounce Rate': item.bounceRate.toFixed(2) + '%',
    'Avg Session Duration': Math.round(item.avgSessionDuration) + 's',
    Conversions: item.conversions,
  }));

  await sheet.addRows(rows);
  
  return { 
    rowsAdded: rows.length, 
    sheetUrl: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}` 
  };
}

/**
 * Tạo Dashboard Report Sheet với formulas & formatting
 */
export async function createDashboardSheet(
  spreadsheetId: string,
  config: {
    dateRange: string;
    totalSessions: number;
    totalUsers: number;
    totalConversions: number;
    avgBounceRate: number;
    topPages: Array<{ page: string; views: number }>;
    topKeywords: Array<{ keyword: string; clicks: number }>;
  }
) {
  const doc = await openSpreadsheet(spreadsheetId);
  
  // Xóa sheet Dashboard cũ nếu có
  const oldSheet = doc.sheetsByTitle['Dashboard'];
  if (oldSheet) {
    await oldSheet.delete();
  }

  // Tạo sheet mới
  const sheet = await doc.addSheet({ title: 'Dashboard' });

  // Header
  await sheet.loadCells('A1:D20');
  
  // Title
  const titleCell = sheet.getCellByA1('A1');
  titleCell.value = 'SEO & Analytics Dashboard';
  titleCell.textFormat = { bold: true, fontSize: 18 };
  
  const dateCell = sheet.getCellByA1('A2');
  dateCell.value = `Date Range: ${config.dateRange}`;
  dateCell.textFormat = { italic: true };

  // Key Metrics
  let row = 4;
  const metrics = [
    { label: 'Total Sessions', value: config.totalSessions },
    { label: 'Total Users', value: config.totalUsers },
    { label: 'Total Conversions', value: config.totalConversions },
    { label: 'Avg Bounce Rate', value: config.avgBounceRate.toFixed(2) + '%' },
  ];

  for (const metric of metrics) {
    const labelCell = sheet.getCell(row, 0);
    const valueCell = sheet.getCell(row, 1);
    
    labelCell.value = metric.label;
    labelCell.textFormat = { bold: true };
    valueCell.value = metric.value;
    
    row++;
  }

  // Top Pages
  row += 2;
  const topPagesTitle = sheet.getCell(row, 0);
  topPagesTitle.value = 'Top Pages';
  topPagesTitle.textFormat = { bold: true, fontSize: 14 };
  row++;

  for (const page of config.topPages.slice(0, 10)) {
    const pageCell = sheet.getCell(row, 0);
    const viewsCell = sheet.getCell(row, 1);
    
    pageCell.value = page.page;
    viewsCell.value = page.views;
    
    row++;
  }

  // Top Keywords
  const keywordCol = 3;
  row = 9;
  const topKeywordsTitle = sheet.getCell(row, keywordCol);
  topKeywordsTitle.value = 'Top Keywords';
  topKeywordsTitle.textFormat = { bold: true, fontSize: 14 };
  row++;

  for (const keyword of config.topKeywords.slice(0, 10)) {
    const keywordCell = sheet.getCell(row, keywordCol);
    const clicksCell = sheet.getCell(row, keywordCol + 1);
    
    keywordCell.value = keyword.keyword;
    clicksCell.value = keyword.clicks;
    
    row++;
  }

  await sheet.saveUpdatedCells();
  
  return { 
    sheetUrl: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}` 
  };
}

/**
 * Đọc data từ Google Sheet
 */
export async function readSheetData<T = Record<string, unknown>>(
  spreadsheetId: string,
  sheetTitle: string
): Promise<T[]> {
  const doc = await openSpreadsheet(spreadsheetId);
  const sheet = doc.sheetsByTitle[sheetTitle];
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetTitle}" not found`);
  }

  const rows = await sheet.getRows();
  return rows.map(row => row.toObject()) as T[];
}

/**
 * Xóa tất cả rows trong sheet (giữ header)
 */
export async function clearSheetData(
  spreadsheetId: string,
  sheetTitle: string
) {
  const doc = await openSpreadsheet(spreadsheetId);
  const sheet = doc.sheetsByTitle[sheetTitle];
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetTitle}" not found`);
  }

  await sheet.clear();
  
  return { cleared: true };
}

/**
 * Chia sẻ spreadsheet với email
 */
export async function shareSpreadsheet(
  spreadsheetId: string,
  email: string,
  _role: 'reader' | 'writer' | 'owner' = 'reader'
) {
  const doc = await openSpreadsheet(spreadsheetId);
  
  // Note: Cần quyền Drive API để share
  // Sẽ implement bằng Drive API riêng
  
  return { 
    message: `Share functionality requires Drive API`,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}`
  };
}

/**
 * Export spreadsheet as PDF/Excel
 */
export async function exportSpreadsheet(
  spreadsheetId: string,
  format: 'pdf' | 'xlsx' | 'csv' = 'pdf'
) {
  const formatMap = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
  };

  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=${format}`;
  
  return {
    exportUrl,
    mimeType: formatMap[format],
  };
}

/**
 * Batch update nhiều sheets cùng lúc
 */
export async function batchUpdateSheets(
  spreadsheetId: string,
  updates: Array<{
    sheetTitle: string;
    data: Record<string, string | number | boolean>[];
  }>
) {
  const doc = await openSpreadsheet(spreadsheetId);
  const results = [];

  for (const update of updates) {
    let sheet = doc.sheetsByTitle[update.sheetTitle];
    
    if (!sheet) {
      // Auto-create sheet if not exists
      const headers = Object.keys(update.data[0] || {});
      sheet = await doc.addSheet({
        title: update.sheetTitle,
        headerValues: headers,
      });
    }

    await sheet.addRows(update.data);
    results.push({
      sheetTitle: update.sheetTitle,
      rowsAdded: update.data.length,
    });
  }

  return {
    results,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}`,
  };
}
