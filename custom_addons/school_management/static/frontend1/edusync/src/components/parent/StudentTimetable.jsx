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
  Avatar,
  Stack,
  Divider,
  Fade,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Room as RoomIcon,
  CalendarToday as CalendarIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Class as ClassIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const StudentTimetable = ({ selectedChild }) => {
  const darkBlue = '#00008B';
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = semaine courante
  const [selectedDay, setSelectedDay] = useState(0); // 0 = tous les jours
  const [viewMode, setViewMode] = useState('week'); // week, day

  const daysOfWeek = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    if (selectedChild) {
      loadTimetable();
    }
  }, [selectedChild, selectedWeek]);

  const loadTimetable = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError('');

    try {
      const currentWeek = getCurrentWeekDates(selectedWeek)[0];
      const params = {
        week: currentWeek.toISOString().split('T')[0],
        day: selectedDay !== 'all' ? selectedDay : undefined
      };

      const response = await parentAPI.getStudentTimetable(selectedChild.id, params);
      
      if (response.status === 'success') {
        setTimetable(response.data.timetable || []);
      } else {
        setError(response.message || 'Erreur lors du chargement de l\'emploi du temps');
        setTimetable([]);
      }
    } catch (error) {
      console.error('Erreur emploi du temps:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service d\'emploi du temps non disponible. Veuillez contacter l\'administration.');
      } else {
        setError('Erreur de connexion');
      }
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'math': '#3b82f6',
      'french': '#10b981',
      'physics': '#8b5cf6',
      'chemistry': '#f59e0b',
      'biology': '#ef4444',
      'history': '#06b6d4',
      'geography': '#84cc16',
      'english': '#f97316',
      'spanish': '#ec4899',
      'german': '#6366f1'
    };
    const subjectKey = subject?.toLowerCase().replace(/[^a-z]/g, '');
    return colors[subjectKey] || '#6b7280';
  };

  const getCurrentWeekDates = (weekOffset = 0) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM format
  };

  const getClassesForDay = (dayIndex) => {
    return timetable.filter(item => {
      const itemDate = new Date(item.date);
      const weekDates = getCurrentWeekDates(selectedWeek);
      const targetDate = weekDates[dayIndex];
      return itemDate.toDateString() === targetDate.toDateString();
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getClassesForTimeSlot = (dayIndex, timeSlot) => {
    const dayClasses = getClassesForDay(dayIndex);
    return dayClasses.filter(item => 
      item.start_time.substring(0, 2) === timeSlot.substring(0, 2)
    );
  };

  const ClassCard = ({ classItem }) => (
    <Card
      elevation={2}
      sx={{
        mb: 1,
        borderLeft: `4px solid ${getSubjectColor(classItem.subject_name)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateX(4px)',
          boxShadow: 3,
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight="bold" color={getSubjectColor(classItem.subject_name)}>
            {classItem.subject_name || 'Matière'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
            </Typography>
          </Stack>
          {classItem.teacher_name && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {classItem.teacher_name}
              </Typography>
            </Stack>
          )}
          {classItem.room && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <RoomIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Salle {classItem.room}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const WeekView = () => {
    const weekDates = getCurrentWeekDates(selectedWeek);
    
    return (
      <Grid container spacing={2}>
        {daysOfWeek.map((day, dayIndex) => {
          const dayClasses = getClassesForDay(dayIndex);
          const dayDate = weekDates[dayIndex];
          const isToday = dayDate.toDateString() === new Date().toDateString();
          
          return (
            <Grid item xs={12} md={6} lg={4} key={dayIndex}>
              <Card 
                elevation={isToday ? 4 : 1}
                sx={{ 
                  height: '100%',
                  border: isToday ? `2px solid ${darkBlue}` : 'none'
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color={isToday ? darkBlue : 'text.primary'}>
                      {day}
                    </Typography>
                    <Stack alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {dayDate.getDate()}/{dayDate.getMonth() + 1}
                      </Typography>
                      {isToday && (
                        <Chip label="Aujourd'hui" size="small" color="primary" />
                      )}
                    </Stack>
                  </Stack>
                  
                  {dayClasses.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ScheduleIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Aucun cours
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {dayClasses.map((classItem, index) => (
                        <ClassCard key={index} classItem={classItem} />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const TableView = () => (
    <Card>
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Heure</strong></TableCell>
                {daysOfWeek.map((day, index) => (
                  <TableCell key={index} align="center">
                    <strong>{day}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlots.map((timeSlot, timeIndex) => (
                <TableRow key={timeIndex}>
                  <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 'bold' }}>
                    {timeSlot}
                  </TableCell>
                  {daysOfWeek.map((day, dayIndex) => {
                    const classes = getClassesForTimeSlot(dayIndex, timeSlot);
                    return (
                      <TableCell key={dayIndex} sx={{ minWidth: 150, verticalAlign: 'top' }}>
                        {classes.map((classItem, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Chip
                              label={classItem.subject_name}
                              size="small"
                              sx={{
                                bgcolor: `${getSubjectColor(classItem.subject_name)}20`,
                                color: getSubjectColor(classItem.subject_name),
                                fontWeight: 'bold',
                                mb: 0.5,
                                display: 'block'
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                              {classItem.teacher_name}
                            </Typography>
                            {classItem.room && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Salle {classItem.room}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  if (!selectedChild) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un enfant pour voir son emploi du temps
        </Typography>
      </Paper>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box>
        <Typography variant="h5" fontWeight="bold" color={darkBlue} gutterBottom>
          Emploi du Temps - {selectedChild.name}
        </Typography>

        {/* Contrôles */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Semaine</InputLabel>
                  <Select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    label="Semaine"
                  >
                    <MenuItem value={-1}>Semaine précédente</MenuItem>
                    <MenuItem value={0}>Semaine courante</MenuItem>
                    <MenuItem value={1}>Semaine prochaine</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Tabs
                  value={viewMode}
                  onChange={(e, newValue) => setViewMode(newValue)}
                  variant="fullWidth"
                >
                  <Tab 
                    label="Vue Semaine" 
                    value="week" 
                    icon={<DateRangeIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Vue Tableau" 
                    value="table" 
                    icon={<ClassIcon />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {getCurrentWeekDates(selectedWeek)[0].toLocaleDateString('fr-FR')} - {' '}
                    {getCurrentWeekDates(selectedWeek)[6].toLocaleDateString('fr-FR')}
                  </Typography>
                </Stack>
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

        {/* Contenu principal */}
        {!loading && (
          <>
            {timetable.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun emploi du temps disponible
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  L'emploi du temps apparaîtra ici une fois configuré
                </Typography>
              </Paper>
            ) : (
              <>
                {viewMode === 'week' ? <WeekView /> : <TableView />}
                
                {/* Légende des matières */}
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Légende des Matières
                    </Typography>
                    <Grid container spacing={2}>
                      {[...new Set(timetable.map(item => item.subject_name))].map((subject, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: 1,
                                bgcolor: getSubjectColor(subject)
                              }}
                            />
                            <Typography variant="body2">{subject}</Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </Box>
    </Fade>
  );
};

export default StudentTimetable; 