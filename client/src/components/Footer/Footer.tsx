import * as React from 'react';
import packageJson from '../../../package.json';
import { ENV_VARIABLES } from '../../constants';
import './footer.css';

type FooterProps = object; //empty object

const Footer: React.FC<FooterProps> = () => {
    const [backendVersion, setBackendVersion] = React.useState<string | null>(null);

    React.useEffect(() => {
        const baseUrl = ENV_VARIABLES.VITE_BACKEND_URL || '';
        fetch(`${baseUrl}/api/version`)
            .then(res => res.json())
            .then(data => setBackendVersion(data.version))
            .catch(err => console.error('Failed to fetch backend version', err));
    }, []);

    return (
        <div className="footer">
            <div className="footer-content">
                Réalisé avec ❤ à Montréal par des finissant•e•s de l&apos;ETS
            </div>
            <div className="footer-links">
                <a href="https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/">GitHub</a>
                <span className="divider">|</span>
                <a href="https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/wiki">Wiki GitHub</a>
                <span className="divider">|</span>
                <span>Frontend v{packageJson.version}</span>
                {backendVersion && (
                    <>
                        <span className="divider">|</span>
                        <span>Backend v{backendVersion}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default Footer;
