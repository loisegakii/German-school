import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PlacementTest from './pages/PlacementTest'
import StudentDashboard from './pages/student/Dashboard'
import LessonPage from './pages/student/LessonPage'
import InstructorDashboard from './pages/instructor/Dashboard'
import AdminPanel from './pages/admin/AdminPanel'
import TestBuilder from './pages/instructor/TestBuilder'
import VideoUpload from './pages/instructor/VideoUpload'
import StudentProfile from './pages/student/StudentProfile'
import PricingPage from './pages/PricingPage'
import CoursesPage from './pages/student/CoursesPage'
import CertificatesPage from './pages/student/CertificatesPage'
import CourseEditor from './pages/instructor/CourseEditor'
import ProgressPage from './pages/student/ProgressPage'

// ─── Replace this with your real Client ID from Google Cloud Console ──────────
// https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID
// Authorized JavaScript origins: http://localhost:5173 (dev) + your production domain
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/"                                  element={<LandingPage />} />
          <Route path="/login"                             element={<Login />} />
          <Route path="/register"                          element={<Register />} />
          <Route path="/placement-test"                    element={<PlacementTest />} />
          <Route path="/student/dashboard"                 element={<StudentDashboard />} />
          <Route path="/student/lesson/:courseId/:lessonId" element={<LessonPage />} />
          <Route path="/student/courses"                   element={<CoursesPage />} />
          <Route path="/student/certificates"              element={<CertificatesPage />} />
          <Route path="/student/profile"                   element={<StudentProfile />} />
          <Route path="/student/progress"                  element={<ProgressPage />} />
          <Route path="/instructor/dashboard"              element={<InstructorDashboard />} />
          <Route path="/instructor/test-builder"           element={<TestBuilder />} />
          <Route path="/instructor/video-upload"           element={<VideoUpload />} />
          <Route path="/instructor/courses/new"            element={<CourseEditor />} />
          <Route path="/instructor/courses/:courseId/edit" element={<CourseEditor />} />
          <Route path="/admin/dashboard"                   element={<AdminPanel />} />
          <Route path="/pricing"                           element={<PricingPage />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App