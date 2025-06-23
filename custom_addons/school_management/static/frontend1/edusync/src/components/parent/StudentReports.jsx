import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Divider,
  Fade,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Grade as GradeIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const StudentReports = ({ selectedChild }) => {
  const darkBlue = '#00008B';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Bulletins, 1: Rapports disciplinaires, 2: Rapports d'évaluation
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    if (selectedChild) {
      loadReports();
      loadPeriods();
    }
  }, [selectedChild, activeTab, selectedPeriod]);

  const loadReports = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError('');

    try {
      const params = {};
      if (selectedPeriod !== 'all') params.period = selectedPeriod;
      if (activeTab !== 'all') params.type = activeTab;

      const response = await parentAPI.getStudentReports(selectedChild.id, params);
      
      if (response.status === 'success') {
        setReports(response.data.reports || []);
      } else {
        setError(response.message || 'Erreur lors du chargement des rapports');
        setReports([]);
      }
    } catch (error) {
      console.error('Erreur rapports:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service de rapports non disponible. Veuillez contacter l\'administration.');
      } else {
        setError('Erreur de connexion');
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async () => {
    if (!selectedChild) return;

    try {
      const response = await parentAPI.getAcademicPeriods(selectedChild.id);
      
      if (response.status === 'success') {
        setPeriods(response.data.periods || []);
      }
    } catch (error) {
      console.error('Erreur périodes:', error);
    }
  };

  const getReportType = () => {
    switch (activeTab) {
      case 0: return 'bulletin';
      case 1: return 'disciplinary';
      case 2: return 'evaluation';
      default: return 'bulletin';
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await parentAPI.downloadReport(selectedChild.id, reportId);
      
      if (response.status === 'success') {
        // Télécharger le fichier
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(response.message || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setError('Erreur de connexion');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const getGradeColor = (grade, maxGrade = 20) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return '#10b981'; // Vert
    if (percentage >= 60) return '#f59e0b'; // Orange
    if (percentage >= 40) return '#ef4444'; // Rouge
    return '#6b7280'; // Gris
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'average': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bien';
      case 'average': return 'Moyen';
      case 'poor': return 'Insuffisant';
      default: return 'Non évalué';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderBulletin = (report) => (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Bulletin - {report.period_name}
        </Typography>
        <Chip
          label={getStatusText(report.overall_status)}
          sx={{
            bgcolor: `${getStatusColor(report.overall_status)}20`,
            color: getStatusColor(report.overall_status),
            fontWeight: 'bold'
          }}
        />
      </Stack>

      {/* Résumé */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" fontWeight="bold" color={darkBlue}>
              {report.overall_average || 0}/20
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Moyenne générale
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="#10b981">
              {report.class_rank || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rang dans la classe
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="#f59e0b">
              {report.absences || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Absences
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="#8b5cf6">
              {report.subjects?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Matières
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Détail par matière */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Détail par matière
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Matière</TableCell>
              <TableCell align="center">Moyenne</TableCell>
              <TableCell align="center">Coefficient</TableCell>
              <TableCell align="center">Rang</TableCell>
              <TableCell>Appréciation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.subjects?.map((subject, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: getGradeColor(subject.average), width: 32, height: 32 }}>
                      <GradeIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {subject.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold" color={getGradeColor(subject.average)}>
                    {subject.average}/20
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {subject.coefficient}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {subject.rank || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {subject.comment || 'Aucune appréciation'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Commentaires */}
      {report.comments && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Commentaires du conseil de classe
          </Typography>
          <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              {report.comments}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );

  const renderDisciplinaryReport = (report) => (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Rapport Disciplinaire - {formatDate(report.date)}
        </Typography>
        <Chip
          label={report.severity}
          sx={{
            bgcolor: report.severity === 'grave' ? '#ef444420' : 
                     report.severity === 'moyen' ? '#f59e0b20' : '#10b98120',
            color: report.severity === 'grave' ? '#ef4444' : 
                   report.severity === 'moyen' ? '#f59e0b' : '#10b981'
          }}
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Informations
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date de l'incident
                </Typography>
                <Typography variant="body2">
                  {formatDate(report.incident_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rapporté par
                </Typography>
                <Typography variant="body2">
                  {report.reported_by}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Lieu
                </Typography>
                <Typography variant="body2">
                  {report.location || 'Non spécifié'}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Sanction
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Type de sanction
                </Typography>
                <Typography variant="body2">
                  {report.sanction_type || 'Aucune'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Durée
                </Typography>
                <Typography variant="body2">
                  {report.sanction_duration || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Statut
                </Typography>
                <Chip
                  size="small"
                  label={report.sanction_status || 'En cours'}
                  color={report.sanction_status === 'Terminé' ? 'success' : 'warning'}
                />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
          Description de l'incident
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
            {report.description}
          </Typography>
        </Paper>
      </Box>

      {report.actions_taken && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            Actions entreprises
          </Typography>
          <Paper sx={{ p: 3, bgcolor: '#f0f9ff' }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              {report.actions_taken}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );

  if (!selectedChild) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un enfant pour voir ses rapports
        </Typography>
      </Paper>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" color={darkBlue}>
            Rapports - {selectedChild.name}
          </Typography>
        </Stack>

        {/* Onglets et filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                >
                  <Tab 
                    label="Bulletins" 
                    icon={<AssessmentIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Rapports Disciplinaires" 
                    icon={<WarningIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Évaluations" 
                    icon={<BarChartIcon />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Période</InputLabel>
                  <Select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    label="Période"
                  >
                    <MenuItem value="">Toutes les périodes</MenuItem>
                    {periods.map((period) => (
                      <MenuItem key={period.id} value={period.id}>
                        {period.name}
                      </MenuItem>
                    ))}
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

        {/* Liste des rapports */}
        {!loading && (
          <Grid container spacing={3}>
            {reports.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun rapport trouvé
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aucun rapport disponible pour cette période
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              reports.map((report) => (
                <Grid item xs={12} md={6} lg={4} key={report.id}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Avatar sx={{ bgcolor: darkBlue }}>
                          {activeTab === 0 && <AssessmentIcon />}
                          {activeTab === 1 && <WarningIcon />}
                          {activeTab === 2 && <BarChartIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {report.title || report.period_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(report.date || report.created_at)}
                          </Typography>
                        </Box>
                      </Stack>

                      {activeTab === 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" fontWeight="bold" color={darkBlue}>
                            {report.overall_average || 0}/20
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Moyenne générale
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(report.overall_average / 20) * 100}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}

                      {activeTab === 1 && (
                        <Box sx={{ mb: 3 }}>
                          <Chip
                            label={report.severity}
                            size="small"
                            sx={{
                              bgcolor: report.severity === 'grave' ? '#ef444420' : 
                                       report.severity === 'moyen' ? '#f59e0b20' : '#10b98120',
                              color: report.severity === 'grave' ? '#ef4444' : 
                                     report.severity === 'moyen' ? '#f59e0b' : '#10b981'
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {report.description?.substring(0, 100)}...
                          </Typography>
                        </Box>
                      )}

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewReport(report)}
                          sx={{ flex: 1 }}
                        >
                          Voir
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadReport(report.id)}
                          variant="outlined"
                          sx={{ flex: 1 }}
                        >
                          Télécharger
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Dialog de visualisation */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                {selectedReport?.title || selectedReport?.period_name}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => handleDownloadReport(selectedReport?.id)}>
                  <DownloadIcon />
                </IconButton>
                <IconButton onClick={() => window.print()}>
                  <PrintIcon />
                </IconButton>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box>
                {activeTab === 0 && renderBulletin(selectedReport)}
                {activeTab === 1 && renderDisciplinaryReport(selectedReport)}
                {activeTab === 2 && renderBulletin(selectedReport)} {/* Même format pour les évaluations */}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default StudentReports; 