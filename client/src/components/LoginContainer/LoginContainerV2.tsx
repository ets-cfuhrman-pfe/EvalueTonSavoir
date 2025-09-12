import * as React from 'react';

interface LoginContainerV2Props {
    title: string;
    error: string;
    children: React.ReactNode;
}

const LoginContainerV2: React.FC<LoginContainerV2Props> = ({ title, error, children }) => {
    return (
        <div className="card shadow-sm">
            <div className="card-body text-center">
                <h1 className="card-title h4 mb-4">{title}</h1>

                <div className="d-flex flex-column align-items-center gap-3">
                    <img 
                        className="rounded-circle" 
                        src="./people.svg" 
                        alt="Avatar" 
                        style={{maxHeight: '50px'}} 
                    />

                    {error && (
                        <div className="alert alert-danger py-2 px-3 mb-0 w-100" role="alert">
                            <small>{error}</small>
                        </div>
                    )}

                    <div className="w-100">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginContainerV2;