// Dashboard.tsx
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { parse } from 'gift-pegjs';

import Template from 'src/components/GiftTemplate/templates';
import { QuizType } from '../../../Types/QuizType';
import { FolderType } from '../../../Types/FolderType';
// import { QuestionService } from '../../../services/QuestionService';
import ApiService from '../../../services/ApiService';

import './dashboard.css';
import ImportModal from 'src/components/ImportModal/ImportModal';
//import axios from 'axios';

import {
    TextField,
    IconButton,
    InputAdornment,
    Button,
    Card,
    Tooltip,
    NativeSelect,
    CardContent,
    styled,
} from '@mui/material';
import {
    Search,
    DeleteOutline,
    FileDownload,
    Add,
    Upload,
    FolderCopy,
    ContentCopy,
    Edit,
    Share,
    // DriveFileMove
} from '@mui/icons-material';

// Create a custom-styled Card component
const CustomCard = styled(Card)({
    overflow: 'visible', // Override the overflow property
    position: 'relative',
    margin: '40px 0 20px 0', // Add top margin to make space for the tab
    borderRadius: '8px',
    paddingTop: '20px', // Ensure content inside the card doesn't overlap with the tab
});

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<QuizType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>(''); // Selected folder

    // Filter quizzes based on search term
    // const filteredQuizzes = quizzes.filter(quiz =>
    //     quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    // );
    const filteredQuizzes = useMemo(() => {
        return quizzes.filter(
            (quiz) =>
                quiz && quiz.title && quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [quizzes, searchTerm]);


    // Group quizzes by folder
    const quizzesByFolder = filteredQuizzes.reduce((acc, quiz) => {
        if (!acc[quiz.folderName]) {
            acc[quiz.folderName] = [];
        }
        acc[quiz.folderName].push(quiz);
        return acc;
    }, {} as Record<string, QuizType[]>);

    useEffect(() => {
        const fetchData = async () => {
            if (!ApiService.isLoggedIn()) {
                navigate("/login");
                return;
            }
            else {
                const userFolders = await ApiService.getUserFolders();

                setFolders(userFolders as FolderType[]);
            }

        };

        fetchData();
    }, []);

    const handleSelectFolder = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFolderId(event.target.value);
    };

    useEffect(() => {
        const fetchQuizzesForFolder = async () => {

            if (selectedFolderId == '') {
                const folders = await ApiService.getUserFolders(); // HACK force user folders to load on first load
                //console.log("show all quizzes")
                let quizzes: QuizType[] = [];

                for (const folder of folders as FolderType[]) {
                    const folderQuizzes = await ApiService.getFolderContent(folder._id);
                    //console.log("folder: ", folder.title, " quiz: ", folderQuizzes);
                    // add the folder.title to the QuizType if the folderQuizzes is an array
                    addFolderTitleToQuizzes(folderQuizzes, folder.title);
                    quizzes = quizzes.concat(folderQuizzes as QuizType[])
                }

                setQuizzes(quizzes as QuizType[]);
            }
            else {
                console.log("show some quizzes")
                const folderQuizzes = await ApiService.getFolderContent(selectedFolderId);
                console.log("folderQuizzes: ", folderQuizzes);
                // get the folder title from its id
                const folderTitle = folders.find((folder) => folder._id === selectedFolderId)?.title || '';
                addFolderTitleToQuizzes(folderQuizzes, folderTitle);
                setQuizzes(folderQuizzes as QuizType[]);
            }


        };

        fetchQuizzesForFolder();
    }, [selectedFolderId]);


    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };


    const handleRemoveQuiz = async (quiz: QuizType) => {
        try {
            const confirmed = window.confirm('Voulez-vous vraiment supprimer ce quiz?');
            if (confirmed) {
                await ApiService.deleteQuiz(quiz._id);
                const updatedQuizzes = quizzes.filter((q) => q._id !== quiz._id);
                setQuizzes(updatedQuizzes);
            }
        } catch (error) {
            console.error('Error removing quiz:', error);
        }
    };


    const handleDuplicateQuiz = async (quiz: QuizType) => {
        try {
            await ApiService.duplicateQuiz(quiz._id);
            if (selectedFolderId == '') {
                const folders = await ApiService.getUserFolders(); // HACK force user folders to load on first load
                console.log("show all quizzes")
                let quizzes: QuizType[] = [];

                for (const folder of folders as FolderType[]) {
                    const folderQuizzes = await ApiService.getFolderContent(folder._id);
                    console.log("folder: ", folder.title, " quiz: ", folderQuizzes);
                    addFolderTitleToQuizzes(folderQuizzes, folder.title);
                    quizzes = quizzes.concat(folderQuizzes as QuizType[]);
                }

                setQuizzes(quizzes as QuizType[]);
            }
            else {
                console.log("show some quizzes")
                const folderQuizzes = await ApiService.getFolderContent(selectedFolderId);
                addFolderTitleToQuizzes(folderQuizzes, selectedFolderId);
                setQuizzes(folderQuizzes as QuizType[]);

            }
        } catch (error) {
            console.error('Error duplicating quiz:', error);
        }
    };

    const handleOnImport = () => {
        setShowImportModal(true);

    };

    const validateQuiz = (questions: string[]) => {
        if (!questions || questions.length === 0) {
            return false;
        }

        // Check if I can generate the Template for each question
        // Otherwise the quiz is invalid
        for (let i = 0; i < questions.length; i++) {
            try {
                // questions[i] = QuestionService.ignoreImgTags(questions[i]);
                const parsedItem = parse(questions[i]);
                Template(parsedItem[0]);
            } catch (error) {
                console.error('Error parsing question:', error);
                return false;
            }
        }

        return true;
    };

    const downloadTxtFile = async (quiz: QuizType) => {

        try {
            const selectedQuiz = await ApiService.getQuiz(quiz._id) as QuizType;
            //quizzes.find((quiz) => quiz._id === quiz._id);

            if (!selectedQuiz) {
                throw new Error('Selected quiz not found');
            }

            //const { title, content } = selectedQuiz;
            let quizContent = "";
            const title = selectedQuiz.title;
            console.log(selectedQuiz.content);
            selectedQuiz.content.forEach((question, qIndex) => {
                const formattedQuestion = question.trim();
                // console.log(formattedQuestion);
                if (formattedQuestion !== '') {
                    quizContent += formattedQuestion + '\n';
                    if (qIndex !== selectedQuiz.content.length - 1) {
                        quizContent += '\n';
                    }
                }
            });

            if (!validateQuiz(selectedQuiz.content)) {
                window.alert('Attention! Ce quiz contient des questions invalides selon le format GIFT.');
            }
            const blob = new Blob([quizContent], { type: 'text/plain' });
            const a = document.createElement('a');
            const filename = title;
            a.download = `${filename}.gift`;
            a.href = window.URL.createObjectURL(blob);
            a.click();


        } catch (error) {
            console.error('Error exporting selected quiz:', error);
        }
    };

    const handleCreateFolder = async () => {
        try {
            const folderTitle = prompt('Titre du dossier');
            if (folderTitle) {
                await ApiService.createFolder(folderTitle);
                const userFolders = await ApiService.getUserFolders();
                setFolders(userFolders as FolderType[]);                
                const newlyCreatedFolder = userFolders[userFolders.length - 1] as FolderType;
                setSelectedFolderId(newlyCreatedFolder._id);
                
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };
  
    const handleDeleteFolder = async () => {

        try {
            const confirmed = window.confirm('Voulez-vous vraiment supprimer ce dossier?');
            if (confirmed) {
                await ApiService.deleteFolder(selectedFolderId);
                const userFolders = await ApiService.getUserFolders();
                setFolders(userFolders as FolderType[]);
            }

            const folders = await ApiService.getUserFolders(); // HACK force user folders to load on first load
            console.log("show all quizzes")
            let quizzes: QuizType[] = [];

            for (const folder of folders as FolderType[]) {
                const folderQuizzes = await ApiService.getFolderContent(folder._id);
                console.log("folder: ", folder.title, " quiz: ", folderQuizzes);
                quizzes = quizzes.concat(folderQuizzes as QuizType[])
            }

            setQuizzes(quizzes as QuizType[]);
            setSelectedFolderId('');

        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    const handleRenameFolder = async () => {
        try {
            // folderId: string GET THIS FROM CURRENT FOLDER
            // currentTitle: string GET THIS FROM CURRENT FOLDER
            const newTitle = prompt('Entrée le nouveau nom du fichier', folders.find((folder) => folder._id === selectedFolderId)?.title);
            if (newTitle) {
                const renamedFolderId = selectedFolderId;
                const result = await ApiService.renameFolder(selectedFolderId, newTitle);

                if (result !== true )  {
                    window.alert(`Une erreur est survenue: ${result}`);
                    return;
                }

                const userFolders = await ApiService.getUserFolders();
                setFolders(userFolders as FolderType[]);
                // refresh the page
                setSelectedFolderId('');
                setSelectedFolderId(renamedFolderId);
            }
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert('Erreur lors du renommage du dossier: ' + error);
        }
    };

    const handleDuplicateFolder = async () => {
        try {
            // folderId: string GET THIS FROM CURRENT FOLDER
            await ApiService.duplicateFolder(selectedFolderId);
            // TODO set the selected folder to be the duplicated folder
            const userFolders = await ApiService.getUserFolders();
            setFolders(userFolders as FolderType[]);
            const newlyCreatedFolder = userFolders[userFolders.length - 1] as FolderType;
            setSelectedFolderId(newlyCreatedFolder._id);
        } catch (error) {
            console.error('Error duplicating folder:', error);
        }
    };

    const handleCreateQuiz = () => {
        navigate("/teacher/editor-quiz/new");
    }

    const handleEditQuiz = (quiz: QuizType) => {
        navigate(`/teacher/editor-quiz/${quiz._id}`);
    }

    const handleLancerQuiz = (quiz: QuizType) => {
        navigate(`/teacher/manage-room/${quiz._id}`);
    }

    const handleShareQuiz = async (quiz: QuizType) => {
        try {
            const email = prompt(`Veuillez saisir l'email de la personne avec qui vous souhaitez partager ce quiz`, "");

            if (email) {
                const result = await ApiService.ShareQuiz(quiz._id, email);

                if (!result) {
                    window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                    return;
                }

                window.alert(`Quiz partagé avec succès!`)
            }

        } catch (error) {
            console.error('Erreur lors du partage du quiz:', error);
        }
    }




    return (

        <div className="dashboard">

            <div className="title">Tableau de bord</div>

            <div className="search-bar">
                <TextField
                    onChange={handleSearch}
                    value={searchTerm}
                    placeholder="Rechercher un quiz par son titre"
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton>
                                    <Search />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </div>

            <div className='folder'>
                <div className='select'>
                    <NativeSelect
                        id="select-folder"
                        color="primary"
                        value={selectedFolderId}
                        onChange={handleSelectFolder}
                    >
                        <option value=""> Tous les dossiers... </option>

                        {folders.map((folder: FolderType) => (
                            <option value={folder._id} key={folder._id}> {folder.title} </option>
                        ))}
                    </NativeSelect>
                </div>

                <div className='actions'>
                    <Tooltip title="Ajouter dossier" placement="top">
                        <IconButton
                            color="primary"
                            onClick={handleCreateFolder}
                        > <Add /> </IconButton>
                    </Tooltip>

                    <Tooltip title="Renommer dossier" placement="top">
                        <IconButton
                            color="primary"
                            onClick={handleRenameFolder}
                            disabled={selectedFolderId == ''} // cannot action on all
                        > <Edit /> </IconButton>
                    </Tooltip>

                    <Tooltip title="Dupliquer dossier" placement="top">
                        <IconButton
                            color="primary"
                            onClick={handleDuplicateFolder}
                            disabled={selectedFolderId == ''} // cannot action on all
                        > <FolderCopy /> </IconButton>
                    </Tooltip>

                    <Tooltip title="Supprimer dossier" placement="top">
                        <IconButton
                            aria-label="delete"
                            color="primary"
                            onClick={handleDeleteFolder}
                            disabled={selectedFolderId == ''} // cannot action on all
                        > <DeleteOutline /> </IconButton>
                    </Tooltip>
                </div>

            </div>

            <div className='ajouter'>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleCreateQuiz}
                >
                    Ajouter un nouveau quiz
                </Button>

                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Upload />}
                    onClick={handleOnImport}
                >
                    Import
                </Button>

            </div>
            <div className='list'>
                {Object.keys(quizzesByFolder).map(folderName => (
                    <CustomCard key={folderName} className='folder-card'>
                        <div className='folder-tab'>{folderName}</div>
                        <CardContent>
                            {quizzesByFolder[folderName].map((quiz: QuizType) => (
                                <div className='quiz' key={quiz._id}>
                                    <div className='title'>
                                        <Tooltip title="Lancer quiz" placement="top">
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleLancerQuiz(quiz)}
                                                disabled={!validateQuiz(quiz.content)}
                                            >
                                                {`${quiz.title} (${quiz.content.length} question${quiz.content.length > 1 ? 's' : ''})`}
                                            </Button>
                                        </Tooltip>
                                    </div>

                                    <div className='actions'>
                                        <Tooltip title="Télécharger quiz" placement="top">
                                            <IconButton
                                                color="primary"
                                                onClick={() => downloadTxtFile(quiz)}
                                            > <FileDownload /> </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Modifier quiz" placement="top">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEditQuiz(quiz)}
                                            > <Edit /> </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Dupliquer quiz" placement="top">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleDuplicateQuiz(quiz)}
                                            > <ContentCopy /> </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Supprimer quiz" placement="top">
                                            <IconButton
                                                aria-label="delete"
                                                color="primary"
                                                onClick={() => handleRemoveQuiz(quiz)}
                                            > <DeleteOutline /> </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Partager quiz" placement="top">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleShareQuiz(quiz)}
                                            > <Share /> </IconButton>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </CustomCard>
                ))}
            </div>
            <ImportModal
                open={showImportModal}
                handleOnClose={() => setShowImportModal(false)}
                handleOnImport={handleOnImport}
                selectedFolder={selectedFolderId}
            />

        </div>
    );
};

export default Dashboard;
function addFolderTitleToQuizzes(folderQuizzes: string | QuizType[], folderName: string) {
    if (Array.isArray(folderQuizzes))
        folderQuizzes.forEach((quiz) => {
            quiz.folderName = folderName;
            console.log(`quiz: ${quiz.title} folder: ${quiz.folderName}`);
        });
}

