import "server-only";
import { neon } from "@neondatabase/serverless";
import { createStore } from "./store";
export const isConfigured = () => Boolean(process.env.DATABASE_URL);
export function getStore() {
  if (!isConfigured())
    throw new Error("Connect Neon first. See README.md for setup.");
  const sql = neon(process.env.DATABASE_URL);
  return createStore((text, values = []) => sql.query(text, values));
}
