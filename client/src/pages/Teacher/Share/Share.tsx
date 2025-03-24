import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderType } from '../../../Types/FolderType';
import './share.css';
import { Button, NativeSelect, Typography, Box } from '@mui/material';
import ReturnButton from 'src/components/ReturnButton/ReturnButton';
import ApiService from '../../../services/ApiService';

const Share: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<string>();

    const [quizTitle, setQuizTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [quizExists, setQuizExists] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) {
                    console.error('Quiz not found for id:', id);
                    navigate('/teacher/dashboard');
                    return;
                }

                if (!ApiService.isLoggedIn()) {
                    navigate("/login");
                    return;
                }
                
                const quizIds = await ApiService.getAllQuizIds();
                
                if (quizIds.includes(id)) {
                    setQuizExists(true);
                    setLoading(false);
                    return;
                }

                const userFolders = await ApiService.getUserFolders();
                
                if (userFolders.length == 0) {
                    navigate('/teacher/dashboard');
                    return;
                }

                setFolders(userFolders as FolderType[]);

                const title = await ApiService.getSharedQuiz(id);

                if (!title) {
                    console.error('Quiz not found for id:', id);
                    navigate('/teacher/dashboard');
                    return;
                }

                setQuizTitle(title);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
                navigate('/teacher/dashboard');
            }
        };

        fetchData();
    }, [id, navigate]);

    const handleSelectFolder = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFolder(event.target.value);
    };

    const handleQuizSave = async () => {
        try {
            if (selectedFolder == '') {
                alert("Veuillez choisir un dossier");
                return;
            }
            
            if (!id) {
                console.error('Quiz not found for id:', id);
                navigate('/teacher/dashboard');
                return;
            }

            await ApiService.receiveSharedQuiz(id, selectedFolder)
            navigate('/teacher/dashboard');

        } catch (error) {
            console.log(error)
        }
    };

    if (loading) {
        return <div className='quizImport'>Chargement...</div>;
    }

  if (quizExists) {
        return (
            <div className='quizImport'>
                <div className='importHeader'>
                    <ReturnButton />
                    <div className='titleContainer'>
                        <div className='mainTitle'>Quiz déjà existant</div>
                    </div>
                    <div className='dumb'></div>
                </div>

                <div className='editSection'>
                    <Box sx={{ 
                        textAlign: 'center', 
                        padding: 3,
                        maxWidth: 600,
                        margin: '0 auto'
                    }}>
                        <Typography variant="h6" gutterBottom>
                            Le quiz que vous essayez d'importer existe déjà sur votre compte.
                        </Typography>
                        
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/teacher/dashboard')}
                            sx={{ mt: 3, mb: 1 }}
                            fullWidth
                        >
                            Retour au tableau de bord
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary">
                            Si vous souhaitiez créer une copie de ce quiz, 
                            vous pouvez utiliser la fonction "Dupliquer" disponible 
                            dans votre tableau de bord.
                        </Typography>
                    </Box>
                </div>
            </div>
        );
    }

    return (
        <div className='quizImport'>
            <div className='importHeader'>
                <ReturnButton />
                <div className='titleContainer'>
                    <div className='mainTitle'>Importation du Quiz: {quizTitle}</div>
                    <div className='subTitle'>
                        Vous êtes sur le point d'importer le quiz <strong>{quizTitle}</strong>, choisissez un dossier dans lequel enregistrer ce nouveau quiz.
                    </div>
                </div>
                <div className='dumb'></div>
            </div>

            <div className='editSection'>
                <div className='formContainer'>
                    <NativeSelect
                        id="select-folder"
                        color="primary"
                        value={selectedFolder}
                        onChange={handleSelectFolder}
                        className="folderSelect"
                    >
                        <option disabled value=""> Choisir un dossier... </option>
                        {folders.map((folder: FolderType) => (
                            <option value={folder._id} key={folder._id}> {folder.title} </option>
                        ))}
                    </NativeSelect>

                    <Button variant="contained" onClick={handleQuizSave} className="saveButton">
                        Enregistrer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Share;