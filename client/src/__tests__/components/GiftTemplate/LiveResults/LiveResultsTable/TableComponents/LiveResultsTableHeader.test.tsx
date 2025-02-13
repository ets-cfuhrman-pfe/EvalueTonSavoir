import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResultsTableHeader from 'src/components/LiveResults/LiveResultsTable/TableComponents/LiveResultsTableHeader';
 

const mockShowSelectedQuestion = jest.fn();

describe('LiveResultsTableHeader', () => {
    test('renders LiveResultsTableHeader component', () => {
        render(
            <LiveResultsTableHeader
                maxQuestions={5}
                showSelectedQuestion={mockShowSelectedQuestion}
            />
        );

        expect(screen.getByText("Nom d'utilisateur")).toBeInTheDocument();
        for (let i = 1; i <= 5; i++) {
            expect(screen.getByText(`Q${i}`)).toBeInTheDocument();
        }
        expect(screen.getByText('% réussite')).toBeInTheDocument();
    });

    test('calls showSelectedQuestion when a question header is clicked', () => {
        render(
            <LiveResultsTableHeader
                maxQuestions={5}
                showSelectedQuestion={mockShowSelectedQuestion}
            />
        );

        const questionHeader = screen.getByText('Q1');
        fireEvent.click(questionHeader);

        expect(mockShowSelectedQuestion).toHaveBeenCalledWith(0);
    });

    test('renders the correct number of question headers', () => {
        render(
            <LiveResultsTableHeader
                maxQuestions={3}
                showSelectedQuestion={mockShowSelectedQuestion}
            />
        );

        for (let i = 1; i <= 3; i++) {
            expect(screen.getByText(`Q${i}`)).toBeInTheDocument();
        }
    });
});