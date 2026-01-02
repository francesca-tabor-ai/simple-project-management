'use client'

import { useState, useRef, useEffect } from 'react'
import { type Task, STATUS_LABELS } from '@/lib/task-types'
import { setTaskStatus } from '@/app/actions/tasks'

interface StatusMenuProps {
  taskId: string
  currentStatus: Task['status']
  onStatusChange?: () => void
}

const statusStyles: Record<Task['status'], string> = {
  pending: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  in_progress: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  done: 'bg-green-100 text-green-700 hover:bg-green-200',
}

export default function StatusMenu({ taskId, currentStatus, onStatusChange }: StatusMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (newStatus === currentStatus) {
      setIsOpen(false)
      return
    }

    setIsChanging(true)
    try {
      await setTaskStatus(taskId, newStatus)
      setIsOpen(false)
      onStatusChange?.()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    } finally {
      setIsChanging(false)
    }
  }

  const statuses: Task['status'][] = ['pending', 'in_progress', 'done']

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation() // Prevent opening drawer
          setIsOpen(!isOpen)
        }}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusStyles[currentStatus]}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isChanging}
      >
        {STATUS_LABELS[currentStatus]}
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-1 right-0 bg-white rounded-[12px] shadow-lg border border-gray-200 py-1 min-w-[140px] z-50"
          role="menu"
          aria-label="Change status"
        >
          {statuses.map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation()
                handleStatusChange(status)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                status === currentStatus ? 'font-semibold' : ''
              }`}
              role="menuitem"
              disabled={isChanging}
            >
              {status === currentStatus && (
                <span className="text-primary">✓</span>
              )}
              <span className={status === currentStatus ? '' : 'ml-5'}>
                {STATUS_LABELS[status]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

