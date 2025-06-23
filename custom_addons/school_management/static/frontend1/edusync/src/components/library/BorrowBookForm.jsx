import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Autocomplete,
  Alert,
  CircularProgress,
  Fade,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  BookOpen, 
  User, 
  Calendar, 
  Save, 
  AlertCircle, 
  Search,
  X,
  Clock
} from 'lucide-react';
import { useLibrary } from '../../hooks/useLibrary';

const BorrowBookForm = ({ bookId, onClose, onSuccess }) => {
  const { getBooks, borrowBook } = useLibrary();
  const [availableBooks, setAvailableBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    book_id: bookId || '',
    student: '',
    student_id: '',
    return_date: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    // Si aucun livre n'est présélectionné, charger les livres disponibles
    if (!bookId) {
      loadAvailableBooks();
    }

    // Charger les étudiants
    loadStudents();

    // Définir une date de retour par défaut (2 semaines)
    const defaultReturnDate = new Date();
    defaultReturnDate.setDate(defaultReturnDate.getDate() + 14);
    setFormData(prev => ({
      ...prev,
      return_date: defaultReturnDate.toISOString().split('T')[0]
    }));
  }, [bookId]);

  const loadAvailableBooks = async () => {
    setLoadingBooks(true);
    try {
      const response = await getBooks({ state: 'available', limit: 100 });
      if (response.status === 'success') {
        setAvailableBooks(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livres:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch('http://172.16.209.128:8069/api/students?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        // Adapter la structure de données de l'API
        const studentsData = data.data.students || [];
        const formattedStudents = studentsData.map(student => ({
          id: student.id,
          name: student.name || 'Nom non défini',
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          email: student.email || '',
          phone: student.phone || student.mobile || '',
          gender: student.gender || '',
          birth_date: student.birth_date || '',
          // Créer un numéro d'étudiant basé sur l'ID si pas disponible
          roll_number: student.roll_number || `ETU${String(student.id).padStart(3, '0')}`,
          // Ajouter une classe/cours basé sur l'âge si pas disponible
          course: student.course || (student.birth_date ? getClassFromBirthDate(student.birth_date) : 'Non défini')
        }));
        setStudents(formattedStudents);
        console.log(`✅ ${formattedStudents.length} étudiants chargés depuis l'API`);
      } else {
        console.error('Erreur API étudiants:', data.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fonction utilitaire pour déterminer la classe basée sur l'âge
  const getClassFromBirthDate = (birthDate) => {
    if (!birthDate) return 'Non défini';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    
    if (age <= 6) return 'Maternelle';
    if (age <= 11) return 'Primaire';
    if (age <= 15) return 'Collège';
    if (age <= 18) return 'Lycée';
    return 'Supérieur';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Nettoyer l'erreur du champ modifié
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStudentChange = (event, newValue) => {
    if (newValue) {
    setFormData(prev => ({
      ...prev,
        student: newValue.name,
        student_id: newValue.id
      }));
      
      if (formErrors.student) {
        setFormErrors(prev => ({
          ...prev,
          student: ''
        }));
      }
    } else {
    setFormData(prev => ({
      ...prev,
        student: '',
        student_id: ''
    }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.book_id) {
      errors.book_id = 'Veuillez sélectionner un livre';
    }

    if (!formData.student.trim()) {
      errors.student = 'Veuillez sélectionner un étudiant';
    }

    if (!formData.return_date) {
      errors.return_date = 'Veuillez sélectionner une date de retour';
    } else {
      const returnDate = new Date(formData.return_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (returnDate <= today) {
        errors.return_date = 'La date de retour doit être postérieure à aujourd\'hui';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await borrowBook({
        book_id: parseInt(formData.book_id),
        student: formData.student.trim(),
        return_date: formData.return_date
      });
      
      if (response.status === 'success') {
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        setFormErrors({ submit: response.message || 'Erreur lors de l\'enregistrement de l\'emprunt' });
      }
    } catch (error) {
      setFormErrors({ submit: 'Erreur de connexion' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBook = availableBooks.find(book => book.id === parseInt(formData.book_id));

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
          <BookOpen className="w-6 h-6" />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            Nouvel Emprunt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enregistrer un nouvel emprunt de livre
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Fade in={true} timeout={500}>
          <Box component="form" onSubmit={handleSubmit}>
          {/* Erreur générale */}
          {formErrors.submit && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<AlertCircle className="w-5 h-5" />}
              >
                {formErrors.submit}
              </Alert>
          )}

            <Grid container spacing={3}>
          {/* Sélection du livre */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, border: '1px solid #e3f2fd' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BookOpen className="w-5 h-5" />
                    Sélection du livre
                  </Typography>
                  
            {bookId ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Livre présélectionné
                    </Alert>
            ) : (
                    <FormControl fullWidth error={!!formErrors.book_id}>
                      <InputLabel>Choisir un livre *</InputLabel>
                      <Select
                  name="book_id"
                  value={formData.book_id}
                  onChange={handleInputChange}
                        label="Choisir un livre *"
                  disabled={loadingBooks}
                        sx={{ borderRadius: 2 }}
                      >
                        {loadingBooks ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 2 }} />
                            Chargement...
                          </MenuItem>
                        ) : (
                          availableBooks.map(book => (
                            <MenuItem key={book.id} value={book.id}>
                              <Box sx={{ width: '100%' }}>
                                <Typography variant="body1" fontWeight="bold">
                                  {book.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {book.available_copies} exemplaire{book.available_copies > 1 ? 's' : ''} disponible{book.available_copies > 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                {formErrors.book_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                          {formErrors.book_id}
                        </Typography>
                )}
                    </FormControl>
            )}

          {/* Détails du livre sélectionné */}
          {selectedBook && (
                    <Card sx={{ mt: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6" color="primary.dark" sx={{ mb: 1 }}>
                          {selectedBook.title}
                        </Typography>
              {selectedBook.authors && selectedBook.authors.length > 0 && (
                          <Typography variant="body2" color="primary.dark" sx={{ mb: 1 }}>
                  Par: {selectedBook.authors.map(a => a.name).join(', ')}
                          </Typography>
              )}
                        <Chip 
                          label={`${selectedBook.available_copies} exemplaire${selectedBook.available_copies > 1 ? 's' : ''} disponible${selectedBook.available_copies > 1 ? 's' : ''}`}
                          color="primary"
                          size="small"
                        />
                      </CardContent>
                    </Card>
          )}
                </Paper>
              </Grid>

              {/* Sélection de l'étudiant */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, border: '1px solid #e3f2fd' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <User className="w-5 h-5" />
                    Sélection de l'étudiant
                  </Typography>
                  
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => option.name}
                    loading={loadingStudents}
                    onChange={handleStudentChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Rechercher un étudiant *"
                        placeholder="Commencez à taper le nom..."
                        error={!!formErrors.student}
                        helperText={formErrors.student || "Recherchez et sélectionnez un étudiant de l'établissement"}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <Search className="w-5 h-5 text-gray-400 mr-2" />,
                          endAdornment: (
                            <>
                              {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <ListItem key={key} {...otherProps}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: option.gender === 'f' ? 'pink.main' : 'blue.main',
                              color: 'white'
                            }}>
                              {option.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight="bold">
                                  {option.name}
                                </Typography>
                                {option.gender && (
                                  <Chip 
                                    label={option.gender === 'f' ? 'F' : 'M'} 
                                    size="small" 
                                    color={option.gender === 'f' ? 'secondary' : 'primary'}
                                    sx={{ minWidth: 30, height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  N° : {option.roll_number}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Niveau : {option.course}
                                </Typography>
                                {option.email && (
                                  <Typography variant="caption" display="block" color="primary.main">
                                    📧 {option.email}
                                  </Typography>
                                )}
                                {option.phone && (
                                  <Typography variant="caption" display="block" color="success.main">
                                    📱 {option.phone}
                                  </Typography>
            )}
                                {option.birth_date && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    🎂 {new Date(option.birth_date).toLocaleDateString('fr-FR')} 
                                    ({new Date().getFullYear() - new Date(option.birth_date).getFullYear()} ans)
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      );
                    }}
                    noOptionsText="Aucun étudiant trouvé"
                    loadingText="Chargement des étudiants..."
                  />
                </Paper>
              </Grid>

          {/* Date de retour */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, border: '1px solid #e3f2fd' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar className="w-5 h-5" />
                    Date de retour prévue
                  </Typography>
                  
                  <TextField
              type="date"
              name="return_date"
              value={formData.return_date}
              onChange={handleInputChange}
                    label="Date de retour prévue *"
                    fullWidth
                    error={!!formErrors.return_date}
                    helperText={formErrors.return_date || "Durée recommandée : 14 jours"}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: new Date(Date.now() + 86400000).toISOString().split('T')[0]
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <Clock className="w-4 h-4" />
                    <Typography variant="body2">
                      La date par défaut est fixée à 14 jours à partir d'aujourd'hui
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0', gap: 2 }}>
        <Button
              onClick={onClose}
          variant="outlined"
          size="large"
              disabled={submitting}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            px: 4
          }}
            >
              Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
              disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save className="w-5 h-5" />}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            px: 4,
            minWidth: 200
          }}
        >
          {submitting ? 'Enregistrement...' : 'Enregistrer l\'emprunt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BorrowBookForm; 