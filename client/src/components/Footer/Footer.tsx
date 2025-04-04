import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Add Bootstrap CSS import

type FooterProps = object;

const Footer: React.FC<FooterProps> = () => {
    return (
        <footer className="py-4 mt-auto">
            <div className="container text-center">
                <div className="mb-2">
                    Réalisé avec ❤ à Montréal par des finissant•e•s de l&apos;ETS
                </div>
                <div className="d-flex justify-content-center align-items-center">
                    <a
                        href="https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/"
                        className="text-dark text-decoration-none mx-2 hover-underline"
                    >
                        GitHub
                    </a>
                    <span className="text-muted mx-2">|</span>
                    <a
                        href="https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/wiki"
                        className="text-dark text-decoration-none mx-2 hover-underline"
                    >
                        Wiki GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;