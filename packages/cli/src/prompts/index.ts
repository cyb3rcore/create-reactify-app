import * as p from "@clack/prompts";
import type { ProjectConfig, API, Auth, Database, Runtime, PackageManager } from "@cyber-stack/types";

export async function fillMissingFlags(
  config: Partial<ProjectConfig>
): Promise<ProjectConfig> {
  // Only prompt for flags not already provided
  const needsProjectName = !config.projectName;
  const needsRuntime = !config.runtime;
  const needsApi = !config.api;
  const needsAuth = !config.auth;
  const needsDatabase = !config.database;
  const needsPackageManager = !config.packageManager;

  // If all flags are provided, skip prompts entirely
  if (!needsProjectName && !needsRuntime && !needsApi && !needsAuth && !needsDatabase && !needsPackageManager) {
    return {
      projectName: config.projectName || "my-app",
      projectDir: "",
      template: "amal",
      runtime: config.runtime as Runtime,
      api: config.api as API,
      auth: config.auth as Auth,
      database: config.database as Database,
      orm: config.database !== "none" ? "drizzle" : "none" as any,
      packageManager: config.packageManager as PackageManager,
      git: config.git ?? true,
      install: config.install ?? false,
      addons: config.addons || [],
    };
  }

  p.intro("create-cyber-stack");

  const prompter: Record<string, () => Promise<any>> = {};

  if (needsProjectName) {
    prompter.projectName = () =>
      p.text({
        message: "What is your project named?",
        initialValue: "my-app",
        validate: (value: string) => {
          if (!value) return "Project name is required";
        },
      });
  }

  if (needsRuntime) {
    prompter.runtime = () =>
      p.select({
        message: "Select runtime",
        options: [
          { value: "bun", label: "Bun", hint: "fast, modern" },
          { value: "node", label: "Node.js", hint: "stable, universal" },
        ],
        initialValue: "bun",
      });
  }

  if (needsApi) {
    prompter.api = () =>
      p.select({
        message: "Select API layer",
        options: [
          { value: "trpc", label: "tRPC", hint: "end-to-end typesafe APIs" },
          { value: "orpc", label: "OpenRPC", hint: "open-rpc standard" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsAuth) {
    prompter.auth = () =>
      p.select({
        message: "Select auth provider",
        options: [
          { value: "better-auth", label: "Better Auth", hint: "modern auth library" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsDatabase) {
    prompter.database = () =>
      p.select({
        message: "Select database",
        options: [
          { value: "sqlite", label: "SQLite", hint: "local, file-based" },
          { value: "postgres", label: "PostgreSQL", hint: "production-grade" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsPackageManager) {
    prompter.packageManager = () =>
      p.select({
        message: "Select package manager",
        options: [
          { value: "bun", label: "Bun" },
          { value: "pnpm", label: "pnpm" },
          { value: "npm", label: "npm" },
        ],
        initialValue: "bun",
      });
  }

  const result = await p.group(prompter as any, {
    onCancel: () => {
      p.cancel("Operation cancelled.");
      process.exit(0);
    },
  });

  p.outro("Scaffolding your project...");

  const database = (result.database as Database) || config.database || "none";

  return {
    projectName: (result.projectName as string) || config.projectName || "my-app",
    projectDir: "",
    template: "amal",
    runtime: (result.runtime as Runtime) || config.runtime || "bun",
    api: (result.api as API) || config.api || "none",
    auth: (result.auth as Auth) || config.auth || "none",
    database,
    orm: (database !== "none" ? "drizzle" : "none") as any,
    packageManager: (result.packageManager as PackageManager) || config.packageManager || "bun",
    git: config.git ?? true,
    install: config.install ?? false,
    addons: config.addons || [],
  };
}
