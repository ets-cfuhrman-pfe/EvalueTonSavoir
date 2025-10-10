import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResultsV2 from 'src/components/LiveResults/LiveResultsV2';
import { QuestionType } from 'src/Types/QuestionType';
import { Student, Answer } from 'src/Types/StudentType';
import { Socket } from 'socket.io-client';
import { BaseQuestion, parse } from 'gift-pegjs';

const mockSocket: Socket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
} as unknown as Socket;

const mockGiftQuestions = parse(
    `::Sample Question 1:: Question stem
    {
        =Choice 1
        =Choice 2
        ~Choice 3
        ~Choice 4
    }

    ::Sample Question 2:: Question stem {TRUE}
    `);

const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
    if (question.type !== "Category")
        question.id = (index + 1).toString();
    const newMockQuestion = question;
    return { question: newMockQuestion as BaseQuestion };
});

const mockStudents: Student[] = [
    new Student('Connected Student', '1', 'TestRoom', [
        new Answer(['Choice 1'], true, 1),
        new Answer([true], true, 2)
    ], true),
    new Student('Disconnected Student', '2', 'TestRoom', [
        new Answer(['Choice 2'], false, 1),
        new Answer([false], false, 2)
    ], false),
    new Student('Another Connected Student', '3', 'TestRoom', [
        new Answer(['Choice 1'], true, 1),
        new Answer([true], true, 2)
    ], true)
];

const mockShowSelectedQuestion = jest.fn();

// ... rest of file unchanged ...