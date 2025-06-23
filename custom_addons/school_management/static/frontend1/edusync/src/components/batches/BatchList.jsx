import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Chip, Typography,
  TextField, InputAdornment, TablePagination, Tooltip,
  FormControl, Select, MenuItem, InputLabel, CircularProgress,
  Alert, Skeleton, Card, CardContent, Grid, Avatar, Stack,
  Container, Fade, Zoom, Badge, Divider
} from '@mui/material';
import { 
  Edit, Delete, Search, Add, Visibility, 
  FilterList, Refresh, Download, People, CalendarToday,
  School, Person, Group, TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useBatches } from '../../hooks/useBatches';
import BatchForm from './BatchForm';
import ConfirmDialog from '../common/ConfirmDialog';
import BatchDetail from './BatchDetail';

// Composant pour les statistiques en haut
const StatisticsCards = ({ totalCount, runningCount, loading }) => {
  const stats = [
    {
      title: 'Total Promotions',
      value: totalCount,
      icon: <School />,
      color: 'primary',
      bgColor: 'white'
    },
    {
      title: 'En Cours',
      value: runningCount,
      icon: <CalendarToday />,
      color: 'success',
      bgColor: 'white'
    },
    {
      title: 'Actives',
      value: totalCount,
      icon: <TrendingUp />,
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

const BatchList = () => {
  const navigate = useNavigate();
  const {
    batches,
    loading,
    error,
    pagination,
    filters,
    createBatch,
    updateBatch,
    deleteBatch,
    changePage,
    changeLimit,
    search,
    sort,
    filterByStatus,
    refresh,
    fetchBatches
  } = useBatches();

  // État local pour l'UI
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilterLocal] = useState(filters.status || 'all');
  const [schoolCycleFilter, setSchoolCycleFilter] = useState(filters.schoolCycle || 'all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, batch: null });

  // Timer pour le debounce de la recherche
  const [searchTimer, setSearchTimer] = useState(null);

  // Calculer les statistiques
  const runningCount = batches.filter(b => b.status === 'running').length;

  // Gestion de la recherche avec debounce
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Clear previous timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      search(value);
    }, 500);

    setSearchTimer(newTimer);
  };

  // Gestion du changement de page
  const handleChangePage = (event, newPage) => {
    changePage(newPage + 1);
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

  // Gestion des filtres
  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilterLocal(value);
    // Rafraîchir la liste avec le nouveau filtre
    fetchBatches(1, searchTerm, 'name asc', null, value === 'all' ? null : value);
  };

  const handleSchoolCycleFilterChange = (event) => {
    const value = event.target.value;
    setSchoolCycleFilter(value);
    // Ici on pourrait ajouter une fonction setSchoolCycleFilter dans useBatches si nécessaire
  };

  // Ouvrir le formulaire de création
  const handleCreate = () => {
    setSelectedBatch(null);
    setShowForm(true);
  };

  // Ouvrir le formulaire d'édition
  const handleEdit = (batch) => {
    setSelectedBatch(batch);
    setShowForm(true);
  };

  // Préparer la suppression
  const handleDelete = (batch) => {
    setDeleteConfirm({ open: true, batch });
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    try {
      const result = await deleteBatch(deleteConfirm.batch.id);
      if (result.success) {
        setDeleteConfirm({ open: false, batch: null });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Gestion de la soumission du formulaire
  const handleFormSubmit = async (batchData) => {
    try {
      let result;
      if (selectedBatch) {
        result = await updateBatch(selectedBatch.id, batchData);
      } else {
        result = await createBatch(batchData);
      }
      
      if (result.success) {
        setShowForm(false);
        setSelectedBatch(null);
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return { success: false, error: error.message };
    }
  };

  // Voir les détails d'un batch
  const handleView = (batch) => {
    navigate(`/batches/${batch.id}`);
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'info';
      case 'running': return 'success';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming': return 'À venir';
      case 'running': return 'En cours';
      case 'completed': return 'Terminé';
      default: return 'Inconnu';
    }
  };

  // Obtenir le libellé du cycle scolaire
  const getSchoolCycleLabel = (cycle) => {
    switch (cycle) {
      case 'primary': return 'École Primaire';
      case 'middle': return 'Collège';
      case 'high': return 'Lycée';
      default: return 'Non défini';
    }
  };

  // Obtenir la couleur du cycle scolaire
  const getSchoolCycleColor = (cycle) => {
    switch (cycle) {
      case 'primary': return 'success';
      case 'middle': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  // Cleanup du timer au démontage
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête avec titre et actions */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 0 }
          }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                color="blue"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1
                }}
              >
                <School sx={{ fontSize: 45 }} />
                Gestion des Promotions
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Gérez vos promotions et cycles scolaires facilement
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Actualiser la liste">
                <IconButton
                  color="blue"
                  onClick={refresh}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'blue',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />}
                onClick={handleCreate}
                size="large"
                sx={{ 
                  px: 2, 
                  py: 1,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: 3,
                  color: 'blue',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Nouvelle Promotion
              </Button>
            </Stack>
          </Box>

          {/* Cartes de statistiques */}
          <StatisticsCards 
            totalCount={pagination.totalCount} 
            runningCount={runningCount}
            loading={loading} 
          />

          {/* Barre de recherche améliorée */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              background: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Search color="primary" sx={{ fontSize: 28 }} />
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Rechercher une promotion par nom..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'white',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
                InputProps={{
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Badge badgeContent={pagination.totalCount} color="primary" max={999}>
                <FilterList color="action" />
              </Badge>
            </Box>
          </Paper>

          {/* Messages d'erreur */}
          {error && (
            <Fade in={true}>
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Tableau principal */}
          <Paper 
            elevation={4} 
            sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }}
          >
            {loading ? (
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
                  Chargement des promotions...
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {[
                          { label: 'Promotion', icon: <School /> },
                          { label: 'Cycle Scolaire', icon: <School /> },
                          { label: 'Étudiants', icon: <People /> },
                          { label: 'Statut', icon: null },
                          { label: 'Actions', icon: null }
                        ].map((col, index) => (
                          <TableCell 
                            key={index}
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                              color: 'blue',
                              textAlign: index === 4 ? 'center' : 'left'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {col.icon}
                              {col.label}
                            </Box>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <School sx={{ fontSize: 64, color: 'text.disabled' }} />
                              <Typography variant="h6" color="text.secondary">
                                {searchTerm ? 'Aucune promotion trouvée pour cette recherche' : 'Aucune promotion enregistrée'}
                              </Typography>
                              {!searchTerm && (
                                <Button
                                  variant="contained"
                                  startIcon={<Add />}
                                  onClick={handleCreate}
                                  sx={{ mt: 2 }}
                                >
                                  Ajouter la première promotion
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        batches.map((batch, index) => (
                          <Fade in={true} timeout={300 + index * 50} key={batch.id}>
                            <TableRow 
                              hover 
                              sx={{ 
                                '&:nth-of-type(odd)': { 
                                  bgcolor: 'rgba(0, 0, 0, 0.02)' 
                                },
                                '&:hover': {
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                  transform: 'scale(1.002)',
                                },
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleView(batch)}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar 
                                    sx={{ 
                                      bgcolor: 'primary.main',
                                      width: 40,
                                      height: 40,
                                      fontSize: '1.2rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {batch.name ? batch.name.charAt(0).toUpperCase() : 'P'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                      {batch.name || '-'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Code: {batch.code || 'Non défini'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              
                              <TableCell>
                                <Chip 
                                  label={
                                    batch.school_cycle === 'primaire' ? 'Primaire' :
                                    batch.school_cycle === 'college' ? 'Collège' :
                                    batch.school_cycle === 'lycee' ? 'Lycée' :
                                    batch.school_cycle || 'Non défini'
                                  }
                                  size="small"
                                  color={getSchoolCycleColor(batch.school_cycle)}
                                  variant="outlined"
                                  sx={{ 
                                    fontWeight: 'bold',
                                    borderRadius: 2
                                  }}
                                />
                              </TableCell>
                              
                              <TableCell>
                                <Typography variant="body2">
                                  {batch.student_count || 0} étudiants
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                <Chip
                                  label={getStatusLabel(batch.status)}
                                  size="small"
                                  color={getStatusColor(batch.status)}
                                  variant="outlined"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </TableCell>
                              
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Voir détails">
                                    <IconButton 
                                      size="small" 
                                      color="info"
                                      onClick={() => handleView(batch)}
                                      sx={{ 
                                        '&:hover': { 
                                          bgcolor: 'info.light',
                                          color: 'white'
                                        }
                                      }}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Modifier">
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={() => handleEdit(batch)}
                                      sx={{ 
                                        '&:hover': { 
                                          bgcolor: 'primary.light',
                                          color: 'white'
                                        }
                                      }}
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title={batch.student_count > 0 ? "Impossible de supprimer - contient des étudiants" : "Supprimer"}>
                                    <span>
                                      <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={() => handleDelete(batch)}
                                        disabled={batch.student_count > 0}
                                        sx={{ 
                                          '&:hover': { 
                                            bgcolor: 'error.light',
                                            color: 'white'
                                          }
                                        }}
                                      >
                                        <Delete />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {batches.length > 0 && (
                  <Box sx={{ 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(0, 0, 0, 0.02)'
                  }}>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 20, 25, 50]}
                      component="div"
                      count={pagination.totalCount || 0}
                      rowsPerPage={pagination.limit || 10}
                      page={Math.max(0, (pagination.currentPage || 1) - 1)}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Lignes par page"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                      sx={{
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontWeight: 'bold'
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>

          {/* Formulaire de création/édition */}
          <BatchForm
            open={showForm}
            onClose={() => {
              setShowForm(false);
              setSelectedBatch(null);
            }}
            onSubmit={handleFormSubmit}
            batch={selectedBatch}
          />

          {/* Dialog de confirmation de suppression */}
          <ConfirmDialog
            open={deleteConfirm.open}
            onClose={() => {
              setDeleteConfirm({ open: false, batch: null });
            }}
            onConfirm={confirmDelete}
            title="Confirmer la suppression"
            message={
              deleteConfirm.batch ? 
              `Êtes-vous sûr de vouloir supprimer la promotion "${deleteConfirm.batch.name}" ?` :
              ''
            }
          />
        </Box>
      </Fade>
    </Container>
  );
};

export default BatchList;
