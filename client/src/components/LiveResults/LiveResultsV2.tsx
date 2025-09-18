import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { QuestionType } from '../../Types/QuestionType';
import {
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Card,
    CardContent,
} from '@mui/material';
import { StudentType } from '../../Types/StudentType';
import LiveResultsTable from './LiveResultsTable/LiveResultsTable';

interface LiveResultsProps {
    socket: Socket | null;
    questions: QuestionType[];
    showSelectedQuestion: (index: number) => void;
    quizMode: 'teacher' | 'student';
    students: StudentType[];
    quizTitle?: string;
}

const LiveResultsV2: React.FC<LiveResultsProps> = ({ questions, showSelectedQuestion, students, quizTitle }) => {
    const [showUsernames, setShowUsernames] = useState<boolean>(false);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);

    return (
        <Card elevation={2} className="h-100">
            <CardContent className="p-0">
                {/* Action Bar with Bootstrap classes */}
                <Box className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center p-3 border-bottom bg-light">
                    <Typography variant="h5" component="h2" className="mb-2 mb-lg-0 fw-bold text-primary">
                        {' Résultats de : ' + (quizTitle || 'Quiz')}
                    </Typography>
                    
                    {/* Controls */}
                    <Box className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showUsernames}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setShowUsernames(e.target.checked)
                                    }
                                    size="small"
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" className="text-secondary">
                                    Afficher les noms
                                </Typography>
                            }
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showCorrectAnswers}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setShowCorrectAnswers(e.target.checked)
                                    }
                                    size="small"
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" className="text-secondary">
                                    Afficher les réponses
                                </Typography>
                            }
                        />
                    </Box>
                </Box>

                {/* Table Container with Bootstrap responsive classes */}
                <Box className="table-responsive" sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <LiveResultsTable
                        students={students}
                        questions={questions}
                        showCorrectAnswers={showCorrectAnswers}
                        showSelectedQuestion={showSelectedQuestion}
                        showUsernames={showUsernames}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default LiveResultsV2;