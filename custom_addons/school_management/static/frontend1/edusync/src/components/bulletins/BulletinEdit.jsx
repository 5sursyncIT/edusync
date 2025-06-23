import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent,
  Button, TextField, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, CircularProgress, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Avatar, Stack, Fab,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import {
  ArrowBack, Save, Cancel, Add, Delete, Edit, ExpandMore,
  PersonOutline, GradeOutlined, NotesOutlined, Calculate
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const BulletinEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useOdoo();
  
  const [bulletin, setBulletin] = useState(null);
  const [originalBulletin, setOriginalBulletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [openAddSubjectDialog, setOpenAddSubjectDialog] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchBulletinDetails();
    fetchSubjects();
  }, [id]);

  useEffect(() => {
    // Détecter les changements
    if (originalBulletin && bulletin) {
      const changes = JSON.stringify(bulletin) !== JSON.stringify(originalBulletin);
      setHasChanges(changes);
    }
  }, [bulletin, originalBulletin]);

  const fetchBulletinDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.getBulletin(id);
      
      if (result.success) {
        console.log('📋 Bulletin chargé:', result.data);
        setBulletin(result.data);
        setOriginalBulletin(JSON.parse(JSON.stringify(result.data)));
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

  const fetchSubjects = async () => {
    try {
      console.log('🚀 Début fetchSubjects');
      
      // Essai 1: getAllSubjects
      const result = await api.getAllSubjects();
      console.log('🔍 Réponse getAllSubjects complète:', result);
      
      if (result.status === 'success' && result.data) {
        // Format possible: {data: {subjects: [...]}} ou {data: [...]}
        let subjectsData = [];
        
        if (Array.isArray(result.data)) {
          // Format direct: {data: [...]}
          subjectsData = result.data;
        } else if (result.data.subjects && Array.isArray(result.data.subjects)) {
          // Format avec pagination: {data: {subjects: [...], pagination: {...}}}
          subjectsData = result.data.subjects;
        } else {
          // Essayer de trouver le premier tableau dans l'objet data
          for (const key in result.data) {
            if (Array.isArray(result.data[key])) {
              subjectsData = result.data[key];
              break;
            }
          }
        }
        
        console.log('📚 Matières extraites via getAllSubjects:', subjectsData);
        if (Array.isArray(subjectsData) && subjectsData.length > 0) {
          setSubjects(subjectsData);
          return; // Arrêter ici si on a trouvé les matières
        }
      }
      
      // Si on arrive ici, aucune matière trouvée
      console.warn('⚠️ Aucune matière trouvée');
      setSubjects([]);
      
    } catch (err) {
      console.error('💥 Erreur générale lors du chargement des matières:', err);
      setSubjects([]);
    }
  };

  const handleBulletinChange = (field, value) => {
    setBulletin(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNoteLineChange = (lineId, field, value) => {
    setBulletin(prev => ({
      ...prev,
      bulletin_lines: prev.bulletin_lines.map(line =>
        line.id === lineId ? { ...line, [field]: value } : line
      )
    }));
  };

  const calculateLineMoyenne = (line) => {
    const level = getEducationLevel();
    
    let notes = [];
    
    if (level === 'primaire') {
      // Pour le primaire : seulement contrôle et composition
      notes = [
        line.note_controle || 0,
        line.note_composition || 0
      ].filter(note => note > 0);
    } else {
      // Pour collège et lycée : seulement devoir et composition
      notes = [
        line.note_devoir || 0,
        line.note_composition || 0
      ].filter(note => note > 0);
    }

    if (notes.length === 0) return 0;
    return notes.reduce((sum, note) => sum + note, 0) / notes.length;
  };

  const recalculateLineMoyenne = (lineId) => {
    setBulletin(prev => ({
      ...prev,
      bulletin_lines: prev.bulletin_lines.map(line => {
        if (line.id === lineId) {
          const newMoyenne = calculateLineMoyenne(line);
          return { ...line, moyenne_matiere: newMoyenne };
        }
        return line;
      })
    }));
  };

  const calculateGeneralMoyenne = () => {
    if (!bulletin?.bulletin_lines?.length) return 0;
    
    const totalCoeff = bulletin.bulletin_lines.reduce((sum, line) => sum + (line.coefficient || 1), 0);
    const totalPoints = bulletin.bulletin_lines.reduce((sum, line) => 
      sum + ((line.moyenne_matiere || 0) * (line.coefficient || 1)), 0);
    
    return totalCoeff > 0 ? totalPoints / totalCoeff : 0;
  };

  const handleAddSubject = () => {
    if (!newSubjectId || !Array.isArray(subjects)) return;
    
    const subject = subjects.find(s => s.id === parseInt(newSubjectId));
    if (!subject) return;

    // Vérifier si la matière n'est pas déjà ajoutée
    const alreadyExists = bulletin.bulletin_lines?.some(line => line.subject_id === subject.id);
    if (alreadyExists) {
      setErrorMessage(`La matière "${subject.name}" est déjà ajoutée au bulletin`);
      setOpenAddSubjectDialog(false);
      setNewSubjectId('');
      return;
    }

    console.log('➕ Ajout de la matière:', subject);

    const newLine = {
      id: `new_${Date.now()}_${subject.id}`, // ID temporaire unique
      subject_id: subject.id,
      subject_name: subject.name,
      note_controle: 0,
      note_composition: 0,
      note_devoir: 0,
      note_oral: 0,
      note_tp: 0,
      moyenne_matiere: 0,
      coefficient: 1,
      rang_matiere: 0,
      appreciation: ''
    };

    console.log('📝 Nouvelle ligne créée:', newLine);

    setBulletin(prev => ({
      ...prev,
      bulletin_lines: [...(prev.bulletin_lines || []), newLine]
    }));

    setOpenAddSubjectDialog(false);
    setNewSubjectId('');
    setSuccessMessage(`Matière "${subject.name}" ajoutée avec succès`);
  };

  const handleRemoveSubject = (lineId) => {
    setBulletin(prev => ({
      ...prev,
      bulletin_lines: prev.bulletin_lines.filter(line => line.id !== lineId)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Calculer la moyenne générale
      const moyenneGenerale = calculateGeneralMoyenne();

      const updateData = {
        appreciation_generale: bulletin.appreciation_generale,
        absence_non_justifiees: bulletin.absence_non_justifiees || 0,
        absence_justifiees: bulletin.absence_justifiees || 0,
        retards: bulletin.retards || 0,
        moyenne_generale: moyenneGenerale,
        manual_save: true, // Indicateur pour éviter le recalcul automatique
        preserve_manual_notes: true, // Préserver les notes saisies manuellement
        bulletin_lines: bulletin.bulletin_lines?.map(line => ({
          id: line.id.toString().startsWith('new_') ? null : line.id,
          subject_id: line.subject_id,
          note_controle: parseFloat(line.note_controle) || 0,
          note_composition: parseFloat(line.note_composition) || 0,
          note_devoir: parseFloat(line.note_devoir) || 0,
          note_oral: parseFloat(line.note_oral) || 0,
          note_tp: parseFloat(line.note_tp) || 0,
          moyenne_matiere: parseFloat(line.moyenne_matiere) || 0,
          coefficient: parseFloat(line.coefficient) || 1,
          appreciation: line.appreciation || ''
        }))
      };

      console.log('💾 Données à sauvegarder (avec manual_save=true):', updateData);
      
      const result = await api.updateBulletin(id, updateData);
      
      console.log('📤 Réponse de sauvegarde:', result);
      
      if (result.success) {
        setSuccessMessage('Bulletin mis à jour avec succès');
        setHasChanges(false);
        
        // Toujours recharger les données complètes depuis l'API après sauvegarde
        // car l'API ne retourne souvent qu'un objet partiel
        console.log('🔄 Rechargement complet du bulletin après sauvegarde...');
        await fetchBulletinDetails();
      } else {
        console.error('❌ Erreur lors de la sauvegarde:', result);
        setErrorMessage(result.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('💥 Erreur lors de la sauvegarde:', err);
      setErrorMessage('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir annuler ?')) {
        navigate(`/bulletins/${id}`);
      }
    } else {
      navigate(`/bulletins/${id}`);
    }
  };

  const handleAutoCalculate = async () => {
    try {
      setSaving(true);
      const result = await api.calculateBulletin(id);
      
      if (result.success) {
        setSuccessMessage('Notes calculées automatiquement');
        await fetchBulletinDetails();
      } else {
        setErrorMessage(result.message || 'Erreur lors du calcul automatique');
      }
    } catch (err) {
      console.error('Erreur lors du calcul automatique:', err);
      setErrorMessage('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  const getAppreciationColor = (moyenne) => {
    if (moyenne >= 16) return '#4caf50';
    if (moyenne >= 14) return '#8bc34a';
    if (moyenne >= 12) return '#ffc107';
    if (moyenne >= 10) return '#ff9800';
    return '#f44336';
  };

  // Fonction pour déterminer le niveau scolaire
  const getEducationLevel = () => {
    // D'abord essayer via bulletin.education_level
    if (bulletin?.education_level) {
      return bulletin.education_level;
    }
    
    // Ensuite via le nom de la classe/cours
    const courseName = bulletin?.course_name?.toLowerCase() || '';
    const batchName = bulletin?.batch_name?.toLowerCase() || '';
    
    // Détection par mots-clés dans les noms - PRIMAIRE
    if (courseName.includes('primaire') || courseName.includes('primary') ||
        batchName.includes('cp') || batchName.includes('ce1') || batchName.includes('ce2') || 
        batchName.includes('cm1') || batchName.includes('cm2') ||
        batchName.includes('tcp') || // Pour "TCP2025" - probablement "Terminale CP"
        courseName.includes('élémentaire') || courseName.includes('elementaire')) {
      return 'primaire';
    }
    
    // Détection COLLÈGE
    if (courseName.includes('collège') || courseName.includes('college') ||
        batchName.includes('6ème') || batchName.includes('5ème') || 
        batchName.includes('4ème') || batchName.includes('3ème') || 
        batchName.includes('6eme') || batchName.includes('5eme') || 
        batchName.includes('4eme') || batchName.includes('3eme') ||
        batchName.match(/^[6543]e?$/)) { // Regex pour "6e", "5e", etc.
      return 'college';
    }
    
    // Détection LYCÉE
    if (courseName.includes('lycée') || courseName.includes('lycee') ||
        batchName.includes('2nde') || batchName.includes('seconde') ||
        batchName.includes('1ère') || batchName.includes('1ere') || batchName.includes('première') ||
        batchName.includes('terminale') || batchName.includes('term') ||
        batchName.match(/^(2nd|1er|ter)/i)) {
      return 'lycee';
    }
    
    // Cas particuliers - si le nom contient des années, deviner selon l'âge/numéro
    const yearMatch = batchName.match(/(\d{4})/);
    if (yearMatch) {
      // Si c'est une année récente, probablement du primaire/collège
      const year = parseInt(yearMatch[1]);
      if (year >= 2020 && year <= 2030) {
        // Logique basée sur le contexte du nom
        if (batchName.length <= 8) { // Noms courts souvent primaire
          return 'primaire';
        }
      }
    }
    
    // Par défaut, collège (le plus commun)
    return 'college';
  };

  // Fonction pour obtenir les colonnes de notes selon le niveau
  const getNoteColumns = () => {
    const level = getEducationLevel();
    
    if (level === 'primaire') {
      return [
        { key: 'note_controle', label: 'Contrôle', width: 80 },
        { key: 'note_composition', label: 'Composition', width: 80 }
      ];
    } else {
      // Collège et lycée
      return [
        { key: 'note_devoir', label: 'Devoir', width: 80 },
        { key: 'note_composition', label: 'Composition', width: 80 }
      ];
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
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Modifier le bulletin N° {bulletin.numero}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={handleAutoCalculate}
            disabled={saving}
          >
            Calcul Auto
          </Button>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={handleCancel}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous avez des modifications non sauvegardées.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informations générales */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonOutline sx={{ mr: 1 }} />
                Informations générales
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {bulletin.student_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{bulletin.student_name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {bulletin.batch_name} - {bulletin.trimestre_name}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ color: getAppreciationColor(calculateGeneralMoyenne()) }}>
                      {calculateGeneralMoyenne().toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Moyenne générale calculée
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Absences non justifiées"
                    type="number"
                    value={bulletin.absence_non_justifiees || 0}
                    onChange={(e) => handleBulletinChange('absence_non_justifiees', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Absences justifiées"
                    type="number"
                    value={bulletin.absence_justifiees || 0}
                    onChange={(e) => handleBulletinChange('absence_justifiees', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Retards"
                    type="number"
                    value={bulletin.retards || 0}
                    onChange={(e) => handleBulletinChange('retards', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Appréciation générale"
                    multiline
                    rows={3}
                    value={bulletin.appreciation_generale || ''}
                    onChange={(e) => handleBulletinChange('appreciation_generale', e.target.value)}
                    placeholder="Saisissez une appréciation générale sur le travail de l'élève..."
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Notes par matière */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <NotesOutlined sx={{ mr: 1 }} />
                Notes par matière ({bulletin.bulletin_lines?.length || 0} matières)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenAddSubjectDialog(true)}
                  size="small"
                >
                  Ajouter une matière
                </Button>
                
                {/* Indicateur du niveau scolaire détecté */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Niveau détecté:
                  </Typography>
                  <Chip 
                    label={`${getEducationLevel() === 'primaire' ? 'Primaire' : 
                             getEducationLevel() === 'college' ? 'Collège' : 'Lycée'}`}
                    color={getEducationLevel() === 'primaire' ? 'primary' : 'secondary'}
                    size="small"
                  />
                  <Typography variant="caption" color="textSecondary">
                    ({getNoteColumns().map(col => col.label).join(' + ')})
                  </Typography>
                </Box>
              </Box>
              
              {bulletin.bulletin_lines && bulletin.bulletin_lines.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell>Matière</TableCell>
                        {getNoteColumns().map((col) => (
                          <TableCell key={col.key} align="center" sx={{ minWidth: col.width }}>
                            {col.label}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ minWidth: 80 }}>Moyenne</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80 }}>Coeff</TableCell>
                        <TableCell sx={{ minWidth: 200 }}>Appréciation</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulletin.bulletin_lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {line.subject_name}
                            </Typography>
                          </TableCell>
                          {getNoteColumns().map((col) => (
                            <TableCell key={col.key} align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={line[col.key] || ''}
                                onChange={(e) => {
                                  handleNoteLineChange(line.id, col.key, parseFloat(e.target.value) || 0);
                                  setTimeout(() => recalculateLineMoyenne(line.id), 100);
                                }}
                                inputProps={{ min: 0, max: 20, step: 0.01 }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                          ))}
                          <TableCell align="center">
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              sx={{ color: getAppreciationColor(line.moyenne_matiere) }}
                            >
                              {line.moyenne_matiere?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              value={line.coefficient || 1}
                              onChange={(e) => handleNoteLineChange(line.id, 'coefficient', parseFloat(e.target.value) || 1)}
                              inputProps={{ min: 0.5, max: 5, step: 0.5 }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              multiline
                              rows={2}
                              value={line.appreciation || ''}
                              onChange={(e) => handleNoteLineChange(line.id, 'appreciation', e.target.value)}
                              placeholder="Appréciation..."
                              sx={{ width: 180 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveSubject(line.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Aucune matière ajoutée. Cliquez sur "Ajouter une matière" ou "Calcul Auto" pour générer les notes.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Dialog d'ajout de matière */}
      <Dialog open={openAddSubjectDialog} onClose={() => setOpenAddSubjectDialog(false)}>
        <DialogTitle>Ajouter une matière</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Matière</InputLabel>
            <Select
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
              label="Matière"
            >
              {(Array.isArray(subjects) ? subjects : [])
                .filter(subject => !bulletin.bulletin_lines?.some(line => line.subject_id === subject.id))
                .map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddSubjectDialog(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddSubject} 
            variant="contained"
            disabled={!newSubjectId}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB de sauvegarde flottant */}
      {hasChanges && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleSave}
          disabled={saving}
        >
          <Save />
        </Fab>
      )}

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

export default BulletinEdit; 