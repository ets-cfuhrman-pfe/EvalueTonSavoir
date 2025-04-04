import React, { useState } from 'react';
import { Box, Button, Chip } from '@mui/material';
import { StudentType } from '../../Types/StudentType';
import { PlayArrow } from '@mui/icons-material';
import LaunchQuizDialog from '../LaunchQuizDialog/LaunchQuizDialog';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Props {
    students: StudentType[];
    launchQuiz: () => void;
    setQuizMode: (_mode: 'student' | 'teacher') => void;
}

const StudentWaitPage: React.FC<Props> = ({ students, launchQuiz, setQuizMode }) => {
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleLaunchClick = () => {
        setIsDialogOpen(true);
    };

    return (
        <div className="d-flex flex-column w-100">
            <div className="p-3 d-flex justify-content-center align-items-center">
                <Button
                    variant="contained"
                    onClick={handleLaunchClick}
                    startIcon={<PlayArrow />}
                    fullWidth
                    sx={{
                        fontWeight: 600,
                        fontSize: 20,
                        maxWidth: '500px' // Optional: limit button width
                    }}
                >
                    Lancer
                </Button>
            </div>

            <div className="p-3 w-100 overflow-auto">
                <Box display="flex" flexWrap="wrap" gap={3}>
                    {students.map((student, index) => (
                        <Box key={student.name + index}>
                            <Chip label={student.name} sx={{ width: '100%' }} />
                        </Box>
                    ))}
                </Box>
            </div>

            <LaunchQuizDialog
                open={isDialogOpen}
                handleOnClose={() => setIsDialogOpen(false)}
                launchQuiz={launchQuiz}
                setQuizMode={setQuizMode}
            />
        </div>
    );
};

export default StudentWaitPage;