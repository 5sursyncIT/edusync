import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../hooks/useOdoo';
import odooApi from '../services/odooApi.jsx';

const TestStudents = () => {
  const { user } = useAuth();
  const { data: studentsFromHook, loading, error } = useStudents();
  const [directApiResult, setDirectApiResult] = useState(null);
  const [directApiError, setDirectApiError] = useState(null);

  const testDirectApi = async () => {
    try {
      console.log('🧪 Test API direct...');
      const result = await odooApi.getStudents(1, 10);
      console.log('🧪 Résultat API direct:', result);
      setDirectApiResult(result);
      setDirectApiError(null);
    } catch (error) {
      console.error('🧪 Erreur API direct:', error);
      setDirectApiError(error.message);
      setDirectApiResult(null);
    }
  };

  useEffect(() => {
    console.log('🧪 TestStudents: user:', user);
    console.log('🧪 TestStudents: studentsFromHook:', studentsFromHook);
    console.log('🧪 TestStudents: loading:', loading);
    console.log('🧪 TestStudents: error:', error);
  }, [user, studentsFromHook, loading, error]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Test Étudiants - Debug
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Contexte Auth</Typography>
        <Typography>User: {user ? JSON.stringify(user) : 'null'}</Typography>
        <Typography>User ID: {user?.id || 'undefined'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Hook useStudents</Typography>
        <Typography>Loading: {loading.toString()}</Typography>
        <Typography>Error: {error || 'null'}</Typography>
        <Typography>Data length: {studentsFromHook?.length || 0}</Typography>
        <Typography>Data: {JSON.stringify(studentsFromHook?.slice(0, 2) || null)}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Test API Direct</Typography>
        <Button variant="contained" onClick={testDirectApi} sx={{ mb: 1 }}>
          Tester API Direct
        </Button>
        <Typography>Error: {directApiError || 'null'}</Typography>
        <Typography>Students count: {directApiResult?.students?.length || 0}</Typography>
        <Typography>Result: {JSON.stringify(directApiResult?.students?.slice(0, 2) || null)}</Typography>
      </Paper>
    </Box>
  );
};

export default TestStudents; 