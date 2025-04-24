// LiveResults.tsx
import React, { useState } from 'react';

import { Socket } from 'socket.io-client';
import { QuestionType } from '../../Types/QuestionType';
import './liveResult.css';
import {
    FormControlLabel,
    FormGroup,
    Switch,
} from '@mui/material';
import { StudentType } from '../../Types/StudentType';

import LiveResultsTable from './LiveResultsTable/LiveResultsTable';

interface LiveResultsProps {
    socket: Socket | null;
    questions: QuestionType[];
    showSelectedQuestion: (index: number) => void;
    quizMode: 'teacher' | 'student';
    students: StudentType[]
}


const LiveResults: React.FC<LiveResultsProps> = ({ questions, showSelectedQuestion, students }) => {
    const [showUsernames, setShowUsernames] = useState<boolean>(false);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);

    return (
        <div>
            <div className="action-bar mb-1">
                <FormGroup row>
                    <FormControlLabel
                        label={<div className="text-sm">Afficher les noms</div>}
                        control={
                            <Switch
                                value={showUsernames}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setShowUsernames(e.target.checked)
                                }
                            />
                        }
                    />
                    <FormControlLabel
                        label={<div className="text-sm">Afficher les réponses</div>}
                        control={
                            <Switch
                                value={showCorrectAnswers}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setShowCorrectAnswers(e.target.checked)
                                }
                            />
                        }
                    />
                </FormGroup>
            </div>

            <div className="table-container">

                <LiveResultsTable
                    students={students}
                    questions={questions}
                    showCorrectAnswers={showCorrectAnswers}
                    showSelectedQuestion={showSelectedQuestion}
                    showUsernames={showUsernames}
                />
            </div>
        </div>
    );
};

export default LiveResults;
