import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processApi(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.api === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    `templates/api/${config.api}`,
    "",
    config
  );
}
