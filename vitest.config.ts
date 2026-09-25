import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // supabase/tests corre aparte con `pnpm test:db`
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
