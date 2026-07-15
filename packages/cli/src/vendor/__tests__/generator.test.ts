// packages/cli/src/vendor/__tests__/generator.test.ts
import { describe, it, expect } from 'vitest'
import { shouldProcessFeature } from '../generator'

describe('shouldProcessFeature', () => {
  it('simple feature present', () => {
    expect(shouldProcessFeature('auth', { auth: true })).toBe(true)
  })

  it('simple feature absent', () => {
    expect(shouldProcessFeature('auth', {})).toBe(false)
  })

  it('simple feature false', () => {
    expect(shouldProcessFeature('auth', { auth: false })).toBe(false)
  })

  it('shared sub-feature with parent present', () => {
    expect(shouldProcessFeature('cms-shared', { cms: 'erpnext' })).toBe(true)
  })

  it('shared sub-feature without parent', () => {
    expect(shouldProcessFeature('cms-shared', {})).toBe(false)
  })

  it('specific sub-feature matches value', () => {
    expect(shouldProcessFeature('cms-erpnext', { cms: 'erpnext' })).toBe(true)
  })

  it('specific sub-feature does not match different value', () => {
    expect(shouldProcessFeature('cms-erpnext', { cms: 'sveltia' })).toBe(false)
  })

  it('specific sub-feature without parent', () => {
    expect(shouldProcessFeature('cms-erpnext', {})).toBe(false)
  })

  it('multi-word feature via camelCase', () => {
    expect(shouldProcessFeature('multi-company', { multiCompany: true })).toBe(true)
  })
})
