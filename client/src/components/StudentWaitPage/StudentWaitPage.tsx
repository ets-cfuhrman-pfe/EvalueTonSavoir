import { Box, Button, Chip } from '@mui/material';
import { StudentType } from '../../Types/StudentType';
import { PlayArrow } from '@mui/icons-material';
import LaunchQuizDialog from '../LaunchQuizDialog/LaunchQuizDialog';
import { useState } from 'react';
import './studentWaitPage.css';

interface Props {
    students: StudentType[];
    launchQuiz: () => void;
    setQuizMode: (mode: 'student' | 'teacher') => void;
}

const StudentWaitPage: React.FC<Props> = ({ students, launchQuiz, setQuizMode }) => {
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    return (
        <div className="wait">
            <div className='button'>
                <Button
                    variant="contained"
                    onClick={() => setIsDialogOpen(true)}
                    startIcon={<PlayArrow />}
                    fullWidth
                    sx={{ fontWeight: 600, fontSize: 20 }}
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
