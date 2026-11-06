import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Box, List, ListItem, ListItemText, Alert, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ReturnButtonV2 from 'src/components/ReturnButton/ReturnButtonV2';
import ApiService, { SharedFolderPreview } from '../../../services/ApiService';

/**
 * Landing page for a folder share link (/teacher/share-folder/:id).
 * Shows the shared folder's quizzes and imports all of them in one step.
 */
const ShareFolder: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<string>();

    const [preview, setPreview] = useState<SharedFolderPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            if (!id) {
                navigate('/teacher/dashboard');
                return;
            }
            if (!ApiService.isLoggedIn()) {
                navigate('/login');
                return;
            }
            const result = await ApiService.getSharedFolder(id);
            if (cancelled) return;
            if (typeof result === 'string') {
                setError(result);
            } else {
                setPreview(result);
            }
            setLoading(false);
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, [id, navigate]);

    const handleImport = async () => {
        if (!id) return;
        setImporting(true);
        setError(null);
        const result = await ApiService.receiveSharedFolder(id);
        setImporting(false);
        if (typeof result === 'string') {
            setError(result);
            return;
        }
        navigate('/teacher/dashboard');
    };

    if (loading) {
        return <div className='quizImport'>Chargement...</div>;
    }

    return (
        <div className='quizImport'>
            <div className='importHeader'>
                <ReturnButtonV2 />
                <div className='titleContainer'>
                    <div className='mainTitle'>
                        {preview ? `Importation du dossier : ${preview.title}` : 'Importation du dossier'}
                    </div>
                    {preview && (
                        <div className='subTitle'>
                            Vous êtes sur le point d&apos;importer le dossier <strong>{preview.title}</strong> et
                            ses {preview.quizzes.length} quiz dans votre compte.
                        </div>
                    )}
                </div>
                <div className='dumb'></div>
            </div>

            <div className='editSection'>
                <Box sx={{ maxWidth: 600, margin: '0 auto', padding: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {preview && preview.isOwner && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Ce dossier vous appartient déjà. L&apos;importer en créera une copie.
                        </Alert>
                    )}

                    {preview && preview.quizzes.length === 0 && (
                        <Typography color="text.secondary">Ce dossier ne contient aucun quiz.</Typography>
                    )}

                    {preview && preview.quizzes.length > 0 && (
                        <List aria-label="Quiz du dossier partagé">
                            {preview.quizzes.map((quiz) => (
                                <ListItem key={quiz._id} disableGutters>
                                    <ListItemText primary={quiz.title} />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {preview ? (
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={importing}
                            startIcon={importing ? <CircularProgress size={18} /> : <SaveIcon />}
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Importer le dossier
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={() => navigate('/teacher/dashboard')} fullWidth>
                            Retour au tableau de bord
                        </Button>
                    )}
                </Box>
            </div>
        </div>
    );
};

export default ShareFolder;
