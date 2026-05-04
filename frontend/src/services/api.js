import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.expired) {
      // Token expired, redirect to login
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
}

export const departmentService = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`)
}

export const programmeService = {
  getAll: () => api.get('/programmes'),
  getById: (id) => api.get(`/programmes/${id}`),
  create: (data) => api.post('/programmes', data),
  update: (id, data) => api.put(`/programmes/${id}`, data),
  clone: (id) => api.post(`/programmes/${id}/clone`),
  delete: (id) => api.delete(`/programmes/${id}`)
}

export const moduleService = {
  getAll: () => api.get('/modules'),
  getById: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`)
}

export const facultyService = {
  getAll: () => api.get('/faculty'),
  getById: (id) => api.get(`/faculty/${id}`),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  addAvailability: (id, data) => api.post(`/faculty/${id}/availability`, data),
  addLeave: (id, data) => api.post(`/faculty/${id}/leave`, data),
  delete: (id) => api.delete(`/faculty/${id}`)
}

export const roomService = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`)
}

export const sessionService = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`)
}

export const programmeModuleService = {
  getByProgramme: (programmeId) => api.get(`/programme-modules/programme/${programmeId}`),
  add: (data) => api.post('/programme-modules', data),
  update: (id, data) => api.put(`/programme-modules/${id}`, data),
  delete: (id) => api.delete(`/programme-modules/${id}`)
}

export const facultyModuleService = {
  getByModule: (moduleId) => api.get(`/faculty-modules/module/${moduleId}`),
  getByFaculty: (facultyId) => api.get(`/faculty-modules/faculty/${facultyId}`),
  assign: (data) => api.post('/faculty-modules', data),
  update: (id, data) => api.put(`/faculty-modules/${id}`, data),
  remove: (id) => api.delete(`/faculty-modules/${id}`)
}

export const conflictService = {
  getAll: (params) => api.get('/conflicts', { params }),
  resolve: (id, data) => api.put(`/conflicts/${id}/resolve`, data)
}

export const reportService = {
  getFacultyReport: (facultyId, params) => api.get(`/reports/faculty/${facultyId}`, { params }),
  getProgrammeReport: (programmeId, params) => api.get(`/reports/programme/${programmeId}`, { params }),
  getModuleReport: (moduleId, params) => api.get(`/reports/module/${moduleId}`, { params }),
  getRoomUtilization: (roomId, params) => api.get(`/reports/room/utilization/${roomId}`, { params })
}

export const auditService = {
  getAll: (params) => api.get('/audit', { params })
}

export default api
