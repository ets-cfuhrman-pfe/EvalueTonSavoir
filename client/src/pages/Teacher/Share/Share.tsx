import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderType } from '../../../Types/FolderType';
import { Button, NativeSelect } from '@mui/material';
import ReturnButton from 'src/components/ReturnButton/ReturnButton';
import ApiService from '../../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

const Share: React.FC = () => {
    console.log('Component rendered');
    const navigate = useNavigate();
    const { id } = useParams<string>();

    const [quizTitle, setQuizTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [folders, setFolders] = useState<FolderType[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            console.log("QUIZID : " + id)
            if (!id) {
                window.alert(`Une erreur est survenue.\n Le quiz n'a pas été trouvé\nVeuillez réessayer plus tard`)
                console.error('Quiz not found for id:', id);
                navigate('/teacher/dashboard');
                return;
            }

            if (!ApiService.isLoggedIn()) {
                window.alert(`Vous n'êtes pas connecté.\nVeuillez vous connecter et revenir à ce lien`);
                navigate("/login");
                return;
            }

            const userFolders = await ApiService.getUserFolders();

            if (userFolders.length == 0) {
                window.alert(`Vous n'avez aucun dossier.\nVeuillez en créer un et revenir à ce lien`)
                navigate('/teacher/dashboard');
                return;
            }

            setFolders(userFolders as FolderType[]);

            const title = await ApiService.getSharedQuiz(id);

            if (!title) {
                window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
                console.error('Quiz not found for id:', id);
                navigate('/teacher/dashboard');
                return;
            }

            setQuizTitle(title);
        };

        fetchData();
    }, []);

    const handleSelectFolder = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFolder(event.target.value);
    };

    const handleQuizSave = async () => {
        try {
            if (selectedFolder == '') {
                alert("Veuillez choisir un dossier");
                return;
            }

            if (!id) {
                window.alert(`Une erreur est survenue.\n Le quiz n'a pas été trouvé\nVeuillez réessayer plus tard`)
                console.error('Quiz not found for id:', id);
                navigate('/teacher/dashboard');
                return;
            }

            await ApiService.receiveSharedQuiz(id, selectedFolder)
            navigate('/teacher/dashboard');

        } catch (error) {
            window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`)
            console.log(error)
        }
    };

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <ReturnButton />
                <h2 className="text-center mb-0 flex-grow-1">Importer quiz: {quizTitle}</h2>
                <div style={{ width: '10%' }}></div> {/* Spacer for alignment */}
            </div>

            {/* Main Content */}
            <div className="d-flex flex-column align-items-center">
                <div className="w-100 mb-3">
                    <NativeSelect
                        id="select-folder"
                        color="primary"
                        value={selectedFolder}
                        onChange={handleSelectFolder}
                        className="w-100 mb-3"
                    >
                        <option disabled value="">Choisir un dossier...</option>
                        {folders.map((folder: FolderType) => (
                            <option value={folder._id} key={folder._id}>{folder.title}</option>
                        ))}
                    </NativeSelect>
                </div>

                <Button
                    variant="contained"
                    onClick={handleQuizSave}
                    className="w-100"
                >
                    Enregistrer
                </Button>
            </div>
        </div>
    );
};

export default Share;