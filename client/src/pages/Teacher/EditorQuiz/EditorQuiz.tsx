// EditorQuiz.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FolderType } from '../../../Types/FolderType';

import Editor from 'src/components/Editor/Editor';
import GiftCheatSheetV2 from 'src/components/GIFTCheatSheet/GiftCheatSheetV2';
import GIFTTemplatePreviewV2 from 'src/components/GiftTemplate/GIFTTemplatePreviewV2';
import ReturnButtonV2 from 'src/components/ReturnButton/ReturnButtonV2';

import { QuizType } from '../../../Types/QuizType';
import SaveIcon from '@mui/icons-material/Save';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PrintIcon from '@mui/icons-material/Print';
import { Button, FormControl, FormControlLabel, InputLabel, Select, MenuItem, Snackbar, Alert, Switch } from '@mui/material';
import ImageGalleryModalV2 from 'src/components/ImageGallery/ImageGalleryModal/ImageGalleryModalV2';

import ApiService from '../../../services/ApiService';
import { escapeForGIFT } from '../../../utils/giftUtils';
import { splitGiftSource } from 'src/utils/giftBlockSplitter';
import { ENV_VARIABLES } from 'src/constants';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

interface EditQuizParams {
    id: string;
    [key: string]: string | undefined;
}

interface QuestionRange {
    index: number;
    start: number;
    end: number;
}

function splitQuestionsAndRanges(text: string): { questions: string[]; ranges: QuestionRange[] } {
    const { questions, ranges } = splitGiftSource(text);
    return { questions, ranges };
}

function findQuestionIndexByCaret(ranges: QuestionRange[], caretOffset: number): number | null {
    if (ranges.length === 0) return null;

    for (const range of ranges) {
        if (caretOffset >= range.start && caretOffset < range.end) {
            return range.index;
        }
    }

    const lastRange = ranges.at(-1);
    if (!lastRange) return null;

    if (caretOffset >= lastRange.end) {
        return lastRange.index;
    }

    return null;
}

