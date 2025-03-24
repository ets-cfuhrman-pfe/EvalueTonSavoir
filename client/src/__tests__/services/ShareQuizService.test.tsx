import axios from 'axios';
import ApiService from '../../services/ApiService';
import { ENV_VARIABLES } from '../../constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

    describe('getSharedQuiz', () => {
        it('should call the API to get a shared quiz and return the quiz data on success', async () => {
            const quizId = '123';
            const quizData = 'Quiz data';
            const response = { status: 200, data: { data: quizData } };
            mockedAxios.get.mockResolvedValue(response);

            const result = await ApiService.getSharedQuiz(quizId);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${ENV_VARIABLES.VITE_BACKEND_URL}/api/quiz/getShare/${quizId}`,
                { headers: expect.any(Object) }
            );
            expect(result).toBe(quizData);
        });

        it('should return an error message if the API call fails', async () => {
            const quizId = '123';
            const errorMessage = 'An unexpected error occurred.';
            mockedAxios.get.mockRejectedValue({ response: { data: { error: errorMessage } } });

            const result = await ApiService.getSharedQuiz(quizId);

            expect(result).toBe(errorMessage);
        });

        it('should return a generic error message if an unexpected error occurs', async () => {
            const quizId = '123';
            mockedAxios.get.mockRejectedValue(new Error('Unexpected error'));

            const result = await ApiService.getSharedQuiz(quizId);

            expect(result).toBe('An unexpected error occurred.');
        });
    });
});