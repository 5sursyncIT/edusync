// odooApi.jsx
// Configuration API depuis les variables d'environnement
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.209.128:8069';
const ODOO_DATABASE = import.meta.env.VITE_ODOO_DATABASE || 'odoo_ecole';

// Configuration par défaut pour fetch
const defaultConfig = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

class OdooAPI {
  constructor() {
    this.sessionId = localStorage.getItem('session_id') || null;
  }

  // Récupérer et stocker le session ID depuis les headers de réponse
  extractAndStoreSessionId(response) {
    const sessionId = response.headers.get('X-Openerp-Session-Id');
    if (sessionId && sessionId !== this.sessionId) {
      console.log('Nouveau session ID reçu:', sessionId);
      this.sessionId = sessionId;
      localStorage.setItem('session_id', sessionId);
    }
  }

  // Vérifier si utilisateur connecté
  async isAuthenticated() {
    try {
      const response = await this.makeRequest('/api/check-session', {
        skipAuth: false // Important: inclure le session ID
      });
      return response.status === 'success' && response.authenticated === true;
    } catch (error) {
      console.log('Non authentifié:', error.message);
      return false;
    }
  }

  // Récupérer les informations utilisateur
  async getUserInfo() {
    try {
      const response = await this.makeRequest('/api/user/info');
      if (response.status === 'success' && response.user) {
        // Vérifier que l'utilisateur a bien des données valides
        if (response.user.id && response.user.id !== false) {
          return response.user;
        } else {
          console.warn('Données utilisateur invalides:', response.user);
          throw new Error('Données utilisateur invalides');
        }
      }
      throw new Error('Aucune information utilisateur disponible');
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      throw error;
    }
  }

