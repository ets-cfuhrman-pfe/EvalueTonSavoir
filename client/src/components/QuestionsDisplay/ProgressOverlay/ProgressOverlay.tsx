import React from 'react';
import { Box } from '@mui/material';

interface ProgressOverlayProps {
    percentage: number;
    show: boolean;
    colorClass?: string;
}

/**
 * A reusable progress overlay component that fills the button background
 * from left to right to show answer percentage distribution.
 * Creates a visual "fill" effect on top of the button content.
 */
const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ percentage, show, colorClass = 'progress-overlay-default' }) => {
    if (!show) return null;

    return (
        <Box
            className={colorClass}
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${percentage}%`,
                height: '100%',
                borderRadius: 'inherit',
                transition: 'width 0.3s ease-in-out',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
};

export default ProgressOverlay;
