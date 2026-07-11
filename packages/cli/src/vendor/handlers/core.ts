import type { ProjectConfig } from "../schemas";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processCore(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  processTemplatesFromPrefix(vfs, templates, "templates/core", "", config);
}
