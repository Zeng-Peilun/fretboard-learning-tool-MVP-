import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/domain/**/*.ts"],
      reporter: ["text", "json", "html"],
      exclude: [
        "src/domain/**/*.test.ts",
        "src/domain/types.ts"
      ],
      thresholds: {
        branches: 95,
        lines: 95,
        functions: 95,
        statements: 95
      }
    }
  }
});
