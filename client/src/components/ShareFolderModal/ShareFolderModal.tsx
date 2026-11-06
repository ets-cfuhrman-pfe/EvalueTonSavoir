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
    Box,
    Divider,
    Stack,
} from '@mui/material';
import { ContentCopy, Link as LinkIcon, FolderZip } from '@mui/icons-material';

import { FolderType } from '../../Types/FolderType';
import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';
import {
    getQuizShareUrl,
    getFolderShareUrl,
    buildQuizLinkList,
    buildFolderGiftZip,
    sanitizeFileName,
    downloadBlob,
} from '../../utils/folderShare';

interface ShareFolderModalProps {
    open: boolean;
    folder: FolderType | null;
    onClose: () => void;
}

type Feedback = { severity: 'success' | 'error'; message: string } | null;

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
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);

    const folderId = folder?._id;

    useEffect(() => {
        if (!open || !folderId) return;
        // Ignore responses for a folder that is no longer displayed
        let cancelled = false;
        setLoading(true);
        setError(null);
        setQuizzes([]);
        ApiService.getFolderContent(folderId)
            .then((result) => {
                if (cancelled) return;
                if (typeof result === 'string') {
                    setError(result);
                } else {
                    setQuizzes(result);
                }
            })
            .catch(() => {
                if (!cancelled) setError("Impossible de charger le contenu du dossier.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, folderId]);

    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 2500);
        return () => clearTimeout(timer);
    }, [feedback]);

    useEffect(() => {
        if (!copiedQuizId) return;
        const timer = setTimeout(() => setCopiedQuizId(null), 2000);
        return () => clearTimeout(timer);
    }, [copiedQuizId]);

    const copy = async (text: string, successMessage: string) => {
        try {
            await writeToClipboard(text);
            setFeedback({ severity: 'success', message: successMessage });
            return true;
        } catch {
            setFeedback({ severity: 'error', message: 'Impossible de copier dans le presse-papiers.' });
            return false;
        }
    };

    const handleCopyLink = async (quizId: string) => {
        if (await copy(getQuizShareUrl(quizId), 'Lien copié dans le presse-papiers.')) {
            setCopiedQuizId(quizId);
        }
    };

    const handleCopyAllLinks = () =>
        copy(buildQuizLinkList(quizzes), 'Liste des quiz copiée dans le presse-papiers.');

    const handleCopyFolderLink = () => {
        if (!folderId) return;
        return copy(getFolderShareUrl(folderId), "Lien d'importation du dossier copié.");
    };

    const handleDownloadZip = () => {
        if (!folder) return;
        try {
            const zip = buildFolderGiftZip(quizzes);
            downloadBlob(zip, `${sanitizeFileName(folder.title)}.zip`, 'application/zip');
            setFeedback({ severity: 'success', message: 'Archive .zip téléchargée.' });
        } catch {
            setFeedback({ severity: 'error', message: "Impossible de générer l'archive .zip." });
        }
    };

    const handleClose = () => {
        setFeedback(null);
        onClose();
    };

    const isEmpty = !loading && !error && quizzes.length === 0;
    const actionsDisabled = loading || !!error || quizzes.length === 0;

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Partager le dossier &ldquo;{folder?.title}&rdquo;</DialogTitle>
            <DialogContent dividers>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && error && <Alert severity="error">{error}</Alert>}
                {isEmpty && (
                    <Typography color="text.secondary">Ce dossier ne contient aucun quiz.</Typography>
                )}
                {!loading && !error && quizzes.length > 0 && (
                    <List disablePadding>
                        {quizzes.map((quiz) => (
                            <ListItem
                                key={quiz._id}
                                disableGutters
                                sx={quiz._id === copiedQuizId ? { backgroundColor: 'success.light', borderRadius: 1 } : undefined}
                                secondaryAction={
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopyLink(quiz._id)}
                                        title="Copier le lien"
                                        aria-label={`Copier le lien de ${quiz.title}`}
                                    >
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={quiz.title} />
                            </ListItem>
                        ))}
                    </List>
                )}

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                    <Button
                        startIcon={<ContentCopy />}
                        onClick={handleCopyAllLinks}
                        disabled={actionsDisabled}
                        variant="outlined"
                    >
                        Copier la liste des quiz (titres et liens)
                    </Button>
                    <Button
                        startIcon={<LinkIcon />}
                        onClick={handleCopyFolderLink}
                        disabled={actionsDisabled}
                        variant="outlined"
                    >
                        Copier le lien d&apos;importation du dossier
                    </Button>
                    <Button
                        startIcon={<FolderZip />}
                        onClick={handleDownloadZip}
                        disabled={actionsDisabled}
                        variant="outlined"
                    >
                        Télécharger tous les quiz (.zip GIFT)
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 2, py: 1.5 }}>
                {feedback && (
                    <Alert severity={feedback.severity} sx={{ py: 0, flexGrow: 1 }}>
                        {feedback.message}
                    </Alert>
                )}
                <Button onClick={handleClose}>Fermer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShareFolderModal;
