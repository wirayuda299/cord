import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
   resolve: {
      tsconfigPaths: true,
   },
   plugins: [react()],
   test: {
      environment: "jsdom",
      clearMocks: true,
      server: {
         deps: {
            inline: ["zod"],
         },
      },
      coverage: {
         provider: "v8", // or 'istanbul'
      },
      reporters: ["default"],
   },
});
