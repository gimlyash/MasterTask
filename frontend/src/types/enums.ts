/**
 * Enum для приоритета задачи
 */
export const Priority = {
  high: "high",
  medium: "medium",
  low: "low"
} as const

export type Priority = typeof Priority[keyof typeof Priority]

/**
 * Enum для статуса задачи
 */
export const TaskStatus = {
  active: "active",
  in_progress: "in_progress",
  completed: "completed",
  overdue: "overdue"
} as const

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus]

/**
 * Enum для типа уведомления
 */
export const NotificationType = {
  overdue: "overdue",
  reminder: "reminder"
} as const

export type NotificationType = typeof NotificationType[keyof typeof NotificationType]

/**
 * Enum для действий в аналитике
 */
export const AnalyticsAction = {
  created: "created",
  completed: "completed",
  updated: "updated"
} as const

export type AnalyticsAction = typeof AnalyticsAction[keyof typeof AnalyticsAction]

