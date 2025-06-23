import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Fade,
  Zoom,
  Stack,
  Container,
  Divider,
  Badge,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useTeachers } from '../../hooks/useTeachers';
import TeacherForm from './TeacherForm';
import ConfirmDialog from '../common/ConfirmDialog';

// Composant pour les statistiques en haut
const StatisticsCards = ({ totalCount, activeCount, loading }) => {
  const stats = [
    {
      title: 'Total Enseignants',
      value: totalCount,
      icon: <SchoolIcon />,
      color: 'primary',
      bgColor: 'white'
    },
    {
      title: 'Enseignants Actifs',
      value: activeCount,
      icon: <PersonIcon />,
      color: 'success',
      bgColor: 'white'
    },
    {
      title: 'Nouveaux ce mois',
      value: '5',
      icon: <CalendarIcon />,
      color: 'info',
      bgColor: 'white'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Zoom in={true} timeout={300 + index * 100}>
            <Card 
              sx={{ 
                height: '120px',
                background: `linear-gradient(135deg, ${stat.bgColor} 0%, transparent 100%)`,
                border: `1px solid ${stat.bgColor}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  border: `2px solid ${stat.bgColor}`,
                }
              }}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color + '.main',
                      width: 56,
                      height: 56,
                      mr: 2,
                      boxShadow: 3
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color={stat.color + '.main'}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );
};

const TeacherList = () => {
  const navigate = useNavigate();
  const {
    teachers,
    loading,
    error,
    pagination,
    filters,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    changePage,
    changeLimit,
    search,
    sort,
    filterByActive,
    refresh
  } = useTeachers();

  // États pour l'UI
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [activeFilter, setActiveFilter] = useState(filters.active || 'all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTimer, setSearchTimer] = useState(null);

  // Calcul des statistiques
  const totalCount = pagination?.total_count || teachers?.length || 0;
  const activeCount = teachers?.filter(teacher => teacher.active !== false)?.length || 0;

  // Gestion de la recherche avec debounce
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const newTimer = setTimeout(() => {
      search(value);
    }, 500);

    setSearchTimer(newTimer);
  };

  // Gestion du changement de page
  const handleChangePage = (event, newPage) => {
    const targetPage = newPage + 1;
    changePage(targetPage);
  };

  // Gestion du changement de limite
  const handleChangeRowsPerPage = (event) => {
    changeLimit(parseInt(event.target.value, 10));
  };

  // Gestion du tri
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    sort(field, newDirection);
  };

  // Gestion du filtre actif/inactif
  const handleActiveFilterChange = (event) => {
    const value = event.target.value;
    setActiveFilter(value);
    filterByActive(value === 'all' ? null : value === 'active');
  };

  // Actions CRUD
  const handleCreate = () => {
    setSelectedTeacher(null);
    setFormOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormOpen(true);
  };

  const handleDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteTeacher(teacherToDelete.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setTeacherToDelete(null);
        setSuccessMessage('Enseignant supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleFormSubmit = async (teacherData) => {
    try {
      let result;
      if (selectedTeacher) {
        result = await updateTeacher(selectedTeacher.id, teacherData);
      } else {
        result = await createTeacher(teacherData);
      }
      
      if (result.success) {
        setFormOpen(false);
        setSelectedTeacher(null);
        setSuccessMessage(selectedTeacher ? 'Enseignant modifié avec succès' : 'Enseignant créé avec succès');
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return { success: false, error: error.message };
    }
  };

  const handleView = (teacher) => {
    navigate(`/teachers/${teacher.id}`);
  };

  const handleRefresh = () => {
    refresh();
  };

  // Utilitaires
  const getTeacherAvatar = (teacher) => {
    const initials = teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
    return initials.slice(0, 2);
  };

  const formatGender = (gender) => {
    if (!gender) return '';
    return gender === 'male' ? 'Homme' : gender === 'female' ? 'Femme' : gender;
  };

  const formatEmail = (email) => {
    if (!email) return 'Non renseigné';
    return email.length > 30 ? email.substring(0, 30) + '...' : email;
  };

  // Cleanup du timer
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  // Skeleton loader
  const renderSkeleton = () => (
    <TableContainer component={Paper} elevation={3}>
      <Table>
        <TableHead>
          <TableRow>
            {['Avatar', 'Nom', 'Email', 'Téléphone', 'Genre', 'Statut', 'Actions'].map((header) => (
              <TableCell key={header}>
                <Box sx={{ height: 20, bgcolor: 'grey.300', borderRadius: 1 }} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(7)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Box sx={{ height: cellIndex === 0 ? 40 : 20, bgcolor: 'grey.200', borderRadius: 1 }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Réessayer
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* En-tête */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary.main">
              <SchoolIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Gestion des Enseignants
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez votre équipe pédagogique
            </Typography>
          </Box>

          {/* Cartes statistiques */}
          <StatisticsCards 
            totalCount={totalCount}
            activeCount={activeCount}
            loading={loading}
          />

          {/* Outils et filtres */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Rechercher un enseignant..."
                  value={searchTerm}
                  onChange={handleSearch}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '&:hover': {
                        backgroundColor: '#f8f9fa',
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={activeFilter}
                    onChange={handleActiveFilterChange}
                    label="Statut"
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="active">Actifs</MenuItem>
                    <MenuItem value="inactive">Inactifs</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Tooltip title="Actualiser">
                    <IconButton 
                      onClick={handleRefresh}
                      disabled={loading}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Exporter">
                    <IconButton 
                      onClick={() => console.log('Export')}
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      px: 3
                    }}
                  >
                    Nouvel Enseignant
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Table des enseignants */}
          {loading ? (
            renderSkeleton()
          ) : (
            <Fade in={!loading} timeout={600}>
              <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Avatar</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Téléphone</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Genre</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachers && teachers.length > 0 ? (
                      teachers.map((teacher, index) => (
                        <Fade in={true} timeout={300 + index * 100} key={teacher.id}>
                          <TableRow 
                            hover
                            sx={{ 
                              '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                              '&:hover': { bgcolor: 'action.selected' },
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <TableCell>
                              <Avatar
                                sx={{
                                  bgcolor: 'primary.main',
                                  width: 40,
                                  height: 40,
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {getTeacherAvatar(teacher)}
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {teacher.name || 'Non renseigné'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />
                                <Typography variant="body2">
                                  {formatEmail(teacher.email)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PhoneIcon sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />
                                <Typography variant="body2">
                                  {teacher.phone || teacher.mobile || 'Non renseigné'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatGender(teacher.gender)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={teacher.active !== false ? 'Actif' : 'Inactif'}
                                color={teacher.active !== false ? 'success' : 'default'}
                                size="small"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Tooltip title="Voir">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleView(teacher)}
                                    sx={{ color: 'info.main' }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit(teacher)}
                                    sx={{ color: 'warning.main' }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDelete(teacher)}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        </Fade>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              Aucun enseignant trouvé
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                              {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter un enseignant'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination && pagination.total_count > 0 && (
                  <TablePagination
                    component="div"
                    count={pagination.total_count}
                    page={(pagination.current_page || 1) - 1}
                    onPageChange={handleChangePage}
                    rowsPerPage={pagination.limit || 10}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Lignes par page:"
                    labelDisplayedRows={({ from, to, count }) => 
                      `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                    }
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                    }}
                  />
                )}
              </TableContainer>
            </Fade>
          )}

          {/* Formulaire d'enseignant */}
          <TeacherForm
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setSelectedTeacher(null);
            }}
            onSubmit={handleFormSubmit}
            teacher={selectedTeacher}
          />

          {/* Dialog de confirmation de suppression */}
          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={confirmDelete}
            title="Supprimer l'enseignant"
            content={`Êtes-vous sûr de vouloir supprimer l'enseignant "${teacherToDelete?.name}" ? Cette action est irréversible.`}
          />

          {/* Message de succès */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={() => setSuccessMessage('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default TeacherList; 