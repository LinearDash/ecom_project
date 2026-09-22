import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

// Split the checked-in SQL without splitting function bodies or quoted strings.
function statements(source) {
  const tokens =
    /--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|\$\$[\s\S]*?\$\$|'(?:''|[^'])*'|"(?:""|[^"])*"|;/g;
  const result = [];
  let cursor = 0,
    current = "";
  for (const match of source.matchAll(tokens)) {
    current += source.slice(cursor, match.index);
    const token = match[0];
    if (token === ";") {
      if (current.trim()) result.push(current.trim());
      current = "";
    } else if (!token.startsWith("--") && !token.startsWith("/*")) {
      current += token;
    } else current += "\n";
    cursor = match.index + token.length;
  }
  current += source.slice(cursor);
  if (current.trim()) result.push(current.trim());
  return result.filter((statement) => !/^(begin|commit)$/i.test(statement));
}

try {
  if (!process.env.DATABASE_URL) throw new Error("MISSING_DATABASE_URL");
  const sql = neon(process.env.DATABASE_URL);
  const existing = await sql.query(
    "select tablename from pg_tables where schemaname='public'",
  );
  if (existing.length) {
    console.error(
      "Setup stopped: this database already contains public tables. No changes made.",
    );
    process.exitCode = 1;
  } else {
    const schema = await readFile(
      new URL("../database/schema.sql", import.meta.url),
      "utf8",
    );
    const seed = await readFile(
      new URL("../database/seed.sql", import.meta.url),
      "utf8",
    );
    // Neon sends this batch as one transaction: either everything succeeds or nothing changes.
    await sql.transaction(
      [...statements(schema), ...statements(seed)].map((statement) =>
        sql.query(statement),
      ),
    );
    const [result] = await sql.query(
      "select count(*)::int as products from public.products",
    );
    console.log(
      `Neon setup complete: schema created and ${result.products} starter products loaded.`,
    );
  }
} catch (error) {
  console.error(
    "Database setup failed. No connection details are printed. Error code:",
    error.code || "CONNECTION_OR_CONFIGURATION_ERROR",
  );
  process.exitCode = 1;
}
