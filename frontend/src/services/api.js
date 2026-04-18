import axios from 'axios';
import toast from 'react-hot-toast';

/* eslint-disable no-undef */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
});

const notifyAuthInvalidated = () => {
  try {
    window.dispatchEvent(new Event('auth:invalidated'));
  } catch {
    // ignore non-browser environments
  }
};

// Lightweight in-memory request cache + in-flight dedupe.
// Goal: avoid request storms from rapid UI changes / repeated mounts.
const __cache = new Map(); // key -> { expiresAt:number, value:any }
const __inflight = new Map(); // key -> Promise

const now = () => Date.now();

const stableKey = (method, url, config) => {
  const params = config?.params ? JSON.stringify(config.params) : '';
  return `${method.toUpperCase()} ${url} ${params}`;
};

const readStorage = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
};

async function requestCached(method, url, config = {}, opts = {}) {
  const {
    cacheKey = stableKey(method, url, config),
    ttlMs = 0,
    persist = false, // sessionStorage
    storageKey = `api-cache:${cacheKey}`,
    dedupe = true,
  } = opts;

  if (ttlMs > 0) {
    const hit = __cache.get(cacheKey);
    if (hit && hit.expiresAt > now()) return hit.value;

    if (persist) {
      const persisted = readStorage(storageKey);
      if (persisted?.expiresAt > now()) return persisted.value;
    }
  }

  if (dedupe) {
    const inFlight = __inflight.get(cacheKey);
    if (inFlight) return inFlight;
  }

  const p = api.request({ method, url, ...config }).then((res) => {
    if (ttlMs > 0) {
      const entry = { expiresAt: now() + ttlMs, value: res };
      __cache.set(cacheKey, entry);
      if (persist) writeStorage(storageKey, entry);
    }
    return res;
  }).finally(() => {
    __inflight.delete(cacheKey);
  });

  __inflight.set(cacheKey, p);
  return p;
}

