import type { ProjectConfig } from "../schemas";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processQuote(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.quote === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    "templates/features/quote",
    "",
    config
  );
}
