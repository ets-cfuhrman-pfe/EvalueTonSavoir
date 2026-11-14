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
    CircularProgress,
    Alert,
    Typography,
    Box,
    Divider,
    Stack,
} from '@mui/material';
import { Check, ContentCopy, Link as LinkIcon, FolderZip } from '@mui/icons-material';

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

    const folderActions = [
        {
            key: 'list',
            icon: <ContentCopy />,
            onClick: handleCopyAllLinks,
            label: 'Copier la liste des quiz (titres et liens)',
        },
        {
            key: 'link',
            icon: <LinkIcon />,
            onClick: handleCopyFolderLink,
            label: "Copier le lien d'importation du dossier",
        },
        {
            key: 'zip',
            icon: <FolderZip />,
            onClick: handleDownloadZip,
            label: 'Télécharger tous les quiz (.zip GIFT)',
        },
    ];

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Partager le dossier &ldquo;{folder?.title}&rdquo;</DialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                    Partager un quiz individuel
                    {!loading && !error && quizzes.length > 0 ? ` (${quizzes.length})` : ''}
                </Typography>

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
                    <List
                        disablePadding
                        data-testid="folder-quiz-list"
                        sx={{
                            maxHeight: 210,
                            overflowY: 'auto',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                        }}
                    >
                        {quizzes.map((quiz, index) => {
                            const isCopied = quiz._id === copiedQuizId;
                            return (
                                <ListItem
                                    key={quiz._id}
                                    disableGutters
                                    divider={index < quizzes.length - 1}
                                    sx={{
                                        px: 1.5,
                                        py: 0.75,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1.5,
                                        backgroundColor: isCopied ? 'action.selected' : undefined,
                                    }}
                                >
                                    <ListItemText
                                        primary={quiz.title}
                                        sx={{ my: 0, minWidth: 0 }}
                                        primaryTypographyProps={{ noWrap: true }}
                                    />
                                    <Button
                                        size="small"
                                        variant={isCopied ? 'contained' : 'outlined'}
                                        color={isCopied ? 'success' : 'primary'}
                                        startIcon={isCopied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                                        onClick={() => handleCopyLink(quiz._id)}
                                        aria-label={
                                            isCopied
                                                ? `Lien copié - Copier le lien de ${quiz.title}`
                                                : `Copier le lien de ${quiz.title}`
                                        }
                                        sx={{ flexShrink: 0, textTransform: 'none' }}
                                    >
                                        {isCopied ? 'Lien copié' : 'Copier le lien'}
                                    </Button>
                                </ListItem>
                            );
                        })}
                    </List>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                    Partager tout le dossier
                </Typography>

                <Stack spacing={1}>
                    {folderActions.map((action) => (
                        <Button
                            key={action.key}
                            startIcon={action.icon}
                            onClick={action.onClick}
                            disabled={actionsDisabled}
                            variant="outlined"
                            sx={{
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                textTransform: 'none',
                                py: 1,
                                px: 1.5,
                            }}
                        >
                            {action.label}
                        </Button>
                    ))}
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
