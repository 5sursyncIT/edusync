import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Fade
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const StudentGrades = ({ selectedChild }) => {
  const darkBlue = '#00008B';
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    if (selectedChild) {
      loadGrades();
    }
  }, [selectedChild, selectedPeriod, selectedSubject]);

  const loadGrades = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError('');

    try {
      const params = {};
      if (selectedPeriod !== 'all') params.period = selectedPeriod;
      if (selectedSubject !== 'all') params.subject = selectedSubject;

      const response = await parentAPI.getStudentGrades(selectedChild.id, params);
      
      if (response.status === 'success') {
        setGrades(response.data.grades || []);
        setStatistics(response.data.statistics || {});
      } else {
        setError(response.message || 'Erreur lors du chargement des notes');
        setGrades([]);
        setStatistics({});
      }
    } catch (error) {
      console.error('Erreur notes:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service de notes non disponible. Veuillez contacter l\'administration.');
      } else {
        setError('Erreur de connexion');
      }
      setGrades([]);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade, maxGrade = 20) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return '#10b981'; // Vert
    if (percentage >= 60) return '#f59e0b'; // Orange
    if (percentage >= 40) return '#ef4444'; // Rouge
    return '#6b7280'; // Gris
  };

  const getGradeIcon = (grade, maxGrade = 20) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 60) return <TrendingUpIcon />;
    return <TrendingDownIcon />;
  };

  // Cartes de statistiques
  const StatCard = ({ title, value, subtitle, color = darkBlue, icon }) => (
    <Card
      elevation={2}
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color} sx={{ mt: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  if (!selectedChild) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un enfant pour voir ses notes
        </Typography>
      </Paper>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box>
        <Typography variant="h5" fontWeight="bold" color={darkBlue} gutterBottom>
          Notes - {selectedChild.name}
        </Typography>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Moyenne Générale"
              value={statistics.average_grade ? `${statistics.average_grade.toFixed(1)}/20` : 'N/A'}
              subtitle="Toutes matières"
              color="#10b981"
              icon={<AssessmentIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Meilleure Note"
              value={statistics.best_grade ? `${statistics.best_grade}/20` : 'N/A'}
              subtitle="Note maximale"
              color="#3b82f6"
              icon={<TrendingUpIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Nombre d'Évaluations"
              value={grades.length || 0}
              subtitle="Cette période"
              color="#8b5cf6"
              icon={<GradeIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Rang de Classe"
              value={statistics.class_rank || 'N/A'}
              subtitle={`Sur ${statistics.total_students || 0} élèves`}
              color="#f59e0b"
              icon={<SchoolIcon />}
            />
          </Grid>
        </Grid>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Période</InputLabel>
                  <Select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    label="Période"
                  >
                    <MenuItem value="all">Toutes les périodes</MenuItem>
                    <MenuItem value="trimestre1">1er Trimestre</MenuItem>
                    <MenuItem value="trimestre2">2ème Trimestre</MenuItem>
                    <MenuItem value="trimestre3">3ème Trimestre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Matière</InputLabel>
                  <Select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    label="Matière"
                  >
                    <MenuItem value="all">Toutes les matières</MenuItem>
                    {/* Les matières seront chargées dynamiquement */}
                    <MenuItem value="math">Mathématiques</MenuItem>
                    <MenuItem value="french">Français</MenuItem>
                    <MenuItem value="physics">Physique</MenuItem>
                    <MenuItem value="chemistry">Chimie</MenuItem>
                    <MenuItem value="biology">Biologie</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Messages d'erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Chargement */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Tableau des notes */}
        {!loading && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Détail des Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {grades.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AssessmentIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucune note disponible
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Les notes apparaîtront ici une fois saisies par les enseignants
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Matière</strong></TableCell>
                        <TableCell><strong>Évaluation</strong></TableCell>
                        <TableCell><strong>Note</strong></TableCell>
                        <TableCell><strong>Coefficient</strong></TableCell>
                        <TableCell><strong>Moyenne Classe</strong></TableCell>
                        <TableCell><strong>Appréciation</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {new Date(grade.date).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={grade.subject_name || 'N/A'} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {grade.exam_name || grade.evaluation_type || 'Évaluation'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                color={getGradeColor(grade.grade, grade.max_grade)}
                              >
                                {grade.grade}/{grade.max_grade || 20}
                              </Typography>
                              <Box sx={{ width: 60 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(grade.grade / (grade.max_grade || 20)) * 100}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: getGradeColor(grade.grade, grade.max_grade),
                                      borderRadius: 3
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`×${grade.coefficient || 1}`} 
                              size="small" 
                              color="secondary"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {grade.class_average ? `${grade.class_average}/20` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}
                            >
                              {grade.comment || 'Aucune appréciation'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Fade>
  );
};

export default StudentGrades; 