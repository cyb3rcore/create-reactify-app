import type { TemplateMap } from "../vendor/index";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

const DEFAULT_TEMPLATE_REPO = "git@github.com:cyb3rcore/template-salam.git";
const MAX_RETRIES = 3;

export async function fetchTemplates(
  repoUrl?: string
): Promise<TemplateMap> {
  const url = repoUrl || DEFAULT_TEMPLATE_REPO;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await cloneAndLoad(url);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`Template fetch failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw new Error(
    `Failed to fetch templates after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

function cloneAndLoad(repoUrl: string): TemplateMap {
  const tmpDir = mkdtempSync(join(tmpdir(), "cyber-stack-templates-"));

  try {
    execSync(`git clone --depth 1 "${repoUrl}" "${tmpDir}"`, {
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
