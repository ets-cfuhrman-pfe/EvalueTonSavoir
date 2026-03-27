import React from 'react';
import { ENV_VARIABLES } from '../../../../constants';

interface ButtonAuthContainerProps {
    providerName: string;
    providerType: 'oauth' | 'oidc';
}

const handleAuthLogin = (provider: string) => {
    window.location.href = `${ENV_VARIABLES.BACKEND_URL}/api/auth/${provider}`;
};

const ButtonAuth: React.FC<ButtonAuthContainerProps> = ({ providerName, providerType }) => {
    return (
            <div className={`card shadow-sm ${providerName}-${providerType}-container button-container mb-3`}>
                <div className="card-body text-center p-4">
                    {/* <h2 className="card-title h4 mb-4">Se connecter avec {providerType.toUpperCase()}</h2> */}
                    <button 
                        key={providerName} 
                        className={`provider-btn ${providerType}-btn btn btn-primary btn-lg w-100`} 
                        onClick={() => handleAuthLogin(providerName)}
                    >
                        Continuer avec {providerName}
                    </button>
                </div>
            </div>
    );
};

export default ButtonAuth;