const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function pad(num) {
  return String(num).padStart(2, "0");
}

function toIso(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function normalise(raw) {
  return String(raw || "")
    .replace(/\[[^\]]*]/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/[‐-‒–—]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseUkDateRange(rawValue, fallbackYear = null) {
  const text = normalise(rawValue);
  if (!text) {
    return { fieldworkStart: null, fieldworkEnd: null };
  }

  // 15-16 March 2026
  let m = text.match(/^(\d{1,2})-(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (m) {
    const dayStart = Number(m[1]);
    const dayEnd = Number(m[2]);
    const month = MONTHS[m[3].toLowerCase()];
    const year = Number(m[4]);

    if (month) {
      return {
        fieldworkStart: toIso(year, month, dayStart),
        fieldworkEnd: toIso(year, month, dayEnd),
      };
    }
  }

  // 1-2 Apr   (uses fallback year)
  m = text.match(/^(\d{1,2})-(\d{1,2})\s+([A-Za-z]+)$/i);
  if (m && fallbackYear) {
    const dayStart = Number(m[1]);
    const dayEnd = Number(m[2]);
    const month = MONTHS[m[3].toLowerCase()];

    if (month) {
      return {
        fieldworkStart: toIso(fallbackYear, month, dayStart),
        fieldworkEnd: toIso(fallbackYear, month, dayEnd),
      };
    }
  }

  // 28 March-1 April 2026
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)-(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (m) {
    const dayStart = Number(m[1]);
    const monthStart = MONTHS[m[2].toLowerCase()];
    const dayEnd = Number(m[3]);
    const monthEnd = MONTHS[m[4].toLowerCase()];
    const year = Number(m[5]);

    if (monthStart && monthEnd) {
      return {
        fieldworkStart: toIso(year, monthStart, dayStart),
        fieldworkEnd: toIso(year, monthEnd, dayEnd),
      };
    }
  }

  // 27 Feb-2 Mar   (uses fallback year)
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)-(\d{1,2})\s+([A-Za-z]+)$/i);
  if (m && fallbackYear) {
    const dayStart = Number(m[1]);
    const monthStart = MONTHS[m[2].toLowerCase()];
    const dayEnd = Number(m[3]);
    const monthEnd = MONTHS[m[4].toLowerCase()];

    if (monthStart && monthEnd) {
      return {
        fieldworkStart: toIso(fallbackYear, monthStart, dayStart),
        fieldworkEnd: toIso(fallbackYear, monthEnd, dayEnd),
      };
    }
  }

  // 31 December 2025-2 January 2026
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})-(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (m) {
    const dayStart = Number(m[1]);
    const monthStart = MONTHS[m[2].toLowerCase()];
    const yearStart = Number(m[3]);
    const dayEnd = Number(m[4]);
    const monthEnd = MONTHS[m[5].toLowerCase()];
    const yearEnd = Number(m[6]);

    if (monthStart && monthEnd) {
      return {
        fieldworkStart: toIso(yearStart, monthStart, dayStart),
        fieldworkEnd: toIso(yearEnd, monthEnd, dayEnd),
      };
    }
  }

  // 15 March 2026
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase()];
    const year = Number(m[3]);

    if (month) {
      const iso = toIso(year, month, day);
      return {
        fieldworkStart: iso,
        fieldworkEnd: iso,
      };
    }
  }

  // 25 Mar   (uses fallback year)
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)$/i);
  if (m && fallbackYear) {
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase()];

    if (month) {
      const iso = toIso(fallbackYear, month, day);
      return {
        fieldworkStart: iso,
        fieldworkEnd: iso,
      };
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null };
}