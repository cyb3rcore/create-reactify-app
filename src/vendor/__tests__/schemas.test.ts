// packages/cli/src/vendor/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { ProjectConfigSchema } from '../schemas'

describe('ProjectConfigSchema', () => {
  it('accepts valid config with features', () => {
    const result = ProjectConfigSchema.safeParse({
      projectName: 'my-app',
      projectDir: '/tmp/my-app',
      template: 'salam',
      runtime: 'bun',
      packageManager: 'bun',
      git: true,
      install: false,
      features: { auth: true, cms: 'erpnext' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty features', () => {
    const result = ProjectConfigSchema.safeParse({
      projectName: 'my-app',
      projectDir: '/tmp/my-app',
      template: 'lamsa',
      runtime: 'bun',
      packageManager: 'bun',
      git: true,
      install: false,
      features: {},
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing projectName', () => {
    const result = ProjectConfigSchema.safeParse({
      projectDir: '/tmp/my-app',
      template: 'lamsa',
      runtime: 'bun',
      packageManager: 'bun',
      git: true,
      install: false,
      features: {},
    })
    expect(result.success).toBe(false)
  })
})
