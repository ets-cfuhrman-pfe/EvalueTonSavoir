import { Link, useNavigate } from 'react-router-dom';
import * as React from 'react';
import { Button } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; 
import LoginIcon from '@mui/icons-material/Login';

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, handleLogout }) => {
    const navigate = useNavigate();

    return (
        <header className="d-flex justify-content-between align-items-center p-3">
            <img
                src="/logo.png"
                alt="Logo"
                className="cursor-pointer"
                onClick={() => navigate('/')}
            />

            <div>
                {isLoggedIn ? (
                    <Button
                        variant="outlined"
                        onClick={() => {
                            handleLogout();
                            navigate('/');
                        }}
                        className="mb-4"
                        startIcon={<ExitToAppIcon />} 
                    >
                        Déconnexion
                    </Button>
                ) : (
                    <Link to="/login" className="text-decoration-none">
                            <Button variant="contained" className="mb-4" startIcon={<LoginIcon />} >
                                Connexion
                            </Button>
                        </Link>
                )}
            </div>
        </header>
    );
};

export default Header;