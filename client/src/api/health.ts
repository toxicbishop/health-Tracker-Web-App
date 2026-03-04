import { api } from "./client";
import type { HealthLog } from "../types/health";

// Because HealthLog is a discriminated union, we accept `any` shaped body
// and let the backend validate the shape.
export const healthApi = {
  getLogs: (type?: string) => {
    const query = type ? `?type=${type}` : "";
    return api.get<HealthLog[]>(`/health-log${query}`);
  },

  addLog: (log: Record<string, unknown>) =>
    api.post<HealthLog>("/health-log", log),
};

export const authApi = {
  register: (username: string, password: string) =>
    api.post<{ message: string; userId: string }>("/auth/register", {
      username,
      password,
    }),

  login: (username: string, password: string) =>
    api.post<{ message: string; token: string; userId: string }>(
      "/auth/login",
      {
        username,
        password,
      },
    ),

  getProfile: () =>
    api.get<{
      message: string;
      user: { id: string; username: string; createdAt: string };
    }>("/auth/me"),
};
