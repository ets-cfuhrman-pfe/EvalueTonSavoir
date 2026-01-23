import * as React from 'react';

interface LoginContainerProps {
    title: string;
    error?: string;
    children: React.ReactNode;
}

const LoginContainer: React.FC<LoginContainerProps> = ({ title, error, children }) => {
    return (
        <div className="w-100" style={{ maxWidth: '400px' }}>
            <div className="card shadow-sm">
                <div className="card-body text-center">
                    <h1 className="card-title h4 mb-4">{title}</h1>
                    <div className="d-flex flex-column align-items-center gap-3">
                        <img className="rounded-circle" src="./people.svg" alt="Avatar" style={{ maxHeight: '50px' }} />

                        <div className="w-100">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginContainer;