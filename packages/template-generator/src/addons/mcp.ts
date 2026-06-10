import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processMcp(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (!config.addons.includes("mcp")) return;
  processTemplatesFromPrefix(vfs, templates, "templates/addons/mcp", "", config);
}
