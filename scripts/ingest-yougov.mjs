import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const YOUGOV_DOWNLOAD_URL =
  "https://api-test.yougov.com/public-data/v5/uk/trackers/voting-intention/download/";

const YOUGOV_TRACKER_URL = "https://yougov.co.uk/topics/politics/trackers/voting-intention";
const SHEET_NAME = "All adults";

const PARTY_ROW_MAP = {
  Con: "con",
  Lab: "lab",
  "Lib Dem": "ld",
  SNP: "snp",
  "Plaid Cymru": "pc",
  "Reform UK": "ref",
  Green: "grn",
  Other: "oth",
};

function getArgValue(flag) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function safeIdPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseIsoDate(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function normalisePct(value) {
  if (value == null || value === "") return null;

  const num = Number(value);
  if (!Number.isFinite(num)) return null;

  if (num >= 0 && num <= 1) {
    return Math.round(num * 100);
  }

  if (num >= 0 && num <= 100) {
    return Math.round(num);
  }

  return null;
}

function makeEmptyPartyObject() {
  return {
    lab: null,
    con: null,
    ref: null,
    ld: null,
    grn: null,
    snp: null,
    pc: null,
    rb: null,
    oth: null,
  };
}

async function downloadWorkbookBuffer() {
  const response = await fetch(YOUGOV_DOWNLOAD_URL, {
    headers: {
      "User-Agent": "PolitiscopeYouGovIngestor/1.0",
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`YouGov download failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function loadSheetRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (!workbook.Sheets[SHEET_NAME]) {
    throw new Error(`YouGov workbook is missing expected sheet "${SHEET_NAME}".`);
  }

  const sheet = workbook.Sheets[SHEET_NAME];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
}

function buildRowMap(rows) {
  const map = new Map();

  for (const row of rows) {
    if (!Array.isArray(row) || !row.length) continue;
    const key = String(row[0] || "").trim();
    if (!key) continue;
    map.set(key, row);
  }

  return map;
}

function buildRecords(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("YouGov workbook sheet is empty or malformed.");
  }

  const headerRow = rows[0];
  const dateColumns = headerRow.slice(1).map(parseIsoDate);

  if (!dateColumns.some(Boolean)) {
    throw new Error("YouGov workbook header row did not contain ISO date columns.");
  }

  const rowMap = buildRowMap(rows);

  for (const requiredRow of Object.keys(PARTY_ROW_MAP)) {
    if (!rowMap.has(requiredRow)) {
      throw new Error(`YouGov workbook is missing expected row "${requiredRow}".`);
    }
  }

  const sampleRow = rowMap.get("Unweighted base") || rowMap.get("Weighted base") || null;

  const ingestedAt = new Date().toISOString();
  const records = [];

  for (let col = 1; col < headerRow.length; col += 1) {
    const date = dateColumns[col - 1];
    if (!date) continue;

    const parties = makeEmptyPartyObject();

    for (const [sourceRowName, targetKey] of Object.entries(PARTY_ROW_MAP)) {
      const row = rowMap.get(sourceRowName);
      parties[targetKey] = normalisePct(row?.[col]);
    }

    const sample = sampleRow ? Number(sampleRow[col]) : null;

    records.push({
      id: `${safeIdPart("YouGov")}-${date}`,
      pollster: "YouGov",
      client: null,
      publishedAt: date,
      fieldworkStart: null,
      fieldworkEnd: date,
      sample: Number.isFinite(sample) ? sample : null,
      method: "online",
      ...parties,
      sourceType: "yougov",
      sourceUrl: YOUGOV_TRACKER_URL,
      ingestedAt,
      prompted: false,
      mrp: false,
    });
  }

  return records.sort((a, b) => {
    const aDate = a.fieldworkEnd || a.publishedAt || "";
    const bDate = b.fieldworkEnd || b.publishedAt || "";
    return bDate.localeCompare(aDate);
  });
}

async function main() {
  const outPath = getArgValue("--out");
  const buffer = await downloadWorkbookBuffer();
  const rows = loadSheetRows(buffer);
  const records = buildRecords(rows);

  if (!records.length) {
    throw new Error("No YouGov records were produced.");
  }

  if (outPath) {
    ensureDirForFile(outPath);
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2), "utf-8");
    console.log(`[ingest-yougov] Saved to ${outPath}`);
    return;
  }

  console.log(JSON.stringify(records, null, 2));
}

main().catch((error) => {
  console.error("[ingest-yougov] Failed:", error.message);
  process.exit(1);
});