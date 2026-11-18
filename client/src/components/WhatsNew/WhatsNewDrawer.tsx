import React, { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { WhatsNewRelease } from '../../Types/WhatsNewType';
import { formatReleaseDate, plural } from './whatsNewStorage';

interface WhatsNewDrawerProps {
    open: boolean;
    onClose: () => void;
    releases: WhatsNewRelease[];
}

const WhatsNewDrawer: React.FC<WhatsNewDrawerProps> = ({ open, onClose, releases }) => {
    const [selectedVersion, setSelectedVersion] = useState<string | undefined>(releases[0]?.version);

    // Always reopen on the latest release.
    useEffect(() => {
        if (open) setSelectedVersion(releases[0]?.version);
    }, [open, releases]);

    const current = releases.find((r) => r.version === selectedVersion) ?? releases[0];

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ className: 'whats-new-drawer', role: 'dialog', 'aria-labelledby': 'whats-new-title' } as object}
        >
            <div className="whats-new-drawer__header">
                <div className="d-flex align-items-center gap-2">
                    <AutoAwesomeIcon className="whats-new-drawer__title-icon" aria-hidden="true" />
                    <h2 id="whats-new-title" className="whats-new-drawer__title">Nouveautés</h2>
                    <button
                        type="button"
                        className="btn whats-new-drawer__close ms-auto"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <CloseIcon />
                    </button>
                </div>
                {releases.length > 0 && (
                    <div className="whats-new-drawer__versions" role="tablist" aria-label="Versions">
                        {releases.map((release, index) => {
                            const selected = release.version === current?.version;
                            return (
                                <button
                                    key={release.version}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    className={`whats-new-version${selected ? ' whats-new-version--selected' : ''}`}
                                    onClick={() => setSelectedVersion(release.version)}
                                >
                                    <span className="whats-new-version__label">
                                        Version {release.version}
                                        {index === 0 && ' · Nouveau'}
                                    </span>
                                    <span className="whats-new-version__date">{formatReleaseDate(release.date)}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="whats-new-drawer__body" role="tabpanel">
                {!current && <p className="text-muted">Aucune nouveauté pour le moment.</p>}

                {current && current.features.length > 0 && (
                    <section className="whats-new-section">
                        <div className="whats-new-section__header">
                            <span className="whats-new-section__icon whats-new-section__icon--feature" aria-hidden="true">
                                <AddIcon fontSize="small" />
                            </span>
                            <h3 className="whats-new-section__title">Nouvelles fonctionnalités</h3>
                            <span className="whats-new-section__count">
                                {plural(current.features.length, 'ajout', 'ajouts')}
                            </span>
                        </div>
                        <ul className="whats-new-list">
                            {current.features.map((feature, i) => (
                                <li key={i} className="whats-new-feature">
                                    <div className="d-flex align-items-start gap-2">
                                        <span className="whats-new-feature__title">{feature.title}</span>
                                        {feature.area && <span className="whats-new-feature__area ms-auto">{feature.area}</span>}
                                    </div>
                                    <p className="whats-new-feature__description">{feature.description}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {current && current.fixes.length > 0 && (
                    <section className="whats-new-section">
                        <div className="whats-new-section__header">
                            <span className="whats-new-section__icon whats-new-section__icon--fix" aria-hidden="true">
                                <BuildOutlinedIcon fontSize="small" />
                            </span>
                            <h3 className="whats-new-section__title">Corrections</h3>
                            <span className="whats-new-section__count">
                                {plural(current.fixes.length, 'corrigé', 'corrigés')}
                            </span>
                        </div>
                        <ul className="whats-new-list">
                            {current.fixes.map((fix, i) => (
                                <li key={i} className="whats-new-fix">
                                    <CheckIcon className="whats-new-fix__icon" fontSize="small" aria-hidden="true" />
                                    <span>{fix.description}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </Drawer>
    );
};

export default WhatsNewDrawer;
