import axios from "axios";
import type { Task, CreateTaskData, UpdateTaskData } from "../types/task";

export type { Task };

const API_URL = 'http://localhost:8000'

export async function getTasks(): Promise<Task[]> {
  const res = await axios.get(`${API_URL}/tasks/`)
  return res.data
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const payload = {
    title: data.title,
    description: data.description ?? null,
    priority: data.priority ?? null,
    deadline: data.deadline ?? null,
    is_repeating: data.is_repeating ?? false,
    is_favorite: data.is_favorite ?? false,
  }

  const { data: res } = await axios.post(`${API_URL}/tasks/`, payload)
  return res
}

export async function updateTask(taskId: number, updates: UpdateTaskData): Promise<Task> {
    const res = await axios.put(`${API_URL}/tasks/${taskId}`, updates)
    return res.data
}

export async function deleteTask(taskId: number){
    await axios.delete(`${API_URL}/tasks/${taskId}`)
}
