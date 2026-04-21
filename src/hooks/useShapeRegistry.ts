import { useState, useEffect } from 'react'
import type { ShapeDefinition, CustomShapeRecord } from '@/shapes/types'
import { BUILTIN_SHAPES } from '@/shapes/registry'
import { getAllCustomShapes, saveCustomShape, deleteCustomShape } from '@/db/customShapes'
import { customShapeRecordToDefinition } from '@/shapes/customShapeAdapter'
import { migrateLegacyRecord } from '@/shapes/svgNormalize'
import { log } from '@/lib/logger'

export function useShapeRegistry() {
  const [customRecords, setCustomRecords] = useState<CustomShapeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllCustomShapes()
      .then((records) => {
        const migrated = records.map(migrateLegacyRecord)
        log.ui.info('custom shapes loaded', { count: migrated.length })
        setCustomRecords(migrated)
        // Persist any records that were migrated from legacy format
        const legacy = records.filter((r, i) => r !== migrated[i])
        if (legacy.length > 0) {
          Promise.all(migrated.filter((_, i) => records[i] !== migrated[i]).map(saveCustomShape))
            .then(() => log.ui.info('migrated legacy custom shapes', { count: legacy.length }))
            .catch((err) => log.ui.error('failed to persist migrated shapes', err))
        }
      })
      .catch((err) => log.ui.error('failed to load custom shapes', err))
      .finally(() => setLoading(false))
  }, [])

  const allShapes: ShapeDefinition[] = [
    ...BUILTIN_SHAPES,
    ...customRecords.map(customShapeRecordToDefinition),
  ]

  async function addCustomShape(name: string, svgContent: string, viewBox: string): Promise<CustomShapeRecord> {
    const record: CustomShapeRecord = {
      id: `custom-${Date.now()}`,
      name,
      svgContent,
      viewBox,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveCustomShape(record)
    setCustomRecords((prev) => [...prev, record])
    log.ui.info('custom shape added', { id: record.id, name: record.name })
    return record
  }

  async function updateCustomShape(id: string, updates: Partial<Pick<CustomShapeRecord, 'name' | 'svgContent' | 'viewBox'>>) {
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
