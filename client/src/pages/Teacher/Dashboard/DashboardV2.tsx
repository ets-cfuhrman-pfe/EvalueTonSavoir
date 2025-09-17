import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { parse } from 'gift-pegjs';

import Template from 'src/components/GiftTemplate/templates';
import { QuizType } from '../../../Types/QuizType';
import { FolderType } from '../../../Types/FolderType';
import ApiService from '../../../services/ApiService';
import ImportModal from 'src/components/ImportModal/ImportModal';
import { RoomType } from '../../../Types/RoomType';
import ValidatedTextField from 'src/components/ValidatedTextField/ValidatedTextField';
import DownloadQuizModal from 'src/components/DownloadQuizModal/DownloadQuizModal';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    IconButton,
    InputAdornment,
    Button,
    Tooltip,
    DialogContentText,
    Menu,
    MenuItem,
    Divider
} from '@mui/material';
import {
    Search,
    DeleteOutline,
    Add,
    Upload,
    FolderCopy,
    ContentCopy,
    Edit,
    MoreVert,
    Delete,
    PlayArrow,
    Share,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';

const DashboardV2: React.FC = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<QuizType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomType | undefined>();
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [openAddRoomDialog, setOpenAddRoomDialog] = useState(false);
    const [newRoomTitle, setNewRoomTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [openAddFolderDialog, setOpenAddFolderDialog] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [openRenameFolderDialog, setOpenRenameFolderDialog] = useState(false);
    const [renameFolderTitle, setRenameFolderTitle] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedQuizForMenu, setSelectedQuizForMenu] = useState<QuizType | null>(null);
    const [isFolderListExpanded, setIsFolderListExpanded] = useState(true);

    // Filter quizzes based on search term
    const filteredQuizzes = useMemo(() => {
        return quizzes.filter((quiz) =>
            quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Validation function for quizzes
    const validateQuiz = (questions: string[]) => {
        if (!questions || questions.length === 0) {
            return false;
        }

        // Check if I can generate the Template for each question
        // Otherwise the quiz is invalid
        for (const question of questions) {
            try {
                const parsedItem = parse(question);
                Template(parsedItem[0]);
            } catch (error) {
                console.error('Error parsing question:', error);
                return false;
            }
        }

        return true;
    };

    // Room handlers
    const handleSelectRoom = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (event.target.value === 'add-room') {
            setOpenAddRoomDialog(true);
        } else {
            selectRoomByName(event.target.value);
        }
    };

    const createRoom = async (title: string) => {
        // Créer la salle et récupérer l'objet complet
        const newRoom = await ApiService.createRoom(title);

        // Mettre à jour la liste des salles
        const updatedRooms = await ApiService.getUserRooms();
        setRooms(updatedRooms as RoomType[]);

        // Sélectionner la nouvelle salle avec son ID
        selectRoomByName(newRoom); 
    };

    const selectRoomByName = (roomId: string) => {
        const room = rooms.find((r) => r._id === roomId);
        setSelectedRoom(room);
        localStorage.setItem('selectedRoomId', roomId);
    };

    const handleCreateRoom = async () => {
        if (newRoomTitle.trim()) {
            try {
                await createRoom(newRoomTitle);
                const userRooms = await ApiService.getUserRooms();
                setRooms(userRooms as RoomType[]);
                setOpenAddRoomDialog(false);
                setNewRoomTitle('');
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
                setShowErrorDialog(true);
            }
        }
    };

    // Search handlers
    const toggleSearchVisibility = () => {
        setIsSearchVisible(!isSearchVisible);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // Quiz handlers
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
                // console.log('show all quizzes');
                let quizzes: QuizType[] = [];

                for (const folder of folders as FolderType[]) {
                    const folderQuizzes = await ApiService.getFolderContent(folder._id);
                    // console.log('folder: ', folder.title, ' quiz: ', folderQuizzes);
                    addFolderTitleToQuizzes(folderQuizzes, folder.title);
                    quizzes = quizzes.concat(folderQuizzes as QuizType[]);
                }

                setQuizzes(quizzes);
            } else {
                // console.log('show some quizzes');
                const folderQuizzes = await ApiService.getFolderContent(selectedFolderId);
                addFolderTitleToQuizzes(folderQuizzes, selectedFolderId);
                setQuizzes(folderQuizzes as QuizType[]);
            }
        } catch (error) {
            console.error('Error duplicating quiz:', error);
        }
    };

    const handleCreateQuiz = () => {
        navigate('/teacher/editor-quiz/new');
    };

    const handleEditQuiz = (quiz: QuizType) => {
        navigate(`/teacher/editor-quiz/${quiz._id}`);
    };

    const handleLancerQuiz = (quiz: QuizType) => {
        if (selectedRoom) {
            navigate(`/teacher/manage-room/${quiz._id}/${selectedRoom.title}`);
        } else {
            const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
            navigate(`/teacher/manage-room/${quiz._id}/${randomSixDigit}`);
        }
    };

    const handleOnImport = () => {
        setShowImportModal(true);
    };

    // Menu handlers for quiz actions
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quiz: QuizType) => {
        setMenuAnchor(event.currentTarget);
        setSelectedQuizForMenu(quiz);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedQuizForMenu(null);
    };

    const handleMenuAction = (action: string) => {
        if (!selectedQuizForMenu) return;

        handleMenuClose();

        switch (action) {
            case 'launch':
                handleLancerQuiz(selectedQuizForMenu);
                break;
            case 'share': {
                const quizUrl = `${window.location.origin}/teacher/share/${selectedQuizForMenu._id}`;
                navigator.clipboard
                    .writeText(quizUrl)
                    .then(() => {
                        alert(
                            `L'URL de partage pour le quiz ${selectedQuizForMenu.title} a été copiée.`
                        );
                    })
                    .catch(() => {
                        alert("Une erreur est survenue lors de la copie de l'URL.");
                    });
                break;
            }
            case 'duplicate':
                handleDuplicateQuiz(selectedQuizForMenu);
                break;
            case 'delete':
                handleRemoveQuiz(selectedQuizForMenu);
                break;
        }
    };

    // Folder expansion handlers

    const toggleAllFolders = () => {
        setIsFolderListExpanded(!isFolderListExpanded);
    };

    const handleShowAllQuizzes = () => {
        setSelectedFolderId('');
    };

    const handleCreateFolder = async () => {
        setOpenAddFolderDialog(true);
    };

    const handleConfirmCreateFolder = async () => {
        try {
            if (newFolderTitle.trim()) {
                await ApiService.createFolder(newFolderTitle.trim());
                const userFolders = await ApiService.getUserFolders();
                setFolders(userFolders as FolderType[]);
                const newlyCreatedFolder = userFolders[userFolders.length - 1] as FolderType;
                setSelectedFolderId(newlyCreatedFolder._id);
                setNewFolderTitle('');
                setOpenAddFolderDialog(false);
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleCancelCreateFolder = () => {
        setNewFolderTitle('');
        setOpenAddFolderDialog(false);
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
            // console.log('show all quizzes');
            let quizzes: QuizType[] = [];

            for (const folder of folders as FolderType[]) {
                const folderQuizzes = await ApiService.getFolderContent(folder._id);
                // console.log('folder: ', folder.title, ' quiz: ', folderQuizzes);
                quizzes = quizzes.concat(folderQuizzes as QuizType[]);
            }

            setQuizzes(quizzes);
            setSelectedFolderId('');
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    const handleRenameFolder = async () => {
        // Set the current folder title as initial value
        const currentFolder = folders.find((folder) => folder._id === selectedFolderId);
        if (currentFolder) {
            setRenameFolderTitle(currentFolder.title);
            setOpenRenameFolderDialog(true);
        }
    };

    const handleConfirmRenameFolder = async () => {
        try {
            if (renameFolderTitle.trim()) {
                const currentFolder = folders.find((folder) => folder._id === selectedFolderId);
                const oldTitle = currentFolder ? currentFolder.title : '';
                const result = await ApiService.renameFolder(
                    selectedFolderId,
                    renameFolderTitle.trim()
                );

                if (result !== true) {
                    window.alert(`Une erreur est survenue: ${result}`);
                    return;
                }

                const userFolders = await ApiService.getUserFolders();
                setFolders(userFolders as FolderType[]);
                // Update the folderName in existing quizzes
                setQuizzes((prev) =>
                    prev.map((quiz) =>
                        quiz.folderName === oldTitle
                            ? { ...quiz, folderName: renameFolderTitle.trim() }
                            : quiz
                    )
                );
                setRenameFolderTitle('');
                setOpenRenameFolderDialog(false);
            }
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert('Erreur lors du renommage du dossier: ' + error);
        }
    };

    const handleCancelRenameFolder = () => {
        setRenameFolderTitle('');
        setOpenRenameFolderDialog(false);
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

    // useEffect hooks for data fetching
    useEffect(() => {
        const fetchData = async () => {
            const isLoggedIn = ApiService.isLoggedIn();

            if (!isLoggedIn) {
                navigate('/teacher/login');
            } else {
                try {
                    const userRooms = await ApiService.getUserRooms();
                    setRooms(userRooms as RoomType[]);
                } catch (error) {
                    console.error('Error fetching user rooms:', error);
                    setRooms([]);
                }

                try {
                    const userFolders = await ApiService.getUserFolders();
                    setFolders(userFolders as FolderType[]);
                } catch (error) {
                    console.error('Error fetching user folders:', error);
                    setFolders([]);
                }
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (rooms.length > 0 && !selectedRoom) {
            setSelectedRoom(rooms[rooms.length - 1]);
            localStorage.setItem('selectedRoomId', rooms[rooms.length - 1]._id);
        } else if (rooms.length === 0 && selectedRoom) {
            setSelectedRoom(undefined);
            localStorage.removeItem('selectedRoomId');
        }
    }, [rooms, selectedRoom]);

    useEffect(() => {
        const fetchQuizzesForFolder = async () => {
            if (selectedFolderId == '') {
                const folders = await ApiService.getUserFolders(); // HACK force user folders to load on first load
                // console.log('show all quizzes');
                let quizzes: QuizType[] = [];

                for (const folder of folders as FolderType[]) {
                    const folderQuizzes = await ApiService.getFolderContent(folder._id);
                    // console.log('folder: ', folder.title, ' quiz: ', folderQuizzes);
                    addFolderTitleToQuizzes(folderQuizzes, folder.title);
                    quizzes = quizzes.concat(folderQuizzes as QuizType[]);
                }

                setQuizzes(quizzes);
            } else {
                // console.log('show some quizzes');
                const folderQuizzes = await ApiService.getFolderContent(selectedFolderId);
                // console.log('folderQuizzes: ', folderQuizzes);
                // get the folder title from its id
                const folderTitle =
                    folders.find((folder) => folder._id === selectedFolderId)?.title || '';
                addFolderTitleToQuizzes(folderQuizzes, folderTitle);
                setQuizzes(folderQuizzes as QuizType[]);
            }
        };

        fetchQuizzesForFolder();
    }, [selectedFolderId, folders]);

    return (
        <div className="w-100 p-0 dashboard-full-width">
            {/* Top Dashboard Header */}
            <div className="bg-white border-bottom shadow-sm">
                <div className="container-fluid px-2 py-4 dashboard-full-width">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="h3 mb-1 text-dark fw-bold">Tableau de bord</h1>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <label
                                htmlFor="room-selector"
                                className="form-label mb-0 small text-muted"
                            >
                                Salle:
                            </label>
                            <select
                                id="room-selector"
                                className="form-select form-select-sm w-auto"
                                value={selectedRoom?._id || ''}
                                onChange={handleSelectRoom}
                            >
                                <option value="" disabled>
                                    Sélectionner une salle
                                </option>
                                {rooms.map((room) => (
                                    <option key={room._id} value={room._id}>
                                        {room.title}
                                    </option>
                                ))}
                                <option value="add-room" className="fw-bold">
                                    + Nouvelle salle
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="row g-0 ">
                {/* Left Sidebar */}
                <div className="col-lg-4 col-md-4 bg-white border-end shadow-sm">
                    <div className="p-3 h-100">
                        {/* Folders Section */}
                        <div className="bg-light rounded-3 shadow-sm p-3 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Tooltip title="Afficher tous les quiz" placement="top">
                                    <Button
                                        variant="text"
                                        onClick={handleShowAllQuizzes}
                                        className="p-0 text-muted fw-bold"
                                        style={{
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        Dossiers
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    title={
                                        isFolderListExpanded
                                            ? 'Masquer les dossiers'
                                            : 'Afficher les dossiers'
                                    }
                                    placement="top"
                                >
                                    <IconButton
                                        onClick={toggleAllFolders}
                                        size="small"
                                        color="primary"
                                    >
                                        {isFolderListExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                </Tooltip>
                            </div>{' '}
                            {isFolderListExpanded && (
                                <div className="folder-list mb-3">
                                    {folders.map((folder, index) => (
                                        <React.Fragment key={folder._id}>
                                            <div className="folder-item">
                                                <Button
                                                    variant="text"
                                                    fullWidth
                                                    className="justify-content-start text-start"
                                                    onClick={() =>
                                                        setSelectedFolderId(
                                                            selectedFolderId === folder._id
                                                                ? ''
                                                                : folder._id
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className="flex-fill text-truncate"
                                                        style={{ fontSize: '0.9rem' }}
                                                    >
                                                        {folder.title}
                                                    </span>
                                                    
                                                </Button>
                                            </div>
                                            {index < folders.length - 1 && <div className="my-1 border-top"></div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Folder Actions Section */}
                        <div className="bg-light rounded-3 shadow-sm p-3">
                            <div className="d-grid gap-2">
                                <div className="d-flex gap-1">
                                    <Tooltip title="Ajouter dossier" placement="top">
                                        <IconButton
                                            color="primary"
                                            onClick={handleCreateFolder}
                                            size="small"
                                            className="flex-fill"
                                            aria-label="Ajouter dossier"
                                        >
                                            <Add />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Renommer dossier" placement="top">
                                        <div className="flex-fill">
                                            <IconButton
                                                color="primary"
                                                onClick={handleRenameFolder}
                                                disabled={selectedFolderId == ''}
                                                size="small"
                                                className="w-100"
                                                aria-label="Renommer dossier"
                                            >
                                                <Edit />
                                            </IconButton>
                                        </div>
                                    </Tooltip>
                                </div>

                                <div className="d-flex gap-1">
                                    <Tooltip title="Dupliquer dossier" placement="top">
                                        <div className="flex-fill">
                                            <IconButton
                                                color="primary"
                                                onClick={handleDuplicateFolder}
                                                disabled={selectedFolderId == ''}
                                                size="small"
                                                className="w-100"
                                                aria-label="Dupliquer dossier"
                                            >
                                                <FolderCopy />
                                            </IconButton>
                                        </div>
                                    </Tooltip>

                                    <Tooltip title="Supprimer dossier" placement="top">
                                        <div className="flex-fill">
                                            <IconButton
                                                color="primary"
                                                onClick={handleDeleteFolder}
                                                disabled={selectedFolderId == ''}
                                                size="small"
                                                className="w-100"
                                                aria-label="Supprimer dossier"
                                            >
                                                <DeleteOutline />
                                            </IconButton>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-lg-8 col-md-7 bg-white shadow-sm">
                    <div className="p-4 h-100">
                        {/* Search and Action Bar */}
                        <div className="bg-light rounded-3 shadow-sm p-3 mb-4">
                            <div className="d-flex justify-content-between align-items-center gap-3">
                                <div className="flex-grow-1">
                                    {!isSearchVisible ? (
                                        <button
                                            type="button"
                                            onClick={toggleSearchVisibility}
                                            className="btn btn-outline-primary rounded d-flex align-items-center justify-content-center"
                                            data-testid="search-toggle-icon"
                                            style={{ width: '40px', height: '40px' }}
                                        >
                                            <Search />
                                        </button>
                                    ) : (
                                        <TextField
                                            onChange={handleSearch}
                                            value={searchTerm}
                                            placeholder="Rechercher un quiz"
                                            fullWidth
                                            autoFocus
                                            className="rounded"
                                            slotProps={{
                                                input: {
                                                    className: 'form-control bg-white fw-medium',
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <button
                                                                type="button"
                                                                onClick={toggleSearchVisibility}
                                                                className="btn btn-outline-primary btn-sm rounded d-flex align-items-center justify-content-center"
                                                                data-testid="search-close-icon"
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px'
                                                                }}
                                                            >
                                                                <Search fontSize="small" />
                                                            </button>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<Add />}
                                        onClick={handleCreateQuiz}
                                        className="btn btn-outline-primary rounded px-3 py-1"
                                    >
                                        Nouveau quiz
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<Upload />}
                                        onClick={handleOnImport}
                                        className="btn btn-outline-primary rounded"
                                    >
                                        Importer
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Quiz List */}
                        <div className="list">
                            {Object.keys(quizzesByFolder).map((folderName) => (
                                <div
                                    key={folderName}
                                    className="card folder-card my-5 rounded-3 shadow-sm border"
                                >
                                    <div className="folder-tab">{folderName}</div>
                                    <div className="card-body">
                                        {quizzesByFolder[folderName].map(
                                            (quiz: QuizType, index: number) => (
                                                <div key={quiz._id}>
                                                    <div className="quiz d-flex align-items-center py-2 w-100">
                                                        <div className="title flex-fill">
                                                            <Tooltip
                                                                title="Démarrer"
                                                                placement="top"
                                                            >
                                                                <div>
                                                                    <Button
                                                                        variant="text"
                                                                        onClick={() =>
                                                                            handleLancerQuiz(quiz)
                                                                        }
                                                                        disabled={
                                                                            !validateQuiz(
                                                                                quiz.content
                                                                            )
                                                                        }
                                                                        startIcon={<PlayArrow />}
                                                                        className="text-start justify-content-start w-100 btn btn-outline-light text-dark"
                                                                    >
                                                                        {`${quiz.title} (${
                                                                            quiz.content.length
                                                                        } question${
                                                                            quiz.content.length > 1
                                                                                ? 's'
                                                                                : ''
                                                                        })`}
                                                                    </Button>
                                                                </div>
                                                            </Tooltip>
                                                        </div>

                                                        <div className="actions flex-shrink-0 d-flex align-items-center gap-1">
                                                            <div className="dashboard">
                                                                <DownloadQuizModal quiz={quiz} />
                                                            </div>

                                                            <Tooltip
                                                                title="Modifier"
                                                                placement="top"
                                                            >
                                                                <IconButton
                                                                    onClick={() =>
                                                                        handleEditQuiz(quiz)
                                                                    }
                                                                    size="small"
                                                                    aria-label="Modifier"
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip
                                                                title="Plus d'actions"
                                                                placement="top"
                                                            >
                                                                <IconButton
                                                                    onClick={(event) =>
                                                                        handleMenuOpen(event, quiz)
                                                                    }
                                                                    size="small"
                                                                    aria-label="Plus d'actions"
                                                                >
                                                                    <MoreVert fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                    {index <
                                                        quizzesByFolder[folderName].length - 1 && (
                                                        <div className="my-1 border-top"></div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {/* Room Creation Dialog */}
            <Dialog open={openAddRoomDialog} onClose={() => setOpenAddRoomDialog(false)} fullWidth>
                <DialogTitle>Créer une nouvelle salle</DialogTitle>
                <DialogContent dividers>
                    <ValidatedTextField
                        fieldPath="room.name"
                        initialValue={newRoomTitle}
                        onValueChange={(value) => setNewRoomTitle(value.toUpperCase())}
                        label="Nom de la salle"
                        fullWidth
                        autoFocus
                        variant="outlined"
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddRoomDialog(false)}>Annuler</Button>
                    <Button onClick={handleCreateRoom} variant="contained">
                        Créer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error Dialog */}
            <Dialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)}>
                <DialogTitle>Erreur</DialogTitle>
                <DialogContent>
                    <DialogContentText>{errorMessage}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowErrorDialog(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Folder Creation Dialog */}
            <Dialog open={openAddFolderDialog} onClose={handleCancelCreateFolder} fullWidth>
                <DialogTitle>Créer un nouveau dossier</DialogTitle>
                <DialogContent dividers>
                    <ValidatedTextField
                        fieldPath="folder.title"
                        initialValue={newFolderTitle}
                        onValueChange={(value) => setNewFolderTitle(value)}
                        label="Titre du dossier"
                        fullWidth
                        autoFocus
                        variant="outlined"
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelCreateFolder}>Annuler</Button>
                    <Button onClick={handleConfirmCreateFolder} variant="contained">
                        Créer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Folder Rename Dialog */}
            <Dialog open={openRenameFolderDialog} onClose={handleCancelRenameFolder} fullWidth>
                <DialogTitle>Renommer le dossier</DialogTitle>
                <DialogContent dividers>
                    <ValidatedTextField
                        fieldPath="folder.title"
                        initialValue={renameFolderTitle}
                        onValueChange={(value) => setRenameFolderTitle(value)}
                        label="Nouveau titre du dossier"
                        fullWidth
                        autoFocus
                        variant="outlined"
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelRenameFolder}>Annuler</Button>
                    <Button onClick={handleConfirmRenameFolder} variant="contained">
                        Renommer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quiz Actions Dropdown Menu */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleMenuAction('share')}>
                    <Share />
                    Partager
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('duplicate')}>
                    <ContentCopy />
                    Dupliquer
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleMenuAction('delete')}>
                    <Delete />
                    Supprimer
                </MenuItem>
            </Menu>

            {/* Import Modal */}
            <ImportModal
                open={showImportModal}
                handleOnClose={() => setShowImportModal(false)}
                handleOnImport={handleOnImport}
                selectedFolder={selectedFolderId}
            />
        </div>
    );
};

export default DashboardV2;

// Helper function to add folder title to quizzes
function addFolderTitleToQuizzes(folderQuizzes: string | QuizType[], folderName: string) {
    if (Array.isArray(folderQuizzes))
        folderQuizzes.forEach((quiz) => {
            quiz.folderName = folderName;
            console.log(`quiz: ${quiz.title} folder: ${quiz.folderName}`);
        });
}
