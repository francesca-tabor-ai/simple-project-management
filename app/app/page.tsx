import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import KanbanBoard from '@/components/KanbanBoard'
import NewTaskForm from '@/components/NewTaskForm'
import { ToastProvider } from '@/components/ToastContainer'
import { getTasks } from '@/app/actions/tasks'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const tasks = await getTasks()

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto py-5 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-[12px] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              T
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Add Task Section */}
        <div className="bg-card rounded-[20px] shadow-sm border border-gray-200/50 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h2>
          <NewTaskForm />
        </div>
        
        {/* Kanban Board */}
        <KanbanBoard initialTasks={tasks} />
      </main>
    </div>
    </ToastProvider>
  )
}
