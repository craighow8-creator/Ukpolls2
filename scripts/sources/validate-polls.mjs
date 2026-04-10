import fs from "node:fs";
import path from "node:path";

const PARTY_KEYS = ["lab", "con", "ref", "ld", "grn", "snp", "pc", "rb", "oth"];
const DATE_FIELDS = ["publishedAt", "fieldworkStart", "fieldworkEnd"];

function getArgValue(flag) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function readJsonArray(filePath) {
  if (!filePath) {
    throw new Error("Missing required --in path.");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Input file is not a JSON array: ${filePath}`);
  }

  return parsed;
}

function isIsoDate(value) {
  if (value == null) return true;
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;

  return d.toISOString().slice(0, 10) === value;
}

function compareIsoDates(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}

function futureIsoDateLimit(daysAhead = 7) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function usableDate(record) {
  return record.fieldworkEnd || record.fieldworkStart || record.publishedAt || null;
}

function canonicalKey(record) {
  const date = usableDate(record);
  if (!record?.pollster || !date) return null;
  return `${record.pollster}__${date}`;
}

function isValidPartyValue(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function populatedPartyCount(record) {
  return PARTY_KEYS.filter((key) => typeof record[key] === "number").length;
}

function sumOfPartyValues(record) {
  return PARTY_KEYS.reduce((sum, key) => {
    const value = record[key];
    return typeof value === "number" ? sum + value : sum;
  }, 0);
}

function validateRecord(record, index) {
  const errors = [];
  const warnings = [];
  const label = `row ${index + 1}`;

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    errors.push(`${label}: record is not a valid object`);
    return { errors, warnings };
  }

  if (!record.id || typeof record.id !== "string") {
    errors.push(`${label}: missing or invalid id`);
  }

  if (!record.pollster || typeof record.pollster !== "string") {
    errors.push(`${label}: missing or invalid pollster`);
  }

  const date = usableDate(record);
  if (!date) {
    errors.push(`${label}: missing usable date (fieldworkEnd/fieldworkStart/publishedAt)`);
  }

  for (const field of DATE_FIELDS) {
    if (!isIsoDate(record[field])) {
      errors.push(`${label}: invalid ISO date in ${field} = ${JSON.stringify(record[field])}`);
    }
  }

  const futureLimit = futureIsoDateLimit(7);
  for (const field of DATE_FIELDS) {
    if (record[field] && compareIsoDates(record[field], futureLimit) > 0) {
      errors.push(`${label}: ${field} is implausibly far in the future (${record[field]} > ${futureLimit})`);
    }
  }

  if (record.sample !== null && record.sample !== undefined) {
    if (typeof record.sample !== "number" || !Number.isFinite(record.sample) || record.sample <= 0) {
      errors.push(`${label}: invalid sample = ${JSON.stringify(record.sample)}`);
    }
  }

  for (const key of PARTY_KEYS) {
    const value = record[key];

    if (!isValidPartyValue(value)) {
      errors.push(`${label}: invalid ${key} value = ${JSON.stringify(value)}`);
      continue;
    }

    if (typeof value === "number") {
      if (value < 0) {
        errors.push(`${label}: negative ${key} value = ${value}`);
      } else if (value > 100) {
        errors.push(`${label}: impossible ${key} value > 100 = ${value}`);
      }
    }
  }

  const partyCount = populatedPartyCount(record);
  if (partyCount < 4) {
    warnings.push(`${label}: only ${partyCount} populated party values`);
  }

  const total = sumOfPartyValues(record);
  if (total > 110) {
    errors.push(`${label}: party total too high = ${total}`);
  } else if (total > 0 && total < 60) {
    warnings.push(`${label}: party total looks low = ${total}`);
  }

  if (record.fieldworkStart && record.fieldworkEnd && compareIsoDates(record.fieldworkStart, record.fieldworkEnd) > 0) {
    errors.push(
      `${label}: fieldworkStart is after fieldworkEnd (${record.fieldworkStart} > ${record.fieldworkEnd})`
    );
  }

  if (record.publishedAt && record.fieldworkEnd && compareIsoDates(record.publishedAt, record.fieldworkEnd) < 0) {
    warnings.push(`${label}: publishedAt is before fieldworkEnd (${record.publishedAt} < ${record.fieldworkEnd})`);
  }

  return { errors, warnings };
}

function validateDataset(records) {
  const errors = [];
  const warnings = [];
  const idMap = new Map();
  const keyMap = new Map();

  records.forEach((record, index) => {
    const result = validateRecord(record, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (record?.id) {
      const existing = idMap.get(record.id);
      if (existing != null) {
        errors.push(`duplicate id "${record.id}" at rows ${existing + 1} and ${index + 1}`);
      } else {
        idMap.set(record.id, index);
      }
    }

    const key = canonicalKey(record);
    if (key) {
      const existing = keyMap.get(key);
      if (existing != null) {
        errors.push(`duplicate pollster/date "${key}" at rows ${existing + 1} and ${index + 1}`);
      } else {
        keyMap.set(key, index);
      }
    }
  });

  return { errors, warnings };
}

function main() {
  const inputPath = getArgValue("--in");
  const records = readJsonArray(inputPath);
  const { errors, warnings } = validateDataset(records);

  console.log(`[validate-polls] File: ${path.resolve(inputPath)}`);
  console.log(`[validate-polls] Records: ${records.length}`);
  console.log(`[validate-polls] Warnings: ${warnings.length}`);
  console.log(`[validate-polls] Errors: ${errors.length}`);

  if (warnings.length) {
    console.log("");
    console.log("[validate-polls] Warning details:");
    for (const warning of warnings.slice(0, 50)) {
      console.log(`- ${warning}`);
    }
    if (warnings.length > 50) {
      console.log(`- ... ${warnings.length - 50} more warnings`);
    }
  }

  if (errors.length) {
    console.log("");
    console.log("[validate-polls] Error details:");
    for (const error of errors.slice(0, 50)) {
      console.log(`- ${error}`);
    }
    if (errors.length > 50) {
      console.log(`- ... ${errors.length - 50} more errors`);
    }

    process.exit(1);
  }

  console.log("");
  console.log("[validate-polls] Validation passed.");
}

try {
  main();
} catch (error) {
  console.error("[validate-polls] Failed:", error.message);
  process.exit(1);
}