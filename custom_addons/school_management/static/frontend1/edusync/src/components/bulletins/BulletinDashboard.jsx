import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  School,
  CalendarMonth,
  Star,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const BulletinDashboard = () => {
  const { api } = useOdoo();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_bulletins: 0,
    bulletins_by_state: {},
    average_generale: 0,
    top_students: [],
    low_performers: [],
    subject_averages: []
  });
  const [selectedTrimestre, setSelectedTrimestre] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [trimestres, setTrimestres] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTrimestre || selectedBatch) {
      loadStats();
    }
  }, [selectedTrimestre, selectedBatch]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [trimestreRes, batchRes] = await Promise.all([
        api.getTrimestres(),
        api.getAllBatches()
      ]);
      
      if (trimestreRes.success) setTrimestres(trimestreRes.data);
      if (batchRes.success) setBatches(batchRes.data);
      
      // Charger les stats par défaut
      loadStats();
      
    } catch (error) {
      console.error('Erreur chargement données dashboard:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedTrimestre) filters.trimestre_id = selectedTrimestre;
      if (selectedBatch) filters.batch_id = selectedBatch;
      
      // Récupérer les vraies données depuis l'API
      const [bulletinsRes, examStatsRes] = await Promise.all([
        api.getBulletins(filters),
        api.getBulletinStats(filters)
      ]);
      
      console.log('Réponses API dashboard:', { bulletinsRes, examStatsRes });
      
      let bulletinsList = [];
      if (bulletinsRes && bulletinsRes.success && Array.isArray(bulletinsRes.data)) {
        bulletinsList = bulletinsRes.data;
      } else if (bulletinsRes && Array.isArray(bulletinsRes.data)) {
        bulletinsList = bulletinsRes.data;
      } else if (bulletinsRes && Array.isArray(bulletinsRes)) {
        bulletinsList = bulletinsRes;
      }
      
      // Calculer les statistiques basées sur les vrais bulletins
      const stats = {
        total_bulletins: bulletinsList.length,
        bulletins_by_state: {},
        average_generale: 0,
        top_students: [],
        low_performers: [],
        subject_averages: []
      };
      
      // Compter les bulletins par état
      bulletinsList.forEach(bulletin => {
        const state = bulletin.state || 'brouillon';
        stats.bulletins_by_state[state] = (stats.bulletins_by_state[state] || 0) + 1;
      });
      
      // Calculer la moyenne générale
      if (bulletinsList.length > 0) {
        const bulletinsWithMoyenne = bulletinsList.filter(b => b.moyenne_generale && b.moyenne_generale > 0);
        if (bulletinsWithMoyenne.length > 0) {
          const totalMoyenne = bulletinsWithMoyenne.reduce((sum, b) => sum + (b.moyenne_generale || 0), 0);
          stats.average_generale = totalMoyenne / bulletinsWithMoyenne.length;
        }
        
        // Top étudiants (moyenne >= 16)
        stats.top_students = bulletinsWithMoyenne
          .filter(b => b.moyenne_generale >= 16)
          .sort((a, b) => b.moyenne_generale - a.moyenne_generale)
          .slice(0, 5)
          .map(b => ({
            name: b.student_name || 'Étudiant inconnu',
            moyenne: b.moyenne_generale,
            batch: b.batch_name || 'Classe inconnue'
          }));
        
        // Étudiants en difficulté (moyenne < 10)
        stats.low_performers = bulletinsWithMoyenne
          .filter(b => b.moyenne_generale < 10)
          .sort((a, b) => a.moyenne_generale - b.moyenne_generale)
          .slice(0, 5)
          .map(b => ({
            name: b.student_name || 'Étudiant inconnu',
            moyenne: b.moyenne_generale,
            batch: b.batch_name || 'Classe inconnue'
          }));
      }
      
      // Utiliser les stats d'examens si disponibles
      if (examStatsRes && examStatsRes.success && examStatsRes.data) {
        if (examStatsRes.data.subject_averages) {
          stats.subject_averages = examStatsRes.data.subject_averages;
        }
        if (examStatsRes.data.total_exams) {
          stats.total_exams = examStatsRes.data.total_exams;
        }
      }
      
      // Si pas de données d'examens, essayer de récupérer les moyennes par matière
      if (stats.subject_averages.length === 0) {
        try {
          const subjectStatsRes = await api.getSubjectAverages(filters);
          if (subjectStatsRes && subjectStatsRes.success && Array.isArray(subjectStatsRes.data)) {
            stats.subject_averages = subjectStatsRes.data;
          }
        } catch (error) {
          console.warn('Impossible de récupérer les moyennes par matière:', error);
        }
      }
      
      setStats(stats);
      
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      setError('Erreur lors du chargement des statistiques');
      // Données vides en cas d'erreur
      setStats({
        total_bulletins: 0,
        bulletins_by_state: {},
        average_generale: 0,
        top_students: [],
        low_performers: [],
        subject_averages: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStateColorForChip = (state) => {
    const colors = {
      'brouillon': 'default',
      'calcule': 'info',
      'valide': 'success',
      'publie': 'primary',
      'archive': 'secondary'
    };
    return colors[state] || 'default';
  };

  const getStateColorForProgress = (state) => {
    const colors = {
      'brouillon': 'inherit',
      'calcule': 'info',
      'valide': 'success',
      'publie': 'primary',
      'archive': 'secondary'
    };
    return colors[state] || 'inherit';
  };

  const getGradeBadge = (moyenne) => {
    if (moyenne >= 16) return { color: 'success', text: 'Très Bien' };
    if (moyenne >= 14) return { color: 'info', text: 'Bien' };
    if (moyenne >= 12) return { color: 'warning', text: 'Assez Bien' };
    if (moyenne >= 10) return { color: 'default', text: 'Passable' };
    return { color: 'error', text: 'Insuffisant' };
  };

  if (loading) {
    return (
      <Box className="p-6">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      {/* En-tête */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
          Dashboard des Bulletins
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Analyse des performances scolaires basée sur les examens
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <Paper className="p-4 mb-6">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Trimestre</InputLabel>
              <Select
                value={selectedTrimestre}
                onChange={(e) => setSelectedTrimestre(e.target.value)}
                label="Trimestre"
              >
                <MenuItem value="">Tous les trimestres</MenuItem>
                {trimestres.map((trimestre) => (
                  <MenuItem key={trimestre.id} value={trimestre.id}>
                    {trimestre.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Classe</InputLabel>
              <Select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                label="Classe"
              >
                <MenuItem value="">Toutes les classes</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="text-center">
              <Assessment className="text-blue-500 mb-2" style={{ fontSize: 40 }} />
              <Typography variant="h4" className="font-bold text-blue-600">
                {stats.total_bulletins}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Bulletins
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="text-center">
              <TrendingUp className="text-green-500 mb-2" style={{ fontSize: 40 }} />
              <Typography variant="h4" className="font-bold text-green-600">
                {stats.average_generale.toFixed(1)}/20
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Moyenne Générale
              </Typography>
              <Chip 
                label={getGradeBadge(stats.average_generale).text}
                color={getGradeBadge(stats.average_generale).color}
                size="small"
                className="mt-1"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="text-center">
              <CheckCircle className="text-purple-500 mb-2" style={{ fontSize: 40 }} />
              <Typography variant="h4" className="font-bold text-purple-600">
                {stats.bulletins_by_state.publie || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bulletins Publiés
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="text-center">
              <School className="text-orange-500 mb-2" style={{ fontSize: 40 }} />
              <Typography variant="h4" className="font-bold text-orange-600">
                {stats.subject_averages.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Matières Evaluées
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Répartition par état */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Répartition par État
            </Typography>
            {Object.keys(stats.bulletins_by_state).length > 0 ? (
              Object.entries(stats.bulletins_by_state).map(([state, count]) => (
                <Box key={state} className="mb-3">
                  <Box className="flex justify-between items-center mb-1">
                    <Typography variant="body2">
                      {state.charAt(0).toUpperCase() + state.slice(1)}
                    </Typography>
                    <Chip
                      label={count}
                      color={getStateColorForChip(state)}
                      size="small"
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(count / stats.total_bulletins) * 100}
                    color={getStateColorForProgress(state)}
                  />
                </Box>
              ))
            ) : (
              <Box className="text-center py-8">
                <Typography variant="body2" color="text.secondary">
                  Aucun bulletin créé
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  Créez des bulletins pour voir leur répartition par état
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Moyennes par Matière
            </Typography>
            {stats.subject_averages.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Matière</TableCell>
                      <TableCell align="right">Moyenne</TableCell>
                      <TableCell align="right">Examens</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.subject_averages.map((subject) => (
                      <TableRow key={subject.subject}>
                        <TableCell>{subject.subject}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${subject.average.toFixed(1)}/20`}
                            color={getGradeBadge(subject.average).color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{subject.total_exams}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box className="text-center py-8">
                <Typography variant="body2" color="text.secondary">
                  Aucune moyenne par matière disponible
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  Créez des examens et générez des bulletins pour voir les statistiques
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top performers et élèves en difficulté */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              🌟 Meilleurs Élèves
            </Typography>
            {stats.top_students.length > 0 ? (
              stats.top_students.map((student, index) => (
                <Box key={index} className="flex justify-between items-center p-3 mb-2 bg-green-50 rounded">
                  <Box>
                    <Typography variant="body1" className="font-medium">
                      {student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.batch}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${student.moyenne.toFixed(1)}/20`}
                    color="success"
                    icon={<TrendingUp />}
                  />
                </Box>
              ))
            ) : (
              <Box className="text-center py-8">
                <Typography variant="body2" color="text.secondary">
                  Aucun bulletin avec mention "Très Bien" (≥16/20)
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  Générez et calculez des bulletins pour voir les meilleurs élèves
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              ⚠️ Élèves en Difficulté
            </Typography>
            {stats.low_performers.length > 0 ? (
              stats.low_performers.map((student, index) => (
                <Box key={index} className="flex justify-between items-center p-3 mb-2 bg-red-50 rounded">
                  <Box>
                    <Typography variant="body1" className="font-medium">
                      {student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.batch}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${student.moyenne.toFixed(1)}/20`}
                    color="error"
                    icon={<Warning />}
                  />
                </Box>
              ))
            ) : (
              <Box className="text-center py-8">
                <Typography variant="body2" color="text.secondary">
                  Aucun élève en difficulté (&lt;10/20) ou aucune donnée
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  {stats.total_bulletins === 0 
                    ? "Créez des bulletins pour analyser les performances"
                    : "Félicitations ! Tous vos élèves ont la moyenne"
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Message informatif si aucune donnée */}
      {stats.total_bulletins === 0 && (
        <Paper className="p-6 mt-6 text-center bg-blue-50">
          <School style={{ fontSize: 64, color: '#1976d2', marginBottom: 16 }} />
          <Typography variant="h6" className="mb-2 text-blue-800">
            Aucun bulletin disponible
          </Typography>
          <Typography variant="body1" color="text.secondary" className="mb-4">
            Pour voir les statistiques du dashboard, vous devez d'abord :
          </Typography>
          <Box className="text-left max-w-md mx-auto">
            <Typography variant="body2" className="mb-1">
              1. Créer des examens et saisir les notes
            </Typography>
            <Typography variant="body2" className="mb-1">
              2. Générer les bulletins pour vos classes
            </Typography>
            <Typography variant="body2" className="mb-1">
              3. Calculer les moyennes des bulletins
            </Typography>
            <Typography variant="body2">
              4. Publier les bulletins pour les rendre visibles
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BulletinDashboard; 