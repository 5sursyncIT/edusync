import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

// Configuration axios pour les parents
const parentsApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
});

// Intercepteur pour les requêtes
parentsApi.interceptors.request.use(
  (config) => {
    console.log(`[Parents API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Parents API] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
parentsApi.interceptors.response.use(
  (response) => {
    console.log(`[Parents API] Réponse reçue:`, response.data);
    return response;
  },
  (error) => {
    console.error('[Parents API] Erreur de réponse:', error);
    return Promise.reject(error);
  }
);

// ================= SERVICES PARENTS =================

export const parentsService = {
  // Récupérer la liste des parents
  async getParents(params = {}) {
    try {
      const response = await parentsApi.get('/api/parents', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des parents: ${error.message}`);
    }
  },

  // Récupérer un parent par ID
  async getParentById(parentId) {
    try {
      const response = await parentsApi.get(`/api/parents/${parentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du parent: ${error.message}`);
    }
  },

  // Créer un nouveau parent
  async createParent(parentData) {
    try {
      const response = await parentsApi.post('/api/parents', parentData);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la création du parent: ${error.message}`);
    }
  },

  // Mettre à jour un parent
  async updateParent(parentId, parentData) {
    try {
      const response = await parentsApi.put(`/api/parents/${parentId}`, parentData);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du parent: ${error.message}`);
    }
  },

  // Supprimer un parent
  async deleteParent(parentId) {
    try {
      const response = await parentsApi.delete(`/api/parents/${parentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du parent: ${error.message}`);
    }
  },

  // Créer un compte portal pour un parent
  async createPortalUser(parentId) {
    try {
      const response = await parentsApi.post(`/api/parents/${parentId}/create-portal-user`);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la création du compte portal: ${error.message}`);
    }
  },

  // Récupérer les types de relations parent-étudiant
  async getParentRelationships() {
    try {
      const response = await parentsApi.get('/api/parents/relationships');
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des relations: ${error.message}`);
    }
  },

  // Récupérer les parents d'un étudiant
  async getStudentParents(studentId) {
    try {
      const response = await parentsApi.get(`/api/students/${studentId}/parents`);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des parents de l'étudiant: ${error.message}`);
    }
  },

  // Récupérer les statistiques des parents
  async getParentsStatistics() {
    try {
      const response = await parentsApi.get('/api/parents/statistics');
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
};

// ================= SERVICES ÉTUDIANTS AVEC PARENTS =================

export const studentsService = {
  // Récupérer la liste des étudiants avec informations parents
  async getStudents(params = {}) {
    try {
      const response = await parentsApi.get('/api/students', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des étudiants: ${error.message}`);
    }
  },

  // Récupérer les étudiants avec leurs parents
  async getStudentsWithParents(params = {}) {
    try {
      const paramsWithParents = { ...params, include_parents: true };
      const response = await parentsApi.get('/api/students', { params: paramsWithParents });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des étudiants avec parents: ${error.message}`);
    }
  }
};

// Service principal unifié
export const parentsApiService = {
  parents: parentsService,
  students: studentsService,
  
  // Fonctions utilitaires
  utils: {
    // Formater le nom d'un parent avec sa relation
    formatParentName: (parent) => {
      if (!parent || !parent.name) return 'Parent non défini';
      return parent.relationship ? `${parent.name} (${parent.relationship})` : parent.name;
    },

    // Vérifier si un parent a accès au portal
    hasPortalAccess: (parent) => {
      return parent && parent.has_portal_access;
    },

    // Récupérer le parent principal d'un étudiant
    getPrimaryParent: (student) => {
      if (!student || !student.parents || student.parents.length === 0) {
        return null;
      }
      
      // Chercher le père en premier
      const father = student.parents.find(p => 
        p.relationship && p.relationship.toLowerCase().includes('father')
      );
      if (father) return father;
      
      // Puis la mère
      const mother = student.parents.find(p => 
        p.relationship && p.relationship.toLowerCase().includes('mother')
      );
      if (mother) return mother;
      
      // Sinon le premier parent disponible
      return student.parents[0];
    },

    // Formater les contacts des parents
    formatParentContacts: (parents) => {
      if (!parents || parents.length === 0) return 'Aucun contact';
      
      const contacts = parents
        .filter(p => p.mobile)
        .map(p => `${p.name}: ${p.mobile}`)
        .join(', ');
      
      return contacts || 'Aucun téléphone';
    }
  }
};

export default parentsApiService; 