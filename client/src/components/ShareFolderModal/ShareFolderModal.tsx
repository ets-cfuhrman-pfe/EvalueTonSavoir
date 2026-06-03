import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    Alert,
    Typography,
    Link,
    Box,
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';

import { FolderType } from '../../Types/FolderType';
import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';

interface ShareFolderModalProps {
    open: boolean;
    folder: FolderType | null;
    onClose: () => void;
}

const getShareUrl = (quizId: string): string =>
    `${window.location.origin}/teacher/share/${quizId}`;

const writeToClipboard = async (text: string): Promise<void> => {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!success) throw new Error('execCommand copy failed');
};

const ShareFolderModal: React.FC<ShareFolderModalProps> = ({ open, folder, onClose }) => {
    const [quizzes, setQuizzes] = useState<QuizType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
    const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !folder) return;
        setLoading(true);
        setError(null);
        setQuizzes([]);
        ApiService.getFolderContent(folder._id).then((result) => {
            if (typeof result === 'string') {
                setError(result);
            } else {
                setQuizzes(result as QuizType[]);
            }
            setLoading(false);
        });
    }, [open, folder?._id]);

    useEffect(() => {
        if (copyFeedback === 'idle') return;
        const timer = setTimeout(() => setCopyFeedback('idle'), 2000);
        return () => clearTimeout(timer);
    }, [copyFeedback]);

    useEffect(() => {
        if (!copiedQuizId) return;
        const timer = setTimeout(() => setCopiedQuizId(null), 2000);
        return () => clearTimeout(timer);
    }, [copiedQuizId]);

    const handleCopyLink = async (quizId: string) => {
        try {
            await writeToClipboard(getShareUrl(quizId));
            setCopiedQuizId(quizId);
            setCopyFeedback('success');
        } catch {
            setCopyFeedback('error');
        }
    };

    const handleCopyAllLinks = async () => {
        const allUrls = quizzes.map((q) => `${q.title} :\n${getShareUrl(q._id)}`).join('\n\n');
        try {
            await writeToClipboard(allUrls);
            setCopyFeedback('success');
        } catch {
            setCopyFeedback('error');
        }
    };

    const handleClose = () => {
        setCopyFeedback('idle');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Partager le dossier &ldquo;{folder?.title}&rdquo;</DialogTitle>
            <DialogContent dividers>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && error && (
                    <Alert severity="error">{error}</Alert>
                )}
                {!loading && !error && quizzes.length === 0 && (
                    <Typography color="text.secondary">
                        Ce dossier ne contient aucun quiz.
                    </Typography>
                )}
                {!loading && !error && quizzes.length > 0 && (
                    <List disablePadding>
                        {quizzes.map((quiz) => (
                            <ListItem
                                key={quiz._id}
                                disableGutters
                                sx={quiz._id === copiedQuizId ? { backgroundColor: 'success.light', borderRadius: 1 } : undefined}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleCopyLink(quiz._id)}
                                            title="Copier le lien"
                                            aria-label={`Copier le lien de ${quiz.title}`}
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemText primary={quiz.title} />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 2, py: 1.5 }}>
                {copyFeedback === 'success' && (
                    <Alert severity="success" sx={{ py: 0, flexGrow: 1 }}>
                        Lien copié dans le presse-papiers.
                    </Alert>
                )}
                {copyFeedback === 'error' && (
                    <Alert severity="error" sx={{ py: 0, flexGrow: 1 }}>
                        Impossible de copier le lien.
                    </Alert>
                )}
                <Button
                    startIcon={<ContentCopy />}
                    onClick={handleCopyAllLinks}
                    disabled={loading || quizzes.length === 0}
                    variant="outlined"
                >
                    Copier tous les liens
                </Button>
                <Button onClick={handleClose}>Fermer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShareFolderModal;
