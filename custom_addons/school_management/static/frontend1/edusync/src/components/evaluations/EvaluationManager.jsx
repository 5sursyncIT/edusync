import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Tooltip,
  Badge,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Menu
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Stop,
  Assessment,
  School,
  CalendarToday,
  Timer,
  GradeOutlined,
  Assignment,
  TrendingUp,
  CheckCircle,
  MoreVert
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const EvaluationManager = () => {
  // États pour les données
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // États pour l'interface
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'create', 'edit', 'view', 'notes'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    subject_id: '',
    batch_id: '',
    evaluation_type_id: '',
    state: '',
    search: ''
  });
  
  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    evaluation_type_id: '',
    subject_id: '',
    batch_id: '',
    teacher_id: '',
    date: '',
    duration: 60,
    max_marks: 20,
    description: '',
    state: 'draft'
  });
  
  const { api } = useOdoo();

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour les dialogs
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  
  // Menu d'actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuEvaluation, setMenuEvaluation] = useState(null);

  const types = [
    { value: 'devoir', label: 'Devoir' },
    { value: 'composition', label: 'Composition' },
    { value: 'examen', label: 'Examen' },
    { value: 'interrogation', label: 'Interrogation' }
  ];

  const states = [
    { value: 'draft', label: 'Brouillon', color: 'default' },
    { value: 'scheduled', label: 'Programmé', color: 'info' },
    { value: 'in_progress', label: 'En cours', color: 'warning' },
    { value: 'completed', label: 'Terminé', color: 'success' },
    { value: 'cancelled', label: 'Annulé', color: 'error' }
  ];

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger les évaluations quand les filtres changent
  useEffect(() => {
    loadEvaluations();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les données en parallèle
      const [evalTypeRes, subjectRes, batchRes, teacherRes] = await Promise.all([
        api.getEvaluationTypesForExams(),
        api.getAllSubjects(),
        api.getBatches(),
        api.getAllTeachers()
      ]);
      
      if (evalTypeRes.success) setEvaluationTypes(evalTypeRes.data);
      if (subjectRes.success) setSubjects(subjectRes.data);
      if (batchRes.success) setBatches(batchRes.data);
      if (teacherRes.success) setTeachers(teacherRes.data);
      
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async () => {
    try {
      // Nettoyer les filtres vides
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const response = await api.getEvaluations(cleanFilters);
      
      if (response.success) {
        setEvaluations(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement évaluations:', error);
      setError('Erreur lors du chargement des évaluations');
    }
  };

  const handleCreateEvaluation = async () => {
    try {
      const validation = api.validateEvaluationData(formData);
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      const response = await api.createEvaluation(formData);
      
      if (response.success) {
        setSuccess('Évaluation créée avec succès');
        loadEvaluations();
        closeDialog();
      }
    } catch (error) {
      console.error('Erreur création évaluation:', error);
      setError('Erreur lors de la création de l\'évaluation');
    }
  };

  const handleUpdateEvaluation = async () => {
    try {
      const validation = api.validateEvaluationData(formData);
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      const response = await api.updateEvaluation(selectedEvaluation.id, formData);
      
      if (response.success) {
        setSuccess('Évaluation mise à jour avec succès');
        loadEvaluations();
        closeDialog();
      }
    } catch (error) {
      console.error('Erreur mise à jour évaluation:', error);
      setError('Erreur lors de la mise à jour de l\'évaluation');
    }
  };

  const handleDeleteEvaluation = async (evaluationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) return;
    
    try {
      const response = await api.deleteEvaluation(evaluationId);
      
      if (response.success) {
        setSuccess('Évaluation supprimée avec succès');
        loadEvaluations();
      }
    } catch (error) {
      console.error('Erreur suppression évaluation:', error);
      setError('Erreur lors de la suppression de l\'évaluation');
    }
  };

  const handleStartEvaluation = async (evaluationId) => {
    try {
      const response = await api.startEvaluation(evaluationId);
      
      if (response.success) {
        setSuccess('Évaluation démarrée avec succès');
        loadEvaluations();
      }
    } catch (error) {
      console.error('Erreur démarrage évaluation:', error);
      setError('Erreur lors du démarrage de l\'évaluation');
    }
  };

  const handleCompleteEvaluation = async (evaluationId) => {
    try {
      const response = await api.completeEvaluation(evaluationId);
      
      if (response.success) {
        setSuccess('Évaluation terminée avec succès');
        loadEvaluations();
      }
    } catch (error) {
      console.error('Erreur completion évaluation:', error);
      setError('Erreur lors de la completion de l\'évaluation');
    }
  };

  const openDialog = (type, evaluation = null) => {
    setDialogType(type);
    setSelectedEvaluation(evaluation);
    
    if (evaluation) {
      setFormData({
        name: evaluation.name || '',
        evaluation_type_id: evaluation.evaluation_type_id || '',
        subject_id: evaluation.subject_id || '',
        batch_id: evaluation.batch_id || '',
        teacher_id: evaluation.teacher_id || '',
        date: evaluation.date || '',
        duration: evaluation.duration || 60,
        max_marks: evaluation.max_marks || 20,
        description: evaluation.description || '',
        state: evaluation.state || 'draft'
      });
    } else {
      setFormData({
        name: '',
        evaluation_type_id: '',
        subject_id: '',
        batch_id: '',
        teacher_id: '',
        date: '',
        duration: 60,
        max_marks: 20,
        description: '',
        state: 'draft'
      });
    }
    
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedEvaluation(null);
    setDialogType('');
    setFormData({
      name: '',
      evaluation_type_id: '',
      subject_id: '',
      batch_id: '',
      teacher_id: '',
      date: '',
      duration: 60,
      max_marks: 20,
      description: '',
      state: 'draft'
    });
  };

  const getStateColor = (state) => {
    const stateColors = {
      'draft': 'default',
      'scheduled': 'info',
      'in_progress': 'warning',
      'completed': 'success',
      'cancelled': 'error'
    };
    return stateColors[state] || 'default';
  };

  const getStateIcon = (state) => {
    const stateIcons = {
      'draft': <Edit fontSize="small" />,
      'scheduled': <Timer fontSize="small" />,
      'in_progress': <PlayArrow fontSize="small" />,
      'completed': <CheckCircle fontSize="small" />,
      'cancelled': <Stop fontSize="small" />
    };
    return stateIcons[state] || <Edit fontSize="small" />;
  };

  const getStateLabel = (state) => {
    const stateLabels = {
      'draft': 'Brouillon',
      'scheduled': 'Programmée',
      'in_progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return stateLabels[state] || state;
  };

  const getStateChip = (state) => {
    const stateInfo = states.find(s => s.value === state) || states[0];
    return <Chip label={stateInfo.label} color={stateInfo.color} size="small" icon={getStateIcon(state)} />;
  };

  // Filtrage des évaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    return (
      (!filters.subject_id || evaluation.subject_id === filters.subject_id) &&
      (!filters.batch_id || evaluation.batch_id === filters.batch_id) &&
      (!filters.evaluation_type_id || evaluation.evaluation_type_id === filters.evaluation_type_id) &&
      (!filters.state || evaluation.state === filters.state) &&
      (!filters.search || 
        evaluation.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        evaluation.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    );
  });

  // Pagination
  const paginatedEvaluations = filteredEvaluations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleMenuOpen = (event, evaluation) => {
    setAnchorEl(event.currentTarget);
    setMenuEvaluation(evaluation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuEvaluation(null);
  };

  if (loading) {
    return (
      <Box className="p-6">
        <Skeleton variant="rectangular" width="100%" height={60} className="mb-4" />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} lg={3} key={i}>
              <Skeleton variant="rectangular" width="100%" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box className="p-6">
      {/* En-tête */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800 mb-2">
            Gestion des Évaluations
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Créez et gérez les évaluations de vos étudiants
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog('create')}
        >
          Nouvelle Évaluation
        </Button>
      </Box>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filtres */}
      <Paper className="p-4 mb-6">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Matière</InputLabel>
              <Select
                value={filters.subject_id}
                onChange={(e) => setFilters({...filters, subject_id: e.target.value})}
                label="Matière"
              >
                <MenuItem value="">Toutes</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Classe</InputLabel>
              <Select
                value={filters.batch_id}
                onChange={(e) => setFilters({...filters, batch_id: e.target.value})}
                label="Classe"
              >
                <MenuItem value="">Toutes</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.evaluation_type_id}
                onChange={(e) => setFilters({...filters, evaluation_type_id: e.target.value})}
                label="Type"
              >
                <MenuItem value="">Tous</MenuItem>
                {evaluationTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>État</InputLabel>
              <Select
                value={filters.state}
                onChange={(e) => setFilters({...filters, state: e.target.value})}
                label="État"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="scheduled">Programmée</MenuItem>
                <MenuItem value="in_progress">En cours</MenuItem>
                <MenuItem value="completed">Terminée</MenuItem>
                <MenuItem value="cancelled">Annulée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Rechercher"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Nom d'évaluation..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des évaluations */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Durée</TableCell>
                <TableCell>Note Max</TableCell>
                <TableCell>État</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEvaluations.map((evaluation) => (
                <TableRow key={evaluation.id} hover>
                  <TableCell>
                    <Typography variant="body2" className="font-medium">
                      {evaluation.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {types.find(t => t.value === evaluation.evaluation_type_id)?.label || evaluation.evaluation_type_id}
                  </TableCell>
                  <TableCell>
                    {evaluation.date ? new Date(evaluation.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {evaluation.duration ? `${evaluation.duration} minutes` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="font-medium">
                      {evaluation.max_marks || 20}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStateChip(evaluation.state)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Voir">
                        <IconButton
                          size="small"
                          onClick={() => openDialog('view', evaluation)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {evaluation.state === 'draft' && (
                        <>
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => openDialog('edit', evaluation)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Démarrer">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStartEvaluation(evaluation.id)}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {evaluation.state === 'in_progress' && (
                        <Tooltip title="Terminer">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleCompleteEvaluation(evaluation.id)}
                          >
                            <Stop />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Plus d'actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, evaluation)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredEvaluations.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      </Paper>

      {/* Menu d'actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleStartEvaluation(menuEvaluation?.id);
          handleMenuClose();
        }}>
          <PlayArrow className="mr-2" />
          Démarrer
        </MenuItem>
        <MenuItem onClick={() => {
          handleCompleteEvaluation(menuEvaluation?.id);
          handleMenuClose();
        }}>
          <Stop className="mr-2" />
          Terminer
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteEvaluation(menuEvaluation?.id);
          handleMenuClose();
        }}>
          <Delete className="mr-2" />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog pour créer/modifier/voir */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && 'Créer une Évaluation'}
          {dialogType === 'edit' && 'Modifier l\'Évaluation'}
          {dialogType === 'view' && 'Détails de l\'Évaluation'}
          {dialogType === 'notes' && 'Notes de l\'Évaluation'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} className="mt-2">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={dialogType === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type d'évaluation *</InputLabel>
                <Select
                  value={formData.evaluation_type_id}
                  onChange={(e) => setFormData({...formData, evaluation_type_id: e.target.value})}
                  label="Type d'évaluation *"
                  disabled={dialogType === 'view'}
                >
                  {evaluationTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Matière *</InputLabel>
                <Select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                  label="Matière *"
                  disabled={dialogType === 'view'}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Classe *</InputLabel>
                <Select
                  value={formData.batch_id}
                  onChange={(e) => setFormData({...formData, batch_id: e.target.value})}
                  label="Classe *"
                  disabled={dialogType === 'view'}
                >
                  {batches.map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date *"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                disabled={dialogType === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Durée (minutes)"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                disabled={dialogType === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Note maximale"
                value={formData.max_marks}
                onChange={(e) => setFormData({...formData, max_marks: parseFloat(e.target.value)})}
                disabled={dialogType === 'view'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={dialogType === 'view'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog}>
            Annuler
          </Button>
          
          {dialogType === 'create' && (
            <Button
              variant="contained"
              onClick={handleCreateEvaluation}
              disabled={!formData.name || !formData.evaluation_type_id || !formData.subject_id || !formData.batch_id}
            >
              Créer
            </Button>
          )}
          
          {dialogType === 'edit' && (
            <Button
              variant="contained"
              onClick={handleUpdateEvaluation}
              disabled={!formData.name || !formData.evaluation_type_id || !formData.subject_id || !formData.batch_id}
            >
              Modifier
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l'évaluation</DialogTitle>
        <DialogContent>
          {selectedEvaluation && (
            <Box className="space-y-4">
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Nom</Typography>
                  <Typography variant="body1">{selectedEvaluation.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                  <Typography variant="body1">
                    {types.find(t => t.value === selectedEvaluation.evaluation_type_id)?.label || selectedEvaluation.evaluation_type_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                  <Typography variant="body1">
                    {selectedEvaluation.date ? new Date(selectedEvaluation.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">État</Typography>
                  {getStateChip(selectedEvaluation.state)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Durée</Typography>
                  <Typography variant="body1">{selectedEvaluation.duration ? `${selectedEvaluation.duration} minutes` : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Note maximale</Typography>
                  <Typography variant="body1">{selectedEvaluation.max_marks || 20}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{selectedEvaluation.description || 'Aucune description'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvaluationManager; 