'use client'

import { LABEL_COLORS } from '@/lib/label-utils'

interface ColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export default function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-7 gap-2 p-2">
      {LABEL_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelectColor(color)}
          className={`w-8 h-8 rounded-full transition-all ${
            selectedColor === color
              ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          title={color}
        />
      ))}
    </div>
  )
}

