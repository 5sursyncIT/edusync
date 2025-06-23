import React from 'react';
import { Box, Paper, Typography, Button, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useAttendanceStatistics } from '../../hooks/useAttendance';

const StatisticsTest = () => {
  const { data: statsData, loading, error, refetch } = useAttendanceStatistics({});

  console.log('🔍 StatisticsTest: statsData:', statsData);
  console.log('🔍 StatisticsTest: loading:', loading);
  console.log('🔍 StatisticsTest: error:', error);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des statistiques...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des statistiques: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test des Statistiques de Présence
      </Typography>
      
      <Button variant="contained" onClick={refetch} sx={{ mb: 3 }}>
        Actualiser les statistiques
      </Button>

      {/* Données brutes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Données brutes reçues
          </Typography>
          <Typography component="pre" sx={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(statsData, null, 2)}
          </Typography>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      {statsData && statsData.global_statistics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              ✅ Statistiques globales trouvées
            </Typography>
            <Typography>Total records: {statsData.global_statistics.total_records}</Typography>
            <Typography>Présents: {statsData.global_statistics.present_count}</Typography>
            <Typography>Absents: {statsData.global_statistics.absent_count}</Typography>
            <Typography>Taux de présence: {Math.round(statsData.global_statistics.attendance_rate)}%</Typography>
          </CardContent>
        </Card>
      )}

      {/* Statistiques par date */}
      {statsData && statsData.by_date && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistiques par date
            </Typography>
            {Object.entries(statsData.by_date).map(([date, stats]) => (
              <Typography key={date}>
                {date}: {stats.present} présents, {stats.absent} absents (total: {stats.total})
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statistiques par promotion */}
      {statsData && statsData.by_batch && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistiques par promotion
            </Typography>
            {Object.entries(statsData.by_batch).map(([batch, stats]) => (
              <Typography key={batch}>
                {batch}: {stats.present} présents, {stats.absent} absents (total: {stats.total})
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}

      {!statsData && (
        <Alert severity="warning">
          Aucune donnée de statistiques disponible
        </Alert>
      )}
    </Box>
  );
};

export default StatisticsTest; 