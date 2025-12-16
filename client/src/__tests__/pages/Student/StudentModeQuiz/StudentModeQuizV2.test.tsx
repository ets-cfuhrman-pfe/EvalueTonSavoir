import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentModeQuizV2 from 'src/components/StudentModeQuiz/StudentModeQuizV2';
import { QuestionType } from 'src/Types/QuestionType';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';

describe('StudentModeQuizV2 feedback toggle', () => {
  const makeMultipleChoiceQuestion = (withFeedback: boolean) => {
    const baseQuestion: any = {
      id: '1',
      type: 'MC',
      formattedStem: '<p>Question avec feedback</p>',
      choices: [
        {
          formattedText: { text: 'Choix A' },
          isCorrect: true,
          ...(withFeedback ? { formattedFeedback: '<p>Feedback A</p>' } : {}),
        },
        {
          formattedText: { text: 'Choix B' },
          isCorrect: false,
          ...(withFeedback ? { formattedFeedback: '<p>Feedback B</p>' } : {}),
        },
      ],
      ...(withFeedback ? { formattedGlobalFeedback: '<p>Feedback global</p>' } : {}),
    };

    return { question: baseQuestion } as QuestionType;
  };

  const answered: AnswerSubmissionToBackendType[] = [
    {
      roomName: 'room-1',
      answer: ['Choix A'],
    } as AnswerSubmissionToBackendType,
  ];

  const renderQuiz = (questions: QuestionType[], answers: AnswerSubmissionToBackendType[], props: Partial<React.ComponentProps<typeof StudentModeQuizV2>> = {}) => {
    return render(
      <StudentModeQuizV2
        questions={questions}
        answers={answers}
        submitAnswer={jest.fn()}
        disconnectWebSocket={jest.fn()}
        {...props}
      />
    );
  };

  it('starts hidden, then shows and hides feedback on toggle', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    renderQuiz(questions, answered);

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
    // No answers and quiz not completed -> should not show toggle
    renderQuiz(questions, [{} as AnswerSubmissionToBackendType]);

    expect(screen.queryByRole('button', { name: /rétroactions/i })).not.toBeInTheDocument();
  });

  it('shows toggle when quiz is marked completed even without answers', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(true)];
    renderQuiz(questions, [{} as AnswerSubmissionToBackendType], { quizCompleted: true });

    expect(screen.getByRole('button', { name: /afficher rétroactions/i })).toBeInTheDocument();
  });

  it('hides toggle entirely when question has no feedback', () => {
    const questions: QuestionType[] = [makeMultipleChoiceQuestion(false)];
    renderQuiz(questions, answered);

    expect(screen.queryByRole('button', { name: /rétroactions/i })).not.toBeInTheDocument();
  });
});
