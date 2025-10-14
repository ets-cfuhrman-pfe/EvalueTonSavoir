// AutoSaveIndicator.tsx
import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorIcon from '@mui/icons-material/Error';
import { AutoSaveStatus } from '../../hooks/useAutoSave';

interface AutoSaveIndicatorProps {
    status: AutoSaveStatus;
    lastSaved: Date | null;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status, lastSaved }) => {
    const formatTimestamp = (date: Date | null) => {
        if (!date) return '';
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        
        if (diffSeconds < 60) {
            return 'à l\'instant';
        } else if (diffMinutes === 1) {
            return 'il y a 1 minute';
        } else if (diffMinutes < 60) {
            return `il y a ${diffMinutes} minutes`;
        } else {
            return date.toLocaleTimeString('fr-CA', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'saving':
                return {
                    icon: <SyncIcon className="auto-save-indicator__icon auto-save-indicator__icon--spinning" />,
                    label: 'Sauvegarde...',
                    color: 'info' as const,
                };
            case 'saved':
                return {
                    icon: <CheckCircleIcon className="auto-save-indicator__icon" />,
                    label: lastSaved ? `Sauvegardé ${formatTimestamp(lastSaved)}` : 'Sauvegardé',
                    color: 'success' as const,
                };
            case 'error':
                return {
                    icon: <ErrorIcon className="auto-save-indicator__icon" />,
                    label: 'Erreur de sauvegarde',
                    color: 'error' as const,
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();

    if (!config) return null;

    return (
        <Chip
            icon={config.icon}
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
            className="auto-save-indicator"
        />
    );
};

export default AutoSaveIndicator;
