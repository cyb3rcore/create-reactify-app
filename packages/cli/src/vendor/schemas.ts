import { z } from "zod";

export const ProjectNameSchema = z.string().min(1).max(255);

export const RuntimeSchema = z.enum(["bun", "node"] as const);

export const ERPSchema = z.enum(["erpnext", "none"] as const);
export const AuthSchema = z.enum(["auth", "none"] as const);
export const CMSSchema = z.enum(["cms", "none"] as const);
export const PostHogSchema = z.enum(["posthog", "none"] as const);
export const PortalSchema = z.enum(["portal", "none"] as const);
export const QuoteSchema = z.enum(["quote", "none"] as const);

export const TemplateSchema = z.enum(["salam", "lamsa"] as const);

export const PackageManagerSchema = z.enum(["npm", "pnpm", "bun"] as const);

export const AddonSchema = z.enum(["mcp", "skills", "vite-plus"] as const);
export const AddonsSchema = z.array(AddonSchema);

export const ProjectConfigSchema = z.object({
  projectName: ProjectNameSchema,
  projectDir: z.string(),
  template: TemplateSchema,
  runtime: RuntimeSchema,
  erpnext: ERPSchema,
  auth: AuthSchema,
  cms: CMSSchema,
  posthog: PostHogSchema,
  portal: PortalSchema,
  quote: QuoteSchema,
  packageManager: PackageManagerSchema,
  git: z.boolean(),
  install: z.boolean(),
  addons: AddonsSchema,
}).refine(
  (data) => !(data.portal !== "none" && data.auth === "none"),
  { message: "Portal requires auth. Set --auth auth.", path: ["portal"] }
);

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;
export type ERP = z.infer<typeof ERPSchema>;
export type Auth = z.infer<typeof AuthSchema>;
export type CMS = z.infer<typeof CMSSchema>;
export type PostHog = z.infer<typeof PostHogSchema>;
export type Portal = z.infer<typeof PortalSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type PackageManager = z.infer<typeof PackageManagerSchema>;
export type Addon = z.infer<typeof AddonSchema>;
