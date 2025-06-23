import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Avatar,
  Fade,
  Zoom
} from '@mui/material';
import {
  TrendingUp,
  Calendar,
  Users,
  GraduationCap,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  School,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { admissionsAPI } from '../services/admissionsAPI';

// Composant graphique en barres simple
const SimpleBarChart = ({ data, title, color = '#1976d2' }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
        {title}
      </Typography>
      <Stack spacing={2}>
        {data.map((item, index) => (
          <Box key={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {item.label}
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight="bold">
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(item.value / maxValue) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

// Composant graphique en secteurs simple
const SimplePieChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2'];
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
        {title}
      </Typography>
      <Stack spacing={2}>
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: colors[index % colors.length]
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.value} ({percentage}%)
                </Typography>
              </Box>
              <Typography variant="body2" color="primary.main" fontWeight="bold">
                {percentage}%
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

// Composant graphique de tendances temporelles
const TemporalTrendsChart = ({ data, title }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Aucune donnée temporelle disponible
        </Typography>
      </Box>
    );
  }

  const sortedData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      label: new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      value: typeof count === 'object' ? count.total : count
    }));

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
        {title}
      </Typography>
      <Stack spacing={2}>
        {sortedData.map((item, index) => (
          <Box key={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {item.label}
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight="bold">
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(item.value / Math.max(...sortedData.map(d => d.value))) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#1976d2',
                  borderRadius: 3
                }
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

// Composant de prédictions
const PredictionsCard = ({ predictions }) => {
  if (!predictions || predictions.message) {
    return (
      <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
          🔮 Prédictions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {predictions?.message || 'Aucune prédiction disponible'}
        </Typography>
      </Card>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'croissante': return <TrendingUp color="#2e7d32" size={20} />;
      case 'décroissante': return <TrendingUp color="#d32f2f" size={20} style={{ transform: 'rotate(180deg)' }} />;
      default: return <Target color="#1976d2" size={20} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'croissante': return 'success.main';
      case 'décroissante': return 'error.main';
      default: return 'primary.main';
    }
  };

  return (
    <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'primary.main' }}>
        🔮 Prédictions et tendances
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {predictions.next_month_prediction}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admissions prévues le mois prochain
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {predictions.daily_average}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Moyenne quotidienne
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            {getTrendIcon(predictions.trend)}
            <Box>
              <Typography variant="body1" fontWeight="medium" sx={{ color: getTrendColor(predictions.trend) }}>
                Tendance {predictions.trend}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confiance: {predictions.confidence}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

// Composant d'analyse de conversion
const ConversionAnalysis = ({ conversionData }) => {
  if (!conversionData || !conversionData.funnel_analysis) {
    return (
      <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
          🎯 Analyse de conversion
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aucune donnée de conversion disponible
        </Typography>
      </Card>
    );
  }

  const funnel = conversionData.funnel_analysis;
  const total = funnel.draft + funnel.submitted + funnel.confirmed + funnel.rejected;

  return (
    <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'primary.main' }}>
        🎯 Entonnoir de conversion
      </Typography>
      
      <Stack spacing={2}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Brouillons</Typography>
            <Typography variant="body2" fontWeight="bold">{funnel.draft}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (funnel.draft / total) * 100 : 0}
            sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
          />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Soumises</Typography>
            <Typography variant="body2" fontWeight="bold">{funnel.submitted}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (funnel.submitted / total) * 100 : 0}
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' }
            }}
          />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Confirmées</Typography>
            <Typography variant="body2" fontWeight="bold">{funnel.confirmed}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (funnel.confirmed / total) * 100 : 0}
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': { bgcolor: 'success.main' }
            }}
          />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Rejetées</Typography>
            <Typography variant="body2" fontWeight="bold">{funnel.rejected}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (funnel.rejected / total) * 100 : 0}
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': { bgcolor: 'error.main' }
            }}
          />
        </Box>
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" color="success.main">
          {conversionData.confirmation_rate}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Taux de confirmation global
        </Typography>
      </Box>
    </Card>
  );
};

