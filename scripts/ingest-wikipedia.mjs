import fs from "fs";
import path from "path";

import { parseUkDateRange } from "./utils/parseUkDateRange.mjs";
import { mapPollster } from "./utils/mapPollster.mjs";

const WIKIPEDIA_PAGE_TITLE = "Opinion_polling_for_the_next_United_Kingdom_general_election";
const WIKIPEDIA_SOURCE_URL =
  "https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_United_Kingdom_general_election";

const TARGET_YEARS = [2026, 2025, 2024];
const PARTY_KEYS = ["lab", "con", "ref", "ld", "grn", "snp", "pc", "rb", "oth"];

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&minus;/gi, "-")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, " ")
      .replace(/<br\s*\/?>/gi, " / ")
      .replace(/<\/?(?:span|a|b|strong|i|em|small|div|p|abbr)[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function normaliseText(text) {
  return stripTags(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function safeIdPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractNumber(value) {
  const text = stripTags(value).replace(/,/g, "");
  if (!text || text === "–" || text === "-") return null;
  if (/^<\s*1\s*%?$/.test(text)) return 0;

  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  return Number(match[0]);
}

function extractSample(value) {
  const text = stripTags(value).replace(/,/g, "");
  const match = text.match(/\d{3,6}/);
  return match ? Number(match[0]) : null;
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

function populatedPartyCount(record) {
  return PARTY_KEYS.filter((key) => typeof record?.[key] === "number").length;
}

function partyTotal(record) {
  return PARTY_KEYS.reduce((sum, key) => sum + (typeof record?.[key] === "number" ? record[key] : 0), 0);
}

function looksSanePollRecord(record) {
  if (!record) return false;

  const count = populatedPartyCount(record);
  const total = partyTotal(record);

  if (count < 5) return false;
  if (total <= 0) return false;
  if (total > 110) return false;

  return true;
}

function parseCells(rowHtml) {
  const cellRegex = /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const cells = [];
  let match;

  while ((match = cellRegex.exec(rowHtml)) !== null) {
    cells.push(match[2]);
  }

  return cells;
}

function parseRows(tableHtml) {
  const rows = [];
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(tableHtml)) !== null) {
    const cells = parseCells(match[1]);
    if (cells.length) rows.push(cells);
  }

  return rows;
}

function extractWikitables(html) {
  const tables = [];
  const regex = /<table\b[^>]*class="[^"]*\bwikitable\b[^"]*"[^>]*>[\s\S]*?<\/table>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    tables.push(match[0]);
  }

  return tables;
}

function isTargetHeaderRow(cells) {
  const text = cells.map(normaliseText).join(" | ");

  return (
    text.includes("date") &&
    text.includes("pollster") &&
    text.includes("client") &&
    text.includes("sample") &&
    (text.includes("lab") || text.includes("labour")) &&
    (text.includes("con") || text.includes("conservative")) &&
    (text.includes("ref") || text.includes("reform"))
  );
}

function looksLikeMainPollRow(cells) {
  if (!Array.isArray(cells)) return false;

  // Clean rows are expected to have 14 visible cells:
  // date, pollster, client, area, sample, lab, con, ref, ld, grn, snp, pc, others, lead
  if (cells.length !== 14) return false;

  const dateText = stripTags(cells[0]);
  const pollsterText = stripTags(cells[1]);

  if (!dateText || !pollsterText) return false;
  if (!/\d/.test(dateText)) return false;

  const lower = `${dateText} ${pollsterText}`.toLowerCase();
  if (lower.includes("average") || lower.includes("lead") || lower.includes("change")) return false;

  return true;
}

function rowToPollRecord(cells, ingestedAt, year) {
  const rawDate = stripTags(cells[0]);
  const rawPollster = stripTags(cells[1]);
  const rawClient = stripTags(cells[2]);

  const canonicalPollster = mapPollster(rawPollster);
  if (!canonicalPollster) return null;

  const { fieldworkStart, fieldworkEnd } = parseUkDateRange(rawDate, year);
  const recordDate = fieldworkEnd || fieldworkStart;
  if (!recordDate) return null;

  return {
    id: `${safeIdPart(canonicalPollster)}-${recordDate}`,
    pollster: canonicalPollster,
    client: rawClient && rawClient !== "N/A" ? rawClient : null,
    publishedAt: recordDate,
    fieldworkStart,
    fieldworkEnd,
    sample: extractSample(cells[4]),
    method: null,
    ...makeEmptyPartyObject(),
    lab: extractNumber(cells[5]),
    con: extractNumber(cells[6]),
    ref: extractNumber(cells[7]),
    ld: extractNumber(cells[8]),
    grn: extractNumber(cells[9]),
    snp: extractNumber(cells[10]),
    pc: extractNumber(cells[11]),
    rb: null,
    oth: extractNumber(cells[12]),
    sourceType: "wikipedia",
    sourceUrl: WIKIPEDIA_SOURCE_URL,
    ingestedAt,
    prompted: false,
    mrp: false,
  };
}

function dedupeRecords(records) {
  const byId = new Map();

  for (const record of records) {
    if (!record) continue;

    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, record);
      continue;
    }

    const countFilled = (r) => PARTY_KEYS.filter((key) => r[key] !== null).length;
    if (countFilled(record) > countFilled(existing)) {
      byId.set(record.id, record);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aDate = a.fieldworkEnd || a.fieldworkStart || "";
    const bDate = b.fieldworkEnd || b.fieldworkStart || "";
    return bDate.localeCompare(aDate);
  });
}

