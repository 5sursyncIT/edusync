import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, TextField, MenuItem, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert, Skeleton, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, LinearProgress, Avatar, Menu,
  List, ListItem, ListItemText, ListItemIcon, Snackbar
} from '@mui/material';
import {
  Save, CheckCircle, Cancel, Person, CalendarToday,
  Book, School, AccessTime,
  Warning, Info, Refresh, Edit, Delete, PersonAdd,
  MoreVert
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { 
  useSessions, 
  useSessionAttendances, 
  useAttendanceActions 
} from '../../hooks/useAttendance';
import { useStudents } from '../../hooks/useOdoo';

const AttendanceRegister = () => {
  const [searchParams] = useSearchParams();
  
  // États locaux
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);

  // États pour les nouveaux modals CRUD
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Détecter si une session est passée en paramètre URL
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    if (sessionFromUrl && sessionFromUrl !== selectedSession) {
      console.log(`🎯 Session détectée depuis l'URL: ${sessionFromUrl}`);
      setSelectedSession(sessionFromUrl);
    }
  }, [searchParams, selectedSession]);

  // Calculer les filtres dynamiquement basés sur l'option showAllSessions
  const sessionFilters = useMemo(() => {
    if (showAllSessions) {
      // Retourner des filtres vides pour récupérer toutes les sessions
      console.log('🔍 AttendanceRegister: Récupération de toutes les sessions (aucun filtre)');
      return {};
    } else {
      // Filtrer par date sélectionnée
      console.log(`🔍 AttendanceRegister: Filtrage par date: ${selectedDate}`);
      return { date: selectedDate };
    }
  }, [showAllSessions, selectedDate]);

  // Hooks - Utiliser les filtres calculés
  const { data: sessionsData, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useSessions(sessionFilters);
  const { 
    attendances: sessionAttendances, 
    session: currentSessionData,
    loading: attendancesLoading, 
    error: attendancesError,
    refetch: refetchAttendances 
  } = useSessionAttendances(selectedSession, selectedDate);
  
  const { data: studentsData } = useStudents();
  const { 
    bulkSaveAttendances, 
    markAllPresent, 
    markAllAbsent, 
    quickAttendance,
    updateAttendance,
    deleteAttendance,
    loading: saveLoading 
  } = useAttendanceActions();

  // Données formatées avec useMemo pour éviter les re-renders
  const sessions = useMemo(() => sessionsData?.sessions || [], [sessionsData]);
  const students = useMemo(() => sessionAttendances || [], [sessionAttendances]);
  const existingAttendances = useMemo(() => {
    // Extraire les présences des données étudiants
    return (sessionAttendances || []).map(student => ({
      id: student.attendance?.id,
      student_id: student.id,
      state: student.attendance?.state || 'absent',
      remarks: student.attendance?.remarks || ''
    })).filter(att => att.id); // Garder seulement celles qui ont un ID (présences existantes)
  }, [sessionAttendances]);
  const allStudents = useMemo(() => studentsData?.students || [], [studentsData]);

  // Session sélectionnée
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id.toString() === selectedSession.toString());
  }, [sessions, selectedSession]);

  // Initialiser les données de présence
  useEffect(() => {
    if (students.length > 0 && selectedSession) {
      const initialData = {};
      students.forEach(student => {
        // Utiliser UNIQUEMENT les données de présence de l'API pour cette session spécifique
        // Ne pas conserver les données d'autres sessions
        const attendanceFromAPI = student.attendance || {};
        
        initialData[student.id] = {
          student_id: student.id,
          session_id: selectedSession,
          date: selectedDate,
          state: attendanceFromAPI.state || 'absent', // Utiliser l'état de l'API ou 'absent' par défaut
          remarks: attendanceFromAPI.remarks || '',
          attendance_id: attendanceFromAPI.id || null
        };
      });
      
      setAttendanceData(initialData);
    } else if (selectedSession && students.length === 0) {
      // Si aucun étudiant pour cette session, vider les données
      setAttendanceData({});
    }
  }, [students, selectedSession, selectedDate]);

  // Gestionnaires d'événements
  const handleSessionChange = (event) => {
    const newSessionId = event.target.value;
    
    // Vider complètement les données de présence avant de changer de session
    setAttendanceData({});
    
    // Changer la session sélectionnée
    setSelectedSession(newSessionId);
  };

  const handleDateChange = (event) => {
    const newDate = event.target.value;
    
    console.log(`📅 AttendanceRegister: Changement de date vers: ${newDate}`);
    
    // Vider les données de présence car on change de date
    setAttendanceData({});
    
    // Mettre à jour la date
    setSelectedDate(newDate);
    
    // Vider la session sélectionnée pour forcer un nouveau choix
    setSelectedSession('');
    
    // Les filtres se mettront à jour automatiquement via useMemo
  };

  const handleShowAllSessionsChange = (event) => {
    const showAll = event.target.checked;
    setShowAllSessions(showAll);
    
    // Vider la session sélectionnée pour forcer un nouveau choix
    setSelectedSession('');
    setAttendanceData({});
    
    console.log(`🔍 AttendanceRegister: ${showAll ? 'Affichage de toutes les sessions' : 'Filtrage par date: ' + selectedDate}`);
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleQuickSave = async (studentId) => {
    try {
      const data = attendanceData[studentId];
      if (!data) return;

      await quickAttendance(
        studentId,
        selectedSession,
        data.state,
        selectedDate,
        data.remarks
      );

      // Actualiser les données
      refetchAttendances();
      
      setSnackbar({ 
        open: true, 
        message: 'Présence sauvegardée avec succès !', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde rapide:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la sauvegarde: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleBulkSave = async () => {
    try {
      // Filtrer et formater les données de présence
      const attendanceArray = Object.values(attendanceData)
        .filter(data => data.student_id && data.session_id)
        .map(data => ({
          student_id: parseInt(data.student_id),
          session_id: parseInt(data.session_id),
          date: data.date || selectedDate,
          state: data.state || 'absent',
          remarks: data.remarks || ''
        }));

      console.log('🔍 handleBulkSave: Données formatées:', attendanceArray);

      if (attendanceArray.length === 0) {
        setSnackbar({ 
          open: true, 
          message: 'Aucune donnée de présence à sauvegarder', 
          severity: 'warning' 
        });
        return;
      }

      // Vérification supplémentaire des données
      const invalidItems = attendanceArray.filter(item => 
        !item.student_id || !item.session_id || !item.date || !item.state
      );

      if (invalidItems.length > 0) {
        console.error('❌ Données invalides détectées:', invalidItems);
        setSnackbar({ 
          open: true, 
          message: `❌ ${invalidItems.length} éléments ont des données manquantes`, 
          severity: 'error' 
        });
        return;
      }

      console.log('📡 handleBulkSave: Envoi des données à bulkSaveAttendances...');
      await bulkSaveAttendances(attendanceArray);
      
      // Actualiser les données
      refetchAttendances();
      
      setSnackbar({ 
        open: true, 
        message: '✅ Présences sauvegardées avec succès !', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde en masse:', error);
      setSnackbar({ 
        open: true, 
        message: '❌ Erreur lors de la sauvegarde: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleMarkAll = async (state) => {
    try {
      // Vérification de sécurité
      if (!markAllPresent || !markAllAbsent) {
        console.error('❌ Fonctions de marquage non disponibles:', { markAllPresent, markAllAbsent });
        setSnackbar({ 
          open: true, 
          message: '❌ Fonctions de marquage non disponibles. Veuillez recharger la page.', 
          severity: 'error' 
        });
        return;
      }

      if (!selectedSession) {
        setSnackbar({ 
          open: true, 
          message: '❌ Veuillez sélectionner une session', 
          severity: 'warning' 
        });
        return;
      }

      if (students.length === 0) {
        setSnackbar({ 
          open: true, 
          message: '❌ Aucun étudiant trouvé dans cette session', 
          severity: 'warning' 
        });
        return;
      }

      const studentIds = students.map(s => s.id);
      console.log(`🎯 handleMarkAll: ${state}, Session: ${selectedSession}, Étudiants: ${studentIds.length}, Date: ${selectedDate}`);
      
      if (state === 'present') {
        console.log('✅ Appel markAllPresent...');
        await markAllPresent(selectedSession, studentIds, selectedDate);
      } else {
        console.log('❌ Appel markAllAbsent...');
        await markAllAbsent(selectedSession, studentIds, selectedDate);
      }
      
      // Actualiser les données
      console.log('🔄 Actualisation des données...');
      refetchAttendances();
      
      setSnackbar({ 
        open: true, 
        message: `✅ Tous les étudiants marqués comme ${state === 'present' ? 'présents' : 'absents'} !`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('❌ Erreur lors du marquage en masse:', error);
      setSnackbar({ 
        open: true, 
        message: '❌ Erreur: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleDialogAction = async () => {
    if (dialogType === 'mark_all_present') {
      await handleMarkAll('present');
    } else if (dialogType === 'mark_all_absent') {
      await handleMarkAll('absent');
    }
    setShowDialog(false);
  };

  const openDialog = (type) => {
    setDialogType(type);
    setShowDialog(true);
  };

  // Nouvelles fonctions CRUD
  const handleEditAttendance = (student) => {
    const attendance = attendanceData[student.id];
    setSelectedStudent(student);
    setSelectedAttendance(attendance);
    setRemarks(attendance?.remarks || '');
    setEditDialog(true);
    setAnchorEl(null);
  };

  const handleDeleteAttendance = (student) => {
    const attendance = attendanceData[student.id];
    if (!attendance?.attendance_id) {
      setSnackbar({ 
        open: true, 
        message: 'Aucune présence enregistrée à supprimer', 
        severity: 'warning' 
      });
      return;
    }
    setSelectedStudent(student);
    setSelectedAttendance(attendance);
    setDeleteDialog(true);
    setAnchorEl(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedAttendance?.attendance_id) {
      setSnackbar({ 
        open: true, 
        message: 'Aucune présence à modifier', 
        severity: 'warning' 
      });
      return;
    }

    try {
      await updateAttendance(selectedAttendance.attendance_id, {
        state: selectedAttendance.state,
        remarks: remarks,
        date: selectedDate
      });

      // Actualiser les données
      refetchAttendances();
      
      setSnackbar({ 
        open: true, 
        message: 'Présence modifiée avec succès !', 
        severity: 'success' 
      });
      setEditDialog(false);
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la modification: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAttendance?.attendance_id) {
      setSnackbar({ 
        open: true, 
        message: 'Aucune présence à supprimer', 
        severity: 'warning' 
      });
      return;
    }

    try {
      await deleteAttendance(selectedAttendance.attendance_id);

      // Actualiser les données
      refetchAttendances();
      
      setSnackbar({ 
        open: true, 
        message: 'Présence supprimée avec succès !', 
        severity: 'success' 
      });
      setDeleteDialog(false);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la suppression: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleAddStudent = () => {
    setAddStudentDialog(true);
  };

  const handleAddStudentToSession = async (studentId) => {
    try {
      // Ajouter l'étudiant à la session avec une présence par défaut
      await quickAttendance(
        studentId,
        selectedSession,
        'absent',
        selectedDate,
        'Ajouté manuellement'
      );

      // Actualiser les données
      refetchAttendances();
      
      setSnackbar({ 
        open: true, 
        message: 'Étudiant ajouté à la session !', 
        severity: 'success' 
      });
      setAddStudentDialog(false);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'étudiant:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de l\'ajout: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  // Filtrer les étudiants non encore dans la session
  const availableStudents = useMemo(() => 
    allStudents.filter(student => 
      !students.some(sessionStudent => sessionStudent.id === student.id)
    ), [allStudents, students]
  );

  // Statistiques
  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(data => data.state === 'present').length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, rate };
  }, [students.length, attendanceData]);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Non défini';
    return new Date(dateTime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionInfo = () => {
    if (!currentSession) return null;
    
    // Utiliser directement les objets de l'API au lieu de chercher par ID
    const batch = currentSession.batch;
    const subject = currentSession.subject;
    const faculty = currentSession.faculty;
    
    console.log('🔍 AttendanceRegister - getSessionInfo:', {
      currentSession,
      batch,
      subject,
      faculty
    });
    
    return { batch, subject, faculty };
  };

  const sessionInfo = getSessionInfo();

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête simple */}
      <Paper elevation={2} sx={{ 
        mb: 3,
        bgcolor: 'primary.main',
        color: 'white',
        borderRadius: 2
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}>
            <CheckCircle sx={{ fontSize: 32 }} />
            Registre de Présence
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Marquez les présences rapidement et efficacement
          </Typography>
        </Box>
      </Paper>

      {/* Sélection de session et date */}
      <Paper elevation={2} sx={{ 
        mb: 3,
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'info.main'
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            color: 'info.main',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CalendarToday />
            Sélection de la session
          </Typography>
          
          {/* Option pour afficher toutes les sessions */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAllSessions}
                  onChange={handleShowAllSessionsChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Afficher toutes les sessions (sinon filtrées par date)
                </Typography>
              }
            />
            {showAllSessions && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                ⚠️ Toutes les sessions sont affichées, pas seulement celles de la date sélectionnée
              </Typography>
            )}
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                helperText={showAllSessions ? "La date est utilisée pour la prise de présence uniquement" : "Filtre les sessions de cette date"}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                select
                label="Session"
                value={selectedSession}
                onChange={handleSessionChange}
                disabled={sessions.length === 0}
                helperText={
                  sessions.length === 0 
                    ? (showAllSessions ? "Aucune session disponible" : "Aucune session disponible pour cette date")
                    : `${sessions.length} session${sessions.length > 1 ? 's' : ''} disponible${sessions.length > 1 ? 's' : ''}`
                }
              >
                {sessions.map((session) => {
                  // Utiliser directement les objets de l'API au lieu de chercher par ID
                  const subject = session.subject;
                  const batch = session.batch;
                  const faculty = session.faculty;
                  
                  console.log(`🔍 AttendanceRegister - Session ${session.id}:`, {
                    subject,
                    batch,
                    faculty,
                    start_datetime: session.start_datetime,
                    end_datetime: session.end_datetime
                  });
                  
                  const subjectName = subject?.name || 'Matière inconnue';
                  const batchName = batch?.name || 'Promotion inconnue';
                  const facultyName = faculty?.name || 'Enseignant inconnu';
                  const startTime = session.start_datetime ? formatDateTime(session.start_datetime) : 'N/A';
                  const endTime = session.end_datetime ? formatDateTime(session.end_datetime) : 'N/A';
                  
                  const displayText = `${subjectName} - ${batchName} (${facultyName}) - ${startTime} à ${endTime}`;
                  
                  console.log(`🔍 AttendanceRegister - Texte affiché pour session ${session.id}:`, displayText);
                  
                  return (
                    <MenuItem key={session.id} value={session.id}>
                      {displayText}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {selectedSession && currentSession && (
        <>
          {/* Informations de la session */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations de la session
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Book sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Matière
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {sessionInfo?.subject?.name || 'Matière inconnue'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <School sx={{ mr: 2, color: 'success.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Promotion
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {sessionInfo?.batch?.name || 'Promotion inconnue'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ mr: 2, color: 'info.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccessTime sx={{ mr: 2, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Horaire
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {formatDateTime(currentSession.start_datetime)} - {formatDateTime(currentSession.end_datetime)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Statistiques de présence */}
          <Paper elevation={2} sx={{ 
            mb: 3,
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'success.main'
          }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                color: 'success.main',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Person />
                Statistiques de présence
              </Typography>
              
              <Grid container spacing={3} mb={3}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                        <Person />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Card sx={{ border: '2px solid', borderColor: 'success.main', borderRadius: 2 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                        <CheckCircle />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {stats.present}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Présents
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Card sx={{ border: '2px solid', borderColor: 'error.main', borderRadius: 2 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                        <Cancel />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {stats.absent}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Absents
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Card sx={{ border: '2px solid', borderColor: 'warning.main', borderRadius: 2 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                        <Info />
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {stats.rate}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Taux
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, p: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.rate} 
                  sx={{ 
                    mb: 2, 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'grey.300'
                  }}
                />
                
                <Typography variant="body1" color="textPrimary" textAlign="center" fontWeight="bold">
                  Taux de présence: {stats.rate}%
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Actions en masse */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions rapides
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => openDialog('mark_all_present')}
                  disabled={saveLoading}
                >
                  Marquer tous présents
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => openDialog('mark_all_absent')}
                  disabled={saveLoading}
                >
                  Marquer tous absents
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={refetchAttendances}
                  disabled={attendancesLoading}
                >
                  Actualiser
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleBulkSave}
                  disabled={saveLoading || Object.keys(attendanceData).length === 0}
                  sx={{ ml: 'auto' }}
                >
                  Sauvegarder tout
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Liste des étudiants */}
          {attendancesLoading ? (
            <Box>
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : students.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun étudiant inscrit
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cette session ne contient aucun étudiant inscrit
              </Typography>
            </Paper>
          ) : (
            <Paper>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Liste des étudiants ({students.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={handleAddStudent}
                  disabled={availableStudents.length === 0}
                >
                  Ajouter un étudiant
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Étudiant</TableCell>
                      <TableCell>Matricule</TableCell>
                      <TableCell align="center">Présence</TableCell>
                      <TableCell>Remarques</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const attendance = attendanceData[student.id] || {};
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                {student.name?.charAt(0)?.toUpperCase() || 'E'}
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="500">
                                  {student.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {student.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {student.student_id || 'Non défini'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center">
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={attendance.state === 'present'}
                                  onChange={(e) => handleAttendanceChange(
                                    student.id, 
                                    'state', 
                                    e.target.checked ? 'present' : 'absent'
                                  )}
                                  color="success"
                                />
                              }
                              label={
                                <Chip
                                  label={attendance.state === 'present' ? 'Présent' : 'Absent'}
                                  color={attendance.state === 'present' ? 'success' : 'error'}
                                  size="small"
                                />
                              }
                            />
                          </TableCell>
                          
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="Remarques..."
                              value={attendance.remarks || ''}
                              onChange={(e) => handleAttendanceChange(
                                student.id, 
                                'remarks', 
                                e.target.value
                              )}
                              sx={{ minWidth: 150 }}
                            />
                          </TableCell>
                          
                          <TableCell align="center">
                            <Box display="flex" gap={1} justifyContent="center">
                              <Tooltip title="Sauvegarde rapide">
                                <IconButton
                                  size="small"
                                  onClick={() => handleQuickSave(student.id)}
                                  disabled={saveLoading}
                                  color="primary"
                                >
                                  <Save />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Éditer la présence">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditAttendance(student)}
                                  disabled={!attendance.attendance_id}
                                  color="info"
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Supprimer la présence">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAttendance(student)}
                                  disabled={!attendance.attendance_id}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                              
                              <IconButton
                                size="small"
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                              >
                                <MoreVert />
                              </IconButton>
                              
                              <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={() => setAnchorEl(null)}
                              >
                                <MenuItem onClick={() => handleEditAttendance(student)}>
                                  <ListItemIcon>
                                    <Edit fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText>Éditer</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => handleDeleteAttendance(student)}>
                                  <ListItemIcon>
                                    <Delete fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText>Supprimer</ListItemText>
                                </MenuItem>
                              </Menu>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Warning sx={{ mr: 2, color: 'warning.main' }} />
            Confirmation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'mark_all_present' 
              ? 'Êtes-vous sûr de vouloir marquer tous les étudiants comme présents ?'
              : 'Êtes-vous sûr de vouloir marquer tous les étudiants comme absents ?'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleDialogAction} 
            variant="contained"
            color={dialogType === 'mark_all_present' ? 'success' : 'error'}
            disabled={saveLoading}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {saveLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 3,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <LinearProgress sx={{ minWidth: 200 }} />
            <Typography>Sauvegarde en cours...</Typography>
          </Box>
        </Box>
      )}

      {/* Modals CRUD */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Edit sx={{ mr: 2, color: 'primary.main' }} />
            Modifier la présence
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ pt: 2 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {selectedStudent.name?.charAt(0)?.toUpperCase() || 'E'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedStudent.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStudent.email}
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="État de présence"
                    value={selectedAttendance?.state || 'absent'}
                    onChange={(e) => setSelectedAttendance(prev => ({
                      ...prev,
                      state: e.target.value
                    }))}
                  >
                    <MenuItem value="present">
                      <Box display="flex" alignItems="center">
                        <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                        Présent
                      </Box>
                    </MenuItem>
                    <MenuItem value="absent">
                      <Box display="flex" alignItems="center">
                        <Cancel sx={{ mr: 1, color: 'error.main' }} />
                        Absent
                      </Box>
                    </MenuItem>
                    <MenuItem value="late">
                      <Box display="flex" alignItems="center">
                        <AccessTime sx={{ mr: 1, color: 'warning.main' }} />
                        Retard
                      </Box>
                    </MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Remarques"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Ajoutez des remarques sur cette présence..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={selectedDate}
                    disabled
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saveLoading}
            startIcon={<Save />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Delete sx={{ mr: 2, color: 'error.main' }} />
            Supprimer la présence
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Cette action est irréversible. La présence sera définitivement supprimée.
              </Alert>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {selectedStudent.name?.charAt(0)?.toUpperCase() || 'E'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedStudent.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStudent.email}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                Êtes-vous sûr de vouloir supprimer la présence de cet étudiant pour cette session ?
              </Typography>
              
              {selectedAttendance && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Détails de la présence :
                  </Typography>
                  <Typography variant="body2">
                    État : {selectedAttendance.state === 'present' ? 'Présent' : 'Absent'}
                  </Typography>
                  <Typography variant="body2">
                    Date : {new Date(selectedDate).toLocaleDateString('fr-FR')}
                  </Typography>
                  {selectedAttendance.remarks && (
                    <Typography variant="body2">
                      Remarques : {selectedAttendance.remarks}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={saveLoading}
            startIcon={<Delete />}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addStudentDialog} onClose={() => setAddStudentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonAdd sx={{ mr: 2, color: 'success.main' }} />
            Ajouter un étudiant à la session
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {availableStudents.length === 0 ? (
              <Alert severity="info">
                Tous les étudiants sont déjà inscrits à cette session.
              </Alert>
            ) : (
              <>
                <Typography variant="body1" gutterBottom>
                  Sélectionnez un étudiant à ajouter à cette session :
                </Typography>
                
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {availableStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      divider
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAddStudentToSession(student.id)}
                          disabled={saveLoading}
                        >
                          Ajouter
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          {student.name?.charAt(0)?.toUpperCase() || 'E'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={student.name}
                        secondary={`${student.email} - ${student.student_id || 'Pas de matricule'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceRegister; 