import type { ProjectConfig } from "./schemas";

export const DEFAULT_CONFIG: ProjectConfig = {
  projectName: "my-app",
  projectDir: "",
  template: "amal",
  runtime: "bun",
  api: "none",
  auth: "none",
  database: "none",
  orm: "none",
  packageManager: "bun",
  git: true,
  install: false,
  addons: [],
};

export const RUNTIME_VALUES = ["bun", "node"] as const;
export const API_VALUES = ["trpc", "orpc", "none"] as const;
export const AUTH_VALUES = ["better-auth", "none"] as const;
export const DATABASE_VALUES = ["sqlite", "postgres", "none"] as const;
export const ORM_VALUES = ["drizzle", "none"] as const;
export const PACKAGE_MANAGER_VALUES = ["npm", "pnpm", "bun"] as const;
export const ADDON_VALUES = ["mcp", "skills", "vite-plus"] as const;
