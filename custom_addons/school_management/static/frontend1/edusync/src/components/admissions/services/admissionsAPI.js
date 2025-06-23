// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8069';

// Configuration par défaut pour fetch
const defaultConfig = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  mode: 'cors'
};

// Service API pour les admissions
export const admissionsAPI = {
  // Obtenir la liste des admissions avec pagination et filtres
  async getAdmissions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Paramètres de pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Paramètres de recherche et filtrage
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.course_id) queryParams.append('course_id', params.course_id);
      if (params.batch_id) queryParams.append('batch_id', params.batch_id);
      
      // Paramètres de date
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      
      const response = await fetch(`${API_BASE_URL}/api/admissions?${queryParams}`, {
        ...defaultConfig,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des admissions:', error);
      throw error;
    }
  },

  // Obtenir les options de formulaire
  async getFormOptions() {
    try {
      console.log('📡 Envoi requête getFormOptions...');
      const response = await fetch(`${API_BASE_URL}/api/admissions/form-options`, {
        ...defaultConfig,
        method: 'GET'
      });
      
      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        throw new Error(`Erreur HTTP! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Réponse getFormOptions:', data);
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Format de réponse invalide');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erreur getFormOptions:', error);
      throw error;
    }
  },

  // Obtenir les statistiques des admissions
  async getStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/statistics`, {
        ...defaultConfig,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Créer une nouvelle admission
  async createAdmission(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions`, {
        ...defaultConfig,
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de l\'admission:', error);
      throw error;
    }
  },

  // Obtenir une admission par ID
  async getAdmissionById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/${id}`, {
        ...defaultConfig,
        method: 'GET'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'admission:', error);
      throw error;
    }
  },

  // Mettre à jour une admission
  async updateAdmission(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/${id}`, {
        ...defaultConfig,
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'admission:', error);
      throw error;
    }
  },

  // Supprimer une admission
  async deleteAdmission(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/${id}`, {
        ...defaultConfig,
        method: 'DELETE'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'admission:', error);
      throw error;
    }
  },

  // Soumission publique d'admission
  async submitPublicAdmission(admissionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/public/submit`, {
        ...defaultConfig,
        method: 'POST',
        body: JSON.stringify(admissionData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la soumission publique:', error);
      throw error;
    }
  },

  // Vérifier le statut d'admission
  async checkAdmissionStatus(email, applicationNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/public/status`, {
        ...defaultConfig,
        method: 'POST',
        body: JSON.stringify({
          email: email,
          application_number: applicationNumber
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      throw error;
    }
  },

  // Obtenir les analyses avancées
  async getAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.period) queryParams.append('period', params.period);
      if (params.course_id) queryParams.append('course_id', params.course_id);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await fetch(`${API_BASE_URL}/api/admissions/analytics?${queryParams}`, {
        ...defaultConfig,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des analyses:', error);
      throw error;
    }
  },

  // Effectuer une action sur une admission
  async performAction(id, action) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/${id}/action`, {
        ...defaultConfig,
        method: 'POST',
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'action sur l\'admission:', error);
      throw error;
    }
  },

  // Convertir une admission en étudiant officiel
  async convertToStudent(admissionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admissions/${admissionId}/convert-to-student`, {
        ...defaultConfig,
        method: 'POST'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la conversion en étudiant:', error);
      throw error;
    }
  }
}; 