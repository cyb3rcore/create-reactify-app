import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processSkills(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (!config.addons.includes("skills")) return;
  processTemplatesFromPrefix(vfs, templates, "templates/addons/skills", "", config);
}
