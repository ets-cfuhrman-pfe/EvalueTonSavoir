import React, { useState, useEffect } from "react";
import { Paper, Grid, Typography, CircularProgress, Box, Card, CardContent} from "@mui/material";
import ApiService from '../../services/ApiService';
import { AdminTableType } from "../../Types/AdminTableType";
import AdminTable from "../../components/AdminTable/AdminTable";


const styles = {
  cardBg: 'rgba(82, 113, 255, 1)',
  cardHover: 'rgba(65, 105, 225, 0.7)',
};

const Stats: React.FC = () => {
  const [quizzes, setQuizzes] = useState<AdminTableType[]>([]);
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
        const filteredMonthlyQuizzes = data.quizzes.filter((quiz: AdminTableType) => {
          const quizDate = new Date(quiz.created_at);
          return quizDate.getMonth() === currentMonth && quizDate.getFullYear() === currentYear;
        });

        setMonthlyQuizzes(filteredMonthlyQuizzes.length === 0 ? 0 : filteredMonthlyQuizzes.length);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleQuizDelete = (rowToDelete: AdminTableType) => {
    setQuizzes((prevData) => prevData.filter((row) => row._id !== rowToDelete._id));
  };

  const totalQuizzes = quizzes.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={80} thickness={5} />
      </Box>
    );
  }

  const stats = [
    { label: "Quiz du Mois", value: monthlyQuizzes },
    { label: "Quiz total", value: totalQuizzes },
    { label: "Enseignants", value: totalUsers },
    { label: "Enseignants du Mois", value: 0 },
  ];

  const labelMap = {
    _id: "ID",
    email: "Enseignant",
    title: "Titre",
    created_at: "Création",
    updated_at: "Mise à Jour",
  };
  
  return (
    <Paper className="p-4" sx={{ boxShadow: 'none', padding: 3 }}>
    <Grid container spacing={3} justifyContent="center">
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={3} key={index}>
          <Card
              sx={{
                textAlign: "center",
                padding: 2,
                backgroundColor: styles.cardBg,
                color: "white",
                transition: "background-color 0.3s ease",
                "&:hover": { backgroundColor: styles.cardHover },
              }}>
            <CardContent>
                <Typography variant="h6" sx={{ color: "white" }}>{stat.label}</Typography>
                <Typography variant="h4" sx={{ color: "white" }}>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>


      <AdminTable 
        data={quizzes} 
        onDelete={handleQuizDelete} 
        filterKeys={["_id"]} 
        labelMap={labelMap}
      />
    </Paper>
  );
};

export default Stats;
