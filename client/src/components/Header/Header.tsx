import { Link, useNavigate } from 'react-router-dom';
import * as React from 'react';
import { Button } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; 

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, handleLogout }) => {
    const navigate = useNavigate();

    return (
        <header className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm">
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
                        color="primary"
                        onClick={() => {
                            handleLogout();
                            navigate('/');
                        }}
                        className="ms-2"
                        startIcon={<ExitToAppIcon />} 
                    >
                        Logout
                    </Button>
                ) : (
                    <Link to="/login" className="text-decoration-none">
                        <button className="btn btn-outline-primary ms-2">
                            Connexion
                        </button>
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Header;