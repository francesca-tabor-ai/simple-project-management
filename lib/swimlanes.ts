import { type Task } from '@/lib/task-types'

export type GroupBy = 'none' | 'assignee' | 'priority' | 'label'

export interface Lane {
  laneId: string
  laneTitle: string
  tasks: Task[]
}

/**
 * Builds lanes based on the grouping mode
 * For labels: tasks with multiple labels will appear in multiple lanes (intentional duplication)
 */
export function buildLanes(tasks: Task[], groupBy: GroupBy): Lane[] {
  switch (groupBy) {
    case 'none':
      return [{ laneId: 'all', laneTitle: 'All Tasks', tasks }]

    case 'assignee':
      return buildAssigneeLanes(tasks)

    case 'priority':
      return buildPriorityLanes(tasks)

    case 'label':
      return buildLabelLanes(tasks)

    default:
      return [{ laneId: 'all', laneTitle: 'All Tasks', tasks }]
  }
}

function buildAssigneeLanes(tasks: Task[]): Lane[] {
  const lanes = new Map<string, Lane>()

  // Separate unassigned tasks
  const unassignedTasks: Task[] = []

  tasks.forEach(task => {
    if (!task.assignee) {
      unassignedTasks.push(task)
    } else {
      const assigneeId = task.assignee.id
      const assigneeName = task.assignee.name

      if (!lanes.has(assigneeId)) {
        lanes.set(assigneeId, {
          laneId: `assignee-${assigneeId}`,
          laneTitle: assigneeName,
          tasks: [],
        })
      }
      lanes.get(assigneeId)!.tasks.push(task)
    }
  })

  // Sort lanes by assignee name
  const sortedLanes = Array.from(lanes.values()).sort((a, b) =>
    a.laneTitle.localeCompare(b.laneTitle)
  )

  // Add unassigned lane at the end if it has tasks
  if (unassignedTasks.length > 0) {
    sortedLanes.push({
      laneId: 'unassigned',
      laneTitle: 'Unassigned',
      tasks: unassignedTasks,
    })
  }

  return sortedLanes
}

function buildPriorityLanes(tasks: Task[]): Lane[] {
  const priorityOrder: Task['priority'][] = ['urgent', 'high', 'medium', 'low']
  const priorityLabels: Record<Task['priority'], string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  const lanes: Lane[] = []

  priorityOrder.forEach(priority => {
    const tasksInPriority = tasks.filter(task => task.priority === priority)
    
    // Only include lanes that have tasks
    if (tasksInPriority.length > 0) {
      lanes.push({
        laneId: `priority-${priority}`,
        laneTitle: priorityLabels[priority],
        tasks: tasksInPriority,
      })
    }
  })

  return lanes
}

function buildLabelLanes(tasks: Task[]): Lane[] {
  const labelMap = new Map<string, Set<Task>>()
  const unlabeledTasks: Task[] = []

  // Collect all unique labels (case-insensitive) and their tasks
  tasks.forEach(task => {
    if (task.labels.length === 0) {
      unlabeledTasks.push(task)
    } else {
      // Task appears in each of its label lanes
      task.labels.forEach(label => {
        const labelKey = label.name.toLowerCase()
        if (!labelMap.has(labelKey)) {
          labelMap.set(labelKey, new Set())
        }
        labelMap.get(labelKey)!.add(task)
      })
    }
  })

  // Convert to lanes and sort alphabetically
  const lanes: Lane[] = Array.from(labelMap.entries())
    .map(([labelKey, taskSet]) => {
      // Find the original-cased label name from the first task
      const originalLabel = Array.from(taskSet)[0].labels.find(
        l => l.name.toLowerCase() === labelKey
      )?.name || labelKey

      return {
        laneId: `label-${labelKey}`,
        laneTitle: originalLabel,
        tasks: Array.from(taskSet),
      }
    })
    .sort((a, b) => a.laneTitle.localeCompare(b.laneTitle))

  // Add "No label" lane at the end if there are unlabeled tasks
  if (unlabeledTasks.length > 0) {
    lanes.push({
      laneId: 'no-label',
      laneTitle: 'No Label',
      tasks: unlabeledTasks,
    })
  }

  return lanes
}

export const GROUP_BY_LABELS: Record<GroupBy, string> = {
  none: 'None',
  assignee: 'Assignee',
  priority: 'Priority',
  label: 'Label',
}

