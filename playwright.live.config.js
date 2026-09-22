import { defineConfig } from "@playwright/test";
import nextEnv from "@next/env";
import previewConfig from "./playwright.config.js";
nextEnv.loadEnvConfig(process.cwd());
export default defineConfig({
  ...previewConfig,
  testDir: "./tests/live",
  timeout: 90000,
});
