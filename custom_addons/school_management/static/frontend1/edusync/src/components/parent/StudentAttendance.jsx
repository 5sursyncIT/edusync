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
  Fade,
  Badge
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const StudentAttendance = ({ selectedChild }) => {
  const darkBlue = '#00008B';
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    if (selectedChild) {
      loadAttendance();
    }
  }, [selectedChild, selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError('');

    try {
      const params = {
        month: selectedMonth,
        year: selectedYear
      };

      const response = await parentAPI.getStudentAttendance(selectedChild.id, params);
      
      if (response.status === 'success') {
        setAttendance(response.data.attendance || []);
        setStatistics(response.data.statistics || {});
      } else {
        setError(response.message || 'Erreur lors du chargement des présences');
        setAttendance([]);
        setStatistics({});
      }
    } catch (error) {
      console.error('Erreur présences:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service de présences non disponible. Veuillez contacter l\'administration.');
      } else {
        setError('Erreur de connexion');
      }
      setAttendance([]);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'excused': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getAttendanceStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleIcon />;
      case 'absent': return <CancelIcon />;
      case 'late': return <ScheduleIcon />;
      case 'excused': return <WarningIcon />;
      default: return <PersonIcon />;
    }
  };

  const getAttendanceStatusText = (status) => {
    switch (status) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'late': return 'Retard';
      case 'excused': return 'Excusé';
      default: return 'Inconnu';
    }
  };

  // Cartes de statistiques
  const StatCard = ({ title, value, subtitle, color = darkBlue, icon, percentage }) => (
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
          <Box sx={{ flex: 1 }}>
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
            {percentage !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48, ml: 2 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  // Générer les mois pour le sélecteur
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Générer les années (année courante et 2 précédentes)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  if (!selectedChild) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un enfant pour voir ses présences
        </Typography>
      </Paper>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box>
        <Typography variant="h5" fontWeight="bold" color={darkBlue} gutterBottom>
          Présences - {selectedChild.name}
        </Typography>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Taux de Présence"
              value={`${statistics.attendance_rate || 0}%`}
              subtitle="Ce mois"
              color="#10b981"
              icon={<CheckCircleIcon />}
              percentage={statistics.attendance_rate || 0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Jours Présents"
              value={statistics.present_days || 0}
              subtitle={`Sur ${statistics.total_days || 0} jours`}
              color="#3b82f6"
              icon={<TodayIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Absences"
              value={statistics.absent_days || 0}
              subtitle="Jours d'absence"
              color="#ef4444"
              icon={<CancelIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Retards"
              value={statistics.late_days || 0}
              subtitle="Arrivées tardives"
              color="#f59e0b"
              icon={<ScheduleIcon />}
            />
          </Grid>
        </Grid>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    label="Mois"
                  >
                    {months.map((month, index) => (
                      <MenuItem key={index + 1} value={index + 1}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Année</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    label="Année"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
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

        {/* Tableau des présences */}
        {!loading && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Détail des Présences - {months[selectedMonth - 1]} {selectedYear}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {attendance.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucune donnée de présence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Les données de présence apparaîtront ici une fois saisies
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Jour</strong></TableCell>
                        <TableCell><strong>Matière/Cours</strong></TableCell>
                        <TableCell><strong>Heure</strong></TableCell>
                        <TableCell><strong>Statut</strong></TableCell>
                        <TableCell><strong>Enseignant</strong></TableCell>
                        <TableCell><strong>Remarques</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.map((record, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <EventIcon fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="medium">
                                {new Date(record.date).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={record.subject_name || record.session_name || 'Cours'} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.start_time} - {record.end_time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getAttendanceStatusIcon(record.status)}
                              label={getAttendanceStatusText(record.status)}
                              size="small"
                              sx={{
                                bgcolor: `${getAttendanceStatusColor(record.status)}20`,
                                color: getAttendanceStatusColor(record.status),
                                borderColor: getAttendanceStatusColor(record.status),
                                '& .MuiChip-icon': {
                                  color: getAttendanceStatusColor(record.status)
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: darkBlue }}>
                                <PersonIcon fontSize="small" />
                              </Avatar>
                              <Typography variant="body2">
                                {record.teacher_name || 'N/A'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}
                            >
                              {record.remarks || record.reason || 'Aucune remarque'}
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

        {/* Légende des statuts */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Légende des Statuts
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon sx={{ color: '#10b981' }} />
                  <Typography variant="body2">Présent</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CancelIcon sx={{ color: '#ef4444' }} />
                  <Typography variant="body2">Absent</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="body2">Retard</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WarningIcon sx={{ color: '#3b82f6' }} />
                  <Typography variant="body2">Excusé</Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );
};

export default StudentAttendance; 