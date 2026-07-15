// packages/cli/src/vendor/__tests__/flag-parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseFlags } from '../flag-parser'

describe('parseFlags', () => {
  it('parses boolean flag', () => {
    expect(parseFlags(['--auth'])).toEqual({ auth: true })
  })

  it('parses string flag', () => {
    expect(parseFlags(['--cms', 'erpnext'])).toEqual({ cms: 'erpnext' })
  })

  it('converts kebab-case to camelCase', () => {
    expect(parseFlags(['--multi-company'])).toEqual({ multiCompany: true })
  })

  it('skips infra flags', () => {
    expect(parseFlags(['--template', 'salam', '--yes'])).toEqual({})
  })

  it('skips infra flags mixed with feature flags', () => {
    expect(parseFlags(['--auth', '--template', 'salam'])).toEqual({ auth: true })
  })

  it('parses multiple feature flags', () => {
    expect(parseFlags(['--auth', '--cms', 'erpnext'])).toEqual({ auth: true, cms: 'erpnext' })
  })

  it('handles empty args', () => {
    expect(parseFlags([])).toEqual({})
  })

  it('skips --no-git infra flag', () => {
    expect(parseFlags(['--no-git'])).toEqual({})
  })

  it('skips --dry-run infra flag', () => {
    expect(parseFlags(['--dry-run'])).toEqual({})
  })

  it('ignores positional args (non-flag strings)', () => {
    expect(parseFlags(['my-app', '--auth'])).toEqual({ auth: true })
  })
})
