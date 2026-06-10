import type { TemplateMap } from "@cyber-stack/template-generator";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

const DEFAULT_TEMPLATE_REPO = "git@github.com:cybercore-ma/template-amal.git";

export async function fetchTemplates(
  repoUrl?: string
): Promise<TemplateMap> {
  const url = repoUrl || DEFAULT_TEMPLATE_REPO;
  const tmpDir = mkdtempSync(join(tmpdir(), "cyber-stack-templates-"));

  try {
    // Shallow clone via SSH — no tokens, no API, just keys
    execSync(`git clone --depth 1 "${url}" "${tmpDir}"`, {
      stdio: "pipe",
      timeout: 30_000,
    });

    const templatesDir = join(tmpDir, "templates");
    return loadLocalTemplates(templatesDir);
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
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
        templates[`templates/${relativePath}`] = readFileSync(fullPath, "utf-8");
      }
    }
  }

  walkDir(dir);
  return templates;
}
