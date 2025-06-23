import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Pagination,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AccountCircle as PortalIcon
} from '@mui/icons-material';
import { parentsApiService } from '../../services/parentsApi';

const ParentsManagement = () => {
  // États principaux
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États de pagination et filtres
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // États des dialogues
  const [openDialog, setOpenDialog] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    relationship_id: '',
    student_ids: []
  });

  // Chargement initial des données
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadParents();
  }, [page, searchTerm, filterStatus]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRelationships(),
        loadStudents(),
        loadStatistics()
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadParents = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 10
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await parentsApiService.parents.getParents(params);
      
      if (response.status === 'success') {
        setParents(response.data.parents || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des parents');
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des parents:', err);
      setError('Erreur lors du chargement des parents');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await parentsApiService.students.getStudents();
      if (response.status === 'success') {
        setStudents(response.data.students || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
    }
  };

  const loadRelationships = async () => {
    try {
      const response = await parentsApiService.parents.getParentRelationships();
      if (response.status === 'success') {
        setRelationships(response.data.relationships || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des relations:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await parentsApiService.parents.getParentsStatistics();
      if (response.status === 'success') {
        setStatistics(response.data || {});
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  const handleSaveParent = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.relationship_id) {
        setError('Le nom et le type de relation sont obligatoires');
        return;
      }

      const parentData = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        relationship_id: parseInt(formData.relationship_id),
        student_ids: formData.student_ids
      };

      let response;
      if (editingParent) {
        response = await parentsApiService.parents.updateParent(editingParent.id, parentData);
      } else {
        response = await parentsApiService.parents.createParent(parentData);
      }

      if (response.status === 'success') {
        setSuccess(editingParent ? 'Parent modifié avec succès' : 'Parent créé avec succès');
        handleCloseDialog();
        loadParents();
        loadStatistics();
      } else {
        throw new Error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde du parent');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParent = async (parentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce parent ?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await parentsApiService.parents.deleteParent(parentId);
      
      if (response.status === 'success') {
        setSuccess('Parent supprimé avec succès');
        loadParents();
        loadStatistics();
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression du parent');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortalUser = async (parentId) => {
    try {
      setLoading(true);
      const response = await parentsApiService.parents.createPortalUser(parentId);
      
      if (response.status === 'success') {
        setSuccess('Compte portal créé avec succès');
        loadParents();
      } else {
        throw new Error(response.message || 'Erreur lors de la création du compte portal');
      }
    } catch (err) {
      console.error('Erreur lors de la création du compte portal:', err);
      setError(err.message || 'Erreur lors de la création du compte portal');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (parent = null) => {
    if (parent) {
      setEditingParent(parent);
      setFormData({
        name: parent.name || '',
        email: parent.email || '',
        mobile: parent.mobile || '',
        relationship_id: parent.relationship_id || '',
        student_ids: parent.students?.map(s => s.id) || []
      });
    } else {
      setEditingParent(null);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        relationship_id: '',
        student_ids: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingParent(null);
    setSelectedTab(0);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRelationshipLabel = (relationshipId) => {
    const relationship = relationships.find(r => r.id === relationshipId);
    return relationship ? relationship.name : 'Non défini';
  };

  const getRelationshipColor = (relationship) => {
    const colors = {
      'Father': 'primary',
      'Mother': 'secondary',
      'Guardian': 'warning',
      'Père': 'primary',
      'Mère': 'secondary',
      'Tuteur': 'warning'
    };
    return colors[relationship] || 'default';
  };

  // Rendu des statistiques
  const renderStatistics = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{statistics.total_parents || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Parents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{statistics.parents_with_email || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Avec Email
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{statistics.parents_with_mobile || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Avec Téléphone
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PortalIcon sx={{ color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{statistics.parents_with_portal || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Accès Portal
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Rendu de la barre d'outils
  const renderToolbar = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" component="h1">
        Gestion des Parents
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Parent
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadParents}
        >
          Actualiser
        </Button>
      </Box>
    </Box>
  );

  // Rendu du tableau des parents
  const renderParentsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Relation</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Enfants</TableCell>
            <TableCell>Accès Portal</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parents.map((parent) => (
            <TableRow key={parent.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>
                    {parent.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{parent.name}</Typography>
                    {parent.email && (
                      <Typography variant="caption" color="text.secondary">
                        {parent.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={parent.relationship || 'Non défini'}
                  color={getRelationshipColor(parent.relationship)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box>
                  {parent.mobile && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                      {parent.mobile}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={`${parent.students?.length || 0} enfant(s)`}
                  variant="outlined"
                  size="small"
                />
                {parent.students && parent.students.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {parent.students.slice(0, 2).map((student, index) => (
                      <Typography key={index} variant="caption" display="block" color="text.secondary">
                        {student.name}
                      </Typography>
                    ))}
                    {parent.students.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{parent.students.length - 2} autre(s)
                      </Typography>
                    )}
                  </Box>
                )}
              </TableCell>
              <TableCell>
                {parent.has_portal_access ? (
                  <Chip label="Activé" color="success" size="small" />
                ) : (
                  <Tooltip title="Créer un compte portal">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PortalIcon />}
                      onClick={() => handleCreatePortalUser(parent.id)}
                    >
                      Créer
                    </Button>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Modifier">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(parent)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteParent(parent.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {parents.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucun parent trouvé
          </Typography>
        </Box>
      )}
    </TableContainer>
  );

  // Rendu du dialogue de création/modification
  const renderDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingParent ? 'Modifier le Parent' : 'Nouveau Parent'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Informations générales" />
            <Tab label="Enfants associés" />
          </Tabs>
          
          {selectedTab === 0 && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom complet"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type de relation</InputLabel>
                    <Select
                      value={formData.relationship_id}
                      onChange={(e) => handleInputChange('relationship_id', e.target.value)}
                    >
                      {relationships.map((relationship) => (
                        <MenuItem key={relationship.id} value={relationship.id}>
                          {relationship.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone mobile"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {selectedTab === 1 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Enfants associés
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Sélectionner les enfants</InputLabel>
                <Select
                  multiple
                  value={formData.student_ids}
                  onChange={(e) => handleInputChange('student_ids', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const student = students.find(s => s.id === value);
                        return (
                          <Chip key={value} label={student?.name || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Annuler</Button>
        <Button
          onClick={handleSaveParent}
          variant="contained"
          disabled={!formData.name || !formData.relationship_id}
        >
          {editingParent ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      {renderToolbar()}
      {renderStatistics()}
      
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {renderParentsTable()}
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {renderDialog()}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParentsManagement; 