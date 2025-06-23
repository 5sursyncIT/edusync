// src/components/subjects/SubjectList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, InputAdornment, 
  Button, Chip, CircularProgress, Alert, Skeleton,
  Container, Fade, Zoom, Avatar, Stack, Grid, Card, CardContent,
  Badge, Divider, IconButton, Tooltip, FormControl, InputLabel,
  Select, MenuItem, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, List, ListItem, ListItemText,
  CardHeader, CardActions, Collapse
} from '@mui/material';
import { 
  Search, Add, Edit, Delete, Visibility, FilterList, 
  Refresh, Download, Upload, Person, School, MenuBook, 
  Psychology, TrendingUp, Assessment, PlayArrow, Pause,
  CheckCircle, Schedule, Cancel, PlayCircleFilled,
  Computer, Engineering, Book, Assignment, 
  ExpandMore, ExpandLess, Close, Info
} from '@mui/icons-material';
import { useSubjects } from '../../hooks/useSubjects';
import { useOdooData } from '../../hooks/useOdoo';
import SubjectForm from './SubjectForm';

// Options pour les filtres
const contentTypeOptions = [
  { value: 'all', label: 'Tous les types', icon: <MenuBook />, color: 'default' },
  { value: 'chapitre', label: 'Chapitre', icon: <Book />, color: 'primary' },
  { value: 'module', label: 'Module', icon: <Psychology />, color: 'secondary' },
  { value: 'unite', label: 'Unité', icon: <Assignment />, color: 'info' },
  { value: 'tp', label: 'TP', icon: <Computer />, color: 'success' },
  { value: 'td', label: 'TD', icon: <Engineering />, color: 'warning' },
  { value: 'projet', label: 'Projet', icon: <TrendingUp />, color: 'error' },
  { value: 'evaluation', label: 'Évaluation', icon: <Assessment />, color: 'default' }
];

const stateOptions = [
  { value: 'all', label: 'Tous les états', icon: <MenuBook />, color: 'default' },
  { value: 'draft', label: 'Brouillon', icon: <Edit />, color: 'default' },
  { value: 'planned', label: 'Planifié', icon: <Schedule />, color: 'info' },
  { value: 'ongoing', label: 'En cours', icon: <PlayArrow />, color: 'warning' },
  { value: 'done', label: 'Terminé', icon: <CheckCircle />, color: 'success' },
  { value: 'cancelled', label: 'Annulé', icon: <Cancel />, color: 'error' }
];

// Fonctions utilitaires
const getContentTypeConfig = (type) => {
  return contentTypeOptions.find(option => option.value === type) || contentTypeOptions[0];
};

const getStateConfig = (state) => {
  return stateOptions.find(option => option.value === state) || stateOptions[0];
};

const getProgressColor = (completionRate) => {
  if (completionRate >= 80) return 'success';
  if (completionRate >= 50) return 'warning';
  return 'error';
};

const formatDuration = (duration) => {
  return `${duration || 0}h`;
};

const formatWeight = (weight) => {
  return `Coeff. ${weight || 1}`;
};

// Composant pour les statistiques en haut
const StatisticsCards = ({ subjects, loading }) => {
  const totalCount = subjects.length;
  const draftCount = subjects.filter(s => s.state === 'draft').length;
  const ongoingCount = subjects.filter(s => s.state === 'ongoing').length;
  const doneCount = subjects.filter(s => s.state === 'done').length;

  const stats = [
    { 
      title: 'Total Matières', 
      value: totalCount, 
      icon: MenuBook, 
      color: '#2563eb'
    },
    { 
      title: 'En Brouillon', 
      value: draftCount, 
      icon: Edit, 
      color: '#64748b'
    },
    { 
      title: 'En Cours', 
      value: ongoingCount, 
      icon: PlayCircleFilled, 
      color: '#059669'
    },
    { 
      title: 'Terminées', 
      value: doneCount, 
      icon: CheckCircle, 
      color: '#7c3aed'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: stat.color, fontWeight: 600 }}>
                    {loading ? <Skeleton width={60} /> : stat.value}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: stat.color,
                    width: 48,
                    height: 48
                  }}
                >
                  <stat.icon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Composant SubjectCard
