import React from 'react';
import { ENV_VARIABLES } from '../../../../constants';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ButtonAuthContainerProps {
    providerName: string;
    providerType: 'oauth' | 'oidc';
}

const handleAuthLogin = (provider: string) => {
    window.location.href = `${ENV_VARIABLES.BACKEND_URL}/api/auth/${provider}`;
};

const ButtonAuth: React.FC<ButtonAuthContainerProps> = ({ providerName, providerType }) => {
    return (
        <div className={`border rounded-3 p-3 my-3 mx-auto shadow-sm ${providerName}-${providerType}-container`} style={{ maxWidth: '400px' }}>
            <h2 className="h5 mb-3">Se connecter avec {providerType.toUpperCase()}</h2>
            <button
                key={providerName}
                className={`btn btn-outline-secondary w-100 ${providerType}-btn`}
                onClick={() => handleAuthLogin(providerName)}
            >
                Continuer avec {providerName}
            </button>
        </div>
    );
};

export default ButtonAuth;