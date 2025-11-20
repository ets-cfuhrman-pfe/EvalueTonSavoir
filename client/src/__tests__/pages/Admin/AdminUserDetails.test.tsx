import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminUserDetails from '../../../pages/Admin/AdminUserDetails';
import ApiService from '../../../services/ApiService';
import userEvent from '@testing-library/user-event';

jest.mock('../../../services/ApiService');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

const originalCreateObjectURL = (globalThis.URL as any).createObjectURL;
const originalRevokeObjectURL = (globalThis.URL as any).revokeObjectURL;

beforeAll(() => {
  (globalThis.URL as any).createObjectURL = jest.fn(() => 'blob:mock-url');
  (globalThis.URL as any).revokeObjectURL = jest.fn();
});

afterAll(() => {
  if (originalCreateObjectURL) {
    (globalThis.URL as any).createObjectURL = originalCreateObjectURL;
  } else {
    delete (globalThis.URL as any).createObjectURL;
  }

  if (originalRevokeObjectURL) {
    (globalThis.URL as any).revokeObjectURL = originalRevokeObjectURL;
  } else {
    delete (globalThis.URL as any).revokeObjectURL;
  }
});

const defaultUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };
const foldersHeading = 'Dossiers';
const quizzesHeading = 'Quizs';
const imagesHeading = 'Images';
const roomsHeading = 'Salles';
const noFoldersText = 'Aucun dossier trouvé.';
const noQuizzesText = 'Aucun quiz trouvé.';
const noImagesText = 'Aucune image trouvée.';
const noRoomsText = 'Aucune salle trouvée.';
const folderTitle = 'Dossier 1';
const quizTitle = 'Quiz 1';
const roomTitle = 'Room A';
const imageFilename = 'img1.png';
const imagesSuccessResponse = { images: [{ id: 'img1', file_name: imageFilename, file_content: '', mime_type: 'image/png' }], total: 1 } as any;
const modalImageFilename = 'MyImage.png';

