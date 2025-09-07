import { Link } from 'react-router-dom';

// JoinRoom.tsx
import React, { useEffect, useState } from 'react';

import '../css/simpleLogin.css';
import LoadingButton from '@mui/lab/LoadingButton';
import { TextField } from '@mui/material';

import LoginContainer from '../../../../components/LoginContainer/LoginContainer'
import ApiService from '../../../../services/ApiService';
import ValidatedTextField from '../../../../components/ValidatedTextField/ValidatedTextField';

const SimpleLogin: React.FC = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => {

        };
    }, []);

    const login = async () => {
        console.log(`SimpleLogin: login: email: ${email}, password: ${password}`);
        const result = await ApiService.login(email, password);
        if (result !== true) {
            setConnectionError(result);
            return;
        }
    };


    return (
        <LoginContainer
            title=''
            error={connectionError}>

            <ValidatedTextField
                fieldPath="user.email"
                initialValue={email}
                onValueChange={(value) => setEmail(value)}
                label="Email"
                variant="outlined"
                sx={{ marginBottom: '1rem' }}
                fullWidth
            />

            <TextField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Mot de passe"
                variant="outlined"
                type="password"
                sx={{ marginBottom: '1rem' }}
                fullWidth
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

                
                {/* <Link to="/resetPassword"> */}
                    <del>Réinitialiser le mot de passe</del>
                {/* </Link> */}

                <Link to="/register">
                    Créer un compte
                </Link>

            </div>

        </LoginContainer>
    );
};

export default SimpleLogin;
