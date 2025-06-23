import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Chip, Avatar, FormControl, InputLabel, Select, OutlinedInput,
  Card, CardContent, CardActions, Divider, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Checkbox, Snackbar, Fab
} from '@mui/material';
import {
  Add, Edit, Delete, Save, Cancel, Search, FilterList,
  CheckCircle, Error, Warning, Info, PersonAdd, Assignment,
  CalendarToday, AccessTime, School, Book, Person, Refresh,
  CloudDownload, CloudUpload, Print
} from '@mui/icons-material';
import { 
  useAttendances, 
  useAttendanceActions, 
  useAttendanceExport,
  useSessions,
  useAttendanceStatistics
} from '../../hooks/useAttendance';
import { useBatches, useAllSubjects, useStudents } from '../../hooks/useOdoo';

const AttendanceCrudManager = () => {
  // États locaux
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    batch_id: '',
    subject_id: '',
    state: '',
    search: ''
  });
  const [selectedAttendances, setSelectedAttendances] = useState([]);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    session_id: '',
    date: new Date().toISOString().split('T')[0],
    state: 'absent',
    remarks: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Hooks
  const { data: attendancesData, loading, error, refetch } = useAttendances(filters, currentPage, pageSize);
  const { data: batchesData } = useBatches();
  const { data: subjectsData } = useAllSubjects();
  const { data: studentsData } = useStudents();
  const { data: sessionsData } = useSessions({});
  const { data: statsData } = useAttendanceStatistics(filters);
  const { 
    updateAttendance, 
    deleteAttendance, 
    bulkSaveAttendances,
    loading: actionLoading 
  } = useAttendanceActions();
  const { exportAttendances } = useAttendanceExport();

  // Données formatées
  const attendances = attendancesData?.attendances || [];
  const pagination = attendancesData?.pagination || {};
  const batches = batchesData?.batches || [];
  const subjects = subjectsData || [];
  const students = studentsData || [];
  const sessions = sessionsData?.sessions || [];
  const stats = statsData || {};

  // DEBUGGING: Vérifier que les données sont bien chargées
  console.log('🔍 DEBUG AttendanceCrudManager:');
  console.log('  - students:', students?.length, students?.slice(0, 2));
  console.log('  - sessions:', sessions?.length, sessions?.slice(0, 2));
  console.log('  - batches:', batches?.length);
  console.log('  - subjects:', subjects?.length);
  console.log('  - attendances:', attendances?.length);

  // CORRECTION: Extraire les statistiques globales de la structure correcte
  const globalStats = useMemo(() => {
    console.log('🔍 DEBUG globalStats: statsData reçu:', statsData);
    
    if (!statsData) {
      console.log('🔍 DEBUG globalStats: Pas de statsData');
      return {
        total_students: 0,
        present_count: 0,
        absent_count: 0,
        attendance_rate: 0
      };
    }
    
    // Vérifier si global_statistics existe directement
    if (statsData.global_statistics) {
      console.log('🔍 DEBUG globalStats: global_statistics trouvé directement:', statsData.global_statistics);
      const global = statsData.global_statistics;
      return {
        total_students: global.total_records || 0,
        present_count: global.present_count || 0,
        absent_count: global.absent_count || 0,
        attendance_rate: Math.round(global.attendance_rate || 0)
      };
    }
    
    // Si aucune structure attendue trouvée, retourner des valeurs par défaut
    console.log('🔍 DEBUG globalStats: Structure global_statistics non trouvée, valeurs par défaut');
    return {
      total_students: 0,
      present_count: 0,
      absent_count: 0,
      attendance_rate: 0
    };
  }, [statsData]);

  // Gestionnaires d'événements
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedAttendances.length === attendances.length) {
      setSelectedAttendances([]);
    } else {
      setSelectedAttendances(attendances.map(a => a.id));
    }
  };

  const handleSelectAttendance = (attendanceId) => {
    setSelectedAttendances(prev => 
      prev.includes(attendanceId) 
        ? prev.filter(id => id !== attendanceId)
        : [...prev, attendanceId]
    );
  };

  const handleEdit = (attendance) => {
    setSelectedAttendance(attendance);
    setFormData({
      student_id: attendance.student_id,
      session_id: attendance.session_id,
      date: attendance.date,
      state: attendance.state,
      remarks: attendance.remarks || ''
    });
    setEditDialog(true);
  };

  const handleDelete = (attendance) => {
    setSelectedAttendance(attendance);
    setDeleteDialog(true);
  };

  const handleCreate = () => {
    setFormData({
      student_id: '',
      session_id: '',
      date: new Date().toISOString().split('T')[0],
      state: 'absent',
      remarks: ''
    });
    setCreateDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateAttendance(selectedAttendance.id, formData);
      setSnackbar({ 
        open: true, 
        message: 'Présence modifiée avec succès !', 
        severity: 'success' 
      });
      setEditDialog(false);
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la modification: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAttendance(selectedAttendance.id);
      setSnackbar({ 
        open: true, 
        message: 'Présence supprimée avec succès !', 
        severity: 'success' 
      });
      setDeleteDialog(false);
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la suppression: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleCreateAttendance = async () => {
    try {
      await bulkSaveAttendances([formData]);
      setSnackbar({ 
        open: true, 
        message: 'Présence créée avec succès !', 
        severity: 'success' 
      });
      setCreateDialog(false);
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la création: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAttendances.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Aucune présence sélectionnée', 
        severity: 'warning' 
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedAttendances.length} présences ?`)) {
      try {
        await Promise.all(selectedAttendances.map(id => deleteAttendance(id)));
        setSnackbar({ 
          open: true, 
          message: `${selectedAttendances.length} présences supprimées avec succès !`, 
          severity: 'success' 
        });
        setSelectedAttendances([]);
        refetch();
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: 'Erreur lors de la suppression en masse: ' + error.message, 
          severity: 'error' 
        });
      }
    }
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      await exportAttendances(format, filters);
      setSnackbar({ 
        open: true, 
        message: 'Export démarré avec succès !', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de l\'export: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'present':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'absent':
        return <Error sx={{ color: 'error.main' }} />;
      case 'late':
        return <Warning sx={{ color: 'warning.main' }} />;
      default:
        return <Info sx={{ color: 'info.main' }} />;
    }
  };

  const getStateLabel = (state) => {
    switch (state) {
      case 'present':
        return 'Présent';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Retard';
      default:
        return 'Inconnu';
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          Gestion des Présences
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interface complète pour gérer toutes les présences des étudiants
        </Typography>
      </Box>

      {/* Statistiques rapides */}
      {statsData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {globalStats.total_students}
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
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {globalStats.present_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Présents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Error sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {globalStats.absent_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Absents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Info sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {globalStats.attendance_rate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux de présence
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres de recherche
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Recherche"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nom étudiant, matricule..."
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Date début"
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Date fin"
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Promotion"
              value={filters.batch_id}
              onChange={(e) => handleFilterChange('batch_id', e.target.value)}
            >
              <MenuItem value="">Toutes les promotions</MenuItem>
              {batches.map((batch) => (
                <MenuItem key={batch.id} value={batch.id}>
                  {batch.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Matière"
              value={filters.subject_id}
              onChange={(e) => handleFilterChange('subject_id', e.target.value)}
            >
              <MenuItem value="">Toutes les matières</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="État"
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
            >
              <MenuItem value="">Tous les états</MenuItem>
              <MenuItem value="present">Présent</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="late">Retard</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Actions en masse */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="h6">
              Actions en masse
            </Typography>
            {selectedAttendances.length > 0 && (
              <Chip 
                label={`${selectedAttendances.length} sélectionnés`}
                color="primary"
                size="small"
              />
            )}
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
              color="success"
            >
              Nouvelle présence
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              disabled={selectedAttendances.length === 0}
              color="error"
            >
              Supprimer sélection
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudDownload />}
              onClick={() => handleExport('xlsx')}
            >
              Exporter Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tableau des présences */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedAttendances.length > 0 && selectedAttendances.length < attendances.length}
                    checked={attendances.length > 0 && selectedAttendances.length === attendances.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Étudiant</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">État</TableCell>
                <TableCell>Remarques</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      Chargement...
                    </TableCell>
                  </TableRow>
                ))
              ) : attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucune présence trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attendances.map((attendance) => {
                  console.log('🔍 DEBUG: attendance data:', attendance);
                  
                  const studentName = attendance.student_name || 'Étudiant inconnu';
                  const studentId = attendance.student_id || 'Pas de matricule';
                  
                  const sessionName = attendance.session_name || '';
                  let subjectName = 'Matière inconnue';
                  if (sessionName.includes(':')) {
                    const parts = sessionName.split(':');
                    if (parts.length >= 2) {
                      subjectName = parts[1];
                    }
                  }
                  
                  const batchName = attendance.batch_name || 'Promotion inconnue';
                  
                  let formattedDate = 'Date invalide';
                  if (attendance.date && attendance.date !== `op.attendance.register(${attendance.id},)`) {
                    try {
                      const dateObj = new Date(attendance.date);
                      if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('fr-FR');
                      } else {
                        formattedDate = new Date().toLocaleDateString('fr-FR');
                      }
                    } catch (error) {
                      console.warn('Erreur de parsing de date:', attendance.date, error);
                      formattedDate = new Date().toLocaleDateString('fr-FR');
                    }
                  }
                  
                  let attendanceState = 'unknown';
                  if (attendance.present === true) {
                    attendanceState = 'present';
                  } else if (attendance.absent === true) {
                    attendanceState = 'absent';
                  } else if (attendance.late === true) {
                    attendanceState = 'late';
                  } else if (attendance.excused === true) {
                    attendanceState = 'excused';
                  }
                  
                  return (
                    <TableRow key={attendance.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedAttendances.includes(attendance.id)}
                          onChange={() => handleSelectAttendance(attendance.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {studentName?.charAt(0)?.toUpperCase() || 'E'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {studentName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {studentId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {subjectName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {batchName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formattedDate}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStateIcon(attendanceState)}
                          label={getStateLabel(attendanceState)}
                          color={getStateColor(attendanceState)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {attendance.remark || attendance.remarks || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(attendance)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(attendance)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {pagination.total_count || 0} présences au total
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Button
            disabled={!pagination.has_prev}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Précédent
          </Button>
          <Typography variant="body2">
            Page {pagination.current_page || 1} sur {pagination.total_pages || 1}
          </Typography>
          <Button
            disabled={!pagination.has_next}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Suivant
          </Button>
        </Box>
      </Box>

      {/* Dialog de création */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Add sx={{ mr: 2, color: 'success.main' }} />
            Nouvelle présence
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Étudiant"
                value={formData.student_id}
                onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                required
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} - {student.student_id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Session"
                value={formData.session_id}
                onChange={(e) => setFormData(prev => ({ ...prev, session_id: e.target.value }))}
                required
              >
                {sessions.map((session) => {
                  const batch = batches.find(b => b.id === session.batch_id);
                  const subject = subjects.find(s => s.id === session.subject_id);
                  return (
                    <MenuItem key={session.id} value={session.id}>
                      {subject?.name} - {batch?.name} ({new Date(session.start_time).toLocaleDateString('fr-FR')})
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="État"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                required
              >
                <MenuItem value="present">
                  <Box display="flex" alignItems="center">
                    <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                    Présent
                  </Box>
                </MenuItem>
                <MenuItem value="absent">
                  <Box display="flex" alignItems="center">
                    <Error sx={{ mr: 1, color: 'error.main' }} />
                    Absent
                  </Box>
                </MenuItem>
                <MenuItem value="late">
                  <Box display="flex" alignItems="center">
                    <Warning sx={{ mr: 1, color: 'warning.main' }} />
                    Retard
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarques"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Remarques optionnelles..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateAttendance}
            variant="contained"
            disabled={actionLoading || !formData.student_id || !formData.session_id}
            startIcon={<Save />}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Edit sx={{ mr: 2, color: 'primary.main' }} />
            Modifier la présence
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="État"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                required
              >
                <MenuItem value="present">
                  <Box display="flex" alignItems="center">
                    <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                    Présent
                  </Box>
                </MenuItem>
                <MenuItem value="absent">
                  <Box display="flex" alignItems="center">
                    <Error sx={{ mr: 1, color: 'error.main' }} />
                    Absent
                  </Box>
                </MenuItem>
                <MenuItem value="late">
                  <Box display="flex" alignItems="center">
                    <Warning sx={{ mr: 1, color: 'warning.main' }} />
                    Retard
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarques"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Remarques optionnelles..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            disabled={actionLoading}
            startIcon={<Save />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Delete sx={{ mr: 2, color: 'error.main' }} />
            Supprimer la présence
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action est irréversible. La présence sera définitivement supprimée.
          </Alert>
          <Typography variant="body1">
            Êtes-vous sûr de vouloir supprimer cette présence ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={<Delete />}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* FAB pour actions rapides */}
      <Fab
        color="primary"
        onClick={handleCreate}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default AttendanceCrudManager; 