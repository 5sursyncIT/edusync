import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Chip, Avatar,
  Stack, Divider
} from '@mui/material';
import { 
  Calendar, Clock, Users, BookOpen, User
} from 'lucide-react';

const TimetableWeekView = ({ timetables, onSelectTimetable }) => {
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [weekData, setWeekData] = useState({});
  const [loading, setLoading] = useState(false);

  const selectedTimetable = timetables.find(t => t.id == selectedTimetableId);

  useEffect(() => {
    if (selectedTimetable && selectedTimetable.slot_ids) {
      generateWeekView();
    }
  }, [selectedTimetable]);

  const generateWeekView = () => {
    if (!selectedTimetable?.slot_ids) return;

    const weekSchedule = {
      '0': [], // Lundi
      '1': [], // Mardi  
      '2': [], // Mercredi
      '3': [], // Jeudi
      '4': [], // Vendredi
      '5': [], // Samedi
      '6': []  // Dimanche
    };

    selectedTimetable.slot_ids.forEach(slot => {
      weekSchedule[slot.day_of_week].push(slot);
    });

    // Trier les créneaux par heure
    Object.keys(weekSchedule).forEach(day => {
      weekSchedule[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    setWeekData(weekSchedule);
  };

  const getDayName = (dayIndex) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[parseInt(dayIndex)];
  };

  const getSessionTypeColor = (type) => {
    const colors = {
      lecture: '#2196F3',
      practical: '#4CAF50', 
      tutorial: '#FF9800',
      exam: '#F44336',
      other: '#9C27B0'
    };
    return colors[type] || colors.other;
  };

  const getSessionTypeLabel = (type) => {
    const labels = {
      lecture: 'Cours',
      practical: 'TP',
      tutorial: 'TD', 
      exam: 'Examen',
      other: 'Autre'
    };
    return labels[type] || 'Cours';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Sélecteur d'emploi du temps */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Sélectionner un emploi du temps</InputLabel>
          <Select
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
            label="Sélectionner un emploi du temps"
          >
            {timetables.map((timetable) => (
              <MenuItem key={timetable.id} value={timetable.id}>
                {timetable.name} - {timetable.batch?.name} ({timetable.course?.name})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedTimetable && (
        <>
          {/* Informations de l'emploi du temps */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Calendar />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {selectedTimetable.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedTimetable.batch?.name} - {selectedTimetable.course?.name}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip 
                  label={selectedTimetable.state === 'active' ? 'Actif' : 
                         selectedTimetable.state === 'archived' ? 'Archivé' : 'Brouillon'}
                  color={selectedTimetable.state === 'active' ? 'success' : 
                         selectedTimetable.state === 'archived' ? 'warning' : 'default'}
                />
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Période</Typography>
                <Typography variant="body1">
                  {new Date(selectedTimetable.start_date).toLocaleDateString('fr-FR')} - {' '}
                  {new Date(selectedTimetable.end_date).toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Responsables</Typography>
                <Typography variant="body1">
                  {selectedTimetable.faculty?.length > 0 
                    ? selectedTimetable.faculty.join(', ') 
                    : 'Non assigné'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Créneaux</Typography>
                <Typography variant="body1">
                  {selectedTimetable.slot_ids?.length || 0} créneaux
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Vue semaine */}
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Emploi du temps hebdomadaire
              </Typography>
              
              <Grid container spacing={2}>
                {Object.keys(weekData).map(dayIndex => {
                  const daySlots = weekData[dayIndex] || [];
                  
                  return (
                    <Grid key={dayIndex} item xs={12} md={6} lg={4}>
                      <Card sx={{ height: '100%', minHeight: 400 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ 
                            textAlign: 'center', 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            p: 1, 
                            borderRadius: 1,
                            mb: 2 
                          }}>
                            {getDayName(dayIndex)}
                          </Typography>
                          
                          {daySlots.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="body2" color="textSecondary">
                                Aucun cours planifié
                              </Typography>
                            </Box>
                          ) : (
                            <Stack spacing={2}>
                              {daySlots.map((slot) => (
                                <Card 
                                  key={slot.id} 
                                  variant="outlined"
                                  sx={{ 
                                    borderLeft: 4,
                                    borderLeftColor: getSessionTypeColor(slot.session_type),
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                  onClick={() => onSelectTimetable && onSelectTimetable(selectedTimetable.id)}
                                >
                                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Typography variant="body2" fontWeight="bold">
                                        {slot.subject?.name || 'Matière'}
                                      </Typography>
                                      <Chip 
                                        label={getSessionTypeLabel(slot.session_type)}
                                        size="small"
                                        sx={{ 
                                          bgcolor: getSessionTypeColor(slot.session_type),
                                          color: 'white',
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Clock size={14} />
                                      <Typography variant="caption">
                                        {slot.start_time} - {slot.end_time}
                                      </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <User size={14} />
                                      <Typography variant="caption" color="textSecondary">
                                        {slot.faculty?.name || 'Enseignant non assigné'}
                                      </Typography>
                                    </Box>
                                    
                                    {slot.classroom && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <BookOpen size={14} />
                                        <Typography variant="caption" color="textSecondary">
                                          {slot.classroom.name}
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {slot.topic && (
                                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                        {slot.topic}
                                      </Typography>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Paper>
        </>
      )}

      {!selectedTimetable && timetables.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Calendar size={64} style={{ color: '#ccc', marginBottom: 16 }} />
          <Typography variant="h6" color="textSecondary">
            Sélectionnez un emploi du temps
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Choisissez un emploi du temps dans la liste pour voir la vue semaine
          </Typography>
        </Box>
      )}

      {timetables.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Calendar size={64} style={{ color: '#ccc', marginBottom: 16 }} />
          <Typography variant="h6" color="textSecondary">
            Aucun emploi du temps disponible
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Créez votre premier emploi du temps pour commencer
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default TimetableWeekView; 