// EditorQuiz.tsx
import React, { useState, useEffect, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FolderType } from '../../../Types/FolderType';

import Editor from 'src/components/Editor/Editor';
import GiftCheatSheet from 'src/components/GIFTCheatSheet/GiftCheatSheet';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';

import { QuizType } from '../../../Types/QuizType';
import SaveIcon from '@mui/icons-material/Save';
import './editorQuiz.css';
import { Button, NativeSelect, Divider } from '@mui/material';
import ReturnButton from 'src/components/ReturnButton/ReturnButton';
import ImageGalleryModal from 'src/components/ImageGallery/ImageGalleryModal/ImageGalleryModal';

import ApiService from '../../../services/ApiService';
import { escapeForGIFT } from '../../../utils/giftUtils';
import { ENV_VARIABLES } from 'src/constants';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

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

                const quiz = await ApiService.getQuiz(id);

                // ApiService returns an error string on failure; handle both falsy and error string
                if (!quiz || typeof quiz === 'string') {
                    window.alert(`Une erreur est survenue.\n Le quiz ${id} n'a pas été trouvé\nVeuillez réessayer plus tard`)
                    console.error('Quiz not found for id:', id);
                    navigate('/teacher/dashboard');
                    return;
                }
                setQuiz(quiz as QuizType);
                const { title, content, folderId } = quiz;

                setQuizTitle(title);
                setSelectedFolder(folderId);
                // Normalize content: may be stored as string (legacy) or an array.
                if (Array.isArray(content)) {
                    setFilteredValue(content);
                    setValue(content.join('\n\n'));
                } else if (typeof content === 'string') {
                    // Convert the string content into an array of questions by splitting on blank lines
                    const linesArray = content.split(/\n{2,}/).filter(Boolean);
                    setFilteredValue(linesArray);
                    setValue(content);
                } else {
                    setFilteredValue([]);
                    setValue('');
                }

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

    const handleCopyToClipboard = async (link: string) => {
        navigator.clipboard.writeText(link);
    }

    const handleCopyImage = (id: string) => {
        const escLink = `${ENV_VARIABLES.BACKEND_URL}/api/image/get/${id}`;
        setImageLinks(prevLinks => [...prevLinks, escLink]);
    }

    return (
        <div className="quizEditor">
            <div
                className="editHeader"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px'
                }}
            >
                <ReturnButton
                    askConfirm
                    message={`Êtes-vous sûr de vouloir quitter l'éditeur sans sauvegarder le questionnaire?`}
                />

<Button
                    variant="contained"
                    onClick={handleQuizSave}
                    sx={{ display: 'flex', alignItems: 'center' }}
                >
                    <SaveIcon sx={{ fontSize: 20 }} />
                    Enregistrer
                </Button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <div className="title">Éditeur de quiz</div>
            </div>

            {/* <h2 className="subtitle">Éditeur</h2> */}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ValidatedTextField
                    fieldPath="quiz.title"
                    initialValue={quizTitle}
                    onValueChange={(value) => setQuizTitle(value)}
                    color="primary"
                    placeholder="Titre du quiz"
                    label="Titre du quiz"
                    sx={{ width: '200px', marginTop: '50px' }}
                />
             <NativeSelect
                    id="select-folder"
                    color="primary"
                    value={selectedFolder}
                    onChange={handleSelectFolder}
                    disabled={!isNewQuiz}
                    style={{ marginBottom: '16px', width: '200px', marginTop: '10px' }}
                >
                    <option disabled value="">
                        Choisir un dossier...
                    </option>
                    {folders.map((folder: FolderType) => (
                        <option value={folder._id} key={folder._id}>
                            {folder.title}
                        </option>
                    ))}
                </NativeSelect>
            </div>


            <Divider style={{ margin: '16px 0' }} />

            <div className='editSection'>

                <div className='edit'>
                    <Editor
                        label="Contenu GIFT du quiz:"
                        initialValue={value}
                        onEditorChange={handleUpdatePreview} />

                    <div className='images'>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h4>Mes images :</h4>
                                <ImageGalleryModal handleCopy={handleCopyImage} />
                        </div>
                                
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
                                    const imgTag = `[markdown]![alt_text](${escapeForGIFT(link)} "texte de l'infobulle") {T}`;
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
