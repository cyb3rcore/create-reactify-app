import type { TemplateMap } from "@cyber-stack/template-generator";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

interface TemplateFetcherOptions {
  templateDir?: string;
  remoteUrl?: string;
}

export async function fetchTemplates(
  options: TemplateFetcherOptions = {}
): Promise<TemplateMap> {
  if (options.templateDir) {
    return loadLocalTemplates(options.templateDir);
  }

  if (options.remoteUrl) {
    throw new Error("Remote template fetching not yet implemented");
  }

  throw new Error(
    "No template source provided. Use templateDir for local development."
  );
}

function loadLocalTemplates(dir: string): TemplateMap {
  const templates: TemplateMap = {};

  function walkDir(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const relativePath = relative(dir, fullPath);
        const content = readFileSync(fullPath, "utf-8");
        templates[relativePath] = content;
      }
    }
  }

  walkDir(dir);
  return templates;
}
