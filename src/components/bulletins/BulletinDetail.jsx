import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Calculate,
  Check,
  Publish,
  Archive,
  Print,
  Download
} from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069';

const BulletinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchBulletinDetails();
  }, [id]);

  const fetchBulletinDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/bulletins/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setBulletin(result.data);
      } else {
        setError(result.message || 'Erreur lors du chargement du bulletin');
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/bulletins/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSuccessMessage(result.message);
        await fetchBulletinDetails(); // Recharger les données
      } else {
        setErrorMessage(result.message || `Erreur lors de l'action ${action}`);
      }
    } catch (err) {
      console.error(`Erreur lors de l'action ${action}:`, err);
      setErrorMessage('Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) {
      setErrorMessage('Veuillez saisir une raison pour l\'archivage');
      return;
    }
    
    await handleAction('archive');
    setOpenArchiveDialog(false);
    setArchiveReason('');
  };

  const getStateColor = (state) => {
    const colors = {
      'draft': 'default',
      'calculated': 'primary',
      'validated': 'warning',
      'published': 'success',
      'archived': 'error'
    };
    return colors[state] || 'default';
  };

  const getStateLabel = (state) => {
    const labels = {
      'draft': 'Brouillon',
      'calculated': 'Calculé',
      'validated': 'Validé',
      'published': 'Publié',
      'archived': 'Archivé'
    };
    return labels[state] || state;
  };

  const getAppreciationColor = (moyenne) => {
    if (moyenne >= 16) return '#4caf50';
    if (moyenne >= 14) return '#8bc34a';
    if (moyenne >= 12) return '#ffc107';
    if (moyenne >= 10) return '#ff9800';
    return '#f44336';
  };

  // Fonction pour obtenir les colonnes de notes qui ont des données
  const getNoteColumnsWithData = () => {
    if (!bulletin?.bulletin_lines || bulletin.bulletin_lines.length === 0) {
      return [];
    }

    // Définir toutes les colonnes possibles
    const allColumns = [
      { key: 'note_controle', label: 'Contrôle Continu' },
      { key: 'note_composition', label: 'Composition' },
      { key: 'note_devoir', label: 'Devoir' },
      { key: 'note_oral', label: 'Oral' },
      { key: 'note_tp', label: 'TP' }
    ];

    // Vérifier quelles colonnes ont des notes remplies
    const columnsWithData = [];
    
    allColumns.forEach(column => {
      const hasData = bulletin.bulletin_lines.some(line => 
        line[column.key] && parseFloat(line[column.key]) > 0
      );
      
      if (hasData) {
        columnsWithData.push(column);
      }
    });

    return columnsWithData;
  };

  const canPerformAction = (action) => {
    if (!bulletin) return false;
    
    switch (action) {
      case 'calculate':
        return bulletin.state === 'draft';
      case 'validate':
        return bulletin.state === 'calculated';
      case 'publish':
        return bulletin.state === 'validated';
      case 'archive':
        return ['calculated', 'validated', 'published'].includes(bulletin.state);
      case 'edit':
        return ['draft', 'calculated'].includes(bulletin.state);
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/bulletins')}>
          Retour à la liste
        </Button>
      </Container>
    );
  }

  if (!bulletin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Bulletin non trouvé
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/bulletins')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Bulletin N° {bulletin.numero}
        </Typography>
        <Chip 
          label={getStateLabel(bulletin.state)} 
          color={getStateColor(bulletin.state)}
          size="large"
        />
      </Box>

      {/* Reste du composant... */}
    </Container>
  );
};

export default BulletinDetail; 