import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton, TextField, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Avatar, Tab, Tabs,
  InputAdornment, Alert, TablePagination, Collapse
} from '@mui/material';
import {
  ArrowBack, Edit, Search,
  Person, People, TrendingUp, Assignment,
  RemoveCircle, CheckCircle, PersonAdd, Grade,
  ExpandMore, ExpandLess
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useBatch, useBatchStatistics } from '../../hooks/useBatches';
import { useStudents } from '../../hooks/useOdoo';
import BatchForm from './BatchForm';

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    batch,
    students,
    loading,
    error,
    studentsPagination,
    updateBatch,
    fetchBatchStudents,
    addStudent,
    removeStudent
  } = useBatch(id);

  const { statistics, loading: statsLoading } = useBatchStatistics(id);
  const { data: allStudents, loading: studentsLoading, makeRequest } = useStudents();

  // État local
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [removeStudentDialogOpen, setRemoveStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableStudentSearchTerm, setAvailableStudentSearchTerm] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [infoExpanded, setInfoExpanded] = useState(true);

  // Timer pour le debounce de la recherche
  const [searchTimer, setSearchTimer] = useState(null);
  const [availableSearchTimer, setAvailableSearchTimer] = useState(null);

  // Charger les étudiants disponibles
  const loadAvailableStudents = useCallback(async (searchTerm = '') => {
    try {
      const url = `/api/batches/${id}/available-students${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
      const result = await makeRequest(`http://172.16.209.128:8069${url}`);
      
      if (result && result.status === 'success') {
        setAvailableStudents(result.data || []);
      } else {
        setAvailableStudents([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants disponibles:', error);
      setAvailableStudents([]);
    }
  }, [id, makeRequest]);

  // Effet pour charger les étudiants disponibles
  useEffect(() => {
    if (addStudentDialogOpen) {
      loadAvailableStudents(availableStudentSearchTerm);
    }
  }, [addStudentDialogOpen, loadAvailableStudents, availableStudentSearchTerm]);

  // Gestion de la recherche avec debounce
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const newTimer = setTimeout(() => {
      fetchBatchStudents(1, value);
    }, 500);

    setSearchTimer(newTimer);
  };

  // Gestion de la recherche d'étudiants disponibles
  const handleAvailableStudentSearch = (event) => {
    const value = event.target.value;
    setAvailableStudentSearchTerm(value);

    if (availableSearchTimer) {
      clearTimeout(availableSearchTimer);
    }

    const newTimer = setTimeout(() => {
      if (addStudentDialogOpen) {
        loadAvailableStudents(value);
      }
    }, 500);

    setAvailableSearchTimer(newTimer);
  };

  // Gestion du changement de page
  const handleChangePage = (event, newPage) => {
    fetchBatchStudents(newPage + 1, searchTerm);
  };

  // Gestion de l'édition
  const handleEdit = () => {
    setEditFormOpen(true);
  };

  const handleEditSubmit = async (batchData) => {
    try {
      const result = await updateBatch(batchData);
      if (result.success) {
        setEditFormOpen(false);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Gestion de l'ajout d'étudiant
  const handleAddStudent = () => {
    setSelectedStudentId('');
    setAddStudentDialogOpen(true);
  };

  const confirmAddStudent = async () => {
    try {
      const result = await addStudent(parseInt(selectedStudentId));
      if (result.success) {
        setAddStudentDialogOpen(false);
        setSelectedStudentId('');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  // Gestion de la suppression d'étudiant
  const handleRemoveStudent = (student) => {
    setSelectedStudent(student);
    setRemoveStudentDialogOpen(true);
  };

  const confirmRemoveStudent = async () => {
    try {
      const studentId = selectedStudent.student_id || selectedStudent.id;
      const result = await removeStudent(studentId);
      if (result.success) {
        setRemoveStudentDialogOpen(false);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Gestion des onglets
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'info';
      case 'running': return 'success';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming': return 'À venir';
      case 'running': return 'En cours';
      case 'completed': return 'Terminé';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getSchoolCycleLabel = (cycle) => {
    switch (cycle) {
      case 'primary': return 'Primaire';
      case 'middle': return 'Collège';  
      case 'high': return 'Lycée';
      case 'university': return 'Université';
      case 'bachelor': return 'Licence';
      case 'master': return 'Master';
      case 'doctorate': return 'Doctorat';
      default: return cycle || 'Non défini';
    }
  };

  // Calculer le statut actuel du batch
  const calculateBatchStatus = (batch) => {
    if (!batch.start_date || !batch.end_date) return 'running';
    
    const now = new Date();
    const startDate = new Date(batch.start_date);
    const endDate = new Date(batch.end_date);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'running';
  };

  // Obtenir les informations de capacité
  const getCapacityInfo = () => {
    const total = batch.total_capacity || batch.max_students || 0;
    const current = students.length;
    
    if (total > 0) {
      return `${current}/${total} étudiants`;
    }
    return `${current} étudiants (capacité illimitée)`;
  };

  // Obtenir les informations du cours
  const getCourseInfo = () => {
    if (batch.course && batch.course.name) {
      return `${batch.course.name}${batch.course.code ? ` (${batch.course.code})` : ''}`;
    }
    return 'Aucun cours associé';
  };

  // Obtenir les informations de l'enseignant principal
  const getClassTeacherInfo = () => {
    if (batch.class_teacher && batch.class_teacher.name) {
      return batch.class_teacher.name;
    }
    return 'Non assigné';
  };

  // Obtenir les informations de l'enseignant adjoint
  const getDeputyTeacherInfo = () => {
    if (batch.deputy_teacher && batch.deputy_teacher.name) {
      return batch.deputy_teacher.name;
    }
    return 'Non assigné';
  };

  if (loading && !batch) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!batch) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Alert severity="warning">Promotion introuvable</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* En-tête simple */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton 
            onClick={() => navigate('/batches')} 
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="600" color="text.primary">
              {batch.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {batch.code && `${batch.code} • `}
              {getSchoolCycleLabel(batch.school_cycle)}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={getStatusLabel(calculateBatchStatus(batch))}
              color={getStatusColor(calculateBatchStatus(batch))}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Statistiques simples */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {students.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Étudiants inscrits
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Assignment color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {batch.subjects_count || batch.subjects?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Matières
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Person color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {batch.statistics?.total_faculties || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enseignants
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {batch.statistics?.occupancy_rate || 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Taux d'occupation
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Informations détaillées */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight="600">
              Informations de la promotion
            </Typography>
            <IconButton onClick={() => setInfoExpanded(!infoExpanded)}>
              {infoExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={infoExpanded}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="600" mb={2}>
                  Informations générales
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Nom de la promotion
                    </Typography>
                    <Typography variant="body1">{batch.name || 'Non défini'}</Typography>
                  </Box>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="body1">{batch.code || 'Non défini'}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Cycle scolaire
                    </Typography>
                    <Typography variant="body1">{getSchoolCycleLabel(batch.school_cycle)}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Cours associé
                    </Typography>
                    <Typography variant="body1">{getCourseInfo()}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Capacité
                    </Typography>
                    <Typography variant="body1">{getCapacityInfo()}</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="600" mb={2}>
                  Dates et enseignants
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Date de début
                    </Typography>
                    <Typography variant="body1">{formatDate(batch.start_date)}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Date de fin
                    </Typography>
                    <Typography variant="body1">{formatDate(batch.end_date)}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Enseignant principal
                    </Typography>
                    <Typography variant="body1">{getClassTeacherInfo()}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Enseignant adjoint
                    </Typography>
                    <Typography variant="body1">{getDeputyTeacherInfo()}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Durée estimée
                    </Typography>
                    <Typography variant="body1">
                      {batch.start_date && batch.end_date ? 
                        `${Math.ceil((new Date(batch.end_date) - new Date(batch.start_date)) / (1000 * 60 * 60 * 24 * 30))} mois` :
                        'Non définie'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {batch.description && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="600" mb={2}>
                    Description
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {batch.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Onglets simples */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <People />
                Étudiants ({students.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUp />
                Statistiques
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      {tabValue === 0 && (
        <Paper>
          {/* En-tête */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="600">
                Étudiants inscrits
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleAddStudent}
                disabled={batch.max_students && students.length >= batch.max_students}
              >
                Ajouter un étudiant
              </Button>
            </Box>

            {/* Recherche */}
            <TextField
              fullWidth
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Tableau */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Informations</TableCell>
                  <TableCell>Date d'inscription</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton height={40} /></TableCell>
                      <TableCell><Skeleton height={40} /></TableCell>
                      <TableCell><Skeleton height={40} /></TableCell>
                      <TableCell><Skeleton height={40} /></TableCell>
                      <TableCell><Skeleton height={40} /></TableCell>
                    </TableRow>
                  ))
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant inscrit'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 
                          'Essayez de modifier votre recherche' : 
                          'Commencez par ajouter des étudiants à cette promotion'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>{(student.name || student.student_name || '').charAt(0).toUpperCase()}</Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {student.name || student.student_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {student.student_id || student.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {student.email && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {student.email}
                            </Typography>
                          )}
                          {student.phone && (
                            <Typography variant="body2" color="text.secondary">
                              {student.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {student.gender && (
                          <Chip 
                            label={student.gender === 'm' ? 'Masculin' : 'Féminin'} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {student.enrollment_date ? 
                            formatDate(student.enrollment_date) :
                            'Non définie'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveStudent(student)}
                          color="error"
                        >
                          <RemoveCircle />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={studentsPagination.totalCount}
            page={studentsPagination.currentPage - 1}
            onPageChange={handleChangePage}
            rowsPerPage={studentsPagination.limit}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TrendingUp sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Statistiques détaillées
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cette section contiendra bientôt des graphiques et métriques avancées
          </Typography>
        </Paper>
      )}

      {/* Dialog d'édition */}
      <BatchForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleEditSubmit}
        batch={batch}
      />

      {/* Dialog d'ajout d'étudiant */}
      <Dialog
        open={addStudentDialogOpen}
        onClose={() => setAddStudentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Ajouter un étudiant à la promotion
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Rechercher un étudiant..."
            value={availableStudentSearchTerm}
            onChange={handleAvailableStudentSearch}
            sx={{ mt: 2, mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {studentsLoading ? (
            <Box>
              {[...Array(3)].map((_, index) => (
                <Box key={index} mb={2}>
                  <Skeleton height={80} />
                </Box>
              ))}
            </Box>
          ) : availableStudents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                {availableStudentSearchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant disponible'}
              </Typography>
            </Box>
          ) : (
            <Box>
              {availableStudents.map((student) => (
                <Box 
                  key={student.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: selectedStudentId === student.id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>{student.name.charAt(0).toUpperCase()}</Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1">{student.name}</Typography>
                      {student.email && (
                        <Typography variant="body2" color="text.secondary">
                          {student.email}
                        </Typography>
                      )}
                    </Box>
                    {selectedStudentId === student.id && (
                      <CheckCircle color="primary" />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddStudentDialogOpen(false);
            setSelectedStudentId('');
            setAvailableStudentSearchTerm('');
          }}>
            Annuler
          </Button>
          <Button
            onClick={confirmAddStudent}
            variant="contained"
            disabled={!selectedStudentId}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog
        open={removeStudentDialogOpen}
        onClose={() => {
          setRemoveStudentDialogOpen(false);
          setSelectedStudent(null);
        }}
        maxWidth="sm"
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <RemoveCircle sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Retirer l'étudiant
          </Typography>
          <Typography color="text.secondary">
            {selectedStudent ?
              `Êtes-vous sûr de vouloir retirer "${selectedStudent.name || selectedStudent.student_name}" de cette promotion ?` :
              ''
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRemoveStudentDialogOpen(false);
            setSelectedStudent(null);
          }}>
            Annuler
          </Button>
          <Button
            onClick={confirmRemoveStudent}
            variant="contained"
            color="error"
          >
            Retirer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchDetail; 