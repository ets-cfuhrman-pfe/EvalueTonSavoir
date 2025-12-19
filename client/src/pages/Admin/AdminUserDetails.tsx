import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import { ENV_VARIABLES } from '../../constants';
import { QuizType } from 'src/Types/QuizType';
import { FolderType } from 'src/Types/FolderType';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type ActionNotice = { type: 'success' | 'error'; message: string } | null;

const AdminUserDetails: React.FC = () => {
    const params = useParams();
    const location = useLocation();
    const userId = params.id as string;
    const locationState = (location.state ?? {}) as { user?: { name?: string; email?: string } };
    const user = locationState?.user;

    const [folders, setFolders] = useState<FolderType[]>([]);
    const [quizzes, setQuizzes] = useState<QuizType[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [rooms, setRooms] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openImageModal, setOpenImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
    const [notice, setNotice] = useState<ActionNotice>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [foldersRes, quizzesRes, imagesRes, roomsRes] = await Promise.all([
                ApiService.getUserFoldersByUserId(userId),
                ApiService.getQuizzesByUserId(userId),
                ApiService.getUserImagesByUserId(userId, 1, 50),
                ApiService.getRoomTitleByUserId(userId)
            ]);

            if (Array.isArray(foldersRes)) setFolders(foldersRes);
            else setFolders([]);

            if (Array.isArray(quizzesRes)) setQuizzes(quizzesRes);
            else setQuizzes([]);

            if (imagesRes && typeof imagesRes === 'object' && 'images' in imagesRes) {
                setImages(imagesRes.images || []);
            } else {
                setImages([]);
            }

            if (Array.isArray(roomsRes)) setRooms(roomsRes);
            else setRooms([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des données utilisateur');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    const openImagePreview = useCallback((imageId: string, fileName?: string | null) => {
        setSelectedImageUrl(`${ENV_VARIABLES.VITE_BACKEND_URL}/api/image/get/${imageId}`);
        setSelectedImageName(fileName || 'image');
        setOpenImageModal(true);
    }, []);

    const handleDownloadAll = useCallback(async () => {
        if (!userId) return;
        setNotice(null);
        setDownloadingAll(true);
        try {
            const { blob, fileName } = await ApiService.exportAllAdminUserData(userId);
            const blobUrl = globalThis.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            globalThis.URL.revokeObjectURL(blobUrl);
            setNotice({ type: 'success', message: `Téléchargement de toutes les données terminé.` });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Téléchargement impossible.';
            setNotice({ type: 'error', message });
        } finally {
            setDownloadingAll(false);
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="container mt-4">
                <h1>Détails de l'utilisateur</h1>
                <div className="d-flex justify-content-center mt-3">
                    <div className="spinner-border" aria-hidden="true"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <h1>Détails de l'utilisateur</h1>
                <div className="alert alert-danger" role="alert">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <Link to="/admin/dashboard" className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                        <ArrowBackIcon fontSize="small" className="me-1" />
                        Retour
                    </Link>
                    <h1 className="mb-0">Détails de l'utilisateur</h1>
                </div>
                <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-items-center w-auto"
                    onClick={() => void handleDownloadAll()}
                    disabled={downloadingAll}
                >
                    <DownloadIcon fontSize="small" className="me-2" />
                    {downloadingAll ? 'Téléchargement...' : 'Tout télécharger'}
                </button>
            </div>
            {notice ? (
                <div className={`alert alert-${notice.type === 'error' ? 'danger' : 'success'}`} role="alert">
                    {notice.message}
                </div>
            ) : null}
            <div className="card">
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3 admin-user-header">
                        <Avatar className="me-3 admin-avatar">{user?.name?.charAt(0) || 'U'}</Avatar>
                        <div>
                            <h4 className="mb-0">{user?.name || 'Utilisateur'}</h4>
                            <p className="mb-0 text-muted">{user?.email}</p>
                        </div>
                    </div>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Dossiers ({folders.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {folders.length === 0 ? (
                                <Typography className="text-muted">Aucun dossier trouvé.</Typography>
                            ) : (
                                <ul className="list-unstyled">
                                    {folders.map((f) => (
                                        <li key={f._id} className="mb-2">
                                            <strong>{f.title}</strong>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Quizs ({quizzes.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {quizzes.length === 0 ? (
                                <Typography className="text-muted">Aucun quiz trouvé.</Typography>
                            ) : (
                                <ul className="list-unstyled">
                                    {quizzes.map((q) => (
                                        <li key={q._id} className="mb-2">
                                            <Link to={`/teacher/editor-quiz/${q._id}`} className="text-decoration-none">{q.title}</Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Images ({images.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {images.length === 0 ? (
                                <Typography className="text-muted">Aucune image trouvée.</Typography>
                            ) : (
                                <div className="admin-images-grid">
                                    {images.map((img: any) => (
                                        <div key={img.id} className="admin-image-card admin-image-card--icon">
                                            <button
                                                type="button"
                                                className="admin-image-card-button"
                                                onClick={() => openImagePreview(img.id, img.file_name)}
                                                aria-label={`Afficher ${img.file_name || 'image'}`}
                                                style={{ border: 'none', background: 'transparent', padding: 0, width: '100%' }}
                                            >
                                                <img
                                                    src={`${ENV_VARIABLES.VITE_BACKEND_URL}/api/image/get/${img.id}`}
                                                    alt={img.file_name || 'image'}
                                                    className="img-fluid admin-image-clickable"
                                                    title={img.file_name || 'image'}
                                                    loading="lazy"
                                                />
                                            </button>
                                            <div className="admin-image-caption">{img.file_name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AccordionDetails>
                    </Accordion>

                    {/* Image preview modal */}
                    <Dialog
                        open={openImageModal}
                        onClose={() => setOpenImageModal(false)}
                        maxWidth="lg"
                        fullWidth
                        aria-labelledby="image-dialog-title"
                    >
                        <DialogTitle id="image-dialog-title">
                            {selectedImageName}
                            <IconButton
                                aria-label="close"
                                onClick={() => setOpenImageModal(false)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                                size="large"
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers className="admin-image-modal">
                            {selectedImageUrl ? (
                                <img src={selectedImageUrl} alt={selectedImageName || 'image'} />
                            ) : null}
                        </DialogContent>
                    </Dialog>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Salles ({rooms.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {rooms.length === 0 ? (
                                <Typography className="text-muted">Aucune salle trouvée.</Typography>
                            ) : (
                                <ul className="list-unstyled">
                                    {rooms.map((r, idx) => (
                                        <li key={`${r}-${idx}`}>{r}</li>
                                    ))}
                                </ul>
                            )}
                        </AccordionDetails>
                    </Accordion>

                </div>
            </div>
        </div>
    );
};

export default AdminUserDetails;
