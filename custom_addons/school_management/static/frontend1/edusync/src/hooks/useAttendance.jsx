// src/hooks/useAttendance.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import odooApi from '../services/odooApi.jsx';

// Hook pour les présences avec pagination et filtres
export const useAttendances = (initialFilters = {}, page = 1, limit = 50) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(page);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useAttendances: Récupération avec filtres:', filters);
      
      const result = await odooApi.getAttendances(currentPage, limit, '', filters);
      console.log('🔍 useAttendances: Résultat API reçu:', result);
      
      // CORRECTION: Traiter le format correct {status: 'success', data: [...], pagination: {...}}
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        // Transformer pour l'interface attendue par le composant
        const transformedData = {
          attendances: result.data,
          pagination: result.pagination || {}
        };
        
        console.log('🔍 useAttendances: Données transformées:', transformedData);
        setData(transformedData);
        setError(null);
      } else {
        console.log('🔍 useAttendances: Format de données inattendu:', result);
        throw new Error('Format de données inattendu');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des présences:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentPage, limit, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Retour à la première page lors d'un changement de filtre
  }, []);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (data?.pagination?.has_next) {
      setCurrentPage(prev => prev + 1);
    }
  }, [data]);

  const prevPage = useCallback(() => {
    if (data?.pagination?.has_prev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [data]);

  return { 
    data, 
    loading, 
    error, 
    filters,
    currentPage,
    refetch: fetchData,
    updateFilters,
    goToPage,
    nextPage,
    prevPage
  };
};

// Hook pour les rapports de présence
export const useAttendanceReports = (reportType = 'summary', initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useAttendanceReports: Type ${reportType}, Filtres:`, filters);
      
      const result = await odooApi.getAttendanceReports(reportType, filters);
      
      if (result) {
        setData(result);
        setError(null);
      } else {
        throw new Error('Données non reçues');
      }
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, reportType, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return { 
    data, 
    loading, 
    error, 
    filters,
    refetch: fetchData,
    updateFilters
  };
};

// Hook pour les présences d'une session spécifique
export const useSessionAttendances = (sessionId, date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useSessionAttendances: Session ${sessionId}, Date: ${date}`);
      
      // Utiliser l'API centralisée au lieu d'un appel fetch hardcodé
      const url = `/api/attendances/session/${sessionId}${date ? `?date=${date}` : ''}`;
      console.log(`🔍 useSessionAttendances: Appel de l'endpoint via odooApi: ${url}`);
      
      const result = await odooApi.makeRequest(url);
      console.log(`🔍 useSessionAttendances: Résultat de l'API:`, result);
      
      if (result && result.status === 'success' && result.data) {
        setData(result.data);
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des données');
      }
    } catch (err) {
      console.error(`❌ Erreur lors de la récupération des données de la session ${sessionId}:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, date]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  // Destructurer les données pour fournir l'interface attendue par le composant
  const attendances = data?.students || [];
  const session = data?.session || null;
  const statistics = data?.statistics || {};

  return { 
    attendances,
    session,
    statistics,
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour les présences d'un étudiant
export const useStudentAttendances = (studentId, initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id || !studentId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useStudentAttendances: Étudiant ${studentId}, Filtres:`, filters);
      
      const result = await odooApi.getAttendancesByStudent(studentId, filters);
      
      if (result) {
        setData(result);
        setError(null);
      } else {
        throw new Error('Données non reçues');
      }
    } catch (err) {
      console.error(`Erreur lors de la récupération des présences de l'étudiant ${studentId}:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, studentId, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return { 
    data, 
    loading, 
    error, 
    filters,
    refetch: fetchData,
    updateFilters
  };
};

// Hook pour les sessions avec pagination et filtres
export const useSessions = (initialFilters = {}, page = 1, limit = 20) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Utiliser directement initialFilters au lieu d'un état interne
  // Stabiliser les filtres pour éviter les re-renders inutiles
  const stableFilters = useMemo(() => {
    return JSON.stringify(initialFilters);
  }, [JSON.stringify(initialFilters)]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = JSON.parse(stableFilters);
      console.log('🔍 useSessions: Récupération avec filtres:', filters, forceRefresh ? '(FORCE REFRESH)' : '');
      
      const result = await odooApi.getSessions(currentPage, limit, '', filters);
      
      console.log('🔍 useSessions: Résultat brut de l\'API:', result);
      
      // Vérifier si c'est une erreur d'authentification
      if (result && result.status === 'error' && result.code === 401) {
        console.log('❌ useSessions: Erreur d\'authentification détectée');
        setError('Session expirée. Veuillez vous reconnecter.');
        setData(null);
        return;
      }
      
      // Vérifier si c'est une erreur générale
      if (result && result.status === 'error') {
        console.log('❌ useSessions: Erreur de l\'API:', result.message);
        setError(result.message || 'Erreur lors de la récupération des sessions');
        setData(null);
        return;
      }
      
      // Traitement correct de la structure de données de l'API
      if (result && result.status === 'success' && result.data && result.data.sessions) {
        console.log('✅ useSessions: Structure API success détectée -', result.data.sessions.length, 'sessions');
        setData(result.data);
        setError(null);
      } else if (result && result.sessions && Array.isArray(result.sessions)) {
        console.log('✅ useSessions: Structure sessions directe détectée -', result.sessions.length, 'sessions');
        setData(result);
        setError(null);
      } else if (result && Array.isArray(result)) {
        // Cas où l'API retourne directement un array de sessions
        console.log('✅ useSessions: Array de sessions détecté directement -', result.length, 'sessions');
        setData({ sessions: result, pagination: {} });
        setError(null);
      } else {
        console.log('❌ useSessions: Structure sessions manquante, result:', result);
        setError('Format de données inattendu - aucune session trouvée');
        setData(null);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des sessions:', err);
      
      // Gérer spécifiquement les erreurs d'authentification
      if (err.message.includes('Session expirée') || err.message.includes('401')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.message.includes('Impossible de joindre le serveur')) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setError(err.message || 'Erreur lors de la récupération des sessions');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, stableFilters]);

  // Fonction de rafraîchissement simple
  const refetch = useCallback((forceRefresh = true) => {
    console.log('🔄 useSessions: Rafraîchissement manuel demandé', forceRefresh ? '(FORCE)' : '');
    if (forceRefresh) {
      fetchData(true);
    } else {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [fetchData]);

  const goToPage = useCallback((page) => {
    console.log('📄 useSessions: Navigation vers page:', page);
    setCurrentPage(page);
  }, []);

  // Effet principal pour charger les données
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  return { 
    data, 
    loading, 
    error, 
    filters: JSON.parse(stableFilters),
    currentPage,
    refetch,
    goToPage
  };
};

// Hook pour les statistiques de présence - VERSION CORRIGÉE
export const useAttendanceStatistics = (initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Stabiliser les filtres pour éviter les re-renders inutiles - VERSION CORRIGÉE
  const stableFilters = useMemo(() => {
    return JSON.stringify(initialFilters);
  }, [JSON.stringify(initialFilters)]);

  const fetchData = useCallback(async () => {
    console.log('🔍 DEBUG useAttendanceStatistics: Début fetchData');
    
    try {
      setLoading(true);
      setError(null);
      
      const parsedFilters = JSON.parse(stableFilters);
      console.log('🔍 DEBUG useAttendanceStatistics: Récupération avec filtres:', parsedFilters);
      
      // Utiliser l'API centralisée
      const result = await odooApi.getAttendanceStatistics(parsedFilters);
      
      console.log('🔍 DEBUG useAttendanceStatistics: Résultat API brut:', result);
      
      // CORRECTION MAJEURE: Traiter le format correct de l'API {status: 'success', data: {...}}
      if (result && result.status === 'success') {
        // L'API retourne {status: 'success', data: {global_statistics: {...}, by_date: {...}, ...}}
        const finalData = result.data;
        console.log('🔍 DEBUG useAttendanceStatistics: Données extraites:', finalData);
        console.log('🔍 DEBUG useAttendanceStatistics: global_statistics disponible:', !!finalData?.global_statistics);
        setData(finalData);
        setError(null);
      } else if (result && result.data) {
        // Format alternatif
        console.log('🔍 DEBUG useAttendanceStatistics: Format alternatif détecté');
        setData(result.data);
        setError(null);
      } else {
        console.log('🔍 DEBUG useAttendanceStatistics: Réponse non réussie:', result);
        setData(null);
        setError(result?.message || 'Aucune donnée disponible');
      }
    } catch (err) {
      console.error('❌ DEBUG useAttendanceStatistics: Erreur:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [stableFilters]); // Utiliser stableFilters comme dépendance

  useEffect(() => {
    console.log('🔍 DEBUG useAttendanceStatistics: useEffect déclenché');
    let isMounted = true;
    
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchData();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    // Simplification : déléguer cette responsabilité au composant parent
    console.log('🔄 updateFilters appelé avec:', newFilters);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    filters: JSON.parse(stableFilters),
    refetch: fetchData,
    updateFilters
  };
};

// Hook pour les sessions d'aujourd'hui - VERSION CORRIGÉE
export const useTodaySessions = (initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Stabiliser les filtres pour éviter les re-renders inutiles - VERSION CORRIGÉE
  const stableFilters = useMemo(() => {
    return JSON.stringify(initialFilters);
  }, [JSON.stringify(initialFilters)]);

  const fetchData = useCallback(async () => {
    console.log('🔍 DEBUG useTodaySessions: Début fetchData');
    
    try {
      setLoading(true);
      setError(null);
      
      const parsedFilters = JSON.parse(stableFilters);
      console.log('🔍 DEBUG useTodaySessions: Récupération des sessions d\'aujourd\'hui avec filtres:', parsedFilters);
      
      // Utiliser l'API centralisée au lieu de fetch direct
      const result = await odooApi.getTodaySessions(parsedFilters);
      
      console.log('🔍 DEBUG useTodaySessions: Résultat API:', result);
      
      // CORRECTION : L'API retourne {status: 'success', sessions: [...]} directement
      if (result && result.status === 'success' && result.sessions) {
        console.log('🔍 DEBUG useTodaySessions: Sessions stockées:', result.sessions);
        setData(result.sessions);
        setError(null);
      } else if (result && result.data && result.data.sessions) {
        // Format alternatif de réponse (pour compatibilité)
        console.log('🔍 DEBUG useTodaySessions: Format alternatif - sessions stockées:', result.data.sessions);
        setData(result.data.sessions);
        setError(null);
      } else {
        console.log('🔍 DEBUG useTodaySessions: Aucune session trouvée');
        setData([]);
        setError(null);
      }
    } catch (err) {
      console.error('❌ DEBUG useTodaySessions: Erreur:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [stableFilters]); // Utiliser stableFilters comme dépendance

  useEffect(() => {
    console.log('🔍 DEBUG useTodaySessions: useEffect déclenché');
    let isMounted = true;
    
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchData();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchData]);

  return { 
    data: data || [], 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour les sessions à venir
export const useUpcomingSessions = (initialFilters = {}, days = 7) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useUpcomingSessions: Récupération des sessions à venir');
      
      const result = await odooApi.getUpcomingSessions(initialFilters, days);
      
      if (result && result.sessions) {
        setData(result.sessions);
        setError(null);
      } else {
        throw new Error('Format de données inattendu');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des sessions à venir:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, initialFilters, days]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour les actions de présence (CRUD)
export const useAttendanceActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Enregistrer les présences en masse
  const bulkSaveAttendances = useCallback(async (attendanceData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 bulkSaveAttendances: Données reçues:', attendanceData);
      
      // Vérifier que c'est un tableau
      if (!Array.isArray(attendanceData)) {
        throw new Error('Les données de présence doivent être un tableau');
      }
      
      // Valider et formater chaque élément du tableau
      const validatedData = [];
      for (let i = 0; i < attendanceData.length; i++) {
        const item = attendanceData[i];
        
        // Valider chaque élément individuellement
        const validation = odooApi.validateAttendanceData(item);
        if (!validation.isValid) {
          throw new Error(`Élément ${i + 1}: ${validation.errors.join(', ')}`);
        }
        
        // Formater les données avec les bons types
        const formattedItem = {
          student_id: parseInt(item.student_id),
          session_id: parseInt(item.session_id),
          date: item.date,
          state: item.state,
          remarks: item.remarks || ''
        };
        
        validatedData.push(formattedItem);
      }
      
      console.log('💾 bulkSaveAttendances: Données validées et formatées:', validatedData);
      
      const result = await odooApi.bulkCreateAttendances(validatedData);
      
      console.log('✅ bulkSaveAttendances: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ bulkSaveAttendances: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une présence individuelle
  const updateAttendance = useCallback(async (attendanceId, attendanceData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`💾 updateAttendance: ID ${attendanceId}, Données:`, attendanceData);
      
      const result = await odooApi.updateAttendance(attendanceId, attendanceData);
      
      console.log('✅ updateAttendance: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ updateAttendance: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une présence
  const deleteAttendance = useCallback(async (attendanceId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🗑️ deleteAttendance: ID ${attendanceId}`);
      
      const result = await odooApi.deleteAttendance(attendanceId);
      
      console.log('✅ deleteAttendance: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ deleteAttendance: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer tous présents
  const markAllPresent = useCallback(async (sessionId, studentIds, date) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`✅ markAllPresent: Session ${sessionId}, ${studentIds.length} étudiants`);
      
      const result = await odooApi.markAllPresent(sessionId, studentIds, date);
      
      console.log('✅ markAllPresent: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ markAllPresent: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer tous absents
  const markAllAbsent = useCallback(async (sessionId, studentIds, date) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`❌ markAllAbsent: Session ${sessionId}, ${studentIds.length} étudiants`);
      
      const result = await odooApi.markAllAbsent(sessionId, studentIds, date);
      
      console.log('✅ markAllAbsent: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ markAllAbsent: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Présence rapide
  const quickAttendance = useCallback(async (studentId, sessionId, state, date, remarks) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`⚡ quickAttendance: Étudiant ${studentId}, État ${state}`);
      
      const result = await odooApi.quickAttendance(studentId, sessionId, state, date, remarks);
      
      console.log('✅ quickAttendance: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ quickAttendance: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    bulkSaveAttendances,
    updateAttendance,
    deleteAttendance,
    markAllPresent,
    markAllAbsent,
    quickAttendance
  };
};

// Hook pour les actions de session (CRUD)
export const useSessionActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Créer une session
  const createSession = useCallback(async (sessionData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 createSession: Données reçues:', sessionData);
      
      // Valider les données côté client
      const validation = odooApi.validateSessionData(sessionData);
      console.log('🔍 createSession: Résultat validation:', validation);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        console.log('❌ createSession: Validation échouée:', errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('📡 createSession: Appel API avec données validées');
      const result = await odooApi.createSession(sessionData);
      
      console.log('✅ createSession: Réponse API:', result);
      
      // Vérifier le format de la réponse
      if (result && result.status === 'success') {
        console.log('🎉 createSession: Session créée avec succès, ID:', result.data?.id);
        return { success: true, data: result.data, message: result.message };
      } else if (result && result.status === 'error') {
        console.log('❌ createSession: Erreur API:', result.message);
        setError(result.message);
        return { success: false, error: result.message };
      } else {
        console.log('⚠️ createSession: Format de réponse inattendu:', result);
        const errorMsg = 'Format de réponse inattendu du serveur';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
    } catch (err) {
      console.error('💥 createSession: Exception capturée:', err);
      const errorMessage = err.message || 'Erreur lors de la création de la session';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une session
  const updateSession = useCallback(async (sessionId, sessionData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`💾 updateSession: ID ${sessionId}, Données:`, sessionData);
      
      // Valider les données
      const validation = odooApi.validateSessionData(sessionData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        console.log('❌ updateSession: Validation échouée:', errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await odooApi.updateSession(sessionId, sessionData);
      
      console.log('✅ updateSession: Succès:', result);
      
      if (result && result.status === 'success') {
        return { success: true, data: result.data, message: result.message };
      } else {
        const errorMsg = result?.message || 'Erreur lors de la mise à jour';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
    } catch (err) {
      console.error('❌ updateSession: Erreur:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la session';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🗑️ deleteSession: ID ${sessionId}`);
      
      const result = await odooApi.deleteSession(sessionId);
      
      console.log('✅ deleteSession: Succès:', result);
      
      if (result && result.status === 'success') {
        return { success: true, message: result.message };
      } else {
        const errorMsg = result?.message || 'Erreur lors de la suppression';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
    } catch (err) {
      console.error('❌ deleteSession: Erreur:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression de la session';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    clearError
  };
};

// Hook pour l'export de données
export const useAttendanceExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportAttendances = useCallback(async (format = 'csv', filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📤 exportAttendances: Format ${format}, Filtres:`, filters);
      
      const result = await odooApi.exportAttendances(format, filters);
      
      console.log('✅ exportAttendances: Succès:', result);
      return result;
    } catch (err) {
      console.error('❌ exportAttendances: Erreur:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportAttendances
  };
};