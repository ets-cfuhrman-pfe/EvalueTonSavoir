import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import { ENV_VARIABLES } from '../../constants';
import { QuizType } from 'src/Types/QuizType';
import { ImagesResponse } from 'src/Types/Images';
import { FolderType } from 'src/Types/FolderType';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar } from '@mui/material';

const AdminUserDetails: React.FC = () => {
    const params = useParams();
    const location = useLocation();
    const userId = params.id as string;
    const user = (location.state as any)?.user;

    const [folders, setFolders] = useState<FolderType[]>([]);
    const [quizzes, setQuizzes] = useState<QuizType[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [rooms, setRooms] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [foldersRes, quizzesRes, imagesRes, roomsRes] = await Promise.all([
                    ApiService.getUserFoldersByUserId(userId),
                    ApiService.getQuizzesByUserId(userId),
                    ApiService.getUserImagesByUserId(userId, 1, 50),
                    ApiService.getRoomTitleByUserId(userId)
                ]);

                if (Array.isArray(foldersRes)) setFolders(foldersRes as FolderType[]);
                else setFolders([]);

                if (Array.isArray(quizzesRes)) setQuizzes(quizzesRes as QuizType[]);
                else setQuizzes([]);

                if (imagesRes && typeof imagesRes === 'object' && 'images' in imagesRes) {
                    setImages((imagesRes as ImagesResponse).images || []);
                } else {
                    setImages([]);
                }

                if (Array.isArray(roomsRes)) setRooms(roomsRes as string[]);
                else setRooms([]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des données utilisateur');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
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
            <h1>Détails de l'utilisateur</h1>
            <div className="mb-3">
                <Link to="/admin/dashboard" className="btn btn-outline-secondary btn-sm">Retour</Link>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                        <Avatar className="me-3">{user?.name?.charAt(0) || 'U'}</Avatar>
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
                                <div className="d-flex gap-3 flex-wrap">
                                    {images.map((img: any) => (
                                        <div key={img.id} className="border rounded p-1" style={{ width: 120 }}>
                                            <img src={`${ENV_VARIABLES.VITE_BACKEND_URL}/api/image/get/${img.id}`} alt={img.file_name || "image"} className="img-fluid" />
                                            <div className="small text-muted text-truncate">{img.file_name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AccordionDetails>
                    </Accordion>

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
