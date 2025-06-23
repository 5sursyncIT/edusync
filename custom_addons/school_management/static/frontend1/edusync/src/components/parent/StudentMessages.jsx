import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Divider,
  Fade,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import {
  Message as MessageIcon,
  Send as SendIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Reply as ReplyIcon,
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Attachment as AttachmentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const StudentMessages = ({ selectedChild }) => {
  const darkBlue = '#00008B';
  const [messages, setMessages] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Reçus, 1: Envoyés
  const [filterTeacher, setFilterTeacher] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // État pour composer un message
  const [newMessage, setNewMessage] = useState({
    teacher_id: '',
    subject: '',
    content: '',
    priority: 'normal'
  });

  useEffect(() => {
    if (selectedChild) {
      loadMessages();
      loadTeachers();
    }
  }, [selectedChild, activeTab]);

  const loadMessages = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError('');

    try {
      const params = {
        type: activeTab === 0 ? 'received' : 'sent',
        teacher_id: filterTeacher || undefined,
        search: searchTerm || undefined
      };

      const response = await parentAPI.getStudentMessages(selectedChild.id, params);
      
      if (response.status === 'success') {
        setMessages(response.data.messages || []);
      } else {
        setError(response.message || 'Erreur lors du chargement des messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur messages:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service de messagerie non disponible. Veuillez contacter l\'administration.');
      } else {
        setError('Erreur de connexion');
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    if (!selectedChild) return;

    try {
      const response = await parentAPI.getStudentTeachers(selectedChild.id);
      
      if (response.status === 'success') {
        setTeachers(response.data.teachers || []);
      }
    } catch (error) {
      console.error('Erreur enseignants:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.teacher_id || !newMessage.subject || !newMessage.content) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await parentAPI.sendMessage(selectedChild.id, newMessage);
      
      if (response.status === 'success') {
        setComposeOpen(false);
        setNewMessage({ teacher_id: '', subject: '', content: '', priority: 'normal' });
        loadMessages(); // Recharger les messages
        setError(''); // Effacer les erreurs précédentes
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur envoi:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service de messagerie non disponible. Impossible d\'envoyer le message.');
      } else {
        setError('Erreur de connexion');
      }
    }
  };

  const handleMarkAsRead = async (messageId) => {
    // Logique pour marquer comme lu
    console.log('Marquer comme lu:', messageId);
  };

  const handleStarMessage = async (messageId) => {
    // Logique pour mettre en favoris
    console.log('Mettre en favoris:', messageId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#10b981';
      case 'low': return '#6b7280';
      default: return '#10b981';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevée';
      case 'normal': return 'Normale';
      case 'low': return 'Faible';
      default: return 'Normale';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Aujourd\'hui';
    } else if (diffDays === 2) {
      return 'Hier';
    } else if (diffDays <= 7) {
      return `Il y a ${diffDays - 1} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeacher = !filterTeacher || message.teacher_id === parseInt(filterTeacher);
    
    return matchesSearch && matchesTeacher;
  });

  if (!selectedChild) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un enfant pour voir ses messages
        </Typography>
      </Paper>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" color={darkBlue}>
            Messages - {selectedChild.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setComposeOpen(true)}
            sx={{ bgcolor: darkBlue }}
          >
            Nouveau Message
          </Button>
        </Stack>

        {/* Onglets et filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                >
                  <Tab 
                    label="Messages Reçus" 
                    icon={<InboxIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Messages Envoyés" 
                    icon={<OutboxIcon />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrer par enseignant</InputLabel>
                  <Select
                    value={filterTeacher}
                    onChange={(e) => setFilterTeacher(e.target.value)}
                    label="Filtrer par enseignant"
                  >
                    <MenuItem value="">Tous les enseignants</MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Messages d'erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Chargement */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Liste des messages */}
        {!loading && (
          <Card>
            <CardContent sx={{ p: 0 }}>
              {filteredMessages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <MessageIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun message trouvé
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTab === 0 ? 'Aucun message reçu' : 'Aucun message envoyé'}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {filteredMessages.map((message, index) => (
                    <React.Fragment key={message.id}>
                      <ListItem
                        sx={{
                          py: 2,
                          px: 3,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          bgcolor: message.is_read ? 'transparent' : 'rgba(0, 0, 139, 0.02)',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 139, 0.04)',
                            transform: 'translateX(4px)'
                          }
                        }}
                        onClick={() => {
                          setSelectedMessage(message);
                          setDialogOpen(true);
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: darkBlue }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2" fontWeight={message.is_read ? 'normal' : 'bold'}>
                                {activeTab === 0 ? message.sender_name : message.recipient_name}
                              </Typography>
                              <Chip
                                label={getPriorityText(message.priority)}
                                size="small"
                                sx={{
                                  bgcolor: `${getPriorityColor(message.priority)}20`,
                                  color: getPriorityColor(message.priority),
                                  height: 20,
                                  fontSize: '0.7rem'
                                }}
                              />
                              {!message.is_read && activeTab === 0 && (
                                <Chip label="Nouveau" size="small" color="primary" />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" fontWeight={message.is_read ? 'normal' : 'medium'}>
                                {message.subject}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {message.content.substring(0, 100)}...
                              </Typography>
                            </Box>
                          }
                        />
                        <Stack alignItems="flex-end" spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(message.created_at)}
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title={message.is_starred ? "Retirer des favoris" : "Ajouter aux favoris"}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStarMessage(message.id);
                                }}
                              >
                                {message.is_starred ? (
                                  <StarIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                                ) : (
                                  <StarBorderIcon sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                            {activeTab === 0 && (
                              <Tooltip title={message.is_read ? "Marquer comme non lu" : "Marquer comme lu"}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(message.id);
                                  }}
                                >
                                  {message.is_read ? (
                                    <UnreadIcon sx={{ fontSize: 18 }} />
                                  ) : (
                                    <ReadIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Stack>
                      </ListItem>
                      {index < filteredMessages.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de lecture de message */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                {selectedMessage?.subject}
              </Typography>
              <Chip
                label={getPriorityText(selectedMessage?.priority)}
                size="small"
                sx={{
                  bgcolor: `${getPriorityColor(selectedMessage?.priority)}20`,
                  color: getPriorityColor(selectedMessage?.priority)
                }}
              />
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedMessage && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: darkBlue }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {activeTab === 0 ? selectedMessage.sender_name : selectedMessage.recipient_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(selectedMessage.created_at)} • {selectedMessage.created_at}
                    </Typography>
                  </Box>
                </Stack>
                
                <Typography variant="body1" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.content}
                </Typography>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pièces jointes:
                    </Typography>
                    {selectedMessage.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        icon={<AttachmentIcon />}
                        label={attachment.name}
                        onClick={() => window.open(attachment.url)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Fermer
            </Button>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<ReplyIcon />}
                onClick={() => {
                  setDialogOpen(false);
                  setNewMessage({
                    teacher_id: selectedMessage?.sender_id || '',
                    subject: `Re: ${selectedMessage?.subject}`,
                    content: '',
                    priority: 'normal'
                  });
                  setComposeOpen(true);
                }}
                sx={{ bgcolor: darkBlue }}
              >
                Répondre
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog de composition */}
        <Dialog
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Nouveau Message
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Destinataire *</InputLabel>
                <Select
                  value={newMessage.teacher_id}
                  onChange={(e) => setNewMessage({...newMessage, teacher_id: e.target.value})}
                  label="Destinataire *"
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: darkBlue }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{teacher.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {teacher.subject}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Sujet *"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
              />

              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={newMessage.priority}
                  onChange={(e) => setNewMessage({...newMessage, priority: e.target.value})}
                  label="Priorité"
                >
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="normal">Normale</MenuItem>
                  <MenuItem value="high">Élevée</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Message *"
                multiline
                rows={6}
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="Tapez votre message ici..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setComposeOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSendMessage}
              sx={{ bgcolor: darkBlue }}
            >
              Envoyer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default StudentMessages; 