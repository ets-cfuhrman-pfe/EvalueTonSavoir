import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WhatsNewDrawer from './WhatsNewDrawer';
import {
    formatReleaseDate,
    getLastSeenVersion,
    getPublishedReleases,
    isUnseen,
    markSeen,
    plural,
} from './whatsNewStorage';
import { WhatsNewData } from '../../Types/WhatsNewType';

interface WhatsNewButtonProps {
    /** Override the bundled release notes (tests). */
    data?: WhatsNewData;
}

// Routes where a pop-up would be shown on a projected screen in front of students.
const CALLOUT_HIDDEN_ROUTES = ['/teacher/manage-room'];

const WhatsNewButton: React.FC<WhatsNewButtonProps> = ({ data }) => {
    const location = useLocation();
    const releases = useMemo(() => getPublishedReleases(data), [data]);
    const latest = releases[0];

    const [unseen, setUnseen] = useState(() => isUnseen(latest?.version, getLastSeenVersion()));
    const [calloutDismissed, setCalloutDismissed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (!latest) return null;

    const calloutAllowedOnRoute = !CALLOUT_HIDDEN_ROUTES.some((route) => location.pathname.startsWith(route));
    const showCallout = unseen && !calloutDismissed && !drawerOpen && calloutAllowedOnRoute;

    const openDrawer = () => {
        setDrawerOpen(true);
        setUnseen(false);
        markSeen(latest.version);
    };

    return (
        <div className="whats-new">
            <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center btn-sm whats-new__button"
                onClick={openDrawer}
                aria-label={unseen ? `Nouveautés : version ${latest.version} disponible` : 'Nouveautés'}
                aria-haspopup="dialog"
            >
                <AutoAwesomeIcon fontSize="small" className="me-0 me-sm-2" />
                <span className="d-none d-sm-inline">Nouveautés</span>
                {unseen && <span className="whats-new__dot" data-testid="whats-new-dot" aria-hidden="true" />}
            </button>

            {showCallout && (
                <div className="whats-new-callout" role="dialog" aria-labelledby="whats-new-callout-title">
                    <div className="whats-new-callout__arrow" aria-hidden="true" />
                    <div className="d-flex align-items-center gap-2">
                        <span className="whats-new-callout__badge">Version {latest.version}</span>
                        <span className="whats-new-callout__date">{formatReleaseDate(latest.date)}</span>
                    </div>
                    <div id="whats-new-callout-title" className="whats-new-callout__title">
                        EvalueTonSavoir a été mis à jour
                    </div>
                    <p className="whats-new-callout__text">
                        {plural(latest.features.length, 'nouveauté', 'nouveautés')} et{' '}
                        {plural(latest.fixes.length, 'correction', 'corrections')} depuis votre dernière visite.
                    </p>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn whats-new-callout__primary" onClick={openDrawer}>
                            Voir les nouveautés
                        </button>
                        <button
                            type="button"
                            className="btn whats-new-callout__secondary"
                            onClick={() => setCalloutDismissed(true)}
                        >
                            Plus tard
                        </button>
                    </div>
                </div>
            )}

            <WhatsNewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} releases={releases} />
        </div>
    );
};

export default WhatsNewButton;
