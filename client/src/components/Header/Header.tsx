import { Link, useNavigate } from 'react-router-dom';
import * as React from 'react';
import { useState, useEffect } from 'react';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { getCurrentRoomName } from '../../utils/roomUtils';

interface HeaderProps {
    isLoggedIn: boolean;
    isTeacherAuthenticated: boolean;
    isAdmin: boolean;
    handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    isLoggedIn, 
    isTeacherAuthenticated,
    isAdmin,
    handleLogout
}) => {
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState<string | null>(null);

    // Check for room name updates periodically (when students join/leave rooms)
    useEffect(() => {
        const checkRoomName = () => {
            const currentRoom = getCurrentRoomName();
            setRoomName(currentRoom);
        };

        // Initial check
        checkRoomName();

        // Set up interval to check for changes (in case room name changes)
        const interval = setInterval(checkRoomName, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top w-100">
            <div className="container-fluid px-2 px-sm-3 px-lg-4">
                {/* Brand/Logo */}
                <button 
                    type="button"
                    className="navbar-brand d-flex align-items-center btn btn-link text-decoration-none p-0 border-0 bg-transparent flex-shrink-0"
                    onClick={() => navigate('/')}
                >
                    <img
                        src="/logo.png"
                        alt="Logo EvalueTonSavoir"
                        className="me-1 me-sm-2 d-block logo-height"
                    />
                </button>

                {/* Room Name in Center - shown in student rooms */}
                {roomName && (
                    <div className="position-absolute start-50 translate-middle-x">
                        <span 
                            className="badge bg-primary py-2 px-3 rounded-pill fw-bold shadow text-nowrap fs-6 fs-sm-5"
                        >
                            Salle: {roomName}
                        </span>
                    </div>
                )}

                {/* Navigation Items */}
                <div className="d-flex align-items-center ms-auto flex-shrink-0 gap-2">
                    {isTeacherAuthenticated && (
                        <Link to="/teacher/dashboard" className="text-decoration-none">
                            <button 
                                type="button" 
                                className="btn btn-outline-primary d-flex align-items-center btn-sm"
                            >
                                <DashboardIcon fontSize="small" className="me-1 me-sm-2" />
                                <span className="d-none d-sm-inline">Tableau de bord</span>
                            </button>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin/dashboard" className="text-decoration-none">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary d-flex align-items-center btn-sm"
                            >
                                <AdminPanelSettingsIcon fontSize="small" className="me-1 me-sm-2" />
                                <span className="d-none d-sm-inline">Admin</span>
                            </button>
                        </Link>
                    )}

                    {isLoggedIn ? (
                        <button
                            type="button"
                            className="btn btn-outline-primary d-flex align-items-center btn-sm"
                            onClick={() => {
                                handleLogout();
                                navigate('/');
                            }}
                        >
                            <ExitToAppIcon fontSize="small" className="me-1 me-sm-2" />
                            <span className="d-none d-sm-inline">Déconnexion</span>
                            <span className="d-inline d-sm-none">Sortir</span>
                        </button>
                    ) : (
                        <Link to="/login" className="text-decoration-none">
                            <button 
                                type="button" 
                                className="btn btn-primary d-flex align-items-center btn-sm"
                            >
                                <LoginIcon fontSize="small" className="me-1 me-sm-2" />
                                <span>Connexion</span>
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Header;
