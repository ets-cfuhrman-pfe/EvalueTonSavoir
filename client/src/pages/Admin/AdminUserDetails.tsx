import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import ApiService, { AdminDataResource } from '../../services/ApiService';
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

const RESOURCE_LABELS: Record<AdminDataResource, string> = {
    folders: 'dossiers',
    quizzes: 'quizs',
    images: 'images',
    rooms: 'salles'
};

type ResourceActionState = Record<AdminDataResource, { downloading: boolean; uploading: boolean }>;
type ActionNotice = { type: 'success' | 'error'; message: string } | null;

const initialActionState: ResourceActionState = {
    folders: { downloading: false, uploading: false },
    quizzes: { downloading: false, uploading: false },
    images: { downloading: false, uploading: false },
    rooms: { downloading: false, uploading: false }
};

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
    const [actionState, setActionState] = useState<ResourceActionState>(initialActionState);
    const fileInputRefs = useRef<Record<AdminDataResource, HTMLInputElement | null>>({
        folders: null,
        quizzes: null,
        images: null,
        rooms: null
    });

    const setActionFlag = useCallback((resource: AdminDataResource, key: keyof ResourceActionState[AdminDataResource], value: boolean) => {
        setActionState((prev) => ({
            ...prev,
            [resource]: {
                ...prev[resource],
                [key]: value
            }
        }));
    }, []);

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

    const handleDownload = useCallback(async (resource: AdminDataResource) => {
        if (!userId) return;
        setNotice(null);
        setActionFlag(resource, 'downloading', true);
        try {
            const { blob, fileName } = await ApiService.exportAdminUserResource(userId, resource);
            const blobUrl = globalThis.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            globalThis.URL.revokeObjectURL(blobUrl);
            setNotice({ type: 'success', message: `Téléchargement des ${RESOURCE_LABELS[resource]} terminé.` });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Téléchargement impossible.';
            setNotice({ type: 'error', message });
        } finally {
            setActionFlag(resource, 'downloading', false);
        }
    }, [setActionFlag, userId]);

    const handleUpload = useCallback(async (resource: AdminDataResource, file: File) => {
        if (!userId) return;
        setNotice(null);
        setActionFlag(resource, 'uploading', true);
        try {
            const result = await ApiService.importAdminUserResource(userId, resource, file, 'append');
            const summaryParts: string[] = [];
            if (result.inserted) {
                summaryParts.push(`${result.inserted} ajoutés`);
            }
            if (result.updated) {
                summaryParts.push(`${result.updated} mis à jour`);
            }
            if (result.removed) {
                summaryParts.push(`${result.removed} supprimés`);
            }
            const summary = summaryParts.length > 0 ? ` (${summaryParts.join(', ')})` : '';
            setNotice({ type: 'success', message: `Téléversement des ${RESOURCE_LABELS[resource]} réussi${summary}.` });
            await fetchAll();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Téléversement impossible.';
            setNotice({ type: 'error', message });
        } finally {
            setActionFlag(resource, 'uploading', false);
        }
    }, [fetchAll, setActionFlag, userId]);

    const triggerUploadDialog = useCallback((resource: AdminDataResource) => {
        setNotice(null);
        const ref = fileInputRefs.current[resource];
        ref?.click();
    }, []);

    const handleFileChange = useCallback((resource: AdminDataResource, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            void handleUpload(resource, file);
        }
        event.target.value = '';
    }, [handleUpload]);

    const renderResourceActions = (resource: AdminDataResource) => (
        <>
            <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => void handleDownload(resource)}
                    disabled={actionState[resource].downloading}
                >
                    {actionState[resource].downloading ? 'Téléchargement...' : 'Télécharger'}
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => triggerUploadDialog(resource)}
                    disabled={actionState[resource].uploading}
                >
                    {actionState[resource].uploading ? 'Téléversement...' : 'Téléverser'}
                </button>
            </div>
            <input
                type="file"
                accept="application/json"
                ref={(ref) => {
                    fileInputRefs.current[resource] = ref;
                }}
                className="d-none"
                onChange={(event) => handleFileChange(resource, event)}
                aria-label={`Téléverser des ${RESOURCE_LABELS[resource]}`}
            />
        </>
    );

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
            <h1>Détails de l'utilisateur</h1>
            <div className="mb-3">
                <Link to="/admin/dashboard" className="btn btn-outline-secondary btn-sm">Retour</Link>
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
                            {renderResourceActions('folders')}
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
                            {renderResourceActions('quizzes')}
                            {quizzes.length === 0 ? (
                                <Typography className="text-muted">Aucun quiz trouvé.</Typography>
                            ) : (
                                <ul className="list-unstyled">
                                    {quizzes.map((q) => (
                                        <li key={q._id} className="mb-2">
                                            <Link to={`/teacher/editor-quiz-v2/${q._id}`} className="text-decoration-none">{q.title}</Link>
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
                            {renderResourceActions('images')}
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
                            {renderResourceActions('rooms')}
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
