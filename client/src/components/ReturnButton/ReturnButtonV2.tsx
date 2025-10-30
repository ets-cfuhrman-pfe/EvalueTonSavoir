// ReturnButtonV2.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import UnsavedChangesDialog from '../UnsavedChangesDialog/UnsavedChangesDialog';
import { Button } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';

interface ReturnButtonV2Props {
    onReturn?: () => void;
    askConfirm?: boolean;
    message?: string;
    // New props for quiz editor functionality
    hasUnsavedChanges?: () => boolean;
    onSaveAndQuit?: () => void;
    onDontSaveAndQuit?: () => void;
}

const ReturnButtonV2: React.FC<ReturnButtonV2Props> = ({
    askConfirm = false,
    message = 'Êtes-vous sûr de vouloir quitter la page ?',
    onReturn,
    // New props for quiz editor
    hasUnsavedChanges,
    onSaveAndQuit,
    onDontSaveAndQuit
}) => {
    const navigate = useNavigate();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    const handleOnReturnButtonClick = () => {
        // If hasUnsavedChanges function is provided, use the new logic
        if (hasUnsavedChanges) {
            if (hasUnsavedChanges()) {
                setShowUnsavedDialog(true);
            } else {
                setShowConfirmDialog(true);
            }
        } else if (askConfirm) {
            // Legacy behavior
            setShowConfirmDialog(true);
        } else {
            handleOnReturn();
        }
    };

    const handleConfirm = () => {
        setShowConfirmDialog(false);
        handleOnReturn();
    };

    const handleSaveAndQuit = () => {
        setShowUnsavedDialog(false);
        if (onSaveAndQuit) {
            onSaveAndQuit();
        } else {
            handleOnReturn();
        }
    };

    const handleDontSaveAndQuit = () => {
        setShowUnsavedDialog(false);
        if (onDontSaveAndQuit) {
            onDontSaveAndQuit();
        } else {
            handleOnReturn();
        }
    };

    const handleDialogCancel = () => {
        setShowConfirmDialog(false);
        setShowUnsavedDialog(false);
    };

    const handleOnReturn = () => {
        if (onReturn) {
            onReturn();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="return-button">
            <Button
                variant="contained"
                startIcon={<ChevronLeft />}
                onClick={handleOnReturnButtonClick}
                size="large"
                className="btn-return"
            >
                Retour
            </Button>

            {/* Simple confirmation dialog (legacy or no unsaved changes) */}
            <ConfirmDialog
                open={showConfirmDialog}
                title="Confirmer"
                message={message}
                onConfirm={handleConfirm}
                onCancel={handleDialogCancel}
                buttonOrderType="warning"
            />

            {/* Unsaved changes dialog (for quiz editor) */}
            <UnsavedChangesDialog
                open={showUnsavedDialog}
                onSave={handleSaveAndQuit}
                onDontSave={handleDontSaveAndQuit}
                onCancel={handleDialogCancel}
            />
        </div>
    );
};

export default ReturnButtonV2;