const SubjectCard = ({ subject, onView, onEdit, onDelete }) => {
  const contentTypeConfig = getContentTypeConfig(subject.content_type);
  const stateConfig = getStateConfig(subject.state);

  const getStateColor = (state) => {
    const colors = {
      'draft': '#64748b',
      'planned': '#2563eb', 
      'ongoing': '#059669',
      'done': '#7c3aed',
      'cancelled': '#dc2626'
    };
    return colors[state] || '#64748b';
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        '&:hover': {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          transform: 'translateY(-1px)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: '#f1f5f9', color: '#475569' }}>
            <Book />
          </Avatar>
        }
        title={
          <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 500 }}>
            {subject.name}
          </Typography>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            {subject.code || 'Pas de code'}
          </Typography>
        }
        action={
          <Chip
            label={stateConfig.label}
            size="small"
            sx={{
              bgcolor: getStateColor(subject.state),
              color: 'white',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          />
        }
        sx={{ pb: 1 }}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
          {subject.description ? 
            (subject.description.length > 100 ? 
              subject.description.substring(0, 100) + '...' : 
              subject.description
            ) : 
            'Aucune description'
          }
        </Typography>
        
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Type:
            </Typography>
            <Typography variant="body2">
              {contentTypeConfig.label}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Durée:
            </Typography>
            <Typography variant="body2">
              {formatDuration(subject.duration)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Coefficient:
            </Typography>
            <Typography variant="body2">
              {subject.weight || 1}
            </Typography>
          </Box>
          
          {subject.completion_rate !== undefined && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Progression
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>
                  {subject.completion_rate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={subject.completion_rate}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#2563eb'
                  }
                }}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(subject)}
          sx={{ 
            color: '#475569',
            '&:hover': { bgcolor: '#f1f5f9' }
          }}
        >
          Voir
        </Button>
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => onEdit(subject)}
          sx={{ 
            color: '#475569',
            '&:hover': { bgcolor: '#f1f5f9' }
          }}
        >
          Modifier
        </Button>
        <Button
          size="small"
          startIcon={<Delete />}
          onClick={() => onDelete(subject)}
          sx={{ 
            color: '#dc2626',
            '&:hover': { bgcolor: '#fef2f2' }
          }}
        >
          Supprimer
        </Button>
      </CardActions>
    </Card>
  );
};

