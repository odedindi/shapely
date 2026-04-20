import { useState, useEffect } from 'react'
import type { ShapeDefinition, CustomShapeRecord } from '@/shapes/types'
import { BUILTIN_SHAPES } from '@/shapes/registry'
import { getAllCustomShapes, saveCustomShape, deleteCustomShape } from '@/db/customShapes'
import { customShapeRecordToDefinition } from '@/shapes/customShapeAdapter'
import { log } from '@/lib/logger'

export function useShapeRegistry() {
  const [customRecords, setCustomRecords] = useState<CustomShapeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllCustomShapes()
      .then((records) => {
        log.ui.info('custom shapes loaded', { count: records.length })
        setCustomRecords(records)
      })
      .catch((err) => log.ui.error('failed to load custom shapes', err))
      .finally(() => setLoading(false))
  }, [])

  const allShapes: ShapeDefinition[] = [
    ...BUILTIN_SHAPES,
    ...customRecords.map(customShapeRecordToDefinition),
  ]

  async function addCustomShape(name: string, svgContent: string): Promise<CustomShapeRecord> {
    const record: CustomShapeRecord = {
      id: `custom-${Date.now()}`,
      name,
      svgContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveCustomShape(record)
    setCustomRecords((prev) => [...prev, record])
    log.ui.info('custom shape added', { id: record.id, name: record.name })
    return record
  }

  async function updateCustomShape(id: string, updates: Partial<Pick<CustomShapeRecord, 'name' | 'svgContent'>>) {
    const existing = customRecords.find((r) => r.id === id)
    if (!existing) {
      log.ui.warn('updateCustomShape: record not found', { id })
      return
    }
    const updated = { ...existing, ...updates, updatedAt: Date.now() }
    await saveCustomShape(updated)
    setCustomRecords((prev) => prev.map((r) => (r.id === id ? updated : r)))
    log.ui.info('custom shape updated', { id, fields: Object.keys(updates) })
  }

  async function removeCustomShape(id: string) {
    await deleteCustomShape(id)
    setCustomRecords((prev) => prev.filter((r) => r.id !== id))
    log.ui.info('custom shape removed', { id })
  }

  return { allShapes, customRecords, loading, addCustomShape, updateCustomShape, removeCustomShape }
}
