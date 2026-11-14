import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { DescriptionOutlined, FolderOutlined } from '@mui/icons-material';
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

    return (
        <Box sx={{ maxWidth: 640, mx: 'auto', py: 4, px: 2 }}>
            <Box sx={{ mb: 2 }}>
                <ReturnButtonV2 />
            </Box>

            <Paper elevation={2} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <FolderOutlined color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        {preview ? `Importation du dossier : ${preview.title}` : 'Importation du dossier'}
                    </Typography>
                </Stack>

                {preview && (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        Vous êtes sur le point d&apos;importer le dossier <strong>{preview.title}</strong> et
                        ses {preview.quizzes.length} quiz dans votre compte.
                    </Typography>
                )}

                <Divider sx={{ my: 2.5 }} />

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
                    <>
                        <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                            Quiz inclus ({preview.quizzes.length})
                        </Typography>
                        <List
                            aria-label="Quiz du dossier partagé"
                            disablePadding
                            data-testid="shared-folder-quiz-list"
                            sx={{
                                maxHeight: 260,
                                overflowY: 'auto',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                            }}
                        >
                            {preview.quizzes.map((quiz, index) => (
                                <ListItem
                                    key={quiz._id}
                                    divider={index < preview.quizzes.length - 1}
                                    sx={{ px: 2, py: 1 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <DescriptionOutlined fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={quiz.title}
                                        sx={{ my: 0 }}
                                        primaryTypographyProps={{ noWrap: true }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}

                {preview ? (
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleImport}
                        disabled={importing}
                        startIcon={importing ? <CircularProgress size={18} /> : <SaveIcon />}
                        fullWidth
                        sx={{ mt: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Importer le dossier
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/teacher/dashboard')}
                        fullWidth
                        sx={{ mt: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Retour au tableau de bord
                    </Button>
                )}
            </Paper>
        </Box>
    );
};

export default ShareFolder;
