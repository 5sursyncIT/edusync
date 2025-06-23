import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, Chip, 
  CircularProgress, Alert, Tabs, Tab, Card, CardContent,
  Avatar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Stack,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Snackbar
} from '@mui/material';
import { 
  FileText, Calculator, Users, BookOpen, User, Plus, 
  Play, Square, CheckCircle, X, Edit, Eye, Trash2,
  Download, Share, Archive, Filter
} from 'lucide-react';
import {
  Visibility, Edit as EditIcon, Delete as DeleteIcon,
  GetApp as DownloadIcon, Add as AddIcon, Add, GetApp
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';
import { useNavigate } from 'react-router-dom';

const BulletinManager = () => {
  const { api } = useOdoo();
  const [currentView, setCurrentView] = useState('list');
  const [selectedBulletinId, setSelectedBulletinId] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [filteredBulletins, setFilteredBulletins] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    calculated: 0,
    validated: 0,
    published: 0,
    avg_general: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    state: '',
    trimestre: '',
    batch: '',
    search: ''
  });
  const [trimestres, setTrimestres] = useState([]);
  const [batches, setBatches] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bulletins, filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Charger les données de référence et les bulletins
      const [bulletinsRes, statsRes, trimestresRes, batchesRes] = await Promise.all([
        api.getBulletins(),
        api.getBulletinStats(),
        api.getTrimestres(),
        api.getAllBatches()
      ]);
      
      console.log('Réponses API bulletins:', { bulletinsRes, statsRes });
      
      // Traitement des bulletins
      let bulletinsList = [];
      if (bulletinsRes && bulletinsRes.success && Array.isArray(bulletinsRes.data)) {
        bulletinsList = bulletinsRes.data;
      } else if (bulletinsRes && Array.isArray(bulletinsRes.data)) {
        bulletinsList = bulletinsRes.data;
      }
      
      // Formatage des bulletins pour l'affichage
      const formattedBulletins = bulletinsList.map(bulletin => ({
        id: bulletin.id,
        name: bulletin.numero || `Bulletin ${bulletin.id}`,
        numero: bulletin.numero,
        student: { 
          name: bulletin.student_name || 'Étudiant inconnu',
          id: bulletin.student_id 
        },
        trimestre: { 
          name: bulletin.trimestre_name || 'Trimestre non défini',
          id: bulletin.trimestre_id 
        },
        batch: { 
          name: bulletin.batch_name || 'Classe non définie',
          id: bulletin.batch_id 
        },
        moyenne_generale: bulletin.moyenne_generale || 0,
        rang: bulletin.rang_classe || null,
        state: bulletin.state || 'draft',
        date_creation: bulletin.date_creation,
        date_edition: bulletin.date_edition,
        appreciation_generale: bulletin.appreciation_generale,
        total_eleves_classe: bulletin.total_eleves_classe
      }));
      
      console.log('Bulletins formatés:', formattedBulletins);
      console.log('États des bulletins:', formattedBulletins.map(b => ({ id: b.id, state: b.state })));
      
      setBulletins(formattedBulletins);
      
      // Charger les données de référence pour les filtres
      if (trimestresRes && trimestresRes.success) {
        setTrimestres(trimestresRes.data);
      }
      if (batchesRes && batchesRes.success) {
        setBatches(batchesRes.data);
      }
      
      // Traitement des statistiques
      let calculatedStats = {
        total_bulletins: formattedBulletins.length,
        published: 0,
        pending: 0,
        avg_general: 0
      };
      
      if (statsRes && statsRes.success && statsRes.data) {
        // Utiliser les stats du backend si disponibles
        calculatedStats = {
          total_bulletins: statsRes.data.total_bulletins || formattedBulletins.length,
          published: statsRes.data.published || statsRes.data.bulletins_by_state?.publie || 0,
          pending: statsRes.data.pending || 
                   (statsRes.data.bulletins_by_state?.brouillon || 0) + 
                   (statsRes.data.bulletins_by_state?.calcule || 0),
          avg_general: statsRes.data.avg_general || statsRes.data.average_generale || 0
        };
      } else {
        // Calculer les stats côté client si l'API n'est pas disponible
        const stateCount = {};
        let totalMoyenne = 0;
        let bulletinsWithMoyenne = 0;
        
        formattedBulletins.forEach(bulletin => {
          const state = bulletin.state;
          stateCount[state] = (stateCount[state] || 0) + 1;
          
          if (bulletin.moyenne_generale && bulletin.moyenne_generale > 0) {
            totalMoyenne += bulletin.moyenne_generale;
            bulletinsWithMoyenne++;
          }
        });
        
        calculatedStats = {
          total_bulletins: formattedBulletins.length,
          published: (stateCount.published || 0) + (stateCount.publie || 0),
          pending: (stateCount.draft || 0) + (stateCount.brouillon || 0) + 
                   (stateCount.calculated || 0) + (stateCount.calcule || 0),
          avg_general: bulletinsWithMoyenne > 0 ? totalMoyenne / bulletinsWithMoyenne : 0
        };
      }
      
      setStats(calculatedStats);
      
    } catch (err) {
      console.error('Erreur chargement bulletins:', err);
      setError(err.message || 'Erreur lors du chargement des bulletins');
      
      // En cas d'erreur, afficher des données vides plutôt que de planter
      setBulletins([]);
      setStats({
        total_bulletins: 0,
        published: 0,
        pending: 0,
        avg_general: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBulletinsData = async () => {
    // Alias pour la compatibilité avec le code existant
    await loadInitialData();
  };

  const applyFilters = () => {
    let filtered = [...bulletins];

    // Filtre par état
    if (filters.state) {
      filtered = filtered.filter(bulletin => bulletin.state === filters.state);
    }

    // Filtre par trimestre
    if (filters.trimestre) {
      filtered = filtered.filter(bulletin => bulletin.trimestre.id == filters.trimestre);
    }

    // Filtre par classe
    if (filters.batch) {
      filtered = filtered.filter(bulletin => bulletin.batch.id == filters.batch);
    }

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(bulletin => 
        bulletin.student.name.toLowerCase().includes(searchLower) ||
        bulletin.numero?.toLowerCase().includes(searchLower) ||
        bulletin.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBulletins(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      state: '',
      trimestre: '',
      batch: '',
      search: ''
    });
  };

  const handleViewChange = (view, bulletinId = null) => {
    console.log(`Changement de vue vers: ${view}, ID: ${bulletinId}`);
    
    // Pour l'instant, afficher juste un message
    switch (view) {
      case 'detail':
        setSuccessMessage(`Détails du bulletin ${bulletinId} - Vue en développement`);
        break;
      case 'edit':
        setSuccessMessage(`Édition du bulletin ${bulletinId} - Vue en développement`);
        break;
      case 'grades':
        setSuccessMessage(`Gestion des notes du bulletin ${bulletinId} - Vue en développement`);
        break;
      case 'create':
        setSuccessMessage('Création d\'un nouveau bulletin - Vue en développement');
        break;
      default:
        setCurrentView(view);
        setSelectedBulletinId(bulletinId);
    }
  };

  const handleBulletinAction = async (action, bulletinId) => {
    try {
      console.log(`Action "${action}" demandée pour bulletin ${bulletinId}`);
      
      setLoading(true);
      setError(null);
      let result;
      
      switch (action) {
        case 'calculate':
          console.log('Tentative de calcul...');
          result = await api.calculateBulletin(bulletinId);
          console.log('Résultat calcul:', result);
          break;
        case 'validate':
          console.log('Tentative de validation...');
          result = await api.validateBulletin(bulletinId);
          console.log('Résultat validation:', result);
          break;
        case 'publish':
          console.log('Tentative de publication...');
          result = await api.publishBulletin(bulletinId);
          console.log('Résultat publication:', result);
          break;
        case 'archive':
          console.log('Tentative d\'archivage...');
          result = await api.archiveBulletin(bulletinId);
          console.log('Résultat archivage:', result);
          break;
        default:
          throw new Error(`Action non reconnue: ${action}`);
      }
      
      if (result && result.success) {
        // Afficher le message de succès
        setSuccessMessage(result.message || `Action ${action} effectuée avec succès !`);
        // Recharger les données après l'action
        await loadBulletinsData();
      } else {
        throw new Error(result?.message || `Erreur lors de l'action ${action}`);
      }
      
    } catch (err) {
      console.error(`Erreur action ${action}:`, err);
      setError(`Erreur lors de l'action ${action}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bulletinId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bulletin ?')) {
      try {
        setLoading(true);
        setError(null);
        const result = await api.deleteBulletin(bulletinId);
        
        if (result.success) {
          // Recharger les données après suppression
          await loadBulletinsData();
          setSuccessMessage('Bulletin supprimé avec succès !');
        } else {
          throw new Error(result.message || 'Erreur lors de la suppression');
        }
        
      } catch (err) {
        console.error('Erreur suppression:', err);
        setError(`Erreur lors de la suppression: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadPDF = async (bulletinId) => {
    try {
      const response = await api.getBulletinPDF(bulletinId);
      // Gérer le téléchargement du PDF ici
      setSuccessMessage('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError('Erreur lors de la génération du PDF');
    }
  };

  // Fonction pour la génération en lot
  const handleGenerateBatch = () => {
    navigate('/bulletins/batch-generation');
  };

  const getStateBadge = (state) => {
    const config = {
      draft: { color: 'default', label: 'Brouillon' },
      brouillon: { color: 'default', label: 'Brouillon' },
      calculated: { color: 'info', label: 'Calculé' },
      calcule: { color: 'info', label: 'Calculé' },
      validated: { color: 'warning', label: 'Validé' },
      valide: { color: 'warning', label: 'Validé' },
      published: { color: 'success', label: 'Publié' },
      publie: { color: 'success', label: 'Publié' },
      archived: { color: 'secondary', label: 'Archivé' },
      archive: { color: 'secondary', label: 'Archivé' }
    };
    
    const { color, label } = config[state] || config.draft;
    return <Chip label={label} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText color="primary" />
              Gestion des Bulletins
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Gérez les bulletins scolaires
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/bulletins/create')}
              size="large"
            >
              Nouveau bulletin
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleGenerateBatch}
            >
              Génération en lot
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Section de filtrage */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Filter size={20} />
          Filtres
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Rechercher"
              placeholder="Nom d'élève, numéro..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>État</InputLabel>
              <Select
                value={filters.state}
                label="État"
                onChange={(e) => handleFilterChange('state', e.target.value)}
              >
                <MenuItem value="">Tous les états</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="brouillon">Brouillon</MenuItem>
                <MenuItem value="calculated">Calculé</MenuItem>
                <MenuItem value="calcule">Calculé</MenuItem>
                <MenuItem value="validated">Validé</MenuItem>
                <MenuItem value="valide">Validé</MenuItem>
                <MenuItem value="published">Publié</MenuItem>
                <MenuItem value="publie">Publié</MenuItem>
                <MenuItem value="archived">Archivé</MenuItem>
                <MenuItem value="archive">Archivé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Trimestre</InputLabel>
              <Select
                value={filters.trimestre}
                label="Trimestre"
                onChange={(e) => handleFilterChange('trimestre', e.target.value)}
              >
                <MenuItem value="">Tous les trimestres</MenuItem>
                {trimestres.map((trimestre) => (
                  <MenuItem key={trimestre.id} value={trimestre.id}>
                    {trimestre.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Classe</InputLabel>
              <Select
                value={filters.batch}
                label="Classe"
                onChange={(e) => handleFilterChange('batch', e.target.value)}
              >
                <MenuItem value="">Toutes les classes</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              size="small"
              fullWidth
            >
              Effacer
            </Button>
          </Grid>
        </Grid>
        
        {/* Indicateur de filtrage */}
        {(filters.search || filters.state || filters.trimestre || filters.batch) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              {filteredBulletins.length} bulletin(s) trouvé(s) sur {bulletins.length} total
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Statistiques rapides */}
      {stats && Object.keys(stats).length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <FileText />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {stats.total_bulletins || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Bulletins totaux
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {stats.published || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Publiés
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Calculator />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {stats.pending || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      En attente
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Users />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {stats.avg_general ? `${stats.avg_general.toFixed(2)}/20` : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Moyenne générale
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Liste des bulletins */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Bulletin
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Étudiant
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Trimestre
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Classe
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Moyenne
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  État
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBulletins.map((bulletin) => (
                <TableRow key={bulletin.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.100' }}>
                        <FileText size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {bulletin.name || `Bulletin ${bulletin.id}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {bulletin.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {bulletin.student?.name || 'Non défini'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {bulletin.trimestre?.name || 'Non défini'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {bulletin.batch?.name || 'Non définie'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" color={
                        bulletin.moyenne_generale >= 16 ? 'success.main' :
                        bulletin.moyenne_generale >= 14 ? 'info.main' :
                        bulletin.moyenne_generale >= 12 ? 'warning.main' :
                        bulletin.moyenne_generale >= 10 ? 'text.primary' : 'error.main'
                      }>
                        {bulletin.moyenne_generale ? `${bulletin.moyenne_generale.toFixed(2)}/20` : 'N/A'}
                      </Typography>
                      {bulletin.rang && bulletin.total_eleves_classe && (
                        <Typography variant="caption" color="textSecondary">
                          Rang: {bulletin.rang}/{bulletin.total_eleves_classe}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStateBadge(bulletin.state)}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Voir les détails">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/bulletins/${bulletin.id}`)}
                          sx={{ mr: 1 }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {['draft', 'calculated'].includes(bulletin.state) && (
                        <Tooltip title="Éditer">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/bulletins/${bulletin.id}/edit`)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {(bulletin.state === 'validated' || bulletin.state === 'valide') && (
                        <Tooltip title="Publier">
                          <IconButton
                            size="small"
                            onClick={() => handleBulletinAction('publish', bulletin.id)}
                            color="success"
                          >
                            <Share fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {(bulletin.state === 'published' || bulletin.state === 'publie') && (
                        <>
                          <Tooltip title="Télécharger PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadPDF(bulletin.id)}
                              color="info"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Archiver">
                            <IconButton
                              size="small"
                              onClick={() => handleBulletinAction('archive', bulletin.id)}
                              color="secondary"
                            >
                              <Archive fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(bulletin.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredBulletins.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <FileText size={48} style={{ color: '#ccc', marginBottom: 16 }} />
            <Typography variant="h6" color="textSecondary">
              {bulletins.length === 0 ? 'Aucun bulletin trouvé' : 'Aucun bulletin ne correspond aux critères'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {bulletins.length === 0 
                ? 'Commencez par créer votre premier bulletin'
                : 'Essayez de modifier vos filtres ou d\'effacer la recherche'
              }
            </Typography>
            {bulletins.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/bulletins/create')}
                sx={{ mt: 2 }}
              >
                Créer un bulletin
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="textSecondary">
            Traitement en cours...
          </Typography>
        </Box>
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
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BulletinManager; 