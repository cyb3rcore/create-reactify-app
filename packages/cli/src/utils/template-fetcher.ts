import type { TemplateMap } from "@cyber-stack/template-generator";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

const TEMPLATE_REPO = "cybercore-ma/template-amal";
const DEFAULT_TEMPLATE_URL = `https://api.github.com/repos/${TEMPLATE_REPO}/tarball`;

export async function fetchTemplates(version?: string): Promise<TemplateMap> {
  const url = version
    ? `${DEFAULT_TEMPLATE_URL}/${version}`
    : DEFAULT_TEMPLATE_URL;

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
    const response = await fetch(url, {
      headers: {
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch templates: ${response.status} ${response.statusText}`
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const tarballPath = join(tmpDir, "template.tar.gz");

    const { writeFileSync } = await import("node:fs");
    writeFileSync(tarballPath, buffer);
    execSync(`tar -xzf "${tarballPath}" -C "${tmpDir}"`, { stdio: "ignore" });

    const entries = readdirSync(tmpDir);
    const extractedDir = entries.find(
      (e) => e.startsWith("cybercore-ma-template-amal-") || e === "templates"
    );

    if (!extractedDir) {
      throw new Error("Could not find extracted template directory");
    }

    const templateBase = join(tmpDir, extractedDir);
    const templatesDir = join(templateBase, "templates");

    if (existsSync(templatesDir)) {
      return loadLocalTemplates(templatesDir);
    }

    return loadLocalTemplates(templateBase);
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
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