async function wikiApi(params) {
  const url = new URL("https://en.wikipedia.org/w/api.php");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "PolitiscopeWikipediaIngestor/2.1",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchSectionList() {
  const json = await wikiApi({
    action: "parse",
    page: WIKIPEDIA_PAGE_TITLE,
    prop: "sections",
    redirects: "1",
  });

  return json?.parse?.sections || [];
}

async function fetchSectionHtml(sectionIndex) {
  const json = await wikiApi({
    action: "parse",
    page: WIKIPEDIA_PAGE_TITLE,
    prop: "text",
    section: sectionIndex,
    redirects: "1",
  });

  const html = json?.parse?.text;
  if (!html) {
    throw new Error(`Wikipedia returned no HTML for section ${sectionIndex}.`);
  }

  return html;
}

function findYearSectionIndexes(sections) {
  const result = new Map();

  for (const section of sections) {
    const line = String(section?.line || "").trim();
    const index = section?.index;

    for (const year of TARGET_YEARS) {
      if (line === String(year) && index != null && !result.has(year)) {
        result.set(year, index);
      }
    }
  }

  return result;
}

function extractRecordsFromSectionHtml(sectionHtml, year, ingestedAt) {
  const tables = extractWikitables(sectionHtml);
  if (!tables.length) return [];

  for (const tableHtml of tables) {
    const rows = parseRows(tableHtml);
    if (!rows.length) continue;

    const hasTargetHeader = rows.some(isTargetHeaderRow);
    if (!hasTargetHeader) continue;

    const records = rows
      .filter(looksLikeMainPollRow)
      .map((row) => rowToPollRecord(row, ingestedAt, year))
      .filter(Boolean)
      .filter(looksSanePollRecord);

    if (records.length) {
      return records;
    }
  }

  return [];
}

function getOutPath() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");

  if (outIndex === -1) return null;

  const outPath = args[outIndex + 1];
  if (!outPath) {
    throw new Error("--out flag provided but no path specified.");
  }

  return outPath;
}

async function main() {
  const ingestedAt = new Date().toISOString();
  const sections = await fetchSectionList();
  const yearSectionIndexes = findYearSectionIndexes(sections);

  const allRecords = [];

  for (const year of TARGET_YEARS) {
    const sectionIndex = yearSectionIndexes.get(year);
    if (!sectionIndex) {
      continue;
    }

    const sectionHtml = await fetchSectionHtml(sectionIndex);
    const records = extractRecordsFromSectionHtml(sectionHtml, year, ingestedAt);
    allRecords.push(...records);
  }

  const deduped = dedupeRecords(allRecords);

  if (!deduped.length) {
    throw new Error("No usable poll records were produced from year sections fetched directly via MediaWiki.");
  }

  return deduped;
}

main()
  .then((data) => {
    const outPath = getOutPath();

    if (!outPath) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

    console.log(`[ingest-wikipedia] Saved to ${outPath}`);
  })
  .catch((error) => {
    console.error("[ingest-wikipedia] Failed:", error.message);
    process.exit(1);
  });
