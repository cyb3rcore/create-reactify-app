// packages/cli/src/vendor/generator.ts
import Handlebars from 'handlebars'
import type { ProjectConfig } from './schemas'
import { VirtualFileSystem } from './core/virtual-fs'
import { runPostProcessors } from './post-process'

export interface TemplateMap {
  [path: string]: string
}

export function registerTemplateHelpers(): void {
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
  Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b)
  Handlebars.registerHelper('and', (...args: unknown[]) => args.slice(0, -1).every(Boolean))
  Handlebars.registerHelper('or', (...args: unknown[]) => args.slice(0, -1).some(Boolean))
  Handlebars.registerHelper('includes', (arr: unknown[], val: unknown) => Array.isArray(arr) && arr.includes(val))
  Handlebars.registerHelper('not', (v: unknown) => !v)
  Handlebars.registerHelper('raw', function (options) { return options.fn() })
}

export function processTemplatesFromPrefix(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  prefix: string,
  outputPrefix: string,
  config: ProjectConfig
): void {
  const prefixPath = prefix ? prefix.replace(/\/$/, '') + '/' : ''
  for (const [templatePath, rawContent] of Object.entries(templates)) {
    if (prefixPath && !templatePath.startsWith(prefixPath)) continue
    const relativePath = prefixPath ? templatePath.slice(prefixPath.length) : templatePath
    if (!relativePath) continue
    const outputPath = outputPrefix ? `${outputPrefix.replace(/\/$/, '')}/${relativePath}` : relativePath
    let rendered: string
    try {
      const template = Handlebars.compile(rawContent)
      rendered = template({ ...config, ...config.features })
    } catch (err) {
      throw new Error(`Failed to render template "${templatePath}": ${(err as Error).message}`)
    }
    const finalPath = outputPath.replace(/\.hbs$/, '').replace(/^_/, '.')
    vfs.writeFile(finalPath, rendered)
  }
}

/**
 * Determines whether a feature directory should be processed.
 * Naming convention examples:
 *   auth          → features.auth truthy
 *   cms-shared    → features.cms truthy
 *   cms-erpnext   → features.cms === "erpnext"
 *   multi-company  → features.multiCompany truthy
 */
/**
 * Converts kebab-case to camelCase.
 * "multi-company" → "multiCompany"
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

export function shouldProcessFeature(
  dir: string,
  features: Record<string, string | boolean>,
): boolean {
  const lastHyphen = dir.lastIndexOf('-')
  if (lastHyphen === -1) {
    // Simple feature name: "auth"
    return !!features[dir]
  }
  const prefix = dir.slice(0, lastHyphen)
  const suffix = dir.slice(lastHyphen + 1)
  if (suffix === 'shared') {
    // "cms-shared" → features.cms truthy
    return !!features[prefix]
  }
  // "cms-erpnext" → features.cms === "erpnext"
  if (features[prefix] === suffix) return true
  // "multi-company" → features.multiCompany truthy
  return !!features[kebabToCamel(dir)]
}

/**
 * Discovers feature directory names from the templates map.
 * Returns them sorted for deterministic processing order.
 */
export function discoverFeatureDirs(templates: TemplateMap): string[] {
  const dirs = new Set<string>()
  const prefix = 'templates/features/'
  for (const path of Object.keys(templates)) {
    if (path.startsWith(prefix)) {
      const rest = path.slice(prefix.length)
      const dir = rest.split('/')[0]
      if (dir) dirs.add(dir)
    }
  }
  return [...dirs].sort()
}

export function generateProject(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  processTemplatesFromPrefix(vfs, templates, 'templates/core', '', config)

  const featureDirs = discoverFeatureDirs(templates)
  for (const dir of featureDirs) {
    if (shouldProcessFeature(dir, config.features)) {
      processTemplatesFromPrefix(vfs, templates, `templates/features/${dir}`, '', config)
    }
  }
  runPostProcessors(vfs, config)
}
