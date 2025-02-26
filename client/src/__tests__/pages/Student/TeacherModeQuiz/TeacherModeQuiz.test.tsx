//TeacherModeQuiz.test.tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { MultipleChoiceQuestion, parse } from 'gift-pegjs';

import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import { MemoryRouter } from 'react-router-dom';
// import { mock } from 'node:test';

const mockGiftQuestions = parse(
    `::Sample Question:: Sample Question {=Option A ~Option B}
    ::Sample Question 2:: Sample Question 2 {T}`);


describe('TeacherModeQuiz', () => {
    it ('renders the initial question as MultipleChoiceQuestion', () => {
        expect(mockGiftQuestions[0].type).toBe('MC');
    });
    
    const mockQuestion = mockGiftQuestions[0] as MultipleChoiceQuestion;
    mockQuestion.id = '1';

    const mockSubmitAnswer = jest.fn();
    const mockDisconnectWebSocket = jest.fn();

    beforeEach(async () => {
        render(
            <MemoryRouter>
                <TeacherModeQuiz
                    questionInfos={{ question: mockQuestion }}
                    submitAnswer={mockSubmitAnswer}
                    disconnectWebSocket={mockDisconnectWebSocket} />
            </MemoryRouter>
        );
    });

    test('renders the initial question', () => {
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Sample Question')).toBeInTheDocument();
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Quitter')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('handles answer submission and displays feedback', () => {

        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });
        expect(mockSubmitAnswer).toHaveBeenCalledWith('Option A', 1);
        expect(screen.getByText('Votre réponse est:')).toBeInTheDocument();
    });

    
    test('handles disconnect button click', () => {
        act(() => {
            fireEvent.click(screen.getByText('Quitter'));
        });
        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });
});
