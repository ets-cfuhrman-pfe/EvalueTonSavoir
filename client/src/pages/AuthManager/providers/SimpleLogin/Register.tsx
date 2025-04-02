import React, { useState, useEffect } from 'react';
import {
    TextField,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    Button,
    CircularProgress
} from '@mui/material';
import LoginContainer from '../../../../components/LoginContainer/LoginContainer';
import ApiService from '../../../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState<string[]>(['teacher']);
    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        return () => { };
    }, []);

    const handleRoleChange = (role: string) => {
        setRoles([role]);
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const register = async () => {
        if (!isValidEmail(email)) {
            setConnectionError("Veuillez entrer une adresse email valide.");
            return;
        }

        setIsConnecting(true);
        const result = await ApiService.register(name, email, password, roles);
        setIsConnecting(false);

        if (result !== true) {
            setConnectionError(result);
            return;
        }
    };

    return (
        <LoginContainer title="Créer un compte" error={connectionError}>
            {/* Name Field */}
            <TextField
                label="Nom"
                variant="outlined"
                className="mb-3 w-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                fullWidth
            />

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

            {/* Password Field */}
            <TextField
                label="Mot de passe"
                variant="outlined"
                className="mb-3 w-100"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                fullWidth
            />

            {/* Role Selection */}
            <Box className="d-flex align-items-center mb-3">
                <FormLabel component="legend" className="me-3">
                    Choisir votre rôle
                </FormLabel>
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

            {/* Register Button */}
            <Button
                variant="contained"
                className={`w-100 mb-${connectionError ? '4' : '3'}`}
                onClick={register}
                disabled={!name || !email || !password || isConnecting}
                startIcon={isConnecting ? <CircularProgress size={20} /> : null}
                size="large"
            >
                S'inscrire
            </Button>
        </LoginContainer>
    );
};

export default Register;