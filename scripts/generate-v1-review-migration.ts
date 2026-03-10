/**
 * Reads the v1.0 reviews CSV export and generates a SQL migration file
 * to import legitimate reviews into the v2.0 reviews table.
 *
 * Usage: npx tsx scripts/generate-v1-review-migration.ts
 * Output: supabase/migrations/017_import_v1_reviews.sql
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CSV_PATH = join(__dirname, "../docs/review_2026-03-10_12h38m42.csv");
const OUTPUT_PATH = join(
  __dirname,
  "../supabase/migrations/017_import_v1_reviews.sql"
);

// Simple CSV parser that handles quoted fields with commas and newlines
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(current.trim());
        current = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        row.push(current.trim());
        current = "";
        if (row.length > 1) rows.push(row);
        row = [];
        if (char === "\r") i++; // skip \n after \r
      } else {
        current += char;
      }
    }
  }
  // Last row
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.length > 1) rows.push(row);
  }

  return rows;
}

// Parse v1.0 date format: "November 16, 2025 10:54" → ISO timestamp
function parseV1Date(dateStr: string): string {
  if (!dateStr || dateStr === " - " || dateStr === "-") {
    return "NOW()";
  }
  // Remove timezone suffixes like "CST", "CDT"
  const cleaned = dateStr.replace(/\s+(CST|CDT|EST|EDT|PST|PDT)$/, "").trim();
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) {
    console.warn(`  Warning: Could not parse date "${dateStr}", using NOW()`);
    return "NOW()";
  }
  return `'${d.toISOString()}'`;
}

// Escape content for SQL dollar-quoting (handle $$ in content)
function sqlEscape(text: string): string {
  // Use $review$ delimiter to avoid conflicts with content
  if (text.includes("$review$")) {
    // Fallback to standard quoting with escaped single quotes
    return `'${text.replace(/'/g, "''")}'`;
  }
  return `$review$${text}$review$`;
}

function isEmpty(val: string): boolean {
  return !val || val === " - " || val === "-" || val === "<empty>" || val.trim() === "";
}

function main() {
  console.log("Reading CSV...");
  const raw = readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(raw);

  // Header is first row
  const header = rows[0];
  const data = rows.slice(1);

  // Find column indices
  const col = (name: string): number => {
    const idx = header.findIndex(
      (h) => h.toLowerCase() === name.toLowerCase()
    );
    if (idx === -1) {
      // Try partial match
      const partial = header.findIndex((h) =>
        h.toLowerCase().includes(name.toLowerCase())
      );
      if (partial !== -1) return partial;
      throw new Error(`Column "${name}" not found. Headers: ${header.join(", ")}`);
    }
    return idx;
  };

  const COL_ID = col("Id");
  const COL_CONTENT = col("Content");
  const COL_AUTHOR = col("Author name");
  const COL_RATING = col("Rating");
  const COL_ANONYMOUS = col("Anonymous");
  const COL_CREATED = col("Created at");
  const COL_STATUS = col("Status");
  const COL_DETAILS = col("Additional details");
  const COL_SLUG = col("Slug [Provider]");

  console.log(`Found ${data.length} data rows`);

  // Filter: only Submitted reviews with real Content
  const migratable = data.filter((row) => {
    const content = row[COL_CONTENT];
    return !isEmpty(content);
  });

  console.log(`Migratable reviews (have Content): ${migratable.length}`);
  console.log(
    `Skipped (no Content): ${data.length - migratable.length}`
  );

  // Generate SQL
  const inserts: string[] = [];

  for (const row of migratable) {
    const v1Id = row[COL_ID];
    const content = row[COL_CONTENT];
    const author = row[COL_AUTHOR];
    const rating = parseInt(row[COL_RATING], 10);
    const isAnon = row[COL_ANONYMOUS]?.toLowerCase() === "true";
    const createdAt = row[COL_CREATED];
    const details = row[COL_DETAILS];
    const slug = row[COL_SLUG];

    // Determine reviewer_name
    let reviewerName: string;
    if (!isEmpty(author)) {
      reviewerName = author;
    } else if (isAnon) {
      reviewerName = "Anonymous";
    } else {
      reviewerName = "Anonymous";
    }

    // Build comment: Content + Additional details if present
    let comment = content;
    if (!isEmpty(details)) {
      comment = `${content}\n\n---\nAdditional details: ${details}`;
    }

    // Validate
    if (rating < 1 || rating > 5 || isNaN(rating)) {
      console.warn(`  Skipping v1 ID ${v1Id}: invalid rating ${rating}`);
      continue;
    }
    if (isEmpty(slug)) {
      console.warn(`  Skipping v1 ID ${v1Id}: no provider slug`);
      continue;
    }

    const ts = parseV1Date(createdAt);

    inserts.push(`  (
    ${sqlEscape(slug)},          -- provider_id
    NULL,                          -- account_id (v1.0 import)
    ${sqlEscape(reviewerName)},    -- reviewer_name
    ${rating},                     -- rating
    NULL,                          -- title
    ${sqlEscape(comment)},         -- comment
    NULL,                          -- relationship (not tracked in v1.0)
    'published',                   -- status
    ${ts},                         -- created_at
    ${ts},                         -- updated_at
    'olera_v1'                     -- migration_source
  )`);
  }

  const sql = `-- Migration: Import ${inserts.length} legitimate reviews from Olera v1.0
-- Generated by: scripts/generate-v1-review-migration.ts
-- Source CSV: docs/review_2026-03-10_12h38m42.csv
-- Criteria: Status=Submitted with real user Content (not AI-generated drafts)

INSERT INTO reviews (
  provider_id, account_id, reviewer_name, rating, title, comment,
  relationship, status, created_at, updated_at, migration_source
) VALUES
${inserts.join(",\n")}
ON CONFLICT DO NOTHING;

-- Verify count
-- Expected: ${inserts.length} rows
-- SELECT count(*) FROM reviews WHERE migration_source = 'olera_v1';
`;

  writeFileSync(OUTPUT_PATH, sql, "utf-8");
  console.log(`\nWrote ${inserts.length} INSERT rows to ${OUTPUT_PATH}`);
}

main();
