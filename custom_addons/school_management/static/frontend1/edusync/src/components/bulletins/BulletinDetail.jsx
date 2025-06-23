import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent,
  Button, Chip, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, CircularProgress, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Avatar, Stack, LinearProgress
} from '@mui/material';
import {
  ArrowBack, Edit, Archive, Publish, Calculate,
  Print, Download, PersonOutline, SchoolOutlined,
  GradeOutlined, CalendarTodayOutlined, NotesOutlined, CheckCircle
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069';

const BulletinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { odooApi } = useOdoo();
  
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

      {/* Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {canPerformAction('calculate') && (
            <Button
              variant="contained"
              startIcon={<Calculate />}
              onClick={() => handleAction('calculate')}
              disabled={actionLoading}
              color="primary"
            >
              Calculer
            </Button>
          )}
          
          {canPerformAction('validate') && (
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => handleAction('validate')}
              disabled={actionLoading}
              color="warning"
            >
              Valider
            </Button>
          )}
          
          {canPerformAction('publish') && (
            <Button
              variant="contained"
              startIcon={<Publish />}
              onClick={() => handleAction('publish')}
              disabled={actionLoading}
              color="success"
            >
              Publier
            </Button>
          )}
          
          {canPerformAction('edit') && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/bulletins/${id}/edit`)}
              disabled={actionLoading}
            >
              Modifier
            </Button>
          )}
          
          {canPerformAction('archive') && (
            <Button
              variant="outlined"
              startIcon={<Archive />}
              onClick={() => setOpenArchiveDialog(true)}
              disabled={actionLoading}
              color="error"
            >
              Archiver
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* TODO: Implémenter téléchargement PDF */}}
          >
            Télécharger PDF
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Informations générales */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonOutline sx={{ mr: 1 }} />
              Informations de l'étudiant
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {bulletin.student_name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{bulletin.student_name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {bulletin.student_id}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Classe</Typography>
                <Typography variant="body1">{bulletin.batch_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Trimestre</Typography>
                <Typography variant="body1">{bulletin.trimestre_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Date de création</Typography>
                <Typography variant="body1">
                  {bulletin.date_creation ? new Date(bulletin.date_creation).toLocaleDateString('fr-FR') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Résultats généraux */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <GradeOutlined sx={{ mr: 1 }} />
              Résultats
            </Typography>
            
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h3" sx={{ color: getAppreciationColor(bulletin.moyenne_generale) }}>
                {bulletin.moyenne_generale?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Moyenne générale
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Rang dans la classe:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {bulletin.rang_classe || '-'} / {bulletin.total_eleves_classe || '-'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Absences:</Typography>
              <Typography variant="body2">
                {bulletin.absence_non_justifiees + bulletin.absence_justifiees || 0}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Retards:</Typography>
              <Typography variant="body2">
                {bulletin.retards || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Notes par matière */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <NotesOutlined sx={{ mr: 1 }} />
              Notes par matière
            </Typography>
            
            {bulletin.bulletin_lines && bulletin.bulletin_lines.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Matière</TableCell>
                      {getNoteColumnsWithData().map((col) => (
                        <TableCell key={col.key} align="center">
                          {col.label}
                        </TableCell>
                      ))}
                      <TableCell align="center">Moyenne</TableCell>
                      <TableCell align="center">Coefficient</TableCell>
                      <TableCell align="center">Rang</TableCell>
                      <TableCell>Appréciation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bulletin.bulletin_lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2" fontWeight="medium">
                            {line.subject_name}
                          </Typography>
                        </TableCell>
                        {getNoteColumnsWithData().map((col) => (
                          <TableCell key={col.key} align="center">
                            {line[col.key] && parseFloat(line[col.key]) > 0 
                              ? parseFloat(line[col.key]).toFixed(2) 
                              : '-'}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              sx={{ color: getAppreciationColor(line.moyenne_matiere) }}
                            >
                              {line.moyenne_matiere?.toFixed(2) || '0.00'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {line.coefficient || 1}
                        </TableCell>
                        <TableCell align="center">
                          {line.rang_matiere || '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {line.appreciation || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                Aucune note disponible. {canPerformAction('calculate') && 'Cliquez sur "Calculer" pour générer les notes automatiquement.'}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Appréciation générale */}
        {bulletin.appreciation_generale && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Appréciation générale
              </Typography>
              <Typography variant="body1">
                {bulletin.appreciation_generale}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Dialog d'archivage */}
      <Dialog open={openArchiveDialog} onClose={() => setOpenArchiveDialog(false)}>
        <DialogTitle>Archiver le bulletin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Voulez-vous vraiment archiver ce bulletin ? Cette action est irréversible.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Raison de l'archivage"
            fullWidth
            variant="outlined"
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
            placeholder="Expliquez pourquoi vous archivez ce bulletin..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenArchiveDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleArchive} 
            color="error" 
            variant="contained"
            disabled={!archiveReason.trim() || actionLoading}
          >
            Archiver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Messages de succès et d'erreur */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BulletinDetail; 