import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069';

const BulletinCreate = () => {
  // États du composant...
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // ... rest of component logic ...

  const fetchReferenceData = async () => {
    try {
      setLoading(true);
      
      const [studentsRes, coursesRes, batchesRes, trimestresRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/students`),
        fetch(`${API_BASE_URL}/api/courses`),
        fetch(`${API_BASE_URL}/api/batches`),
        fetch(`${API_BASE_URL}/api/trimestres`)
      ]);

      // ... rest of the function ...
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données de référence');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation finale
      if (!validateStep(2)) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/bulletins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSuccessMessage('Bulletin créé avec succès');
        // Rediriger vers le détail du bulletin créé
        setTimeout(() => {
          navigate(`/bulletins/${result.data.id}`);
        }, 2000);
      } else {
        setError(result.message || 'Erreur lors de la création du bulletin');
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component ...
};

export default BulletinCreate; 