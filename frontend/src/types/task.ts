import { Priority, TaskStatus } from "./enums";

export interface Task {
  task_id: number;
  user_id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  priority: Priority | null;
  deadline: string | null;
  is_repeating: boolean;
  repeat_interval: string | null;
  status: TaskStatus | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  is_repeating?: boolean;
  repeat_interval?: string;
  is_favorite?: boolean;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  category_id?: number | null;
  priority?: Priority | null;
  deadline?: string | null;
  is_repeating?: boolean;
  repeat_interval?: string | null;
  status?: TaskStatus | null;
  is_favorite?: boolean;
}

