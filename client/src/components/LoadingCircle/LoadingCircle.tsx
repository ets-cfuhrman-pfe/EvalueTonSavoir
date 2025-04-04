import { CircularProgress } from '@mui/material';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Props {
    text: string;
}

const LoadingCircle: React.FC<Props> = ({ text }) => {
    return (
        <div className="d-flex flex-column align-items-center gap-2">
            <div className="fs-6">{text}</div>
            <CircularProgress />
        </div>
    );
};

export default LoadingCircle;