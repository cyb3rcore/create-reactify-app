import type { TemplateMap } from "@cyber-stack/template-generator";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

interface TemplateFetcherOptions {
  templateDir?: string;
  remoteUrl?: string;
}

const DEFAULT_TEMPLATE_REPO =
  "https://api.github.com/repos/cybercore-ma/template-amal/tarball/v0.1.0";

export async function fetchTemplates(
  options: TemplateFetcherOptions = {}
): Promise<TemplateMap> {
  if (options.templateDir) {
    return loadLocalTemplates(options.templateDir);
  }

  const url = options.remoteUrl || DEFAULT_TEMPLATE_REPO;
  return fetchRemoteTemplates(url);
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

async function fetchRemoteTemplates(url: string): Promise<TemplateMap> {
  const tmpDir = mkdtempSync(join(tmpdir(), "cyber-stack-templates-"));

  try {
    // Download tarball via GitHub API
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        // Optional: add GITHUB_TOKEN env var for private repos
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch templates: ${response.status} ${response.statusText}`
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const tarballPath = join(tmpDir, "template.tar.gz");

    // Write tarball to temp file
    const { writeFileSync } = await import("node:fs");
    writeFileSync(tarballPath, buffer);

    // Extract tarball
    execSync(`tar -xzf "${tarballPath}" -C "${tmpDir}"`, { stdio: "ignore" });

    // Find the extracted directory (GitHub tarballs have a hash prefix)
    const entries = readdirSync(tmpDir);
    const extractedDir = entries.find(
      (e) => e.startsWith("cybercore-ma-template-amal-") || e === "templates"
    );

    if (!extractedDir) {
      throw new Error("Could not find extracted template directory");
    }

    const templateBase = join(tmpDir, extractedDir);
    const templatesDir = join(templateBase, "templates");

    // Check if templates directory exists at the expected location
    if (existsSync(templatesDir)) {
      return loadLocalTemplates(templatesDir);
    }

    // Fallback: the extracted dir itself might be the template root
    return loadLocalTemplates(templateBase);
  } finally {
    // Cleanup temp dir
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }
}

function existsSync(p: string): boolean {
  try {
    const { statSync } = require("node:fs");
    statSync(p);
    return true;
  } catch {
    return false;
  }
}
