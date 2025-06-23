import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, Chip, 
  CircularProgress, Alert, Tabs, Tab, Card, CardContent,
  Avatar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Stack
} from '@mui/material';
import { 
  Calendar, Clock, Users, BookOpen, User, Plus, 
  Play, Square, CheckCircle, X, Edit, Eye, Trash2
} from 'lucide-react';
import TimetableCreate from './TimetableCreate.jsx';
import TimetableDetail from './TimetableDetail.jsx';
import TimetableEdit from './TimetableEdit.jsx';
import TimetableWeekView from './TimetableWeekView.jsx';
import odooApi from '../../services/odooApi.jsx';

const TimetableManager = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await odooApi.getTimetables();
      setTimetables(response.data || []);
    } catch (err) {
      console.error('Erreur chargement emplois du temps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view, timetableId = null) => {
    setCurrentView(view);
    setSelectedTimetableId(timetableId);
  };

  const handleTimetableAction = async (action, timetableId) => {
    try {
      await odooApi.updateTimetable(timetableId, { action });
      await loadTimetables();
    } catch (err) {
      console.error(`Erreur action ${action}:`, err);
    }
  };

  const handleDelete = async (timetableId) => {
    console.log('🗑️ handleDelete appelé avec ID:', timetableId);
    
    // Vérifier si c'est un emploi du temps généré (avec préfixe "timetable_")
    if (typeof timetableId === 'string' && timetableId.startsWith('timetable_')) {
      setError('Impossible de supprimer cet emploi du temps car il est généré automatiquement à partir des sessions. Supprimez les sessions correspondantes pour le retirer de la liste.');
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) {
      try {
        setError(null);
        console.log('Suppression de l\'emploi du temps ID:', timetableId);
        
        const result = await odooApi.deleteTimetable(timetableId);
        console.log('Résultat suppression:', result);
        
        if (result.success) {
          // Afficher un message de succès temporaire
          setError(null);
          // Recharger la liste
          await loadTimetables();
          // Optionnel: afficher une notification de succès
          console.log('Emploi du temps supprimé avec succès:', result.message);
        } else {
          throw new Error(result.message || 'Erreur lors de la suppression');
        }
      } catch (err) {
        console.error('Erreur suppression:', err);
        setError(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  };

  const getStateBadge = (state) => {
    const config = {
      draft: { color: 'default', label: 'Brouillon' },
      active: { color: 'success', label: 'Actif' },
      archived: { color: 'warning', label: 'Archivé' }
    };
    
    const { color, label } = config[state] || config.draft;
    return <Chip label={label} color={color} size="small" />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar color="primary" />
              Gestion des Emplois du Temps
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Créez et gérez les emplois du temps des classes
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => handleViewChange('create')}
            size="large"
          >
            Nouvel Emploi du Temps
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Navigation des vues */}
      {currentView !== 'create' && currentView !== 'detail' && currentView !== 'edit' && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentView}
            onChange={(e, newValue) => handleViewChange(newValue)}
            variant="fullWidth"
          >
            <Tab label="Liste" value="list" />
            <Tab label="Vue Semaine" value="week" />
          </Tabs>
        </Paper>
      )}

      {/* Contenu selon la vue */}
      {currentView === 'list' && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Emploi du Temps
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Classe
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Année Académique
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Période
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    État
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timetables.map((timetable) => (
                  <TableRow key={timetable.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.100' }}>
                          <Calendar size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {timetable.name}
                            {typeof timetable.id === 'string' && timetable.id.startsWith('timetable_') && (
                              <Chip 
                                label="Auto" 
                                size="small" 
                                color="info" 
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {timetable.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {timetable.batch?.name || 'Non définie'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {timetable.academic_year?.name || 'Non définie'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(timetable.start_date)} - {formatDate(timetable.end_date)}
                        </Typography>
                        {timetable.semester && (
                          <Typography variant="caption" color="textSecondary">
                            {timetable.semester.name}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStateBadge(timetable.state)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Voir les détails">
                          <IconButton
                            size="small"
                            onClick={() => handleViewChange('detail', timetable.id)}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Éditer">
                          <IconButton
                            size="small"
                            onClick={() => handleViewChange('edit', timetable.id)}
                          >
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                        
                        {timetable.state === 'draft' && (
                          <Tooltip title="Activer">
                            <IconButton
                              size="small"
                              onClick={() => handleTimetableAction('activate', timetable.id)}
                              color="success"
                            >
                              <CheckCircle size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {timetable.state === 'active' && (
                          <Tooltip title="Archiver">
                            <IconButton
                              size="small"
                              onClick={() => handleTimetableAction('archive', timetable.id)}
                              color="warning"
                            >
                              <Square size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title={
                          typeof timetable.id === 'string' && timetable.id.startsWith('timetable_') 
                            ? "Cet emploi du temps est généré automatiquement et ne peut pas être supprimé" 
                            : "Supprimer"
                        }>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(timetable.id)}
                              color="error"
                              disabled={typeof timetable.id === 'string' && timetable.id.startsWith('timetable_')}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {timetables.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Calendar size={48} style={{ color: '#ccc', marginBottom: 16 }} />
              <Typography variant="h6" color="textSecondary">
                Aucun emploi du temps trouvé
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Commencez par créer votre premier emploi du temps
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {currentView === 'week' && (
        <TimetableWeekView 
          timetables={timetables}
          onSelectTimetable={(id) => handleViewChange('detail', id)}
        />
      )}

      {currentView === 'create' && (
        <TimetableCreate 
          onBack={() => handleViewChange('list')}
          onSuccess={() => {
            loadTimetables();
            handleViewChange('list');
          }}
        />
      )}

      {currentView === 'detail' && selectedTimetableId && (
        <TimetableDetail 
          timetableId={selectedTimetableId}
          refreshKey={refreshKey}
          onBack={() => handleViewChange('list')}
          onEdit={() => handleViewChange('edit', selectedTimetableId)}
        />
      )}

      {currentView === 'edit' && selectedTimetableId && (
        <TimetableEdit 
          timetableId={selectedTimetableId}
          onBack={() => handleViewChange('list')}
          onSuccess={() => {
            loadTimetables();
            setRefreshKey(prev => prev + 1);
            handleViewChange('detail', selectedTimetableId);
          }}
        />
      )}
    </Container>
  );
};

export default TimetableManager; 