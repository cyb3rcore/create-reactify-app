import * as p from "@clack/prompts";
import type { ProjectConfig, ERP, Auth, CMS, PostHog, Portal, Quote, Runtime, PackageManager } from "../vendor/schemas";

export async function fillMissingFlags(
  config: Partial<ProjectConfig>
): Promise<ProjectConfig> {
  // Only prompt for flags not already provided
  const needsProjectName = !config.projectName;
  const needsRuntime = !config.runtime;
  const needsErpnext = !config.erpnext;
  const needsAuth = !config.auth;
  const needsCms = !config.cms;
  const needsPosthog = !config.posthog;
  const needsPortal = !config.portal;
  const needsQuote = !config.quote;
  const needsPackageManager = !config.packageManager;

  // If all flags are provided, skip prompts entirely
  if (
    !needsProjectName &&
    !needsRuntime &&
    !needsErpnext &&
    !needsAuth &&
    !needsCms &&
    !needsPosthog &&
    !needsPortal &&
    !needsQuote &&
    !needsPackageManager
  ) {
    return {
      projectName: config.projectName || "my-app",
      projectDir: "",
      template: "lamsa",
      runtime: config.runtime as Runtime,
      erpnext: config.erpnext as ERP,
      auth: config.auth as Auth,
      cms: config.cms as CMS,
      posthog: config.posthog as PostHog,
      portal: config.portal as Portal,
      quote: config.quote as Quote,
      packageManager: config.packageManager as PackageManager,
      git: config.git ?? true,
      install: config.install ?? false,
      addons: config.addons || [],
    };
  }

  p.intro("create-reactify-app");

  const prompter: Record<string, () => Promise<any>> = {};

  if (needsProjectName) {
    prompter.projectName = () =>
      p.text({
        message: "What is your project named?",
        initialValue: "my-app",
        validate: (value: string | undefined) => {
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

  if (needsErpnext) {
    prompter.erpnext = () =>
      p.select({
        message: "Include ERPNext integration?",
        options: [
          { value: "erpnext", label: "ERPNext", hint: "REST client + webhooks + setup scripts" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsAuth) {
    prompter.auth = () =>
      p.select({
        message: "Include authentication?",
        options: [
          { value: "auth", label: "Auth", hint: "login, register, session management" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsCms) {
    prompter.cms = () =>
      p.select({
        message: "Include CMS section system?",
        options: [
          { value: "cms", label: "CMS", hint: "content management sections" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsPosthog) {
    prompter.posthog = () =>
      p.select({
        message: "Include PostHog analytics?",
        options: [
          { value: "posthog", label: "PostHog", hint: "product analytics platform" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsPortal) {
    prompter.portal = () =>
      p.select({
        message: "Include customer portal?",
        options: [
          { value: "portal", label: "Portal", hint: "customer dashboard + account management" },
          { value: "none", label: "None" },
        ],
        initialValue: "none",
      });
  }

  if (needsQuote) {
    prompter.quote = () =>
      p.select({
        message: "Include quote form?",
        options: [
          { value: "quote", label: "Quote", hint: "request a quote form + admin" },
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

  const prompterGroup = p.group(prompter as Record<string, () => Promise<unknown>>, {
    onCancel: () => {
      p.cancel("Operation cancelled.");
      process.exit(0);
    },
  });
  const result: Record<string, unknown> = await prompterGroup;

  p.outro("Scaffolding your project...");

  return {
    projectName: (result.projectName as string) || config.projectName || "my-app",
    projectDir: "",
    template: config.template || "lamsa",
    runtime: (result.runtime as Runtime) || config.runtime || "bun",
    erpnext: (result.erpnext as ERP) || config.erpnext || "none",
    auth: (result.auth as Auth) || config.auth || "none",
    cms: (result.cms as CMS) || config.cms || "none",
    posthog: (result.posthog as PostHog) || config.posthog || "none",
    portal: (result.portal as Portal) || config.portal || "none",
    quote: (result.quote as Quote) || config.quote || "none",
    packageManager: (result.packageManager as PackageManager) || config.packageManager || "bun",
    git: config.git ?? true,
    install: config.install ?? false,
    addons: config.addons || [],
  };
}
