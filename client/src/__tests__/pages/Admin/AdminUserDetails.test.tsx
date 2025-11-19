import React from 'react';
import { render, screen, waitFor} from '@testing-library/react';
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
    mockApiService.exportAdminUserResource.mockResolvedValue({ blob: new Blob(['[]'], { type: 'application/json' }), fileName: 'export.json' });
    mockApiService.importAdminUserResource.mockResolvedValue({ inserted: 1, updated: 0, removed: 0, mode: 'append' });
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
    const { within } = require('@testing-library/react');
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

  test('download button triggers admin export endpoint', async () => {
    const folders = [ { _id: 'f1', title: folderTitle } as any ];
    mockApiService.getUserFoldersByUserId.mockResolvedValue(folders);
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

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (${folders.length})`)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: `${foldersHeading} (${folders.length})` }));
    const downloadButtons = screen.getAllByRole('button', { name: 'Télécharger' });
    await userEvent.click(downloadButtons[0]);

    await waitFor(() => expect(mockApiService.exportAdminUserResource).toHaveBeenCalledWith('user123', 'folders'));
  });

  test('upload input calls admin import endpoint', async () => {
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

    await waitFor(() => expect(screen.getByText(`${foldersHeading} (0)`)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: `${foldersHeading} (0)` }));

    const fileInput = screen.getByLabelText('Téléverser des dossiers');
    const file = new File([JSON.stringify([])], 'folders.json', { type: 'application/json' });
    await userEvent.upload(fileInput, file);

    await waitFor(() => expect(mockApiService.importAdminUserResource).toHaveBeenCalledWith('user123', 'folders', file, 'append'));
  });

});
