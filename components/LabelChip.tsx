'use client'

import { type Label } from '@/lib/task-types'
import { shouldUseDarkText } from '@/lib/label-utils'

interface LabelChipProps {
  label: Label
  size?: 'sm' | 'md'
  onRemove?: () => void
  onClick?: () => void
  className?: string
}

export default function LabelChip({
  label,
  size = 'sm',
  onRemove,
  onClick,
  className = '',
}: LabelChipProps) {
  const useDarkText = shouldUseDarkText(label.color)
  const textColor = useDarkText ? '#000000' : '#FFFFFF'
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      style={{
        backgroundColor: label.color,
        color: textColor,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <span>{label.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove label ${label.name}`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  )
}

