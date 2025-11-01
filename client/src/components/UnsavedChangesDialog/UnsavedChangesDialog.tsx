import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';

interface UnsavedChangesDialogProps {
    open: boolean;
    onSave: () => void;
    onDontSave: () => void;
    onCancel: () => void;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
    open,
    onSave,
    onDontSave,
    onCancel,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby="unsaved-changes-dialog-title"
            aria-describedby="unsaved-changes-dialog-description"
            data-testid="unsaved-changes-dialog"
        >
            <DialogTitle id="unsaved-changes-dialog-title">
                Modifications non sauvegardées
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="unsaved-changes-dialog-description">
                    Vous avez des modifications non sauvegardées. Que souhaitez-vous faire ?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit" data-testid="unsaved-cancel-btn">
                    Annuler
                </Button>
                <Button onClick={onDontSave} color="error" variant="outlined" data-testid="unsaved-dont-save-btn">
                    Ne pas sauvegarder
                </Button>
                <Button onClick={onSave} color="primary" variant="contained" data-testid="unsaved-save-btn">
                    Sauvegarder et quitter
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UnsavedChangesDialog;