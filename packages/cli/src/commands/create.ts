import { defineCommand, runMain } from "citty";
import consola from "consola";
import { existsSync } from "node:fs";
import type { ProjectConfig, Template, ERP, Auth, CMS, PostHog, Portal, Quote, Runtime, PackageManager } from "../vendor/schemas";
import { ProjectConfigSchema } from "../vendor/schemas";
import { generateProject, VirtualFileSystem, registerTemplateHelpers } from "../vendor/index";
import { fetchTemplates } from "../utils/template-fetcher";
import { writeProject, getProjectDir } from "../utils/project-writer";
import { installDependencies, initGitRepo } from "../utils/package-manager";
import { fillMissingFlags } from "../prompts";

export interface CreateOptions {
  projectName?: string;
  template?: Template;
  runtime?: Runtime;
  erpnext?: ERP;
  auth?: Auth;
  cms?: CMS;
  posthog?: PostHog;
  portal?: Portal;
  quote?: Quote;
  packageManager?: PackageManager;
  git?: boolean;
  noGit?: boolean;
  install?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}

const cliCommand = defineCommand({
  meta: {
    name: "create-reactify-app",
    description: "Scaffold a new Reactify project",
  },
  args: {
    projectName: {
      type: "positional",
      description: "Project name or directory",
      required: false,
    },
    template: {
      type: "string",
      description: "Template to use (salam | lamsa)",
      default: "salam",
    },
    runtime: {
      type: "string",
      description: "Runtime (bun | node)",
    },
    erpnext: {
      type: "string",
      description: "ERPNext integration (erpnext | none)",
    },
    auth: {
      type: "string",
      description: "Authentication (auth | none)",
    },
    cms: {
      type: "string",
      description: "CMS section system (cms | none)",
    },
    posthog: {
      type: "string",
      description: "PostHog analytics (posthog | none)",
    },
    portal: {
      type: "string",
      description: "Customer portal (portal | none)",
    },
    quote: {
      type: "string",
      description: "Quote form (quote | none)",
    },
    "package-manager": {
      type: "string",
      description: "Package manager (npm | pnpm | bun)",
    },
    git: {
      type: "boolean",
      description: "Initialize git repository",
      default: true,
    },
    "no-git": {
      type: "boolean",
      description: "Skip git initialization",
      default: false,
    },
    install: {
      type: "boolean",
      description: "Install dependencies",
      default: false,
    },
    yes: {
      type: "boolean",
      description: "Skip prompts, use defaults",
      alias: "y",
      default: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Validate without writing",
      default: false,
    },
  },
  async run({ args }) {
    const options: CreateOptions = {
      projectName: args.projectName,
      template: args.template as Template | undefined,
      runtime: args.runtime as Runtime | undefined,
      erpnext: args.erpnext as ERP | undefined,
      auth: args.auth as Auth | undefined,
      cms: args.cms as CMS | undefined,
      posthog: args.posthog as PostHog | undefined,
      portal: args.portal as Portal | undefined,
      quote: args.quote as Quote | undefined,
      packageManager: args["package-manager"] as PackageManager | undefined,
      git: args["no-git"] ? false : args.git,
      install: args.install,
      yes: args.yes,
      dryRun: args["dry-run"],
    };

    await createProject(options);
  },
});

export async function createProject(options: CreateOptions): Promise<void> {
  registerTemplateHelpers();
  consola.info("create-reactify-app v0.1.0");

  // Build partial config from CLI args
  let config: Partial<ProjectConfig> = {
    projectName: options.projectName,
    template: options.template || "salam",
    runtime: options.runtime,
    erpnext: options.erpnext,
    auth: options.auth,
    cms: options.cms,
    posthog: options.posthog,
    portal: options.portal,
    quote: options.quote,
    packageManager: options.packageManager,
    git: options.git,
    install: options.install,
    addons: [],
    projectDir: "",
  };

  // Fill missing flags with interactive prompts (unless --yes)
  if (!options.yes) {
    try {
      config = await fillMissingFlags(config);
    } catch (err) {
      consola.error(err instanceof Error ? err.message : "Prompt failed");
      process.exit(1);
    }
  }

  // Set defaults for any remaining missing fields
  config.projectName = config.projectName || "my-app";
  config.runtime = config.runtime || "bun";
  config.erpnext = config.erpnext || "none";
  config.auth = config.auth || "none";
  config.cms = config.cms || "none";
  config.posthog = config.posthog || "none";
  config.portal = config.portal || "none";
  config.quote = config.quote || "none";
  config.packageManager = config.packageManager || "bun";
  config.projectDir = config.projectDir || "";
  config.git = config.git !== undefined ? config.git : true;
  config.install = config.install ?? false;
  config.addons = config.addons || [];

  // Validate
  const parsed = ProjectConfigSchema.safeParse(config);
  if (!parsed.success) {
    consola.error("Invalid configuration:");
    for (const issue of parsed.error.issues) {
      consola.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const finalConfig = parsed.data;

  // If projectName is an absolute path, use it as projectDir and extract name
  if (finalConfig.projectName.startsWith("/")) {
    finalConfig.projectDir = finalConfig.projectName;
    finalConfig.projectName = finalConfig.projectName.split("/").pop() || "my-app";
  } else {
    finalConfig.projectDir = getProjectDir(finalConfig.projectName);
  }

  // Check if target directory exists
  if (existsSync(finalConfig.projectDir)) {
    consola.error(`Directory "${finalConfig.projectDir}" already exists.`);
    process.exit(1);
  }

  if (options.dryRun) {
    consola.info("Dry run — validation passed");
    consola.info(JSON.stringify(finalConfig, null, 2));
    return;
  }

  // Fetch templates from GitHub
  consola.info("Fetching templates...");
  const templates = await fetchTemplates(finalConfig.template);

  // Generate project in VFS
  const vfs = new VirtualFileSystem();
  generateProject(vfs, templates, finalConfig);

  // Write to disk
  await writeProject(vfs, finalConfig.projectDir);

  // Git init
  if (finalConfig.git !== false) {
    initGitRepo(finalConfig.projectDir);
  }

  // Install deps
  if (finalConfig.install) {
    installDependencies(finalConfig.projectDir, finalConfig.packageManager);
  }

  consola.success(`Project "${finalConfig.projectName}" created!`);
  consola.info(`  cd ${finalConfig.projectName}`);
  consola.info(`  ${finalConfig.packageManager} run dev`);
}

export async function runCli(): Promise<void> {
  await runMain(cliCommand);
}
