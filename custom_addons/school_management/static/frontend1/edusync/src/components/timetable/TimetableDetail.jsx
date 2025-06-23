import React, { useState, useEffect } from 'react';
import { 
  Paper, Box, Typography, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Avatar, Divider, Stack, IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowLeft, Edit, Calendar, Clock, Users, MapPin, 
  BookOpen, User, Play, Pause, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import odooApi from '../../services/odooApi.jsx';

const TimetableDetail = ({ timetableId, refreshKey, onBack, onEdit }) => {
  const [timetable, setTimetable] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTimetable();
  }, [timetableId, refreshKey]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      
      // Appeler l'API pour récupérer les vraies données
      const response = await odooApi.getTimetable(timetableId);
      
      if (response.success) {
        setTimetable(response.data);
        setSlots(response.data.slot_ids || []);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Erreur chargement emploi du temps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'default', label: 'Brouillon', icon: Edit },
      active: { color: 'success', label: 'Actif', icon: CheckCircle },
      inactive: { color: 'warning', label: 'Inactif', icon: Pause },
      archived: { color: 'error', label: 'Archivé', icon: AlertCircle }
    };
    
    const { color, label, icon: Icon } = config[status] || config.draft;
    return (
      <Chip 
        label={label} 
        color={color} 
        size="small"
        icon={<Icon size={16} />}
      />
    );
  };

  const getSessionTypeBadge = (type) => {
    const config = {
      lecture: { color: 'primary', label: 'Cours' },
      practical: { color: 'info', label: 'TP' },
      tutorial: { color: 'warning', label: 'TD' },
      exam: { color: 'error', label: 'Examen' },
      other: { color: 'default', label: 'Autre' }
    };
    
    const { color, label } = config[type] || config.other;
    return <Chip label={label} color={color} size="small" />;
  };

  const getDayName = (dayIndex) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[dayIndex] || 'Jour';
  };

  const groupSlotsByDay = () => {
    const grouped = {};
    slots.forEach(slot => {
      const day = slot.day_of_week;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(slot);
    });
    
    // Trier les créneaux par heure
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    
    return grouped;
  };

  const getTimetableStats = () => {
    const totalSlots = slots.length;
    const subjects = new Set(slots.map(slot => slot.subject?.name)).size;
    const teachers = new Set(slots.map(slot => slot.faculty?.name)).size;
    const classrooms = new Set(slots.map(slot => slot.classroom?.name)).size;
    
    return { totalSlots, subjects, teachers, classrooms };
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Chargement...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Erreur: {error}</Typography>
      </Paper>
    );
  }

  const groupedSlots = groupSlotsByDay();
  const stats = getTimetableStats();

  return (
    <Box>
      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={onBack}
            variant="outlined"
          >
            Retour
          </Button>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Calendar />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {timetable?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {timetable?.batch?.name} - {timetable?.academic_year?.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {getStatusBadge(timetable?.state)}
            <Tooltip title="Actualiser les données">
              <IconButton
                onClick={loadTimetable}
                disabled={loading}
                size="small"
              >
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => onEdit && onEdit(timetable?.id)}
            >
              Modifier
            </Button>
          </Box>
        </Box>

        {/* Informations générales */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="textSecondary">Période</Typography>
            <Typography variant="body1" fontWeight="medium">
              {new Date(timetable?.start_date).toLocaleDateString('fr-FR')} - {new Date(timetable?.end_date).toLocaleDateString('fr-FR')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="textSecondary">Semestre</Typography>
            <Typography variant="body1" fontWeight="medium">
              {timetable?.semester?.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="textSecondary">Responsable</Typography>
            <Typography variant="body1" fontWeight="medium">
              {timetable?.faculty?.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="textSecondary">Créneaux totaux</Typography>
            <Typography variant="body1" fontWeight="medium">
              {stats.totalSlots}
            </Typography>
          </Grid>
        </Grid>

        {timetable?.description && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">Description</Typography>
            <Typography variant="body2">
              {timetable.description}
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Statistiques */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.main" fontWeight="bold">
                      {stats.totalSlots}
                    </Typography>
                    <Typography variant="caption">Créneaux</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {stats.subjects}
                    </Typography>
                    <Typography variant="caption">Matières</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                      {stats.teachers}
                    </Typography>
                    <Typography variant="caption">Enseignants</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main" fontWeight="bold">
                      {stats.classrooms}
                    </Typography>
                    <Typography variant="caption">Salles</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Planning hebdomadaire */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Planning hebdomadaire
              </Typography>
              
              {Object.keys(groupedSlots).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Calendar size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                  <Typography variant="h6" color="textSecondary">
                    Aucun créneau défini
                  </Typography>
                </Box>
              ) : (
                Object.entries(groupedSlots)
                  .sort(([dayA], [dayB]) => parseInt(dayA) - parseInt(dayB))
                  .map(([day, daySlots]) => (
                    <Box key={day} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {getDayName(parseInt(day))}
                      </Typography>
                      
                      <Stack spacing={1}>
                        {daySlots.map((slot) => (
                          <Card key={slot.id} variant="outlined" sx={{ borderLeft: 4, borderLeftColor: 'primary.main' }}>
                            <CardContent sx={{ py: 2 }}>
                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Clock size={16} color="#666" />
                                    <Typography variant="body2" fontWeight="medium">
                                      {slot.start_time} - {slot.end_time}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BookOpen size={16} color="#666" />
                                    <Typography variant="body2">
                                      {slot.subject?.name}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={2}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <User size={16} color="#666" />
                                    <Typography variant="body2">
                                      {slot.faculty?.name}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={2}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MapPin size={16} color="#666" />
                                    <Typography variant="body2">
                                      {slot.classroom?.name}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={2}>
                                  {getSessionTypeBadge(slot.session_type)}
                                </Grid>
                              </Grid>
                              
                              {slot.topic && (
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                  {slot.topic}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TimetableDetail; 