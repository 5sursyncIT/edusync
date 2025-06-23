import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon
} from '@mui/icons-material';
import axios from 'axios';

const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes en millisecondes
const API_BASE_URL = 'http://172.16.209.128:8069'; // URL de base de l'API
const STUDENTS_ENDPOINT = '/api/students'; // Endpoint pour les étudiants

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Configuration Axios
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    axios.defaults.timeout = 10000;
    
    console.log('Configuration Axios initialisée:', {
      baseURL: axios.defaults.baseURL,
      headers: axios.defaults.headers.common,
      withCredentials: axios.defaults.withCredentials
    });
  }, []);

  useEffect(() => {
    fetchStudents();
    // Vérifier la connexion toutes les 30 secondes
    const intervalId = setInterval(checkConnection, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const checkConnection = async () => {
    try {
      console.log('Vérification de la connexion à l\'API...');
      const response = await axios.get('/api/ping');
      console.log('Réponse du ping:', response.data);
      
      if (!isOnline) {
        setIsOnline(true);
        setSnackbarMessage('Connexion rétablie');
        setSnackbarOpen(true);
        fetchStudents();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion:', error);
      if (isOnline) {
        setIsOnline(false);
        setSnackbarMessage('Connexion perdue');
        setSnackbarOpen(true);
      }
    }
  };

  const loadCachedData = () => {
    console.log('Tentative de chargement des données en cache...');
    const cached = localStorage.getItem('cachedStudents');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < CACHE_EXPIRATION) {
          console.log(`Données en cache trouvées (${data.length} étudiants)`);
          setStudents(data);
          setLastUpdate(new Date(timestamp));
          return true;
        } else {
          console.log('Données en cache expirées');
        }
      } catch (e) {
        console.error('Erreur lors de la lecture du cache:', e);
      }
    } else {
      console.log('Aucune donnée en cache');
    }
    return false;
  };

  const saveToCache = (data) => {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem('cachedStudents', JSON.stringify(cacheData));
      console.log(`${data.length} étudiants sauvegardés en cache`);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde dans le cache:', e);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Tentative de récupération des étudiants...');
      console.log('URL complète:', `${API_BASE_URL}${STUDENTS_ENDPOINT}`);
      
      // Vérifier d'abord la connectivité de l'API
      try {
        const pingResponse = await axios.get('/api/ping');
        console.log('Réponse du ping:', pingResponse.data);
        setIsOnline(true);
      } catch (pingError) {
        console.error('Erreur de ping:', pingError);
        setIsOnline(false);
        if (loadCachedData()) {
          setLoading(false);
          return;
        }
        throw new Error('Impossible de se connecter à l\'API Odoo');
      }

      const response = await axios.get(STUDENTS_ENDPOINT);
      console.log('Réponse de l\'API:', response.data);
      
      if (Array.isArray(response.data)) {
        console.log(`${response.data.length} étudiants récupérés de l'API`);
        setStudents(response.data);
        setLastUpdate(new Date());
        saveToCache(response.data);
      } else if (response.data.error) {
        console.error('Erreur dans la réponse API:', response.data.error);
        throw new Error(response.data.error);
      } else {
        console.error('Format de réponse inattendu:', response.data);
        throw new Error('Format de réponse invalide');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des étudiants:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la récupération des données';
      
      if (error.response) {
        console.error('Données de réponse d\'erreur:', error.response.data);
        console.error('Statut d\'erreur:', error.response.status);
        console.error('En-têtes de réponse:', error.response.headers);
        
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      
      if (!loadCachedData()) {
        setStudents([]);
      }
    }
  };

  const handleRefresh = () => {
    fetchStudents();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Filtrer les étudiants en fonction du terme de recherche
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Liste des Élèves
        </Typography>
        <Box display="flex" alignItems="center">
          {isOnline ? (
            <CloudDoneIcon color="success" sx={{ mr: 1 }} />
          ) : (
            <CloudOffIcon color="warning" sx={{ mr: 1 }} />
          )}
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <TextField
        fullWidth
        label="Rechercher un élève..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Impossible de se connecter à l'API Odoo. Affichage des données locales uniquement.
          {lastUpdate && (
            <Typography variant="caption" display="block">
              Dernière mise à jour : {lastUpdate.toLocaleString()}
            </Typography>
          )}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Classe</TableCell>
                <TableCell>Genre</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{student.phone || '-'}</TableCell>
                  <TableCell>{student.class_name || '-'}</TableCell>
                  <TableCell>{student.gender || '-'}</TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucun élève trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Container>
  );
}

export default StudentList; 