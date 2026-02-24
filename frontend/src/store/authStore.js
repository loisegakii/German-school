import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH STORE
// Holds the currently logged-in user and their role.
// When the backend is ready, replace the demo login logic in Login.jsx
// with a real API call, then call login() with the response data.
// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = create((set) => ({
  user:            null,
  isAuthenticated: false,

  // Call this after a successful login
  // user shape: { id, name, email, role: 'student' | 'instructor' | 'admin', level }
  login: (userData) => set({
    user:            userData,
    isAuthenticated: true,
  }),

  // Call this on logout
  logout: () => set({
    user:            null,
    isAuthenticated: false,
  }),
}))