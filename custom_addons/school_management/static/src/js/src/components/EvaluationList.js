import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

function EvaluationList() {
  const [evaluations, setEvaluations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await axios.get('/api/evaluations');
      setEvaluations(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'draft':
        return 'default';
      case 'ongoing':
        return 'warning';
      case 'done':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStateLabel = (state) => {
    switch (state) {
      case 'draft':
        return 'Brouillon';
      case 'ongoing':
        return 'En cours';
      case 'done':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return state;
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Typography variant="h4" component="h1">
          Évaluations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/evaluations/new')}
        >
          Nouvelle Évaluation
        </Button>
      </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Matière</TableCell>
              <TableCell>Cours</TableCell>
              <TableCell>Classe</TableCell>
              <TableCell>Enseignant</TableCell>
              <TableCell>État</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell>{evaluation.name}</TableCell>
                <TableCell>{evaluation.evaluation_type_id[1]}</TableCell>
                <TableCell>{evaluation.date}</TableCell>
                <TableCell>{evaluation.subject_id[1]}</TableCell>
                <TableCell>{evaluation.course_id[1]}</TableCell>
                <TableCell>{evaluation.batch_id[1]}</TableCell>
                <TableCell>{evaluation.faculty_id[1]}</TableCell>
                <TableCell>
                  <Chip
                    label={getStateLabel(evaluation.state)}
                    color={getStateColor(evaluation.state)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                  >
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default EvaluationList; 