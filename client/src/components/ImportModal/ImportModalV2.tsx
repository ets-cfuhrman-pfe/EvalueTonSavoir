import React, { useState, DragEvent, useRef, useEffect } from 'react';
import '../../styles/main.scss';

import { Clear, Download } from '@mui/icons-material';
import ApiService from '../../services/ApiService';

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

const ImportModalV2: React.FC<Props> = ({ handleOnClose, handleOnImport, open, selectedFolder }) => {
    const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            setDroppedFiles([]);
        };
    }, []);

    const handleDragEnter = (e: DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
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
                            .map(question => question.trim() + "}")
                            .filter(question => question.trim() !== '').slice(0, -1);

                        try {
                            await ApiService.createQuiz(droppedFile.name.slice(0, -4) || 'Untitled quiz', questions, selectedFolder);
                            resolve('success');
                        } catch (error) {
                            console.error('Error saving quiz:', error);
                            resolve(null);
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

    if (!open) return null;

    return (
        <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Importation de quiz</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleOnCancel}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {/* Drag and drop area */}
                        <button
                            type="button"
                            className="btn border border-primary border-dashed rounded p-4 text-center mb-3 d-block w-100 d-flex flex-column justify-content-center align-items-center bg-transparent drop-zone-height"
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={handleBrowseButtonClick}
                        >
                            <Download 
                                color="primary" 
                                sx={{ fontSize: '3rem', marginBottom: '1rem' }} 
                            />
                            <p className="mb-1">
                                Déposer des fichiers ici ou<br />
                                <span className="text-primary fw-bold">cliquez pour ouvrir l'explorateur</span>
                            </p>
                            <small className="text-muted">Formats acceptés: .txt</small>
                        </button>

                        {/* File list */}
                        {droppedFiles.length > 0 && (
                            <div className="mb-3">
                                <h6>Fichiers à importer:</h6>
                                <div className="list-group">
                                    {droppedFiles.map((file) => (
                                        <div key={file.id + file.name} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">{file.icon}</span>
                                                <span>{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRemoveFile(file.id)}
                                            >
                                                <Clear fontSize="small" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleOnCancel}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleOnSave}
                            disabled={droppedFiles.length === 0}
                        >
                            Importer ({droppedFiles.length})
                        </button>
                    </div>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="d-none"
                onChange={handleFileInputChange}
                multiple
                accept=".txt"
            />
        </div>
    );
};

export default ImportModalV2;