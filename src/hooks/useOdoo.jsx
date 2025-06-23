// Hook pour les étudiants (tableau de bord)
const useStudents = () => {
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
      
      // Utiliser l'endpoint principal des étudiants au lieu du dashboard
      const result = await odooApi.getStudents(1, 1000); // Récupérer tous les étudiants
      
      if (result && result.status === 'success') {
        setData(result.data?.students || []);
        setError(null);
      } else {
        throw new Error(result?.message || 'Erreur lors de la récupération des étudiants');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des étudiants:', err);
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
      
      // Pour l'instant, retourner des données par défaut car l'endpoint grades n'existe pas
      // TODO: Implémenter l'endpoint grades côté backend
      setData([]);
      setError(null);
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