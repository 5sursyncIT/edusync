import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Button, Chip, CircularProgress, 
  Alert, Grid, Card, CardContent, Avatar, Divider, Stack
} from '@mui/material';
import { 
  ArrowLeft, Calendar, Clock, User, BookOpen, Users, 
  GraduationCap, CheckCircle, X, Info
} from 'lucide-react';
import odooApi from '../../services/odooApi.jsx';

const SessionDetail = ({ sessionId, onBack }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Récupération des détails de la session ${sessionId}`);
        
        // Récupérer les détails de la session
        const sessionResponse = await odooApi.getSession(sessionId);
        const sessionDetails = sessionResponse.data || sessionResponse;
        
        console.log('✅ Détails de session reçus:', sessionDetails);
        
        // Récupérer les statistiques de présences pour cette session
        try {
          const attendanceResponse = await odooApi.get(`/api/attendances/session/${sessionId}`);
          const attendanceData = attendanceResponse.data || attendanceResponse;
          
          if (attendanceData.status === 'success' && attendanceData.data) {
            // Calculer les statistiques
            const attendances = attendanceData.data;
            const stats = {
              total_students: attendances.length,
              present_count: attendances.filter(a => a.status === 'present').length,
              absent_count: attendances.filter(a => a.status === 'absent').length,
              late_count: attendances.filter(a => a.status === 'late').length,
              excused_count: attendances.filter(a => a.status === 'excused').length
            };
            
            stats.attendance_rate = stats.total_students > 0 
              ? Math.round((stats.present_count / stats.total_students) * 100) 
              : 0;
            
            setAttendanceStats(stats);
            console.log('✅ Statistiques de présences:', stats);
          }
        } catch (attendanceError) {
          console.warn('⚠️ Impossible de récupérer les présences:', attendanceError);
          // Utiliser les données de la session si disponibles
          if (sessionDetails.students && sessionDetails.students.length > 0) {
            setAttendanceStats({
              total_students: sessionDetails.students.length,
              present_count: 0,
              absent_count: 0,
              late_count: 0,
              excused_count: 0,
              attendance_rate: 0
            });
          }
        }
        
        setSession(sessionDetails);
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des détails:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  // Badge d'état de session
  const getStateBadge = (state) => {
    const styles = {
      draft: { color: 'default', label: 'Brouillon', icon: <Info size={16} /> },
      confirm: { color: 'primary', label: 'Confirmée', icon: <CheckCircle size={16} /> },
      confirmed: { color: 'primary', label: 'Confirmée', icon: <CheckCircle size={16} /> },
      done: { color: 'success', label: 'Terminée', icon: <CheckCircle size={16} /> },
      cancelled: { color: 'error', label: 'Annulée', icon: <X size={16} /> }
    };
    
    const config = styles[state] || styles.draft;
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        icon={config.icon}
        size="medium" 
      />
    );
  };

  // Formatage de date/heure
  const formatDateTime = (datetime) => {
    if (!datetime) return 'Non défini';
    try {
      return new Date(datetime).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return datetime;
    }
  };

  const formatTime = (datetime) => {
    if (!datetime) return 'Non défini';
    try {
      return new Date(datetime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return datetime;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            Chargement des détails de la session...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={onBack}
          sx={{ mb: 3 }}
        >
          Retour à la liste
        </Button>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={onBack}
          sx={{ mb: 3 }}
        >
          Retour à la liste
        </Button>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Session non trouvée
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête avec bouton retour */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={onBack}
          variant="outlined"
          sx={{ mb: 3, borderRadius: 3 }}
        >
          Retour à la liste
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
            <Calendar size={30} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {session.name}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Détails de la session #{session.id}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {getStateBadge(session.state)}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Informations principales */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={24} />
              Informations générales
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date et heure de début
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDateTime(session.start_datetime)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date et heure de fin
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDateTime(session.end_datetime)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Type de session
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Cours magistral
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Durée estimée
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {session.start_datetime && session.end_datetime ? 
                        `${formatTime(session.start_datetime)} - ${formatTime(session.end_datetime)}` : 
                        'Non définie'
                      }
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      État de la session
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {getStateBadge(session.state)}
                    </Box>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
            
            {session.description && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {session.description}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Participants et matière */}
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={24} />
              Participants et matière
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <BookOpen size={20} />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        Matière
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {(session.subject && session.subject.name) || session.subject_name || 'Matière non définie'}
                    </Typography>
                    {((session.subject && session.subject.id) || session.subject_id) && (
                      <Typography variant="body2" color="text.secondary">
                        ID: {(session.subject && session.subject.id) || session.subject_id}
                      </Typography>
                    )}
                    {session.subject && session.subject.code && (
                      <Typography variant="body2" color="text.secondary">
                        Code: {session.subject.code}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'info.light' }}>
                        <User size={20} />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        Enseignant
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {(session.faculty && session.faculty.name) || session.teacher_name || 'Enseignant non défini'}
                    </Typography>
                    {((session.faculty && session.faculty.id) || session.teacher_id) && (
                      <Typography variant="body2" color="text.secondary">
                        ID: {(session.faculty && session.faculty.id) || session.teacher_id}
                      </Typography>
                    )}
                    {session.faculty && session.faculty.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {session.faculty.email}
                      </Typography>
                    )}
                    {session.faculty && session.faculty.department && (
                      <Typography variant="body2" color="text.secondary">
                        Département: {session.faculty.department}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.light' }}>
                        <GraduationCap size={20} />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        Promotion
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {(session.batch && session.batch.name) || session.batch_name || 'Promotion non définie'}
                    </Typography>
                    {((session.batch && session.batch.id) || session.batch_id) && (
                      <Typography variant="body2" color="text.secondary">
                        ID: {(session.batch && session.batch.id) || session.batch_id}
                      </Typography>
                    )}
                    {session.batch && session.batch.code && (
                      <Typography variant="body2" color="text.secondary">
                        Code: {session.batch.code}
                      </Typography>
                    )}
                    {session.batch && session.batch.course_name && (
                      <Typography variant="body2" color="text.secondary">
                        Cours: {session.batch.course_name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Statistiques de présence */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle size={24} />
              Présences
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {attendanceStats ? (
              <Stack spacing={2}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'primary.50',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" color="primary.main">
                    Total d'étudiants
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {attendanceStats.total_students}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'success.50',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" color="success.main">
                    Présents
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {attendanceStats.present_count}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'error.50',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" color="error.main">
                    Absents
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {attendanceStats.absent_count}
                  </Typography>
                </Box>
                
                {attendanceStats.late_count > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'warning.50',
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" color="warning.main">
                      En retard
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {attendanceStats.late_count}
                    </Typography>
                  </Box>
                )}
                
                {attendanceStats.excused_count > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'info.50',
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" color="info.main">
                      Excusés
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {attendanceStats.excused_count}
                    </Typography>
                  </Box>
                )}
                
                {attendanceStats.total_students > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Taux de présence
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" align="center" color="primary.main">
                      {attendanceStats.attendance_rate}%
                    </Typography>
                  </Box>
                )}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Aucune donnée de présence disponible
                </Typography>
                {session.students_count !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    {session.students_count} étudiant{session.students_count > 1 ? 's' : ''} inscrit{session.students_count > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SessionDetail; 