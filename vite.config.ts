import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  // One three.js build: addons import "three", which would otherwise pull in the WebGL renderer too.
  resolve: { alias: [{ find: /^three$/, replacement: "three/webgpu" }] },
  server: { port: 5173, strictPort: true },
  build: { target: "es2022", sourcemap: true, chunkSizeWarningLimit: 4500 },
});
