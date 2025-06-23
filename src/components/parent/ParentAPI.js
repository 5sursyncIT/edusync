// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069';

// Service API complet pour le portail parent
export const parentAPI = {
  // Connexion parent
  parentLogin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // Déconnexion parent
  parentLogout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/parent/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(passwordData)
    });
    return response.json();
  },

  // Récupérer les enfants
  getChildren: async () => {
    const response = await fetch(`${API_BASE_URL}/api/parent/children`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Dashboard étudiant
  getStudentDashboard: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/dashboard`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Informations détaillées étudiant
  getStudentInfo: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Notes
  getStudentGrades: async (studentId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/grades?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Présences
  getStudentAttendance: async (studentId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/attendance?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Emploi du temps
  getStudentTimetable: async (studentId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/timetable?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Frais
  getStudentFees: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/fees`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Messages
  getStudentMessages: async (studentId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/messages?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Envoyer un message
  sendMessage: async (studentId, messageData) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(messageData)
    });
    return response.json();
  },

  // Enseignants
  getStudentTeachers: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/teachers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Rapports et bulletins
  getStudentReports: async (studentId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/reports?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Télécharger un rapport
  downloadReport: async (studentId, reportId) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/reports/${reportId}/download`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Périodes académiques
  getAcademicPeriods: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/parent/student/${studentId}/periods`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Gestion des erreurs
  handleApiError: (response) => {
    if (response.status === 401) {
      localStorage.removeItem('parent_session_id');
      localStorage.removeItem('parent_info');
      window.location.reload();
    }
    return response;
  }
};

// Export par défaut
export default parentAPI; 