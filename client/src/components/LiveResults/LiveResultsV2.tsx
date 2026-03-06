import React, { useState } from 'react';
import { QuestionType } from '../../Types/QuestionType';
import {
    FormControlLabel,
    Switch,
    Typography,
    Box,
} from '@mui/material';
import { Student } from '../../Types/StudentType';
import LiveResultsTableV2 from './LiveResultsTable/LiveResultsTableV2';

interface LiveResultsProps {
    questions: QuestionType[];
    showSelectedQuestion: (index: number) => void;
    students: Student[];
    selectedQuestionIndex?: number;
}

const LiveResultsV2: React.FC<LiveResultsProps> = ({ questions, showSelectedQuestion, students, selectedQuestionIndex }) => {
    const [showUsernames, setShowUsernames] = useState<boolean>(false);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);

    // Sort students: connected first, then disconnected
    const sortedStudents = [...students].sort((a, b) => {
        const aConnected = a.isConnected !== false;
        const bConnected = b.isConnected !== false;
        if (aConnected && !bConnected) return -1;
        if (!aConnected && bConnected) return 1;
        return 0;
    });

    return (
        <Box className="h-100">
            {/* Action Bar with Bootstrap classes */}
            <Box className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center p-3 border-bottom bg-light">
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

                <Box className="table-responsive">
                    <LiveResultsTableV2
                        students={sortedStudents}
                        questions={questions}
                        showCorrectAnswers={showCorrectAnswers}
                        showSelectedQuestion={showSelectedQuestion}
                        showUsernames={showUsernames}
                        selectedQuestionIndex={selectedQuestionIndex}
                    />
                </Box>
        </Box>
    );
};

export default LiveResultsV2;