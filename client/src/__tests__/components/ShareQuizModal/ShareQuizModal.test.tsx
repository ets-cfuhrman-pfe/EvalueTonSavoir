import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareQuizModal from '../../../components/ShareQuizModal/ShareQuizModal';
import { QuizType } from '../../../Types/QuizType';
import ApiService from '../../../services/ApiService';

jest.mock('../../../services/ApiService');

Object.assign(navigator, {
	clipboard: {
		writeText: jest.fn().mockResolvedValue(undefined),
	},
});

window.alert = jest.fn();

const mockQuiz: QuizType = {
	_id: '1',
	title: 'Sample Quiz',
	content: ['::Question 1:: What is 2+2? {=4 ~3 ~5}'],
	folderId: 'folder1',
	folderName: 'Sample Folder',
	userId: 'user1',
	created_at: new Date(),
	updated_at: new Date(),
};

describe('ShareQuizModal', () => {


	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call ApiService.ShareQuiz when sharing by email', async () => {
		render(<ShareQuizModal quiz={mockQuiz} />);

		const shareButton = screen.getByRole('button', { name: /partager quiz/i });
		fireEvent.click(shareButton);

		const emailButton = screen.getByRole('button', { name: /partager par email/i });
		fireEvent.click(emailButton);

		const email = 'test@example.com';
		window.prompt = jest.fn().mockReturnValue(email);

		await fireEvent.click(emailButton);

		expect(ApiService.ShareQuiz).toHaveBeenCalledWith(mockQuiz._id, email);
	});

	it('copies the correct URL to the clipboard when sharing by URL', async () => {
		render(<ShareQuizModal quiz={mockQuiz} />);

		// Open the modal
		const shareButton = screen.getByRole('button', { name: /partager quiz/i });
		fireEvent.click(shareButton);

		// Click the "Share by URL" button
		const shareByUrlButton = screen.getByRole('button', { name: /partager par url/i });
		fireEvent.click(shareByUrlButton);

		// Check if the correct URL was copied
		const expectedUrl = `${window.location.origin}/teacher/share/${mockQuiz._id}`;
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);

		// Check if the alert is shown
		await waitFor(() => {
			expect(window.alert).toHaveBeenCalledWith('URL copied to clipboard!');
		});
	});

});