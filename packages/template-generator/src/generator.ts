import Handlebars from "handlebars";
import type { ProjectConfig } from "@cyber-stack/types";
import { VirtualFileSystem } from "./core/virtual-fs";
import { processCore } from "./handlers/core";
import { processApi } from "./handlers/api";
import { processAuth } from "./handlers/auth";
import { processDatabase } from "./handlers/database";
import { processMcp } from "./addons/mcp";
import { processSkills } from "./addons/skills";
import { processVitePlus } from "./addons/vite-plus";
import { runPostProcessors } from "./post-process";

export interface TemplateMap {
  [path: string]: string;
}

/**
 * Register Handlebars helpers for template rendering.
 * Should be called once at application startup.
 */
export function registerTemplateHelpers(): void {
  Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
  Handlebars.registerHelper("and", (...args: unknown[]) =>
    args.slice(0, -1).every(Boolean)
  );
  Handlebars.registerHelper("or", (...args: unknown[]) =>
    args.slice(0, -1).some(Boolean)
  );
  Handlebars.registerHelper(
    "includes",
    (arr: unknown[], val: unknown) => Array.isArray(arr) && arr.includes(val)
  );
}

export function processTemplatesFromPrefix(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  prefix: string,
  outputPrefix: string,
  config: ProjectConfig
): void {
  const prefixPath = prefix ? prefix.replace(/\/$/, "") + "/" : "";

  for (const [templatePath, rawContent] of Object.entries(templates)) {
    if (prefixPath && !templatePath.startsWith(prefixPath)) continue;

    const relativePath = prefixPath
      ? templatePath.slice(prefixPath.length)
      : templatePath;

    if (!relativePath) continue;

    const outputPath = outputPrefix
      ? `${outputPrefix.replace(/\/$/, "")}/${relativePath}`
      : relativePath;

    let rendered: string;
    try {
      const template = Handlebars.compile(rawContent);
      rendered = template(config);
    } catch (err) {
      throw new Error(
        `Failed to render template "${templatePath}": ${(err as Error).message}`
      );
    }

    const finalPath = outputPath.replace(/\.hbs$/, "").replace(/^_/, ".");
    vfs.writeFile(finalPath, rendered);
  }
}

export function generateProject(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  processCore(vfs, templates, config);
  processApi(vfs, templates, config);
  processAuth(vfs, templates, config);
  processDatabase(vfs, templates, config);
  processMcp(vfs, templates, config);
  processSkills(vfs, templates, config);
  processVitePlus(vfs, config);
  runPostProcessors(vfs, config);
}