// Interceptor to inject Authorization Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response) {
      const status = err.response.status;
      const requestUrl = String(err.config?.url || '');
      if (status === 401) {
        try {
          sessionStorage.clear();
          localStorage.removeItem('token'); // Clear stored token on 401
        } catch {
          // noop
        }

        notifyAuthInvalidated();

        // Let React route guards handle navigation to avoid full-page refresh loops.
      } else if (status === 403 && requestUrl.includes('/auth/me')) {
        try {
          sessionStorage.clear();
          localStorage.removeItem('token');
        } catch {
          // noop
        }
        notifyAuthInvalidated();
      } else if (status >= 400) {
        const message = err.response.data?.message || 'An error occurred';
        toast.error(`Error ${status}: ${message}`);
      }
    } else if (err.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          (d) => api.post('/auth/login', d),
  googleLogin:    (credential) => api.post('/auth/google', { credential }),
  me:             (config = {})  => api.get('/auth/me', config),
  logout:         ()  => api.post('/auth/logout'),
  changePassword: (d) => api.put('/auth/change-password', d),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

export const securityAPI = {
  getIncidents: (p) => api.get('/security/incidents', { params: p }),
  createIncident: (d) => api.post('/security/incidents', d),
  resolveIncident: (id, d = { status: 'resolved' }) => api.patch(`/security/incidents/${id}/resolve`, d),
  blockIncidentIp: (id, d = {}) => api.patch(`/security/incidents/${id}/block`, d),
  deleteIncident: (id) => api.delete(`/security/incidents/${id}`),
};

export const caretakerAPI = {
  getStats:    ()  => api.get('/caretaker/dashboard'),
  getComplaints: (p) => api.get('/caretaker/complaints', { params: p }),
  updateComplaint: (id, d) => api.put(`/caretaker/complaints/${id}`, d),
};

export const wardenAPI = {
  getStats:    ()  => api.get('/warden/dashboard'),
  getStudents: (p) => api.get('/warden/students', { params: p }),
  getComplaints: (p) => api.get('/warden/complaints', { params: p }),
  getMyScope:  ()  => api.get('/warden/my-scope'),
};

export const studentsAPI = {
  getAll:    (p) => api.get('/students', { params: p }),
  getOne:    (id) => api.get(`/students/${id}`),
  create:    (d)  => api.post('/students', d),
  update:    (id,d) => api.put(`/students/${id}`, d),
  delete:    (id) => api.delete(`/students/${id}`),
  exportCSV: ()   => api.get('/students/export', { responseType: 'blob' }),
  importCSV: (f)  => api.post('/bulk/students', f),
};

export const roomsAPI = {
  getAll:  (p)    => api.get('/rooms', { params: p }),
  getOne:  (id)   => api.get(`/rooms/${id}`),
  create:  (d)    => api.post('/rooms', d),
  update:  (id,d) => api.put(`/rooms/${id}`, d),
  delete:  (id)   => api.delete(`/rooms/${id}`),
  getWardens: ()  => api.get('/rooms/wardens'),
  getFloorWardens: (p) => api.get('/rooms/floor-wardens', { params: p }),
  setFloorWardens: (d) => api.put('/rooms/floor-wardens', d),
  exportCSV: ()   => api.get('/rooms/export', { responseType: 'blob' }),
  importCSV: (f)  => api.post('/bulk/rooms', f),
};

export const allocationsAPI = {
  allocate: (d) => api.post('/allocations/allocate', d),
  vacate:   (d) => api.post('/allocations/vacate', d),
  history:  ()  => api.get('/allocations/history'),
  importCSV: (f) => api.post('/bulk/allocations', f),
};

export const complaintsAPI = {
  getAll:       (p)    => api.get('/complaints', { params: p }),
  create:       (d)    => api.post('/complaints', d),
  updateStatus: (id,d) => api.put(`/complaints/${id}`, d),
  delete:       (id)   => api.delete(`/complaints/${id}`),
};

export const noticesAPI = {
  getAll:  (p)  => api.get('/notices', { params: p }),
  create:  (d)  => api.post('/notices', d),
  delete:  (id) => api.delete(`/notices/${id}`),
};

export const visitorsAPI = {
  getAll:   (p)    => api.get('/visitors', { params: p }),
  create:   (d)    => api.post('/visitors', d),
  markExit: (id)   => api.put(`/visitors/${id}/exit`),
  delete:   (id)   => api.delete(`/visitors/${id}`),
  getMine:  ()     => api.get('/student/visitors'),
  createMine: (d)  => api.post('/student/visitors', d),
};

export const leavesAPI = {
  getAll:       (p)      => api.get('/leaves', { params: p }),
  create:       (d)      => api.post('/leaves', d),
  updateStatus: (id, d)  => api.put(`/leaves/${id}/status`, d),
  delete:       (id)     => api.delete(`/leaves/${id}`),
};

export const messMenuAPI = {
  // changes rarely; cache for 10 minutes (also persist between reloads)
  getAll: ()  => requestCached('get', '/mess-menu', {}, { ttlMs: 10 * 60 * 1000, persist: true }),
  update: (d) => api.put('/mess-menu', d),
};

export const studentPortalAPI = {
  getProfile:    ()  => api.get('/student/profile'),
  getDashboard:  ()  => api.get('/student/dashboard'),
  getComplaints: (p) => api.get('/student/complaints', { params: p }),
  fileComplaint: (d) => api.post('/student/complaints', d, {
    headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  updateComplaint:  (id, d) => api.put(`/student/complaints/${id}`, d, {
    headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  resolveComplaint: (id)    => api.patch(`/student/complaints/${id}/resolve`),
};

export const hostelApplicationsAPI = {
  getAll:           (p)    => api.get('/hostel-applications', { params: p }),
  getMyApplications: ()    => api.get('/student/hostel-applications'),
  create:           (d)    => api.post('/student/hostel-applications', d),
  review:           (id,d) => api.put(`/hostel-applications/${id}`, d),
};

export const requestsAPI = {
  getAll:       (p)    => api.get('/requests', { params: p }),
  getMyRequests: ()    => api.get('/student/requests'),
  create:       (d)    => api.post('/student/requests', d),
  review:       (id,d) => api.put(`/requests/${id}`, d),
};

export const attendanceAPI = {
  getAll:         (p) => api.get('/attendance', { params: p }),
  getMyAttendance: (p) => api.get('/student/attendance', { params: p }),
  mark:           (d) => api.post('/attendance', d),
  bulkMark:       (d) => api.post('/attendance/bulk', d),
};

export const staffDirectoryAPI = {
  // read-mostly; cache for 30 minutes (persist)
  getAll: () => requestCached('get', '/staff-directory', {}, { ttlMs: 30 * 60 * 1000, persist: true }),
};

export const usersAPI = {
  getAll:  (p)    => api.get('/users', { params: p }),
  getOne:  (id)   => api.get(`/users/${id}`),
  create:  (d)    => api.post('/users', d),
  update:  (id,d) => api.put(`/users/${id}`, d),
  delete:  (id)   => api.delete(`/users/${id}`),
};

export default api;

// ── Warden ↔ Admin Messaging ──────────────────────────────────
export const messagesAPI = {
  wardenSend:        (d)    => api.post('/messages/warden/send', d),
  wardenGetSent:     ()     => api.get('/messages/warden/sent'),
  wardenGetReceived: ()     => api.get('/messages/warden/received'),
  markSeen:          (id)   => api.put(`/messages/${id}/mark-seen`),
  adminGetAll:       ()     => api.get('/messages/admin/all'),
  adminSend:         (d)    => api.post('/messages/admin/send', d),
  adminUpdateStatus: (id,d) => api.put(`/messages/admin/${id}/status`, d),
  adminDelete:       (id)   => api.delete(`/messages/admin/${id}`),
};



// ── Hostels ───────────────────────────────────────────────────
export const hostelsAPI = {
  getAll:          ()      => api.get('/hostels'),
  create:          async (d) => {
    const res = await api.post('/hostels', d);
    return res;
  },
  update:          async (id, d) => {
    const res = await api.put(`/hostels/${id}`, d);
    return res;
  },
  delete:          async (id) => {
    const res = await api.delete(`/hostels/${id}`);
    return res;
  },
  getWardenDetail: (id)    => api.get(`/hostels/warden/${id}`),
};

// ── Student: My Room ──────────────────────────────────────────
export const myRoomAPI = {
  get: () => api.get('/student/my-room'),
};
