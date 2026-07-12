import type { ProjectConfig } from "../schemas";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processPostHog(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.posthog === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    "templates/features/posthog",
    "",
    config
  );
}
