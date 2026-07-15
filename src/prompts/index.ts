import * as p from '@clack/prompts'
import type { ProjectConfig, Runtime, PackageManager } from '../vendor/schemas'

export async function fillMissingFlags(
  config: Partial<ProjectConfig>,
): Promise<ProjectConfig> {
  const needsProjectName = !config.projectName
  const needsRuntime = !config.runtime
  const needsPackageManager = !config.packageManager

  if (!needsProjectName && !needsRuntime && !needsPackageManager) {
    return {
      projectName: config.projectName || 'my-app',
      projectDir: '',
      template: config.template || 'lamsa',
      runtime: config.runtime as Runtime,
      packageManager: config.packageManager as PackageManager,
      git: config.git ?? true,
      install: config.install ?? false,
      features: config.features || {},
    }
  }

  p.intro('create-reactify-app')

  const prompter: Record<string, () => Promise<any>> = {}

  if (needsProjectName) {
    prompter.projectName = () =>
      p.text({
        message: 'What is your project named?',
        initialValue: 'my-app',
        validate: (value: string | undefined) => {
          if (!value) return 'Project name is required'
        },
      })
  }

  if (needsRuntime) {
    prompter.runtime = () =>
      p.select({
        message: 'Select runtime',
        options: [
          { value: 'bun', label: 'Bun', hint: 'fast, modern' },
          { value: 'node', label: 'Node.js', hint: 'stable, universal' },
        ],
        initialValue: 'bun',
      })
  }

  if (needsPackageManager) {
    prompter.packageManager = () =>
      p.select({
        message: 'Select package manager',
        options: [
          { value: 'bun', label: 'Bun' },
          { value: 'pnpm', label: 'pnpm' },
          { value: 'npm', label: 'npm' },
        ],
        initialValue: 'bun',
      })
  }

  const prompterGroup = p.group(prompter as Record<string, () => Promise<unknown>>, {
    onCancel: () => {
      p.cancel('Operation cancelled.')
      process.exit(0)
    },
  })
  const result: Record<string, unknown> = await prompterGroup

  p.outro('Scaffolding your project...')

  return {
    projectName: (result.projectName as string) || config.projectName || 'my-app',
    projectDir: '',
    template: config.template || 'lamsa',
    runtime: (result.runtime as Runtime) || config.runtime || 'bun',
    packageManager: (result.packageManager as PackageManager) || config.packageManager || 'bun',
    git: config.git ?? true,
    install: config.install ?? false,
    features: config.features || {},
  }
}
