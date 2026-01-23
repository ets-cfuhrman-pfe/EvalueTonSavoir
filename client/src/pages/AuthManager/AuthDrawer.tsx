import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SimpleLogin from './providers/SimpleLogin/Login';
import authService from '../../services/AuthService';
import { ENV_VARIABLES } from '../../constants';
import ButtonAuth from './providers/OAuth-Oidc/ButtonAuth';

const AuthSelection: React.FC = () => {
    const [authData, setAuthData] = useState<any>(null); // Stocke les données d'auth

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
        <div className="login-container">
            <h1 className="title">Connexion</h1>

            <div className="inputs">
                <img className="avatar" src="./people.svg" alt="Avatar"></img>

                {/* Formulaire de connexion Simple Login */}
                {authData && authData['simpleauth'] && (
                    <SimpleLogin />
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
            </div>

            <div className="login-links">
                <Link to="/">Retour à l'accueil</Link>
            </div>
        </div>
    );
};

export default AuthSelection;
