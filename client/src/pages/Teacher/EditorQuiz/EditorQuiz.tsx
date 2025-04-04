import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderType } from '../../../Types/FolderType';
import Editor from 'src/components/Editor/Editor';
import GiftCheatSheet from 'src/components/GIFTCheatSheet/GiftCheatSheet';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';
import { QuizType } from '../../../Types/QuizType';
import { Button, TextField, NativeSelect, Divider, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';
import ReturnButton from 'src/components/ReturnButton/ReturnButton';
import ApiService from '../../../services/ApiService';
import { escapeForGIFT } from '../../../utils/giftUtils';
import { Upload } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToImagesSection = (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        document.getElementById('images-section')?.scrollIntoView({ behavior: 'smooth' });
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
                    window.alert(`Une erreur est survenue.\n Le quiz ${id} n'a pas été trouvé\nVeuillez réessayer plus tard`);
                    navigate('/teacher/dashboard');
                    return;
                }

                setQuiz(quiz);
                setQuizTitle(quiz.title);
                setSelectedFolder(quiz.folderId);
                setFilteredValue(quiz.content);
                setValue(quiz.content.join('\n\n'));
            } catch (error) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`);
                navigate('/teacher/dashboard');
            }
        };
        fetchData();
    }, [id, navigate]);

    function handleUpdatePreview(value: string) {
        if (value !== '') {
            setValue(value);
            const linesArray = value.split(/\n{2,}/);
            if (linesArray[0] === '') linesArray.shift();
            if (linesArray[linesArray.length - 1] === '') linesArray.pop();
            setFilteredValue(linesArray);
        }
    }

    const handleQuizTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuizTitle(event.target.value);
    };

    const handleSelectFolder = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFolder(event.target.value);
    };

    const handleQuizSave = async () => {
        try {
            if (quizTitle === '') {
                alert("Veuillez choisir un titre");
                return;
            }
            if (selectedFolder === '') {
                alert("Veuillez choisir un dossier");
                return;
            }

            if (isNewQuiz) {
                await ApiService.createQuiz(quizTitle, filteredValue, selectedFolder);
            } else if (quiz) {
                await ApiService.updateQuiz(quiz._id, quizTitle, filteredValue);
            }
            navigate('/teacher/dashboard');
        } catch (error) {
            window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`);
        }
    };

    const handleSaveImage = async () => {
        try {
            const inputElement = document.getElementById('file-input') as HTMLInputElement;
            if (!inputElement?.files || inputElement.files.length === 0) {
                setDialogOpen(true);
                return;
            }

            const imageUrl = await ApiService.uploadImage(inputElement.files[0]);
            if (imageUrl.indexOf("ERROR") >= 0) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`);
                return;
            }

            setImageLinks(prevLinks => [...prevLinks, imageUrl]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            window.alert(`Une erreur est survenue.\n${error}\nVeuillez réessayer plus tard.`);
        }
    };

    const handleCopyToClipboard = async (link: string) => {
        navigator.clipboard.writeText(link);
    }

    if (!isNewQuiz && !quiz) {
        return <div>Chargement...</div>;
    }

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="w-25">
                    <ReturnButton
                        askConfirm
                        message="Êtes-vous sûr de vouloir quitter l'éditeur sans sauvegarder le questionnaire?"
                    />
                </div>
                <h1 className="text-center flex-grow-1">Éditeur de quiz</h1>
                <div className="w-25"></div> {/* Spacer for balance */}
            </div>

            {/* Quiz Info */}
            <div className="row mb-4">
                <div className="col-md-8 mb-3 mb-md-0">
                    <TextField
                        onChange={handleQuizTitleChange}
                        value={quizTitle}
                        placeholder="Titre du quiz"
                        label="Titre du quiz"
                        fullWidth
                    />
                </div>
                <div className="row mb-4">
                    <div className="col-md-4 d-flex align-items-center">
                        <label className="me-2">Choisir un dossier:</label>
                        <NativeSelect
                            id="select-folder"
                            color="primary"
                            value={selectedFolder}
                            onChange={handleSelectFolder}
                            disabled={!isNewQuiz}
                            className="flex-grow-1"
                        >
                            <option disabled value="">Choisir un dossier...</option>
                            {folders.map((folder: FolderType) => (
                                <option value={folder._id} key={folder._id}>{folder.title}</option>
                            ))}
                        </NativeSelect>
                    </div>
                </div>
            </div>

            <Button variant="contained" onClick={handleQuizSave} className="mb-4">
                Enregistrer
            </Button>

            <Divider className="my-4" />

            {/* Editor Section */}
            <div className="row g-4">
                {/* Editor Column */}
                <div className="col-lg-6 d-flex flex-column" style={{ height: '78vh', overflow: 'auto' }}>
                    <Editor
                        label="Contenu GIFT du quiz:"
                        initialValue={value}
                        onEditorChange={handleUpdatePreview}
                    />

                    {/* Images Section */}
                    <div className="mt-4 p-3 border rounded">
                        <div className="d-flex flex-column align-items-center mb-3">
                            <input
                                type="file"
                                id="file-input"
                                className="d-none"
                                accept="image/jpeg, image/png"
                                multiple
                                ref={fileInputRef}
                            />
                            <Button
                                variant="outlined"
                                aria-label='Téléverser'
                                onClick={handleSaveImage}
                                startIcon={<Upload />}
                            >
                                Téléverser
                            </Button>
                        </div>

                        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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

                        <h4>Mes images :</h4>
                        <div className="mb-3">
                            <div className="mb-2">
                                (Voir section{' '}
                                <a href="#images-section" style={{ textDecoration: "none" }} onClick={scrollToImagesSection}>
                                    <u><em>9. Images</em></u>
                                </a>{' '}
                                ci-dessous)
                                <br />
                                <em> - Cliquez sur un lien pour le copier</em>
                            </div>
                            <ul className="list-unstyled">
                                {imageLinks.map((link, index) => {
                                    const imgTag = `![alt_text](${escapeForGIFT(link)} "texte de l'infobulle")`;
                                    return (
                                        <li key={index} className="mb-2">
                                            <code
                                                onClick={() => handleCopyToClipboard(imgTag)}
                                                className="p-1 bg-light rounded"
                                                style={{ cursor: 'pointer' }}
                                            >
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

                {/* Preview Column */}
                <div className="col-lg-6" style={{ height: '78vh', overflow: 'auto' }}>
                    <div className="p-3">
                        <h4>Prévisualisation</h4>
                        <GIFTTemplatePreview questions={filteredValue} />
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollButton && (
                <Button
                    onClick={scrollToTop}
                    variant="contained"
                    color="primary"
                    style={{
                        position: 'fixed',
                        bottom: '40px',
                        right: '50px',
                        padding: '10px',
                        fontSize: '16px',
                        zIndex: 1000,
                    }}
                    title="Scroll to top"
                >
                    ↑
                </Button>
            )}
        </div>
    );
};

export default QuizForm;