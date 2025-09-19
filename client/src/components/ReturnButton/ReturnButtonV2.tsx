// ReturnButtonV2.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { Button } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';

interface ReturnButtonV2Props {
    onReturn?: () => void;
    askConfirm?: boolean;
    message?: string;
}

const ReturnButtonV2: React.FC<ReturnButtonV2Props> = ({
    askConfirm = false,
    message = 'Êtes-vous sûr de vouloir quitter la page ?',
    onReturn
}) => {
    const navigate = useNavigate();
    const [showDialog, setShowDialog] = useState(false);

    const handleOnReturnButtonClick = () => {
        if (askConfirm) {
            setShowDialog(true);
        } else {
            handleOnReturn();
        }
    };

    const handleConfirm = () => {
        setShowDialog(false);
        handleOnReturn();
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
            <ConfirmDialog
                open={showDialog}
                title="Confirmer"
                message={message}
                onConfirm={handleConfirm}
                onCancel={() => setShowDialog(false)}
                buttonOrderType="warning"
            />
        </div>
    );
};

export default ReturnButtonV2;