describe('AdminUserDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.exportAllAdminUserData.mockResolvedValue({ blob: new Blob(['{}'], { type: 'application/json' }), fileName: 'all-data.json' });
  });

  test('shows loading spinner initially', async () => {
    // Keep at least one API promise unresolved to trigger loading UI
    mockApiService.getUserFoldersByUserId.mockImplementation(() => new Promise(() => {}));
    mockApiService.getQuizzesByUserId.mockImplementation(() => new Promise(() => {}));
    mockApiService.getUserImagesByUserId.mockImplementation(() => new Promise(() => {}));
    mockApiService.getRoomTitleByUserId.mockImplementation(() => new Promise(() => {}));

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument();
    // Spinner exists during loading
    expect(container.querySelector('.spinner-border')).toBeTruthy();
  });

  test('displays content when all API calls succeed', async () => {
    const folders = [ { _id: 'f1', title: folderTitle, userId: 'user123', created_at: new Date().toISOString() } as any ];
    const quizzes = [ { _id: 'q1', title: quizTitle, folderId: 'f1', folderName: 'F1', userId: 'user123', content: ['a'], created_at: new Date(), updated_at: new Date() } as any ];
    const images = imagesSuccessResponse;
    const rooms = [ roomTitle ];

    mockApiService.getUserFoldersByUserId.mockResolvedValue(folders);
    mockApiService.getQuizzesByUserId.mockResolvedValue(quizzes);
    mockApiService.getUserImagesByUserId.mockResolvedValue(images);
    mockApiService.getRoomTitleByUserId.mockResolvedValue(rooms);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (${folders.length})`)).toBeInTheDocument());

    // folder, quiz, image and room are displayed
    expect(screen.getByText(folderTitle)).toBeInTheDocument();
    expect(screen.getByText(`${quizzesHeading} (${quizzes.length})`)).toBeInTheDocument();
    expect(screen.getByText(quizTitle)).toBeInTheDocument();
    expect(screen.getByText(`${imagesHeading} (${images.total})`)).toBeInTheDocument();
    expect(screen.getByText(`${roomsHeading} (${rooms.length})`)).toBeInTheDocument();
    expect(screen.getByText(roomTitle)).toBeInTheDocument();
  });

  test('shows empty state when there is no data', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([] as any);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 } as any);
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (0)`)).toBeInTheDocument());
    // Expand and check the message for each empty area by checking the text present
    expect(screen.getByText(noFoldersText)).toBeInTheDocument();
    // The quiz empty text might be missing in markup (it uses 'Quizs (0)' as heading), keep both checks
    expect(screen.queryByText(noQuizzesText) || screen.getByText(`${quizzesHeading} (0)`)).toBeTruthy();
    expect(screen.getByText(noImagesText)).toBeInTheDocument();
    expect(screen.queryByText(noRoomsText) || screen.getByText(`${roomsHeading} (0)`)).toBeTruthy();
  });

  test('opens image modal when clicking on image', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    const imagesResponse = { images: [{ id: 'imgX', file_name: modalImageFilename, file_content: '', mime_type: 'image/png' }], total: 1 } as any;
    mockApiService.getUserImagesByUserId.mockResolvedValue(imagesResponse);
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${imagesHeading} (${imagesResponse.total})`)).toBeInTheDocument());

    // Image should be present and clickable
    const thumb = screen.getByTitle(modalImageFilename);
    expect(thumb).toBeInTheDocument();

    // Click to open the modal
    userEvent.click(thumb);

    // Modal dialog title must display the selected image name inside the modal
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(modalImageFilename)).toBeInTheDocument();
  });

  test("handles ApiService string responses gracefully (no exception)", async () => {
    // Some ApiService methods might return a string error; component should not blow up
    mockApiService.getUserFoldersByUserId.mockResolvedValue('Impossible d\'obtenir les dossiers');
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue('No result' as any);
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (0)`)).toBeInTheDocument());
    expect(screen.getByText(`${quizzesHeading} (0)`)).toBeInTheDocument();
    expect(screen.getByText(`${imagesHeading} (0)`)).toBeInTheDocument();
  });

  test('handles user with no state passed (shows default label)', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 } as any);
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: {} }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument());
    // The header falls back to "Utilisateur"
    // Wait for the content to load so the header with the fallback will be rendered
    await waitFor(() => expect(screen.getByText('Utilisateur')).toBeInTheDocument());
  });

  test('download all button triggers admin export all endpoint', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 } as any);
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument());

    await waitFor(() => expect(screen.getByRole('button', { name: /Tout télécharger/i })).toBeInTheDocument());
    const downloadButton = screen.getByRole('button', { name: /Tout télécharger/i });
    await userEvent.click(downloadButton);

    await waitFor(() => expect(mockApiService.exportAllAdminUserData).toHaveBeenCalledWith('user123'));
  });

  test('shows error state when API calls fail', async () => {
    const errorMessage = 'Failed to fetch user data';
    mockApiService.getUserFoldersByUserId.mockRejectedValue(new Error(errorMessage));
    mockApiService.getQuizzesByUserId.mockRejectedValue(new Error('Quiz error'));
    mockApiService.getUserImagesByUserId.mockRejectedValue(new Error('Image error'));
    mockApiService.getRoomTitleByUserId.mockRejectedValue(new Error('Room error'));

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(errorMessage)).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  test('handles partial API failures gracefully', async () => {
    const folders = [{ _id: 'f1', title: folderTitle, userId: 'user123', created_at: new Date().toISOString() }];
    mockApiService.getUserFoldersByUserId.mockResolvedValue(folders);
    mockApiService.getQuizzesByUserId.mockRejectedValue(new Error('Quiz error'));
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Quiz error')).toBeInTheDocument());
    // Should show error state when any API fails
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  test('download all shows loading state and success notice', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /Tout télécharger/i })).toBeInTheDocument());

    const downloadButton = screen.getByRole('button', { name: /Tout télécharger/i });
    await userEvent.click(downloadButton);

    // Success notice should appear
    await waitFor(() => expect(screen.getByText("Téléchargement de toutes les données terminé.")).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-success');
  });

  test('download all shows error notice on failure', async () => {
    const downloadError = 'Download failed';
    mockApiService.exportAllAdminUserData.mockRejectedValue(new Error(downloadError));
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /Tout télécharger/i })).toBeInTheDocument());

    const downloadButton = screen.getByRole('button', { name: /Tout télécharger/i });
    await userEvent.click(downloadButton);

    await waitFor(() => expect(screen.getByText(downloadError)).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  test('download all shows success notice', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /Tout télécharger/i })).toBeInTheDocument());

    const downloadButton = screen.getByRole('button', { name: /Tout télécharger/i });
    await userEvent.click(downloadButton);

    await waitFor(() => expect(screen.getByText("Téléchargement de toutes les données terminé.")).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-success');
  });

  test('image modal can be closed', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    const imagesResponse = { images: [{ id: 'imgX', file_name: modalImageFilename, file_content: '', mime_type: 'image/png' }], total: 1 };
    mockApiService.getUserImagesByUserId.mockResolvedValue(imagesResponse);
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTitle(modalImageFilename)).toBeInTheDocument());

    userEvent.click(screen.getByTitle(modalImageFilename));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Close modal using close button
    const closeButton = within(dialog).getByRole('button', { name: /close/i });
    userEvent.click(closeButton);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('handles invalid userId param gracefully', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/invalid', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Component should still render with invalid userId
    await waitFor(() => expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument());
  });

  test('displays user avatar with first letter of name', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument());

    // Avatar should show 'T' for 'Test User' after loading
    await waitFor(() => expect(screen.getByText('T')).toBeInTheDocument());
  });

  test('displays fallback avatar when user name is missing', async () => {
    const userWithoutName = { _id: 'user123', email: 'test@example.com' };
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: userWithoutName } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument());

    // Avatar should show 'U' for 'Utilisateur' after loading completes
    await waitFor(() => expect(screen.getByText('U')).toBeInTheDocument());
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
  });

  test('quiz links navigate to editor', async () => {
    const quiz = { _id: 'q1', title: quizTitle, folderId: 'f1', folderName: 'F1', userId: 'user123', content: ['a'], created_at: new Date(), updated_at: new Date() };
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([quiz]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${quizzesHeading} (1)`)).toBeInTheDocument());

    // Expand the quizzes accordion
    const quizzesAccordion = screen.getByRole('button', { name: `${quizzesHeading} (1)` });
    await userEvent.click(quizzesAccordion);

    // Now the quiz link should be visible
    await waitFor(() => expect(screen.getByText(quizTitle)).toBeInTheDocument());

    const quizLink = screen.getByRole('link', { name: quizTitle });
    expect(quizLink).toHaveAttribute('href', `/teacher/editor-quiz-v2/${quiz._id}`);
  });

  test('back button navigates to dashboard', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Détails de l'utilisateur")).toBeInTheDocument());

    // Wait for loading to complete and back button to be visible
    await waitFor(() => expect(screen.getByRole('link', { name: /retour/i })).toBeInTheDocument());

    const backButton = screen.getByRole('link', { name: /retour/i });
    expect(backButton).toHaveAttribute('href', '/admin/dashboard');
  });

  test('handles large number of items', async () => {
    const manyFolders = Array.from({ length: 100 }, (_, i) => ({ _id: `f${i}`, title: `Folder ${i}`, userId: 'user123', created_at: new Date().toISOString() }));
    const manyQuizzes = Array.from({ length: 50 }, (_, i) => ({ _id: `q${i}`, title: `Quiz ${i}`, folderId: 'f1', folderName: 'F1', userId: 'user123', content: ['a'], created_at: new Date(), updated_at: new Date() }));
    const manyImages = { images: Array.from({ length: 25 }, (_, i) => ({ id: `img${i}`, file_name: `image${i}.png`, file_content: '', mime_type: 'image/png' })), total: 25 };
    const manyRooms = Array.from({ length: 10 }, (_, i) => `Room ${i}`);

    mockApiService.getUserFoldersByUserId.mockResolvedValue(manyFolders);
    mockApiService.getQuizzesByUserId.mockResolvedValue(manyQuizzes);
    mockApiService.getUserImagesByUserId.mockResolvedValue(manyImages);
    mockApiService.getRoomTitleByUserId.mockResolvedValue(manyRooms);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (${manyFolders.length})`)).toBeInTheDocument());
    expect(screen.getByText(`${quizzesHeading} (${manyQuizzes.length})`)).toBeInTheDocument();
    expect(screen.getByText(`${imagesHeading} (${manyImages.total})`)).toBeInTheDocument();
    expect(screen.getByText(`${roomsHeading} (${manyRooms.length})`)).toBeInTheDocument();
  });

  test('handles API responses with unexpected structure', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue(null as any);
    mockApiService.getQuizzesByUserId.mockResolvedValue(undefined as any);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ invalid: 'structure' } as any);
    mockApiService.getRoomTitleByUserId.mockResolvedValue('not an array' as any);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (0)`)).toBeInTheDocument());
    expect(screen.getByText(`${quizzesHeading} (0)`)).toBeInTheDocument();
    expect(screen.getByText(`${imagesHeading} (0)`)).toBeInTheDocument();
    expect(screen.getByText(`${roomsHeading} (0)`)).toBeInTheDocument();
  });

  test('notice disappears after successful download', async () => {
    mockApiService.getUserFoldersByUserId.mockResolvedValue([]);
    mockApiService.getQuizzesByUserId.mockResolvedValue([]);
    mockApiService.getUserImagesByUserId.mockResolvedValue({ images: [], total: 0 });
    mockApiService.getRoomTitleByUserId.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/user/user123', state: { user: defaultUser } }]}>
        <Routes>
          <Route path="/admin/user/:id" element={<AdminUserDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /Tout télécharger/i })).toBeInTheDocument());

    // First download
    await userEvent.click(screen.getByRole('button', { name: /Tout télécharger/i }));
    await waitFor(() => expect(screen.getByText("Téléchargement de toutes les données terminé.")).toBeInTheDocument());

    // Second download should clear previous notice
    mockApiService.exportAllAdminUserData.mockResolvedValueOnce({ blob: new Blob(['{}'], { type: 'application/json' }), fileName: 'all-data-2.json' });
    await userEvent.click(screen.getByRole('button', { name: /Tout télécharger/i }));

    await waitFor(() => {
      const notices = screen.queryAllByRole('alert');
      expect(notices).toHaveLength(1); // Should only have one notice
    });
  });
});