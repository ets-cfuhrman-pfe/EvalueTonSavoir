import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import WhatsNewButton from 'src/components/WhatsNew/WhatsNewButton';
import {
    LAST_SEEN_STORAGE_KEY,
    compareVersions,
    getPublishedReleases,
    isUnseen,
} from 'src/components/WhatsNew/whatsNewStorage';
import { WhatsNewData } from 'src/Types/WhatsNewType';

const data: WhatsNewData = {
    releases: [
        {
            version: 'unreleased',
            features: [{ area: 'Autre', title: 'Brouillon', description: 'Pas encore publié.' }],
            fixes: [],
        },
        {
            version: '2.5.0',
            date: '2026-11-13',
            features: [
                { area: 'Éditeur', title: "L'aperçu suit votre curseur", description: 'Surlignage.' },
                { area: 'Quiz en direct', title: 'Rétroaction', description: 'Boîte de rétroaction.' },
            ],
            fixes: [{ description: "L'éditeur ne saute plus." }],
        },
        {
            version: '2.4.0',
            date: '2026-03-27',
            features: [{ area: 'Impression', title: 'Imprimer un quiz', description: 'Mise en page propre.' }],
            fixes: [{ description: 'Aperçu identique au quiz.' }],
        },
    ],
};

const renderButton = (path = '/teacher/dashboard') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <WhatsNewButton data={data} />
        </MemoryRouter>
    );

describe('whatsNewStorage helpers', () => {
    test('compareVersions orders semver numerically', () => {
        expect(compareVersions('2.10.0', '2.9.0')).toBeGreaterThan(0);
        expect(compareVersions('2.5.0', '2.5.0')).toBe(0);
        expect(compareVersions('2.4.1', '2.5.0')).toBeLessThan(0);
    });

    test('isUnseen', () => {
        expect(isUnseen('2.5.0', null)).toBe(true);
        expect(isUnseen('2.5.0', '2.4.0')).toBe(true);
        expect(isUnseen('2.5.0', '2.5.0')).toBe(false);
        expect(isUnseen(undefined, null)).toBe(false);
    });

    test('getPublishedReleases drops unreleased drafts and sorts newest first', () => {
        const versions = getPublishedReleases({ releases: [...data.releases].reverse() }).map((r) => r.version);
        expect(versions).toEqual(['2.5.0', '2.4.0']);
    });
});

describe('WhatsNewButton', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('shows the dot and callout when the latest version was never seen', () => {
        renderButton();
        expect(screen.getByTestId('whats-new-dot')).toBeInTheDocument();
        expect(screen.getByText('EvalueTonSavoir a été mis à jour')).toBeInTheDocument();
        expect(screen.getByText(/2 nouveautés et 1 correction/)).toBeInTheDocument();
    });

    test('shows no dot or callout when the latest version was already seen', () => {
        window.localStorage.setItem(LAST_SEEN_STORAGE_KEY, '2.5.0');
        renderButton();
        expect(screen.queryByTestId('whats-new-dot')).not.toBeInTheDocument();
        expect(screen.queryByText('EvalueTonSavoir a été mis à jour')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Nouveautés' })).toBeInTheDocument();
    });

    test('opening the panel marks the version as seen and lists features and fixes', () => {
        renderButton();
        fireEvent.click(screen.getByRole('button', { name: /voir les nouveautés/i }));

        expect(window.localStorage.getItem(LAST_SEEN_STORAGE_KEY)).toBe('2.5.0');
        expect(screen.queryByTestId('whats-new-dot')).not.toBeInTheDocument();

        const drawer = screen.getByRole('dialog', { name: 'Nouveautés' });
        expect(within(drawer).getByText('Nouvelles fonctionnalités')).toBeInTheDocument();
        expect(within(drawer).getByText('Corrections')).toBeInTheDocument();
        expect(within(drawer).getByText("L'aperçu suit votre curseur")).toBeInTheDocument();
        expect(within(drawer).getByText("L'éditeur ne saute plus.")).toBeInTheDocument();
        expect(within(drawer).queryByText('Brouillon')).not.toBeInTheDocument();
    });

    test('"Plus tard" hides the callout but keeps the dot', () => {
        renderButton();
        fireEvent.click(screen.getByRole('button', { name: /plus tard/i }));
        expect(screen.queryByText('EvalueTonSavoir a été mis à jour')).not.toBeInTheDocument();
        expect(screen.getByTestId('whats-new-dot')).toBeInTheDocument();
        expect(window.localStorage.getItem(LAST_SEEN_STORAGE_KEY)).toBeNull();
    });

    test('can switch to an older version', () => {
        window.localStorage.setItem(LAST_SEEN_STORAGE_KEY, '2.5.0');
        renderButton();
        fireEvent.click(screen.getByRole('button', { name: 'Nouveautés' }));
        fireEvent.click(screen.getByRole('tab', { name: /version 2\.4\.0/i }));
        expect(screen.getByText('Imprimer un quiz')).toBeInTheDocument();
        expect(screen.queryByText("L'aperçu suit votre curseur")).not.toBeInTheDocument();
    });

    test('does not pop the callout during a live quiz, but keeps the dot', () => {
        renderButton('/teacher/manage-room/abc');
        expect(screen.queryByText('EvalueTonSavoir a été mis à jour')).not.toBeInTheDocument();
        expect(screen.getByTestId('whats-new-dot')).toBeInTheDocument();
    });

    test('works when localStorage is unavailable', () => {
        const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        renderButton();
        fireEvent.click(screen.getByRole('button', { name: /voir les nouveautés/i }));
        expect(screen.getByRole('dialog', { name: 'Nouveautés' })).toBeInTheDocument();
        getItem.mockRestore();
        setItem.mockRestore();
    });
});
