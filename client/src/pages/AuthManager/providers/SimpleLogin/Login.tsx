import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TextField, Button, CircularProgress } from '@mui/material';
import LoginContainer from '../../../../components/LoginContainer/LoginContainer';
import ApiService from '../../../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginIcon from '@mui/icons-material/Login';

const SimpleLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => {
            // Cleanup if needed
        };
    }, []);

    const login = async () => {
        setIsConnecting(true);
        const result = await ApiService.login(email, password);
        setIsConnecting(false);

        if (result !== true) {
            setConnectionError(result);
            return;
        }
    };

    return (
        <LoginContainer title='' error={connectionError}>
            {/* Email Input */}
            <TextField
                label="Courriel"
                variant="outlined"
                className="mb-3 w-100" // Bootstrap classes for spacing and width
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nom d'utilisateur"
                fullWidth // Material-UI fullWidth
            />

            {/* Password Input */}
            <TextField
                label="Mot de passe"
                variant="outlined"
                type="password"
                className="mb-3 w-100" // Bootstrap classes
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                fullWidth
            />

            {/* Login Button */}
            <Button
                variant="contained"
                className={`w-100 mb-${connectionError ? '4' : '3'}`} // Dynamic margin-bottom
                onClick={login}
                disabled={!email || !password || isConnecting}
                startIcon={isConnecting ? <CircularProgress size={20} /> : null}
                size="large"
                startIcon={<LoginIcon />}
            >
                Se connecter
            </Button>

            {/* Links Section */}
            <div className="d-flex flex-column align-items-center pt-3">
                <del className="py-1 text-muted">Réinitialiser le mot de passe</del>
                <Link
                    to="/register"
                    className="py-1 text-decoration-none text-primary"
                >
                    Créer un compte
                </Link>
            </div>
        </LoginContainer>
    );
};

export default SimpleLogin;