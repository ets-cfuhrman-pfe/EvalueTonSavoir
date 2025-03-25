import { Link, useNavigate } from 'react-router-dom';
import * as React from 'react';
import './header.css';
import { Button } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; 

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, handleLogout }) => {
    const navigate = useNavigate();

    return (
        <div className="header">
            <img
                className="logo"
                src="/logo.png"
                alt="Logo"
                onClick={() => navigate('/')}
            />

            {isLoggedIn && (
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                        handleLogout();
                        navigate('/');
                    }}
                    startIcon={<ExitToAppIcon />} 
                >
                    Déconnexion
                </Button>
            )}

            {!isLoggedIn && (
                <div className="auth-selection-btn">
                    <Link to="/login">
                        <button className="auth-btn">Connexion</button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Header;
