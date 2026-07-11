import type { ProjectConfig } from "./schemas";

export const DEFAULT_CONFIG: ProjectConfig = {
  projectName: "my-app",
  projectDir: "",
  template: "lamsa",
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
export const PACKAGE_MANAGER_VALUES = ["npm", "pnpm", "bun"] as const;
