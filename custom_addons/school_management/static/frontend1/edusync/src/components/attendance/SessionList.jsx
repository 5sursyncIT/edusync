import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, TextField, 
  Select, MenuItem, FormControl, InputLabel, CircularProgress, 
  Fade, Alert, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, Chip, IconButton, Pagination,
  Stack, InputAdornment, Tooltip, Card, CardContent, CardActions
} from '@mui/material';
import { 
  Calendar, Users, BookOpen, Filter, Download, Eye, Edit, Trash2, Search, 
  Plus, Clock, User, GraduationCap, RefreshCw, CheckCircle, School
} from 'lucide-react';
import { AccessTime } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSessions, useSessionActions } from '../../hooks/useAttendance';
import { useBatches, useAllSubjects, useFaculties } from '../../hooks/useOdoo';
import odooApi from '../../services/odooApi.jsx';

const SessionList = forwardRef(({ onNavigateToSession, onCreateSession, onShowSessionDetail }, ref) => {
  const navigate = useNavigate();
  
  // États locaux pour les filtres et la recherche
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);
  
  // Filtres initiaux
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    batch_id: '',
    subject_id: '',
    faculty_id: ''
  });

  // Hooks personnalisés
  const { data, loading, error, currentPage, updateFilters, goToPage, refetch } = useSessions(filters, 1, 20);
  const { deleteSession } = useSessionActions();
  const { data: batchesData } = useBatches();
  const { data: subjectsData } = useAllSubjects();
  const { data: facultiesData } = useFaculties();

  // Exposer la fonction refetch via la référence
  useImperativeHandle(ref, () => ({
    refresh: () => {
      console.log('🔄 SessionList: Rafraîchissement demandé via ref');
      refetch();
    }
  }));

  // Données formatées
  const sessions = useMemo(() => data?.sessions || [], [data]);
  const totalSessions = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => Math.ceil(totalSessions / 20), [totalSessions]);
  const batches = useMemo(() => batchesData?.batches || [], [batchesData]);
  const subjects = useMemo(() => subjectsData || [], [subjectsData]);
  const faculties = useMemo(() => facultiesData || [], [facultiesData]);

  // Sessions filtrées par recherche
  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    
    const searchLower = search.toLowerCase().trim();
    return sessions.filter(session => 
      session.name?.toLowerCase().includes(searchLower) ||
      session.subject?.name?.toLowerCase().includes(searchLower) ||
      session.batch?.name?.toLowerCase().includes(searchLower) ||
      session.faculty?.name?.toLowerCase().includes(searchLower)
    );
  }, [sessions, search]);

  // Gestionnaires d'événements
  const handleFilterChange = (key, value) => {
    console.log(`🔍 Changement de filtre: ${key} = ${value}`);
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    console.log(`📄 Changement de page: ${newPage}`);
    goToPage(newPage);
  };

  const handleNavigateToAttendance = (sessionId) => {
    console.log(`🎯 Navigation vers les présences pour la session ${sessionId}`);
    // Naviguer vers la page de gestion des présences avec la session pré-sélectionnée
    navigate(`/attendance/register?session=${sessionId}`);
  };

  const handleDelete = async (sessionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      try {
        console.log(`🗑️ Suppression de la session ${sessionId}`);
        const result = await deleteSession(sessionId);
        
        console.log('✅ Résultat suppression:', result);
        
        if (result && result.success) {
          console.log('🎉 Session supprimée avec succès');
          // Rafraîchir la liste
          refetch();
          
          // Optionnel: Afficher un message de succès
          // Vous pouvez ajouter un toast/snackbar ici si disponible
        } else {
          console.error('❌ Échec de la suppression:', result?.error);
          alert(`Erreur lors de la suppression: ${result?.error || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
      }
    }
  };

  // Badge d'état de session avec couleurs Material-UI
  const getStateBadge = (state) => {
    const styles = {
      draft: { bgcolor: '#f3f4f6', color: '#6b7280', label: 'Brouillon' },
      confirm: { bgcolor: '#eff6ff', color: '#3b82f6', label: 'Confirmée' },
      confirmed: { bgcolor: '#eff6ff', color: '#3b82f6', label: 'Confirmée' },
      done: { bgcolor: '#f0fdf4', color: '#16a34a', label: 'Terminée' },
      cancelled: { bgcolor: '#fef2f2', color: '#ef4444', label: 'Annulée' }
    };
    
    const config = styles[state] || { bgcolor: '#f3f4f6', color: '#6b7280', label: state || 'Inconnu' };
    return (
      <Chip 
        label={config.label} 
        size="small" 
        sx={{
          bgcolor: config.bgcolor,
          color: config.color,
          fontWeight: 500,
          border: 'none',
          fontSize: '0.75rem'
        }}
      />
    );
  };

  // Formatage de la date et heure
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Non définie';
    return new Date(dateTime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
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
            Chargement des sessions...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête moderne avec gradient */}
          <Paper elevation={1} sx={{ 
            mb: 4,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid #f0f0f0'
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
                    Gestion des Sessions
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
                    Organisez vos sessions de cours et gérez les présences
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    {totalSessions} session{totalSessions > 1 ? 's' : ''} disponible{totalSessions > 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                    startIcon={<RefreshCw size={18} />}
                    onClick={refetch}
                    disabled={loading}
                  >
                    Actualiser
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
                    startIcon={<Plus size={18} />}
                    onClick={() => onCreateSession && onCreateSession()}
                  >
                    Nouvelle Session
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Paper>

          {/* Barre de recherche et filtres */}
          <Paper elevation={0} sx={{ 
            mb: 3, 
            borderRadius: 2,
            border: '1px solid #f0f0f0',
            bgcolor: 'white'
          }}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Rechercher une session..."
                    value={search}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={18} style={{ color: '#9ca3af' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8fafc',
                        '& fieldset': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: '#d1d5db',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6366f1',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant={showFilters ? 'contained' : 'outlined'}
                      startIcon={<Filter size={18} />}
                      onClick={() => setShowFilters(!showFilters)}
                      sx={{ 
                        borderRadius: 2,
                        ...(showFilters ? {
                          bgcolor: '#6366f1',
                          '&:hover': { bgcolor: '#5855f0' }
                        } : {
                          borderColor: '#e5e7eb',
                          color: '#6b7280',
                          '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' }
                        })
                      }}
                    >
                      Filtres
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              {/* Panneau de filtres avec animation */}
              {showFilters && (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f0f0f0' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Matière</InputLabel>
                        <Select
                          value={filters.subject_id || ''}
                          label="Matière"
                          onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e5e7eb',
                            },
                          }}
                        >
                          <MenuItem value="">Toutes les matières</MenuItem>
                          {subjects.map((subject) => (
                            <MenuItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Promotion</InputLabel>
                        <Select
                          value={filters.batch_id || ''}
                          label="Promotion"
                          onChange={(e) => handleFilterChange('batch_id', e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e5e7eb',
                            },
                          }}
                        >
                          <MenuItem value="">Toutes les promotions</MenuItem>
                          {batches.map((batch) => (
                            <MenuItem key={batch.id} value={batch.id}>
                              {batch.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Enseignant</InputLabel>
                        <Select
                          value={filters.faculty_id || ''}
                          label="Enseignant"
                          onChange={(e) => handleFilterChange('faculty_id', e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e5e7eb',
                            },
                          }}
                        >
                          <MenuItem value="">Tous les enseignants</MenuItem>
                          {faculties.map((faculty) => (
                            <MenuItem key={faculty.id} value={faculty.id}>
                              {faculty.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Date début"
                        type="date"
                        value={filters.date_from || ''}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: '#e5e7eb',
                            },
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Grille de cartes pour les sessions */}
          {filteredSessions.length === 0 ? (
            <Paper sx={{ 
              p: 6, 
              textAlign: 'center', 
              borderRadius: 2,
              border: '1px solid #f0f0f0',
              bgcolor: 'white'
            }}>
              <GraduationCap size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <Typography variant="h6" color="#6b7280" gutterBottom>
                Aucune session trouvée
              </Typography>
              <Typography variant="body2" color="#9ca3af">
                {search ? 'Aucune session ne correspond à votre recherche.' : 'Aucune session n\'a été créée.'}
              </Typography>
              {!search && (
                <Button 
                  variant="contained" 
                  startIcon={<Plus size={18} />}
                  onClick={() => onCreateSession && onCreateSession()}
                  sx={{ 
                    mt: 3, 
                    borderRadius: 2,
                    bgcolor: '#6366f1',
                    '&:hover': { bgcolor: '#5855f0' }
                  }}
                >
                  Créer la première session
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredSessions.map((session) => (
                <Grid item xs={12} sm={6} lg={4} key={session.id}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      border: '1px solid #f0f0f0',
                      bgcolor: 'white',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        borderColor: '#e5e7eb'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* En-tête de la carte */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        mb: 3 
                      }}>
                        <Avatar sx={{ 
                          bgcolor: '#f8fafc', 
                          width: 40, 
                          height: 40,
                          border: '1px solid #e5e7eb'
                        }}>
                          <BookOpen size={20} style={{ color: '#6366f1' }} />
                        </Avatar>
                        {getStateBadge(session.state)}
                      </Box>

                      {/* Nom de la session */}
                      <Typography 
                        variant="h6" 
                        fontWeight="600" 
                        gutterBottom
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          color: '#1f2937',
                          mb: 2
                        }}
                      >
                        {session.name}
                      </Typography>

                      {/* Informations de la session */}
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <BookOpen size={14} style={{ color: '#9ca3af' }} />
                          <Typography variant="body2" color="#6b7280">
                            {session.subject?.name || session.subject_name || 'Matière non définie'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <School size={14} style={{ color: '#9ca3af' }} />
                          <Typography variant="body2" color="#6b7280">
                            {session.batch?.name || session.batch_name || 'Promotion non définie'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <User size={14} style={{ color: '#9ca3af' }} />
                          <Typography variant="body2" color="#6b7280">
                            {session.faculty?.name || session.teacher_name || 'Enseignant non défini'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Clock size={14} style={{ color: '#9ca3af' }} />
                          <Typography variant="body2" color="#6b7280">
                            {formatDateTime(session.start_datetime)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    {/* Actions de la carte */}
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CheckCircle size={16} />}
                            onClick={() => handleNavigateToAttendance(session.id)}
                            sx={{ 
                              borderRadius: 2,
                              bgcolor: '#6366f1',
                              '&:hover': { bgcolor: '#5855f0' },
                              boxShadow: 'none',
                              textTransform: 'none',
                              fontWeight: 500
                            }}
                          >
                            Présence
                          </Button>
                        </Grid>
                        <Grid item xs={3}>
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              onClick={() => onShowSessionDetail && onShowSessionDetail(session.id)}
                              sx={{ 
                                width: '100%', 
                                borderRadius: 2, 
                                border: '1px solid #e5e7eb',
                                color: '#6b7280',
                                '&:hover': { 
                                  bgcolor: '#f9fafb',
                                  borderColor: '#d1d5db'
                                }
                              }}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                        <Grid item xs={3}>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(session.id)}
                              sx={{ 
                                width: '100%', 
                                borderRadius: 2, 
                                border: '1px solid #fecaca',
                                color: '#ef4444',
                                '&:hover': { 
                                  bgcolor: '#fef2f2',
                                  borderColor: '#fca5a5'
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#6b7280',
                    borderColor: '#e5e7eb',
                    '&:hover': {
                      bgcolor: '#f9fafb',
                      borderColor: '#d1d5db'
                    },
                    '&.Mui-selected': {
                      bgcolor: '#6366f1',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#5855f0'
                      }
                    }
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Fade>
    </Container>
  );
});

SessionList.displayName = 'SessionList';

export default SessionList; 