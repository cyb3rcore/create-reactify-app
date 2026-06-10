import type { API, Auth, Database } from "@cyber-stack/types";

export interface CreateOptions {
  projectName: string;
  api?: API;
  auth?: Auth;
  database?: Database;
}

/**
 * Programmatic API to scaffold a new project.
 */
export async function createProject(options: CreateOptions): Promise<void> {
  // TODO: implement project generation logic
  console.log(`Scaffolding project: ${options.projectName}`);
}

/**
 * CLI entry point — parses args, prompts, and scaffolds.
 */
export async function runCli(): Promise<void> {
  // TODO: implement CLI argument parsing and interactive prompts
  console.log("create-cyber-stack CLI");
}
