import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { useAttendanceActions, useSessionAttendances } from '../../hooks/useAttendance';
import odooApi from '../../services/odooApi.jsx';

const AttendanceTest = () => {
  const [sessionId, setSessionId] = useState('38');
  const [date, setDate] = useState('2025-06-12');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { 
    markAllPresent, 
    markAllAbsent, 
    loading 
  } = useAttendanceActions();

  const { data: sessionData, refetch } = useSessionAttendances(sessionId, date);

  // Debug des fonctions
  useEffect(() => {
    console.log('🔍 AttendanceTest - Fonctions disponibles:', {
      markAllPresent: typeof markAllPresent,
      markAllAbsent: typeof markAllAbsent,
      loading
    });
  }, [markAllPresent, markAllAbsent, loading]);

  const handleTestMarkAllPresent = async () => {
    try {
      setError('');
      setMessage('');

      if (!markAllPresent) {
        setError('❌ Fonction markAllPresent non disponible');
        return;
      }

      const students = sessionData?.students || [];
      if (students.length === 0) {
        setError('❌ Aucun étudiant trouvé dans la session');
        return;
      }

      const studentIds = students.map(s => s.id);
      console.log('🎯 Test markAllPresent:', { sessionId, studentIds, date });

      const result = await markAllPresent(sessionId, studentIds, date);
      console.log('✅ Résultat markAllPresent:', result);

      setMessage(`✅ ${result.message || 'Tous les étudiants marqués présents'}`);
      
      // Rafraîchir les données
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      console.error('❌ Erreur test markAllPresent:', err);
      setError(`❌ Erreur: ${err.message}`);
    }
  };

  const handleTestMarkAllAbsent = async () => {
    try {
      setError('');
      setMessage('');

      if (!markAllAbsent) {
        setError('❌ Fonction markAllAbsent non disponible');
        return;
      }

      const students = sessionData?.students || [];
      if (students.length === 0) {
        setError('❌ Aucun étudiant trouvé dans la session');
        return;
      }

      const studentIds = students.map(s => s.id);
      console.log('🎯 Test markAllAbsent:', { sessionId, studentIds, date });

      const result = await markAllAbsent(sessionId, studentIds, date);
      console.log('✅ Résultat markAllAbsent:', result);

      setMessage(`✅ ${result.message || 'Tous les étudiants marqués absents'}`);
      
      // Rafraîchir les données
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      console.error('❌ Erreur test markAllAbsent:', err);
      setError(`❌ Erreur: ${err.message}`);
    }
  };

  const handleTestDirectAPI = async () => {
    try {
      setError('');
      setMessage('');

      console.log('🎯 Test API direct:', { sessionId, date });

      const students = sessionData?.students || [];
      if (students.length === 0) {
        setError('❌ Aucun étudiant trouvé dans la session');
        return;
      }

      const studentIds = students.map(s => s.id);
      
      const result = await odooApi.markAllPresent(sessionId, studentIds, date);
      console.log('✅ Résultat API direct:', result);

      setMessage(`✅ API direct: ${result.message || 'Succès'}`);
      
      // Rafraîchir les données
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      console.error('❌ Erreur API direct:', err);
      setError(`❌ Erreur API direct: ${err.message}`);
    }
  };

  const students = sessionData?.students || [];
  const stats = sessionData?.statistics || {};

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Test des Fonctions de Présence
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="ID Session"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            sx={{ mr: 2 }}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            Session {sessionId}: {students.length} étudiants
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Présents: {stats.present_count || 0}, Absents: {stats.absent_count || 0}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleTestMarkAllPresent}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Test Marquer Tous Présents
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleTestMarkAllAbsent}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Test Marquer Tous Absents
          </Button>
          <Button
            variant="outlined"
            onClick={handleTestDirectAPI}
            disabled={loading}
          >
            Test API Direct
          </Button>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box>
          <Typography variant="h6" gutterBottom>
            Étudiants de la session:
          </Typography>
          {students.map(student => (
            <Typography key={student.id} variant="body2">
              {student.name} - {student.attendance?.status || 'absent'}
            </Typography>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default AttendanceTest; 