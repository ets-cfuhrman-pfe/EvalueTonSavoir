let quizzes = []; // This will act as our in-memory database

class Quiz {
    constructor(students, questionnaire) {
        this.id = Quiz.generateId();
        this.students = students;
        this.questionnaire = questionnaire;
    }

    static generateId() {
        return quizzes.length ? quizzes[quizzes.length - 1].id + 1 : 1;
    }

    static create(students, questionnaire) {
        const quiz = new Quiz(students, questionnaire);
        quizzes.push(quiz);
        return quiz;
    }

    static get(id) {
        return quizzes.find(quiz => quiz.id === id);
    }

    static getAll() {
        return quizzes;
    }

    static delete(id) {
        const index = quizzes.findIndex(quiz => quiz.id === id);
        if (index !== -1) {
            return quizzes.splice(index, 1)[0];
        }
        return null;
    }
}

module.exports = Quiz;