import React from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Alert, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  CheckCircle, School, CalendarToday, People, 
  TrendingUp, Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AttendanceDemo = () => {
  const navigate = useNavigate();

  const demoStats = {
    sessionsToday: 5,
    studentsPresent: 142,
    studentsTotal: 165,
    attendanceRate: 86
  };

  const recentSessions = [
    {
      id: 1,
      subject: "Mathématiques",
      batch: "Terminale S1",
      time: "08:00 - 10:00",
      studentsPresent: 28,
      studentsTotal: 32,
      status: "completed"
    },
    {
      id: 2,
      subject: "Français",
      batch: "Première L2",
      time: "10:15 - 12:15",
      studentsPresent: 24,
      studentsTotal: 26,
      status: "completed"
    },
    {
      id: 3,
      subject: "Physique",
      batch: "Terminale S2",
      time: "14:00 - 16:00",
      studentsPresent: 0,
      studentsTotal: 30,
      status: "pending"
    }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          Démonstration - Système de Présence
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interface de test pour le système de gestion des présences EDUSYNC
        </Typography>
      </Box>

      {/* Alert d'information */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Mode démonstration :</strong> Ceci est une interface de test. 
          Utilisez les boutons ci-dessous pour accéder aux fonctionnalités réelles.
        </Typography>
      </Alert>

      {/* Statistiques du jour */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600">
                {demoStats.sessionsToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sessions aujourd'hui
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600">
                {demoStats.studentsPresent}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Étudiants présents
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600">
                {demoStats.studentsTotal}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total étudiants
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600">
                {demoStats.attendanceRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taux de présence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions principales */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Actions principales
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<School />}
                onClick={() => navigate('/attendance/register')}
                sx={{ py: 2 }}
              >
                Registre de Présence
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Assignment />}
                onClick={() => navigate('/attendance/reports')}
                sx={{ py: 2 }}
              >
                Rapports de Présence
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Sessions récentes */}
      <Paper>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sessions récentes
          </Typography>
          <List>
            {recentSessions.map((session, index) => (
              <React.Fragment key={session.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight="500">
                          {session.subject} - {session.batch}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            {session.time}
                          </Typography>
                          {session.status === 'completed' ? (
                            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          ) : (
                            <CalendarToday sx={{ color: 'warning.main', fontSize: 20 }} />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2">
                          {session.status === 'completed' 
                            ? `Présents: ${session.studentsPresent}/${session.studentsTotal}`
                            : `En attente - ${session.studentsTotal} étudiants`
                          }
                        </Typography>
                        {session.status === 'completed' && (
                          <Typography variant="body2" color="text.secondary">
                            Taux: {Math.round((session.studentsPresent / session.studentsTotal) * 100)}%
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < recentSessions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Instructions */}
      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Prêt à utiliser !</strong> Le système de présence est maintenant intégré. 
          Accédez via le menu "Présences" ou utilisez les boutons ci-dessus.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AttendanceDemo; 