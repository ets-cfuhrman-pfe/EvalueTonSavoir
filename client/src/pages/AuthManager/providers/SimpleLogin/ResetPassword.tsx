import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, CircularProgress } from '@mui/material';
import LoginContainer from '../../../../components/LoginContainer/LoginContainer';
import ApiService from '../../../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => {
            // Cleanup if needed
        };
    }, []);

    const reset = async () => {
        setIsConnecting(true);
        try {
            const result = await ApiService.resetPassword(email);

            if (!result) {
                setConnectionError(result.toString());
                return;
            }

            navigate("/login");
        } finally {
            setIsConnecting(false);
        }
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    return (
        <LoginContainer title='Récupération du compte' error={connectionError}>
            {/* Email Field */}
            <TextField
                label="Email"
                variant="outlined"
                className="mb-3 w-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse courriel"
                fullWidth
                type="email"
                error={!!connectionError && !isValidEmail(email)}
                helperText={connectionError && !isValidEmail(email) ? "Adresse email invalide." : ""}
            />

            {/* Reset Button */}
            <Button
                variant="contained"
                className={`w-100 mb-${connectionError ? '4' : '3'}`}
                onClick={reset}
                disabled={!email || isConnecting}
                startIcon={isConnecting ? <CircularProgress size={20} /> : null}
                size="large"
            >
                Réinitialiser le mot de passe
            </Button>
        </LoginContainer>
    );
};

export default ResetPassword;