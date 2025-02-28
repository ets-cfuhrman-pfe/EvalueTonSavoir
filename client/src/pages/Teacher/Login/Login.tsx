import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import './Login.css';
import { TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import LoginContainer from 'src/components/LoginContainer/LoginContainer'
import ApiService from '../../../services/ApiService';

const Login: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => {

        };
    }, []);

    const login = async () => {
        const result = await ApiService.login(email, password);

        if (typeof result === "string") {
            setConnectionError(result);
            return;
        }
        else {
            navigate("/teacher/Dashboard")
        }

    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            login();
        }
    };

    return (
        <LoginContainer
            title='Login'
            error={connectionError}>

            <TextField
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse courriel"
                sx={{ marginBottom: '1rem' }}
                fullWidth={true}
                onKeyDown={handleKeyPress} // Add this line as well
            />

            <TextField
                label="Mot de passe"
                variant="outlined"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                sx={{ marginBottom: '1rem' }}
                fullWidth={true}
                onKeyDown={handleKeyPress} // Add this line as well
            />

            <LoadingButton
                loading={isConnecting}
                onClick={login}
                variant="contained"
                sx={{ marginBottom: `${connectionError && '2rem'}` }}
                disabled={!email || !password}
            >
                Login
            </LoadingButton>

            <div className="login-links">

                <Link to="/teacher/resetPassword">
                    Réinitialiser le mot de passe
                </Link>

                <Link to="/teacher/register">
                    Créer un compte
                </Link>

            </div>

        </LoginContainer>
    );
};

export default Login;
