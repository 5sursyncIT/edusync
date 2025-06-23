import React, { useState } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, Card, CardContent, 
  CardActions, Avatar, Chip, Stack, Divider, Alert
} from '@mui/material';
import { 
  Calendar, Users, BookOpen, GraduationCap, CheckCircle, 
  Clock, User, School, ArrowRight, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SessionsTest = () => {
  const navigate = useNavigate();
  
  // Données de test
  const testSessions = [
    {
      id: 51,
      name: "Mathématiques - Algèbre",
      subject: { name: "Mathématiques" },
      batch: { name: "L1 Informatique" },
      faculty: { name: "Prof. Martin" },
      state: "confirmed",
      start_datetime: "2024-12-31T10:00:00",
      students_count: 25
    },
    {
      id: 52,
      name: "Physique - Mécanique",
      subject: { name: "Physique" },
      batch: { name: "L2 Sciences" },
      faculty: { name: "Prof. Dubois" },
      state: "draft",
      start_datetime: "2024-12-31T14:00:00",
      students_count: 30
    },
    {
      id: 53,
      name: "Informatique - Programmation",
      subject: { name: "Informatique" },
      batch: { name: "L3 Info" },
      faculty: { name: "Prof. Leroy" },
      state: "done",
      start_datetime: "2024-12-30T08:00:00",
      students_count: 20
    }
  ];

  const handleNavigateToAttendance = (sessionId) => {
    console.log(`🎯 Navigation test vers les présences pour la session ${sessionId}`);
    navigate(`/attendance/register?session=${sessionId}`);
  };

  const handleNavigateToSessions = () => {
    navigate('/sessions');
  };

  const handleNavigateToSessionManager = () => {
    navigate('/sessions/manager');
  };

  const getStateBadge = (state) => {
    const styles = {
      draft: { color: 'default', label: 'Brouillon' },
      confirm: { color: 'primary', label: 'Confirmée' },
      confirmed: { color: 'primary', label: 'Confirmée' },
      done: { color: 'success', label: 'Terminée' },
      cancelled: { color: 'error', label: 'Annulée' }
    };
    
    const config = styles[state] || { color: 'default', label: state || 'Inconnu' };
    return <Chip label={config.label} color={config.color} size="small" className="status-chip" />;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Non définie';
    return new Date(dateTime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} className="fade-in">
      {/* En-tête de test */}
      <Paper elevation={3} className="gradient-header" sx={{ 
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3
      }}>
        <Box sx={{ p: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 0 }
          }}>
            <Box>
              <Typography 
                variant="h3" 
                fontWeight="bold" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1
                }}
              >
                <Sparkles size={48} />
                Test de Navigation - Sessions
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Testez la nouvelle interface de gestion des sessions et navigation vers les présences
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
                Cliquez sur "Présence" pour naviguer directement vers la gestion des présences
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Boutons de navigation */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Navigation vers les pages principales
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<Calendar />}
              onClick={handleNavigateToSessions}
              sx={{ borderRadius: 3 }}
            >
              Liste des Sessions
            </Button>
            <Button
              variant="outlined"
              startIcon={<GraduationCap />}
              onClick={handleNavigateToSessionManager}
              sx={{ borderRadius: 3 }}
            >
              Gestionnaire de Sessions
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => navigate('/attendance/register')}
              sx={{ borderRadius: 3 }}
            >
              Gestion des Présences
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Alert d'information */}
      <Alert 
        severity="info" 
        sx={{ mb: 4, borderRadius: 3 }}
        icon={<ArrowRight />}
      >
        <Typography variant="body1">
          <strong>Test de navigation :</strong> Cliquez sur le bouton "Présence" d'une session ci-dessous. 
          Vous serez redirigé vers la page de gestion des présences avec la session pré-sélectionnée.
        </Typography>
      </Alert>

      {/* Grille de test des sessions */}
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        Sessions de Test
      </Typography>
      
      <Grid container spacing={3}>
        {testSessions.map((session) => (
          <Grid item xs={12} sm={6} lg={4} key={session.id}>
            <Card 
              elevation={3} 
              className="session-card"
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* En-tête de la carte */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 2 
                }}>
                  <Avatar className="session-avatar" sx={{ 
                    bgcolor: 'primary.main', 
                    width: 48, 
                    height: 48 
                  }}>
                    <BookOpen size={24} />
                  </Avatar>
                  {getStateBadge(session.state)}
                </Box>

                {/* Nom de la session */}
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {session.name}
                </Typography>

                {/* Informations de la session */}
                <Stack spacing={1.5}>
                  <Box className="session-info">
                    <BookOpen size={16} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {session.subject?.name || 'Matière non définie'}
                    </Typography>
                  </Box>
                  
                  <Box className="session-info">
                    <School size={16} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {session.batch?.name || 'Promotion non définie'}
                    </Typography>
                  </Box>
                  
                  <Box className="session-info">
                    <User size={16} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {session.faculty?.name || 'Enseignant non défini'}
                    </Typography>
                  </Box>
                  
                  <Box className="session-info">
                    <Clock size={16} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(session.start_datetime)}
                    </Typography>
                  </Box>

                  <Box className="session-info">
                    <Users size={16} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {session.students_count} étudiant{session.students_count > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>

              <Divider />

              {/* Actions de la carte */}
              <CardActions className="card-actions" sx={{ p: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      className="attendance-button"
                      startIcon={<CheckCircle size={16} />}
                      endIcon={<ArrowRight size={16} />}
                      onClick={() => handleNavigateToAttendance(session.id)}
                      sx={{ 
                        borderRadius: 3,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Gérer les Présences
                    </Button>
                  </Grid>
                </Grid>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Instructions */}
      <Paper elevation={1} sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Instructions de test :
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            1. Cliquez sur "Gérer les Présences" pour une session → Vous êtes redirigé vers /attendance/register?session=ID
          </Typography>
          <Typography variant="body2">
            2. La session devrait être automatiquement pré-sélectionnée dans le formulaire de présences
          </Typography>
          <Typography variant="body2">
            3. Testez aussi les boutons de navigation en haut pour accéder aux différentes pages
          </Typography>
          <Typography variant="body2">
            4. Vérifiez que le style est moderne et responsive sur mobile
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default SessionsTest; 