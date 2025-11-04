import axios from "axios";

const API_URL = 'http://localhost:8000';

export interface Tag {
  tag_id: number;
  name: string;
  created_at: string;
}

export interface TaskTag {
  task_id: number;
  tag_id: number;
}

export async function getTags(): Promise<Tag[]> {
  const { data } = await axios.get(`${API_URL}/tags/`);
  return data;
}

export async function getTag(tagId: number): Promise<Tag> {
  const { data } = await axios.get(`${API_URL}/tags/${tagId}`);
  return data;
}

export async function createTag(name: string): Promise<Tag> {
  const { data } = await axios.post(`${API_URL}/tags/`, { name: name.trim().toLowerCase() });
  return data;
}

export async function getTaskTags(taskId: number): Promise<TaskTag[]> {
  const { data } = await axios.get(`${API_URL}/task-tags/`, {
    params: { task_id: taskId }
  });
  return data;
}

export async function addTagToTask(taskId: number, tagId: number): Promise<TaskTag> {
  const { data } = await axios.post(`${API_URL}/task-tags/`, {
    task_id: taskId,
    tag_id: tagId
  });
  return data;
}

export async function removeTagFromTask(taskId: number, tagId: number): Promise<void> {
  await axios.delete(`${API_URL}/task-tags/${taskId}/${tagId}`);
}

