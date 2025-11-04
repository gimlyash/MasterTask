import axios from "axios";

const API_URL = 'http://localhost:8000';

export interface User {
  user_id: number;
  email: string;
  created_at: string;
  last_login: string | null;
  preferences: Record<string, unknown> | null;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  preferences?: Record<string, unknown>;
}

export async function createUser(data: CreateUserData): Promise<User> {
  const { data: res } = await axios.post(`${API_URL}/users/`, data);
  return res;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await axios.get(`${API_URL}/users/`);
  return data;
}

export async function getUser(userId: number): Promise<User> {
  const { data } = await axios.get(`${API_URL}/users/${userId}`);
  return data;
}

export async function updatePreferences(userId: number, preferences: Record<string, unknown>): Promise<User> {
  const { data } = await axios.put(`${API_URL}/users/${userId}/preferences`, { preferences });
  return data;
}

export async function getPreferences(userId: number): Promise<{ preferences: Record<string, unknown> }> {
  const { data } = await axios.get(`${API_URL}/users/${userId}/preferences`);
  return data;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function loginUser(data: LoginData): Promise<User> {
  const { data: res } = await axios.post(`${API_URL}/users/login`, data);
  return res;
}

