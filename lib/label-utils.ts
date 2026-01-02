import { type Label } from './task-types'

// Color palette for labels (accessible, distinct colors)
export const LABEL_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
  '#EAB308', // yellow
  '#22C55E', // green
]

/**
 * Normalize label name (trim, collapse whitespace, lowercase for comparison)
 */
export function normalizeLabelName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Check if two labels are equal (case-insensitive name comparison)
 */
export function equalsLabel(a: Label | string, b: Label | string): boolean {
  const nameA = typeof a === 'string' ? a : a.name
  const nameB = typeof b === 'string' ? b : b.name
  return nameA.toLowerCase() === nameB.toLowerCase()
}

/**
 * Simple string hash function for deterministic color selection
 */
function hashString(str: string): number {
  let hash = 0
  const normalized = str.toLowerCase()
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get deterministic color for a label name
 * Same name always gets same color
 */
export function getColorForLabel(name: string): string {
  const hash = hashString(name)
  return LABEL_COLORS[hash % LABEL_COLORS.length]
}

/**
 * Create a new label with deterministic color if none provided
 */
export function makeLabel(name: string, color?: string): Label {
  const normalized = normalizeLabelName(name)
  return {
    id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: normalized,
    color: color || getColorForLabel(normalized),
  }
}

/**
 * Calculate if text should be dark or light based on background color
 * Returns true if dark text should be used, false for light text
 */
export function shouldUseDarkText(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate relative luminance (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Use dark text if background is light (luminance > 0.5)
  return luminance > 0.5
}

/**
 * Get all unique labels from a list of tasks
 */
export function getAllLabels(tasks: { labels: Label[] }[]): Label[] {
  const labelMap = new Map<string, Label>()
  
  for (const task of tasks) {
    for (const label of task.labels) {
      const key = label.name.toLowerCase()
      if (!labelMap.has(key)) {
        labelMap.set(key, label)
      }
    }
  }
  
  return Array.from(labelMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  )
}

/**
 * Migrate legacy string labels to Label objects
 * Used for backward compatibility
 */
export function migrateLegacyLabels(labels: unknown): Label[] {
  if (!Array.isArray(labels)) return []
  
  return labels.map((label) => {
    // Already a Label object
    if (typeof label === 'object' && label !== null && 'id' in label && 'name' in label && 'color' in label) {
      return label as Label
    }
    
    // Legacy string label - convert to Label object
    if (typeof label === 'string') {
      return makeLabel(label)
    }
    
    return makeLabel('Unknown')
  })
}

