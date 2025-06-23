import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import TeacherForm from './TeacherForm';
import odooApi from '../../services/odooApi.jsx';

const TeacherCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await odooApi.createTeacher(formData);
      
      // Rediriger vers la page de détail du nouvel enseignant
      navigate(`/teachers/${result.id}`);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError(err.message || 'Erreur lors de la création de l\'enseignant');
    } finally {
      setSubmitting(false);
    }
  };

  const initialData = {
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    department: '',
    specialization: '',
    hire_date: '',
    bio: '',
    active: true
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header avec navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/teachers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Nouvel enseignant
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TeacherForm
            initialData={initialData}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitButtonText="Créer l'enseignant"
            submitButtonIcon={<AddIcon />}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default TeacherCreate; 