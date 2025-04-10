import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FolderType } from '../../../Types/FolderType';

import NewEditor from 'src/components/Editor/newEditor';
import Editor from 'src/components/Editor/Editor';

import GiftCheatSheet from 'src/components/GIFTCheatSheet/GiftCheatSheet';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';

import { QuizType } from '../../../Types/QuizType';

import './EditorQuiz.css';
import { Button, TextField, NativeSelect, Divider, Dialog, DialogTitle, DialogActions, DialogContent, MenuItem, Select, Snackbar } from '@mui/material';
import ReturnButton from 'src/components/ReturnButton/ReturnButton';

import ApiService from '../../../services/ApiService';
import { escapeForGIFT } from '../../../utils/giftUtils';
import { Upload } from '@mui/icons-material';
import SaveIcon from '@mui/icons-material/Save';

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
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const [useNewEditor, setUserNewEditor] = useState(false);

    const QuestionVraiFaux = "::Exemple de question vrai/faux:: \n 2+2 \\= 4 ? {T}  //Utilisez les valeurs {T}, {F}, {TRUE} et {FALSE}.";
    const QuestionChoixMul = "::Ville capitale du Canada:: \nQuelle ville est la capitale du Canada? {\n~ Toronto\n~ Montréal\n= Ottawa #Rétroaction spécifique.\n}  // Commentaire non visible (au besoin)";
    const QuestionChoixMulMany = "::Villes canadiennes:: \n Quelles villes trouve-t-on au Canada? { \n~ %33.3% Montréal \n ~ %33.3% Ottawa \n ~ %33.3% Vancouver \n ~ %-100% New York \n ~ %-100% Paris \n#### Rétroaction globale de la question. \n}  // Utilisez tilde (signe de vague) pour toutes les réponses. // On doit indiquer le pourcentage de chaque réponse.";
    const QuestionCourte = "::Clé et porte:: \n Avec quoi ouvre-t-on une porte? { \n= clé \n= clef \n} // Permet de fournir plusieurs bonnes réponses. // Note: La casse n'est pas prise en compte.";
    const QuestionNum = "::Question numérique avec marge:: \nQuel est un nombre de 1 à 5 ? {\n#3:2\n}\n \n// Plage mathématique spécifiée avec des points de fin d'intervalle. \n ::Question numérique avec plage:: \n Quel est un nombre de 1 à 5 ? {\n#1..5\n} \n\n// Réponses numériques multiples avec crédit partiel et commentaires.\n::Question numérique avec plusieurs réponses::\nQuand est né Ulysses S. Grant ? {\n# =1822:0 # Correct ! Crédit complet. \n=%50%1822:2 # Il est né en 1822. Demi-crédit pour être proche.\n}";

    const templates = [
        { label: 'Vrai/Faux', value: QuestionVraiFaux },
        { label: 'Choix multiples R1', value: QuestionChoixMul },
        { label: 'Choix multiples R2+', value: QuestionChoixMulMany },
        { label: 'Réponse courte', value: QuestionCourte },
        { label: 'Numérique', value: QuestionNum },
    ];

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

    const newHandleUpdatePreview = (newValues: string[]) => {
        setValues(newValues);
        setFilteredValue(newValues.filter(value => value.trim() !== ''));
    };

    const handleUpdatePreview = (value: string) => {
        if (value !== '') {
            setValues([value]);
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
            if (imageUrl.indexOf("ERROR") >= 0) {
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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopySuccess(`Copié dans le presse-papier: ${label}`);
            })
            .catch((error) => console.error('Clipboard error:', error));
    };

    const handleSelectChange = (value: string, label: string) => {
        copyToClipboard(value, label);
    };

    const toggleEditor = () => {
        setUserNewEditor(!useNewEditor);
    }

    return (
        <div className='quizEditor'>
            <div className='editHeader' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <ReturnButton quizTitle={quizTitle} quizContent={filteredValue} quizFolder={selectedFolder} quizId={quiz?._id} isNewQuiz={isNewQuiz} />
                <div className='title'>Éditeur de Quiz</div>
                <Button
                    variant="outlined"
                    onClick={toggleEditor}
                    size="small"
                    style={{
                        fontSize: '10px', // Smaller font
                        padding: '2px 6px', // Reduced padding
                        minWidth: 'auto', // Allow button to shrink
                        height: 'fit-content', // Match height to content
                    }}
                >
                    {useNewEditor ? 'Ancien éditeur' : 'Nouvel éditeur'}
                </Button>

            </div>

            <TextField onChange={handleQuizTitleChange} value={quizTitle} placeholder="Titre du quiz" label="Titre du quiz" fullWidth />
            <label>Choisir un dossier:
                <NativeSelect id="select-folder" color="primary" value={selectedFolder} onChange={handleSelectFolder} disabled={!isNewQuiz} style={{ marginBottom: '16px' }}>
                    <option disabled value=""> Choisir un dossier... </option>
                    {folders.map((folder: FolderType) => (
                        <option value={folder._id} key={folder._id}> {folder.title} </option>
                    ))}
                </NativeSelect>
            </label>

            <div className='sticky-buttons'>
                <Select
                    value=""
                    displayEmpty
                    onChange={(e) => handleSelectChange(e.target.value, templates.find(t => t.value === e.target.value)?.label || '')}
                    style={{ width: '210px' }}
                    inputProps={{ 'data-testid': 'template-select' }}
                >
                    <MenuItem value="" disabled>Modèles de questions</MenuItem>
                    {templates.map((template, index) => (
                        <MenuItem key={index} value={template.value}>{template.label}</MenuItem>
                    ))}
                </Select>

                <Button variant="contained" onClick={handleQuizSave} sx={{ display: 'flex', alignItems: 'center' }}>
                    <SaveIcon sx={{ fontSize: 20 }} />
                    Enregistrer
                </Button>
            </div>

            <Snackbar open={!!copySuccess} autoHideDuration={3000} onClose={() => setCopySuccess(null)} message={copySuccess} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} key={copySuccess ? 'open' : 'close'} />

            <Divider style={{ margin: '16px 0' }} />

            <div className='editSection'>
                <div className='edit'>
                    {useNewEditor ? (
                        <NewEditor label="" values={values} onValuesChange={newHandleUpdatePreview} onFocusQuestion={handleFocusQuestion} />
                    ) : (
                        <Editor label="" values={values} onEditorChange={handleUpdatePreview} />
                    )}
                    {useNewEditor && (
                        <Button variant="contained" onClick={handleAddQuestion}>
                            Ajouter une question
                        </Button>
                    )}
                    <div className="images">
                        <div style={{ marginTop: '8px' }}>
                            <Button variant="outlined" onClick={() => setIsUploadCollapsed(!isUploadCollapsed)} style={{ padding: '4px 8px', fontSize: '12px', marginBottom: '4px', width: '40%' }}>
                                {isUploadCollapsed ? 'Afficher Téléverser image' : 'Masquer Téléverser image'}
                            </Button>
                            {!isUploadCollapsed && (
                                <div className="upload">
                                    <label className="dropArea">
                                        <input type="file" id="file-input" className="file-input" accept="image/jpeg, image/png" multiple ref={fileInputRef} />
                                        <Button variant="outlined" aria-label="Téléverser" onClick={handleSaveImage}>
                                            Téléverser <Upload />
                                        </Button>
                                    </label>
                                    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                                        <DialogTitle>Erreur</DialogTitle>
                                        <DialogContent>Veuillez d'abord choisir une image à téléverser.</DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => setDialogOpen(false)} color="primary">OK</Button>
                                        </DialogActions>
                                    </Dialog>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '2px' }}>
                            <Button variant="outlined" onClick={() => setIsImagesCollapsed(!isImagesCollapsed)} style={{ padding: '4px 8px', fontSize: '12px', marginBottom: '4px', width: '40%' }}>
                                {isImagesCollapsed ? 'Afficher Mes images' : 'Masquer Mes images'}
                            </Button>
                            {!isImagesCollapsed && (
                                <div>
                                    <h4>Mes images :</h4>
                                    <div>
                                        <div>
                                            <div style={{ display: 'inline' }}>(Voir section </div>
                                            <a href="#images-section" style={{ textDecoration: 'none' }} onClick={scrollToImagesSection}>
                                                <u><em><h4 style={{ display: 'inline' }}> 9. Images </h4></em></u>
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
                                                        <code onClick={() => handleCopyToClipboard(imgTag)}>{imgTag}</code>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '2px' }}>
                            <Button variant="outlined" onClick={() => setIsCheatSheetCollapsed(!isCheatSheetCollapsed)} style={{ padding: '4px 8px', fontSize: '12px', marginBottom: '4px', width: '40%' }}>
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
                <Button onClick={scrollToTop} variant="contained" color="primary" style={scrollToTopButtonStyle} title="Scroll to top">
                    ↑
                </Button>
            )}

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} message={snackbarMessage} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} />
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
