import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTE
// Wraps any page that requires login.
//
// Usage:
//   <Route path="/student/dashboard" element={
//     <ProtectedRoute allowedRoles={['student']}>
//       <StudentDashboard />
//     </ProtectedRoute>
//   } />
//
// What it does:
//   1. Not logged in            → redirect to /login
//   2. Logged in, wrong role    → redirect to their own dashboard
//   3. Logged in, correct role  → render the page normally
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_HOME = {
  student:    '/student/dashboard',
  instructor: '/instructor/dashboard',
  admin:      '/admin/dashboard',
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  // 1. Not logged in at all → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 2. Logged in but wrong role → go to their own home
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROLE_HOME[user?.role] ?? '/login'} replace />
  }

  // 3. All good → render the page
  return children
}