const EditorQuiz: React.FC = () => {
    const { id } = useParams<EditQuizParams>();
    const [quizTitle, setQuizTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [filteredValue, setFilteredValue] = useState<string[]>([]);
    const [value, setValue] = useState('');
    const [isNewQuiz, setIsNewQuiz] = useState(!id || id === 'new');
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [isLoading, setIsLoading] = useState(id !== 'new' && !!id);
    const navigate = useNavigate();
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [hideAnswers, setHideAnswers] = useState(false);
    const [questionRanges, setQuestionRanges] = useState<QuestionRange[]>([]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
    const [initialQuizState, setInitialQuizState] = useState<{
        title: string;
        content: string;
        folderId: string;
    } | null>(null);
    const [saveNotification, setSaveNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const isDraggingRef = useRef(false);
    const splitPaneRef = useRef<HTMLDivElement>(null);
    const [leftPanePercent, setLeftPanePercent] = useState(50);

    const setPaneWidth = useCallback((newPercentage: number) => {
        const clamped = Math.min(80, Math.max(20, newPercentage));
        setLeftPanePercent(clamped);
        if (splitPaneRef.current) {
            splitPaneRef.current.style.setProperty('--left-pane-width', `${clamped}%`);
        }
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const newPercentage = (e.clientX / window.innerWidth) * 100;
        setPaneWidth(newPercentage);
    }, [setPaneWidth]);

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
        
        // Remove iframe pointer-events overlay if it exists
        const overlay = document.getElementById('iframe-drag-overlay');
        if (overlay) overlay.remove();
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDraggingRef.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        // Add overlay to prevent iframes from stealing mouse events during drag
        const overlay = document.createElement('div');
        overlay.id = 'iframe-drag-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '9999';
        overlay.style.cursor = 'col-resize';
        document.body.appendChild(overlay);

        e.preventDefault();
    }, [handleMouseMove, handleMouseUp]);

    const handleDividerKeyDown = useCallback((e: React.KeyboardEvent) => {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setPaneWidth(leftPanePercent - step);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setPaneWidth(leftPanePercent + step);
        } else if (e.key === 'Home') {
            e.preventDefault();
            setPaneWidth(20);
        } else if (e.key === 'End') {
            e.preventDefault();
            setPaneWidth(80);
        }
    }, [leftPanePercent, setPaneWidth]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            
            const overlay = document.getElementById('iframe-drag-overlay');
            if (overlay) overlay.remove();
        };
    }, [handleMouseMove, handleMouseUp]);

        const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const checkForUnsavedChanges = useCallback(() => {
        if (!initialQuizState) return false;

        const currentState = {
            title: quizTitle,
            content: value,
            folderId: selectedFolder,
        };

        return (
            currentState.title !== initialQuizState.title ||
            currentState.content !== initialQuizState.content ||
            currentState.folderId !== initialQuizState.folderId
        );
    }, [quizTitle, value, selectedFolder, initialQuizState]);

    const updateUnsavedChangesState = useCallback(() => {
        setHasUnsavedChanges(checkForUnsavedChanges());
    }, [checkForUnsavedChanges]);

    const applyEditorValue = useCallback((text: string) => {
        setValue(text);
        const { questions, ranges } = splitQuestionsAndRanges(text);
        setFilteredValue(questions);
        setQuestionRanges(ranges);
    }, []);

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
            setFolders(userFolders);
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id || id === 'new') {
                    // For new quiz, set initial state
                    setInitialQuizState({
                        title: '',
                        content: '',
                        folderId: '',
                    });
                    return;
                }

                const quiz = await ApiService.getQuiz(id);

                if (!quiz || typeof quiz === 'string') {
                    window.alert(`Une erreur est survenue.\n Le quiz ${id} n'a pas été trouvé\nVeuillez réessayer plus tard`)
                    console.error('Quiz not found for id:', id);
                    navigate('/teacher/dashboard');
                    return;
                }
                setQuiz(quiz as QuizType);
                const { title, content, folderId } = quiz as QuizType;


                setQuizTitle(title);
                setSelectedFolder(folderId);

                // content arrives normalized as string[] from ApiService
                const normalizedContent = content.join('\n\n');
                applyEditorValue(normalizedContent);
                
                // Set initial state for existing quiz
                setInitialQuizState({
                    title,
                    content: normalizedContent,
                    folderId,
                });
                
                setIsLoading(false);

            } catch (error) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                console.error('Error fetching quiz:', error);
                navigate('/teacher/dashboard');
            }
        };

        fetchData();
    }, [id, navigate, applyEditorValue]);

    // Track changes to determine if there are unsaved changes
    useEffect(() => {
        updateUnsavedChangesState();
    }, [updateUnsavedChangesState]);

    function handleUpdatePreview(value: string) {
        applyEditorValue(value);
    }

    const handleEditorCursorChange = useCallback((caretOffset: number) => {
        setActiveQuestionIndex(findQuestionIndexByCaret(questionRanges, caretOffset));
    }, [questionRanges]);

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
                const quizId = await ApiService.createQuiz(quizTitle, filteredValue, selectedFolder);
                if (typeof quizId === 'string' && quizId.includes(' ')) {
                    // Error occurred 
                    setSaveNotification({
                        open: true,
                        message: quizId,
                        severity: 'error'
                    });
                } else {
                    // Successfully created quiz, now switch to edit mode
                    const createdQuiz = await ApiService.getQuiz(quizId);
                    if (createdQuiz && typeof createdQuiz !== 'string') {
                        setQuiz(createdQuiz);
                        setIsNewQuiz(false);
                        // Update URL without causing a page reload
                        navigate(`/teacher/editor-quiz/${quizId}`, { replace: true });
                        setSaveNotification({
                            open: true,
                            message: 'Quiz créé avec succès !',
                            severity: 'success'
                        });
                    } else {
                        throw new Error('Failed to fetch created quiz');
                    }
                }
            } else if (quiz) {
                const updateResult = await ApiService.updateQuiz(quiz._id, quizTitle, filteredValue);
                if (typeof updateResult === 'string' && updateResult.includes(' ')) {
                    // Error occurred - string contains spaces, so it's an error message
                    setSaveNotification({
                        open: true,
                        message: updateResult,
                        severity: 'error'
                    });
                } else {
                    // Success
                    setSaveNotification({
                        open: true,
                        message: 'Quiz mis à jour avec succès !',
                        severity: 'success'
                    });
                    
                    // Update initial state to reflect saved changes
                    setInitialQuizState({
                        title: quizTitle,
                        content: value,
                        folderId: selectedFolder,
                    });
                }
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
                const quizId = await ApiService.createQuiz(quizTitle, filteredValue, selectedFolder);
                if (typeof quizId === 'string' && quizId.includes(' ')) {
                    // Error occurred
                    setSaveNotification({
                        open: true,
                        message: quizId,
                        severity: 'error'
                    });
                } else {
                    // Success
                    setSaveNotification({
                        open: true,
                        message: 'Quiz créé avec succès ! Redirection en cours...',
                        severity: 'success'
                    });

                    // Update initial state to reflect saved changes
                    setInitialQuizState({
                        title: quizTitle,
                        content: value,
                        folderId: selectedFolder,
                    });

                    // Navigate after successful save
                    navigate('/teacher/dashboard');
                }
            } else if (quiz) {
                const updateResult = await ApiService.updateQuiz(quiz._id, quizTitle, filteredValue);
                if (typeof updateResult === 'string' && updateResult.includes(' ')) {
                    // Error occurred
                    setSaveNotification({
                        open: true,
                        message: updateResult,
                        severity: 'error'
                    });
                } else {
                    // Success
                    setSaveNotification({
                        open: true,
                        message: 'Quiz mis à jour avec succès ! Redirection en cours...',
                        severity: 'success'
                    });

                    // Update initial state to reflect saved changes
                    setInitialQuizState({
                        title: quizTitle,
                        content: value,
                        folderId: selectedFolder,
                    });

                    // Navigate after successful save
                    navigate('/teacher/dashboard');
                }
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

    // Loading state for existing quiz
    if (!isNewQuiz && isLoading) {
        return (
            <div className="content-container editor-quiz-content-container">
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
        <div className="content-container editor-quiz-content-container">
            <div className="w-100 p-0 content-full-width">
                {/* Top Header */}
                <div
                    className="bg-white border-bottom shadow-sm no-print position-sticky top-0"
                    style={{ zIndex: 1030 }}
                >
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
                                    hasUnsavedChanges={() => hasUnsavedChanges}
                                    onSaveAndQuit={handleQuizSaveAndExit}
                                    onDontSaveAndQuit={() => navigate('/teacher/dashboard')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container-fluid py-2 editor-main-content">
                    {/* Quiz Configuration Card */}
                    <div className="card mb-3 flex-shrink-0 no-print">
                        <div className="card-body py-3">
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
                                        size="small"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <FormControl fullWidth variant="outlined" size="small">
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
                                            {alphabeticalSort(folders).map((folder: FolderType) => (
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

                    {/* Main Editor Section - Scrollable Content Container */}
                    <div className="flex-grow-1 editor-main-scroll-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div ref={splitPaneRef} className="d-flex flex-column flex-lg-row h-100 w-100 editor-split-pane">
                            {/* Editor Column */}
                            <div 
                                className="border rounded d-flex flex-column h-100 editor-quiz-editor-col resizable-pane"
                            >
                                <div className="p-3 bg-white h-100 d-flex flex-column" style={{ maxHeight: '100%' }}>
                                 
                                    <div className="overflow-auto flex-grow-1 pe-2">
                                        {/* GIFT Editor */}
                                        
                                        <div className="mb-4">
                                            <Editor
                                                label="Contenu GIFT du quiz:"
                                                initialValue={value}
                                                onEditorChange={handleUpdatePreview}
                                                onCursorChange={handleEditorCursorChange}
                                            />
                                        </div>

                                        {/* Images Section */}
                                        <div className="mb-4">
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
                                        <div className="mb-4">
                                            <GiftCheatSheetV2 />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Draggable Divider */}
                            <div 
                                className="d-none d-lg-flex flex-column justify-content-center align-items-center editor-draggable-divider"
                                role="separator"
                                aria-orientation="vertical"
                                aria-label="Redimensionner les panneaux"
                                aria-valuenow={leftPanePercent}
                                aria-valuemin={20}
                                aria-valuemax={80}
                                tabIndex={0}
                                onMouseDown={handleMouseDown}
                                onKeyDown={handleDividerKeyDown}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef' }}
                                onMouseLeave={(e) => { if (!isDraggingRef.current) e.currentTarget.style.backgroundColor = 'transparent' }}
                                title="Faites glisser pour redimensionner"
                            >
                                <div className="editor-draggable-divider-handle"></div>
                            </div>

                            {/* Preview Column */}
                            <div
                                className="d-flex flex-column h-100 editor-quiz-preview-col editor-preview-sticky-column"
                            >
                                <div className="border rounded p-3 bg-white h-100 d-flex flex-column" style={{ maxHeight: '100%' }}>
                                    <div className="mb-3 flex-shrink-0 d-flex align-items-center justify-content-between flex-wrap gap-2 no-print">
                                        <h4 className="mb-0">Prévisualisation</h4>
                                        <div className="d-flex align-items-center gap-2">
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={hideAnswers}
                                                        onChange={(e) => setHideAnswers(e.target.checked)}
                                                        size="small"
                                                    />
                                                }
                                                label="Masquer les réponses"
                                                sx={{ margin: 0 }}
                                            />
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<PrintIcon />}
                                                onClick={() => window.print()}
                                            >
                                                Imprimer
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1 p-3 bg-light overflow-auto pe-2 editor-preview-scroll-area">
                                        <div className="editor-quiz-print-title">{quizTitle}</div>
                                        <GIFTTemplatePreviewV2
                                            questions={filteredValue}
                                            hideAnswers={hideAnswers}
                                            activeQuestionIndex={activeQuestionIndex}
                                        />
                                    </div>
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

// Helper function for alphabetical sorting
function alphabeticalSort<T extends { title: string }>(items: T[]): T[] {
    return items.sort((a, b) => a.title.localeCompare(b.title));
}

export default EditorQuiz;
