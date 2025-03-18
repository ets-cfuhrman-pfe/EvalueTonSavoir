import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Grid, Typography, CircularProgress, Box, TextField, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ApiService from '../../services/ApiService';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { QuizTypeShort } from "../../Types/QuizType";

const Users: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizTypeShort[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizTypeShort[]>([]);
  const [monthlyQuizzes, setMonthlyQuizzes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ApiService.getStats();
        setQuizzes(data.quizzes);
        setFilteredQuizzes(data.quizzes);
        setTotalUsers(data.total);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const filteredMonthlyQuizzes = data.quizzes.filter((quiz: QuizTypeShort) => {
          const quizDate = new Date(quiz.created_at);
          return quizDate.getMonth() === currentMonth && quizDate.getFullYear() === currentYear;
        });

        setMonthlyQuizzes(filteredMonthlyQuizzes.length === 0 ? 10 : 0);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const filtered = quizzes.filter(quiz =>
      quiz.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
      ((new Date(quiz.created_at).toLocaleDateString().includes(dateFilter) || 
      new Date(quiz.updated_at).toLocaleDateString().includes(dateFilter)))
    );
    setFilteredQuizzes(filtered);
  }, [emailFilter, dateFilter, quizzes]);

  const handleDelete = (id: string) => {
    setQuizzes(quizzes.filter(quiz => quiz._id !== id));
  };

  const totalQuizzes = quizzes.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={80} thickness={5} />
      </Box>
    );
  }

  return (
    <Paper className="p-4" sx={{ boxShadow: 'none' }}>
      <Grid container spacing={8} justifyContent="center">
        <Grid item>
          <Typography variant="h6" align="center">Quiz du Mois</Typography>
          <Box position="relative" display="inline-flex">
            <CircularProgress variant="determinate" value={monthlyQuizzes === 0 ? 0 : monthlyQuizzes} size={80} thickness={5} />
            <Box position="absolute" top={0} left={0} bottom={0} right={0} display="flex" alignItems="center" justifyContent="center">
              <Typography variant="h6">{monthlyQuizzes}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item>
          <Typography variant="h6" align="center">Quiz total</Typography>
          <Box position="relative" display="inline-flex">
            <CircularProgress variant="determinate" value={totalQuizzes} size={80} thickness={5} />
            <Box position="absolute" top={0} left={0} bottom={0} right={0} display="flex" alignItems="center" justifyContent="center">
              <Typography variant="h6">{totalQuizzes}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item>
          <Typography variant="h6" align="center">Enseignants</Typography>
          <Box position="relative" display="inline-flex">
            <CircularProgress variant="determinate" value={totalUsers} size={80} thickness={5} />
            <Box position="absolute" top={0} left={0} bottom={0} right={0} display="flex" alignItems="center" justifyContent="center">
              <Typography variant="h6">{totalUsers}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="filter-content"
          id="filter-header"
        >
          <Typography variant="h6">Filtres</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Filtrer par email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Filtrer par date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>


      {/* Table */}
      <TableContainer component={Paper} className="mt-4">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Enseignant
              </TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Crée</TableCell>
              <TableCell>Modifié</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuizzes.map((quiz) => (
              <TableRow key={quiz._id}>
                <TableCell>{quiz.email}</TableCell>
                <TableCell>{quiz.title}</TableCell>
                <TableCell>{new Date(quiz.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(quiz.updated_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDelete(quiz._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default Users;
