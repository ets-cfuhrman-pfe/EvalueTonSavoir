import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { TextField, Button, CircularProgress } from '@mui/material';
import LoginContainer from 'src/components/LoginContainer/LoginContainer';
import ApiService from '../../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
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
        try {
            const result = await ApiService.login(email, password);
            if (typeof result === "string") {
                setConnectionError(result);
            } else {
                navigate("/teacher/Dashboard");
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleReturnKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && email && password) {
            login();
        }
    };

    return (
        <LoginContainer title='Login' error={connectionError}>
            {/* Email Field */}
            <TextField
                label="Email"
                variant="outlined"
                className="mb-3 w-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse courriel"
                fullWidth
                onKeyDown={handleReturnKey}
            />

            {/* Password Field */}
            <TextField
                label="Mot de passe"
                variant="outlined"
                type="password"
                className="mb-3 w-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                fullWidth
                onKeyDown={handleReturnKey}
            />

            {/* Login Button */}
            <Button
                variant="contained"
                className={`w-100 mb-${connectionError ? '4' : '3'}`}
                onClick={login}
                disabled={!email || !password || isConnecting}
                startIcon={isConnecting ? <CircularProgress size={20} /> : null}
            >
                Login
            </Button>

            {/* Links Section */}
            <div className="d-flex flex-column align-items-center pt-3">
                <Link
                    to="/teacher/resetPassword"
                    className="mb-2 text-decoration-none text-primary"
                >
                    Réinitialiser le mot de passe
                </Link>
                <Link
                    to="/teacher/register"
                    className="text-decoration-none text-primary"
                >
                    Créer un compte
                </Link>
            </div>
        </LoginContainer>
    );
};

export default Login;