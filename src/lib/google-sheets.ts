import { google, sheets_v4 } from "googleapis";

let _sheets: sheets_v4.Sheets | null = null;

/**
 * Lazily build a Google Sheets client authenticated as the shared jytech
 * service account (`autoclaw-analytics@jytech.iam.gserviceaccount.com`).
 *
 * The service-account JSON lives in `GOOGLE_SERVICE_ACCOUNT_KEY` (same key
 * reused from autoclaw's `GA_SERVICE_ACCOUNT_KEY`). Any sheet you want to read
 * must be shared with that service-account email (Viewer is enough).
 */
export function getSheets() {
  if (!_sheets) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");

    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    _sheets = google.sheets({ version: "v4", auth });
  }
  return _sheets;
}

/**
 * Read a tab as an array of objects keyed by the header row.
 *
 * @param spreadsheetId  The ID from the sheet URL:
 *                       docs.google.com/spreadsheets/d/<THIS>/edit
 * @param range          A1 range, e.g. "Sheet1" or "Jobs!A1:F".
 */
export async function readSheetRows(
  spreadsheetId: string,
  range: string,
): Promise<Record<string, string>[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  const [header, ...body] = rows;
  return body.map((row) =>
    Object.fromEntries(
      header.map((key, i) => [String(key), String(row[i] ?? "")]),
    ),
  );
}
