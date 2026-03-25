import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const pagesMode = mode === "pages";

  return {
    plugins: [react()],
    base: pagesMode ? "/raftvis/" : "/",
    build: {
      outDir: pagesMode ? "dist-pages" : "../cli/dist",
      emptyOutDir: true
    },
    test: {
      environment: "jsdom",
      globals: true
    }
  };
});
