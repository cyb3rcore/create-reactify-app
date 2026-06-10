import { z } from "zod";

export const ProjectNameSchema = z.string().min(1).max(255);

export const RuntimeSchema = z.enum(["bun", "node"] as const);

export const APISchema = z.enum(["trpc", "orpc", "none"] as const);

export const AuthSchema = z.enum(["better-auth", "none"] as const);

export const DatabaseSchema = z.enum(["sqlite", "postgres", "none"] as const);

export const ORMSchema = z.enum(["drizzle", "none"] as const);

export const PackageManagerSchema = z.enum(["npm", "pnpm", "bun"] as const);

export const AddonSchema = z.enum(["mcp", "skills", "vite-plus"] as const);

export const AddonsSchema = z.array(AddonSchema);

export const ProjectConfigSchema = z.object({
  projectName: ProjectNameSchema,
  projectDir: z.string(),
  template: z.literal("amal"),
  runtime: RuntimeSchema,
  api: APISchema,
  auth: AuthSchema,
  database: DatabaseSchema,
  orm: ORMSchema,
  packageManager: PackageManagerSchema,
  git: z.boolean(),
  install: z.boolean(),
  addons: AddonsSchema,
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;
export type API = z.infer<typeof APISchema>;
export type Auth = z.infer<typeof AuthSchema>;
export type Database = z.infer<typeof DatabaseSchema>;
export type ORM = z.infer<typeof ORMSchema>;
export type PackageManager = z.infer<typeof PackageManagerSchema>;
export type Addon = z.infer<typeof AddonSchema>;
