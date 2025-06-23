import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, Button, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Card, CardContent, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack,
  Alert, CircularProgress
} from '@mui/material';
import {
  ArrowLeft, Save, Plus, Trash2, Edit, Clock, Calendar
} from 'lucide-react';
import odooApi from '../../services/odooApi.jsx';

const TimetableEdit = ({ timetableId, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    batch_id: '',
    academic_year_id: '',
    semester_id: '',
    faculty_id: '',
    start_date: '',
    end_date: '',
    description: '',
    state: 'draft'
  });

  const [slots, setSlots] = useState([]);
  const [options, setOptions] = useState({
    batches: [],
    academicYears: [],
    semesters: [],
    faculties: [],
    subjects: [],
    classrooms: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const [slotForm, setSlotForm] = useState({
    day_of_week: '',
    start_time: '',
    end_time: '',
    subject_id: '',
    faculty_id: '',
    classroom_id: '',
    session_type: 'lecture',
    topic: ''
  });

  useEffect(() => {
    loadTimetableData();
    loadOptions();
  }, [timetableId]);

  const loadTimetableData = async () => {
    try {
      const response = await odooApi.getTimetable(timetableId);
      
      if (response.success) {
        const data = response.data;
        setFormData({
          name: data.name || '',
          batch_id: data.batch?.id || '',
          academic_year_id: data.academic_year?.id || '',
          semester_id: data.semester?.id || '',
          faculty_id: data.faculty?.id || '',
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          description: data.description || '',
          state: data.state || 'draft'
        });
        setSlots(data.slot_ids || []);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Erreur chargement emploi du temps:', err);
      setError(err.message);
    }
  };

  const loadOptions = async () => {
    try {
      const [batchesRes, teachersRes, subjectsRes, academicRes] = await Promise.all([
        odooApi.getBatches(),
        odooApi.getTeachers(),
        odooApi.getSubjects(),
        odooApi.getAcademicData()
      ]);

      console.log('Réponses API options:', { batchesRes, teachersRes, subjectsRes, academicRes });

      setOptions({
        batches: batchesRes.status === 'success' ? batchesRes.data.batches : [],
        faculties: teachersRes.status === 'success' ? teachersRes.data.teachers : [],
        subjects: subjectsRes.status === 'success' ? subjectsRes.data.subjects : [],
        academicYears: academicRes.status === 'success' ? academicRes.data.academic_years : [],
        semesters: academicRes.status === 'success' ? academicRes.data.semesters : [],
        classrooms: [] // Pas de salles de classe pour l'instant
      });
    } catch (err) {
      console.error('Erreur chargement options:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlotInputChange = (e) => {
    const { name, value } = e.target;
    setSlotForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openSlotDialog = (slot = null) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject_id: slot.subject?.id || '',
        faculty_id: slot.faculty?.id || '',
        classroom_id: slot.classroom?.id || '',
        session_type: slot.session_type || 'lecture',
        topic: slot.topic || ''
      });
    } else {
      setEditingSlot(null);
      setSlotForm({
        day_of_week: '',
        start_time: '',
        end_time: '',
        subject_id: '',
        faculty_id: '',
        classroom_id: '',
        session_type: 'lecture',
        topic: ''
      });
    }
    setSlotDialogOpen(true);
  };

  const closeSlotDialog = () => {
    setSlotDialogOpen(false);
    setEditingSlot(null);
  };

  const saveSlot = () => {
    if (editingSlot) {
      // Modifier le créneau existant
      setSlots(prev => prev.map(slot => 
        slot.id === editingSlot.id 
          ? {
              ...slot,
              day_of_week: slotForm.day_of_week,
              start_time: slotForm.start_time,
              end_time: slotForm.end_time,
              subject: options.subjects.find(s => s.id == slotForm.subject_id) || null,
              faculty: options.faculties.find(f => f.id == slotForm.faculty_id) || null,
              classroom: options.classrooms.find(c => c.id == slotForm.classroom_id) || null,
              session_type: slotForm.session_type,
              topic: slotForm.topic
            }
          : slot
      ));
    } else {
      // Ajouter un nouveau créneau
      const newSlot = {
        id: Date.now(), // ID temporaire
        day_of_week: slotForm.day_of_week,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        subject: options.subjects.find(s => s.id == slotForm.subject_id) || null,
        faculty: options.faculties.find(f => f.id == slotForm.faculty_id) || null,
        classroom: options.classrooms.find(c => c.id == slotForm.classroom_id) || null,
        session_type: slotForm.session_type,
        topic: slotForm.topic
      };
      setSlots(prev => [...prev, newSlot]);
    }
    closeSlotDialog();
  };

  const deleteSlot = (slotId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validation basique
      if (!formData.name || !formData.batch_id || !formData.start_date || !formData.end_date) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Préparer les créneaux avec le bon format
      const formattedSlots = slots.map(slot => ({
        day_of_week: String(slot.day_of_week),
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject_id: slot.subject?.id || null,
        faculty_id: slot.faculty?.id || null,
        classroom_id: slot.classroom?.id || null,
        session_type: slot.session_type,
        topic: slot.topic
      }));

      const timetableData = {
        ...formData,
        slots: formattedSlots
      };

      console.log('Mise à jour emploi du temps:', timetableData);
      
      // Appeler l'API de mise à jour
      const result = await odooApi.updateTimetable(timetableId, timetableData);
      
      if (result.success) {
        console.log('Emploi du temps mis à jour avec succès:', result.data);
        // Afficher une notification de succès
        setError(null);
        setSuccess(true);
        
        // Attendre un peu pour que l'utilisateur voie la confirmation
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1500);
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Erreur mise à jour emploi du temps:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (dayIndex) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[parseInt(dayIndex)] || 'Jour';
  };

  const getSessionTypeBadge = (type) => {
    const config = {
      lecture: { color: 'primary', label: 'Cours' },
      practical: { color: 'info', label: 'TP' },
      tutorial: { color: 'warning', label: 'TD' },
      exam: { color: 'error', label: 'Examen' },
      other: { color: 'default', label: 'Autre' }
    };
    
    const { color, label } = config[type] || config.other;
    return <Chip label={label} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Chargement...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={onBack}
            variant="outlined"
          >
            Retour
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Modifier l'emploi du temps
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Emploi du temps mis à jour avec succès !
          </Alert>
        )}
      </Paper>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informations générales
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom de l'emploi du temps"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Classe</InputLabel>
                <Select
                  name="batch_id"
                  value={formData.batch_id}
                  onChange={handleInputChange}
                  label="Classe"
                >
                  {options.batches.map(batch => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Année académique</InputLabel>
                <Select
                  name="academic_year_id"
                  value={formData.academic_year_id}
                  onChange={handleInputChange}
                  label="Année académique"
                >
                  {options.academicYears.map(year => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Semestre</InputLabel>
                <Select
                  name="semester_id"
                  value={formData.semester_id}
                  onChange={handleInputChange}
                  label="Semestre"
                >
                  {options.semesters.map(semester => (
                    <MenuItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Enseignant responsable</InputLabel>
                <Select
                  name="faculty_id"
                  value={formData.faculty_id}
                  onChange={handleInputChange}
                  label="Enseignant responsable"
                >
                  {options.faculties.map(faculty => (
                    <MenuItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>État</InputLabel>
                <Select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  label="État"
                >
                  <MenuItem value="draft">Brouillon</MenuItem>
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="archived">Archivé</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date de début"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date de fin"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Créneaux */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Créneaux horaires ({slots.length})
            </Typography>
            <Button
              startIcon={<Plus />}
              onClick={() => openSlotDialog()}
              variant="contained"
            >
              Ajouter un créneau
            </Button>
          </Box>

          {slots.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Jour</TableCell>
                    <TableCell>Horaire</TableCell>
                    <TableCell>Matière</TableCell>
                    <TableCell>Enseignant</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>{getDayName(slot.day_of_week)}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Clock size={16} />
                          <Typography variant="body2">
                            {slot.start_time} - {slot.end_time}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{slot.subject?.name || 'Non définie'}</TableCell>
                      <TableCell>{slot.faculty?.name || 'Non assigné'}</TableCell>
                      <TableCell>{getSessionTypeBadge(slot.session_type)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => openSlotDialog(slot)}
                          >
                            <Edit size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteSlot(slot.id)}
                            color="error"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Calendar size={48} style={{ color: '#ccc', marginBottom: 16 }} />
              <Typography variant="body1" color="textSecondary">
                Aucun créneau défini
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Cliquez sur "Ajouter un créneau" pour commencer
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Actions */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              onClick={onBack}
              variant="outlined"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Stack>
        </Paper>
      </form>

      {/* Dialog pour créneaux */}
      <Dialog 
        open={slotDialogOpen} 
        onClose={closeSlotDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSlot ? 'Modifier le créneau' : 'Ajouter un créneau'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Jour de la semaine</InputLabel>
                <Select
                  name="day_of_week"
                  value={slotForm.day_of_week}
                  onChange={handleSlotInputChange}
                  label="Jour de la semaine"
                >
                  <MenuItem value="0">Lundi</MenuItem>
                  <MenuItem value="1">Mardi</MenuItem>
                  <MenuItem value="2">Mercredi</MenuItem>
                  <MenuItem value="3">Jeudi</MenuItem>
                  <MenuItem value="4">Vendredi</MenuItem>
                  <MenuItem value="5">Samedi</MenuItem>
                  <MenuItem value="6">Dimanche</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Heure de début"
                name="start_time"
                type="time"
                value={slotForm.start_time}
                onChange={handleSlotInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Heure de fin"
                name="end_time"
                type="time"
                value={slotForm.end_time}
                onChange={handleSlotInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Matière</InputLabel>
                <Select
                  name="subject_id"
                  value={slotForm.subject_id}
                  onChange={handleSlotInputChange}
                  label="Matière"
                >
                  {options.subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Enseignant</InputLabel>
                <Select
                  name="faculty_id"
                  value={slotForm.faculty_id}
                  onChange={handleSlotInputChange}
                  label="Enseignant"
                >
                  {options.faculties.map(faculty => (
                    <MenuItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type de session</InputLabel>
                <Select
                  name="session_type"
                  value={slotForm.session_type}
                  onChange={handleSlotInputChange}
                  label="Type de session"
                >
                  <MenuItem value="lecture">Cours</MenuItem>
                  <MenuItem value="practical">TP</MenuItem>
                  <MenuItem value="tutorial">TD</MenuItem>
                  <MenuItem value="exam">Examen</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sujet/Topic"
                name="topic"
                value={slotForm.topic}
                onChange={handleSlotInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSlotDialog}>
            Annuler
          </Button>
          <Button 
            onClick={saveSlot}
            variant="contained"
            disabled={!slotForm.day_of_week || !slotForm.start_time || !slotForm.end_time}
          >
            {editingSlot ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimetableEdit; 