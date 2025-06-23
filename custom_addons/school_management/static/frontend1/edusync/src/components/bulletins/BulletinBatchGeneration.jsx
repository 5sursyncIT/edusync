import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent,
  Button, FormControl, InputLabel, Select, MenuItem, TextField,
  Alert, CircularProgress, IconButton, Stepper, Step, StepLabel,
  StepContent, Divider, Chip, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, List, ListItem,
  ListItemText, ListItemIcon, Checkbox, FormControlLabel,
  Switch, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ArrowBack, PlayArrow, Refresh, CheckCircle, Error as ErrorIcon,
  Warning, Info, ExpandMore, Visibility, Settings, Assessment,
  School, Class, Person, CalendarToday, Analytics, Download
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const BulletinBatchGeneration = () => {
  const navigate = useNavigate();
  const { api } = useOdoo();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    batch_id: '',
    trimestre_id: '',
    regenerate_existing: false,
    auto_calculate: true,
    auto_validate: false,
    notify_teachers: false,
    notify_parents: false
  });

  // Données de référence
  const [batches, setBatches] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [students, setStudents] = useState([]);
  const [existingBulletins, setExistingBulletins] = useState([]);
  
  // Statistiques de génération
  const [generationStats, setGenerationStats] = useState({
    total_students: 0,
    existing_bulletins: 0,
    bulletins_to_create: 0,
    bulletins_to_update: 0
  });
  
  // Résultats de génération
  const [generationResults, setGenerationResults] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLog, setGenerationLog] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dialog de confirmation
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (formData.batch_id && formData.trimestre_id) {
      fetchClassStatistics();
    }
  }, [formData.batch_id, formData.trimestre_id, formData.regenerate_existing]);

  const fetchReferenceData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Début chargement des données de référence...');
      
      const [batchesRes, trimestresRes] = await Promise.all([
        api.getAllBatches(),
        api.getTrimestres()
      ]);
      
      console.log('📊 Réponse batches:', batchesRes);
      console.log('📊 Réponse trimestres:', trimestresRes);
      
      // Gestion des batches avec format de réponse multiple
      if (batchesRes && batchesRes.status === 'success' && batchesRes.data && batchesRes.data.batches) {
        console.log('✅ Batches trouvés (format success/data):', batchesRes.data.batches);
        setBatches(batchesRes.data.batches);
      } else if (batchesRes && batchesRes.data && Array.isArray(batchesRes.data)) {
        console.log('✅ Batches trouvés (format data direct):', batchesRes.data);
        setBatches(batchesRes.data);
      } else if (batchesRes && Array.isArray(batchesRes)) {
        console.log('✅ Batches trouvés (format array direct):', batchesRes);
        setBatches(batchesRes);
      } else {
        console.warn('⚠️ Format de réponse batches non reconnu:', batchesRes);
        setBatches([]);
      }
      
      // Gestion des trimestres
      if (trimestresRes && trimestresRes.success && trimestresRes.data) {
        console.log('✅ Trimestres trouvés:', trimestresRes.data);
        setTrimestres(trimestresRes.data);
      } else if (trimestresRes && Array.isArray(trimestresRes)) {
        console.log('✅ Trimestres trouvés (format array):', trimestresRes);
        setTrimestres(trimestresRes);
      } else {
        console.warn('⚠️ Format de réponse trimestres non reconnu:', trimestresRes);
        setTrimestres([]);
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement données:', err);
      setError('Erreur lors du chargement des données de référence');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStatistics = async () => {
    try {
      // Récupérer les étudiants de la classe
      const studentsRes = await api.getStudentsByBatch(formData.batch_id);
      let studentsList = [];
      if (studentsRes && studentsRes.success) {
        studentsList = studentsRes.data;
      }
      
      // Récupérer les bulletins existants
      const bulletinsRes = await api.getBulletins({
        batch_id: formData.batch_id,
        trimestre_id: formData.trimestre_id
      });
      
      let existingBulletinsList = [];
      if (bulletinsRes && bulletinsRes.success) {
        existingBulletinsList = bulletinsRes.data;
      }
      
      setStudents(studentsList);
      setExistingBulletins(existingBulletinsList);
      
      // Calculer les statistiques
      const stats = {
        total_students: studentsList.length,
        existing_bulletins: existingBulletinsList.length,
        bulletins_to_create: 0,
        bulletins_to_update: 0
      };
      
      if (formData.regenerate_existing) {
        stats.bulletins_to_update = existingBulletinsList.length;
        stats.bulletins_to_create = studentsList.length - existingBulletinsList.length;
      } else {
        const existingStudentIds = existingBulletinsList.map(b => b.student_id);
        const studentsWithoutBulletins = studentsList.filter(s => !existingStudentIds.includes(s.id));
        stats.bulletins_to_create = studentsWithoutBulletins.length;
      }
      
      setGenerationStats(stats);
      
    } catch (err) {
      console.error('Erreur statistiques classe:', err);
      setError('Erreur lors du calcul des statistiques');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreview = () => {
    setPreviewDialog(true);
  };

  const handleStartGeneration = () => {
    if (generationStats.total_students === 0) {
      setError('Aucun étudiant trouvé dans cette classe');
      return;
    }
    setConfirmDialog(true);
  };

  const executeGeneration = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationLog([]);
      setConfirmDialog(false);
      
      // Simuler le processus de génération avec des étapes
      const steps = [
        { message: 'Validation des paramètres...', progress: 10 },
        { message: 'Récupération des données étudiants...', progress: 20 },
        { message: 'Vérification des bulletins existants...', progress: 30 },
        { message: 'Début de la génération...', progress: 40 }
      ];
      
      for (const step of steps) {
        setGenerationLog(prev => [...prev, { 
          type: 'info', 
          message: step.message, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
        setGenerationProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Appel API de génération en lot
      const result = await api.generateBulletinsBatch(
        formData.batch_id, 
        formData.trimestre_id,
        {
          regenerate_existing: formData.regenerate_existing,
          auto_calculate: formData.auto_calculate,
          auto_validate: formData.auto_validate
        }
      );
      
      setGenerationProgress(90);
      
      if (result.success) {
        setGenerationLog(prev => [...prev, { 
          type: 'success', 
          message: `✅ ${result.message}`, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
        
        setGenerationResults({
          success: true,
          created_count: result.data?.created_count || 0,
          updated_count: result.data?.updated_count || 0,
          error_count: result.data?.error_count || 0,
          bulletins: result.data?.bulletins || []
        });
        
        setSuccessMessage('Génération terminée avec succès !');
        setActiveStep(2); // Passer à l'étape des résultats
        setGenerationProgress(100);
      } else {
        throw new Error(result.message || 'Erreur lors de la génération');
      }
      
    } catch (err) {
      console.error('Erreur génération:', err);
      setGenerationLog(prev => [...prev, { 
        type: 'error', 
        message: `❌ Erreur: ${err.message}`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
      setError(`Erreur lors de la génération: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {/* Configuration de génération */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Classe</InputLabel>
                  <Select
                    value={formData.batch_id}
                    label="Classe"
                    onChange={(e) => handleFormChange('batch_id', e.target.value)}
                  >
                    {!batches || batches.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="textSecondary">
                          Aucune classe disponible
                        </Typography>
                      </MenuItem>
                    ) : (
                      batches.map((batch) => (
                        <MenuItem key={batch.id} value={batch.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Class sx={{ mr: 1, fontSize: 18 }} />
                            {batch.name} {batch.course_name && `(${batch.course_name})`}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Trimestre</InputLabel>
                  <Select
                    value={formData.trimestre_id}
                    label="Trimestre"
                    onChange={(e) => handleFormChange('trimestre_id', e.target.value)}
                  >
                    {trimestres.map((trimestre) => (
                      <MenuItem key={trimestre.id} value={trimestre.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday sx={{ mr: 1, fontSize: 18 }} />
                          {trimestre.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Options avancées */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Settings sx={{ mr: 1 }} />
                      <Typography variant="h6">Options avancées</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.regenerate_existing}
                            onChange={(e) => handleFormChange('regenerate_existing', e.target.checked)}
                          />
                        }
                        label="Régénérer les bulletins existants"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.auto_calculate}
                            onChange={(e) => handleFormChange('auto_calculate', e.target.checked)}
                          />
                        }
                        label="Calculer automatiquement les moyennes"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.auto_validate}
                            onChange={(e) => handleFormChange('auto_validate', e.target.checked)}
                          />
                        }
                        label="Valider automatiquement après calcul"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.notify_teachers}
                            onChange={(e) => handleFormChange('notify_teachers', e.target.checked)}
                          />
                        }
                        label="Notifier les enseignants"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.notify_parents}
                            onChange={(e) => handleFormChange('notify_parents', e.target.checked)}
                          />
                        }
                        label="Notifier les parents"
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              
              {/* Statistiques de prévisualisation */}
              {(formData.batch_id && formData.trimestre_id) && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Analytics sx={{ mr: 1 }} />
                        Aperçu de la génération
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                              {generationStats.total_students}
                            </Typography>
                            <Typography variant="body2">Étudiants total</Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">
                              {generationStats.existing_bulletins}
                            </Typography>
                            <Typography variant="body2">Bulletins existants</Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                              {generationStats.bulletins_to_create}
                            </Typography>
                            <Typography variant="body2">À créer</Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                              {generationStats.bulletins_to_update}
                            </Typography>
                            <Typography variant="body2">À mettre à jour</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={handlePreview}
                          disabled={generationStats.total_students === 0}
                        >
                          Prévisualiser
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            {/* Processus de génération */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Génération en cours...
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={generationProgress} 
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Progression: {generationProgress}%
                </Typography>
                
                {/* Log de génération */}
                <Box sx={{ maxHeight: 300, overflow: 'auto', mt: 2 }}>
                  <List dense>
                    {generationLog.map((log, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {log.type === 'success' && <CheckCircle color="success" />}
                          {log.type === 'error' && <ErrorIcon color="error" />}
                          {log.type === 'warning' && <Warning color="warning" />}
                          {log.type === 'info' && <Info color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={log.message}
                          secondary={log.timestamp}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            {/* Résultats de génération */}
            {generationResults && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity={generationResults.success ? "success" : "error"} sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      {generationResults.success ? "✅ Génération terminée !" : "❌ Erreur lors de la génération"}
                    </Typography>
                  </Alert>
                </Grid>
                
                {generationResults.success && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="success.main">
                            {generationResults.created_count}
                          </Typography>
                          <Typography variant="body1">Bulletins créés</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="warning.main">
                            {generationResults.updated_count}
                          </Typography>
                          <Typography variant="body1">Bulletins mis à jour</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="error.main">
                            {generationResults.error_count}
                          </Typography>
                          <Typography variant="body1">Erreurs</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Liste des bulletins générés */}
                    {generationResults.bulletins && generationResults.bulletins.length > 0 && (
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Bulletins générés
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>N° Bulletin</TableCell>
                                    <TableCell>Étudiant</TableCell>
                                    <TableCell>État</TableCell>
                                    <TableCell>Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {generationResults.bulletins.map((bulletin) => (
                                    <TableRow key={bulletin.id}>
                                      <TableCell>{bulletin.numero}</TableCell>
                                      <TableCell>{bulletin.student_name}</TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={bulletin.state || 'Créé'} 
                                          size="small" 
                                          color="primary"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          size="small"
                                          onClick={() => navigate(`/bulletins/${bulletin.id}`)}
                                        >
                                          Voir
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  const steps = [
    {
      label: 'Configuration',
      description: 'Sélectionner la classe et les options'
    },
    {
      label: 'Génération',
      description: 'Création des bulletins en cours'
    },
    {
      label: 'Résultats',
      description: 'Résumé de la génération'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/bulletins')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" color="primary" fontWeight="bold">
              Génération en lot de bulletins
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Créer des bulletins pour tous les étudiants d'une classe
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(index)}
                
                <Box sx={{ mt: 3 }}>
                  {index === 0 && (
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (!formData.batch_id || !formData.trimestre_id) {
                          setError('Veuillez sélectionner une classe et un trimestre');
                          return;
                        }
                        setActiveStep(1);
                        handleStartGeneration();
                      }}
                      disabled={!formData.batch_id || !formData.trimestre_id || loading}
                      startIcon={<PlayArrow />}
                      sx={{ mr: 1 }}
                    >
                      Démarrer la génération
                    </Button>
                  )}
                  
                  {index === 2 && (
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/bulletins')}
                      >
                        Voir tous les bulletins
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setActiveStep(0);
                          setGenerationResults(null);
                          setGenerationLog([]);
                          setGenerationProgress(0);
                        }}
                        startIcon={<Refresh />}
                      >
                        Nouvelle génération
                      </Button>
                    </Stack>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Dialog de confirmation */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer la génération</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Vous êtes sur le point de générer des bulletins avec les paramètres suivants :
          </Typography>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Classe :</strong> {batches.find(b => b.id == formData.batch_id)?.name}</Typography>
            <Typography variant="body2"><strong>Trimestre :</strong> {trimestres.find(t => t.id == formData.trimestre_id)?.name}</Typography>
            <Typography variant="body2"><strong>Étudiants :</strong> {generationStats.total_students}</Typography>
            <Typography variant="body2"><strong>Bulletins à créer :</strong> {generationStats.bulletins_to_create}</Typography>
            {formData.regenerate_existing && (
              <Typography variant="body2"><strong>Bulletins à mettre à jour :</strong> {generationStats.bulletins_to_update}</Typography>
            )}
          </Box>
          
          {formData.regenerate_existing && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Attention : Les bulletins existants seront supprimés et recréés !
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={executeGeneration} 
            variant="contained" 
            disabled={isGenerating}
          >
            {isGenerating ? <CircularProgress size={20} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de prévisualisation */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Prévisualisation de la génération</DialogTitle>
        <DialogContent>
          {students.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Étudiant</TableCell>
                    <TableCell>Statut bulletin</TableCell>
                    <TableCell>Action prévue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const hasBulletin = existingBulletins.some(b => b.student_id === student.id);
                    const action = hasBulletin 
                      ? (formData.regenerate_existing ? 'Régénérer' : 'Ignorer')
                      : 'Créer';
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={hasBulletin ? 'Existant' : 'Nouveau'} 
                            size="small"
                            color={hasBulletin ? 'default' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={action} 
                            size="small"
                            color={action === 'Créer' ? 'success' : action === 'Régénérer' ? 'warning' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>Aucun étudiant trouvé dans cette classe.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {loading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <CircularProgress size={60} />
        </Box>
      )}
    </Container>
  );
};

export default BulletinBatchGeneration; 