import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT token to every request ─────────────────────────
API.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-refresh token on 401 ─────────────────────────────────
API.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post('http://127.0.0.1:8000/api/auth/token/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return API(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register : (data) => API.post('/auth/register/', data),
  login    : (data) => API.post('/auth/login/', data),
  logout   : ()     => API.post('/auth/logout/'),
  me       : ()     => API.get('/auth/me/'),
  updateMe : (data) => API.patch('/auth/me/', data),
}

// ── Courses ───────────────────────────────────────────────────
export const courseAPI = {
  list      : (params)   => API.get('/courses/', { params }),
  detail    : (id)       => API.get(`/courses/${id}/`),
  enroll    : (id)       => API.post(`/courses/${id}/enroll/`),
  myModules : (courseId) => API.get(`/courses/${courseId}/modules/`),
}

// ── Lessons ───────────────────────────────────────────────────
export const lessonAPI = {
  detail   : (id)   => API.get(`/lessons/${id}/`),
  complete : (id)   => API.post('/student/progress/', { lesson_id: id, watch_pct: 100 }),
  progress : (data) => API.post('/student/progress/', data),
}

// ── Tests ─────────────────────────────────────────────────────
export const testAPI = {
  detail : (id)   => API.get(`/tests/${id}/`),
  submit : (data) => API.post('/tests/submit/', data),
}

// ── Student ───────────────────────────────────────────────────
export const studentAPI = {
  dashboard    : ()     => API.get('/student/dashboard/'),
  certificates : ()     => API.get('/student/certificates/'),
  placementSave: (data) => API.patch('/auth/me/', { level: data.level }),
}

// ── Instructor ────────────────────────────────────────────────
export const instructorAPI = {
  // Dashboard & students
  dashboard      : ()               => API.get('/instructor/dashboard/'),
  students       : ()               => API.get('/instructor/students/'),
  pendingGrading : ()               => API.get('/instructor/grading/'),
  grade          : (id, data)       => API.patch(`/instructor/grading/${id}/`, data),
  weakAreas      : ()               => API.get('/instructor/weak-areas/'),

  // Course management
  courses        : ()               => API.get('/instructor/courses/'),
  createCourse   : (data)           => API.post('/instructor/courses/', data),
  getCourse      : (id)             => API.get(`/instructor/courses/${id}/`),
  updateCourse   : (id, data)       => API.patch(`/instructor/courses/${id}/`, data),
  deleteCourse   : (id)             => API.delete(`/instructor/courses/${id}/`),
  submitCourse   : (id)             => API.post(`/instructor/courses/${id}/submit/`),

  // Module management
  getModules     : (courseId)       => API.get(`/instructor/courses/${courseId}/modules/`),
  addModule      : (courseId, data) => API.post(`/instructor/courses/${courseId}/modules/`, data),
  updateModule   : (id, data)       => API.patch(`/instructor/modules/${id}/`, data),
  deleteModule   : (id)             => API.delete(`/instructor/modules/${id}/`),

  // Lesson management
  addLesson      : (moduleId, data) => API.post(`/instructor/modules/${moduleId}/lessons/`, data),
  updateLesson   : (id, data)       => API.patch(`/instructor/lessons/${id}/`, data),
  deleteLesson   : (id)             => API.delete(`/instructor/lessons/${id}/`),

  // Video upload (multipart)
  uploadVideo    : (data)           => API.post('/instructor/upload/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  // Stats
  stats             : ()           => API.get('/admin/stats/'),

  // Users
  users             : (role)       => API.get('/admin/users/', { params: role ? { role } : {} }),
  createUser        : (data)       => API.post('/admin/users/', data),
  updateUser        : (id, data)   => API.patch(`/admin/users/${id}/`, data),
  deleteUser        : (id)         => API.delete(`/admin/users/${id}/`),
  suspendUser       : (id)         => API.post(`/admin/users/${id}/suspend/`),

  // Courses
  courses           : ()           => API.get('/admin/courses/'),
  reviewCourse      : (id, action) => API.post(`/admin/courses/${id}/review/`, { action }),

  // Certificates
  certificates      : (status)     => API.get('/admin/certificates/', { params: status ? { status } : {} }),
  issueCertificate  : (id)         => API.post(`/admin/certificates/${id}/issue/`),
  revokeCertificate : (id, reason) => API.post(`/admin/certificates/${id}/revoke/`, { reason }),

  // Announcements
  sendAnnouncement  : (data)       => API.post('/admin/announcements/', data),
}

export const setTokens = (access, refresh) => {
  localStorage.setItem('access_token',  access)
  localStorage.setItem('refresh_token', refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export default API