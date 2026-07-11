import { VirtualFileSystem } from "../vendor/index";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
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
  const written: string[] = [];

  try {
    for (const filePath of files) {
      const content = vfs.readFile(filePath)!;
      const fullPath = join(targetDir, filePath);
      const dir = dirname(fullPath);

      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content, "utf-8");
      written.push(fullPath);
    }
  } catch (err) {
    // Roll back partial writes
    consola.warn("Write failed, rolling back...");
    for (const path of written) {
      try {
        rmSync(path, { force: true });
      } catch {
        // best effort cleanup
      }
    }
    // Try to remove empty directories (reverse order)
    const dirs = new Set(written.map((p) => dirname(p)));
    for (const dir of [...dirs].reverse()) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // directory might have pre-existing files
      }
    }
    throw new Error(
      `Failed to write project: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  consola.success(`Wrote ${files.length} files to ${targetDir}`);
}

export function getProjectDir(projectName: string): string {
  return join(process.cwd(), projectName);
}
