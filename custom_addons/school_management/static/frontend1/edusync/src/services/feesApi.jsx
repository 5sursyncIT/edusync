// Service API pour la gestion des frais scolaires
import axios from 'axios';
import API_CONFIG, { 
  buildUrl, 
  handleHttpError, 
  logRequest, 
  logResponse, 
  logError 
} from '../config/apiConfig';

// Configuration axios pour les frais
const feesApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Intercepteur pour logger les requêtes
feesApi.interceptors.request.use(
  config => {
    logRequest(config.method, config.url, config.data);
    return config;
  },
  error => {
    logError('REQUEST', error.config?.url || 'unknown', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
feesApi.interceptors.response.use(
  response => {
    logResponse(response.config.method, response.config.url, response);
    return response;
  },
  error => {
    const errorMessage = handleHttpError(error);
    logError(error.config?.method || 'unknown', error.config?.url || 'unknown', error);
    
    // Retourner une erreur formatée
    const formattedError = new Error(errorMessage);
    formattedError.originalError = error;
    formattedError.status = error.response?.status;
    formattedError.data = error.response?.data;
    
    return Promise.reject(formattedError);
  }
);

// ================= SERVICES FRAIS =================

// Termes de frais
export const feesTermsService = {
  // Récupérer la liste des termes de frais
  getTerms: async (params = {}) => {
    try {
      const queryParams = {
        page: params.page || API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: params.limit || API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params
      };
      
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.TERMS, { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des termes de frais: ${error.message}`);
    }
  },

  // Créer un nouveau terme de frais
  createTerm: async (termData) => {
    try {
      const response = await feesApi.post(API_CONFIG.FEES_ENDPOINTS.TERMS, termData);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la création du terme de frais: ${error.message}`);
    }
  },

  // Récupérer un terme de frais par ID
  getTermById: async (termId) => {
    try {
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.TERM_BY_ID(termId));
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du terme de frais: ${error.message}`);
    }
  },

  // Mettre à jour un terme de frais
  updateTerm: async (termId, termData) => {
    try {
      const response = await feesApi.put(API_CONFIG.FEES_ENDPOINTS.TERM_BY_ID(termId), termData);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du terme de frais: ${error.message}`);
    }
  },

  // Supprimer un terme de frais
  deleteTerm: async (termId) => {
    try {
      const response = await feesApi.delete(API_CONFIG.FEES_ENDPOINTS.TERM_BY_ID(termId));
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du terme de frais: ${error.message}`);
    }
  }
};

// Détails de frais
export const feesDetailsService = {
  // Récupérer la liste des détails de frais
  getDetails: async (params = {}) => {
    try {
      const queryParams = {
        page: params.page || API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: params.limit || API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params
      };
      
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.DETAILS, { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des détails de frais: ${error.message}`);
    }
  },

  // Créer un nouveau détail de frais
  createDetail: async (detailData) => {
    try {
      const response = await feesApi.post(API_CONFIG.FEES_ENDPOINTS.DETAILS, detailData);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la création du détail de frais: ${error.message}`);
    }
  },

  // Récupérer un détail de frais par ID
  getDetailById: async (detailId) => {
    try {
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.DETAIL_BY_ID(detailId));
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du détail de frais: ${error.message}`);
    }
  },

  // Mettre à jour un détail de frais
  updateDetail: async (detailId, detailData) => {
    try {
      const response = await feesApi.put(API_CONFIG.FEES_ENDPOINTS.DETAIL_BY_ID(detailId), detailData);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du détail de frais: ${error.message}`);
    }
  },

  // Supprimer un détail de frais
  deleteDetail: async (detailId) => {
    try {
      const response = await feesApi.delete(API_CONFIG.FEES_ENDPOINTS.DETAIL_BY_ID(detailId));
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du détail de frais: ${error.message}`);
    }
  },

  // Récupérer les frais d'un étudiant spécifique
  getStudentFees: async (studentId, params = {}) => {
    try {
      const queryParams = {
        student_id: studentId,
        page: params.page || API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: params.limit || API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params
      };
      
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.DETAILS, { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des frais de l'étudiant: ${error.message}`);
    }
  }
};

// Statistiques des frais
export const feesStatisticsService = {
  // Récupérer les statistiques des frais
  getStatistics: async () => {
    try {
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.STATISTICS);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  },

  // Récupérer les frais impayés
  getUnpaidFees: async (params = {}) => {
    try {
      const queryParams = {
        page: params.page || API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: params.limit || API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params
      };
      
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.UNPAID, { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des frais impayés: ${error.message}`);
    }
  },

  // Récupérer les frais en retard
  getOverdueFees: async (params = {}) => {
    try {
      const queryParams = {
        page: params.page || API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: params.limit || API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params
      };
      
      const response = await feesApi.get(API_CONFIG.FEES_ENDPOINTS.OVERDUE, { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des frais en retard: ${error.message}`);
    }
  }
};

// Actions sur les frais
export const feesActionsService = {
  // Générer les frais pour un étudiant
  generateStudentFees: async (studentId) => {
    try {
      const response = await feesApi.post(API_CONFIG.FEES_ENDPOINTS.GENERATE_STUDENT(studentId));
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la génération des frais: ${error.message}`);
    }
  },

  // Appliquer des frais de retard
  applyLateFee: async (detailId) => {
    try {
      const response = await feesApi.post(API_CONFIG.FEES_ENDPOINTS.APPLY_LATE_FEE(detailId));
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de l'application des frais de retard: ${error.message}`);
    }
  }
};

// Service pour les étudiants
export const studentsService = {
  // Récupérer la liste simple des étudiants (pour les listes déroulantes)
  getSimpleList: async (params = {}) => {
    try {
      const queryParams = {
        limit: params.limit || 100, // Plus de résultats pour les listes déroulantes
        search: params.search || '',
        ...params
      };
      
      const response = await feesApi.get(API_CONFIG.STUDENT_ENDPOINTS.SIMPLE_LIST, { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la liste des étudiants: ${error.message}`);
    }
  }
};

// Service principal pour les frais
export const feesService = {
  terms: feesTermsService,
  details: feesDetailsService,
  statistics: feesStatisticsService,
  actions: feesActionsService,
  students: studentsService
};

export default feesService; 