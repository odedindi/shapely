import { describe, it, expect } from 'vitest'
import { normalizeSvgContent, migrateLegacyRecord } from '@/shapes/svgNormalize'
import type { CustomShapeRecord } from '@/shapes/types'

function makeRecord(overrides: Partial<CustomShapeRecord> = {}): CustomShapeRecord {
  return {
    id: 'test-1',
    name: 'test',
    svgContent: '<circle cx="50" cy="50" r="40" fill="currentColor"/>',
    viewBox: '0 0 100 100',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('normalizeSvgContent', () => {
  it('returns body as-is with fallback viewBox when input has no <svg> wrapper', () => {
    const body = '<circle cx="50" cy="50" r="40"/>'
    const result = normalizeSvgContent(body)
    expect(result.body).toBe(body)
    expect(result.viewBox).toBe('0 0 100 100')
  })

  it('extracts viewBox and inner body from a full <svg> wrapper', () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'
    const result = normalizeSvgContent(raw)
    expect(result.viewBox).toBe('0 0 24 24')
    expect(result.body).toContain('<path')
    expect(result.body).not.toContain('<svg')
  })

  it('falls back to "0 0 100 100" when <svg> has no viewBox attribute', () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'
    const result = normalizeSvgContent(raw)
    expect(result.viewBox).toBe('0 0 100 100')
    expect(result.body).toContain('<circle')
  })

  it('returns raw string with fallback viewBox on parse error', () => {
    const bad = '<svg><unclosed'
    const result = normalizeSvgContent(bad)
    expect(result.viewBox).toBe('0 0 100 100')
  })

  it('handles whitespace-padded input correctly', () => {
    const body = '   <rect x="0" y="0" width="100" height="100"/>   '
    const result = normalizeSvgContent(body)
    expect(result.viewBox).toBe('0 0 100 100')
    expect(result.body.trim()).toBe('<rect x="0" y="0" width="100" height="100"/>')
  })
})

describe('migrateLegacyRecord', () => {
  it('returns the record unchanged if already canonical (has viewBox, body is not wrapped)', () => {
    const record = makeRecord()
    const result = migrateLegacyRecord(record)
    expect(result).toBe(record)
  })

  it('migrates a legacy record that has a full <svg> wrapper in svgContent', () => {
    const record = makeRecord({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>',
      viewBox: '',
    })
    const result = migrateLegacyRecord(record)
    expect(result.viewBox).toBe('0 0 24 24')
    expect(result.svgContent).not.toContain('<svg')
    expect(result.svgContent).toContain('<path')
  })

  it('migrates a legacy record that has no viewBox field', () => {
    const record = makeRecord({
      svgContent: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
      viewBox: '',
    })
    const result = migrateLegacyRecord(record)
    expect(result.viewBox).toBe('0 0 100 100')
    expect(result.svgContent).not.toContain('<svg')
  })

  it('preserves other record fields during migration', () => {
    const record = makeRecord({
      id: 'preserve-me',
      name: 'my-shape',
      svgContent: '<svg viewBox="0 0 50 50"><rect width="50" height="50"/></svg>',
      viewBox: '',
      createdAt: 12345,
      updatedAt: 67890,
    })
    const result = migrateLegacyRecord(record)
    expect(result.id).toBe('preserve-me')
    expect(result.name).toBe('my-shape')
    expect(result.createdAt).toBe(12345)
    expect(result.updatedAt).toBe(67890)
  })

  it('does not re-migrate an already-migrated record', () => {
    const record = makeRecord({
      svgContent: '<circle cx="50" cy="50" r="40"/>',
      viewBox: '0 0 100 100',
    })
    const result = migrateLegacyRecord(record)
    expect(result).toBe(record)
  })
})