// Composant principal
const SubjectList = () => {
  const navigate = useNavigate();
  
  const {
    subjects,
    loading,
    error,
    pagination,
    filters,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubject,
    changePage,
    changeLimit,
    search,
    sort,
    filterByContentType,
    filterByState,
    filterByCourse,
    clearFilters,
    refresh
  } = useSubjects();

  const data = useOdooData();
  const courses = data?.courses || [];

  // État local du composant
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // États pour les filtres locaux
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedContentType, setSelectedContentType] = useState(filters.content_type || 'all');
  const [selectedState, setSelectedState] = useState(filters.state || 'all');
  const [selectedCourse, setSelectedCourse] = useState(filters.course_id || 'all');
  const [sortOrder, setSortOrder] = useState(filters.order || 'name asc');

  // Fonctions pour les filtres
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    search(term);
  };

  const handleContentTypeFilter = (e) => {
    const type = e.target.value;
    setSelectedContentType(type);
    filterByContentType(type === 'all' ? null : type);
  };

  const handleStateFilter = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    filterByState(state === 'all' ? null : state);
  };

  const handleCourseFilter = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    filterByCourse(courseId === 'all' ? null : courseId);
  };

  const handleSort = (e) => {
    const order = e.target.value;
    setSortOrder(order);
    const [field, direction] = order.split(' ');
    sort(field, direction);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedContentType('all');
    setSelectedState('all');
    setSelectedCourse('all');
    setSortOrder('name asc');
    clearFilters();
  };

  // Fonctions CRUD
  const handleCreate = () => {
    setSelectedSubject(null);
    setFormOpen(true);
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormOpen(true);
  };

  const handleView = (subject) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleDelete = (subject) => {
    setSubjectToDelete(subject);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (subjectToDelete) {
      const result = await deleteSubject(subjectToDelete.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSubjectToDelete(null);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    let result;
    if (selectedSubject) {
      result = await updateSubject(selectedSubject.id, formData);
    } else {
      result = await createSubject(formData);
    }
    
    if (result.success) {
      setFormOpen(false);
      setSelectedSubject(null);
      refresh();
    }
    return result;
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={300}>
        <Box>
          {/* En-tête */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#2563eb', width: 48, height: 48 }}>
                  <MenuBook />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Gestion des Matières
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Gérez les chapitres, modules et unités d'enseignement
                  </Typography>
                </Box>
              </Stack>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={refresh}
                disabled={loading}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#475569',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f8fafc'
                  }
                }}
              >
                Actualiser
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                sx={{
                  bgcolor: '#2563eb',
                  '&:hover': {
                    bgcolor: '#1d4ed8'
                  }
                }}
              >
                Nouvelle Matière
              </Button>
            </Stack>
          </Stack>

          {/* Statistiques */}
          <StatisticsCards subjects={subjects} loading={loading} />

          {/* Filtres et recherche */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Rechercher une matière..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563eb',
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>État</InputLabel>
                  <Select
                    value={selectedState}
                    label="État"
                    onChange={handleStateFilter}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563eb',
                      },
                    }}
                  >
                    {stateOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {option.icon}
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedContentType}
                    label="Type"
                    onChange={handleContentTypeFilter}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563eb',
                      },
                    }}
                  >
                    {contentTypeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {option.icon}
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Cours</InputLabel>
                  <Select
                    value={selectedCourse}
                    label="Cours"
                    onChange={handleCourseFilter}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563eb',
                      },
                    }}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School />
                        Tous les cours
                      </Box>
                    </MenuItem>
                    {courses.map(course => (
                      <MenuItem key={course.id} value={course.id.toString()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <School />
                          {course.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Trier par</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Trier par"
                    onChange={handleSort}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563eb',
                      },
                    }}
                  >
                    <MenuItem value="name asc">Nom (A-Z)</MenuItem>
                    <MenuItem value="name desc">Nom (Z-A)</MenuItem>
                    <MenuItem value="sequence asc">Séquence (1-9)</MenuItem>
                    <MenuItem value="sequence desc">Séquence (9-1)</MenuItem>
                    <MenuItem value="state asc">État (A-Z)</MenuItem>
                    <MenuItem value="content_type asc">Type (A-Z)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button 
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={handleClearFilters}
                  sx={{
                    borderColor: '#e2e8f0',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      bgcolor: '#f8fafc'
                    }
                  }}
                >
                  Effacer les filtres
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Liste des matières */}
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : subjects.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
              <MenuBook sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#475569', fontWeight: 500 }} gutterBottom>
                Aucune matière trouvée
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || selectedState !== 'all' || selectedContentType !== 'all' 
                  ? 'Aucune matière ne correspond aux critères de recherche.'
                  : 'Commencez par créer votre première matière.'
                }
              </Typography>
              {!searchTerm && selectedState === 'all' && selectedContentType === 'all' && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreate}
                  sx={{ 
                    mt: 2,
                    bgcolor: '#2563eb',
                    '&:hover': {
                      bgcolor: '#1d4ed8'
                    }
                  }}
                >
                  Créer la première matière
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {subjects.map((subject) => (
                <Grid item xs={12} sm={6} lg={4} key={subject.id}>
                  <SubjectCard
                    subject={subject}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Formulaire de création/édition */}
          <SubjectForm
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setSelectedSubject(null);
            }}
            onSubmit={handleFormSubmit}
            subject={selectedSubject}
          />

          {/* Dialog de confirmation de suppression */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSubjectToDelete(null);
            }}
            PaperProps={{
              sx: {
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
              }
            }}
          >
            <DialogTitle sx={{ color: '#1e293b', fontWeight: 600 }}>
              Confirmer la suppression
            </DialogTitle>
            <DialogContent>
              <Typography>
                Êtes-vous sûr de vouloir supprimer la matière "{subjectToDelete?.name}" ?
                Cette action est irréversible.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button 
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSubjectToDelete(null);
                }}
                sx={{
                  color: '#475569',
                  '&:hover': {
                    bgcolor: '#f8fafc'
                  }
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={confirmDelete} 
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: '#dc2626',
                  '&:hover': {
                    bgcolor: '#b91c1c'
                  }
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Supprimer'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default SubjectList;