// Composant principal des rapports détaillés
const DetailedReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    period: 'month',
    course: '',
    status: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    try {
      // Charger les analyses avancées depuis la nouvelle API
      const analyticsResponse = await admissionsAPI.getAnalytics({
        period: filters.period,
        course_id: filters.course,
        status: filters.status
      });
      
      // Charger les statistiques de base
      const statsResponse = await admissionsAPI.getStatistics();
      
      // Charger les options de formulaire pour les filtres
      const optionsResponse = await admissionsAPI.getFormOptions();
      
      if (analyticsResponse.status === 'success') {
        const analytics = analyticsResponse.data;
        const stats = statsResponse.status === 'success' ? statsResponse.data : {};
        const options = optionsResponse.status === 'success' ? optionsResponse.data : {};
        
        // Combiner toutes les données
        setReportData({
          ...analytics,
          basicStats: stats,
          options: options
        });
      } else {
        setError(analyticsResponse.message || 'Erreur lors du chargement des analyses');
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const analyzeAdmissionsData = (admissions, stats, options) => {
    // Analyse par cours
    const courseAnalysis = {};
    admissions.forEach(admission => {
      if (admission.course) {
        const courseName = admission.course.name;
        if (!courseAnalysis[courseName]) {
          courseAnalysis[courseName] = {
            total: 0,
            draft: 0,
            submit: 0,
            confirm: 0,
            reject: 0,
            cancel: 0
          };
        }
        courseAnalysis[courseName].total++;
        courseAnalysis[courseName][admission.state]++;
      }
    });

    // Analyse par genre
    const genderAnalysis = { m: 0, f: 0, o: 0 };
    admissions.forEach(admission => {
      if (admission.gender) {
        genderAnalysis[admission.gender]++;
      }
    });

    // Analyse par mois
    const monthlyAnalysis = {};
    admissions.forEach(admission => {
      if (admission.application_date) {
        const date = new Date(admission.application_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyAnalysis[monthKey]) {
          monthlyAnalysis[monthKey] = 0;
        }
        monthlyAnalysis[monthKey]++;
      }
    });

    // Analyse géographique par ville
    const cityAnalysis = {};
    admissions.forEach(admission => {
      if (admission.city) {
        const city = admission.city;
        if (!cityAnalysis[city]) {
          cityAnalysis[city] = 0;
        }
        cityAnalysis[city]++;
      }
    });

    // Top 10 des admissions récentes
    const recentAdmissions = admissions
      .sort((a, b) => new Date(b.application_date) - new Date(a.application_date))
      .slice(0, 10);

    return {
      courseAnalysis,
      genderAnalysis,
      monthlyAnalysis,
      cityAnalysis,
      recentAdmissions,
      totalStats: stats,
      options
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submit: 'warning',
      confirm: 'success',
      reject: 'error',
      cancel: 'secondary'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Brouillon',
      submit: 'Soumise',
      confirm: 'Confirmée',
      reject: 'Rejetée',
      cancel: 'Annulée'
    };
    return labels[status] || status;
  };

  const exportReport = () => {
    // Logique d'export (PDF, Excel, etc.)
    console.log('Export rapport...');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!reportData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Aucune donnée disponible pour les rapports
      </Alert>
    );
  }

  const courseData = Object.entries(reportData.course_performance?.course_statistics || {}).map(([course, data]) => ({
    label: course,
    value: data.total_applications
  }));

  const genderData = Object.entries(reportData.geographic_distribution?.countries || {})
    .slice(0, 5)
    .map(([country, data]) => ({
      label: country,
      value: data.total
    }));

  const statusData = Object.entries(reportData.conversion_rates?.overall_rates || {}).map(([status, data]) => ({
    label: getStatusLabel(status),
    value: data.count
  }));

  const cityData = Object.entries(reportData.geographic_distribution?.cities || {})
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([city, data]) => ({
      label: city,
      value: data.total
    }));

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête avec filtres */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            📊 Rapports détaillés des admissions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportReport}
            sx={{ borderRadius: 2 }}
          >
            Exporter
          </Button>
        </Box>

        {/* Filtres */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Période</InputLabel>
              <Select
                value={filters.period}
                label="Période"
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              >
                <MenuItem value="week">Cette semaine</MenuItem>
                <MenuItem value="month">Ce mois</MenuItem>
                <MenuItem value="quarter">Ce trimestre</MenuItem>
                <MenuItem value="year">Cette année</MenuItem>
                <MenuItem value="all">Toutes les périodes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cours</InputLabel>
              <Select
                value={filters.course}
                label="Cours"
                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
              >
                <MenuItem value="">Tous les cours</MenuItem>
                {reportData.options?.courses?.map(course => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="submit">Soumise</MenuItem>
                <MenuItem value="confirm">Confirmée</MenuItem>
                <MenuItem value="reject">Rejetée</MenuItem>
                <MenuItem value="cancel">Annulée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques générales */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
          📈 Vue d'ensemble
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">
                {reportData.total_admissions || 0}
              </Typography>
              <Typography variant="body2">
                Total admissions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">
                {reportData.conversion_rates?.confirmation_rate || 0}%
              </Typography>
              <Typography variant="body2">
                Taux de confirmation
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">
                {reportData.course_performance?.total_courses || 0}
              </Typography>
              <Typography variant="body2">
                Cours actifs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">
                {reportData.geographic_distribution?.geographic_diversity || 0}
              </Typography>
              <Typography variant="body2">
                Villes représentées
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Graphiques et analyses */}
      <Grid container spacing={3}>
        {/* Tendances temporelles */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
            <TemporalTrendsChart
              data={reportData.temporal_trends?.monthly_trends}
              title="📅 Tendances mensuelles"
            />
          </Card>
        </Grid>

        {/* Répartition par cours */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
            <SimpleBarChart
              data={courseData}
              title="📚 Admissions par cours"
              color="#1976d2"
            />
          </Card>
        </Grid>

        {/* Répartition par statut */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
            <SimplePieChart
              data={statusData}
              title="📋 Répartition par statut"
            />
          </Card>
        </Grid>

        {/* Top villes */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
            <SimpleBarChart
              data={cityData}
              title="🏙️ Top 10 des villes"
              color="#2e7d32"
            />
          </Card>
        </Grid>
      </Grid>

      {/* Analyse de conversion */}
      <Paper elevation={3} sx={{ mt: 3, borderRadius: 2 }}>
        <ConversionAnalysis conversionData={reportData.conversion_rates} />
      </Paper>

      {/* Prédictions */}
      <Paper elevation={3} sx={{ mt: 3, borderRadius: 2 }}>
        <PredictionsCard predictions={reportData.predictions} />
      </Paper>

      {/* Analyse détaillée par cours */}
      <Paper elevation={3} sx={{ mt: 3, borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
            📈 Performance détaillée par cours
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(reportData.course_performance?.course_statistics || {}).map(([courseName, data]) => (
              <Grid item xs={12} md={6} lg={4} key={courseName}>
                <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    {courseName}
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total</Typography>
                      <Typography variant="body2" fontWeight="bold">{data.total_applications}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">En attente</Typography>
                      <Typography variant="body2">{data.pending}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main">Confirmées</Typography>
                      <Typography variant="body2">{data.confirmed}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="error.main">Rejetées</Typography>
                      <Typography variant="body2">{data.rejected}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="info.main">Revenus potentiels</Typography>
                      <Typography variant="body2">{data.revenue_potential?.toLocaleString()} FCFA</Typography>
                    </Box>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={data.confirmation_rate || 0}
                    sx={{ mt: 2, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Taux de confirmation: {data.confirmation_rate || 0}%
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default DetailedReports; 