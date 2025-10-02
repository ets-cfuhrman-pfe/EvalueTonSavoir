import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SwapHoriz } from '@mui/icons-material';

interface InterfaceToggleProps {
    currentVersion: 'v1' | 'v2';
    onToggle?: () => void;
}

const InterfaceToggle: React.FC<InterfaceToggleProps> = ({ currentVersion, onToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const getStudentPath = () => {
        return currentVersion === 'v2' ? '/student/join-room' : '/student/join-room-v2';
    };

    const getTeacherDashboardPath = () => {
        return currentVersion === 'v2' ? '/teacher/dashboard' : '/teacher/dashboard-v2';
    };

    const getTeacherEditorPath = () => {
        const pathParts = location.pathname.split('/');
        const id = pathParts[pathParts.length - 1];
        return currentVersion === 'v2' 
            ? `/teacher/editor-quiz/${id}` 
            : `/teacher/editor-quiz-v2/${id}`;
    };

    const getTeacherManageRoomPath = () => {
        const pathParts = location.pathname.split('/');
        if (currentVersion === 'v2') {
            const quizId = pathParts[3];
            const roomName = pathParts[4] || 'default';
            return `/teacher/manage-room/${quizId}/${roomName}`;
        } else {
            const quizId = pathParts[3];
            return `/teacher/manage-room-v2/${quizId}`;
        }
    };

    const getNewPath = () => {
        if (location.pathname.includes('/student/join-room')) {
            return getStudentPath();
        }
        if (location.pathname.includes('/teacher/dashboard')) {
            return getTeacherDashboardPath();
        }
        if (location.pathname.includes('/teacher/editor-quiz')) {
            return getTeacherEditorPath();
        }
        if (location.pathname.includes('/teacher/manage-room')) {
            return getTeacherManageRoomPath();
        }
        return '';
    };

    const handleToggle = () => {
        const newPath = getNewPath();

        if (newPath) {
            const searchParams = new URLSearchParams(location.search);
            const queryString = searchParams.toString();
            const fullPath = queryString ? `${newPath}?${queryString}` : newPath;
            navigate(fullPath);
        }

        onToggle?.();
    };

    return (
        <div className="interface-toggle">
            <button
                type="button"
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                onClick={handleToggle}
            >
                <SwapHoriz fontSize="small" />
                <span className={`badge ${currentVersion === 'v2' ? 'bg-primary' : 'bg-secondary'}`}>
                    {currentVersion === 'v2' ? 'Interface V2' : 'Interface V1'}
                </span>
            </button>
        </div>
    );
};

export default InterfaceToggle;