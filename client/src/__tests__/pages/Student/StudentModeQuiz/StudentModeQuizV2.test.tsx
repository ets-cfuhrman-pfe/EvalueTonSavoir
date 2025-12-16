import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentModeQuizV2 from 'src/components/StudentModeQuiz/StudentModeQuizV2';
import { QuestionType } from 'src/Types/QuestionType';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { MemoryRouter } from 'react-router-dom';

describe('StudentModeQuizV2 feedback toggle', () => {
  const makeMultipleChoiceQuestion = (withFeedback: boolean) => {
    const baseQuestion: any = {
      id: '1',
      type: 'MC',
      formattedStem: { text: 'Question avec feedback', format: 'html' },
      choices: [
        {
          formattedText: { text: 'Choix A', format: 'html' },
          isCorrect: true,
          ...(withFeedback ? { formattedFeedback: { text: 'Feedback A', format: 'html' } } : {}),
        },
        {
          formattedText: { text: 'Choix B', format: 'html' },
          isCorrect: false,
          ...(withFeedback ? { formattedFeedback: { text: 'Feedback B', format: 'html' } } : {}),
        },
      ],
      ...(withFeedback ? { formattedGlobalFeedback: { text: 'Feedback global', format: 'html' } } : {}),
    };

    return { question: baseQuestion } as QuestionType;
  };

  const answered: AnswerSubmissionToBackendType[] = [
    {
      roomName: 'room-1',
      answer: ['Choix A'],
    } as AnswerSubmissionToBackendType,
  ];

  // Prevent auto-opening the results dialog by passing an extra unanswered slot
  const answeredWithPlaceholder = [
    ...answered,
    {
        roomName: 'room-1',
        username: 'placeholder-user',
        idQuestion: 2,
        answer: undefined,
    } as unknown as AnswerSubmissionToBackendType,
  ];

  const makeAnswersWithPlaceholder = (selected: string[] | undefined) => ([
    {
      roomName: 'room-1',
      username: 'student-user',
      idQuestion: 1,
      answer: selected,
    } as unknown as AnswerSubmissionToBackendType,
    {
      roomName: 'room-1',
      username: 'placeholder-user',
      idQuestion: 2,
      answer: undefined,
    } as unknown as AnswerSubmissionToBackendType,
  ]);

  const makeNumericalQuestion = () => ({
    question: {
      id: '1',
      type: 'Numerical',
      formattedStem: { text: 'Combien font 2+2 ?', format: 'html' },
      choices: [{ number: 4, grade: 100 }],
    },
  } as unknown as QuestionType);

  const makeShortQuestion = () => ({
    question: {
      id: '1',
      type: 'Short',
      formattedStem: { text: 'Mot magique ?', format: 'html' },
      choices: [{ text: 'merci', grade: 100 }],
    },
  } as unknown as QuestionType);

  const closeResultsDialogIfOpen = () => {
    const closeButton = screen.queryByRole('button', { name: /fermer/i });
    if (closeButton) {
      fireEvent.click(closeButton);
    }
  };

  const renderQuiz = (questions: QuestionType[], answers: AnswerSubmissionToBackendType[], props: Partial<React.ComponentProps<typeof StudentModeQuizV2>> = {}) => {
    return render(
      <MemoryRouter>
        <StudentModeQuizV2
          questions={questions}
          answers={answers}
          submitAnswer={jest.fn()}
          disconnectWebSocket={jest.fn()}
          {...props}
        />
      </MemoryRouter>
    );
  };

  it('starts hidden, then shows and hides feedback on toggle', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    renderQuiz(questions, answeredWithPlaceholder);

    // Ensure the quiz results modal does not hide the feedback toggle
    closeResultsDialogIfOpen();

    const toggleButton = screen.getByRole('button', { name: /afficher rétroactions/i });
    expect(toggleButton).toBeInTheDocument();

    // Hidden by default
    expect(screen.queryByText('Feedback A')).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText('Feedback A')).toBeInTheDocument();
    expect(screen.getByText('Feedback global')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masquer rétroactions/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /masquer rétroactions/i }));
    expect(screen.queryByText('Feedback A')).not.toBeInTheDocument();
    expect(screen.queryByText('Feedback global')).not.toBeInTheDocument();
  });

  it('does not show toggle when no answer submitted and quiz not completed', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    // No answers and quiz not completed
    renderQuiz(questions, [{} as AnswerSubmissionToBackendType]);

    expect(screen.queryByRole('button', { name: /rétroactions/i })).not.toBeInTheDocument();
  });

  it('shows correctness banner when answer is correct', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    renderQuiz(questions, makeAnswersWithPlaceholder(['Choix A']));

    closeResultsDialogIfOpen();

    expect(screen.getByText('Réponse correcte')).toBeInTheDocument();
  });

  it('shows correctness banner when answer is incorrect', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    renderQuiz(questions, makeAnswersWithPlaceholder(['Choix B']));

    closeResultsDialogIfOpen();

    expect(screen.getByText('Réponse incorrecte')).toBeInTheDocument();
  });

  it('shows feedback for numerical answers without needing a toggle', () => {
    const questions: QuestionType[] = [makeNumericalQuestion()];
    renderQuiz(questions, makeAnswersWithPlaceholder([4 as unknown as number]));

    closeResultsDialogIfOpen();

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText(/Bonne réponse/)).toBeInTheDocument();
  });

  it('shows feedback for short answers without needing a toggle', () => {
    const questions: QuestionType[] = [makeShortQuestion()];
    renderQuiz(questions, makeAnswersWithPlaceholder(['merci']));

    closeResultsDialogIfOpen();

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText(/Bonne réponse/)).toBeInTheDocument();
  });

  it('shows toggle when quiz is marked completed even without answers', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    renderQuiz(questions, [{} as AnswerSubmissionToBackendType], { quizCompleted: true });

    // Close the auto-shown results modal to reveal the toggle in the main view
    closeResultsDialogIfOpen();

    expect(screen.getByRole('button', { name: /afficher rétroactions/i })).toBeInTheDocument();
  });

  it('hides toggle entirely when question has no feedback', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(false)];
    renderQuiz(questions, answered);

    expect(screen.queryByRole('button', { name: /rétroactions/i })).not.toBeInTheDocument();
  });
});
