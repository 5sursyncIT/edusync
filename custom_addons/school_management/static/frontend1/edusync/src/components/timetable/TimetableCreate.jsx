import React, { useState, useEffect } from 'react';
import { 
  Paper, Box, Typography, TextField, Button, Grid, 
  MenuItem, FormControl, InputLabel, Select, Alert,
  CircularProgress, Divider, Stack, Card, CardContent
} from '@mui/material';
import { ArrowLeft, Save, Calendar, Plus, Trash2 } from 'lucide-react';
import odooApi from '../../services/odooApi.jsx';

const TimetableCreate = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    batch_id: '',
    academic_year_id: '',
    semester_id: '',
    start_date: '',
    end_date: '',
    faculty_id: '',
    description: ''
  });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    batches: [],
    academic_years: [],
    semesters: [],
    faculty: [],
    subjects: [],
    classrooms: []
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      // Charger les données depuis les APIs
      const [batchesRes, teachersRes, subjectsRes, academicRes] = await Promise.all([
        odooApi.getBatches(),
        odooApi.getTeachers(), 
        odooApi.getSubjects(),
        odooApi.getAcademicData()
      ]);

      console.log('Réponses API:', { batchesRes, teachersRes, subjectsRes, academicRes });

      setOptions({
        batches: batchesRes.status === 'success' ? batchesRes.data.batches : [],
        academic_years: academicRes.status === 'success' ? academicRes.data.academic_years : [
          { id: 1, name: '2023-2024' },
          { id: 2, name: '2024-2025' }
        ],
        semesters: academicRes.status === 'success' ? academicRes.data.semesters : [
          { id: 1, name: 'Semestre 1' },
          { id: 2, name: 'Semestre 2' }
        ],
        faculty: teachersRes.status === 'success' ? teachersRes.data.teachers.map(teacher => ({
          id: teacher.id,
          name: teacher.name
        })) : [],
        subjects: subjectsRes.status === 'success' ? subjectsRes.data.subjects : [],
        classrooms: []
      });
    } catch (err) {
      console.error('Erreur chargement options:', err);
      setError('Erreur lors du chargement des données');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSlot = () => {
    const newSlot = {
      id: Date.now(),
      day_of_week: '0',
      start_time: '',
      end_time: '',
      subject_id: '',
      faculty_id: '',
      classroom_id: '',
      session_type: 'lecture',
      topic: ''
    };
    setSlots(prev => [...prev, newSlot]);
  };

  const updateSlot = (slotId, field, value) => {
    setSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, [field]: value } : slot
    ));
  };

  const removeSlot = (slotId) => {
    setSlots(prev => prev.filter(slot => slot.id !== slotId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation basique
      if (!formData.name || !formData.batch_id || !formData.start_date || !formData.end_date) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Préparer les créneaux avec le bon format
      const formattedSlots = slots.map(slot => {
        const slotData = {
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          subject_id: slot.subject_id || null,
          faculty_id: slot.faculty_id || null,
          session_type: slot.session_type,
          topic: slot.topic
        };
        
        // N'inclure classroom_id que s'il est défini et non vide
        if (slot.classroom_id && slot.classroom_id !== '') {
          slotData.classroom_id = slot.classroom_id;
        }
        
        return slotData;
      });

      const timetableData = {
        ...formData,
        slots: formattedSlots
      };

      console.log('Création emploi du temps:', timetableData);
      
      // Appeler l'API de création
      const result = await odooApi.createTimetable(timetableData);
      
      if (result.success) {
        console.log('Emploi du temps créé avec succès:', result.data);
        onSuccess && onSuccess();
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (err) {
      console.error('Erreur création emploi du temps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayIndex) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[parseInt(dayIndex)] || 'Jour';
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={onBack}
          variant="outlined"
        >
          Retour
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Nouvel Emploi du Temps
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Informations générales */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={20} />
              Informations générales
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom de l'emploi du temps *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Classe</InputLabel>
              <Select
                value={formData.batch_id}
                onChange={(e) => handleChange('batch_id', e.target.value)}
                label="Classe"
              >
                {options.batches.map((batch) => (
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
                value={formData.academic_year_id}
                onChange={(e) => handleChange('academic_year_id', e.target.value)}
                label="Année académique"
              >
                {options.academic_years.map((year) => (
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
                value={formData.semester_id}
                onChange={(e) => handleChange('semester_id', e.target.value)}
                label="Semestre"
              >
                {options.semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Période */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date de début *"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date de fin *"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Responsable</InputLabel>
              <Select
                value={formData.faculty_id}
                onChange={(e) => handleChange('faculty_id', e.target.value)}
                label="Responsable"
              >
                {options.faculty.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>

        {/* Créneaux horaires */}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Créneaux horaires
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Plus />}
              onClick={addSlot}
            >
              Ajouter un créneau
            </Button>
          </Box>

          {slots.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="textSecondary">
                Aucun créneau défini. Cliquez sur "Ajouter un créneau" pour commencer.
              </Typography>
            </Paper>
          )}

          {slots.map((slot, index) => (
            <Card key={slot.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Créneau {index + 1}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => removeSlot(slot.id)}
                  >
                    Supprimer
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Jour</InputLabel>
                      <Select
                        value={slot.day_of_week}
                        onChange={(e) => updateSlot(slot.id, 'day_of_week', e.target.value)}
                        label="Jour"
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

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Heure début"
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(slot.id, 'start_time', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Heure fin"
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(slot.id, 'end_time', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Matière</InputLabel>
                      <Select
                        value={slot.subject_id}
                        onChange={(e) => updateSlot(slot.id, 'subject_id', e.target.value)}
                        label="Matière"
                      >
                        {options.subjects.map((subject) => (
                          <MenuItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Enseignant</InputLabel>
                      <Select
                        value={slot.faculty_id}
                        onChange={(e) => updateSlot(slot.id, 'faculty_id', e.target.value)}
                        label="Enseignant"
                      >
                        {options.faculty.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Salle</InputLabel>
                      <Select
                        value={slot.classroom_id}
                        onChange={(e) => updateSlot(slot.id, 'classroom_id', e.target.value)}
                        label="Salle"
                      >
                        {options.classrooms.map((classroom) => (
                          <MenuItem key={classroom.id} value={classroom.id}>
                            {classroom.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={slot.session_type}
                        onChange={(e) => updateSlot(slot.id, 'session_type', e.target.value)}
                        label="Type"
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
                      label="Sujet/Thème"
                      value={slot.topic}
                      onChange={(e) => updateSlot(slot.id, 'topic', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer l\'emploi du temps'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default TimetableCreate; 