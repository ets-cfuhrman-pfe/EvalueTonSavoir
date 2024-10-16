import React from 'react';
import { ENV_VARIABLES } from '../../../../constants';
import '../css/buttonAuth.css';

interface ButtonAuthContainerProps {
    providerName: string;
    providerType: 'oauth' | 'oidc';
}

const handleAuthLogin = (provider: string) => {
    window.location.href = `${ENV_VARIABLES.VITE_BACKEND_URL}/api/auth/` + provider;
};

const ButtonAuth: React.FC<ButtonAuthContainerProps> = ({ providerName, providerType }) => {
    return (
        <>
            <div className={`${providerName}-${providerType}-container button-container`}>
                <h2>Se connecter avec {providerType.toUpperCase()}</h2>
                <button key={providerName} className={`provider-btn ${providerType}-btn`} onClick={() => handleAuthLogin(providerName)}>
                    Continuer avec {providerName}
                </button>
            </div>
        </>
    );
};

export default ButtonAuth;