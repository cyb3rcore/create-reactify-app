import { execSync } from "node:child_process";
import consola from "consola";
import type { PackageManager } from "@cyber-stack/types";

export function installDependencies(
  projectDir: string,
  packageManager: PackageManager
): void {
  consola.info(`Installing dependencies with ${packageManager}...`);

  const commands: Record<PackageManager, string> = {
    npm: "npm install",
    pnpm: "pnpm install",
    bun: "bun install",
  };

  try {
    execSync(commands[packageManager], {
      cwd: projectDir,
      stdio: "inherit",
    });
    consola.success("Dependencies installed");
  } catch {
    consola.warn("Dependency installation failed. You can run it manually.");
  }
}

export function initGitRepo(projectDir: string): void {
  consola.info("Initializing git repository...");

  try {
    execSync("git init", { cwd: projectDir, stdio: "ignore" });
    execSync("git add .", { cwd: projectDir, stdio: "ignore" });
    execSync('git commit -m "initial: scaffold from create-reactify-app"', {
      cwd: projectDir,
      stdio: "ignore",
    });
    consola.success("Git repository initialized");
  } catch {
    consola.warn("Git initialization failed. You can init it manually.");
  }
}
