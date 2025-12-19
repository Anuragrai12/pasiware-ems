// Hardcoded: Always use production backend (as requested)
const API_URL = 'https://kraafilcinema.com/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Common fetch wrapper with auth header
const fetchWithAuth = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    return data;
};

// ============ EMPLOYEES API ============
export const employeesAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/employees${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchWithAuth(`/employees/${id}`),

    create: (data) => fetchWithAuth('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchWithAuth(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchWithAuth(`/employees/${id}`, {
        method: 'DELETE',
    }),
};

// ============ ATTENDANCE API ============
export const attendanceAPI = {
    getStats: () => fetchWithAuth('/attendance/stats'),

    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/attendance${query ? `?${query}` : ''}`);
    },

    getByEmployee: (employeeId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/attendance/employee/${employeeId}${query ? `?${query}` : ''}`);
    },

    getMonthlySummary: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/attendance/monthly-summary${query ? `?${query}` : ''}`);
    },
};

// ============ LEAVES API ============
export const leavesAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/leaves${query ? `?${query}` : ''}`);
    },

    getPendingCount: () => fetchWithAuth('/leaves/pending'),

    getById: (id) => fetchWithAuth(`/leaves/${id}`),

    create: (data) => fetchWithAuth('/leaves', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    approve: (id) => fetchWithAuth(`/leaves/${id}/approve`, {
        method: 'PUT',
    }),

    reject: (id, reason) => fetchWithAuth(`/leaves/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
    }),
};

// ============ HOLIDAYS API ============
export const holidaysAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/holidays${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchWithAuth(`/holidays/${id}`),

    create: (data) => fetchWithAuth('/holidays', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchWithAuth(`/holidays/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchWithAuth(`/holidays/${id}`, {
        method: 'DELETE',
    }),
};

// ============ AUTH API ============
export const authAPI = {
    login: (credentials) => fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),

    register: (data) => fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getMe: () => fetchWithAuth('/auth/me'),

    updateDetails: (data) => fetchWithAuth('/auth/updatedetails', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    updatePassword: (data) => fetchWithAuth('/auth/updatepassword', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

export const settingsAPI = {
    get: () => fetchWithAuth('/settings'),

    getCurrentIP: () => fetchWithAuth('/settings/ip'),

    update: (data) => fetchWithAuth('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    reset: () => fetchWithAuth('/settings/reset', {
        method: 'POST',
    }),
};
