import type { ProjectConfig } from "./schemas";

export const DEFAULT_CONFIG: ProjectConfig = {
  projectName: "my-app",
  projectDir: "",
  template: "salam",
  runtime: "bun",
  erpnext: "none",
  auth: "none",
  cms: "none",
  posthog: "none",
  portal: "none",
  quote: "none",
  packageManager: "bun",
  git: true,
  install: false,
  addons: [],
};

export const TEMPLATE_VALUES = ["salam", "lamsa"] as const;
export const RUNTIME_VALUES = ["bun", "node"] as const;
export const ERP_VALUES = ["erpnext", "none"] as const;
export const AUTH_VALUES = ["auth", "none"] as const;
export const CMS_VALUES = ["cms", "none"] as const;
export const POSTHOG_VALUES = ["posthog", "none"] as const;
export const PORTAL_VALUES = ["portal", "none"] as const;
export const QUOTE_VALUES = ["quote", "none"] as const;
export const PACKAGE_MANAGER_VALUES = ["npm", "pnpm", "bun"] as const;
export const ADDON_VALUES = ["mcp", "skills", "vite-plus"] as const;
