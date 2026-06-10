import { VirtualFileSystem } from "@cyber-stack/template-generator";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import consola from "consola";

export async function writeProject(
  vfs: VirtualFileSystem,
  targetDir: string
): Promise<void> {
  try {
    mkdirSync(targetDir, { recursive: true });
  } catch {
    throw new Error(`Cannot create directory: ${targetDir}`);
  }

  const files = vfs.getAllFiles();
  for (const filePath of files) {
    const content = vfs.readFile(filePath)!;
    const fullPath = join(targetDir, filePath);
    const dir = dirname(fullPath);

    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
  }

  consola.success(`Wrote ${files.length} files to ${targetDir}`);
}

export function getProjectDir(
  projectName: string,
  parentDir?: string
): string {
  const base = parentDir || process.cwd();
  return join(base, projectName);
}
