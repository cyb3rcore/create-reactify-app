import Handlebars from "handlebars";
import type { ProjectConfig } from "@cyber-stack/types";
import { VirtualFileSystem } from "./core/virtual-fs";

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

export interface TemplateMap {
  [path: string]: string;
}

export function processTemplatesFromPrefix(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  prefix: string,
  outputPrefix: string,
  config: ProjectConfig
): void {
  const prefixPath = prefix.replace(/\/$/, "") + "/";

  for (const [templatePath, rawContent] of Object.entries(templates)) {
    if (!templatePath.startsWith(prefixPath)) continue;

    const relativePath = templatePath.slice(prefixPath.length);
    const outputPath = outputPrefix
      ? `${outputPrefix.replace(/\/$/, "")}/${relativePath}`
      : relativePath;

    const template = Handlebars.compile(rawContent);
    const rendered = template(config);
    const finalPath = outputPath.replace(/\.hbs$/, "").replace(/^_/, ".");

    vfs.writeFile(finalPath, rendered);
  }
}

export function generateProject(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  // Handlers will be called in order by the CLI
  // This function orchestrates the full pipeline
}
