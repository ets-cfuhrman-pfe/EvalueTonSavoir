import { Student } from '../Types/StudentType';

type AnswerOption = string | number | boolean;

export interface AnswerStatistics {
    [answerText: string]: {
        count: number;
        percentage: number;
    };
}

/**
 * Calculates answer statistics for a specific question
 * @param students Array of students with their answers
 * @param questionId The ID of the question to analyze
 * @returns Object containing count and percentage for each answer option
 */
export const calculateAnswerStatistics = (
    students: Student[],
    questionId: number
): AnswerStatistics => {
    const statistics: AnswerStatistics = {};
    
    // Get all students who answered this question
    const studentsWhoAnswered = students.filter(student =>
        student.answers.some(answer => answer.idQuestion === questionId)
    );
    
    const totalStudents = studentsWhoAnswered.length;
    
    if (totalStudents === 0) {
        return statistics;
    }
    
    // Count answers for each option
    studentsWhoAnswered.forEach(student => {
        const studentAnswer = student.answers.find(answer => answer.idQuestion === questionId);
        if (studentAnswer && studentAnswer.answer) {
            // Handle different answer types
            if (Array.isArray(studentAnswer.answer)) {
                // Multiple choice - can have multiple selections
                studentAnswer.answer.forEach((answerOption: AnswerOption) => {
                    const answerText = String(answerOption);
                    if (!statistics[answerText]) {
                        statistics[answerText] = { count: 0, percentage: 0 };
                    }
                    statistics[answerText].count++;
                });
            } else {
                // Single answer (True/False, Short Answer, etc.)
                const answerText = String(studentAnswer.answer);
                if (!statistics[answerText]) {
                    statistics[answerText] = { count: 0, percentage: 0 };
                }
                statistics[answerText].count++;
            }
        }
    });
    
    // Calculate percentages
    Object.keys(statistics).forEach(answerText => {
        statistics[answerText].percentage = Math.round(
            (statistics[answerText].count / totalStudents) * 100
        );
    });
    
    return statistics;
};

/**
 * Gets the percentage for a specific answer option
 * @param statistics The answer statistics object
 * @param answerText The answer text to look for
 * @returns The percentage (0-100) or 0 if not found
 */
export const getAnswerPercentage = (
    statistics: AnswerStatistics,
    answerText: string
): number => {
    return statistics[answerText]?.percentage || 0;
};

/**
 * Gets the count for a specific answer option
 * @param statistics The answer statistics object
 * @param answerText The answer text to look for
 * @returns The count of students who selected this answer
 */
export const getAnswerCount = (
    statistics: AnswerStatistics,
    answerText: string
): number => {
    return statistics[answerText]?.count || 0;
};

/**
 * Gets the total number of students who answered a specific question
 * @param students Array of students with their answers
 * @param questionId The ID of the question to analyze
 * @returns Total number of students who provided an answer for this question
 */
export const getTotalStudentsWhoAnswered = (
    students: Student[],
    questionId: number
): number => {
    return students.filter(student =>
        student.answers.some(answer => answer.idQuestion === questionId)
    ).length;
};