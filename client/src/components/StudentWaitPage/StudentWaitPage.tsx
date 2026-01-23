import React from 'react';
import { Box, Button, Chip } from '@mui/material';
import { Student } from '../../Types/StudentType';
import { PlayArrow } from '@mui/icons-material';
import LaunchQuizDialog from '../LaunchQuizDialog/LaunchQuizDialog';
import { useState } from 'react';

interface Props {
    students: Student[];
    launchQuiz: () => void;
    setQuizMode: (_mode: 'student' | 'teacher') => void;
}

const StudentWaitPage: React.FC<Props> = ({ students, launchQuiz, setQuizMode }) => {
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleLaunchClick = () => {
        setIsDialogOpen(true);
    };

    return (
        <div className="wait">
            <div className='button'>
                <Button
                    variant="contained"
                    onClick={handleLaunchClick}
                    startIcon={<PlayArrow />}
                    sx={{ fontWeight: 600, fontSize: 20, width: 'auto' }}
                >
                    Lancer 
                </Button> 
            </div>

            <div className="students">
               
                <Box display="flex" flexWrap="wrap" gap={3}>

                    {students.map((student, index) => (
                        <Box key={student.name + index} >
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
