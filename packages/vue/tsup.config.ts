import { defineConfig } from "tsup";
import vue from "unplugin-vue/esbuild";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  esbuildPlugins: [vue()],
});
