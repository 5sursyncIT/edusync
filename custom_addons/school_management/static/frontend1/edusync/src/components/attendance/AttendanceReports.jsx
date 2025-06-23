import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, Tabs, Tab, TextField, MenuItem, IconButton,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert, Skeleton, Collapse, Divider
} from '@mui/material';
import {
  Description, Download, FilterList, CalendarToday, People, Book,
  TrendingUp, TrendingDown, BarChart, PieChart, Assignment,
  ExpandMore, ExpandLess, Refresh
} from '@mui/icons-material';
import { 
  useAttendanceReports, 
  useAttendanceExport 
} from '../../hooks/useAttendance';
import { useBatches, useAllSubjects } from '../../hooks/useOdoo';

const AttendanceReports = () => {
  // États locaux
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    batch_id: '',
    subject_id: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const { 
    data: reportData, 
    loading: reportLoading, 
    error: reportError, 
    updateFilters 
  } = useAttendanceReports(['summary', 'by_student', 'by_subject', 'detailed'][activeTab], filters);
  
  const { exportAttendances, loading: exportLoading } = useAttendanceExport();
  const { data: batchesData } = useBatches();
  const { data: subjectsData } = useAllSubjects();

  // Données formatées
  const batches = batchesData?.batches || [];
  const subjects = subjectsData || [];

  // Gestionnaires d'événements
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (filterName) => (event) => {
    const value = event.target.value;
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handleExport = async (format = 'csv') => {
    try {
      await exportAttendances(format, filters);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const resetFilters = () => {
    const emptyFilters = {
      date_from: '',
      date_to: '',
      batch_id: '',
      subject_id: ''
    };
    setFilters(emptyFilters);
    updateFilters(emptyFilters);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Rendu du rapport de synthèse
  const SummaryReport = () => {
    if (!reportData?.summary) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune donnée disponible
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Veuillez ajuster vos filtres pour afficher les données
          </Typography>
        </Box>
      );
    }

    const { summary, period } = reportData;

    return (
      <Box sx={{ space: 3 }}>
        {/* Période du rapport */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center">
            <CalendarToday sx={{ mr: 1 }} />
            <Typography variant="body2">
              Période: {period?.date_from ? 
                `Du ${formatDate(period.date_from)} au ${formatDate(period.date_to)}` : 
                'Toute la période'
              }
            </Typography>
          </Box>
        </Alert>

        {/* Statistiques principales */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CalendarToday sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {summary.total_sessions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {summary.unique_students || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Étudiants uniques
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Description sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {summary.total_records || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total enregistrements
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="600">
                  {summary.attendance_rate ? `${Math.round(summary.attendance_rate)}%` : '0%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux de présence
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Graphiques et détails supplémentaires */}
        {summary.by_batch && summary.by_batch.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Présence par promotion
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Promotion</TableCell>
                      <TableCell align="right">Présents</TableCell>
                      <TableCell align="right">Absents</TableCell>
                      <TableCell align="right">Taux</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.by_batch.map((batch, index) => (
                      <TableRow key={index}>
                        <TableCell>{batch.batch_name}</TableCell>
                        <TableCell align="right">{batch.present || 0}</TableCell>
                        <TableCell align="right">{batch.absent || 0}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${Math.round(batch.rate || 0)}%`}
                            color={batch.rate >= 80 ? 'success' : batch.rate >= 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  // Rendu du rapport par étudiant
  const StudentReport = () => {
    if (!reportData?.by_student) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune donnée d'étudiant disponible
          </Typography>
        </Box>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Rapport de présence par étudiant
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Promotion</TableCell>
                  <TableCell align="right">Présent</TableCell>
                  <TableCell align="right">Absent</TableCell>
                  <TableCell align="right">Taux</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.by_student.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>{student.batch_name}</TableCell>
                    <TableCell align="right">{student.present || 0}</TableCell>
                    <TableCell align="right">{student.absent || 0}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${Math.round(student.rate || 0)}%`}
                        color={student.rate >= 80 ? 'success' : student.rate >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Rendu du rapport par matière
  const SubjectReport = () => {
    if (!reportData?.by_subject) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Book sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune donnée de matière disponible
          </Typography>
        </Box>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Rapport de présence par matière
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Matière</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Présents</TableCell>
                  <TableCell align="right">Absents</TableCell>
                  <TableCell align="right">Taux</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.by_subject.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>{subject.subject_name}</TableCell>
                    <TableCell align="right">{subject.sessions || 0}</TableCell>
                    <TableCell align="right">{subject.present || 0}</TableCell>
                    <TableCell align="right">{subject.absent || 0}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${Math.round(subject.rate || 0)}%`}
                        color={subject.rate >= 80 ? 'success' : subject.rate >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Rendu du rapport détaillé
  const DetailedReport = () => {
    if (!reportData?.detailed) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune donnée détaillée disponible
          </Typography>
        </Box>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Rapport détaillé des présences
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Matière</TableCell>
                  <TableCell>Promotion</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Remarques</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.detailed.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.student_name}</TableCell>
                    <TableCell>{record.subject_name}</TableCell>
                    <TableCell>{record.batch_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.state === 'present' ? 'Présent' : 'Absent'}
                        color={record.state === 'present' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{record.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="600" gutterBottom>
          Rapports de présence
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consultez et analysez les données de présence des étudiants
        </Typography>
      </Box>

      {/* Actions et filtres */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Filtres et options
            </Typography>
            <Box>
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
                sx={{ ml: 1 }}
              >
                Exporter CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('excel')}
                disabled={exportLoading}
                sx={{ ml: 1 }}
              >
                Exporter Excel
              </Button>
            </Box>
          </Box>

          <Collapse in={showFilters}>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Date de début"
                  type="date"
                  value={filters.date_from}
                  onChange={handleFilterChange('date_from')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Date de fin"
                  type="date"
                  value={filters.date_to}
                  onChange={handleFilterChange('date_to')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Promotion"
                  value={filters.batch_id}
                  onChange={handleFilterChange('batch_id')}
                >
                  <MenuItem value="">Toutes les promotions</MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Matière"
                  value={filters.subject_id}
                  onChange={handleFilterChange('subject_id')}
                >
                  <MenuItem value="">Toutes les matières</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Box>
      </Paper>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="fullWidth"
        >
          <Tab 
            label="Synthèse" 
            icon={<Assignment />}
            iconPosition="start"
          />
          <Tab 
            label="Par Étudiant" 
            icon={<People />}
            iconPosition="start"
          />
          <Tab 
            label="Par Matière" 
            icon={<Book />}
            iconPosition="start"
          />
          <Tab 
            label="Détaillé" 
            icon={<Description />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenu */}
      {reportError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {reportError}
        </Alert>
      ) : reportLoading ? (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={200} sx={{ mb: 2 }} />
          ))}
        </Box>
      ) : (
        <Box>
          {activeTab === 0 && <SummaryReport />}
          {activeTab === 1 && <StudentReport />}
          {activeTab === 2 && <SubjectReport />}
          {activeTab === 3 && <DetailedReport />}
        </Box>
      )}
    </Box>
  );
};

export default AttendanceReports;