import { z } from "zod";

export const ProjectNameSchema = z.string().min(1).max(255);

export const RuntimeSchema = z.enum(["bun", "node"] as const);

export const TemplateSchema = z.enum(["salam", "lamsa"] as const);

export const PackageManagerSchema = z.enum(["npm", "pnpm", "bun"] as const);

export const AddonSchema = z.enum(["mcp", "skills", "vite-plus"] as const);
export const AddonsSchema = z.array(AddonSchema);

export const ProjectConfigSchema = z.object({
  projectName: ProjectNameSchema,
  projectDir: z.string(),
  template: TemplateSchema,
  runtime: RuntimeSchema,
  packageManager: PackageManagerSchema,
  git: z.boolean(),
  install: z.boolean(),
  features: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type PackageManager = z.infer<typeof PackageManagerSchema>;
export type Addon = z.infer<typeof AddonSchema>;
