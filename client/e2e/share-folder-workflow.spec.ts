import { test, expect, type Page } from '@playwright/test';
import { loginAsTeacher, TIMEOUTS, fillMonacoEditor } from './helpers';

const FOLDER_TITLE = 'Dossier Partage E2E';
const IMPORTED_FOLDER_TITLE = `${FOLDER_TITLE} (1)`;
const QUIZ_TITLE = 'Quiz Partage E2E';

async function deleteFolderIfPresent(page: Page, folderTitle: string): Promise<void> {
    const folderRow = page
        .locator('.folder-item')
        .filter({ has: page.getByRole('button', { name: folderTitle, exact: true }) })
        .first();

    const isVisible = await folderRow
        .isVisible({ timeout: TIMEOUTS.ELEMENT_OPTIONAL })
        .catch(() => false);
    if (!isVisible) return;

    await folderRow.locator('button').last().click();
    await page.getByRole('menuitem', { name: /supprimer/i }).click();
    await page.waitForTimeout(TIMEOUTS.ACTION_SETTLE);
}

async function readCopiedText(page: Page): Promise<string> {
    return page.evaluate(async () => {
        const win = window as Window & { __copiedText?: string };
        if (win.__copiedText !== undefined) {
            return win.__copiedText;
        }
        return navigator.clipboard.readText();
    });
}

