// packages/cli/src/vendor/flag-parser.ts

const INFRA_FLAGS = new Set([
  'template',
  'yes', 'y',
  'packageManager', 'package-manager',
  'git', 'noGit', 'no-git',
  'install',
  'dryRun', 'dry-run',
  'runtime',
])

/**
 * Extracts feature flags from CLI argv.
 * Skips known infra flags. Everything else becomes a feature:
 *   --flag        → { flag: true }
 *   --flag value   → { flag: "value" }
 *   --kebab-flag   → { kebabFlag: "value" }  (camelCase conversion)
 */
export function parseFlags(argv: string[]): Record<string, string | boolean> {
  const features: Record<string, string | boolean> = {}
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (!arg.startsWith('--')) { i++; continue }
    const raw = arg.slice(2)
    const key = raw.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (INFRA_FLAGS.has(key) || INFRA_FLAGS.has(raw)) { i++; continue }
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      features[key] = next
      i += 2
    } else {
      features[key] = true
      i++
    }
  }
  return features
}
