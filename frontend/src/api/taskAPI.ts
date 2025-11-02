import axios from "axios";
import type { Task, CreateTaskData, UpdateTaskData } from "../types/task";

export type { Task };

const API_URL = 'http://localhost:8000'

export async function getTasks(userId: number = 1): Promise<Task[]> {
  const res = await axios.get(`${API_URL}/tasks/`, {
    params: { user_id: userId }
  });
  return res.data;
}

export async function createTask(data: CreateTaskData, userId: number = 1): Promise<Task> {
  const payload: {
    title: string;
    description: string | null;
    priority: string | null;
    deadline?: string;
    is_repeating: boolean;
    repeat_interval?: string;
    is_favorite: boolean;
  } = {
    title: data.title,
    description: data.description ?? null,
    priority: data.priority ?? null,
    is_repeating: data.is_repeating ?? false,
    is_favorite: data.is_favorite ?? false,
  };

  // Добавляем deadline если он есть
  if (data.deadline) {
    payload.deadline = data.deadline;
  }

  // Добавляем repeat_interval если есть
  if (data.repeat_interval) {
    payload.repeat_interval = data.repeat_interval;
  }

  const { data: res } = await axios.post(`${API_URL}/tasks/`, payload, {
    params: { user_id: userId }
  });
  return res;
}

export async function updateTask(taskId: number, updates: UpdateTaskData, userId: number = 1): Promise<Task> {
    const res = await axios.put(`${API_URL}/tasks/${taskId}`, updates, {
      params: { user_id: userId }
    });
    return res.data;
}

export async function deleteTask(taskId: number, userId: number = 1): Promise<void> {
    await axios.delete(`${API_URL}/tasks/${taskId}`, {
      params: { user_id: userId }
    });
}
