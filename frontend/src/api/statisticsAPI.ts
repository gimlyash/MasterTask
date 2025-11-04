import axios from "axios";

const API_URL = 'http://localhost:8000'

export interface AnalyticsStats {
  user_id: number;
  total_actions: number;
  by_action: {
    created?: number;
    completed?: number;
    updated?: number;
  };
}

export interface CompletedTaskStats {
  date: string;
  count: number;
}

export async function getAnalyticsStats(userId: number): Promise<AnalyticsStats> {
  const res = await axios.get(`${API_URL}/analytics-logs/stats/${userId}`);
  return res.data;
}

