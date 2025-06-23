// Configuration API pour le système de gestion scolaire
const API_CONFIG = {
  // URL de base de l'API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069',
  
  // Timeout par défaut pour les requêtes
  TIMEOUT: 30000,
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints pour les frais scolaires
  FEES_ENDPOINTS: {
    TERMS: '/api/fees/terms',
    TERM_BY_ID: (id) => `/api/fees/terms/${id}`,
    DETAILS: '/api/fees/details',
    DETAIL_BY_ID: (id) => `/api/fees/details/${id}`,
    STATISTICS: '/api/fees/statistics',
    UNPAID: '/api/fees/unpaid',
    OVERDUE: '/api/fees/overdue',
    GENERATE_STUDENT: (studentId) => `/api/fees/generate/${studentId}`,
    APPLY_LATE_FEE: (detailId) => `/api/fees/apply-late-fee/${detailId}`,
  },
  
  // Endpoints pour les étudiants
  STUDENT_ENDPOINTS: {
    LIST: '/api/students',
    BY_ID: (id) => `/api/students/${id}`,
    SEARCH: '/api/students/search',
    BULLETIN: (id) => `/api/students/${id}/bulletin`,
    SIMPLE_LIST: '/api/students/simple',
  },
  
  // Endpoints pour la bibliothèque
  LIBRARY_ENDPOINTS: {
    BOOKS: '/api/library/books',
    BOOK_BY_ID: (id) => `/api/library/books/${id}`,
    BORROWINGS: '/api/library/borrowings',
    BORROW_BOOK: '/api/library/borrow',
    RETURN_BOOK: '/api/library/return',
  },
  
  // Configuration de pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },
  
  // Messages d'erreur par défaut
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Erreur de connexion au serveur',
    TIMEOUT_ERROR: 'Délai d\'attente dépassé',
    SERVER_ERROR: 'Erreur serveur interne',
    NOT_FOUND: 'Ressource non trouvée',
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Accès interdit',
    VALIDATION_ERROR: 'Erreur de validation des données',
  },
  
  // Configuration CORS
  CORS: {
    ENABLED: true,
    ALLOWED_ORIGINS: ['http://172.16.209.128:3000', 'http://172.16.209.128:8069', 'http://localhost:3000', 'http://localhost:8069'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'Accept'],
  },
  
  // Configuration des notifications
  NOTIFICATIONS: {
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
    WARNING_DURATION: 4000,
    INFO_DURATION: 3000,
  },
  
  // Formats de date
  DATE_FORMATS: {
    DISPLAY: 'DD/MM/YYYY',
    API: 'YYYY-MM-DD',
    DATETIME: 'DD/MM/YYYY HH:mm',
    TIME: 'HH:mm',
  },
  
  // Configuration des uploads
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    CHUNK_SIZE: 1024 * 1024, // 1MB
  },
  
  // Configuration du cache
  CACHE: {
    ENABLED: true,
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100, // Nombre maximum d'entrées en cache
  },
  
  // Configuration de debug
  DEBUG: {
    ENABLED: import.meta.env.MODE === 'development',
    LOG_REQUESTS: true,
    LOG_RESPONSES: true,
    LOG_ERRORS: true,
  }
};

// Fonction utilitaire pour construire une URL complète
export const buildUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
};

// Fonction utilitaire pour gérer les erreurs HTTP
export const handleHttpError = (error) => {
  if (error.response) {
    // Erreur de réponse du serveur
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return data.message || API_CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return API_CONFIG.ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return API_CONFIG.ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return API_CONFIG.ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return data.message || API_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
      default:
        return data.message || `Erreur HTTP ${status}`;
    }
  } else if (error.request) {
    // Erreur de réseau
    return API_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.code === 'ECONNABORTED') {
    // Timeout
    return API_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR;
  } else {
    // Autre erreur
    return error.message || 'Erreur inconnue';
  }
};

// Fonction utilitaire pour logger les requêtes (en mode debug)
export const logRequest = (method, url, data = null) => {
  if (API_CONFIG.DEBUG.ENABLED && API_CONFIG.DEBUG.LOG_REQUESTS) {
    console.group(`🔄 ${method.toUpperCase()} ${url}`);
    if (data) {
      console.log('Data:', data);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// Fonction utilitaire pour logger les réponses (en mode debug)
export const logResponse = (method, url, response) => {
  if (API_CONFIG.DEBUG.ENABLED && API_CONFIG.DEBUG.LOG_RESPONSES) {
    console.group(`✅ ${method.toUpperCase()} ${url} - ${response.status}`);
    console.log('Response:', response.data);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// Fonction utilitaire pour logger les erreurs (en mode debug)
export const logError = (method, url, error) => {
  if (API_CONFIG.DEBUG.ENABLED && API_CONFIG.DEBUG.LOG_ERRORS) {
    console.group(`❌ ${method.toUpperCase()} ${url} - ERROR`);
    console.error('Error:', error);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// Fonction utilitaire pour formater les dates
export const formatDate = (date, format = API_CONFIG.DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case API_CONFIG.DATE_FORMATS.DISPLAY:
      return `${day}/${month}/${year}`;
    case API_CONFIG.DATE_FORMATS.API:
      return `${year}-${month}-${day}`;
    case API_CONFIG.DATE_FORMATS.DATETIME:
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case API_CONFIG.DATE_FORMATS.TIME:
      return `${hours}:${minutes}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

// Fonction utilitaire pour valider les fichiers
export const validateFile = (file) => {
  const errors = [];
  
  // Vérifier la taille
  if (file.size > API_CONFIG.UPLOAD.MAX_FILE_SIZE) {
    errors.push(`Fichier trop volumineux (max: ${API_CONFIG.UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB)`);
  }
  
  // Vérifier le type
  if (!API_CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Type de fichier non autorisé (autorisés: ${API_CONFIG.UPLOAD.ALLOWED_TYPES.join(', ')})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export principal de la configuration
export { API_CONFIG };

// Export par défaut
export default API_CONFIG; 