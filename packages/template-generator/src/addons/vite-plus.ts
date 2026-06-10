import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processVitePlus(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  if (!config.addons.includes("vite-plus")) return;

  const viteConfig = vfs.readFile("vite.config.ts");
  if (!viteConfig) return;

  const enhancedConfig = viteConfig.replace(
    "export default defineConfig({",
    `export default defineConfig({
  server: {
    https: {},
    host: true,
  },`
  );

  vfs.writeFile("vite.config.ts", enhancedConfig);
}
