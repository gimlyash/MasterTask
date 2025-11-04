import { Priority, TaskStatus } from "./enums";
import type { Tag } from "../api/tagsAPI";

export interface TaskTag {
  tag_id: number;
  name: string;
}

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
  reminder_time?: string | null;
  timer_duration?: string | null;
  tags?: TaskTag[] | Tag[];
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  is_repeating?: boolean;
  repeat_interval?: string;
  is_favorite?: boolean;
  reminder_time?: string;
  timer_duration?: string;
  tagNames?: string[];
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