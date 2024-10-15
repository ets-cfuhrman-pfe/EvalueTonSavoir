
import { useNavigate } from 'react-router-dom';

// JoinRoom.tsx
import React, { useEffect, useState } from 'react';

import { TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import LoginContainer from '../../../../components/LoginContainer/LoginContainer'
import ApiService from '../../../../services/ApiService';

const Register: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => {

        };
    }, []);

    const register = async () => {
        const result = await ApiService.register(email, password);

        if (result != true) {
            setConnectionError(result);
            return;
        }

        navigate("/login")
    };


    return (
        <LoginContainer
            title='Créer un compte'
            error={connectionError}>

            <TextField
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse courriel"
                sx={{ marginBottom: '1rem' }}
                fullWidth
            />

            <TextField
                label="Mot de passe"
                variant="outlined"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                sx={{ marginBottom: '1rem' }}
                fullWidth
            />

            <LoadingButton
                loading={isConnecting}
                onClick={register}
                variant="contained"
                sx={{ marginBottom: `${connectionError && '2rem'}` }}
                disabled={!email || !password}
            >
                S'inscrire
            </LoadingButton>

        </LoginContainer>

    );
};

export default Register;