test.describe('Teacher Share Folder & Quiz Workflow', () => {
    test('Teacher shares a folder and opens both folder and quiz share links', async ({
        browser,
    }) => {
        test.setTimeout(TIMEOUTS.QUIZ_CREATE_WORKFLOW);

        const teacherContext = await browser.newContext({
            permissions: ['clipboard-read', 'clipboard-write'],
        });
        const teacherPage = await teacherContext.newPage();

        await teacherPage.addInitScript(() => {
            const win = window as Window & { __copiedText?: string };
            if (navigator.clipboard?.writeText) {
                const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
                navigator.clipboard.writeText = async (text: string) => {
                    win.__copiedText = text;
                    return origWriteText(text);
                };
            } else {
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: {
                        writeText: async (text: string) => {
                            win.__copiedText = text;
                        },
                        readText: async () => win.__copiedText ?? '',
                    },
                });
            }
        });

        teacherPage.on('dialog', async (dialog) => {
            await dialog.accept();
        });

        try {
            await loginAsTeacher(teacherPage);
            await teacherPage.goto('/teacher/dashboard');
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage
                .locator('[data-testid="create-folder-btn"]')
                .waitFor({ state: 'visible', timeout: TIMEOUTS.QUIZ_LIST });

            // Clean up any leftover test folders from interrupted runs
            await deleteFolderIfPresent(teacherPage, IMPORTED_FOLDER_TITLE);
            await deleteFolderIfPresent(teacherPage, FOLDER_TITLE);

            // Step 1: Create source folder and quiz
            await teacherPage.locator('[data-testid="create-folder-btn"]').click();
            const createFolderDialog = teacherPage.getByRole('dialog');
            await expect(createFolderDialog).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
            await createFolderDialog
                .getByLabel(/titre du dossier/i)
                .or(createFolderDialog.locator('input'))
                .first()
                .fill(FOLDER_TITLE);
            await createFolderDialog.getByRole('button', { name: /^créer$/i }).click();
            await expect(
                teacherPage
                    .locator('.folder-item')
                    .filter({ has: teacherPage.getByRole('button', { name: FOLDER_TITLE, exact: true }) })
            ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

            await teacherPage.getByRole('button', { name: /nouveau quiz/i }).first().click();
            await teacherPage.waitForTimeout(TIMEOUTS.ACTION_SETTLE);

            const titleInput = teacherPage
                .getByLabel('Titre')
                .or(teacherPage.locator('input[placeholder*="titre"]'))
                .first();
            await titleInput.fill(QUIZ_TITLE);

            const folderSelect = teacherPage.locator('[role="combobox"]').first();
            await folderSelect.click();
            await teacherPage.getByRole('option', { name: FOLDER_TITLE, exact: true }).click();

            await fillMonacoEditor(
                teacherPage,
                '::Question 1:: Quelle est la capitale du Canada ? {=Ottawa ~Toronto}'
            );
            await teacherPage.keyboard.press('Tab');

            await teacherPage.getByRole('button', { name: /enregistrer/i }).first().click();
            await teacherPage.waitForTimeout(TIMEOUTS.PAGE_STABILIZE);

            await teacherPage.locator('button, a').filter({ hasText: /retour/i }).first().click();
            await teacherPage.waitForURL(/\/teacher\/dashboard/);
            await teacherPage.waitForLoadState('networkidle');

            // Step 2: Open ShareFolderModal and test all sharing actions
            const sourceFolderRow = teacherPage
                .locator('.folder-item')
                .filter({ has: teacherPage.getByRole('button', { name: FOLDER_TITLE, exact: true }) })
                .first();
            await sourceFolderRow.locator('button').last().click();
            await teacherPage.getByRole('menuitem', { name: /partager/i }).click();

            const shareDialog = teacherPage.getByRole('dialog');
            await expect(shareDialog).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
            await expect(
                shareDialog.getByRole('heading', {
                    name: new RegExp(`Partager le dossier.*${FOLDER_TITLE}`),
                })
            ).toBeVisible();
            await expect(
                shareDialog.getByRole('heading', { name: 'Partager un quiz individuel (1)' })
            ).toBeVisible();
            await expect(
                shareDialog.getByRole('heading', { name: 'Partager tout le dossier' })
            ).toBeVisible();
            await expect(shareDialog.getByTestId('folder-quiz-list')).toContainText(QUIZ_TITLE);

            // Action A: Copy individual quiz link
            await shareDialog
                .getByRole('button', { name: `Copier le lien de ${QUIZ_TITLE}` })
                .click();
            await expect(
                shareDialog.getByRole('button', {
                    name: `Lien copié - Copier le lien de ${QUIZ_TITLE}`,
                })
            ).toContainText('Lien copié');
            await expect(
                shareDialog.getByText('Lien copié dans le presse-papiers.')
            ).toBeVisible();
            const quizShareUrl = await readCopiedText(teacherPage);
            expect(quizShareUrl).toMatch(/\/teacher\/share\/[a-f0-9]+$/i);

            // Action B: Copy list of quiz titles and links
            await shareDialog.getByRole('button', { name: /copier la liste des quiz/i }).click();
            await expect(
                shareDialog.getByText('Liste des quiz copiée dans le presse-papiers.')
            ).toBeVisible();
            const listText = await readCopiedText(teacherPage);
            expect(listText).toContain(`${QUIZ_TITLE} :`);
            expect(listText).toContain(quizShareUrl);

            // Action C: Download GIFT .zip archive
            const downloadPromise = teacherPage.waitForEvent('download');
            await shareDialog.getByRole('button', { name: /télécharger tous les quiz/i }).click();
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe(`${FOLDER_TITLE}.zip`);
            await expect(shareDialog.getByText('Archive .zip téléchargée.')).toBeVisible();

            // Action D: Copy folder import link
            await shareDialog
                .getByRole('button', { name: /copier le lien d'importation du dossier/i })
                .click();
            await expect(
                shareDialog.getByText("Lien d'importation du dossier copié.")
            ).toBeVisible();
            const folderShareUrl = await readCopiedText(teacherPage);
            expect(folderShareUrl).toMatch(/\/teacher\/share-folder\/[a-f0-9]+$/i);

            await shareDialog.getByRole('button', { name: /fermer/i }).click();
            await expect(shareDialog).toBeHidden();

            // Step 3: Open the folder share link (/teacher/share-folder/:id) and import the folder
            await teacherPage.goto(folderShareUrl);
            await expect(
                teacherPage.getByRole('heading', {
                    name: `Importation du dossier : ${FOLDER_TITLE}`,
                })
            ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
            await expect(
                teacherPage.getByRole('heading', { name: 'Quiz inclus (1)' })
            ).toBeVisible();
            await expect(teacherPage.getByTestId('shared-folder-quiz-list')).toContainText(
                QUIZ_TITLE
            );
            await expect(
                teacherPage.getByText(
                    "Ce dossier vous appartient déjà. L'importer en créera une copie."
                )
            ).toBeVisible();

            await teacherPage.getByRole('button', { name: /importer le dossier/i }).click();
            await teacherPage.waitForURL(/\/teacher\/dashboard/);
            await expect(
                teacherPage
                    .locator('.folder-item')
                    .filter({
                        has: teacherPage.getByRole('button', {
                            name: IMPORTED_FOLDER_TITLE,
                            exact: true,
                        }),
                    })
            ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

            // Step 4: Open the individual quiz share link (/teacher/share/:id)
            await teacherPage.goto(quizShareUrl);
            await expect(
                teacherPage.getByRole('heading', { name: 'Quiz déjà existant' })
            ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
            await teacherPage.getByRole('button', { name: /retour au tableau de bord/i }).click();
            await teacherPage.waitForURL(/\/teacher\/dashboard/);
        } finally {
            try {
                await teacherPage.goto('/teacher/dashboard');
                await teacherPage.waitForLoadState('networkidle');
                await deleteFolderIfPresent(teacherPage, IMPORTED_FOLDER_TITLE);
                await deleteFolderIfPresent(teacherPage, FOLDER_TITLE);
            } catch {
                // Best-effort cleanup so original test errors are not masked
            }
            await teacherContext.close();
        }
    });
});
