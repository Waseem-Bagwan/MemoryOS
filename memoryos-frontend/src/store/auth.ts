import { create } from "zustand";
import type { User } from "../types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Load persisted auth from localStorage
const storedToken = localStorage.getItem("memoryos_token");
const storedUser = localStorage.getItem("memoryos_user");

export const useAuthStore = create<AuthStore>((set) => ({
  token: storedToken,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,

  login: (user, token) => {
    localStorage.setItem("memoryos_token", token);
    localStorage.setItem("memoryos_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("memoryos_token");
    localStorage.removeItem("memoryos_user");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));