import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Grid, Typography, CircularProgress, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ApiService from '../../services/ApiService';
import { QuizTypeShort } from "../../Types/QuizType";

const Users: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizTypeShort[]>([]);
  const [monthlyQuizzes, setMonthlyQuizzes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ApiService.getStats();
        setQuizzes(data.quizzes);
        setTotalUsers(data.total);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const filteredQuizzes = data.quizzes.filter((quiz: QuizTypeShort) => {
          const quizDate = new Date(quiz.created_at);
          return quizDate.getMonth() === currentMonth && quizDate.getFullYear() === currentYear;
        });

        setMonthlyQuizzes(filteredQuizzes.length === 0 ? 10 : 0);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

      {/* Table */}
      <TableContainer component={Paper} className="mt-4">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Enseignant</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Crée</TableCell>
              <TableCell>Modifié</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow key={quiz._id}>
                <TableCell>{quiz.userId}</TableCell>
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
