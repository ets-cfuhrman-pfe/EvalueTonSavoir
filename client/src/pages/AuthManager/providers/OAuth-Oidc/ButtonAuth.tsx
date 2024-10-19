import React from 'react';
import '../css/buttonAuth.css';

interface ButtonAuthContainerProps {
    providerName: string;
    providerType: 'oauth' | 'oidc';
}

const handleAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/` + provider;
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