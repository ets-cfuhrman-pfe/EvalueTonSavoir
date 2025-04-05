// EditorQuiz.tsx
import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FolderType } from '../../../Types/FolderType';

import Editor from 'src/components/Editor/Editor';
import GiftCheatSheet from 'src/components/GIFTCheatSheet/GiftCheatSheet';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';

import { QuizType } from '../../../Types/QuizType';

import './editorQuiz.css';
import { Button, TextField, NativeSelect, Divider, Dialog, DialogTitle, DialogActions, DialogContent, Snackbar } from '@mui/material';
import ReturnButton from 'src/components/ReturnButton/ReturnButton';

import ApiService from '../../../services/ApiService';
import { escapeForGIFT } from '../../../utils/giftUtils';
import { Upload } from '@mui/icons-material';

interface EditQuizParams {
    id: string;
    [key: string]: string | undefined;
}

const QuizForm: React.FC = () => {
    const [quizTitle, setQuizTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [filteredValue, setFilteredValue] = useState<string[]>([]);

    const { id } = useParams<EditQuizParams>();
    const [values, setValues] = useState<string[]>([]);
    const [isNewQuiz, setNewQuiz] = useState(false);
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const navigate = useNavigate();
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const handleSelectFolder = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFolder(event.target.value);
    };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const [isImagesCollapsed, setIsImagesCollapsed] = useState(true);
    const [isCheatSheetCollapsed, setIsCheatSheetCollapsed] = useState(true);
    const [isUploadCollapsed, setIsUploadCollapsed] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

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
                    setNewQuiz(true);
                    return;
                }

                const quiz = await ApiService.getQuiz(id) as QuizType;

                if (!quiz) {
                    window.alert(`Une erreur est survenue.\n Le quiz ${id} n'a pas été trouvé\nVeuillez réessayer plus tard`)
                    console.error('Quiz not found for id:', id);
                    navigate('/teacher/dashboard');
                    return;
                }

                setQuiz(quiz as QuizType);
                const { title, content, folderId } = quiz;

                setQuizTitle(title);
                setSelectedFolder(folderId);
                setFilteredValue(content);
                setValues(content);

            } catch (error) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                console.error('Error fetching quiz:', error);
                navigate('/teacher/dashboard');
            }
        };

        fetchData();
    }, [id]);

    const handleAddQuestion = () => {
        console.log("Adding question");
        console.log("Current values:", values); // Log current state
        setValues([...values, '']);
        console.log("Updated values:", [...values, '']); // Log new state
    };

    const handleUpdatePreview = (newValues: string[]) => {
        setValues(newValues);
        setFilteredValue(newValues.filter(value => value.trim() !== ''));
    };

    const handleQuizTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuizTitle(event.target.value);
    };

    const handleQuizSave = async () => {
        try {
            if (quizTitle == '') {
                alert("Veuillez choisir un titre");
                return;
            }

            if (selectedFolder == '') {
                alert("Veuillez choisir un dossier");
                return;
            }

            if (isNewQuiz) {
                await ApiService.createQuiz(quizTitle, filteredValue, selectedFolder);
            } else {
                if (quiz) {
                    await ApiService.updateQuiz(quiz._id, quizTitle, filteredValue);
                }
            }

            setSnackbarMessage('Quiz enregistré avec succès!');
            setSnackbarOpen(true);
        } catch (error) {
            window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
            console.log(error)
        }
    };

    // I do not know what this does but do not remove
    if (!isNewQuiz && !quiz) {
        return <div>Chargement...</div>;
    }

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleSaveImage = async () => {
        try {
            const inputElement = document.getElementById('file-input') as HTMLInputElement;

            if (!inputElement?.files || inputElement.files.length === 0) {
                setDialogOpen(true);
                return;
            }

            if (!inputElement.files || inputElement.files.length === 0) {
                window.alert("Veuillez d'abord choisir une image à téléverser.")
                return;
            }

            const imageUrl = await ApiService.uploadImage(inputElement.files[0]);

            // Check for errors
            if(imageUrl.indexOf("ERROR") >= 0) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                return;
            }

            setImageLinks(prevLinks => [...prevLinks, imageUrl]);

            // Reset the file input element
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            window.alert(`Une erreur est survenue.\n${error}\nVeuillez réessayer plus tard.`)

        }
    };

    const handleCopyToClipboard = async (link: string) => {
        navigator.clipboard.writeText(link);
    }

    const handleFocusQuestion = (index: number) => {
        const previewElement = document.querySelector('.preview-column');
        if (previewElement) {
            const questionElements = previewElement.querySelectorAll('.question-item');
            if (questionElements[index]) {
                questionElements[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className='quizEditor'>

            <div className='editHeader'>
                <ReturnButton
                    quizTitle={quizTitle}
                    quizContent={filteredValue}
                    quizFolder={selectedFolder}
                    quizId={quiz?._id}
                    isNewQuiz={isNewQuiz}
                />

                <div className='title'>Éditeur de Quiz</div>

                <div className='dumb'></div>
            </div>

            {/* <h2 className="subtitle">Éditeur</h2> */}

            <TextField
                onChange={handleQuizTitleChange}
                value={quizTitle}
                placeholder="Titre du quiz"
                label="Titre du quiz"
                fullWidth
            />
            <label>Choisir un dossier:
            <NativeSelect
                id="select-folder"
                color="primary"
                value={selectedFolder}
                onChange={handleSelectFolder}
                disabled={!isNewQuiz}
                style={{ marginBottom: '16px' }} // Ajout de marge en bas
                >
                <option disabled value=""> Choisir un dossier... </option>

                {folders.map((folder: FolderType) => (
                    <option value={folder._id} key={folder._id}> {folder.title} </option>
                ))}
            </NativeSelect></label>

            <Button variant="contained" onClick={handleQuizSave}>
                Enregistrer
            </Button>

            <Divider style={{ margin: '16px 0' }} />

            <div className='editSection'>

                <div className='edit'>
                    <Editor
                        label=""
                        values={values}
                        onValuesChange={handleUpdatePreview}
                        onFocusQuestion={handleFocusQuestion} />
                    <Button variant="contained" onClick={handleAddQuestion}>
                        Ajouter une question 
                    </Button>
 
                 <div className="images">
                        {/* Collapsible Upload Section */}
                        <div style={{ marginTop: '8px' }}>
                            <Button
                                variant="outlined"
                                onClick={() => setIsUploadCollapsed(!isUploadCollapsed)}
                                style={{ padding: '4px 8px', fontSize: '12px', marginBottom: '4px', width: '40%' }}
                            >
                                {isUploadCollapsed ? 'Afficher Téléverser image' : 'Masquer Téléverser image'}
                            </Button>
                            {!isUploadCollapsed && (
                                <div className="upload">
                                    <label className="dropArea">
                                        <input
                                            type="file"
                                            id="file-input"
                                            className="file-input"
                                            accept="image/jpeg, image/png"
                                            multiple
                                            ref={fileInputRef}
                                        />
                                        <Button
                                            variant="outlined"
                                            aria-label="Téléverser"
                                            onClick={handleSaveImage}
                                        >
                                            Téléverser <Upload />
                                        </Button>
                                    </label>
                                    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                                        <DialogTitle>Erreur</DialogTitle>
                                        <DialogContent>
                                            Veuillez d'abord choisir une image à téléverser.
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => setDialogOpen(false)} color="primary">
                                                OK
                                            </Button>
                                        </DialogActions>
                                    </Dialog>
                                </div>
                            )}
                        </div>

                        {/* Collapsible Images Section */}
                        <div style={{ marginTop: '2px' }}>
                            <Button
                                variant="outlined"
                                onClick={() => setIsImagesCollapsed(!isImagesCollapsed)}
                                style={{ padding: '4px 8px', fontSize: '12px', marginBottom: '4px', width: '40%' }}
                            >
                                {isImagesCollapsed ? 'Afficher Mes images' : 'Masquer Mes images'}
                            </Button>
                            {!isImagesCollapsed && (
                                <div>
                                    <h4>Mes images :</h4>
                                    <div>
                                        <div>
                                            <div style={{ display: 'inline' }}>(Voir section </div>
                                            <a
                                                href="#images-section"
                                                style={{ textDecoration: 'none' }}
                                                onClick={scrollToImagesSection}
                                            >
                                                <u>
                                                    <em>
                                                        <h4 style={{ display: 'inline' }}> 9. Images </h4>
                                                    </em>
                                                </u>
                                            </a>
                                            <div style={{ display: 'inline' }}> ci-dessous</div>
                                            <div style={{ display: 'inline' }}>)</div>
                                            <br />
                                            <em> - Cliquez sur un lien pour le copier</em>
                                        </div>
                                        <ul>
                                            {imageLinks.map((link, index) => {
                                                const imgTag = `![alt_text](${escapeForGIFT(link)} "texte de l'infobulle")`;
                                                return (
                                                    <li key={index}>
                                                        <code onClick={() => handleCopyToClipboard(imgTag)}>
                                                            {imgTag}
                                                        </code>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Collapsible CheatSheet Section */}
                        <div style={{ marginTop: '2px' }}>
                            <Button
                                variant="outlined"
                                onClick={() => setIsCheatSheetCollapsed(!isCheatSheetCollapsed)}
                                style={{ padding: '4px 8px', fontSize: '12px', marginBottom: '4px', width: '40%' }}
                            >
                                {isCheatSheetCollapsed ? 'Afficher CheatSheet' : 'Masquer CheatSheet'}
                            </Button>
                            {!isCheatSheetCollapsed && <GiftCheatSheet />}
                        </div>
                    </div>
                </div>

                <div className="preview">
                    <div className="preview-column">
                        <h4>Prévisualisation</h4>
                        <div>
                            <GIFTTemplatePreview questions={filteredValue} />
                        </div>
                    </div>
                </div>
            </div>

            {showScrollButton && (
                <Button
                    onClick={scrollToTop}
                    variant="contained"
                    color="primary"
                    style={scrollToTopButtonStyle}
                    title="Scroll to top"
                >
                    ↑
                </Button>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000} // Hide after 3 seconds
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Lower-right corner
            />
        </div>
    );
}; 

const scrollToTopButtonStyle: CSSProperties = {
    position: 'fixed',
    bottom: '40px',
    right: '50px',
    padding: '10px',
    fontSize: '16px',
    color: 'white',
    backgroundColor: '#5271ff',
    border: 'none',
    cursor: 'pointer',
    zIndex: 1000,
};

export default QuizForm;
