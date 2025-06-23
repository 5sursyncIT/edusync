import React, { useState } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, Alert,
  Fade, CircularProgress, Card, CardContent, Stack
} from '@mui/material';
import { 
  Plus, Edit, Eye, Calendar, 
  Users, BookOpen, GraduationCap, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSessions, useSessionActions } from '../../hooks/useAttendance';
import SessionList from './SessionList';
import SessionAttendance from './SessionAttendance';
import SessionCreate from './SessionCreate';
import SessionDetail from './SessionDetail';

const SessionManager = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'attendance', 'create', 'edit', 'detail'
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Hooks
  const { 
    data, 
    loading, 
    error, 
    refetch 
  } = useSessions({}, 1, 20);

  const {
    createSession,
    updateSession,
    deleteSession,
    loading: actionLoading
  } = useSessionActions();

  const sessions = data?.sessions || [];

  // Gestionnaires d'événements
  const handleNavigateToAttendance = (sessionId) => {
    console.log(`🎯 Navigation vers les présences pour la session ${sessionId}`);
    // Naviguer directement vers la page de gestion des présences avec la session
    navigate(`/attendance/register?session=${sessionId}`);
  };

  const handleCreateSession = () => {
    setCurrentView('create');
  };

  const handleShowSessionDetail = (sessionId) => {
    setSelectedSessionId(sessionId);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSessionId(null);
  };

  // Rendu conditionnel selon la vue
  if (currentView === 'attendance' && selectedSessionId) {
    return (
      <SessionAttendance
        sessionId={selectedSessionId}
        onClose={handleBackToList}
      />
    );
  }

  if (currentView === 'create') {
    return (
      <SessionCreate
        onBack={handleBackToList}
        onSuccess={() => {
          handleBackToList();
          setTimeout(() => {
            console.log('🔄 SessionManager: Rafraîchissement après création de session');
            refetch();
          }, 100);
        }}
      />
    );
  }

  if (currentView === 'detail' && selectedSessionId) {
    return (
      <SessionDetail
        sessionId={selectedSessionId}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === 'edit') {
    return (
      <SessionCreate
        mode="edit"
        sessionId={selectedSessionId}
        onBack={handleBackToList}
        onSuccess={() => {
          handleBackToList();
          setTimeout(() => {
            console.log('🔄 SessionManager: Rafraîchissement après édition de session');
            refetch();
          }, 100);
        }}
      />
    );
  }

  // Vue principale - Gestionnaire de sessions avec style moderne
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête moderne avec icônes */}
          <Paper elevation={1} sx={{ 
            mb: 4,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid #f0f0f0'
          }}>
            <Box sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography 
                    variant="h4" 
                    fontWeight="600" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mb: 1,
                      color: '#1a1a1a'
                    }}
                  >
                    <GraduationCap size={32} style={{ color: '#6366f1' }} />
                    Gestionnaire de Sessions
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                    Organisez vos sessions de cours et gérez les présences en un clic
                  </Typography>
                  <Stack direction="row" spacing={3} sx={{ color: '#999' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={16} />
                      <Typography variant="body2">
                        {sessions.length} session{sessions.length > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BookOpen size={16} />
                      <Typography variant="body2">
                        Accès rapide aux présences
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      sx={{ 
                        borderColor: '#e5e7eb',
                        color: '#6b7280',
                        '&:hover': { 
                          borderColor: '#d1d5db',
                          bgcolor: '#f9fafb'
                        },
                        borderRadius: 2
                      }}
                      startIcon={<Users size={18} />}
                      onClick={() => navigate('/attendance/register')}
                    >
                      Gérer Présences
                    </Button>
                    <Button
                      variant="contained"
                      sx={{ 
                        bgcolor: '#6366f1', 
                        color: 'white',
                        '&:hover': { bgcolor: '#5855f0' },
                        borderRadius: 2,
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }
                      }}
                      startIcon={<Calendar size={18} />}
                      onClick={handleCreateSession}
                    >
                      Nouvelle Session
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Accès rapide aux sessions récentes */}
          {sessions.length > 0 && (
            <Paper elevation={0} sx={{ 
              mb: 4, 
              borderRadius: 2,
              border: '1px solid #f0f0f0',
              bgcolor: 'white'
            }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  color: '#1f2937'
                }}>
                  <CheckCircle size={20} style={{ color: '#16a34a' }} />
                  Accès Rapide aux Présences
                </Typography>
                <Typography variant="body2" color="#6b7280" sx={{ mb: 3 }}>
                  Cliquez sur une session pour accéder directement à la gestion des présences
                </Typography>
                
                <Grid container spacing={2}>
                  {sessions.slice(0, 4).map((session) => (
                    <Grid item xs={12} sm={6} md={3} key={session.id}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid #f0f0f0',
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            borderColor: '#e5e7eb'
                          }
                        }}
                        onClick={() => handleNavigateToAttendance(session.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ color: '#1f2937' }}>
                            {session.subject?.name || 'Session'}
                          </Typography>
                          <Typography variant="body2" color="#6b7280" noWrap>
                            {session.batch?.name || 'Promotion'}
                          </Typography>
                          <Typography variant="caption" color="#9ca3af">
                            {session.faculty?.name || 'Enseignant'}
                          </Typography>
                          <Box sx={{ 
                            mt: 2, 
                            p: 1, 
                            bgcolor: '#f8fafc', 
                            borderRadius: 1,
                            textAlign: 'center',
                            border: '1px solid #e5e7eb'
                          }}>
                            <Typography variant="caption" color="#6366f1" fontWeight="500">
                              Cliquez pour les présences
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Liste complète des sessions */}
          <SessionList
            onNavigateToSession={handleNavigateToAttendance}
            onCreateSession={handleCreateSession}
            onShowSessionDetail={handleShowSessionDetail}
          />
        </Box>
      </Fade>
    </Container>
  );
};

export default SessionManager; 