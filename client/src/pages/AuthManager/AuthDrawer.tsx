import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './authDrawer.css';
import SimpleLogin from './providers/SimpleLogin/Login';
import authService from '../../services/AuthService';
import { ENV_VARIABLES } from '../../constants';
import ButtonAuth from './providers/OAuth-Oidc/ButtonAuth';

const AuthSelection: React.FC = () => {
    const [authData, setAuthData] = useState<any>(null); // Stocke les données d'auth
    const navigate = useNavigate();

    ENV_VARIABLES.VITE_BACKEND_URL;
    // Récupérer les données d'authentification depuis l'API
    useEffect(() => {
        const fetchData = async () => {
            const data = await authService.fetchAuthData();
            setAuthData(data);
        };

        fetchData();
    }, []);

    return (
        <div className="auth-selection-page">
            <h1>Connexion</h1>

            {/* Formulaire de connexion Simple Login */}
            {authData && authData['simpleauth'] && (
                <div className="form-container">
                    <SimpleLogin />
                </div>
            )}

            {/* Conteneur OAuth/OIDC */}
            {authData && Object.keys(authData).some(key => authData[key].type === 'oidc' || authData[key].type === 'oauth') && (
                <div className="auth-button-container">
                    {Object.keys(authData).map((providerKey) => {
                        const providerType = authData[providerKey].type;
                        if (providerType === 'oidc' || providerType === 'oauth') {
                            return (
                                <ButtonAuth
                                    key={providerKey}
                                    providerName={providerKey}
                                    providerType={providerType}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            <div>
                <button className="home-button-container" onClick={() => navigate('/')}>Retour à l'accueil</button>
            </div>
        </div>
    );
};

export default AuthSelection;
