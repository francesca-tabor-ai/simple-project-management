'use client'

import { useState } from 'react'
import { createTask } from '@/app/actions/tasks'
import { useRouter } from 'next/navigation'

export default function NewTaskForm() {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await createTask(title)
      setTitle('')
      // Refresh the page to show the new task
      router.refresh()
    } catch (error) {
      console.error('Failed to create task:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        disabled={isSubmitting}
        className="flex-1 px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="px-7 py-3 bg-primary text-white font-medium rounded-[14px] hover:bg-primary-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isSubmitting ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  )
}
