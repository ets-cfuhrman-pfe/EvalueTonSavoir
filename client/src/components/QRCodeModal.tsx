import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    Typography,
    Box
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';

interface QRCodeModalProps {
    open: boolean;
    onClose: () => void;
    roomName: string;
    roomUrl: string;
    copied: boolean;
    onCopy: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
    open,
    onClose,
    roomName,
    roomUrl,
    copied,
    onCopy
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Rejoindre la salle: {roomName}</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body1" gutterBottom>
                    Scannez ce QR code ou partagez le lien ci-dessous:
                </Typography>

                <Box display="flex" justifyContent="center" my={2}>
                    <QRCodeCanvas value={roomUrl} size={200} />
                </Box>

                <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                        URL de participation:
                    </Typography>
                    <Typography variant="body2">{roomUrl}</Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopy />}
                        onClick={onCopy}
                    >
                        {copied ? 'Copié!' : 'Copier le lien'}
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fermer</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRCodeModal;