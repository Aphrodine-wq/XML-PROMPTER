// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [react()],
    // @ts-ignore - Vitest config
    test: {
      environment: "happy-dom",
      globals: true,
      setupFiles: "./src/renderer/src/tests/setup.ts"
    }
  }
});
export {
  electron_vite_config_default as default
};
