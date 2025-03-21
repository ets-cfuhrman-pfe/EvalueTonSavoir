import axios from 'axios';
import ApiService from '../../services/ApiService';
import { FolderType } from '../../Types/FolderType';
import { QuizType } from '../../Types/QuizType';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
    describe('getAllQuizIds', () => {
        it('should return all quiz IDs from all folders', async () => {
            const folders: FolderType[] = [
                { _id: 'folder1', title: 'Folder 1', userId: 'user1', created_at: new Date().toISOString() },
                { _id: 'folder2', title: 'Folder 2', userId: 'user2', created_at: new Date().toISOString() }
            ];
            const quizzesFolder1: QuizType[] = [
                { _id: 'quiz1', title: 'Quiz 1', content: [], folderId: 'folder1', folderName: 'Folder 1', userId: 'user1', created_at: new Date(), updated_at: new Date() },
                { _id: 'quiz2', title: 'Quiz 2', content: [], folderId: 'folder1', folderName: 'Folder 1', userId: 'user1', created_at: new Date(), updated_at: new Date() }
            ];
            const quizzesFolder2: QuizType[] = [
                { _id: 'quiz3', title: 'Quiz 3', content: [], folderId: 'folder2', folderName: 'Folder 2', userId: 'user2', created_at: new Date(), updated_at: new Date() }
            ];

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: folders } })
                .mockResolvedValueOnce({ status: 200, data: { data: quizzesFolder1 } })
                .mockResolvedValueOnce({ status: 200, data: { data: quizzesFolder2 } });

            const result = await ApiService.getAllQuizIds();

            expect(result).toEqual(['quiz1', 'quiz2', 'quiz3']);
        });

        it('should return an empty array if no folders are found', async () => {
            mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { data: [] } });

            const result = await ApiService.getAllQuizIds();

            expect(result).toEqual([]);
        });
    });
});