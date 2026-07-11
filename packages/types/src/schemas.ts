import { z } from "zod";

export const ProjectNameSchema = z.string().min(1).max(255);
export const RuntimeSchema = z.enum(["bun", "node"] as const);
export const PackageManagerSchema = z.enum(["npm", "pnpm", "bun"] as const);

export const ProjectConfigSchema = z.object({
  projectName: ProjectNameSchema,
  projectDir: z.string(),
  template: z.literal("lamsa"),
  runtime: RuntimeSchema,
  api: z.literal("none"),
  auth: z.literal("none"),
  database: z.literal("none"),
  orm: z.literal("none"),
  packageManager: PackageManagerSchema,
  git: z.boolean(),
  install: z.boolean(),
  addons: z.tuple([]),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;
export type PackageManager = z.infer<typeof PackageManagerSchema>;
