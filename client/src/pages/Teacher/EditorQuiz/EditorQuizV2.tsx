// EditorQuizV2.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FolderType } from '../../../Types/FolderType';

import EditorV2 from 'src/components/Editor/EditorV2';
import GiftCheatSheetV2 from 'src/components/GIFTCheatSheet/GiftCheatSheetV2';
import GIFTTemplatePreviewV2 from 'src/components/GiftTemplate/GIFTTemplatePreviewV2';

import { QuizType } from '../../../Types/QuizType';
import SaveIcon from '@mui/icons-material/Save';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Button, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import ReturnButtonV2 from 'src/components/ReturnButton/ReturnButtonV2';
import ImageGalleryModalV2 from 'src/components/ImageGallery/ImageGalleryModal/ImageGalleryModalV2';

import ApiService from '../../../services/ApiService';
import { escapeForGIFT } from '../../../utils/giftUtils';
import { ENV_VARIABLES } from 'src/constants';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

interface EditQuizParams {
    id: string;
    [key: string]: string | undefined;
}

const EditorQuizV2: React.FC = () => {
    const { id } = useParams<EditQuizParams>();
    const [quizTitle, setQuizTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [filteredValue, setFilteredValue] = useState<string[]>([]);
    const [value, setValue] = useState('');
    const [isNewQuiz] = useState(!id || id === 'new');
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [isLoading, setIsLoading] = useState(id !== 'new' && !!id);
    const navigate = useNavigate();
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveNotification, setSaveNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollButton(true);
            } else {
                setShowScrollButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToImagesSection = (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        const section = document.getElementById('images-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const userFolders = await ApiService.getUserFolders();
            setFolders(userFolders as FolderType[]);
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id || id === 'new') {
                    // Already handled in initial state
                    return;
                }

                const quiz = await ApiService.getQuiz(id);

                if (!quiz || typeof quiz === 'string') {
                    window.alert(`Une erreur est survenue.\n Le quiz ${id} n'a pas été trouvé\nVeuillez réessayer plus tard`)
                    console.error('Quiz not found for id:', id);
                    navigate('/teacher/dashboard-v2');
                    return;
                }

                setQuiz(quiz);
                const { title, content, folderId } = quiz;

                setQuizTitle(title);
                setSelectedFolder(folderId);
                setFilteredValue(content);
                setValue(quiz.content.join('\n\n'));
                setIsLoading(false);

            } catch (error) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                console.error('Error fetching quiz:', error);
                navigate('/teacher/dashboard-v2');
            }
        };

        fetchData();
    }, [id, navigate]);

    function handleUpdatePreview(value: string) {
        if (value !== '') {
            setValue(value);
        }

        // split value when there is at least one blank line
        const linesArray = value.split(/\n{2,}/);

        // if the first item in linesArray is blank, remove it
        if (linesArray[0] === '') linesArray.shift();

        if (linesArray[linesArray.length - 1] === '') linesArray.pop();

        setFilteredValue(linesArray);
    }

    const handleQuizSave = async () => {
        try {
            // check if everything is there
            if (quizTitle == '') {
                setSaveNotification({
                    open: true,
                    message: 'Veuillez saisir un titre pour le quiz',
                    severity: 'error'
                });
                return;
            }

            if (selectedFolder == '') {
                setSaveNotification({
                    open: true,
                    message: 'Veuillez choisir un dossier',
                    severity: 'error'
                });
                return;
            }

            setIsSaving(true);

            if (isNewQuiz) {
                await ApiService.createQuiz(quizTitle, filteredValue, selectedFolder);
                setSaveNotification({
                    open: true,
                    message: 'Quiz créé avec succès !',
                    severity: 'success'
                });
            } else if (quiz) {
                await ApiService.updateQuiz(quiz._id, quizTitle, filteredValue);
                setSaveNotification({
                    open: true,
                    message: 'Quiz mis à jour avec succès !',
                    severity: 'success'
                });
            }

        } catch (error) {
            console.error('Save error:', error);
            setSaveNotification({
                open: true,
                message: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
                severity: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuizSaveAndExit = async () => {
        try {
            // check if everything is there
            if (quizTitle == '') {
                setSaveNotification({
                    open: true,
                    message: 'Veuillez saisir un titre pour le quiz',
                    severity: 'error'
                });
                return;
            }

            if (selectedFolder == '') {
                setSaveNotification({
                    open: true,
                    message: 'Veuillez choisir un dossier',
                    severity: 'error'
                });
                return;
            }

            setIsSaving(true);

            if (isNewQuiz) {
                await ApiService.createQuiz(quizTitle, filteredValue, selectedFolder);
                setSaveNotification({
                    open: true,
                    message: 'Quiz créé avec succès ! Redirection en cours...',
                    severity: 'success'
                });
            } else if (quiz) {
                await ApiService.updateQuiz(quiz._id, quizTitle, filteredValue);
                setSaveNotification({
                    open: true,
                    message: 'Quiz mis à jour avec succès ! Redirection en cours...',
                    severity: 'success'
                });
            }

            // Navigate after successful save

            navigate('/teacher/dashboard-v2');
        } catch (error) {
            console.error('Save error:', error);
            setSaveNotification({
                open: true,
                message: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
                severity: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state for existing quiz
    if (!isNewQuiz && isLoading) {
        return (
            <div className="content-container">
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="text-center">
                        <output className="spinner-border text-primary mb-3" aria-hidden="true"></output>
                        <div className="text-primary fs-5">Chargement du quiz...</div>
                    </div>
                </div>
            </div>
        );
    }

    const handleCopyToClipboard = async (link: string) => {
        navigator.clipboard.writeText(link);
    }

    const handleCopyImage = (id: string) => {
        const escLink = `${ENV_VARIABLES.BACKEND_URL}/api/image/get/${id}`;
        setImageLinks(prevLinks => [...prevLinks, escLink]);
    }

    const handleCloseNotification = () => {
        setSaveNotification(prev => ({ ...prev, open: false }));
    }

    return (
        <div className="content-container">
            <div className="w-100 p-0 content-full-width">
                {/* Top Header */}
                <div className="bg-white border-bottom shadow-sm">
                    <div className="container-fluid px-2 py-4 content-full-width">
                        <div className="d-flex justify-content-between align-items-center px-4">
                            <div className="d-flex align-items-center gap-3">
                                <h1 className="h3 mb-0 text-dark fw-bold">Éditeur de quiz</h1>
                            </div>

                            <div className="d-flex align-items-center gap-3">
                              
                                <Button
                                    variant="contained"
                                    onClick={handleQuizSave}
                                    startIcon={<SaveIcon />}
                                    size="large"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleQuizSaveAndExit}
                                    startIcon={<SaveIcon />}
                                    size="large"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer et quitter'}
                                </Button>

                                  <ReturnButtonV2
                                    askConfirm
                                    message={`Êtes-vous sûr de vouloir quitter l'éditeur sans sauvegarder le questionnaire?`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container-fluid px-4 py-4">
                    {/* Quiz Configuration Card */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <ValidatedTextField
                                        fieldPath="quiz.title"
                                        initialValue={quizTitle}
                                        onValueChange={(value) => setQuizTitle(value)}
                                        label="Titre du quiz"
                                        placeholder="Titre du quiz"
                                        fullWidth
                                        variant="outlined"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="select-folder-label">Dossier</InputLabel>
                                        <Select
                                            labelId="select-folder-label"
                                            id="select-folder"
                                            value={selectedFolder}
                                            onChange={(event) => setSelectedFolder(event.target.value)}
                                            disabled={!isNewQuiz}
                                            label="Dossier"
                                        >
                                            <MenuItem disabled value="">
                                                <em>Choisir un dossier...</em>
                                            </MenuItem>
                                            {folders.map((folder: FolderType) => (
                                                <MenuItem value={folder._id} key={folder._id}>
                                                    {folder.title}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Main Editor Section */}
                    <div className="row g-0 min-vh-75">
                        {/* Left Column */}
                        <div className="col-lg-6 border-end">
                            <div className="h-100 d-flex flex-column gap-3 p-3 overflow-auto">
                                {/* GIFT Editor */}
                                <div className="flex-shrink-0">
                                    <EditorV2
                                        label="Contenu GIFT du quiz:"
                                        initialValue={value}
                                        onEditorChange={handleUpdatePreview}
                                    />
                                </div>

                                {/* Images Section */}
                                <div className="flex-shrink-0">
                                    <div className="border rounded p-3 bg-light">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <h5 className="mb-0">Mes images :</h5>
                                            <ImageGalleryModalV2 handleCopy={handleCopyImage} />
                                        </div>

                                        <div>
                                            <p className="mb-2 text-muted">
                                                <span>(Voir section </span>
                                                <a
                                                    href="#images-section"
                                                    className="text-decoration-none fw-bold"
                                                    onClick={scrollToImagesSection}
                                                >
                                                    <em><strong>9. Images</strong></em>
                                                </a>
                                                <span> ci-dessous)</span>
                                            </p>
                                            <em className="text-muted small">- Cliquez sur un lien pour le copier</em>

                                            {imageLinks.length > 0 ? (
                                                <ul className="list-unstyled mt-2">
                                                    {imageLinks.map((link, index) => {
                                                        const imgTag = `[markdown]![alt_text](${escapeForGIFT(link)} "texte de l'infobulle") {T}`;
                                                        return (
                                                            <li key={`image-link-${link}-${index}`} className="mb-2">
                                                                <button
                                                                    className="btn btn-light text-start w-100 p-2 border rounded"
                                                                    onClick={() => handleCopyToClipboard(imgTag)}
                                                                    type="button"
                                                                >
                                                                    <code className="text-break small">{imgTag}</code>
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <div className="text-center text-muted py-2 mt-2">
                                                    <em>Aucune image ajoutée</em>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* GIFT Cheat Sheet */}
                                <div className="flex-shrink-0">
                                    <GiftCheatSheetV2 />
                                </div>
                            </div>
                        </div>                        {/* Right Column - Preview */}
                        <div className="col-lg-6">
                            <div className="h-100 d-flex flex-column p-3 overflow-auto">
                                <div className="mb-3">
                                    <h5>Prévisualisation</h5>
                                </div>
                                <div className="flex-grow-1">
                                    <GIFTTemplatePreviewV2 questions={filteredValue} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll to Top Button */}
                {showScrollButton && (
                    <Button
                        onClick={scrollToTop}
                        variant="contained"
                        color="primary"
                        className="btn-scroll-to-top position-fixed rounded-circle"
                        title="Scroll to top"
                    >
                        <KeyboardArrowUpIcon />
                    </Button>
                )}

                {/* Save Notification Snackbar */}
                <Snackbar
                    open={saveNotification.open}
                    autoHideDuration={4000}
                    onClose={handleCloseNotification}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseNotification}
                        severity={saveNotification.severity}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {saveNotification.message}
                    </Alert>
                </Snackbar>
            </div>
        </div>
    );
};

export default EditorQuizV2;