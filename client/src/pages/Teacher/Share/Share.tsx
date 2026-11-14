import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderType } from '../../../Types/FolderType';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    NativeSelect,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import ReturnButtonV2 from 'src/components/ReturnButton/ReturnButtonV2';
import ApiService from '../../../services/ApiService';
import SaveIcon from '@mui/icons-material/Save';
import { DescriptionOutlined } from '@mui/icons-material';

const SharePageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 4, px: 2 }}>
        <Box sx={{ mb: 2 }}>
            <ReturnButtonV2 />
        </Box>
        <Paper elevation={2} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 2 }}>
            {children}
        </Paper>
    </Box>
);

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
                    navigate('/login');
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

                setFolders(userFolders);

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
                alert('Veuillez choisir un dossier');
                return;
            }

            if (!id) {
                console.error('Quiz not found for id:', id);
                navigate('/teacher/dashboard');
                return;
            }

            await ApiService.receiveSharedQuiz(id, selectedFolder);
            navigate('/teacher/dashboard');
        } catch (error) {
            console.log(error);
        }
    };

    const handleFormSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void handleQuizSave();
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '40vh',
                    gap: 1.5,
                }}
            >
                <CircularProgress size={28} />
                <Typography color="text.secondary">Chargement...</Typography>
            </Box>
        );
    }

    if (quizExists) {
        return (
            <SharePageLayout>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Quiz déjà existant
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Le quiz que vous essayez d&apos;importer existe déjà sur votre compte.
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Si vous souhaitiez créer une copie de ce quiz, vous pouvez utiliser la fonction
                    &quot;Dupliquer&quot; disponible dans votre tableau de bord.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/teacher/dashboard')}
                    fullWidth
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Retour au tableau de bord
                </Button>
            </SharePageLayout>
        );
    }

    return (
        <SharePageLayout>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <DescriptionOutlined color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                    Importation du Quiz: {quizTitle}
                </Typography>
            </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Vous êtes sur le point d&apos;importer le quiz <strong>{quizTitle}</strong>,
                choisissez un dossier dans lequel enregistrer ce nouveau quiz.
            </Typography>

            <Divider sx={{ my: 2.5 }} />

            <Box component="form" onSubmit={handleFormSubmit}>
                <Typography
                    component="label"
                    htmlFor="select-folder"
                    variant="subtitle2"
                    sx={{ display: 'block', fontWeight: 600, mb: 0.75 }}
                >
                    Dossier de destination
                </Typography>

                <NativeSelect
                    fullWidth
                    value={selectedFolder}
                    onChange={handleSelectFolder}
                    inputProps={{ id: 'select-folder', name: 'folderId' }}
                    sx={{ mb: 3 }}
                >
                    <option disabled value="">
                        Choisir un dossier...
                    </option>
                    {folders.map((folder: FolderType) => (
                        <option value={folder._id} key={folder._id}>
                            {folder.title}
                        </option>
                    ))}
                </NativeSelect>

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<SaveIcon />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Enregistrer
                </Button>
            </Box>
        </SharePageLayout>
    );
};

export default Share;
