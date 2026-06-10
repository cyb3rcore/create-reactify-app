import * as p from "@clack/prompts";
import type { ProjectConfig, API, Auth, Database, ORM, Runtime, PackageManager } from "@cyber-stack/types";

export async function fillMissingFlags(
  config: Partial<ProjectConfig>
): Promise<ProjectConfig> {
  p.intro("create-cyber-stack");

  const result = await p.group(
    {
      projectName: () =>
        p.text({
          message: "What is your project named?",
          initialValue: config.projectName || "my-app",
          validate: (value: string) => {
            if (!value) return "Project name is required";
          },
        }),
      runtime: () =>
        p.select({
          message: "Select runtime",
          options: [
            { value: "bun", label: "Bun", hint: "fast, modern" },
            { value: "node", label: "Node.js", hint: "stable, universal" },
          ],
          initialValue: config.runtime || "bun",
        }),
      api: () =>
        p.select({
          message: "Select API layer",
          options: [
            { value: "trpc", label: "tRPC", hint: "end-to-end typesafe APIs" },
            { value: "orpc", label: "OpenRPC", hint: "open-rpc standard" },
            { value: "none", label: "None" },
          ],
          initialValue: config.api || "none",
        }),
      auth: () =>
        p.select({
          message: "Select auth provider",
          options: [
            {
              value: "better-auth",
              label: "Better Auth",
              hint: "modern auth library",
            },
            { value: "none", label: "None" },
          ],
          initialValue: config.auth || "none",
        }),
      database: () =>
        p.select({
          message: "Select database",
          options: [
            { value: "sqlite", label: "SQLite", hint: "local, file-based" },
            {
              value: "postgres",
              label: "PostgreSQL",
              hint: "production-grade",
            },
            { value: "none", label: "None" },
          ],
          initialValue: config.database || "none",
        }),
      packageManager: () =>
        p.select({
          message: "Select package manager",
          options: [
            { value: "bun", label: "Bun" },
            { value: "pnpm", label: "pnpm" },
            { value: "npm", label: "npm" },
          ],
          initialValue: config.packageManager || "bun",
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

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
    orm: (database !== "none" ? "drizzle" : "none") as ORM,
    packageManager: (result.packageManager as PackageManager) || config.packageManager || "bun",
    git: config.git ?? true,
    install: config.install ?? false,
    addons: config.addons || [],
  };
}
