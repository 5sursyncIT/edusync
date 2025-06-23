import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AccountCircle as AccountCircleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonPin as PersonPinIcon,
  School as SchoolIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { parentsApiService } from '../../services/parentsApi';

const ParentsManagement = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États des données
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [relationships, setRelationships] = useState([]);
  
  // États de pagination
  const [parentsPage, setParentsPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [parentsTotal, setParentsTotal] = useState(0);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const limit = 10;
  
  // États de recherche
  const [parentsSearch, setParentsSearch] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');
  
  // États des modales
  const [parentDialog, setParentDialog] = useState({ open: false, parent: null, mode: 'create' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, parent: null });
  const [viewDialog, setViewDialog] = useState({ open: false, parent: null });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger les parents quand la page ou la recherche change
  useEffect(() => {
    if (activeTab === 0) {
      loadParents();
    }
  }, [parentsPage, parentsSearch, activeTab]);

  // Charger les étudiants quand la page ou la recherche change
  useEffect(() => {
    if (activeTab === 1) {
      loadStudents();
    }
  }, [studentsPage, studentsSearch, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStatistics(),
        loadRelationships(),
        loadParents(),
        loadStudents()
      ]);
    } catch (err) {
      setError('Erreur lors du chargement initial des données');
    } finally {
      setLoading(false);
    }
  };

  const loadParents = async () => {
    try {
      const response = await parentsApiService.parents.getParents({
        page: parentsPage,
        limit,
        search: parentsSearch
      });
      
      if (response.status === 'success') {
        setParents(response.data.parents);
        setParentsTotal(response.data.pagination.total);
      }
    } catch (err) {
      setError('Erreur lors du chargement des parents');
    }
  };

  const loadStudents = async () => {
    try {
      const response = await parentsApiService.students.getStudentsWithParents({
        page: studentsPage,
        limit,
        search: studentsSearch
      });
      
      if (response.status === 'success') {
        setStudents(response.data.students);
        setStudentsTotal(response.data.pagination.total);
      }
    } catch (err) {
      setError('Erreur lors du chargement des étudiants');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await parentsApiService.parents.getParentsStatistics();
      if (response.status === 'success') {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Erreur statistiques:', err);
    }
  };

  const loadRelationships = async () => {
    try {
      const response = await parentsApiService.parents.getParentRelationships();
      if (response.status === 'success') {
        setRelationships(response.data.relationships);
      }
    } catch (err) {
      console.error('Erreur relations:', err);
    }
  };

  const handleCreatePortalUser = async (parentId) => {
    try {
      setLoading(true);
      const response = await parentsApiService.parents.createPortalUser(parentId);
      
      if (response.status === 'success') {
        setSuccess('Compte portal créé avec succès');
        loadParents(); // Recharger pour mettre à jour le statut
      } else {
        setError(response.message || 'Erreur lors de la création du compte portal');
      }
    } catch (err) {
      setError('Erreur lors de la création du compte portal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParent = async () => {
    try {
      setLoading(true);
      const response = await parentsApiService.parents.deleteParent(deleteDialog.parent.id);
      
      if (response.status === 'success') {
        setSuccess('Parent supprimé avec succès');
        setDeleteDialog({ open: false, parent: null });
        loadParents();
        loadStatistics();
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du parent');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Composant des cartes de statistiques
  const StatisticsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
              <PeopleIcon />
            </Avatar>
            <Typography variant="h4" color="primary">
              {statistics.parents?.total || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Parents
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
              <VerifiedUserIcon />
            </Avatar>
            <Typography variant="h4" color="success.main">
              {statistics.parents?.with_portal || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avec Accès Portal
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
              <SchoolIcon />
            </Avatar>
            <Typography variant="h4" color="info.main">
              {statistics.students?.with_parents || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Étudiants avec Parents
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h4" color="warning.main">
              {statistics.students?.without_parents || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Étudiants sans Parents
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Composant du tableau des parents
  const ParentsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Liste des Parents</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={parentsSearch}
              onChange={(e) => setParentsSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadParents}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setParentDialog({ open: true, parent: null, mode: 'create' })}
            >
              Nouveau Parent
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Relation</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Étudiants</TableCell>
                <TableCell>Portal</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parents.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonPinIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {parent.name}
                        </Typography>
                        {parent.email && (
                          <Typography variant="caption" color="textSecondary">
                            {parent.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={parent.relationship}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {parent.mobile && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" />
                        <Typography variant="body2">{parent.mobile}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {parent.students.length} étudiant(s)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {parent.has_portal_access ? (
                      <Chip label="Actif" size="small" color="success" />
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleCreatePortalUser(parent.id)}
                        disabled={!parent.email}
                      >
                        Créer
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Voir détails">
                        <IconButton
                          size="small"
                          onClick={() => setViewDialog({ open: true, parent })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => setParentDialog({ open: true, parent, mode: 'edit' })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, parent })}
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
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(parentsTotal / limit)}
            page={parentsPage}
            onChange={(e, page) => setParentsPage(page)}
            color="primary"
          />
        </Box>
      </CardContent>
    </Card>
  );

  // Composant du tableau des étudiants
  const StudentsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Étudiants et leurs Parents</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Rechercher étudiant..."
              value={studentsSearch}
              onChange={(e) => setStudentsSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudents}
            >
              Actualiser
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Étudiant</TableCell>
                <TableCell>N° Inscription</TableCell>
                <TableCell>Parents</TableCell>
                <TableCell>Contacts</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <SchoolIcon />
                      </Avatar>
                      <Typography variant="body2" fontWeight="bold">
                        {student.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{student.gr_no || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    {student.parents && student.parents.length > 0 ? (
                      <Box>
                        {student.parents.map((parent, index) => (
                          <Chip
                            key={index}
                            label={`${parent.name} (${parent.relationship})`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Aucun parent
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.parent_phones && (
                      <Typography variant="body2">{student.parent_phones}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.has_parents ? (
                      <Chip label="Complet" size="small" color="success" />
                    ) : (
                      <Chip label="Incomplet" size="small" color="warning" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(studentsTotal / limit)}
            page={studentsPage}
            onChange={(e, page) => setStudentsPage(page)}
            color="primary"
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Parents
      </Typography>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Cartes de statistiques */}
      <StatisticsCards />

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Parents" />
          <Tab label="Étudiants & Parents" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && <ParentsTable />}
      {activeTab === 1 && <StudentsTable />}

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, parent: null })}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le parent "{deleteDialog.parent?.name}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, parent: null })}>
            Annuler
          </Button>
          <Button onClick={handleDeleteParent} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentsManagement; 