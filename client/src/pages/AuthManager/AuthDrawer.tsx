import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLogin from './providers/SimpleLogin/Login';
import authService from '../../services/AuthService';
import { ENV_VARIABLES } from '../../constants';
import ButtonAuth from './providers/OAuth-Oidc/ButtonAuth';
import 'bootstrap/dist/css/bootstrap.min.css';

const AuthSelection: React.FC = () => {
    const [authData, setAuthData] = useState<any>(null);
    const navigate = useNavigate();

    ENV_VARIABLES.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchData = async () => {
            const data = await authService.fetchAuthData();
            setAuthData(data);
        };
        fetchData();
    }, []);

    return (
        <div className="d-flex flex-column align-items-center p-4 w-100">
            <h1 className="mb-4">Connexion</h1>

            {/* Simple Login Form - Responsive width */}
            {authData && authData['simpleauth'] && (
                <div className="border rounded-3 p-4 my-2 shadow-sm w-100" style={{ maxWidth: '400px' }}>
                    <SimpleLogin />
                </div>
            )}

            {/* OAuth/OIDC Providers - Responsive width */}
            {authData && Object.keys(authData).some(key =>
                authData[key].type === 'oidc' || authData[key].type === 'oauth') && (
                    <div className="d-flex flex-column my-3 w-100" style={{ maxWidth: '400px' }}>
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

            <button
                className="btn btn-link text-dark p-0 mt-3"
                onClick={() => navigate('/')}
            >
                Retour à l'accueil
            </button>
        </div>
    );
};

export default AuthSelection;