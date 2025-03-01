// EditorQuiz.tsx
import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FolderType } from '../../../Types/FolderType';

import Editor from 'src/components/Editor/Editor';
import GiftCheatSheet from 'src/components/GIFTCheatSheet/GiftCheatSheet';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';

import { QuizType } from '../../../Types/QuizType';

import './editorQuiz.css';
import { Button, TextField, NativeSelect, Divider, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';
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
    const [value, setValue] = useState('');
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
                setValue(quiz.content.join('\n\n'));

            } catch (error) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                console.error('Error fetching quiz:', error);
                navigate('/teacher/dashboard');
            }
        };

        fetchData();
    }, [id]);

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

    const handleQuizTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuizTitle(event.target.value);
    };

    const handleQuizSave = async () => {
        try {
            // check if everything is there
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

            navigate('/teacher/dashboard');
        } catch (error) {
            window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
            console.log(error)
        }
    };

    // I do not know what this does but do not remove
    if (!isNewQuiz && !quiz) {
        return <div>Chargement...</div>;
    }

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

    return (
        <div className='quizEditor'>

            <div className='editHeader'>
                <ReturnButton
                    askConfirm
                    message={`Êtes-vous sûr de vouloir quitter l'éditeur sans sauvegarder le questionnaire?`}
                />

                <div className='title'>Éditeur de quiz</div>

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
                        label="Contenu GIFT du quiz:"
                        initialValue={value}
                        onEditorChange={handleUpdatePreview} />

                    <div className='images'>
                        <div className='upload'>
                            <label className="dropArea">
                                <input type="file" id="file-input" className="file-input"
                                accept="image/jpeg, image/png"
                                multiple 
                                ref={fileInputRef} />

                                <Button
                                variant="outlined"
                                aria-label='Téléverser'
                                onClick={handleSaveImage}>
                                    Téléverser <Upload /> 
                                </Button>

                            </label>
                            <Dialog
                                open={dialogOpen}
                                onClose={() => setDialogOpen(false)} >
                                <DialogTitle>Erreur</DialogTitle>
                                <DialogContent>
                                    Veuillez d&apos;abord choisir une image à téléverser.
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setDialogOpen(false)} color="primary">
                                        OK
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </div>

                        <h4>Mes images :</h4>
                        <div>
                                <div>
                                <div style={{ display: "inline" }}>(Voir section </div>
                                    <a href="#images-section"style={{ textDecoration: "none" }} onClick={scrollToImagesSection}>
                                        <u><em><h4 style={{ display: "inline" }}> 9. Images </h4></em></u>
                                    </a>
                                <div style={{ display: "inline" }}> ci-dessous</div>
                                <div style={{ display: "inline" }}>)</div>
                                <br />
                                <em> - Cliquez sur un lien pour le copier</em>
                                </div>                            
                                <ul>
                                {imageLinks.map((link, index) => {
                                    const imgTag = `![alt_text](${escapeForGIFT(link)} "texte de l'infobulle")`;
                                    return (
                                        <li key={index}>
                                            <code
                                                onClick={() => handleCopyToClipboard(imgTag)}>
                                                {imgTag}
                                            </code>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    <GiftCheatSheet />

                </div>

                <div className='preview'>
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
