import { Command } from 'commander'
import consola from 'consola'
import { existsSync, readFileSync } from 'node:fs'
import type { ProjectConfig, Template, Runtime, PackageManager } from '../vendor/schemas'
import { ProjectConfigSchema } from '../vendor/schemas'
import { generateProject, VirtualFileSystem, registerTemplateHelpers } from '../vendor/index'
import { fetchTemplates } from '../utils/template-fetcher'
import { writeProject, getProjectDir } from '../utils/project-writer'
import { installDependencies, initGitRepo } from '../utils/package-manager'
import { fillMissingFlags } from '../prompts'
import { parseFlags } from '../vendor/flag-parser'

export interface CreateOptions {
  projectName?: string
  template?: string
  runtime?: string
  packageManager?: string
  git?: boolean
  install?: boolean
  yes?: boolean
  dryRun?: boolean
}

export async function createProject(options: CreateOptions): Promise<void> {
  registerTemplateHelpers()
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))
  consola.info(`create-reactify-app v${version}`)

  // Build partial config from CLI args
  let config: Partial<ProjectConfig> = {
    projectName: options.projectName,
    template: (options.template as Template) || 'lamsa',
    runtime: (options.runtime as Runtime) || 'bun',
    packageManager: (options.packageManager as PackageManager) || 'bun',
    git: options.git !== false,
    install: options.install || false,
    features: {},
  }

  // Extract feature flags from CLI — parse the raw argv
  config.features = parseFlags(process.argv.slice(2))

  // Fill missing flags with interactive prompts (unless --yes)
  if (!options.yes) {
    try {
      config = await fillMissingFlags(config)
    } catch (err) {
      consola.error(err instanceof Error ? err.message : 'Prompt failed')
      process.exit(1)
    }
  }

  // Set defaults for any remaining fields
  config.projectName = config.projectName || 'my-app'
  config.runtime = config.runtime || 'bun'
  config.packageManager = config.packageManager || 'bun'
  config.git = config.git !== undefined ? config.git : true
  config.install = config.install || false
  config.features = config.features || {}

  // Validate
  const parsed = ProjectConfigSchema.safeParse(config)
  if (!parsed.success) {
    consola.error('Invalid configuration:')
    for (const issue of parsed.error.issues) {
      consola.error(`  ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }

  const finalConfig = parsed.data

  // Handle project directory
  if (finalConfig.projectName.startsWith('/')) {
    finalConfig.projectDir = finalConfig.projectName
    finalConfig.projectName = finalConfig.projectName.split('/').pop() || 'my-app'
  } else {
    finalConfig.projectDir = getProjectDir(finalConfig.projectName)
  }

  if (existsSync(finalConfig.projectDir)) {
    consola.error(`Directory "${finalConfig.projectDir}" already exists.`)
    process.exit(1)
  }

  if (options.dryRun) {
    consola.info('Dry run — validation passed')
    consola.info(JSON.stringify(finalConfig, null, 2))
    return
  }

  // Fetch templates from GitHub
  consola.info('Fetching templates...')
  const templates = await fetchTemplates(finalConfig.template)

  // Generate project in VFS
  const vfs = new VirtualFileSystem()
  generateProject(vfs, templates, finalConfig)

  // Write to disk
  await writeProject(vfs, finalConfig.projectDir)

  // Git init
  if (finalConfig.git !== false) {
    initGitRepo(finalConfig.projectDir)
  }

  // Install deps
  if (finalConfig.install) {
    installDependencies(finalConfig.projectDir, finalConfig.packageManager)
  }

  consola.success(`Project "${finalConfig.projectName}" created!`)
  consola.info(`  cd ${finalConfig.projectName}`)
  if (!finalConfig.install) {
    const pm = finalConfig.packageManager
    const installCmd = pm === 'bun' ? 'bun i' : pm === 'pnpm' ? 'pnpm i' : 'npm i'
    consola.info(`  ${installCmd}`)
  }
  consola.info(`  ${finalConfig.packageManager} run dev`)
}

export async function runCli(): Promise<void> {
  const program = new Command()
    .name('create-reactify-app')
    .argument('[projectName]', 'Project name or directory')
    .option('--template <name>', 'Template to use (salam | lamsa)')
    .option('-y, --yes', 'Skip prompts, use defaults')
    .option('--package-manager <name>', 'Package manager (npm | pnpm | bun)')
    .option('--no-git', 'Skip git initialization')
    .option('--install', 'Install dependencies')
    .option('--dry-run', 'Validate without writing')
    .option('--runtime <name>', 'Runtime (bun | node)')
    .allowUnknownOption()
    .action(async (projectName, opts) => {
      await createProject({
        projectName,
        template: opts.template as string | undefined,
        yes: !!opts.yes,
        packageManager: opts.packageManager as string | undefined,
        git: opts.git as boolean | undefined,
        install: !!opts.install,
        dryRun: !!opts.dryRun,
        runtime: opts.runtime as string | undefined,
      })
    })

  await program.parseAsync(process.argv)
}
