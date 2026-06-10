import { defineCommand, runMain } from "citty";
import consola from "consola";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ProjectConfig, API, Auth, Database, ORM, Runtime, PackageManager, Addon } from "@cyber-stack/types";
import { ProjectConfigSchema } from "@cyber-stack/types";
import { generateProject, VirtualFileSystem, registerTemplateHelpers } from "@cyber-stack/template-generator";
import { fetchTemplates } from "../utils/template-fetcher";
import { writeProject, getProjectDir } from "../utils/project-writer";
import { installDependencies, initGitRepo } from "../utils/package-manager";
import { fillMissingFlags } from "../prompts";

export interface CreateOptions {
  projectName?: string;
  template?: string;
  runtime?: Runtime;
  api?: API;
  auth?: Auth;
  database?: Database;
  orm?: ORM;
  packageManager?: PackageManager;
  git?: boolean;
  noGit?: boolean;
  install?: boolean;
  addons?: Addon[];
  yes?: boolean;
  dryRun?: boolean;
}

const cliCommand = defineCommand({
  meta: {
    name: "create-cyber-stack",
    description: "Scaffold a new cyber-stack project",
  },
  args: {
    projectName: {
      type: "positional",
      description: "Project name or directory",
      required: false,
    },
    template: {
      type: "string",
      description: "Template to use",
      default: "amal",
    },
    runtime: {
      type: "string",
      description: "Runtime (bun | node)",
    },
    api: {
      type: "string",
      description: "API layer (trpc | orpc | none)",
    },
    auth: {
      type: "string",
      description: "Auth provider (better-auth | none)",
    },
    database: {
      type: "string",
      description: "Database (sqlite | postgres | none)",
    },
    orm: {
      type: "string",
      description: "ORM (drizzle | none)",
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
    addons: {
      type: "string",
      description: "Addons (comma-separated: mcp,skills,vite-plus)",
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
      template: args.template,
      runtime: args.runtime as Runtime | undefined,
      api: args.api as API | undefined,
      auth: args.auth as Auth | undefined,
      database: args.database as Database | undefined,
      orm: args.orm as ORM | undefined,
      packageManager: args["package-manager"] as PackageManager | undefined,
      git: args["no-git"] ? false : args.git,
      install: args.install,
      addons: args.addons
        ? (args.addons.split(",").map((s: string) => s.trim()) as Addon[])
        : undefined,
      yes: args.yes,
      dryRun: args["dry-run"],
    };

    await createProject(options);
  },
});

export async function createProject(options: CreateOptions): Promise<void> {
  registerTemplateHelpers();
  consola.info("create-cyber-stack v0.1.0");

  // Build partial config from CLI args
  let config: Partial<ProjectConfig> = {
    template: "amal",
    runtime: options.runtime,
    api: options.api,
    auth: options.auth,
    database: options.database,
    orm: options.orm,
    packageManager: options.packageManager,
    git: options.git,
    install: options.install,
    addons: options.addons || [],
    projectDir: "",
  };

  // Fill missing flags with interactive prompts (unless --yes)
  if (!options.yes) {
    try {
      config = await fillMissingFlags(config);
    } catch {
      process.exit(1);
    }
  }

  // Set defaults for any remaining missing fields
  config.runtime = config.runtime || "bun";
  config.api = config.api || "none";
  config.auth = config.auth || "none";
  config.database = config.database || "none";
  config.orm = config.orm || (config.database !== "none" ? "drizzle" : "none" as ORM);
  config.packageManager = config.packageManager || "bun";
  config.projectDir = config.projectDir || "";
  config.git = config.git !== undefined ? config.git : true;
  config.install = config.install ?? false;
  config.addons = config.addons || [];
  config.projectName = config.projectName || options.projectName || "my-app";

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

  // Resolve templates directory (dev mode: from monorepo root at ../../../)
  const templateDir = resolve(import.meta.dirname!, "..", "..", "..", "templates");

  consola.info("Fetching templates...");
  const templates = await fetchTemplates({ templateDir });

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
  consola.info(`  bun run dev`);
}

export async function runCli(): Promise<void> {
  await runMain(cliCommand);
}
