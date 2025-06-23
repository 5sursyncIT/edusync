import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  MenuItem,
  Chip
} from '@mui/material';
import { Add, Send } from '@mui/icons-material';
import { useAttendanceActions, useSessions } from '../../hooks/useAttendance';
import { useStudents } from '../../hooks/useOdoo';

const AttendanceTest = () => {
  const [formData, setFormData] = useState({
    student_id: '',
    session_id: '',
    date: new Date().toISOString().split('T')[0],
    state: 'present',
    remarks: 'Test depuis composant de test'
  });
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Hooks
  const { bulkSaveAttendances, loading } = useAttendanceActions();
  const { data: studentsData, loading: studentsLoading, error: studentsError } = useStudents();
  const { data: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessions({});

  // Données
  const students = studentsData || [];
  const sessions = sessionsData?.sessions || [];

  console.log('🔍 AttendanceTest:');
  console.log('  - studentsData complète:', studentsData);
  console.log('  - studentsLoading:', studentsLoading);
  console.log('  - studentsError:', studentsError);
  console.log('  - students extraits:', students?.length, students?.slice(0, 2));
  console.log('  - sessionsData complète:', sessionsData);
  console.log('  - sessionsLoading:', sessionsLoading);
  console.log('  - sessionsError:', sessionsError);
  console.log('  - sessions extraites:', sessions?.length, sessions?.slice(0, 2));
  console.log('  - formData:', formData);

  const handleSubmit = async () => {
    try {
      setError(null);
      setResult(null);
      
      console.log('🔍 Test de création d\'une présence avec:', formData);
      
      const result = await bulkSaveAttendances([formData]);
      console.log('✅ Résultat:', result);
      setResult(result);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Test de Création de Présence
      </Typography>
      
      <Grid container spacing={3}>
        {/* Formulaire */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Formulaire de Test
            </Typography>
            
            {/* Messages d'état */}
            {studentsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erreur étudiants: {studentsError}
              </Alert>
            )}
            {sessionsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erreur sessions: {sessionsError}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Étudiant"
                  value={formData.student_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                  disabled={studentsLoading}
                  helperText={studentsLoading ? 'Chargement...' : `${students.length} étudiants disponibles`}
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name} (ID: {student.id})
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
                  disabled={sessionsLoading}
                  helperText={sessionsLoading ? 'Chargement...' : `${sessions.length} sessions disponibles`}
                >
                  {sessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                      {session.name || `Session ${session.id}`} (ID: {session.id})
                    </MenuItem>
                  ))}
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
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="État"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                >
                  <MenuItem value="present">Présent</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Retard</MenuItem>
                  <MenuItem value="excused">Excusé</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarques"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !formData.student_id || !formData.session_id}
                  startIcon={<Send />}
                >
                  {loading ? 'Création...' : 'Créer la présence'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Résultats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résultats du Test
            </Typography>
            
            {/* Statistiques */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Données chargées :</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`${students.length} étudiants`} 
                    sx={{ mr: 1 }} 
                    color={studentsLoading ? 'default' : students.length > 0 ? 'success' : 'error'}
                  />
                  <Chip 
                    label={`${sessions.length} sessions`}
                    color={sessionsLoading ? 'default' : sessions.length > 0 ? 'success' : 'error'}
                  />
                </Box>
                {studentsLoading && <Typography variant="body2" color="text.secondary">Chargement des étudiants...</Typography>}
                {sessionsLoading && <Typography variant="body2" color="text.secondary">Chargement des sessions...</Typography>}
              </CardContent>
            </Card>
            
            {/* Erreur */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Erreur :</Typography>
                {error}
              </Alert>
            )}
            
            {/* Succès */}
            {result && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Succès !</Typography>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </Alert>
            )}
            
            {/* Debug du formulaire */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2">Données du formulaire :</Typography>
                <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AttendanceTest; 