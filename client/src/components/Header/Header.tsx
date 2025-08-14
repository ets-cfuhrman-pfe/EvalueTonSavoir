import { Link, useNavigate } from 'react-router-dom';
import * as React from 'react';
import './header.css';
import { Button } from '@mui/material';
import AdminDrawer from '../AdminDrawer/AdminDrawer';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

interface HeaderProps {
    isLoggedIn: boolean;
    isAdmin: boolean;
    handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, isAdmin, handleLogout }) => {
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
                <div className="button-group">
                    
                    { isAdmin && <AdminDrawer /> }
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
                </div>
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
