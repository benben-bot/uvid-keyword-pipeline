import { google } from "googleapis";
import { Keyword } from "./utils";

const SHEET_NAME = "키워드 데이터";
const HEADERS = [
  "키워드",
  "월간검색(PC)",
  "월간검색(모바일)",
  "총검색량",
  "경쟁도",
  "소스",
  "수집일시",
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!email || !key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be set"
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEETS_ID must be set");
  }
  return id;
}

export async function saveKeywordsToSheet(keywords: Keyword[]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();
  const now = new Date().toISOString();

  // Ensure sheet exists
  await ensureSheetExists(sheets, spreadsheetId);

  // Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`,
  });

  // Write header + data
  const rows = keywords.map((kw) => [
    kw.keyword,
    kw.monthlyPcQcCnt,
    kw.monthlyMobileQcCnt,
    kw.totalSearchCount,
    kw.compIdx,
    kw.source,
    now,
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [HEADERS, ...rows],
    },
  });

  return { savedCount: keywords.length };
}

export async function loadKeywordsFromSheet(): Promise<Keyword[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) {
    return [];
  }

  // Skip header row
  return rows.slice(1).map((row) => ({
    keyword: row[0] || "",
    monthlyPcQcCnt: Number(row[1]) || 0,
    monthlyMobileQcCnt: Number(row[2]) || 0,
    totalSearchCount: Number(row[3]) || 0,
    compIdx: row[4] || "",
    source: row[5] || "",
  }));
}

async function ensureSheetExists(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetExists = spreadsheet.data.sheets?.some(
    (s) => s.properties?.title === SHEET_NAME
  );

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SHEET_NAME },
            },
          },
        ],
      },
    });
  }
}

export async function initSheet() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();

  await ensureSheetExists(sheets, spreadsheetId);

  // Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [HEADERS],
    },
  });

  return { initialized: true };
}
