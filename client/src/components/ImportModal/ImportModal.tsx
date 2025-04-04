import React, { useState, DragEvent, useRef, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton
} from '@mui/material';
import { Clear, Download } from '@mui/icons-material';
import ApiService from '../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

type DroppedFile = {
    id: number;
    name: string;
    icon: string;
    file: File;
};

interface Props {
    handleOnClose: () => void;
    handleOnImport: () => void;
    open: boolean;
    selectedFolder: string;
}

const DragAndDrop: React.FC<Props> = ({ handleOnClose, handleOnImport, open, selectedFolder }) => {
    const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            setDroppedFiles([]);
        };
    }, []);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleFiles = (files: FileList) => {
        const newDroppedFiles = Array.from(files)
            .filter((file) => file.name.endsWith('.txt'))
            .map((file, index) => ({
                id: index,
                name: file.name,
                icon: '📄',
                file
            }));

        setDroppedFiles((prevFiles) => [...prevFiles, ...newDroppedFiles]);
    };

    const handleOnSave = async () => {
        const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        const quizzesToImportPromises = droppedFiles.map((droppedFile) => {
            return new Promise((resolve) => {
                const reader = new FileReader();

                reader.onload = async (event) => {
                    if (event.target && event.target.result) {
                        const fileContent = event.target.result as string;
                        if (fileContent.trim() === '') {
                            resolve(null);
                        }
                        const questions = fileContent.split(/}/)
                            .map(question => {
                                return question.trim() + "}";
                            })
                            .filter(question => question.trim() !== '').slice(0, -1);

                        try {
                            await ApiService.createQuiz(droppedFile.name.slice(0, -4) || 'Untitled quiz', questions, selectedFolder);
                            resolve('success');
                        } catch (error) {
                            console.error('Error saving quiz:', error);
                        }
                    }
                };
                reader.readAsText(droppedFile.file);
            });
        });

        Promise.all(quizzesToImportPromises).then((quizzesToImport) => {
            const verifiedQuizzesToImport = quizzesToImport.filter((quiz) => {
                return quiz !== null;
            });

            const updatedQuizzes = [...storedQuizzes, ...verifiedQuizzesToImport];
            localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));

            setDroppedFiles([]);
            handleOnImport();
            handleOnClose();
            window.location.reload();
        });
    };

    const handleRemoveFile = (id: number) => {
        setDroppedFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            handleFiles(files);
        }
    };

    const handleBrowseButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleOnCancel = () => {
        setDroppedFiles([]);
        handleOnClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleOnCancel} fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: 24 }}>
                    {'Importation de quiz'}
                </DialogTitle>
                <DialogContent
                    className="border border-2 border-dashed border-secondary d-flex flex-column justify-content-center align-items-center p-4 mx-3 my-2"
                    style={{ height: '20vh', cursor: 'pointer' }}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleBrowseButtonClick}
                >
                    <div className="mb-2">
                        <DialogContentText className="text-center">
                            Déposer des fichiers ici ou
                            <br />
                            cliquez pour ouvrir l&apos;explorateur des fichiers
                        </DialogContentText>
                    </div>
                    <Download color="primary" />
                </DialogContent>
                <DialogContent>
                    {droppedFiles.map((file) => (
                        <div key={file.id + file.name} className="d-flex align-items-center gap-2 p-1">
                            <span>{file.icon}</span>
                            <span>{file.name}</span>
                            <IconButton
                                sx={{ padding: 0 }}
                                onClick={() => handleRemoveFile(file.id)}
                            >
                                <Clear />
                            </IconButton>
                        </div>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleOnCancel}>
                        Annuler
                    </Button>
                    <Button variant="contained" onClick={handleOnSave}>
                        Importer
                    </Button>
                </DialogActions>
            </Dialog>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
                multiple
            />
        </>
    );
};

export default DragAndDrop;