// src/hooks/useOdoo.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import odooApi from '../services/odooApi.jsx';

// Hook générique pour récupérer des données depuis Odoo avec pagination
const useOdooData = (endpoint, options = {}) => {
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
      
      const result = await odooApi.makeRequest(endpoint);
      
      if (result && result.status === 'success') {
        setData(result.data || result);
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des données');
      }
    } catch (err) {
      console.error(`Erreur lors de la récupération de ${endpoint}:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint, user?.id]);

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

// Hook pour les étudiants (tableau de bord)
const useStudents = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    console.log('🔍 useStudents: fetchData appelé');
    console.log('🔍 useStudents: user:', user);
    console.log('🔍 useStudents: user?.id:', user?.id);
    
    if (!user?.id) {
      console.log('⚠️ useStudents: Pas d\'utilisateur connecté ou pas d\'ID');
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useStudents: Appel de odooApi.getStudents...');
      
      // Utiliser l'endpoint principal des étudiants au lieu du dashboard
      const result = await odooApi.getStudents(1, 1000); // Récupérer tous les étudiants
      
      console.log('🔍 useStudents: Résultat reçu:', result);
      
      if (result && result.students) {
        // La méthode getStudents retourne {students: [], pagination: {}}
        console.log('✅ useStudents: Étudiants trouvés:', result.students.length);
        setData(result.students || []);
        setError(null);
      } else {
        console.error('❌ useStudents: Pas de propriété students dans la réponse:', result);
        throw new Error(result?.message || 'Erreur lors de la récupération des étudiants');
      }
    } catch (err) {
      console.error('❌ useStudents: Erreur lors de la récupération des étudiants:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('🔍 useStudents: useEffect déclenché');
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

// Hook pour les classes (tableau de bord)
const useClasses = () => {
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
      
      // Utiliser l'endpoint principal des batches au lieu du dashboard
      const result = await odooApi.getBatches(1, 1000); // Récupérer tous les batches
      
      if (result && result.batches) {
        setData(result.batches || []);
        setError(null);
      } else if (result && result.status === 'success') {
        setData(result.data?.batches || []);
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des classes');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des classes:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

// Hook pour les enseignants (simple liste)
const useTeachers = () => {
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
      
      // Utiliser l'endpoint des enseignants avec pagination élevée
      const response = await odooApi.getTeachers({
        page: 1,
        limit: 1000,
        search: '',
        order: 'name asc'
      });
      
      if (response.status === 'success') {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des enseignants');
      }
    } catch (err) {
      console.error('Erreur useTeachers:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour les notes (tableau de bord)
const useGrades = () => {
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
      
      const result = await odooApi.makeRequest('/api/dashboard/grades');
      
      if (result && result.status === 'success') {
        setData(result.data || {});
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des notes');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des notes:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

// Hook pour les statistiques (tableau de bord)
const useStatistics = () => {
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
      
      const result = await odooApi.makeRequest('/api/dashboard/statistics');
      
      if (result && result.status === 'success') {
        setData(result.data || {});
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

// Hook pour les promotions/batches
const useBatches = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    console.log('🔍 useBatches: Début du fetchData');
    console.log('🔍 useBatches: User:', user);
    
    if (!user?.id) {
      console.log('⚠️ useBatches: Pas d\'utilisateur connecté');
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useBatches: Appel getBatches API...');
      
      // Utiliser l'endpoint des batches avec pagination
      const result = await odooApi.getBatches(1, 1000); // Récupérer tous les batches
      console.log('🔍 useBatches: Résultat API complet:', result);
      
      // L'API getBatches retourne directement { batches: [...], pagination: {...} }
      // au lieu de { status: "success", data: { batches: [...] } }
      if (result && result.batches) {
        console.log('✅ useBatches: Données batches reçues:', result.batches);
        setData({ batches: result.batches || [] });
        setError(null);
      } else if (result && result.status === 'success') {
        // Fallback pour l'ancien format
        console.log('✅ useBatches: Données batches reçues (format legacy):', result.data?.batches);
        setData({ batches: result.data?.batches || [] });
        setError(null);
      } else {
        console.error('❌ useBatches: Format de réponse incorrect:', result);
        throw new Error(result?.message || 'Erreur lors de la récupération des promotions');
      }
    } catch (err) {
      console.error('❌ useBatches: Erreur lors de la récupération des promotions:', err);
      console.error('❌ useBatches: Stack trace:', err.stack);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
      console.log('🔍 useBatches: Fin du fetchData');
    }
  }, [user?.id]);

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

// Hook pour les matières
const useSubjects = () => {
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
      
      // Utiliser l'endpoint des matières avec pagination
      const result = await odooApi.getSubjects(1, 1000); // Récupérer toutes les matières
      
      if (result && result.status === 'success') {
        setData({ subjects: result.data?.subjects || [] });
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des matières');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des matières:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

// Hook pour obtenir tous les enseignants (pour dropdowns)
const useAllTeachers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    console.log('🔍 useAllTeachers: Début du fetchData');
    console.log('🔍 useAllTeachers: User:', user);
    
    if (!user?.id) {
      console.log('⚠️ useAllTeachers: Pas d\'utilisateur connecté');
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useAllTeachers: Appel getAllTeachers API...');
      
      const result = await odooApi.getAllTeachers();
      console.log('🔍 useAllTeachers: Résultat API complet:', result);
      
      // Extraire les données selon le format de l'API
      let teachersData = [];
      if (result.data && result.data.teachers) {
        teachersData = result.data.teachers;
        console.log('✅ useAllTeachers: Données extraites de result.data.teachers:', teachersData);
      } else if (result.teachers) {
        teachersData = result.teachers;
        console.log('✅ useAllTeachers: Données extraites de result.teachers:', teachersData);
      } else if (Array.isArray(result)) {
        teachersData = result;
        console.log('✅ useAllTeachers: Tableau reçu directement:', teachersData);
      } else if (result && result.status === 'success') {
        teachersData = result.data || [];
        console.log('✅ useAllTeachers: Format avec status success:', teachersData);
      } else {
        console.error('❌ useAllTeachers: Format de réponse incorrect:', result);
        console.warn('Format de données inattendu pour les enseignants:', result);
        setData([]);
        setError('Format de données inattendu');
        return;
      }
      
      setData(teachersData);
      setError(null);
    } catch (err) {
      console.error('❌ useAllTeachers: Erreur lors de la récupération de tous les enseignants:', err);
      console.error('❌ useAllTeachers: Stack trace:', err.stack);
      setError(err.message || 'Erreur lors de la récupération des enseignants');
      setData([]);
    } finally {
      setLoading(false);
      console.log('🔍 useAllTeachers: Fin du fetchData');
    }
  }, [user?.id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour obtenir toutes les matières (pour dropdowns)
const useAllSubjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    console.log('🔍 useAllSubjects: Début du fetchData');
    console.log('🔍 useAllSubjects: User:', user);
    
    if (!user?.id) {
      console.log('⚠️ useAllSubjects: Pas d\'utilisateur connecté');
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useAllSubjects: Appel getAllSubjects API...');
      
      // Utiliser directement la méthode getAllSubjects
      const result = await odooApi.getAllSubjects();
      console.log('🔍 useAllSubjects: Résultat API complet:', result);
      
      // Extraire les données selon le format de l'API
      let subjectsData = [];
      if (result.data && result.data.subjects) {
        subjectsData = result.data.subjects;
        console.log('✅ useAllSubjects: Données extraites de result.data.subjects:', subjectsData);
      } else if (result.subjects) {
        subjectsData = result.subjects;
        console.log('✅ useAllSubjects: Données extraites de result.subjects:', subjectsData);
      } else if (Array.isArray(result)) {
        subjectsData = result;
        console.log('✅ useAllSubjects: Tableau reçu directement:', subjectsData);
      } else {
        console.error('❌ useAllSubjects: Format de réponse incorrect:', result);
        console.warn('Format de données inattendu pour les matières:', result);
        setData([]);
        setError('Format de données inattendu');
        return;
      }
      
      setData(subjectsData);
      setError(null);
    } catch (err) {
      console.error('❌ useAllSubjects: Erreur lors de la récupération de toutes les matières:', err);
      console.error('❌ useAllSubjects: Stack trace:', err.stack);
      setError(err.message || 'Erreur lors de la récupération des matières');
      setData([]);
    } finally {
      setLoading(false);
      console.log('🔍 useAllSubjects: Fin du fetchData');
    }
  }, [user?.id]);

  useEffect(() => {
    // Délai plus court pour les dropdowns
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour obtenir tous les cours (pour dropdowns)
const useAllCourses = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }

    console.log('🔍 useAllCourses: Début du fetchData');
    console.log('🔍 useAllCourses: User:', user);

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useAllCourses: Appel getAllCourses API...');
      
      // Utiliser l'endpoint courses
      const result = await odooApi.makeRequest('/api/courses?limit=1000');
      
      console.log('🔍 useAllCourses: Résultat API complet:', result);
      
      if (result.status === 'success' && result.data && result.data.courses) {
        console.log('✅ useAllCourses: Données courses reçues:', result.data.courses);
        setData(result.data.courses);
        setError(null);
      } else if (Array.isArray(result)) {
        console.log('✅ useAllCourses: Tableau reçu directement:', result);
        setData(result);
        setError(null);
      } else {
        console.log('⚠️ useAllCourses: Format inattendu:', result);
        setData([]);
        setError('Format de données inattendu');
      }
    } catch (err) {
      console.error('❌ useAllCourses: Erreur:', err);
      setError(err.message || 'Erreur lors de la récupération des cours');
      setData([]);
    } finally {
      setLoading(false);
      console.log('🔍 useAllCourses: Fin du fetchData');
    }
  }, [user?.id]);

  useEffect(() => {
    // Délai plus court pour les dropdowns
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour obtenir les promotions d'un cours
const useBatchesByCourse = (courseId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    console.log(`🔍 useBatchesByCourse: Début avec courseId=${courseId}, user=${user?.id}`);
    
    if (!user?.id || !courseId) {
      console.log(`⚠️ useBatchesByCourse: Pas d'utilisateur ou pas de courseId`);
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 useBatchesByCourse: Appel API pour courseId=${courseId}`);
      
      // Utiliser makeRequest avec l'endpoint /api/batches et filtrer par course_id
      const result = await odooApi.makeRequest(`/api/batches?course_id=${courseId}`);
      console.log(`🔍 useBatchesByCourse: Résultat de l'API:`, result);
      
      if (result && result.status === 'success') {
        // Les données sont dans result.data.batches
        const batches = result.data?.batches || [];
        console.log(`✅ useBatchesByCourse: ${batches.length} batches trouvés`);
        setData(batches);
        setError(null);
      } else {
        console.warn(`⚠️ useBatchesByCourse: Format inattendu:`, result);
        setData([]);
        setError(result?.message || 'Format de données inattendu');
      }
    } catch (err) {
      console.error(`❌ useBatchesByCourse: Erreur:`, err);
      setError(err.message || 'Erreur lors de la récupération des promotions');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, courseId]);

  useEffect(() => {
    // Délai plus court pour les dropdowns dépendants
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour obtenir les types d'évaluation
const useEvaluationTypes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useEvaluationTypes: Démarrage de la récupération...');
      
      // Utiliser makeRequest directement pour être cohérent
      const result = await odooApi.makeRequest('/api/evaluation-types');
      
      console.log('🔍 useEvaluationTypes: Résultat brut de l\'API:', result);
      
      if (result && result.status === 'success') {
        // Les données sont directement dans result.data (pas result.data.evaluation_types)
        const types = result.data || [];
        console.log('✅ useEvaluationTypes: Types extraits:', types);
        setData(types);
        setError(null);
      } else {
        console.warn('⚠️ useEvaluationTypes: Format de réponse inattendu:', result);
        setError(result?.message || 'Format de données inattendu');
        setData([]);
      }
    } catch (err) {
      console.error('❌ useEvaluationTypes: Erreur lors de la récupération des types d\'évaluation:', err);
      setError(err.message || 'Erreur lors de la récupération des types d\'évaluation');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Délai plus court pour les dropdowns
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour obtenir les sessions d'examen
const useExamSessions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // Pas de loading car pas d'endpoint
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    // L'endpoint /api/exam-sessions n'existe pas encore
    // Retourner des données vides pour éviter les erreurs
    console.log('⚠️ useExamSessions: Endpoint /api/exam-sessions non implémenté');
    setLoading(false);
    setData([]);
    setError(null);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
};

// Hook pour récupérer tous les cours pour les dropdowns (alias de useAllTeachers)
export const useFaculties = () => {
  return useAllTeachers();
};

// Hook pour récupérer les détails d'un étudiant spécifique
const useStudent = (studentId) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchStudent = useCallback(async () => {
    if (!user?.id || !studentId) {
      setLoading(false);
      setStudent(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useStudent: Récupération de l'étudiant ID: ${studentId}`);
      
      const result = await odooApi.getStudent(studentId);
      
      console.log('🔍 useStudent: Résultat de l\'API:', result);
      
      if (result) {
        // L'API getStudent retourne directement les données de l'étudiant
        setStudent(result);
        setError(null);
      } else {
        throw new Error('Étudiant non trouvé');
      }
    } catch (err) {
      console.error(`❌ useStudent: Erreur lors de la récupération de l'étudiant ${studentId}:`, err);
      setError(err.message || 'Erreur lors de la récupération de l\'étudiant');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, studentId]);

  useEffect(() => {
    if (studentId) {
      const timeoutId = setTimeout(() => {
        fetchStudent();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [fetchStudent, studentId]);

  return { 
    student, 
    loading, 
    error, 
    refetch: fetchStudent
  };
};

// Hook pour récupérer les détails d'un enseignant spécifique
const useTeacher = (teacherId) => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchTeacher = useCallback(async () => {
    if (!user?.id || !teacherId) {
      setLoading(false);
      setTeacher(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useTeacher: Récupération de l'enseignant ID: ${teacherId}`);
      
      const result = await odooApi.getTeacher(teacherId);
      
      console.log('🔍 useTeacher: Résultat de l\'API:', result);
      
      if (result) {
        // L'API getTeacher peut retourner différents formats
        const teacherData = result.data || result;
        setTeacher(teacherData);
        setError(null);
      } else {
        throw new Error('Enseignant non trouvé');
      }
    } catch (err) {
      console.error(`❌ useTeacher: Erreur lors de la récupération de l'enseignant ${teacherId}:`, err);
      setError(err.message || 'Erreur lors de la récupération de l\'enseignant');
      setTeacher(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, teacherId]);

  useEffect(() => {
    if (teacherId) {
      const timeoutId = setTimeout(() => {
        fetchTeacher();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [fetchTeacher, teacherId]);

  return { 
    teacher, 
    loading, 
    error, 
    refetch: fetchTeacher
  };
};

export {
  useStudents,
  useClasses,
  useTeachers,
  useGrades,
  useStatistics,
  useBatches,
  useSubjects,
  useOdooData,
  useAllTeachers,
  useAllSubjects,
  useAllCourses,
  useBatchesByCourse,
  useEvaluationTypes,
  useExamSessions,
  useStudent,
  useTeacher
};