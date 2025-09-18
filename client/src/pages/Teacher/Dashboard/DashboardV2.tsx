import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { parse } from 'gift-pegjs';

import Template from 'src/components/GiftTemplate/templates';
import { QuizType } from '../../../Types/QuizType';
import { FolderType } from '../../../Types/FolderType';
import { RoomType } from '../../../Types/RoomType';
import ApiService from '../../../services/ApiService';
import ImportModal from 'src/components/ImportModal/ImportModal';
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
    Divider,
    ListItemIcon,
    ListItemText,
    Box,
    FormControl,
    InputLabel,
    Select,
    List,
    ListItem,
    Stack,
} from '@mui/material';
import {
    Search,
    DeleteOutline,
    Add,
    Upload,
    ContentCopy,
    Edit,
    MoreVert,
    Delete,
    PlayArrow,
    Share,
    ExpandMore,
    ExpandLess,
    Check,
    Close
} from '@mui/icons-material';

const DashboardV2: React.FC = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<QuizType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');

    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [openAddFolderDialog, setOpenAddFolderDialog] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [openRenameFolderDialog, setOpenRenameFolderDialog] = useState(false);
    const [renameFolderTitle, setRenameFolderTitle] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedQuizForMenu, setSelectedQuizForMenu] = useState<QuizType | null>(null);
    const [folderMenuAnchor, setFolderMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedFolderForMenu, setSelectedFolderForMenu] = useState<FolderType | null>(null);
    const [isFolderListExpanded, setIsFolderListExpanded] = useState(true);

    // Room management
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [showRoomOptions, setShowRoomOptions] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [newRoomTitle, setNewRoomTitle] = useState('');
    const [editingRoomId, setEditingRoomId] = useState<string>('');
    const [editRoomTitle, setEditRoomTitle] = useState('');

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
        if (!selectedRoomId) {
            alert('Veuillez sélectionner une salle avant de lancer le quiz');
            return;
        }
        // Store selected room for the ManageRoomV2 component
        localStorage.setItem('selectedRoomId', selectedRoomId);
        navigate(`/teacher/manage-room-v2/${quiz._id}`);
    };

    const handleCreateRoom = async () => {
        if (newRoomTitle.trim()) {
            try {
                const newRoomId = await ApiService.createRoom(newRoomTitle.trim());
                const updatedRooms = await ApiService.getUserRooms();
                if (Array.isArray(updatedRooms)) {
                    setRooms(updatedRooms);
                    setSelectedRoomId(newRoomId);
                }
                setNewRoomTitle('');
                setShowCreateRoom(false);
            } catch (error) {
                console.error('Error creating room:', error);
                alert('Erreur lors de la création de la salle');
            }
        }
    };

    const handleEditRoom = (roomId: string) => {
        const room = rooms.find((r) => r._id === roomId);
        if (room) {
            setEditingRoomId(roomId);
            setEditRoomTitle(room.title);
        }
    };

    const handleSaveRoomEdit = async () => {
        if (editRoomTitle.trim() && editingRoomId) {
            try {
                await ApiService.renameRoom(editingRoomId, editRoomTitle.trim());
                const updatedRooms = await ApiService.getUserRooms();
                if (Array.isArray(updatedRooms)) {
                    setRooms(updatedRooms);
                }
                setEditingRoomId('');
                setEditRoomTitle('');
            } catch (error) {
                console.error('Error updating room:', error);
                alert('Erreur lors de la modification de la salle');
            }
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        const room = rooms.find((r) => r._id === roomId);
        if (room && window.confirm(`Voulez-vous vraiment supprimer la salle "${room.title}"?`)) {
            try {
                await ApiService.deleteRoom(roomId);
                const updatedRooms = await ApiService.getUserRooms();
                if (Array.isArray(updatedRooms)) {
                    setRooms(updatedRooms);
                    if (selectedRoomId === roomId) {
                        setSelectedRoomId('');
                    }
                }
            } catch (error) {
                console.error('Error deleting room:', error);
                alert('Erreur lors de la suppression de la salle');
            }
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

    const handleFolderMenuOpen = (event: React.MouseEvent<HTMLElement>, folder: FolderType) => {
        event.stopPropagation(); // Prevent folder selection when clicking menu
        setFolderMenuAnchor(event.currentTarget);
        setSelectedFolderForMenu(folder);
    };

    const handleFolderMenuClose = () => {
        setFolderMenuAnchor(null);
        setSelectedFolderForMenu(null);
    };

    const handleFolderMenuAction = (action: string) => {
        if (!selectedFolderForMenu) return;

        handleFolderMenuClose();

        switch (action) {
            case 'select':
                setSelectedFolderId(selectedFolderForMenu._id);
                break;
            case 'rename':
                setRenameFolderTitle(selectedFolderForMenu.title);
                setOpenRenameFolderDialog(true);
                break;
            case 'duplicate':
                handleDuplicateFolder();
                break;
            case 'delete':
                handleDeleteFolder();
                break;
        }
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
        const folderToDelete =
            selectedFolderForMenu || folders.find((f) => f._id === selectedFolderId);
        if (!folderToDelete) return;

        try {
            const confirmed = window.confirm(
                `Voulez-vous vraiment supprimer le dossier "${folderToDelete.title}"?`
            );
            if (confirmed) {
                await ApiService.deleteFolder(folderToDelete._id);
                const userFolders = await ApiService.getUserFolders();
                setFolders(userFolders as FolderType[]);

                const folders = await ApiService.getUserFolders(); // HACK force user folders to load on first load
                let quizzes: QuizType[] = [];

                for (const folder of folders as FolderType[]) {
                    const folderQuizzes = await ApiService.getFolderContent(folder._id);
                    quizzes = quizzes.concat(folderQuizzes as QuizType[]);
                }

                setQuizzes(quizzes);
                if (selectedFolderId === folderToDelete._id) {
                    setSelectedFolderId('');
                }
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
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
        const folderToDuplicate =
            selectedFolderForMenu || folders.find((f) => f._id === selectedFolderId);
        if (!folderToDuplicate) return;

        try {
            await ApiService.duplicateFolder(folderToDuplicate._id);
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
                    const userFolders = await ApiService.getUserFolders();
                    setFolders(userFolders as FolderType[]);
                } catch (error) {
                    console.error('Error fetching user folders:', error);
                    setFolders([]);
                }

                try {
                    const userRooms = await ApiService.getUserRooms();
                    if (Array.isArray(userRooms)) {
                        setRooms(userRooms);
                        // Set default to latest used room
                        const latestRoomId = localStorage.getItem('selectedRoomId');
                        if (latestRoomId && userRooms.some((room) => room._id === latestRoomId)) {
                            setSelectedRoomId(latestRoomId);
                        } else if (userRooms.length > 0) {
                            setSelectedRoomId(userRooms[userRooms.length - 1]._id);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user rooms:', error);
                    setRooms([]);
                }
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        const fetchQuizzesForFolder = async () => {
            if (selectedFolderId == '') {
                const folders = await ApiService.getUserFolders(); // HACK force user folders to load on first load
                let quizzes: QuizType[] = [];

                for (const folder of folders as FolderType[]) {
                    const folderQuizzes = await ApiService.getFolderContent(folder._id);
                    addFolderTitleToQuizzes(folderQuizzes, folder.title);
                    quizzes = quizzes.concat(folderQuizzes as QuizType[]);
                }

                setQuizzes(quizzes);
            } else {
                const folderQuizzes = await ApiService.getFolderContent(selectedFolderId);
                const folderTitle =
                    folders.find((folder) => folder._id === selectedFolderId)?.title || '';
                addFolderTitleToQuizzes(folderQuizzes, folderTitle);
                setQuizzes(folderQuizzes as QuizType[]);
            }
        };

        fetchQuizzesForFolder();
    }, [selectedFolderId, folders]);

    return (
        <div className="content-container">
            <div className="w-100 p-0 content-full-width">
                {/* Top Dashboard Header */}
                <div className="bg-white border-bottom shadow-sm">
                    <div className="container-fluid px-2 py-4 content-full-width">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h3 mb-0 ms-3 text-dark fw-bold">Tableau de bord</h1>
                            </div>
                            <div className="d-flex align-items-center gap-2 px-4">
                                <span className="h5 fw-bold">Salle active :</span>
                                <FormControl size="small" className="pb-2">
                                    <Select
                                        value={selectedRoomId}
                                        onChange={(e) => {
                                            const newRoomId = e.target.value;
                                            setSelectedRoomId(newRoomId);
                                            // Save selected room to localStorage
                                            if (newRoomId) {
                                                localStorage.setItem('selectedRoomId', newRoomId);
                                            } else {
                                                localStorage.removeItem('selectedRoomId');
                                            }
                                        }}
                                        displayEmpty
                                        className="bg-white"                            
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return <em className="text-muted">Aucune salle</em>;
                                            }
                                            const room = rooms.find((r) => r._id === selected);
                                            return <span className="text-success fw-bold">{room?.title}</span>;
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>Aucune salle sélectionnée</em>
                                        </MenuItem>
                                        {rooms.map((room) => (
                                            <MenuItem 
                                                key={room._id} 
                                                value={room._id}
                                                className={selectedRoomId === room._id ? 'text-success fw-bold' : ''}
                                            >
                                                {room.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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
                                            className="p-0 text-dark fw-bolder fs-5"
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
                                    <div>
                                        <div className="folder-list mb-3">
                                            {folders.map((folder, index) => (
                                                <React.Fragment key={folder._id}>
                                                    <div className="folder-item d-flex align-items-center">
                                                        <Button
                                                            variant="text"
                                                            className={`justify-content-start text-start flex-fill text-decoration-none ${selectedFolderId === folder._id
                                                                ? 'bg-primary bg-opacity-10'
                                                                : ''
                                                                }`}
                                                            onClick={() =>
                                                                setSelectedFolderId(
                                                                    selectedFolderId === folder._id
                                                                        ? ''
                                                                        : folder._id
                                                                )
                                                            }
                                                        >
                                                            <span className="flex-fill text-truncate">
                                                                {folder.title}
                                                            </span>
                                                        </Button>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) =>
                                                                handleFolderMenuOpen(e, folder)
                                                            }
                                                            className="ms-1"
                                                        >
                                                            <MoreVert
                                                                style={{ fontSize: '1.5rem' }}
                                                            />
                                                        </IconButton>
                                                    </div>
                                                    {index < folders.length - 1 && (
                                                        <div className="my-1 border-top"></div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Add Folder Button */}
                                        <div className="text-center">
                                            <button
                                                className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center"
                                                onClick={handleCreateFolder}
                                            >
                                                <Add
                                                    style={{ fontSize: '1rem' }}
                                                    className="me-2"
                                                />
                                                Nouveau dossier
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Room Management Section */}
                            <div className="bg-light rounded-3 shadow-sm p-3 mt-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Button
                                        variant="text"
                                        onClick={() => setShowRoomOptions(!showRoomOptions)}
                                        className="p-0 text-dark fw-bolder fs-5"
                                    >
                                        Salles
                                    </Button>
                                    <Tooltip
                                        title={
                                            showRoomOptions
                                                ? 'Masquer les salles'
                                                : 'Afficher les salles'
                                        }
                                        placement="top"
                                    >
                                        <IconButton
                                            onClick={() => setShowRoomOptions(!showRoomOptions)}
                                            size="small"
                                            color="primary"
                                        >
                                            {showRoomOptions ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    </Tooltip>
                                </div>

                                {showRoomOptions && (
                                    <div>
                                        {/* Room Management */}
                                        <Box mb={3}>
                                            <List disablePadding>
                                                {rooms.map((room, idx) => {
                                                    const isEditing = editingRoomId === room._id;

                                                    return (
                                                        <Box key={room._id} component="li">
                                                            <ListItem
                                                                disableGutters
                                                                secondaryAction={
                                                                    isEditing ? (
                                                                        <Stack direction="row" spacing={0.5}>
                                                                            <Tooltip title="Sauvegarder">
                                                                                <span>
                                                                                    <IconButton
                                                                                        color="success"
                                                                                        size="small"
                                                                                        onClick={handleSaveRoomEdit}
                                                                                        disabled={!editRoomTitle.trim()}
                                                                                        aria-label="sauvegarder"
                                                                                    >
                                                                                        <Check fontSize="small" />
                                                                                    </IconButton>
                                                                                </span>
                                                                            </Tooltip>

                                                                            <Tooltip title="Annuler">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => {
                                                                                        setEditingRoomId("");
                                                                                        setEditRoomTitle("");
                                                                                    }}
                                                                                    aria-label="annuler"
                                                                                >
                                                                                    <Close fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Stack>
                                                                    ) : (
                                                                        <Stack direction="row" spacing={0.5}>
                                                                            <Tooltip title="Modifier">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="primary"
                                                                                    onClick={() => handleEditRoom(room._id)}
                                                                                    aria-label="modifier"
                                                                                >
                                                                                    <Edit fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>

                                                                            <Tooltip title="Supprimer">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="error"
                                                                                    onClick={() => handleDeleteRoom(room._id)}
                                                                                    aria-label="supprimer"
                                                                                >
                                                                                    <DeleteOutline fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Stack>
                                                                    )
                                                                }
                                                            >
                                                                {isEditing ? (
                                                                    <TextField
                                                                        size="small"
                                                                        value={editRoomTitle}
                                                                        onChange={(e) => setEditRoomTitle(e.target.value.toUpperCase())}
                                                                        autoFocus
                                                                        fullWidth
                                                                        placeholder="Titre de la salle"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <ListItemIcon sx={{ minWidth: 0, mr: 1 }} />
                                                                        <ListItemText
                                                                            primary={room.title}
                                                                        />
                                                                    </>
                                                                )}
                                                            </ListItem>

                                                            {idx < rooms.length - 1 && <Divider component="li" />}
                                                        </Box>
                                                    );
                                                })}
                                            </List>
                                        </Box>

                                        {/* Create Room Section */}
                                        {!showCreateRoom ? (
                                            <button
                                                className="btn btn-outline-primary btn-sm w-100 mb-3 d-flex align-items-center justify-content-center"
                                                onClick={() => setShowCreateRoom(true)}
                                            >
                                                <Add
                                                    style={{ fontSize: '1rem' }}
                                                    className="me-2"
                                                />
                                                Nouvelle salle
                                            </button>
                                        ) : (
                                            <div className="mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm mb-2"
                                                    placeholder="Nom de la salle"
                                                    value={newRoomTitle}
                                                    onChange={(e) =>
                                                        setNewRoomTitle(
                                                            e.target.value.toUpperCase()
                                                        )
                                                    }
                                                    autoFocus
                                                />
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-success btn-sm flex-fill"
                                                        onClick={handleCreateRoom}
                                                        disabled={!newRoomTitle.trim()}
                                                    >
                                                        Créer
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm flex-fill"
                                                        onClick={() => {
                                                            setShowCreateRoom(false);
                                                            setNewRoomTitle('');
                                                        }}
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                                style={{ width: '40px', height: '40px' }}
                                                data-testid="search-toggle-icon"
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
                                                        className:
                                                            'form-control bg-white fw-medium',
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <button
                                                                    type="button"
                                                                    onClick={toggleSearchVisibility}
                                                                    className="btn btn-outline-primary btn-sm rounded d-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px'
                                                                    }}
                                                                    data-testid="search-close-icon"
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
                                                            <div className="title flex-fill d-flex align-items-center gap-3">
                                                                <Tooltip
                                                                    title="Démarrer le quiz"
                                                                    placement="top-start"
                                                                >
                                                                    <IconButton
                                                                        color="primary"
                                                                        size="large"
                                                                        className="border border-2 border-primary rounded-circle"
                                                                        onClick={() =>
                                                                            handleLancerQuiz(quiz)
                                                                        }
                                                                        disabled={
                                                                            !validateQuiz(
                                                                                quiz.content
                                                                            )
                                                                        }
                                                                    >
                                                                        <PlayArrow />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <div className="h5 fw-bold pt-2">
                                                                    {`${quiz.title} (${quiz.content.length
                                                                        } question${quiz.content.length > 1
                                                                            ? 's'
                                                                            : ''
                                                                        })`}
                                                                </div>
                                                            </div>

                                                            <div className="actions flex-shrink-0 d-flex align-items-center gap-1">

                                                                <Tooltip
                                                                    title="Modifier"
                                                                    placement="top"
                                                                >
                                                                    <IconButton
                                                                        onClick={() =>
                                                                            handleEditQuiz(quiz)
                                                                        }
                                                                        color="primary"
                                                                        size="small"
                                                                        aria-label="Modifier"
                                                                    >
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                <div className="dashboard">
                                                                    <DownloadQuizModal
                                                                        quiz={quiz}
                                                                    />
                                                                </div>

                                                                <Tooltip
                                                                    title="Plus d'actions"
                                                                    placement="top"
                                                                >
                                                                    <IconButton
                                                                        onClick={(event) =>
                                                                            handleMenuOpen(
                                                                                event,
                                                                                quiz
                                                                            )
                                                                        }
                                                                        size="small"
                                                                        aria-label="Plus d'actions"
                                                                    >
                                                                        <MoreVert
                                                                            style={{
                                                                                fontSize: '1.5rem'
                                                                            }}
                                                                        />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                        {index <
                                                            quizzesByFolder[folderName].length -
                                                            1 && (
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

                {/* Folder Menu */}
                <Menu
                    anchorEl={folderMenuAnchor}
                    open={Boolean(folderMenuAnchor)}
                    onClose={handleFolderMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}
                >
                    {/* Rename */}
                    <MenuItem onClick={() => handleFolderMenuAction("rename")}>
                        <ListItemIcon>
                            <Edit fontSize="small" sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Renommer"
                        />
                    </MenuItem>
                    {/* Duplicate */}
                    <MenuItem onClick={() => handleFolderMenuAction("duplicate")}>
                        <ListItemIcon>
                            <ContentCopy fontSize="small" sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Dupliquer"
                        />
                    </MenuItem>
                    <Divider />
                    {/* Delete */}
                    <MenuItem onClick={() => handleFolderMenuAction("delete")}>
                        <ListItemIcon>
                            <DeleteOutline fontSize="small" sx={{ color: "error.main" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Supprimer"
                        />
                    </MenuItem>
                </Menu>

                {/* Error Dialog */}
                <Dialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)}>
                    <DialogTitle>Erreur</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Une erreur est survenue.</DialogContentText>
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
                        <ListItemIcon>
                            <Share fontSize="small" sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Partager"
                        />
                    </MenuItem>
                    {/* Duplicate */}
                    <MenuItem onClick={() => handleMenuAction("duplicate")}>
                        <ListItemIcon>
                            <ContentCopy fontSize="small" sx={{ color: "primary.main" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Dupliquer"
                        />
                    </MenuItem>
                    <Divider />
                    {/* Delete */}
                    <MenuItem onClick={() => handleMenuAction("delete")}>
                        <ListItemIcon>
                            <Delete fontSize="small" sx={{ color: "error.main" }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Supprimer"
                        />
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
        </div>
    );
};

export default DashboardV2;

// Helper function to add folder title to quizzes
function addFolderTitleToQuizzes(folderQuizzes: string | QuizType[], folderName: string) {
    if (Array.isArray(folderQuizzes))
        folderQuizzes.forEach((quiz) => {
            quiz.folderName = folderName;
            // console.log(`quiz: ${quiz.title} folder: ${quiz.folderName}`);
        });
}
