import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ApiService from '../../services/ApiService';
import { QuizTypeShort } from "../../Types/QuizType";

const Users: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizTypeShort[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await ApiService.getQuizzes();
        setQuizzes(data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = (id: string) => {
    setQuizzes(quizzes.filter(quiz => quiz._id !== id));
  };

  return (
    <TableContainer component={Paper} className="p-4">
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
  );
};

export default Users;
