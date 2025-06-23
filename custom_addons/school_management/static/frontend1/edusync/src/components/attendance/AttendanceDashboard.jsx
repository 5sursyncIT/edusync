import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Box, Typography, Paper, Grid, Card, CardContent, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Fade, Alert, Divider, Chip, Avatar,
  List, ListItem, ListItemText, ListItemAvatar, ListItemButton,
  Stack, IconButton
} from '@mui/material';
import {
  Users, Calendar, TrendingUp, TrendingDown, Clock, BookOpen, 
   Download, Eye, BarChart3
} from 'lucide-react';
import {
  useAttendanceStatistics, 
  useTodaySessions,
  useAttendanceReports
} from '../../hooks/useAttendance';
import { useBatches, useAllSubjects } from '../../hooks/useOdoo';
import odooApi from '../../services/odooApi.jsx';

const AttendanceDashboard = ({ onNavigateToSession, onNavigateToList }) => {
  // États locaux
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    batch_id: '',
    subject_id: ''
  });

  // Calculer les dates selon la période sélectionnée - VERSION STABILISÉE
  const dateRange = useMemo(() => {
    const today = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        return {
          date_from: today.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        };
      case 'week':
        startDate.setDate(today.getDate() - 7);
        return {
          date_from: startDate.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        };
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        return {
          date_from: startDate.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        };
      default:
        return {
          date_from: filters.date_from || '',
          date_to: filters.date_to || ''
        };
    }
  }, [selectedPeriod, filters.date_from, filters.date_to]);

  // Stabiliser les filtres finaux pour éviter les re-renders
  const finalFilters = useMemo(() => {
    return {
      ...filters,
      ...dateRange
    };
  }, [JSON.stringify(filters), JSON.stringify(dateRange)]);

  // Hooks
  const { data: statsData, loading: statsLoading } = useAttendanceStatistics(finalFilters);
  const { data: todaySessions, loading: sessionsLoading } = useTodaySessions({});
  const { data: batchesData } = useBatches();
  const { data: subjectsData } = useAllSubjects();

  // Données formatées
  const globalStats = statsData?.global_statistics || {};
  const byBatchStats = statsData?.by_batch || {};
  const batches = batchesData?.batches || [];
  const subjects = subjectsData || [];
  const sessionsToday = todaySessions || [];

  // Statistiques formatées
  const formattedStats = odooApi.formatAttendanceStats(globalStats);

  // Top 5 promotions par taux de présence
  const topBatches = useMemo(() => {
    return Object.entries(byBatchStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        rate: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [byBatchStats]);

  // Gestionnaires d'événements
  const handlePeriodChange = (event) => {
    setSelectedPeriod(event.target.value);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    setSelectedPeriod('custom');
  };

  // Carte de statistique simple
  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <Card sx={{ 
      height: '100%', 
      borderRadius: 2,
      border: `2px solid ${color}.main`
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: `${color}.main`, 
            color: 'white', 
            mr: 2
          }}>
            <Icon size={24} />
          </Avatar>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight="bold" color={`${color}.main`}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (statsLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 400,
          gap: 2
        }}>
          <CircularProgress size={48} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            Chargement du tableau de bord...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête simple */}
          <Paper elevation={2} sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white'
          }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1,
                  color: 'white'
                }}
              >
                <BarChart3 size={32} />
                Tableau de Bord Présences
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Suivez les présences de vos étudiants
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Eye size={20} />}
                onClick={() => onNavigateToList && onNavigateToList()}
                sx={{ 
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Voir tout
              </Button>
              <Button
                variant="contained"
                startIcon={<Download size={20} />}
                sx={{ 
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Exporter
              </Button>
            </Stack>
          </Paper>

          {/* Sélecteur de période simple */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Période</InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={handlePeriodChange}
                  label="Période"
                >
                  <MenuItem value="today">Aujourd'hui</MenuItem>
                  <MenuItem value="week">7 derniers jours</MenuItem>
                  <MenuItem value="month">30 derniers jours</MenuItem>
                  <MenuItem value="custom">Personnalisé</MenuItem>
                </Select>
              </FormControl>

              {selectedPeriod === 'custom' && (
                <>
                  <TextField
                    type="date"
                    label="Date de début"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="date"
                    label="Date de fin"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              )}
            </Box>
          </Paper>

          {/* Cartes de statistiques principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total"
                value={formattedStats.total}
                icon={Users}
                color="primary"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Taux de présence"
                value={`${formattedStats.attendanceRate}%`}
                subtitle={`${formattedStats.present} présents`}
                icon={TrendingUp}
                color="success"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Taux d'absence"
                value={`${formattedStats.absenceRate}%`}
                subtitle={`${formattedStats.absent} absents`}
                icon={TrendingDown}
                color="error"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="En retard"
                value={formattedStats.late}
                icon={Clock}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Grille avec sessions et promotions */}
          <Grid container spacing={3}>
            {/* Sessions d'aujourd'hui */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={2} sx={{ 
                p: 3, 
                borderRadius: 2, 
                height: '100%',
                border: '2px solid',
                borderColor: 'success.main'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'success.main'
                  }}>
                    <Calendar size={24} />
                    Sessions d'aujourd'hui
                  </Typography>
                  <Chip 
                    label={sessionsToday.length} 
                    color="success"
                  />
                </Box>
                
                {sessionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress color="success" />
                  </Box>
                ) : sessionsToday.length > 0 ? (
                  <List>
                    {sessionsToday.slice(0, 5).map(session => (
                      <ListItem key={session.id} disablePadding>
                        <ListItemButton
                          onClick={() => onNavigateToSession && onNavigateToSession(session.id)}
                          sx={{ borderRadius: 1, mb: 1 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                              <BookOpen size={20} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={session.subject?.name}
                            secondary={`${session.batch?.name} • ${odooApi.formatSessionTime(session.start_datetime)}`}
                          />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" color="success.main" fontWeight="bold">
                              {session.attendance_stats?.attendance_rate || 0}%
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {session.attendance_stats?.present_count || 0}/{session.attendance_stats?.total_students || 0}
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Avatar sx={{ bgcolor: 'grey.200', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                      <Calendar size={32} />
                    </Avatar>
                    <Typography color="textSecondary">
                      Aucune session aujourd'hui
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Top promotions */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={2} sx={{ 
                p: 3, 
                borderRadius: 2, 
                height: '100%',
                border: '2px solid',
                borderColor: 'info.main'
              }}>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3,
                  color: 'info.main'
                }}>
                  <BarChart3 size={24} />
                  Top Promotions
                </Typography>
                
                {topBatches.length > 0 ? (
                  <List>
                    {topBatches.map((batch, index) => (
                      <ListItem key={batch.name} sx={{ px: 0, mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'grey.400' : index === 2 ? 'orange.600' : 'info.main',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>
                            #{index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={batch.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Box sx={{ 
                                flex: 1, 
                                height: 8, 
                                bgcolor: 'grey.200', 
                                borderRadius: 1
                              }}>
                                <Box sx={{
                                  width: `${batch.rate}%`,
                                  height: '100%',
                                  bgcolor: 'info.main',
                                  borderRadius: 1
                                }} />
                              </Box>
                              <Typography variant="body2" fontWeight="bold" color="info.main">
                                {batch.rate}%
                              </Typography>
                            </Box>
                          }
                        />
                        <Typography variant="body2" color="textSecondary">
                          {batch.present}/{batch.total}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Avatar sx={{ bgcolor: 'grey.200', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                      <BarChart3 size={32} />
                    </Avatar>
                    <Typography color="textSecondary">
                      Aucune donnée disponible
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default AttendanceDashboard;