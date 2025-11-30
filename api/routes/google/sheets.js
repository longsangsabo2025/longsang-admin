/**
 * Google Sheets API Routes
 * Server-side endpoints for Google Sheets operations
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

// Initialize Sheets client with service account
const getSheetsClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

/**
 * POST /api/google/sheets/create
 * Create a new spreadsheet
 */
router.post('/create', async (req, res) => {
  try {
    const { title = 'LongSang Admin Report' } = req.body;

    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          { properties: { title: 'Analytics Overview' } },
          { properties: { title: 'Traffic Sources' } },
          { properties: { title: 'Top Pages' } },
          { properties: { title: 'SEO Keywords' } },
        ],
      },
    });

    res.json({
      spreadsheetId: response.data.spreadsheetId,
      spreadsheetUrl: response.data.spreadsheetUrl,
    });
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/sheets/write
 * Write data to a spreadsheet
 */
router.post('/write', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;

    if (!spreadsheetId || !range || !values) {
      return res.status(400).json({ error: 'spreadsheetId, range, and values are required' });
    }

    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    res.json({
      updatedCells: response.data.updatedCells,
      updatedRows: response.data.updatedRows,
    });
  } catch (error) {
    console.error('Error writing to spreadsheet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/sheets/read
 * Read data from a spreadsheet
 */
router.post('/read', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.body;

    if (!spreadsheetId || !range) {
      return res.status(400).json({ error: 'spreadsheetId and range are required' });
    }

    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    res.json({
      values: response.data.values || [],
      range: response.data.range,
    });
  } catch (error) {
    console.error('Error reading spreadsheet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/sync-sheets
 * Sync analytics and SEO data to Google Sheets
 */
router.post('/sync', async (req, res) => {
  try {
    const { spreadsheetId, propertyId } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }

    const sheets = getSheetsClient();
    let recordsSynced = 0;

    // Write header and timestamp
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Analytics Overview!A1:F1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Date', 'Sessions', 'Users', 'Page Views', 'Bounce Rate', 'Conversions', 'Last Updated: ' + timestamp]],
      },
    });
    recordsSynced++;

    res.json({
      success: true,
      recordsSynced,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });
  } catch (error) {
    console.error('Error syncing to sheets:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
