import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import diagnostics from '../../utils/diagnostics';

const DiagnosticPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🚀 Lancement du diagnostic...');
      const diagnosticResults = await diagnostics.runDiagnostic();
      setResults(diagnosticResults);
      
      if (!diagnosticResults.success) {
        setError('Certains tests ont échoué. Consultez les détails ci-dessous.');
      }
    } catch (err) {
      console.error('Erreur durant le diagnostic:', err);
      setError(`Erreur durant le diagnostic: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success) => {
    if (success) return <SuccessIcon color="success" />;
    return <ErrorIcon color="error" />;
  };

  const getStatusChip = (success) => {
    if (success) return <Chip label="Réussi" color="success" size="small" />;
    return <Chip label="Échec" color="error" size="small" />;
  };

  const formatResponseTime = (time) => {
    if (!time) return 'N/A';
    if (time < 100) return `${time}ms (Excellent)`;
    if (time < 500) return `${time}ms (Bon)`;
    if (time < 1000) return `${time}ms (Acceptable)`;
    return `${time}ms (Lent)`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Diagnostic de connectivité API
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Cet outil teste la connectivité entre votre application React et le serveur Odoo.
        Utilisez-le pour diagnostiquer les erreurs "NetworkError when attempting to fetch resource".
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
            onClick={runDiagnostic}
            disabled={loading}
            size="large"
          >
            {loading ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
          </Button>
          
          {results && (
            <Alert 
              severity={results.success ? 'success' : 'warning'}
              sx={{ flex: 1 }}
            >
              {results.success ? 
                'Connexion API fonctionnelle ✅' : 
                'Problèmes de connectivité détectés ⚠️'}
            </Alert>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Configuration actuelle */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configuration actuelle
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell><strong>URL API</strong></TableCell>
                  <TableCell>{import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Base de données</strong></TableCell>
                  <TableCell>{import.meta.env.VITE_ODOO_DATABASE || 'odoo_ecole'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Mode développement</strong></TableCell>
                  <TableCell>{import.meta.env.VITE_DEV_MODE || 'false'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Origin actuel</strong></TableCell>
                  <TableCell>{window.location.origin}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Résultats des tests */}
        {results && results.results && (
          <Grid container spacing={3}>
            {Object.entries(results.results.tests).map(([testName, testResult]) => {
              if (testName === 'network') return null;
              
              return (
                <Grid item xs={12} md={4} key={testName}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {getStatusIcon(testResult.success)}
                        <Typography variant="h6" component="h3">
                          {testName.charAt(0).toUpperCase() + testName.slice(1)}
                        </Typography>
                        {getStatusChip(testResult.success)}
                      </Box>
                      
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>{testResult.status || 'N/A'}</TableCell>
                          </TableRow>
                          {testResult.responseTime && (
                            <TableRow>
                              <TableCell>Temps de réponse</TableCell>
                              <TableCell>{formatResponseTime(testResult.responseTime)}</TableCell>
                            </TableRow>
                          )}
                          {testResult.url && (
                            <TableRow>
                              <TableCell>URL</TableCell>
                              <TableCell sx={{ wordBreak: 'break-all' }}>
                                {testResult.url}
                              </TableCell>
                            </TableRow>
                          )}
                          {testResult.error && (
                            <TableRow>
                              <TableCell>Erreur</TableCell>
                              <TableCell color="error">
                                {testResult.error}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Informations réseau */}
        {results && results.results && results.results.tests.network && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom startIcon={<InfoIcon />}>
                Informations réseau
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>En ligne</strong></TableCell>
                    <TableCell>
                      {results.results.tests.network.onLine ? 
                        <Chip label="Oui" color="success" size="small" /> : 
                        <Chip label="Non" color="error" size="small" />}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Type de connexion</strong></TableCell>
                    <TableCell>
                      {results.results.tests.network.connection?.effectiveType || 'Non disponible'}
                    </TableCell>
                  </TableRow>
                  {results.results.tests.network.connection?.downlink && (
                    <TableRow>
                      <TableCell><strong>Bande passante</strong></TableCell>
                      <TableCell>{results.results.tests.network.connection.downlink} Mbps</TableCell>
                    </TableRow>
                  )}
                  {results.results.tests.network.connection?.rtt && (
                    <TableRow>
                      <TableCell><strong>Latence RTT</strong></TableCell>
                      <TableCell>{results.results.tests.network.connection.rtt} ms</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Solutions recommandées */}
        {results && !results.success && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Solutions recommandées :
            </Typography>
            <Typography component="div">
              <ul>
                <li>Vérifiez que le serveur Odoo est en cours d'exécution</li>
                <li>Vérifiez l'URL dans le fichier .env (actuellement: {import.meta.env.VITE_API_BASE_URL})</li>
                <li>Vérifiez la configuration CORS dans Odoo</li>
                <li>Vérifiez votre pare-feu et proxy</li>
                <li>Essayez avec http://localhost:8069 au lieu de l'IP</li>
              </ul>
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default DiagnosticPage; 