  // Authentification
  async authenticate({ username, password, db = ODOO_DATABASE }) {
    try {
      // Nettoyer l'ancienne session avant de se connecter
      localStorage.removeItem('session_id');
      this.sessionId = null;
      
      const response = await this.makeRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, db }),
        skipAuth: true // Ne pas envoyer de session ID pour le login
      });
      
      if (response.status === 'success') {
        // Stocker le session_id immédiatement
        if (response.session_id) {
          console.log('Session ID reçu après login:', response.session_id);
          this.sessionId = response.session_id;
          localStorage.setItem('session_id', response.session_id);
        }
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.message || 'Erreur de connexion' };
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  }

  // Appel générique avec fetch
  async makeRequest(endpoint, options = {}) {
    // Normaliser l'URL en supprimant les slashes redondants
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    // Toujours récupérer le session ID le plus récent
    const currentSessionId = localStorage.getItem('session_id') || this.sessionId;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': options.responseType === 'blob' ? 'application/pdf' : 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };
    
    // Ajouter le session ID seulement si on a une session et que skipAuth n'est pas true
    if (currentSessionId && !options.skipAuth) {
      headers['X-Openerp-Session-Id'] = currentSessionId;
      console.log('Envoi avec Session ID:', currentSessionId);
    }

    try {
      console.log(`🚀 Envoi requête à ${endpoint}:`, {
        url,
        method: options.method || 'GET',
        headers,
        body: options.body,
        responseType: options.responseType
      });

      const fetchOptions = {
        method: options.method || 'GET',
        headers,
        credentials: 'include', // Important pour les cookies
        mode: 'cors'
      };
      
      // Ajouter le body seulement si présent
      if (options.body) {
        fetchOptions.body = options.body;
      }

      const response = await fetch(url, fetchOptions);

      console.log(`✅ Réponse de ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Extraire et stocker le session ID si présent
      this.extractAndStoreSessionId(response);

      // Gérer les réponses blob (pour les PDF)
      if (options.responseType === 'blob') {
        if (!response.ok) {
          // Si la réponse n'est pas OK, essayer de lire l'erreur en JSON
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur HTTP : ${response.status}`);
          } catch {
            throw new Error(`Erreur lors du téléchargement : ${response.status} ${response.statusText}`);
          }
        }
        
        const blob = await response.blob();
        console.log('📁 Blob reçu:', { size: blob.size, type: blob.type });
        return blob;
      }

      // Vérifier le Content-Type pour les réponses JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type reçu:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Réponse non-JSON reçue:', textResponse);
        throw new Error(`Réponse non-JSON reçue. Content-Type: ${contentType}`);
      }

      const data = await response.json();
      console.log('📄 Données reçues:', data);
      
      // Gérer les erreurs d'authentification de manière plus intelligente
      if (response.status === 401 || (data.code === 401)) {
        // Pour les API school_management, vérifier si c'est vraiment une erreur de session
        if (data.message && data.message.includes('Session')) {
          console.warn('🔐 Erreur de session détectée:', data.message);
          
          if (!options.skipAuth) {
            console.warn('Session expirée, nettoyage du localStorage');
            localStorage.removeItem('session_id');
            this.sessionId = null;
          }
          throw new Error('Session expirée');
        } else {
          // Si ce n'est pas une erreur de session, c'est probablement une erreur de validation
          console.log('🔍 Code 401 sans erreur de session, traitement normal');
        }
      }
      
      if (!response.ok && data.status !== 'success') {
        throw new Error(data.message || `Erreur HTTP : ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Erreur lors de l'appel à ${endpoint}:`, {
        error: error.message,
        name: error.name,
        stack: error.stack,
        url: url
      });
      
      // Diagnostic plus précis des erreurs réseau
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🔍 Diagnostic erreur réseau:', {
          message: 'Impossible de joindre le serveur',
          url: url,
          suggestions: [
            'Vérifiez que le serveur Odoo est démarré',
            'Vérifiez l\'URL de base dans la configuration',
            'Vérifiez les paramètres CORS du serveur',
            'Vérifiez la connectivité réseau'
          ]
        });
        throw new Error(`Impossible de joindre le serveur à l'adresse ${url}. Vérifiez que le serveur Odoo est démarré.`);
      }
      
      throw error;
    }
  }

  // Déconnexion
  async logout() {
    try {
      await this.makeRequest('/api/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Erreur lors de la déconnexion :', e);
    } finally {
      // Toujours nettoyer le localStorage
      localStorage.removeItem('session_id');
      this.sessionId = null;
    }
  }

  // ================== MÉTHODES DASHBOARD ==================
  
  // Test de connexion
  async testConnection() {
    try {
      const response = await this.makeRequest('/api/test');
      return response;
    } catch (error) {
      console.error('Erreur test connexion:', error);
      throw error;
    }
  }

  // Statistiques du dashboard
  async getStatistics() {
    try {
      const response = await this.makeRequest('/api/dashboard/statistics');
      return response;
    } catch (error) {
      console.error('Erreur statistiques:', error);
      throw error;
    }
  }

  // ================== MÉTHODES ÉTUDIANTS ==================
  
  // Récupérer la liste des étudiants
  async getStudents(page = 1, limit = 50, search = '', order = 'name asc', includeParents = false) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        order: order,
        include_parents: includeParents.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await this.makeRequest(`/api/students?${params}`);
      
      if (response.status === 'success') {
        return {
          students: response.data.students || [],
          pagination: response.data.pagination || { page: 1, limit: limit, total: 0, pages: 0 }
        };
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des étudiants');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      throw error;
    }
  }

  // Récupérer les étudiants avec leurs informations parents
  async getStudentsWithParents(page = 1, limit = 50, search = '', order = 'name asc') {
    return this.getStudents(page, limit, search, order, true);
  }

  // Récupérer un étudiant par ID
  async getStudent(id) {
    try {
      const response = await this.makeRequest(`/api/students/${id}`);
      if (response && response.status === 'success' && response.data) {
        return response.data;
      } else if (response && !response.status) {
        return response;
      }
      throw new Error('Données étudiant non trouvées dans la réponse');
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'étudiant ${id}:`, error);
      throw error;
    }
  }

  // Créer un nouvel étudiant
  async createStudent(studentData) {
    try {
      const response = await this.makeRequest('/api/students', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'étudiant:', error);
      throw error;
    }
  }

  // Mettre à jour un étudiant
  async updateStudent(id, studentData) {
    try {
      const response = await this.makeRequest(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(studentData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'étudiant ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un étudiant
  async deleteStudent(id) {
    try {
      const response = await this.makeRequest(`/api/students/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'étudiant ${id}:`, error);
      throw error;
    }
  }

  // Récupérer tous les étudiants sans pagination
  async getAllStudents() {
    try {
      const response = await this.makeRequest('/api/students?page=1&limit=5000');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les étudiants:', error);
      throw error;
    }
  }

  // ================== MÉTHODES PROMOTIONS/CLASSES ==================
  
  async getBatches(page = 1, limit = 20, search = '', order = 'name asc', filters = {}) {
    try {
      // Valider et nettoyer les paramètres numériques
      const validPage = Number.isInteger(page) && page > 0 ? page : 1;
      const validLimit = Number.isInteger(limit) && limit > 0 && limit <= 1000 ? limit : 20;
      const validSearch = search || '';
      const validOrder = order || 'name asc';

      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
        search: validSearch,
        order: validOrder,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/batches?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des promotions:', error);
      throw error;
    }
  }

  async createBatch(batchData) {
    try {
      const response = await this.makeRequest('/api/batches', {
        method: 'POST',
        body: JSON.stringify(batchData)
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du batch:', error);
      throw error;
    }
  }

  async getBatch(id) {
    try {
      const response = await this.makeRequest(`/api/batches/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Erreur lors de la récupération du batch ${id}:`, error);
      throw error;
    }
  }

  async updateBatch(id, batchData) {
    try {
      const response = await this.makeRequest(`/api/batches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(batchData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du batch ${id}:`, error);
      throw error;
    }
  }

  async deleteBatch(id) {
    try {
      const response = await this.makeRequest(`/api/batches/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression du batch ${id}:`, error);
      throw error;
    }
  }

  // Récupérer tous les batches sans pagination
  async getAllBatches() {
    try {
      const response = await this.makeRequest('/api/batches?page=1&limit=1000');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les batches:', error);
      throw error;
    }
  }

  // ================== MÉTHODES COURS ==================
  
  async getCourses(page = 1, limit = 20, search = '', order = 'name asc', filters = {}) {
    try {
      // Valider et nettoyer les paramètres numériques
      const validPage = Number.isInteger(page) && page > 0 ? page : 1;
      const validLimit = Number.isInteger(limit) && limit > 0 && limit <= 1000 ? limit : 20;
      const validSearch = search || '';
      const validOrder = order || 'name asc';

      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
        search: validSearch,
        order: validOrder,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/courses?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      throw error;
    }
  }

  async getAllCourses() {
    try {
      // Récupérer tous les cours sans pagination
      const response = await this.makeRequest('/api/courses?page=1&limit=1000');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les cours:', error);
      throw error;
    }
  }

  async createCourse(courseData) {
    try {
      const response = await this.makeRequest('/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du cours:', error);
      throw error;
    }
  }

  async getCourse(id) {
    try {
      const response = await this.makeRequest(`/api/courses/${id}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération du cours ${id}:`, error);
      throw error;
    }
  }

  async updateCourse(id, courseData) {
    try {
      const response = await this.makeRequest(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(courseData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du cours ${id}:`, error);
      throw error;
    }
  }

  async deleteCourse(id) {
    try {
      const response = await this.makeRequest(`/api/courses/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression du cours ${id}:`, error);
      throw error;
    }
  }

  // ================== MÉTHODES ENSEIGNANTS ==================
  
  async getTeachers(page = 1, limit = 20, search = '', order = 'name asc', filters = {}) {
    try {
      // Valider et nettoyer les paramètres numériques
      const validPage = Number.isInteger(page) && page > 0 ? page : 1;
      const validLimit = Number.isInteger(limit) && limit > 0 && limit <= 1000 ? limit : 20;
      const validSearch = search || '';
      const validOrder = order || 'name asc';

      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
        search: validSearch,
        order: validOrder,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/teachers?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des enseignants:', error);
      throw error;
    }
  }

  async getAllTeachers() {
    try {
      // Récupérer tous les enseignants sans pagination
      const response = await this.makeRequest('/api/teachers?page=1&limit=1000');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les enseignants:', error);
      throw error;
    }
  }

  async createTeacher(teacherData) {
    try {
      const response = await this.makeRequest('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(teacherData)
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'enseignant:', error);
      throw error;
    }
  }

  async getTeacher(id) {
    try {
      const response = await this.makeRequest(`/api/teachers/${id}`);
      if (response && response.status === 'success' && response.data) {
        return response.data;
      } else if (response && !response.status) {
        return response;
      }
      throw new Error('Données enseignant non trouvées dans la réponse');
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'enseignant ${id}:`, error);
      throw error;
    }
  }

  async updateTeacher(id, teacherData) {
    try {
      const response = await this.makeRequest(`/api/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(teacherData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'enseignant ${id}:`, error);
      throw error;
    }
  }

  async deleteTeacher(id) {
    try {
      const response = await this.makeRequest(`/api/teachers/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'enseignant ${id}:`, error);
      throw error;
    }
  }

  // ================== MÉTHODES MATIÈRES/SUBJECTS ==================
  
  async getSubjects(page = 1, limit = 20, search = '', order = 'name asc', filters = {}) {
    try {
      // Valider et nettoyer les paramètres numériques
      const validPage = Number.isInteger(page) && page > 0 ? page : 1;
      const validLimit = Number.isInteger(limit) && limit > 0 && limit <= 1000 ? limit : 20;
      const validSearch = search || '';
      const validOrder = order || 'name asc';
      
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
        search: validSearch,
        order: validOrder,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/subjects?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des matières:', error);
      throw error;
    }
  }

  async getAllSubjects() {
    try {
      // Récupérer toutes les matières sans pagination
      const response = await this.makeRequest('/api/subjects?page=1&limit=1000');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les matières:', error);
      throw error;
    }
  }

  async createSubject(subjectData) {
    try {
      // Préparer les données avec les nouveaux champs du modèle op_subject.py
      const requestData = {
        // Champs de base (obligatoires)
        name: subjectData.name,
        description: subjectData.description || '',
        active: subjectData.active !== undefined ? subjectData.active : true,
        
        // Code optionnel (sera auto-généré si course_id fourni)
        ...(subjectData.code && { code: subjectData.code }),
        
        // Relation avec le cours (recommandé)
        ...(subjectData.course_id && { course_id: subjectData.course_id }),
        
        // Configuration du chapitre/matière
        sequence: subjectData.sequence || 10,
        content_type: subjectData.content_type || 'chapitre',
        duration: subjectData.duration || 2.0,
        
        // Objectifs pédagogiques
        ...(subjectData.learning_objectives && { learning_objectives: subjectData.learning_objectives }),
        ...(subjectData.skills && { skills: subjectData.skills }),
        ...(subjectData.prerequisites && { prerequisites: subjectData.prerequisites }),
        
        // Planification
        ...(subjectData.planned_date && { planned_date: subjectData.planned_date }),
        ...(subjectData.start_date && { start_date: subjectData.start_date }),
        ...(subjectData.end_date && { end_date: subjectData.end_date }),
        state: subjectData.state || 'draft',
        
        // Évaluation
        evaluation_type: subjectData.evaluation_type || 'none',
        weight: subjectData.weight || 1.0,
        max_grade: subjectData.max_grade || 20.0,
        
        // Ressources et exercices
        has_exercises: subjectData.has_exercises || false,
        ...(subjectData.exercises_description && { exercises_description: subjectData.exercises_description }),
        ...(subjectData.online_resources && { online_resources: subjectData.online_resources }),
        
        // Champs legacy pour compatibilité
        subject_type: subjectData.content_type || 'chapitre',
        credits: Math.round(subjectData.weight || 1.0),
        theory_hours: Math.round(subjectData.duration || 2.0),
        practical_hours: 0
      };
      
      const response = await this.makeRequest('/api/subjects', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de la matière:', error);
      throw error;
    }
  }

  async getSubject(id) {
    try {
      const response = await this.makeRequest(`/api/subjects/${id}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la matière ${id}:`, error);
      throw error;
    }
  }

  async updateSubject(id, subjectData) {
    try {
      const response = await this.makeRequest(`/api/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(subjectData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la matière ${id}:`, error);
      throw error;
    }
  }

  async deleteSubject(id) {
    try {
      const response = await this.makeRequest(`/api/subjects/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la matière ${id}:`, error);
      throw error;
    }
  }

  async assignTeacherToSubject(subjectId, teacherId) {
    try {
      const response = await this.makeRequest(`/api/subjects/${subjectId}/teachers`, {
        method: 'POST',
        body: JSON.stringify({ teacher_id: teacherId })
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de l'assignation de l'enseignant ${teacherId} à la matière ${subjectId}:`, error);
      throw error;
    }
  }

  async removeTeacherFromSubject(subjectId, teacherId) {
    try {
      const response = await this.makeRequest(`/api/subjects/${subjectId}/teachers/${teacherId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors du retrait de l'enseignant ${teacherId} de la matière ${subjectId}:`, error);
      throw error;
    }
  }

  // ================== MÉTHODES PRÉSENCES ==================

  async getAttendances(page = 1, limit = 20, search = '', filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/attendance?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des présences:', error);
      throw error;
    }
  }

  async getAttendanceStatistics(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.makeRequest(`/api/attendance/statistics?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de présence:', error);
      throw error;
    }
  }

  getAttendanceStateBadge(state) {
    const badges = {
      'present': { text: 'Présent', color: 'bg-green-100 text-green-800', icon: '✓' },
      'absent': { text: 'Absent', color: 'bg-red-100 text-red-800', icon: '✗' },
      'late': { text: 'En retard', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
      'excused': { text: 'Excusé', color: 'bg-blue-100 text-blue-800', icon: '📝' }
    };
    return badges[state] || badges['absent'];
  }

  async getAttendanceReports(reportType = 'summary', filters = {}) {
    try {
      const params = new URLSearchParams({ type: reportType, ...filters });
      const response = await this.makeRequest(`/api/attendance/reports?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports d\'attendance:', error);
      throw error;
    }
  }

  async getAttendancesByStudent(studentId, filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.makeRequest(`/api/attendance/students/${studentId}?${params}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des présences de l'étudiant ${studentId}:`, error);
      throw error;
    }
  }

  // ================== ACTIONS DE PRÉSENCE ==================

  // Marquer tous les étudiants présents pour une session
  async markAllPresent(sessionId, studentIds, date) {
    try {
      console.log(`✅ markAllPresent: Session ${sessionId}, ${studentIds.length} étudiants, Date: ${date}`);
      
      const response = await this.makeRequest('/api/attendances/mark-all-present', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          student_ids: studentIds,
          date: date || new Date().toISOString().split('T')[0]
        })
      });
      
      console.log('✅ markAllPresent: Succès:', response);
      return response;
    } catch (error) {
      console.error('❌ markAllPresent: Erreur:', error);
      throw error;
    }
  }

  // Marquer tous les étudiants absents pour une session
  async markAllAbsent(sessionId, studentIds, date) {
    try {
      console.log(`❌ markAllAbsent: Session ${sessionId}, ${studentIds.length} étudiants, Date: ${date}`);
      
      const response = await this.makeRequest('/api/attendances/mark-all-absent', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          student_ids: studentIds,
          date: date || new Date().toISOString().split('T')[0]
        })
      });
      
      console.log('✅ markAllAbsent: Succès:', response);
      return response;
    } catch (error) {
      console.error('❌ markAllAbsent: Erreur:', error);
      throw error;
    }
  }

  // Enregistrer les présences en masse
  async bulkCreateAttendances(attendanceData) {
    try {
      console.log('💾 bulkCreateAttendances: Données:', attendanceData);
      
      // Vérifier qu'on a des données et extraire session_id et date du premier élément
      if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        throw new Error('Aucune donnée de présence à enregistrer');
      }
      
      const firstItem = attendanceData[0];
      const session_id = firstItem.session_id;
      const date = firstItem.date;
      
      if (!session_id || !date) {
        throw new Error('session_id et date sont requis dans les données de présence');
      }
      
      // Structurer les données selon le format attendu par l'API backend
      const requestData = {
        session_id: session_id,
        date: date,
        attendances: attendanceData
      };
      
      console.log('💾 bulkCreateAttendances: Données formatées pour l\'API:', requestData);
      
      const response = await this.makeRequest('/api/attendances/bulk-create', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      console.log('✅ bulkCreateAttendances: Succès:', response);
      return response;
    } catch (error) {
      console.error('❌ bulkCreateAttendances: Erreur:', error);
      throw error;
    }
  }

  // Mettre à jour une présence individuelle
  async updateAttendance(attendanceId, attendanceData) {
    try {
      console.log(`💾 updateAttendance: ID ${attendanceId}, Données:`, attendanceData);
      
      const response = await this.makeRequest(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        body: JSON.stringify(attendanceData)
      });
      
      console.log('✅ updateAttendance: Succès:', response);
      return response;
    } catch (error) {
      console.error('❌ updateAttendance: Erreur:', error);
      throw error;
    }
  }

  // Supprimer une présence
  async deleteAttendance(attendanceId) {
    try {
      console.log(`🗑️ deleteAttendance: ID ${attendanceId}`);
      
      const response = await this.makeRequest(`/api/attendance/${attendanceId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ deleteAttendance: Succès:', response);
      return response;
    } catch (error) {
      console.error('❌ deleteAttendance: Erreur:', error);
      throw error;
    }
  }

  // Présence rapide pour un étudiant
  async quickAttendance(studentId, sessionId, state, date, remarks = '') {
    try {
      console.log(`⚡ quickAttendance: Étudiant ${studentId}, Session ${sessionId}, État ${state}`);
      
      const response = await this.makeRequest('/api/attendance/quick', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          session_id: sessionId,
          state: state,
          date: date || new Date().toISOString().split('T')[0],
          remarks: remarks
        })
      });
      
      console.log('✅ quickAttendance: Succès:', response);
      return response;
    } catch (error) {
      console.error('❌ quickAttendance: Erreur:', error);
      throw error;
    }
  }

  // Obtenir les sessions d'aujourd'hui
  async getTodaySessions(filters = {}) {
    try {
      console.log('🔍 getTodaySessions: Récupération des sessions d\'aujourd\'hui');
      
      const today = new Date().toISOString().split('T')[0];
      const params = new URLSearchParams({
        date: today,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/sessions/today?${params}`);
      return response;
    } catch (error) {
      console.error('❌ getTodaySessions: Erreur:', error);
      throw error;
    }
  }

  // Obtenir les sessions à venir
  async getUpcomingSessions(filters = {}, days = 7) {
    try {
      console.log('🔍 getUpcomingSessions: Récupération des sessions à venir');
      
      const params = new URLSearchParams({
        days: days.toString(),
        ...filters
      });
      
      const response = await this.makeRequest(`/api/sessions/upcoming?${params}`);
      return response;
    } catch (error) {
      console.error('❌ getUpcomingSessions: Erreur:', error);
      throw error;
    }
  }

  // Exporter les données de présence
  async exportAttendances(format = 'csv', filters = {}) {
    try {
      console.log(`📤 exportAttendances: Format ${format}, Filtres:`, filters);
      
      const params = new URLSearchParams({
        format: format,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/attendance/export?${params}`);
      return response;
    } catch (error) {
      console.error('❌ exportAttendances: Erreur:', error);
      throw error;
    }
  }

  // ================== MÉTHODES SESSIONS ==================

  async getSessions(page = 1, limit = 20, search = '', filters = {}) {
    try {
      console.log('🔍 odooApi.getSessions: Appel avec paramètres:', { page, limit, search, filters });
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
        ...filters
      });
      
      console.log('🔍 odooApi.getSessions: URL finale:', `/api/sessions?${params}`);
      
      const response = await this.makeRequest(`/api/sessions?${params}`);
      
      console.log('🔍 odooApi.getSessions: Réponse reçue:', response);
      
      // Transformer les données pour la structure attendue par le frontend
      if (response && response.status === 'success' && response.data && response.data.sessions) {
        const transformedSessions = response.data.sessions.map(session => ({
          ...session,
          // Ajouter les objets attendus par le frontend
          subject: session.subject_name ? {
            id: session.subject_id,
            name: session.subject_name
          } : null,
          batch: session.batch_name ? {
            id: session.batch_id,
            name: session.batch_name
          } : null,
          faculty: session.teacher_name ? {
            id: session.teacher_id,
            name: session.teacher_name
          } : null,
          course: session.course_name ? {
            id: session.course_id,
            name: session.course_name
          } : null,
          classroom: session.classroom_name ? {
            id: session.classroom_id,
            name: session.classroom_name
          } : null
        }));
        
        return {
          ...response,
          data: {
            ...response.data,
            sessions: transformedSessions
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ odooApi.getSessions: Erreur:', error);
      throw error;
    }
  }

  async createSession(sessionData) {
    try {
      const response = await this.makeRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      throw error;
    }
  }

  async getSession(id) {
    try {
      const response = await this.makeRequest(`/api/sessions/${id}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la session ${id}:`, error);
      throw error;
    }
  }

  async updateSession(id, sessionData) {
    try {
      const response = await this.makeRequest(`/api/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sessionData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la session ${id}:`, error);
      throw error;
    }
  }

  async deleteSession(id) {
    try {
      const response = await this.makeRequest(`/api/sessions/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la session ${id}:`, error);
      throw error;
    }
  }

  // ================== MÉTHODES EXAMENS/ÉVALUATIONS ==================

  async getEvaluationTypes(niveauScolaire = null) {
    try {
      const params = niveauScolaire ? `?education_level=${niveauScolaire}` : '';
      const response = await this.makeRequest(`/api/evaluation-types${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des types d\'évaluation:', error);
      throw error;
    }
  }

  // ================== MÉTHODES UTILITAIRES ==================
  
  formatDate(dateString, includeTime = false) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    return date.toLocaleDateString('fr-FR', options);
  }

  formatAttendanceDate(dateString, includeTime = false) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      if (includeTime) {
        // Format avec heure pour les sessions
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        // Format simple pour les dates
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Erreur formatage date attendance:', error);
      return 'N/A';
    }
  }

  formatAttendanceStats(globalStats) {
    if (!globalStats) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: '0.0',
        absenceRate: '0.0'
      };
    }

    // Utiliser les noms de champs corrects retournés par l'API backend
    const total = globalStats.total_records || globalStats.total || 0;
    const present = globalStats.present_count || globalStats.present || 0;
    const absent = globalStats.absent_count || globalStats.absent || 0;
    const late = globalStats.late_count || globalStats.late || 0;

    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    const absenceRate = total > 0 ? ((absent / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      present,
      absent,
      late,
      attendanceRate,
      absenceRate
    };
  }

  formatSessionTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatage heure session:', error);
      return 'N/A';
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
  }

  getBaseUrl() {
    return API_BASE_URL;
  }

  getDatabase() {
    return ODOO_DATABASE;
  }

  async debugSession() {
    try {
      const response = await this.makeRequest('/api/test');
      console.log('Debug session:', response);
      return response;
    } catch (error) {
      console.error('Erreur debug session:', error);
      throw error;
    }
  }

  // 8. VALIDER LES DONNÉES DE SESSION
  validateSessionData(sessionData) {
    const errors = [];
    
    if (!sessionData.name || sessionData.name.trim() === '') {
      errors.push('Le nom de la session est obligatoire');
    }
    
    if (!sessionData.subject_id) {
      errors.push('La matière est obligatoire');
    }
    
    if (!sessionData.batch_id) {
      errors.push('La promotion est obligatoire');
    }
    
    if (!sessionData.teacher_id) {
      errors.push('L\'enseignant est obligatoire');
    }
    
    if (!sessionData.date) {
      errors.push('La date est obligatoire');
    }
    
    if (!sessionData.start_time) {
      errors.push('L\'heure de début est obligatoire');
    }
    
    if (!sessionData.end_time) {
      errors.push('L\'heure de fin est obligatoire');
    }
    
    // Validation des heures
    if (sessionData.start_time && sessionData.end_time) {
      const startTime = sessionData.start_time.split(':');
      const endTime = sessionData.end_time.split(':');
      
      if (startTime.length === 2 && endTime.length === 2) {
        const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
        
        if (startMinutes >= endMinutes) {
          errors.push('L\'heure de fin doit être postérieure à l\'heure de début');
        }
      }
    }
    
    // Validation de la date
    if (sessionData.date) {
      const sessionDate = new Date(sessionData.date);
      if (isNaN(sessionDate.getTime())) {
        errors.push('Format de date invalide');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // 9. VALIDER LES DONNÉES DE PRÉSENCE
  validateAttendanceData(attendanceData) {
    const errors = [];
    
    if (!attendanceData.student_id) {
      errors.push('L\'ID de l\'étudiant est obligatoire');
    }
    
    if (!attendanceData.session_id) {
      errors.push('L\'ID de la session est obligatoire');
    }
    
    if (!attendanceData.date) {
      errors.push('La date est obligatoire');
    }
    
    if (!attendanceData.state || !['present', 'absent', 'late', 'excused'].includes(attendanceData.state)) {
      errors.push('L\'état de présence doit être: present, absent, late ou excused');
    }
    
    // Validation de la date
    if (attendanceData.date) {
      const date = new Date(attendanceData.date);
      if (isNaN(date.getTime())) {
        errors.push('La date est invalide');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // 10. VALIDER LES DONNÉES D'EXAMEN
  validateExamData(examData) {
    const errors = [];
    
    if (!examData.name || !examData.name.trim()) {
      errors.push('Le nom de l\'examen est obligatoire');
    }
    
    if (!examData.date) {
      errors.push('La date de l\'examen est obligatoire');
    }
    
    if (!examData.subject_id) {
      errors.push('La matière est obligatoire');
    }
    
    if (!examData.course_id) {
      errors.push('Le cours est obligatoire');
    }
    
    if (!examData.batch_id) {
      errors.push('La classe est obligatoire');
    }
    
    if (!examData.teacher_id) {
      errors.push('L\'enseignant est obligatoire');
    }
    
    if (!examData.evaluation_type_id) {
      errors.push('Le type d\'évaluation est obligatoire');
    }
    
    if (examData.max_marks && (examData.max_marks <= 0 || examData.max_marks > 100)) {
      errors.push('La note maximale doit être entre 0 et 100');
    }
    
    return errors;
  }

  // ================== MÉTHODES EXAMENS ==================

  async getExams(page = 1, limit = 20, search = '', filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/exams?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des examens:', error);
      throw error;
    }
  }

  async createExam(examData) {
    try {
      // Valider les données avant envoi
      const validationErrors = this.validateExamData(examData);
      if (validationErrors.length > 0) {
        throw new Error(`Données invalides: ${validationErrors.join(', ')}`);
      }

      const response = await this.makeRequest('/api/exams', {
        method: 'POST',
        body: JSON.stringify(examData)
      });
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
      throw error;
    }
  }

  async getExam(id) {
    try {
      const response = await this.makeRequest(`/api/exams/${id}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'examen ${id}:`, error);
      throw error;
    }
  }

  async updateExam(id, examData) {
    try {
      const response = await this.makeRequest(`/api/exams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(examData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'examen ${id}:`, error);
      throw error;
    }
  }

  async deleteExam(id) {
    try {
      const response = await this.makeRequest(`/api/exams/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'examen ${id}:`, error);
      throw error;
    }
  }

  async getExamGrades(examId) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/grades`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des notes de l'examen ${examId}:`, error);
      throw error;
    }
  }

  async updateExamGrades(examId, gradesData) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/grades`, {
        method: 'PUT',
        body: JSON.stringify({ grades: gradesData })
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des notes de l'examen ${examId}:`, error);
      throw error;
    }
  }

  async updateSingleGrade(examId, gradeId, note, appreciation = '') {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/grades/${gradeId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          note: parseFloat(note),
          appreciation: appreciation
        })
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la note ${gradeId}:`, error);
      throw error;
    }
  }

  async startExam(examId) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'examen:', error);
      throw error;
    }
  }

  async finishExam(examId) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la terminaison de l\'examen:', error);
      throw error;
    }
  }

  async cancelExam(examId) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'examen:', error);
      throw error;
    }
  }

  async duplicateExam(examId, newData = {}) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(newData)
      });
      return response;
    } catch (error) {
      console.error(`Erreur lors de la duplication de l'examen ${examId}:`, error);
      throw error;
    }
  }

  async exportExamResults(examId, format = 'csv') {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/export?format=${format}`, {
        method: 'GET'
      });
      
      // Si la réponse est un blob, le renvoyer directement
      if (response instanceof Blob) {
        return { blob: response };
      }
      
      // Sinon, supposer que c'est une URL de téléchargement
      return { url: response.download_url || response.url };
    } catch (error) {
      console.error(`Erreur lors de l'export de l'examen ${examId}:`, error);
      throw error;
    }
  }

  async getExamsBySubject(subjectId, state = null) {
    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      
      const response = await this.makeRequest(`/api/subjects/${subjectId}/exams?${params}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des examens pour la matière ${subjectId}:`, error);
      throw error;
    }
  }

  async getExamsByCourse(courseId, state = null) {
    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      
      const response = await this.makeRequest(`/api/courses/${courseId}/exams?${params}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des examens pour le cours ${courseId}:`, error);
      throw error;
    }
  }

  async getExamsByBatch(batchId, state = null) {
    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      
      const response = await this.makeRequest(`/api/batches/${batchId}/exams?${params}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des examens pour le groupe ${batchId}:`, error);
      throw error;
    }
  }

  async getExamsByTeacher(teacherId, state = null) {
    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      
      const response = await this.makeRequest(`/api/teachers/${teacherId}/exams?${params}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des examens pour l'enseignant ${teacherId}:`, error);
      throw error;
    }
  }

  async getExamStatistics(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.makeRequest(`/api/exams/statistics?${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques d\'examens:', error);
      throw error;
    }
  }

  async getEvaluationTypesForExams(education_level = null) {
    try {
      const params = education_level ? `?education_level=${education_level}` : '';
      const response = await this.makeRequest(`/api/evaluation-types${params}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des types d\'évaluation:', error);
      throw error;
    }
  }

  // Utilitaires pour les examens
  getExamStateBadge(state) {
    const badges = {
      'draft': { color: 'default', label: 'Brouillon', icon: '📝' },
      'ongoing': { color: 'warning', label: 'En cours', icon: '⏳' },
      'done': { color: 'success', label: 'Terminé', icon: '✅' },
      'cancelled': { color: 'error', label: 'Annulé', icon: '❌' }
    };
    
    return badges[state] || badges['draft'];
  }

  getEvaluationTypeBadge(type) {
    const badges = {
      'composition': { color: 'primary', label: 'Composition', icon: '📊' },
      'devoir': { color: 'secondary', label: 'Devoir', icon: '📝' },
      'controle': { color: 'info', label: 'Contrôle', icon: '🔍' },
      'examen': { color: 'warning', label: 'Examen', icon: '📋' },
      'oral': { color: 'success', label: 'Oral', icon: '🎤' },
      'tp': { color: 'error', label: 'TP', icon: '🔬' },
      'projet': { color: 'default', label: 'Projet', icon: '🎯' }
    };
    
    return badges[type] || badges['devoir'];
  }

  formatGradePercentage(note, noteMax) {
    if (!noteMax || noteMax === 0) return 0;
    return Math.round((note / noteMax) * 100);
  }

  getGradeColor(percentage) {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'info';
    return 'error';
  }

  calculateExamStatistics(grades) {
    if (!grades || grades.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        passed: 0,
        failed: 0,
        passRate: 0
      };
    }

    const notes = grades.map(g => g.note).filter(n => n > 0);
    if (notes.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        passed: 0,
        failed: 0,
        passRate: 0
      };
    }

    const average = notes.reduce((sum, note) => sum + note, 0) / notes.length;
    const min = Math.min(...notes);
    const max = Math.max(...notes);
    const passed = notes.filter(note => note >= 10).length; // Seuil de réussite à 10/20
    const failed = notes.filter(note => note < 10).length;
    const passRate = (passed / notes.length) * 100;

    return {
      average: Math.round(average * 100) / 100,
      min,
      max,
      passed,
      failed,
      passRate: Math.round(passRate * 100) / 100
    };
  }

  // ================= MÉTHODES NOTES EXAMENS POUR BULLETINS =================

  // Récupérer les notes d'un étudiant pour tous ses examens dans un trimestre
  async getStudentTrimestreGrades(studentId, trimestreId, filters = {}) {
    try {
      const params = new URLSearchParams({
        student_id: studentId,
        trimestre_id: trimestreId,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/students/${studentId}/trimestre-grades?${params}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des notes du trimestre');
    } catch (error) {
      console.error('Erreur récupération notes trimestre étudiant:', error);
      throw error;
    }
  }

  // Récupérer les moyennes par matière pour un étudiant dans un trimestre
  async getStudentSubjectAverages(studentId, trimestreId) {
    try {
      const response = await this.makeRequest(`/api/students/${studentId}/subject-averages`, {
        method: 'POST',
        body: JSON.stringify({ trimestre_id: trimestreId })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors du calcul des moyennes par matière');
    } catch (error) {
      console.error('Erreur calcul moyennes matières étudiant:', error);
      throw error;
    }
  }

  // Calculer automatiquement les notes de bulletin basées sur les examens
  async calculateBulletinGrades(studentId, trimestreId, calculationMethod = 'weighted_average') {
    try {
      const response = await this.makeRequest(`/api/bulletins/calculate-grades`, {
        method: 'POST',
        body: JSON.stringify({ 
          student_id: studentId, 
          trimestre_id: trimestreId,
          calculation_method: calculationMethod
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors du calcul des notes de bulletin');
    } catch (error) {
      console.error('Erreur calcul notes bulletin:', error);
      throw error;
    }
  }

  // Synchroniser les notes d'examens avec un bulletin existant
  async syncExamGradesToBulletin(bulletinId, options = {}) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}/sync-exam-grades`, {
        method: 'POST',
        body: JSON.stringify({
          force_recalculate: options.forceRecalculate || false,
          include_draft_exams: options.includeDraftExams || false,
          weight_by_coefficient: options.weightByCoefficient !== false
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la synchronisation avec les examens');
    } catch (error) {
      console.error('Erreur sync examens vers bulletin:', error);
      throw error;
    }
  }

  // Récupérer les notes d'un examen spécifique avec détails pour bulletin
  async getExamGradesForBulletin(examId, studentId = null) {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('student_id', studentId);
      params.append('include_bulletin_data', 'true');
      
      const response = await this.makeRequest(`/api/exams/${examId}/grades-bulletin?${params}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des notes pour bulletin');
    } catch (error) {
      console.error('Erreur récupération notes examen pour bulletin:', error);
      throw error;
    }
  }

  // Mettre à jour une note d'examen avec impact sur le bulletin
  async updateExamGradeWithBulletinSync(examId, gradeId, gradeData) {
    try {
      const response = await this.makeRequest(`/api/exams/${examId}/grades/${gradeId}/bulletin-sync`, {
        method: 'PUT',
        body: JSON.stringify({
          note: parseFloat(gradeData.note),
          appreciation: gradeData.appreciation || '',
          sync_to_bulletin: gradeData.syncToBulletin !== false,
          recalculate_bulletin: gradeData.recalculateBulletin !== false
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la mise à jour de la note');
    } catch (error) {
      console.error('Erreur mise à jour note avec sync bulletin:', error);
      throw error;
    }
  }

  // Calculer la moyenne générale d'un étudiant pour un trimestre
  async calculateStudentTrimestreAverage(studentId, trimestreId, options = {}) {
    try {
      const response = await this.makeRequest(`/api/students/${studentId}/trimestre-average`, {
        method: 'POST',
        body: JSON.stringify({ 
          trimestre_id: trimestreId,
          include_coefficient: options.includeCoefficient !== false,
          exclude_absent: options.excludeAbsent || false,
          minimum_grades_per_subject: options.minimumGradesPerSubject || 1
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors du calcul de la moyenne générale');
    } catch (error) {
      console.error('Erreur calcul moyenne générale étudiant:', error);
      throw error;
    }
  }

  // Récupérer l'historique des notes d'un étudiant pour toutes les matières
  async getStudentGradeHistory(studentId, filters = {}) {
    try {
      const params = new URLSearchParams({
        student_id: studentId,
        ...filters
      });
      
      const response = await this.makeRequest(`/api/students/${studentId}/grade-history?${params}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération de l\'historique des notes');
    } catch (error) {
      console.error('Erreur récupération historique notes étudiant:', error);
      throw error;
    }
  }

  // Exporter les notes d'examens formatées pour bulletin
  async exportExamGradesForBulletin(trimestreId, batchId = null, format = 'csv') {
    try {
      const params = new URLSearchParams({
        trimestre_id: trimestreId,
        format: format,
        include_averages: 'true'
      });
      
      if (batchId) params.append('batch_id', batchId);
      
      const response = await this.makeRequest(`/api/exams/export-bulletin-grades?${params}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de l\'export des notes');
    } catch (error) {
      console.error('Erreur export notes pour bulletin:', error);
      throw error;
    }
  }

  // Valider les notes avant intégration dans un bulletin
  async validateGradesForBulletin(studentId, trimestreId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/validate-grades`, {
        method: 'POST',
        body: JSON.stringify({ 
          student_id: studentId, 
          trimestre_id: trimestreId 
        })
      });
      
      if (response.status === 'success') {
        return { 
          success: true, 
          data: response.data,
          isValid: response.data.is_valid,
          errors: response.data.errors || [],
          warnings: response.data.warnings || []
        };
      }
      throw new Error(response.message || 'Erreur lors de la validation des notes');
    } catch (error) {
      console.error('Erreur validation notes pour bulletin:', error);
      throw error;
    }
  }

  // Obtenir les statistiques de notes par matière pour un trimestre
  async getSubjectGradeStatistics(subjectId, trimestreId, batchId = null) {
    try {
      const params = new URLSearchParams({
        subject_id: subjectId,
        trimestre_id: trimestreId
      });
      
      if (batchId) params.append('batch_id', batchId);
      
      const response = await this.makeRequest(`/api/subjects/${subjectId}/grade-statistics?${params}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
    } catch (error) {
      console.error('Erreur récupération statistiques notes matière:', error);
      throw error;
    }
  }

  // Méthodes utilitaires pour les notes de bulletin
  
  // Calculer la moyenne pondérée d'une liste de notes
  calculateWeightedAverage(grades, weights = null) {
    if (!grades || grades.length === 0) return 0;
    
    const validGrades = grades.filter(g => g !== null && g !== undefined && g >= 0);
    if (validGrades.length === 0) return 0;
    
    if (!weights || weights.length !== validGrades.length) {
      // Moyenne simple si pas de poids
      return validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
    }
    
    let totalWeightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < validGrades.length; i++) {
      totalWeightedSum += validGrades[i] * weights[i];
      totalWeight += weights[i];
    }
    
    return totalWeight > 0 ? totalWeightedSum / totalWeight : 0;
  }

  // Déterminer la mention basée sur une moyenne
  getGradeMention(average) {
    if (average >= 16) return { code: 'TB', label: 'Très Bien', color: 'success' };
    if (average >= 14) return { code: 'B', label: 'Bien', color: 'info' };
    if (average >= 12) return { code: 'AB', label: 'Assez Bien', color: 'warning' };
    if (average >= 10) return { code: 'P', label: 'Passable', color: 'default' };
    return { code: 'I', label: 'Insuffisant', color: 'error' };
  }

  // Formater une note pour affichage dans un bulletin
  formatGradeForBulletin(grade, maxGrade = 20, showFraction = true) {
    if (grade === null || grade === undefined || grade < 0) {
      return 'ABS';
    }
    
    const formattedGrade = Number(grade).toFixed(2);
    
    if (showFraction && maxGrade !== 20) {
      return `${formattedGrade}/${maxGrade}`;
    }
    
    return formattedGrade;
  }

  // ================== MÉTHODES BULLETINS =================
  
  // Récupérer la liste des trimestres
  async getTrimestres(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/api/trimestres?${queryParams}` : '/api/trimestres';
      
      const response = await this.makeRequest(url);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          count: response.count
        };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des trimestres');
    } catch (error) {
      console.error('Erreur récupération trimestres:', error);
      throw error;
    }
  }
  
  // Créer un nouveau trimestre
  async createTrimestre(trimestreData) {
    try {
      const response = await this.makeRequest('/api/trimestres', {
        method: 'POST',
        body: JSON.stringify(trimestreData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la création du trimestre');
    } catch (error) {
      console.error('Erreur création trimestre:', error);
      throw error;
    }
  }
  
  // Récupérer la liste des bulletins
  async getBulletins(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/api/bulletins?${queryParams}` : '/api/bulletins';
      
      const response = await this.makeRequest(url);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          count: response.count
        };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des bulletins');
    } catch (error) {
      console.error('Erreur récupération bulletins:', error);
      throw error;
    }
  }
  
  // Récupérer un bulletin spécifique
  async getBulletin(bulletinId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Bulletin non trouvé');
    } catch (error) {
      console.error('Erreur récupération bulletin:', error);
      throw error;
    }
  }
  
  // Créer un nouveau bulletin
  async createBulletin(bulletinData) {
    try {
      const response = await this.makeRequest('/api/bulletins', {
        method: 'POST',
        body: JSON.stringify(bulletinData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la création du bulletin');
    } catch (error) {
      console.error('Erreur création bulletin:', error);
      throw error;
    }
  }
  
  // Mettre à jour un bulletin
  async updateBulletin(bulletinId, bulletinData) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}`, {
        method: 'PUT',
        body: JSON.stringify(bulletinData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la mise à jour du bulletin');
    } catch (error) {
      console.error('Erreur mise à jour bulletin:', error);
      throw error;
    }
  }
  
  // Supprimer un bulletin
  async deleteBulletin(bulletinId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}`, {
        method: 'DELETE'
      });
      
      if (response.status === 'success') {
        return { success: true, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la suppression du bulletin');
    } catch (error) {
      console.error('Erreur suppression bulletin:', error);
      throw error;
    }
  }
  
  // Calculer les moyennes d'un bulletin
  async calculateBulletin(bulletinId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}/calculate`, {
        method: 'POST'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors du calcul du bulletin');
    } catch (error) {
      console.error('Erreur calcul bulletin:', error);
      throw error;
    }
  }
  
  // Valider un bulletin
  async validateBulletin(bulletinId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}/validate`, {
        method: 'POST'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la validation du bulletin');
    } catch (error) {
      console.error('Erreur validation bulletin:', error);
      throw error;
    }
  }
  
  // Générer des bulletins en lot
  async generateBulletinsBatch(batchId, trimestreId, options = {}) {
    try {
      const response = await this.makeRequest('/api/bulletins/generate-batch', {
        method: 'POST',
        body: JSON.stringify({ 
          batch_id: batchId, 
          trimestre_id: trimestreId,
          ...options
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la génération des bulletins');
    } catch (error) {
      console.error('Erreur génération bulletins:', error);
      throw error;
    }
  }
  
  // Récupérer les étudiants d'une classe
  async getStudentsByBatch(batchId) {
    try {
      const response = await this.makeRequest(`/api/batches/${batchId}/students`, {
        method: 'GET'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des étudiants');
    } catch (error) {
      console.error('Erreur récupération étudiants:', error);
      throw error;
    }
  }
  
  // Récupérer les examens/notes pour un bulletin
  async getBulletinExamData(studentId, trimestreId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/exam-data`, {
        method: 'POST',
        body: JSON.stringify({ 
          student_id: studentId, 
          trimestre_id: trimestreId 
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des données d\'examens');
    } catch (error) {
      console.error('Erreur récupération données examens bulletin:', error);
      throw error;
    }
  }

  // Récupérer les notes d'examens pour un étudiant dans un trimestre
  async getStudentExamGrades(studentId, trimestreId, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        student_id: studentId,
        trimestre_id: trimestreId,
        ...filters
      }).toString();
      
      const response = await this.makeRequest(`/api/students/${studentId}/exam-grades?${queryParams}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des notes d\'examens');
    } catch (error) {
      console.error('Erreur récupération notes examens étudiant:', error);
      throw error;
    }
  }

  // Calculer les moyennes par matière basées sur les examens
  async calculateSubjectAverages(studentId, trimestreId) {
    try {
      const response = await this.makeRequest('/api/bulletins/calculate-averages', {
        method: 'POST',
        body: JSON.stringify({ 
          student_id: studentId, 
          trimestre_id: trimestreId 
        })
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors du calcul des moyennes');
    } catch (error) {
      console.error('Erreur calcul moyennes matières:', error);
      throw error;
    }
  }

  // Récupérer tous les examens d'un trimestre pour une classe
  async getTrimestreExams(trimestreId, batchId = null) {
    try {
      const params = new URLSearchParams({ trimestre_id: trimestreId });
      if (batchId) params.append('batch_id', batchId);
      
      const response = await this.makeRequest(`/api/exams/trimestre?${params}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des examens du trimestre');
    } catch (error) {
      console.error('Erreur récupération examens trimestre:', error);
      throw error;
    }
  }
  
  // ================= MÉTHODES ÉVALUATIONS =================
  
  // Récupérer la liste des évaluations
  async getEvaluations(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/api/evaluations?${queryParams}` : '/api/evaluations';
      
      const response = await this.makeRequest(url);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          count: response.count
        };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des évaluations');
    } catch (error) {
      console.error('Erreur récupération évaluations:', error);
      throw error;
    }
  }
  
  // Récupérer une évaluation spécifique
  async getEvaluation(evaluationId) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Évaluation non trouvée');
    } catch (error) {
      console.error('Erreur récupération évaluation:', error);
      throw error;
    }
  }
  
  // Créer une nouvelle évaluation
  async createEvaluation(evaluationData) {
    try {
      const response = await this.makeRequest('/api/evaluations', {
        method: 'POST',
        body: JSON.stringify(evaluationData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la création de l\'évaluation');
    } catch (error) {
      console.error('Erreur création évaluation:', error);
      throw error;
    }
  }
  
  // Mettre à jour une évaluation
  async updateEvaluation(evaluationId, evaluationData) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}`, {
        method: 'PUT',
        body: JSON.stringify(evaluationData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la mise à jour de l\'évaluation');
    } catch (error) {
      console.error('Erreur mise à jour évaluation:', error);
      throw error;
    }
  }
  
  // Supprimer une évaluation
  async deleteEvaluation(evaluationId) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}`, {
        method: 'DELETE'
      });
      
      if (response.status === 'success') {
        return { success: true, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la suppression de l\'évaluation');
    } catch (error) {
      console.error('Erreur suppression évaluation:', error);
      throw error;
    }
  }
  
  // Démarrer une évaluation
  async startEvaluation(evaluationId) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}/start`, {
        method: 'POST'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors du démarrage de l\'évaluation');
    } catch (error) {
      console.error('Erreur démarrage évaluation:', error);
      throw error;
    }
  }
  
  // Terminer une évaluation
  async completeEvaluation(evaluationId) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}/complete`, {
        method: 'POST'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la completion de l\'évaluation');
    } catch (error) {
      console.error('Erreur completion évaluation:', error);
      throw error;
    }
  }
  
  // Récupérer les notes d'une évaluation
  async getEvaluationNotes(evaluationId) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}/notes`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la récupération des notes');
    } catch (error) {
      console.error('Erreur récupération notes évaluation:', error);
      throw error;
    }
  }
  
  // Créer ou mettre à jour une note d'évaluation
  async createEvaluationNote(evaluationId, noteData) {
    try {
      const response = await this.makeRequest(`/api/evaluations/${evaluationId}/notes`, {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de l\'enregistrement de la note');
    } catch (error) {
      console.error('Erreur création note évaluation:', error);
      throw error;
    }
  }
  
  // ================= MÉTHODES UTILITAIRES BULLETINS =================
  
  // Calculer les statistiques d'un bulletin
  calculateBulletinStatistics(bulletinData) {
    if (!bulletinData || !bulletinData.bulletin_lines) {
      return {
        moyenneGenerale: 0,
        nombreMatieres: 0,
        meilleureNote: 0,
        moyenneNote: 0,
        totalPoints: 0,
        totalCoefficients: 0
      };
    }
    
    const notes = bulletinData.bulletin_lines.map(line => line.moyenne_matiere || 0);
    const coefficients = bulletinData.bulletin_lines.map(line => line.coefficient || 1);
    
    let totalPoints = 0;
    let totalCoefficients = 0;
    
    for (let i = 0; i < notes.length; i++) {
      totalPoints += notes[i] * coefficients[i];
      totalCoefficients += coefficients[i];
    }
    
    const moyenneGenerale = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
    
    return {
      moyenneGenerale: parseFloat(moyenneGenerale.toFixed(2)),
      nombreMatieres: notes.length,
      meilleureNote: notes.length > 0 ? Math.max(...notes) : 0,
      moyenneNote: notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0,
      totalPoints: parseFloat(totalPoints.toFixed(2)),
      totalCoefficients: totalCoefficients
    };
  }
  
  // Obtenir le badge de couleur pour une moyenne
  getBulletinGradeBadge(moyenne) {
    if (moyenne >= 16) return { color: 'success', text: 'Très Bien' };
    if (moyenne >= 14) return { color: 'info', text: 'Bien' };
    if (moyenne >= 12) return { color: 'warning', text: 'Assez Bien' };
    if (moyenne >= 10) return { color: 'secondary', text: 'Passable' };
    return { color: 'error', text: 'Insuffisant' };
  }
  
  // Valider les données d'un bulletin
  validateBulletinData(bulletinData) {
    const errors = [];
    
    if (!bulletinData.student_id) {
      errors.push('L\'étudiant est requis');
    }
    
    if (!bulletinData.trimestre_id) {
      errors.push('Le trimestre est requis');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Valider les données d'une évaluation
  validateEvaluationData(evaluationData) {
    const errors = [];
    
    if (!evaluationData.name || evaluationData.name.trim() === '') {
      errors.push('Le nom de l\'évaluation est requis');
    }
    
    if (!evaluationData.evaluation_type_id) {
      errors.push('Le type d\'évaluation est requis');
    }
    
    if (!evaluationData.subject_id) {
      errors.push('La matière est requise');
    }
    
    if (!evaluationData.batch_id) {
      errors.push('La classe est requise');
    }
    
    if (!evaluationData.date) {
      errors.push('La date est requise');
    }
    
    if (evaluationData.max_marks && (evaluationData.max_marks < 1 || evaluationData.max_marks > 100)) {
      errors.push('La note maximale doit être entre 1 et 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Formatter une date pour l'affichage des bulletins
  formatBulletinDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Erreur format date bulletin:', error);
      return dateString;
    }
  }

  // Publier un bulletin
  async publishBulletin(bulletinId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}/publish`, {
        method: 'POST'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la publication du bulletin');
    } catch (error) {
      console.error('Erreur publication bulletin:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des bulletins pour le dashboard
  async getBulletinStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/api/bulletins/stats?${queryParams}` : '/api/bulletins/stats';
      
      const response = await this.makeRequest(url);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      
      // Si l'endpoint n'existe pas encore, calculer les stats côté client
      console.warn('Endpoint /api/bulletins/stats non disponible, calcul côté client');
      return { success: false, message: 'Stats API non disponible' };
      
    } catch (error) {
      console.error('Erreur récupération stats bulletins:', error);
      return { success: false, message: error.message };
    }
  }

  // Récupérer les moyennes par matière
  async getSubjectAverages(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/api/bulletins/subject-averages?${queryParams}` : '/api/bulletins/subject-averages';
      
      const response = await this.makeRequest(url);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      
      // Si l'endpoint n'existe pas, essayer de calculer depuis les examens
      console.warn('Endpoint /api/bulletins/subject-averages non disponible, tentative via examens');
      return await this.calculateSubjectAveragesFromExams(filters);
      
    } catch (error) {
      console.error('Erreur récupération moyennes matières:', error);
      return { success: false, data: [] };
    }
  }

  // Calculer les moyennes par matière à partir des examens (fallback)
  async calculateSubjectAveragesFromExams(filters = {}) {
    try {
      const examsRes = await this.getExams(1, 1000, '', filters);
      
      if (!examsRes.success || !Array.isArray(examsRes.data)) {
        return { success: false, data: [] };
      }
      
      const subjectStats = {};
      
      for (const exam of examsRes.data) {
        if (exam.subject_name && exam.state === 'done') {
          const gradesRes = await this.getExamGrades(exam.id);
          
          if (gradesRes.success && Array.isArray(gradesRes.data)) {
            const notes = gradesRes.data
              .map(g => g.note)
              .filter(n => n && n > 0);
            
            if (notes.length > 0) {
              const average = notes.reduce((sum, note) => sum + note, 0) / notes.length;
              
              if (!subjectStats[exam.subject_name]) {
                subjectStats[exam.subject_name] = {
                  subject: exam.subject_name,
                  total_notes: 0,
                  sum_notes: 0,
                  total_exams: 0
                };
              }
              
              subjectStats[exam.subject_name].total_notes += notes.length;
              subjectStats[exam.subject_name].sum_notes += notes.reduce((sum, note) => sum + note, 0);
              subjectStats[exam.subject_name].total_exams += 1;
            }
          }
        }
      }
      
      const subjectAverages = Object.values(subjectStats).map(stat => ({
        subject: stat.subject,
        average: stat.total_notes > 0 ? stat.sum_notes / stat.total_notes : 0,
        total_exams: stat.total_exams
      }));
      
      return { success: true, data: subjectAverages };
      
    } catch (error) {
      console.error('Erreur calcul moyennes matières depuis examens:', error);
      return { success: false, data: [] };
    }
  }

  // Générer des bulletins pour un lot d'étudiants

  // Télécharger un bulletin en PDF
  async getBulletinPDF(bulletinId) {
    try {
      console.log('🔍 Demande de téléchargement PDF pour bulletin:', bulletinId);
      
      // Utiliser directement notre endpoint API qui fonctionne
      const response = await fetch(`${this.getBaseUrl()}/api/bulletins/${bulletinId}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/pdf')) {
        // C'est un PDF - le télécharger directement
        const blob = await response.blob();
        
        // Créer un lien de téléchargement temporaire
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bulletin_${bulletinId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        console.log('✅ PDF téléchargé avec succès');
        return { 
          success: true, 
          message: 'PDF téléchargé avec succès'
        };
      } else {
        // C'est probablement une réponse JSON avec une URL ou un message d'erreur
        const jsonResponse = await response.json();
        
        if (jsonResponse.status === 'error') {
          throw new Error(jsonResponse.message || 'Erreur lors de la génération du PDF');
        }
        
        // Si l'API retourne une URL de téléchargement
        if (jsonResponse.data && jsonResponse.data.download_url) {
          const pdfUrl = `${this.getBaseUrl()}${jsonResponse.data.download_url}`;
          window.open(pdfUrl, '_blank');
          return { success: true, message: 'PDF ouvert dans un nouvel onglet' };
        }
        
        throw new Error('Format de réponse non reconnu');
      }
      
    } catch (error) {
      console.error('❌ Erreur téléchargement PDF bulletin:', error);
      
      // Fallback: essayer d'ouvrir notre endpoint directement dans le navigateur
      try {
        const fallbackUrl = `${this.getBaseUrl()}/api/bulletins/${bulletinId}/pdf`;
        window.open(fallbackUrl, '_blank');
        console.log('⚠️ Utilisation du mode fallback - ouverture dans un nouvel onglet');
        return { 
          success: true, 
          message: 'PDF ouvert dans un nouvel onglet (mode fallback)' 
        };
      } catch (fallbackError) {
        console.error('❌ Erreur fallback PDF:', fallbackError);
        throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
      }
    }
  }

  // Archiver un bulletin
  async archiveBulletin(bulletinId) {
    try {
      const response = await this.makeRequest(`/api/bulletins/${bulletinId}/archive`, {
        method: 'POST'
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de l\'archivage du bulletin');
    } catch (error) {
      console.error('Erreur archivage bulletin:', error);
      throw error;
    }
  }

  // Méthode utilitaire pour créer des présences synchronisées avec la session
  async createSynchronizedAttendances(sessionId, attendanceData) {
    try {
      // Récupérer d'abord les informations de la session
      const sessionInfo = await this.getSession(sessionId);
      
      if (sessionInfo && sessionInfo.status === 'success') {
        const session = sessionInfo.data;
        let sessionDate = null;
        
        // Déterminer la date de la session
        if (session.start_datetime) {
          sessionDate = new Date(session.start_datetime).toISOString().split('T')[0];
        } else if (session.date) {
          sessionDate = session.date;
        } else {
          // Utiliser la date d'aujourd'hui par défaut
          sessionDate = new Date().toISOString().split('T')[0];
        }
        
        console.log(`📅 createSynchronizedAttendances: Utilisation de la date ${sessionDate} pour la session ${sessionId}`);
        
        // Formater les données avec la date de la session
        const formattedAttendances = attendanceData.map(attendance => ({
          ...attendance,
          session_id: sessionId,
          date: sessionDate // Assurer la synchronisation avec la date de session
        }));
        
        // Créer les présences via l'endpoint bulk-create
        return await this.bulkCreateAttendances(formattedAttendances);
      } else {
        throw new Error('Impossible de récupérer les informations de la session');
      }
    } catch (error) {
      console.error('Erreur lors de la création des présences synchronisées:', error);
      throw error;
    }
  }

  // Méthode pour récupérer les présences avec date automatique de session
  async getSessionAttendancesWithSyncDate(sessionId) {
    try {
      // Récupérer d'abord les informations de la session
      const sessionInfo = await this.getSession(sessionId);
      
      if (sessionInfo && sessionInfo.status === 'success') {
        const session = sessionInfo.data;
        let sessionDate = null;
        
        // Déterminer la date de la session
        if (session.start_datetime) {
          sessionDate = new Date(session.start_datetime).toISOString().split('T')[0];
        } else if (session.date) {
          sessionDate = session.date;
        }
        
        console.log(`📅 getSessionAttendancesWithSyncDate: Récupération pour la date ${sessionDate}`);
        
        // Récupérer les présences pour cette date spécifique
        return await this.makeRequest(`/api/attendances/session/${sessionId}${sessionDate ? `?date=${sessionDate}` : ''}`);
      } else {
        // Fallback : récupérer sans date spécifique
        return await this.makeRequest(`/api/attendances/session/${sessionId}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des présences synchronisées:', error);
      throw error;
    }
  }

  // ===== MÉTHODES TIMETABLES =====
  
  // Récupérer la liste des emplois du temps
  async getTimetables(page = 1, limit = 20, search = '', filters = {}) {
    try {
      // Construire les paramètres de façon sécurisée
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('search', String(search));
      
      // Ajouter les filtres un par un pour éviter [object Object]
      if (filters && typeof filters === 'object') {
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await this.makeRequest(`/api/timetables?${params}`);
      
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data.timetables || [],
          pagination: response.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            pages: 1
          }
        };
      }
      
      throw new Error(response.message || 'Erreur lors de la récupération des emplois du temps');
    } catch (error) {
      console.error('Erreur getTimetables:', error);
      throw error;
    }
  }

  // Récupérer tous les emplois du temps
  async getAllTimetables() {
    try {
      const response = await this.getTimetables(1, 1000); // Récupérer un grand nombre
      return response.data || [];
    } catch (error) {
      console.error('Erreur getAllTimetables:', error);
      return [];
    }
  }

  // Créer un nouvel emploi du temps
  async createTimetable(timetableData) {
    try {
      const response = await this.makeRequest('/api/timetables', {
        method: 'POST',
        body: JSON.stringify(timetableData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la création de l\'emploi du temps');
    } catch (error) {
      console.error('Erreur createTimetable:', error);
      throw error;
    }
  }

  // Récupérer un emploi du temps spécifique
  async getTimetable(id) {
    try {
      const response = await this.makeRequest(`/api/timetables/${id}`);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Emploi du temps non trouvé');
    } catch (error) {
      console.error('Erreur getTimetable:', error);
      throw error;
    }
  }

  // Mettre à jour un emploi du temps
  async updateTimetable(id, timetableData) {
    try {
      const response = await this.makeRequest(`/api/timetables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(timetableData)
      });
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Erreur lors de la mise à jour de l\'emploi du temps');
    } catch (error) {
      console.error('Erreur updateTimetable:', error);
      throw error;
    }
  }

  // Supprimer un emploi du temps
  async deleteTimetable(id) {
    try {
      const response = await this.makeRequest(`/api/timetables/${id}`, {
        method: 'DELETE'
      });
      
      if (response.status === 'success') {
        return { success: true, message: response.message };
      }
      throw new Error(response.message || 'Erreur lors de la suppression de l\'emploi du temps');
    } catch (error) {
      console.error('Erreur deleteTimetable:', error);
      throw error;
    }
  }

  // Méthodes utilitaires pour les emplois du temps
  formatTimetableSlot(slot) {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    return {
      ...slot,
      day_name: days[slot.day_of_week] || 'Inconnu',
      time_range: `${slot.start_time} - ${slot.end_time}`,
      subject_name: slot.subject ? slot.subject.name : 'Non défini',
      faculty_name: slot.faculty ? slot.faculty.name : 'Non assigné'
    };
  }

  getTimetableStateBadge(state) {
    const badges = {
      'active': { text: 'Actif', class: 'badge-success' },
      'draft': { text: 'Brouillon', class: 'badge-warning' },
      'archived': { text: 'Archivé', class: 'badge-secondary' },
      'cancelled': { text: 'Annulé', class: 'badge-danger' }
    };
    
    return badges[state] || { text: state, class: 'badge-info' };
  }

  validateTimetableData(timetableData) {
    const errors = [];
    
    if (!timetableData.name || timetableData.name.trim() === '') {
      errors.push('Le nom de l\'emploi du temps est requis');
    }
    
    if (!timetableData.batch || !timetableData.batch.id) {
      errors.push('La classe est requise');
    }
    
    if (!timetableData.start_date) {
      errors.push('La date de début est requise');
    }
    
    if (!timetableData.end_date) {
      errors.push('La date de fin est requise');
    }
    
    if (timetableData.start_date && timetableData.end_date) {
      const startDate = new Date(timetableData.start_date);
      const endDate = new Date(timetableData.end_date);
      
      if (startDate >= endDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ===== FIN MÉTHODES TIMETABLES =====

  // ===== MÉTHODES TIMETABLES =====

  // Récupérer les données académiques (années et semestres)
  async getAcademicData() {
    try {
      const response = await this.makeRequest('/api/academic-data');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des données académiques:', error);
      throw error;
    }
  }
}

// Exporter une instance unique
const odooApi = new OdooAPI();
export default odooApi; 