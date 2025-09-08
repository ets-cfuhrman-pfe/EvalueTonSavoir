// JoinRoom.tsx
import React, { useEffect, useState } from 'react';

import {FormLabel, RadioGroup, FormControlLabel, Radio, Box, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import LoginContainer from '../../../../components/LoginContainer/LoginContainer';
import ApiService from '../../../../services/ApiService';
import ValidatedTextField from '../../../../components/ValidatedTextField/ValidatedTextField';

const Register: React.FC = () => {

    const [name, setName] = useState(''); // State for name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState<string[]>(['teacher']); // Set 'student' as the default role

    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => { };
    }, []);

    const handleRoleChange = (role: string) => {
        setRoles([role]); // Update the roles array to contain the selected role
    };

    const register = async () => {
        const result = await ApiService.register(name, email, password, roles);

        if (result !== true) {
            setConnectionError(result);
            return;
        }
    };

    return (
        <LoginContainer
            title="Créer un compte"
            error={connectionError}
        >
            <ValidatedTextField
                fieldPath="user.username"
                initialValue={name}
                onValueChange={(value) => setName(value)}
                label="Nom"
                variant="outlined"
                placeholder="Votre nom"
                sx={{ marginBottom: '1rem' }}
                fullWidth
            />

            <ValidatedTextField
                fieldPath="user.email"
                initialValue={email}
                onValueChange={(value) => setEmail(value)}
                label="Email"
                variant="outlined"
                placeholder="Adresse courriel"
                sx={{ marginBottom: '1rem' }}
                fullWidth
                type="email"
            />

            <TextField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Mot de passe"
                variant="outlined"
                type="password"
                placeholder="Mot de passe"
                sx={{ marginBottom: '1rem' }}
                fullWidth
            />

            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <FormLabel component="legend" sx={{ marginRight: '1rem' }}>Choisir votre rôle</FormLabel>
                <RadioGroup
                    row
                    aria-label="role"
                    name="role"
                    value={roles[0]}
                    onChange={(e) => handleRoleChange(e.target.value)}
                >
                    <FormControlLabel value="student" control={<Radio />} label="Étudiant" />
                    <FormControlLabel value="teacher" control={<Radio />} label="Professeur" />
                </RadioGroup>
            </Box>

            <LoadingButton
                loading={isConnecting}
                onClick={register}
                variant="contained"
                sx={{ marginBottom: `${connectionError && '2rem'}` }}
                disabled={!name || !email || !password}
            >
                S'inscrire
            </LoadingButton>
        </LoginContainer>
    );
};

export default Register;
