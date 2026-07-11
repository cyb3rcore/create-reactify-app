import { defineCommand, runMain } from "citty";
import consola from "consola";
import { existsSync } from "node:fs";
import type { ProjectConfig, Runtime, PackageManager } from "@cyber-stack/types";
import { ProjectConfigSchema } from "@cyber-stack/types";
import { generateProject, VirtualFileSystem, registerTemplateHelpers } from "@cyber-stack/template-generator";
import { fetchTemplates } from "../utils/template-fetcher";
import { writeProject, getProjectDir } from "../utils/project-writer";
import { installDependencies, initGitRepo } from "../utils/package-manager";

export interface CreateOptions {
  projectName?: string;
  runtime?: Runtime;
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
    runtime: {
      type: "string",
      description: "Runtime (bun | node)",
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
      runtime: args.runtime as Runtime | undefined,
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

  // Build config with hardcoded feature values (template-lamsa is a minimal SSR + RSC scaffold)
  let config: Partial<ProjectConfig> = {
    projectName: options.projectName,
    template: "lamsa",
    runtime: options.runtime,
    api: "none",
    auth: "none",
    database: "none",
    orm: "none",
    packageManager: options.packageManager,
    git: options.git,
    install: options.install,
    addons: [],
    projectDir: "",
  };

  // Set defaults for any remaining missing fields
  config.projectName = config.projectName || "my-app";
  config.runtime = config.runtime || "bun";
  config.packageManager = config.packageManager || "bun";
  config.projectDir = config.projectDir || "";
  config.git = config.git !== undefined ? config.git : true;
  config.install = config.install ?? false;

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
  const templates = await fetchTemplates();

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
